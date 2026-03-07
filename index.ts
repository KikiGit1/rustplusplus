const http = require('http');
// The (: any) stops the TypeScript compiler from crashing on Render
http.createServer((req: any, res: any) => {
  res.write("Rust++ Online");
  res.end();
}).listen(process.env.PORT || 10000);

require('dotenv').config();
const Discord = require('discord.js');

// These "Shims" are the only way to make the original code work on modern servers
// They rename the new v14 names back to what the bot expects (v13 names)
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

// Create folders the bot expects
['logs', 'instances', 'credentials', 'maps'].forEach(dir => {
    if (!Fs.existsSync(Path.join(__dirname, dir))) Fs.mkdirSync(Path.join(__dirname, dir));
});

client.build();

process.on('unhandledRejection', (error: any) => console.log(error));
exports.client = client;