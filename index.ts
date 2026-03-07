const http = require('http');
const port = process.env.PORT || 10000; 

http.createServer((req, res) => {
  res.write("Bot is running Slash Commands!");
  res.end();
}).listen(port, () => console.log(`Live on port ${port}`));

require('dotenv').config();
const Discord = require('discord.js');

// v14 Shims
Discord.MessageEmbed = Discord.EmbedBuilder || Discord.MessageEmbed;
Discord.ActionRowBuilder = Discord.ActionRowBuilder || Discord.MessageActionRow;
Discord.ButtonBuilder = Discord.ButtonBuilder || Discord.MessageButton;

const DiscordBot = require('./src/structures/DiscordBot');

const client = new DiscordBot({
    intents: [1, 32768, 512, 2, 128, 4096] 
});

// --- THE SLASH COMMAND HANDLER ---
client.on('interactionCreate', async (interaction) => {
    // 1. Handle Slash Commands ( /command )
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            console.log(`[SLASH] Executing /${interaction.commandName}`);
            // Most Rust++ bots expect (client, interaction) for slash commands
            await command.execute(client, interaction);
        } catch (error) {
            console.error(`[ERROR] Slash Command ${interaction.commandName} failed:`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Error executing command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Error executing command!', ephemeral: true });
            }
        }
    }

    // 2. Handle Buttons and Select Menus (Settings)
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
        console.log(`[INTERACTION] Triggered: ${interaction.customId}`);
        const event = client.events.get('interactionCreate');
        if (event) {
            event.execute(client, interaction);
        }
    }
});

// Keep the old prefix listener just as a backup
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (command) {
        try {
            client.logInteraction(commandName, message);
            await command.execute(client, message, args);
        } catch (e) { console.log("Prefix command failed, likely a Slash-only command."); }
    }
});

client.build();