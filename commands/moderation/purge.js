module.exports = {
    name: "purge",
    category: "moderation",
    description: "Deletes messages in a text channel or specified number of messages in a text channel.",
    usage: "[COMMAND] OR [COMMAND] + [number of messages]",
    run: async (client, message, args) => {
        if (!message.member.hasPermission("MANAGE_MESSAGES"))
      return message.channel
        .send(
          "Insufficient permissions (requires permission `Manage messages`)"
        )
        .then(msg => {
          msg.delete({ timeout: 30000 });
        });
    const number = args.join(" ");
    if (!number)
      return message.channel
        .send("You haven't specified a number to purge")
        .then(msg => {
          msg.delete({ timeout: 30000 });
        });
    message.channel.bulkDelete(number).catch(console.error);

    }
}
