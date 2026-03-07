const http = require('http');
const port = process.env.PORT || 10000; 

// 1. Keep-alive server (Must be first for Render)
http.createServer((req, res) => {
  res.write("Bot is alive!");
  res.end();
}).listen(port, () => {
  console.log(`Keep-alive server listening on port ${port}`);
});

// 2. Load environment variables
require('dotenv').config();

// 3. Import Discord and Apply "v14 to v13" Compatibility Shims
const Discord = require('discord.js');

// Fixes for Button and Component naming changes
Discord.ButtonStyle = { Primary: 1, Secondary: 2, Success: 3, Danger: 4, Link: 5 };
Discord.ComponentType = { ActionRow: 1, Button: 2, StringSelect: 3 };

// Fixes for Intent naming changes (using raw bitwise numbers)
Discord.GatewayIntentBits = { 
    Guilds: 1, 
    GuildMessages: 32768, 
    MessageContent: 512, 
    GuildMembers: 2, 
    GuildVoiceStates: 128 
};

// Fixes for Builder naming changes
Discord.ActionRowBuilder = Discord.ActionRowBuilder || Discord.MessageActionRow;
Discord.ButtonBuilder = Discord.ButtonBuilder || Discord.MessageButton;

const Fs = require('fs');
const Path = require('path');
const DiscordBot = require('./src/structures/DiscordBot');

// 4. Initialize directories
createMissingDirectories();

// 5. Create the client
const client = new DiscordBot({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildVoiceStates
    ],
    retryLimit: 2,
    restRequestTimeout: 60000,
    disableEveryone: false
});

// 6. Start the bot
console.log("Starting DiscordBot build process...");
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
    console.error('Unhandled Rejection:', error);
});

exports.client = client;