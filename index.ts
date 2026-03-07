const http = require('http');
const port = process.env.PORT || 10000; 

// 1. Keep-alive server for Render
http.createServer((req, res) => {
  res.write("Bot is alive!");
  res.end();
}).listen(port, () => {
  console.log(`Keep-alive server listening on port ${port}`);
});

require('dotenv').config();
const Discord = require('discord.js');

// 2. Compatibility Shims (Fixes Button and Intent errors)
Discord.ButtonStyle = { Primary: 1, Secondary: 2, Success: 3, Danger: 4, Link: 5 };
Discord.ComponentType = { ActionRow: 1, Button: 2, StringSelect: 3 };
Discord.GatewayIntentBits = { Guilds: 1, GuildMessages: 32768, MessageContent: 512, GuildMembers: 2, GuildVoiceStates: 128 };
Discord.ActionRowBuilder = Discord.ActionRowBuilder || Discord.MessageActionRow;
Discord.ButtonBuilder = Discord.ButtonBuilder || Discord.MessageButton;

const Fs = require('fs');
const Path = require('path');
const DiscordBot = require('./src/structures/DiscordBot');

// 3. Folder Setup
const dirs = ['logs', 'instances', 'credentials', 'maps'];
dirs.forEach(dir => {
    const fullPath = Path.join(__dirname, dir);
    if (!Fs.existsSync(fullPath)) Fs.mkdirSync(fullPath);
});

// 4. Client Initialization
const client = new DiscordBot({
    intents: [1, 32768, 512, 2, 128], // Using raw numbers for maximum safety
    retryLimit: 2,
    restRequestTimeout: 60000
});

console.log("Starting build...");
client.build();

process.on('unhandledRejection', error => console.error('Error:', error));
exports.client = client;