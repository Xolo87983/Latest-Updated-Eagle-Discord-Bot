//Modules
const { Client, Collection,  } = require("discord.js");
const Discord = require('discord.js');
const client = new Discord.Client({partials: ["MESSAGE", "USER", "REACTION"]});
const config = require("./config.json");
const fs = require("fs");
const enmap = require('enmap');
const Enmap = require("enmap");
const db = require ("db");
//Command Handler
client.commands = new Collection();
client.aliases = new Collection();
client.queue = new Map();
client.config = config;
client.points = new Enmap("points");


//Command Folder location
client.categories = fs.readdirSync("./commands/");

["command"].forEach(handler => {
 require(`./handlers/${handler}`)(client);
});

//Bot Status
client.on("ready", () => {
console.log(`Bot User ${client.user.username} has been logged in and is ready to use!`);
client.user.setActivity('Blaze Craft | &help', { type: 'WATCHING' });
});

client.on("message", async message => {
    //Loads prefix from config.json
    const prefix = (config.prefix);
    //Makes sure bot wont respond to other bots including itself
    if (message.author.bot) return;
    //Checks if the command is from a server and not a dm
    if (!message.guild) return;
    //Checks if the command starts with a prefix
    if (!message.content.startsWith(prefix)) return;
    //Makes sure bot wont respond to other bots including itself
    if (!message.member) message.member = await message.guild.fetchMember(message);

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    
    if (cmd.length === 0) return;
    
    let command = client.commands.get(cmd);
    if (!command) command = client.commands.get(client.aliases.get(cmd));

    if (command) 
        command.run(client, message, args);
});


client.on('ready', () => {
    console.log('ready')
    client.user.setActivity('Eagle Mc | &help', { type: 'WATCHING' });
});

client.on("message", message => {
  // As usual, ignore all bots.
  if (message.author.bot) return;

  // If this is not in a DM, execute the points code.
  if (message.guild) {
    // We'll use the key often enough that simplifying it is worth the trouble.
    const key = `${message.guild.id}-${message.author.id}`;

    // Triggers on new users we haven't seen before.
    client.points.ensure(`${message.guild.id}-${message.author.id}`, {
      user: message.author.id,
      guild: message.guild.id,
      points: 0,
      level: 1
    });

    client.points.inc(key, "points");

    // Calculate the user's current level
    const curLevel = Math.floor(0.1 * Math.sqrt(client.points.get(key, "points")));

    // Act upon level up by sending a message and updating the user's level in enmap.
    if (client.points.get(key, "level") < curLevel) {
      message.reply(`You've leveled up to level **${curLevel}**! Ain't that dandy?`);
      client.points.set(key, curLevel, "level");
    }
  }
  // Rest of message handler
   const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  if (command === "points") {
    const key = `${message.guild.id}-${message.author.id}`;
    return message.channel.send(`You currently have ${client.points.get(key, "points")} points, and are level ${client.points.get(key, "level")}!`);
  }
  
  if(command === "leaderboard") {
  // Get a filtered list (for this guild only), and convert to an array while we're at it.
  const filtered = client.points.filter( p => p.guild === message.guild.id ).array();

  // Sort it to get the top results... well... at the top. Y'know.
  const sorted = filtered.sort((a, b) => b.points - a.points);

  // Slice it, dice it, get the top 10 of it!
  const top10 = sorted.splice(0, 10);

  // Now shake it and show it! (as a nice embed, too!)
  const embed = new Discord.MessageEmbed()
    .setTitle("Leaderboard")
    .setAuthor(client.user.username, message.guild.iconURL())
    .setDescription("Our top 10 points leaders!")
    .setColor(0x00AE86);
  for(const data of top10) {
    try {
      embed.addField(client.users.cache.get(data.user).tag, `${data.points} points (level ${data.level})`);
    } catch {
      embed.addField(`<@${data.user}>`, `${data.points} points (level ${data.level})`);
    }
  }
  return message.channel.send({embed});
}
  
  if(command === "give") {
    // Limited to guild owner - adjust to your own preference!
    if(message.author.id !== message.guild.ownerID) 
      return message.reply("You're not the boss of me, you can't do that!");

    const user = message.mentions.users.first() || client.users.get(args[0]);
    if(!user) return message.reply("You must mention someone or give their ID!");

    const pointsToAdd = parseInt(args[1], 10);
    if(!pointsToAdd) 
      return message.reply("You didn't tell me how many points to give...")

    // Ensure there is a points entry for this user.
    client.points.ensure(`${message.guild.id}-${user.id}`, {
      user: message.author.id,
      guild: message.guild.id,
      points: 0,
      level: 1
    });

    // Get their current points.
    let userPoints = client.points.get(`${message.guild.id}-${user.id}`, "points");
    userPoints += pointsToAdd;


    // And we save it!
    client.points.set(`${message.guild.id}-${user.id}`, userPoints, "points")

    message.channel.send(`${user.tag} has received **${pointsToAdd}** points and now stands at **${userPoints}** points.`);
  }

  if(command === "cleanup") {
    // Let's clean up the database of all "old" users, 
    // and those who haven't been around for... say a month.

    // Get a filtered list (for this guild only).
    const filtered = client.points.filter( p => p.guild === message.guild.id );

    // We then filter it again (ok we could just do this one, but for clarity's sake...)
    // So we get only users that haven't been online for a month, or are no longer in the guild.
    const rightNow = new Date();
    const toRemove = filtered.filter(data => {
      return !message.guild.members.cache.has(data.user) || rightNow - 2592000000 > data.lastSeen;
    });

    toRemove.forEach(data => {
      client.points.delete(`${message.guild.id}-${data.user}`);
    });

    message.channel.send(`I've cleaned up ${toRemove.size} all levels.`);
  }
  
  if (command === "say") {
    const text = args.join(" ");
    if (!text)
      return message.channel
        .send("You have not specified something to say")
        .then(msg => {
          msg.delete({ timeout: 30000 });
        });
    message.channel.send(text);
  }
  
  if (command === "ip") {
    message.channel.send("Survival server - de17.falix.gg:26563")
                                           
  }
  
  if (command === "mc-status") {
    message.channel.send("Server is currently up and playable please use the command '&ip' to check the ip. Thank you")
  }
  
});



//Log into discord using the token in config.json
client.login(config.token);