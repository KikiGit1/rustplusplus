module.exports = {
    discord: {
        token: process.env.RPP_DISCORD_TOKEN,
        clientId: process.env.RPP_DISCORD_CLIENT_ID,
        guildId: process.env.RPP_GUILD_ID // Optional but helpful
    },
    general: {
        language: 'en',
        pollingIntervalMs: 10000
    }