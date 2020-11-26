module.exports.handleAdd = (client, { id, prefix, description: { short, long }, website, support, invite, tags }, user) => {
    const { MessageEmbed } = require('discord.js');
    return new Promise(async (resolve, reject) => {
        let bot = null;
        try {
            bot = await client.users.fetch(id) || null;
        } catch(e) {
            return reject("INVALID_BOT");
        }

        if(!bot.bot) return reject("NOT_BOT");

        const Guild = client.guilds.cache.get(client.config.guilds.main) || null;
    
        let Owner = null;
        try {
            Owner = await Guild.members.fetch(user.id);
        } catch(e) {
            return reject("OWNER_NOT_IN_MAIN");
        }
        if(!Owner) return reject("OWNER_NOT_IN_MAIN");

        let isBotInMain = null;
        try {
            isBotInMain = await Guild.members.fetch(id) || null;
        } catch(e) {}
        if(isBotInMain) return reject("BOT_ALREAY_IN_MAIN");

        const TestingGuild = client.guilds.cache.get(client.config.guilds.testing) || null;
        let isBotInTesting = null;
        try {
            isBotInTesting = await TestingGuild.members.fetch(id) || null;
        } catch(e) {}

        await client.database.Bots.create({
            botID: id,
            prefix,
            ownerID: user.id,
            customInvite: invite,
            shortDesc: short,
            longDesc: long,
            botTags: tags,
            botServer: support,
            botWebsite: website,
            submittedOn: `${Date.now()}`,
            inTesting: isBotInTesting ? true : false
        })
        .then(() => {
            const Logs = Guild.channels.cache.get(client.config.channels.logs) || null;
            Logs.send(` <@${user.id}> добавил **${bot.username}#${bot.discriminator}** в очередь.`);
            resolve();
        })
        .catch(e => {
            if(e && e.parent && e.parent.code === "SQLITE_CONSTRAINT") return reject("SQLITE_CONSTRAINT");
            else return reject("INTERNAL_DB_ERROR");
        });
    });
}

module.exports.handleEdit = (client, botID, { prefix, description: { short, long }, website, support, invite, tags }, user) => {
    return new Promise(async (resolve, reject) => {
        let bot = null;
        try {
            bot = await client.users.fetch(botID) || null;
        } catch(e) {
            return reject("INVALID_BOT");
        }

        const Guild = client.guilds.cache.get(client.config.guilds.main) || null;

        await client.database.Bots.update({
            prefix,
            customInvite: invite,
            shortDesc: short,
            longDesc: long,
            botTags: tags,
            botServer: support,
            botWebsite: website
        }, { where: { botID } })
        .then(() => {
            const Logs = Guild.channels.cache.get(client.config.channels.logs) || null;
            Logs.send(`<@${user.id}> отредактировал **${bot.username}#${bot.discriminator}**.`);
            resolve();
        })
        .catch((e) => {
            console.error(e)
            reject("INTERNAL_DB_ERROR");
        });
    });
}

module.exports.handleDelete = (client, botID, user) => {
    return new Promise(async (resolve, reject) => {
        const Guild = client.guilds.cache.get(client.config.guilds.main) || null;
    
        let bot = null;
        try {
            bot = await Guild.members.fetch(botID) || null;
        } catch(e) {}

        if(bot) bot.kick("Владелец удалил бота").catch(() => {});
    
        client.database.Bots.destroy({ where: { botID } })
        .then(() => {
            const Logs = Guild.channels.cache.get(client.config.channels.logs) || null;
            Logs.send(`<@${user.id}> удалил ${bot ? `**${bot.user.username}#${bot.user.discriminator}**` : `<@${botID}>`}.`);
            resolve();
        })
        .catch(() => reject());
    });
}

module.exports.handleTest = (client, tester, botID) => {
    return new Promise(async (resolve, reject) => {
        const Guild = client.guilds.cache.get(client.config.guilds.main) || null;
        const Logs = Guild.channels.cache.get(client.config.channels.logs) || null;
        const botDB = await client.database.Bots.findOne({ where: { botID } });
        if(!botDB || !botDB.dataValues) resolve();
        const Bot = await client.users.fetch(botID) || null;
        if(!Bot) {
            await client.database.Bots.destroy({ where: { botID } });
            resolve();
        }
        const Owner = await Guild.members.fetch(botDB.dataValues.ownerID) || null;
        if(!Owner) {
            await client.database.Bots.destroy({ where: { botID } });
            Logs.send(`**${Bot.username}#${Bot.discriminator}**, <@${botDB.dataValues.ownerID}> Удалил бота из очереди.\n**Причина:** Владелец вышел в сервера.`);
            resolve();
        }
        await client.database.Bots.update({ testedBy: `${tester}` }, { where: { botID: `${botID}` } });
        const Tester = await Guild.members.fetch(tester) || null;
        if(!Tester) resolve();
        Logs.send(`**${Bot.username}#${Bot.discriminator}**, <@${botDB.dataValues.ownerID}>, начал тестироватся **${Tester.user.username}#${Tester.user.discriminator}**.`);
        resolve();
    });
}

module.exports.handleDeny = (client, tester, botID, reason) => {
    return new Promise(async (resolve, reject) => {
        const Guild = client.guilds.cache.get(client.config.guilds.main) || null;
        const Logs = Guild.channels.cache.get(client.config.channels.logs) || null;
        const botDB = await client.database.Bots.findOne({ where: { botID } });
        if(!botDB || !botDB.dataValues) resolve();
        await client.database.Bots.destroy({ where: { botID } });
        const Bot = await client.users.fetch(botID) || null;
        if(!Bot) resolve();
        const Owner = await Guild.members.fetch(botDB.dataValues.ownerID) || null;
        if(!Owner) {
            Logs.send(`**${Bot.username}#${Bot.discriminator}**, <@${botDB.dataValues.ownerID}> Удалил бота из очереди.\n**Причина:** Владелец вышел в сервера.`);
            resolve();
        }
        const Tester = await Guild.members.fetch(tester) || null;
        if(!Tester) resolve();
        Logs.send(`**${Bot.username}#${Bot.discriminator}**, <@${botDB.dataValues.ownerID}> был отклонен **${Tester.user.username}#${Tester.user.discriminator}**.\n**Причина:** ${reason}`);
        resolve();
    });
}

module.exports.autoDelete = (client, botID, reason) => {
    return new Promise(async (resolve, reject) => {
        const Bot = await client.users.fetch(botID) || null;
        const botDB = await client.database.Bots.findOne({ where: { botID } }) || null;
        if(!botDB || !botDB.dataValues) resolve();
                Logs.send(` ${Bot ? `**${Bot.username}#${Bot.discriminator}**` : `<@${botID}>`}, <@${botDB.dataValues.ownerID}> \n**Причина:** ${reason || "Ее нет"}`);
        resolve();
    });
}
