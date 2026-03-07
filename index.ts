const http = require('http');
const port = process.env.PORT || 10000; 

// The fix: Defining types as 'any' so TypeScript stops complaining
http.createServer((req: any, res: any) => {
  res.write("Bot is alive!");
  res.end();
}).listen(port, () => {
  console.log(`Keep-alive server listening on port ${port}`);
});

const Discord = require('discord.js');
// v14 Shims - Essential for the original command system to function
Discord.MessageEmbed = Discord.EmbedBuilder;
Discord.MessageActionRow = Discord.ActionRowBuilder;
Discord.MessageButton = Discord.ButtonBuilder;
Discord.MessageSelectMenu = Discord.StringSelectMenuBuilder;

const Fs = require('fs');
const Path = require('path');
const DiscordBot = require('./src/structures/DiscordBot');

createMissingDirectories();

const client = new DiscordBot({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildVoiceStates],
    retryLimit: 2,
    restRequestTimeout: 60000
});

client.build();

function createMissingDirectories() {
    const dirs = ['logs', 'instances', 'credentials', 'maps'];
    dirs.forEach(dir => {
        const fullPath = Path.join(__dirname, dir);
        if (!Fs.existsSync(fullPath)) {
            Fs.mkdirSync(fullPath);
        }
    });
}

process.on('unhandledRejection', (error) => {
    console.log(error);
});

exports.client = client;