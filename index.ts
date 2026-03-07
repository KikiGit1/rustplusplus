const http = require('http');
const port = process.env.PORT || 10000; 

// 1. Keep-alive server for Render
http.createServer((req, res) => {
  res.write("Bot is alive!");
  res.end();
}).listen(port, () => {
  console.log(`Keep-alive server listening on port ${port}`);
});

// 2. Load environment variables
require('dotenv').config();

// 3. Import Discord and setup version compatibility shims
const Discord = require('discord.js');

// These shims fix errors in older parts of the bot code
Discord.ButtonStyle = { Primary: 1, Success: 3, Danger: 4, Link: 5, Secondary: 2 };
Discord.ComponentType = { ActionRow: 1, Button: 2, StringSelect: 3 };
Discord.ActionRowBuilder = Discord.ActionRowBuilder || Discord.MessageActionRow;
Discord.ButtonBuilder = Discord.ButtonBuilder || Discord.MessageButton;

const Fs = require('fs');
const Path = require('path');
const DiscordBot = require('./src/structures/DiscordBot');

// 4. Initialize directories
createMissingDirectories();

// 5. Initialize Client with raw intent bits to prevent "Undefined" errors
const client = new DiscordBot({
    intents: [
        1,      // Guilds
        32768,  // GuildMessages
        512,    // MessageContent
        2,      // GuildMembers
        128     // GuildVoiceStates
    ],
    retryLimit: 2,
    restRequestTimeout: 60000,
    disableEveryone: false
});

// 6. Start the bot
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

// 7. Error Handling
process.on('unhandledRejection', error => {
    if (client && client.log) {
        client.log('Error', 'Unhandled Rejection', 'error');
    }
    console.error('Unhandled Rejection:', error);
});

exports.client = client;