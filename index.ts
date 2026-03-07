const http = require('http');
const port = process.env.PORT || 10000; 

// 1. Keep-alive server (Crucial for Render)
http.createServer((req, res) => {
  res.write("Bot is alive and listening!");
  res.end();
}).listen(port, () => {
  console.log(`Keep-alive server listening on port ${port}`);
});

require('dotenv').config();
const Discord = require('discord.js');

// 2. Compatibility Shims
Discord.ButtonStyle = { Primary: 1, Secondary: 2, Success: 3, Danger: 4, Link: 5 };
Discord.ComponentType = { ActionRow: 1, Button: 2, StringSelect: 3 };
// Added 4096 (DirectMessages) and 16384 (Interactions) for extra safety
Discord.GatewayIntentBits = { Guilds: 1, GuildMessages: 32768, MessageContent: 512, GuildMembers: 2, GuildVoiceStates: 128, DirectMessages: 4096 };

const Fs = require('fs');
const Path = require('path');
const DiscordBot = require('./src/structures/DiscordBot');

// 3. Setup Folders
['logs', 'instances', 'credentials', 'maps'].forEach(dir => {
    const fullPath = Path.join(__dirname, dir);
    if (!Fs.existsSync(fullPath)) Fs.mkdirSync(fullPath);
});

// 4. Initialize Client with expanded Intents
const client = new DiscordBot({
    intents: [1, 32768, 512, 2, 128, 4096],
    retryLimit: 2,
    restRequestTimeout: 60000
});

// 5. DEBUG LISTENERS (These will tell us if Discord is talking to us)
client.on('ready', () => {
    console.log(`[READY] Logged in as ${client.user.tag}`);
});

// This listener handles "!help", "!map", etc.
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    console.log(`[DEBUG] Message seen: "${message.content}" in channel: ${message.channel.name}`);

    const prefix = process.env.RPP_PREFIX || '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (command) {
        console.log(`[EXECUTE] Running command: ${commandName}`);
        try {
            await command.execute(client, message, args);
        } catch (error) {
            console.error(`[ERROR] Command ${commandName} failed:`, error);
            message.reply("There was an error executing that command.");
        }
    } else {
        console.log(`[DEBUG] Unknown command: ${commandName}`);
    }
});

// This listener handles Button clicks and Select menus
client.on('interactionCreate', async (interaction) => {
    console.log(`[DEBUG] Interaction received: ${interaction.customId || 'Slash Command'}`);
    
    if (interaction.isButton() || interaction.isSelectMenu()) {
        // Find the event handler for interactions if it exists
        const event = client.events.get('interactionCreate');
        if (event) {
            event.execute(client, interaction);
        } else {
            console.log("[DEBUG] No interactionCreate event handler found in /events folder.");
        }
    }
});

// 6. Start the bot
console.log("Starting DiscordBot build process...");
client.build();

process.on('unhandledRejection', error => console.error('CRITICAL ERROR:', error));
exports.client = client;