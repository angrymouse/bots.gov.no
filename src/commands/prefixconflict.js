const Discord = require("discord.js"); 

module.exports = {
    name: "prefix",
    aliases: ["p"],
    run: async (client, message, args) => {
 //let userr = message.guild.member(message.mentions.users.first() || message.guild.members.cache.find(m => m.user.username == args[0] || m.id == args[0]))
 if(!message.member.permissions.has("ADMINISTRATOR")) return message.channel.send('У вас нет определенных прав. Обратитесь к администратору.')
 switch (args[0]) {
    case "add":
        let user = message.guild.member(message.mentions.users.first() || message.guild.members.cache.find(m => m.user.username == args[0] || m.id == args[0]))
        if(!user) return message.reply('Вы не указали пользователя')
        if(!message.member.permissions.has("ADMINISTRATOR")) return message.channel.send('У вас нет определенных прав. Обратитесь к администратору.')
        user.member.roles.add('781026350328053790');
break;
case "remove":
        let userr = message.guild.member(message.mentions.users.first() || message.guild.members.cache.find(m => m.user.username == args[0] || m.id == args[0]))
        if(!userr) return message.reply('Вы не указали пользователя')
        if(!message.member.permissions.has("ADMINISTRATOR")) return message.channel.send('У вас нет определенных прав. Обратитесь к администратору.')
        userr.member.roles.remove('781026350328053790');
break;
    default:
        embed = new Discord.MessageEmbed()
        .setColor("#7289DA")
        .setTitle("Роль");

    return message.channel.send(embed);
        break;
}   
}
}
