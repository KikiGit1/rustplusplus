const { Client, Collection, GatewayIntentBits } = require('discord.js');
const Fs = require('fs');
const Path = require('path');
const { Intl } = require('./Intl');

class DiscordBot extends Client {
    constructor(options) {
        super(options);

        this.commands = new Collection();
        this.events = new Collection();
        this.instances = new Collection();
        this.activeRustplusInstances = {};
        this.intl = new Intl();

        // Load config - looking for environment variables first
        this.config = {
            token: process.env.RPP_DISCORD_TOKEN,
            clientId: process.env.RPP_DISCORD_CLIENT_ID,
            prefix: process.env.RPP_PREFIX || '!'
        };
    }

    async build() {
        this.loadCommands();
        this.loadEvents();
        this.loadDiscordEvents();
        
        if (!this.config.token) {
            console.error("ERROR: RPP_DISCORD_TOKEN is missing from Environment Variables!");
            return;
        }

        try {
            await this.login(this.config.token);
            console.log("Bot login attempt initiated...");
        } catch (error) {
            console.error("Login failed:", error);
        }
    }

    loadCommands() {
        const commandFiles = Fs.readdirSync(Path.join(__dirname, '../commands')).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            this.commands.set(command.data.name, command);
        }
    }

    loadEvents() {
        const eventFiles = Fs.readdirSync(Path.join(__dirname, '../events')).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
        for (const file of eventFiles) {
            const event = require(`../events/${file}`);
            if (event.once) {
                this.once(event.name, (...args) => event.execute(this, ...args));
            } else {
                this.on(event.name, (...args) => event.execute(this, ...args));
            }
        }
    }

    /**
     * This is where your crash was happening. 
     * We've added a check to see if this.rest.on exists.
     */
    loadDiscordEvents() {
        // v13 uses this.rest.on, v14 does not.
        if (this.rest && typeof this.rest.on === 'function') {
            const eventFiles = Fs.readdirSync(Path.join(__dirname, '../discordEvents')).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
            for (const file of eventFiles) {
                const event = require(`../discordEvents/${file}`);
                this.rest.on(event.name, (...args) => event.execute(this, ...args));
            }
            console.log("Legacy Discord REST events loaded.");
        } else {
            console.log("Skipping legacy REST events (Running in Discord.js v14 mode).");
        }
    }

    // Helper to get instance for a guild
    getInstance(guildId) {
        return this.instances.get(guildId);
    }

    // Localization helper
    intlGet(guildId, key, variables) {
        return this.intl.get(guildId, key, variables);
    }

    log(title, message, type = 'info') {
        const timestamp = new Date().toLocaleString();
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${title}: ${message}`);
    }
}

module.exports = DiscordBot;