const http = require('http');

// Added types (req: any, res: any) to stop the TypeScript compiler from crashing
http.createServer((req: any, res: any) => {
  res.write("Rust++ Online");
  res.end();
}).listen(process.env.PORT || 10000);

const Discord = require('discord.js');

// Essential v14 Rename Shims
Discord.MessageEmbed = Discord.EmbedBuilder;
Discord.MessageActionRow = Discord.ActionRowBuilder;
Discord.MessageButton = Discord.ButtonBuilder;
Discord.MessageSelectMenu = Discord.StringSelectMenuBuilder;

const Fs = require('fs');
const Path = require('path');
const DiscordBot = require('./src/structures/DiscordBot');

const client = new DiscordBot({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildVoiceStates]
});

client.build();

// Directory logic
['logs', 'instances', 'credentials', 'maps'].forEach(dir => {
    if (!Fs.existsSync(Path.join(__dirname, dir))) Fs.mkdirSync(Path.join(__dirname, dir));
});

process.on('unhandledRejection', (error: any) => console.log(error));
exports.client = client;