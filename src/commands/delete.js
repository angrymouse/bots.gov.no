const Discord = require("discord.js");

module.exports = {
    name: "deletebot",
    aliases: ["del"],
    run: async (client, message, args) => {
            message.channel.send(`https://top-bots.top/${args}/delete`);
    }
}
