const http = require('http');

// Render Keep-Alive Server
http.createServer((req: any, res: any) => {
  res.write("Rust++ Online");
  res.end();
}).listen(process.env.PORT || 10000);

require('dotenv').config();
const Discord = require('discord.js');

// Discord.js v14 Compatibility Shims
// These map old v13 names to new v14 classes so original files don't break
Discord.MessageEmbed = Discord.EmbedBuilder;
Discord.MessageActionRow = Discord.ActionRowBuilder;
Discord.MessageButton = Discord.ButtonBuilder;
Discord.MessageSelectMenu = Discord.StringSelectMenuBuilder;
Discord.Modal = Discord.ModalBuilder;
Discord.TextInputComponent = Discord.TextInputBuilder;

const Fs = require('fs');
const Path = require('path');
const DiscordBot = require('./src/structures/DiscordBot');

// Original Folder Init
['logs', 'instances', 'credentials', 'maps'].forEach(dir => {
    if (!Fs.existsSync(Path.join(__dirname, dir))) Fs.mkdirSync(Path.join(__dirname, dir));
});

const client = new DiscordBot({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildVoiceStates]
});

client.build();

process.on('unhandledRejection', (error: any) => console.log('Unhandled Rejection:', error));
exports.client = client;