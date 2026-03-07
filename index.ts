const http = require('http');
const port = process.env.PORT || 10000; 

// Render Keep-Alive
http.createServer((req, res) => {
  res.write("Rust++ is running!");
  res.end();
}).listen(port, () => console.log(`Server listening on port ${port}`));

require('dotenv').config();
const Discord = require('discord.js');

// Essential v14 Shims for a v13 codebase
Discord.MessageEmbed = Discord.EmbedBuilder || Discord.MessageEmbed;
Discord.ActionRowBuilder = Discord.ActionRowBuilder || Discord.MessageActionRow;
Discord.ButtonBuilder = Discord.ButtonBuilder || Discord.MessageButton;
Discord.TextInputBuilder = Discord.TextInputBuilder || Discord.MessageActionRow; // Support for modals

const Fs = require('fs');
const Path = require('path');
const DiscordBot = require('./src/structures/DiscordBot');

// Original Folder Init
['logs', 'instances', 'credentials', 'maps'].forEach(dir => {
    const fullPath = Path.join(__dirname, dir);
    if (!Fs.existsSync(fullPath)) Fs.mkdirSync(fullPath);
});

// Initialize with original Intent Bitmask + MessageContent
const client = new DiscordBot({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildVoiceStates
    ]
});

console.log("Building Rust++ Client...");
client.build();

process.on('unhandledRejection', error => console.error('Uncaught Error:', error));
exports.client = client;