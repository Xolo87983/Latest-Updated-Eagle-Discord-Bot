const { MessageEmbed } = require("discord.js");
module.exports = {
  name: "suggest",
  category: "utility",
description: "Suggest something for the server",
usage: "prefix suggest <suggestion>",
run: async (client, message, args) => {
//command
        let suggestion = args.slice(0).join(" ");
        if (!suggestion)
        return message.channel
        .send(`Please provide a suggestion!`)
       .then(msg => {
        msg.delete({ timeout: 30000 });
      });
        let SuggestionChannel = message.guild.channels.cache.find(channel => channel.name === "💎suggestions");
        if (!SuggestionChannel) return message.channel.send("Please create a channel named suggestions before using this command!");
        message.channel 
       .send("Your suggestion has been filled to the staff team. You can check your suggestion score in our suggestion channel")
       .then(msg => {
        msg.delete({ timeout: 30000 });
      });
        const embed = new MessageEmbed()
         .setFooter(client.user.username, client.user.displayAvatarURL)
         .setTimestamp()
        .addField(`New Suggestion from:`, `**${message.author.tag}**`)
        .addField(`Suggestion:`, `${suggestion}\n**Thanks for the suggestion**`)
        .setColor('#ff2052');
         SuggestionChannel.send(embed).then(msg => {
         msg.react("👍🏼")
          msg.react("👎🏼")
        });
 }
}
