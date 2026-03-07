/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)
    Modified for Render Compatibility 2026
*/

// --- RENDER SURVIVAL GEAR ---
const http = require('http');
const port = process.env.PORT || 10000; 
http.createServer((req, res) => {
  res.write("Rust++ Bot is Alive");
  res.end();
}).listen(port);

const Discord = require('discord.js');

// --- DJS V14 SHIMS ---
// This keeps the original command files working without needing to edit them
Discord.MessageEmbed = Discord.EmbedBuilder || Discord.MessageEmbed;
Discord.MessageActionRow = Discord.ActionRowBuilder || Discord.MessageActionRow;
Discord.MessageButton = Discord.ButtonBuilder || Discord.MessageButton;
Discord.MessageSelectMenu = Discord.StringSelectMenuBuilder || Discord.MessageSelectMenu;
// --------------------

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
    // Check if intl is loaded before logging to prevent secondary crashes
    if(client.intl) {
        client.log(client.intlGet(null, 'errorCap'), client.intlGet(null, 'unhandledRejection', {
            error: error
        }), 'error');
    }
    console.log(error);
});

exports.client = client;