const http = require('http');
const port = process.env.PORT || 10000; 

// 1. Keep-alive for Render
http.createServer((req, res) => {
  res.write("Bot is fully operational!");
  res.end();
}).listen(port, () => {
  console.log(`Keep-alive server listening on port ${port}`);
});

require('dotenv').config();
const Discord = require('discord.js');

// 2. Compatibility Shims (The "Glue" between v13 and v14)
Discord.ButtonStyle = { Primary: 1, Secondary: 2, Success: 3, Danger: 4, Link: 5 };
Discord.ComponentType = { ActionRow: 1, Button: 2, StringSelect: 3 };
Discord.GatewayIntentBits = { Guilds: 1, GuildMessages: 32768, MessageContent: 512, GuildMembers: 2, GuildVoiceStates: 128, DirectMessages: 4096 };

// Fix for Embeds (This stops the "MessageEmbed is not a constructor" error)
Discord.MessageEmbed = Discord.EmbedBuilder || Discord.MessageEmbed;
Discord.ActionRowBuilder = Discord.ActionRowBuilder || Discord.MessageActionRow;
Discord.ButtonBuilder = Discord.ButtonBuilder || Discord.MessageButton;

const Fs = require('fs');
const Path = require('path');
const DiscordBot = require('./src/structures/DiscordBot');

// 3. Create Folders
['logs', 'instances', 'credentials', 'maps'].forEach(dir => {
    const fullPath = Path.join(__dirname, dir);
    if (!Fs.existsSync(fullPath)) Fs.mkdirSync(fullPath);
});

// 4. Initialize Client
const client = new DiscordBot({
    intents: [1, 32768, 512, 2, 128, 4096],
    retryLimit: 2,
    restRequestTimeout: 60000
});

// 5. Direct Message/Command Listener
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefix = process.env.RPP_PREFIX || '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (command) {
        try {
            // Log interaction before executing
            client.logInteraction(commandName, message);
            await command.execute(client, message, args);
        } catch (error) {
            console.error(`[ERROR] Command ${commandName} failed:`, error);
            message.reply("There was an error executing that command. Check Render logs.");
        }
    }
});

// 6. Build the Bot
console.log("Starting DiscordBot build process...");
client.build();

process.on('unhandledRejection', error => console.error('CRITICAL:', error));
exports.client = client;