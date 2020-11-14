module.exports = async (client) => {
    client.user.setPresence({ activity: { name: "TopBots", type: "WATCHING" }, status: 'idle' });
    client.logger.log(`Logged in as ${client.user.tag}`);
}