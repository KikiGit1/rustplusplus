// 1. Keep-alive server for Render
const http = require('http');
const port = process.env.PORT || 10000; 

http.createServer((req, res) => {
  res.write("Bot is alive!");
  res.end();
}).listen(port, () => {
  console.log(`Keep-alive server listening on port ${port}`);
});

// 2. Load Environment Variables manually
require('dotenv').config();

/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)
    ... (rest of the license comment)
*/
const Discord = require('discord.js');

// Add these "shimming" lines to fix old code
Discord.ButtonStyle = Discord.ButtonStyle || {
    Primary: 1, Success: 3, Danger: 4, Link: 5, Secondary: 2
};
Discord.ComponentType = Discord.ComponentType || {
    ActionRow: 1, Button: 2, StringSelect: 3, TextInput: 4, UserSelect: 5, RoleSelect: 6, MentionableSelect: 7, ChannelSelect: 8
};

const Discord = require('discord.js');
const Fs = require('fs');
const Path = require('path');

const DiscordBot = require('./src/structures/DiscordBot');

// LOG THE TOKEN (FOR DEBUGGING ONLY - Remove this after it works!)
console.log("DEBUG: Token loaded length:", process.env.RPP_DISCORD_TOKEN ? process.env.RPP_DISCORD_TOKEN.length : "0 (NOT FOUND)");

createMissingDirectories();
// ... rest of your code

const client = new DiscordBot({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildVoiceStates],
    retryLimit: 2,
    restRequestTimeout: 60000,
    disableEveryone: false
});

client.build();

function createMissingDirectories() {
    if (!Fs.existsSync(Path.join(__dirname, 'logs'))) {
        Fs.mkdirSync(Path.join(__dirname, 'logs'));
    }

    if (!Fs.existsSync(Path.join(__dirname, 'instances'))) {
        Fs.mkdirSync(Path.join(__dirname, 'instances'));
    }

    if (!Fs.existsSync(Path.join(__dirname, 'credentials'))) {
        Fs.mkdirSync(Path.join(__dirname, 'credentials'));
    }

    if (!Fs.existsSync(Path.join(__dirname, 'maps'))) {
        Fs.mkdirSync(Path.join(__dirname, 'maps'));
    }
}

process.on('unhandledRejection', error => {
    client.log(client.intlGet(null, 'errorCap'), client.intlGet(null, 'unhandledRejection', {
        error: error
    }), 'error');
    console.log(error);
});

exports.client = client;
