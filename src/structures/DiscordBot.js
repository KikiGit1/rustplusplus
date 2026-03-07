const { Client, Collection, GatewayIntentBits } = require('discord.js');
const Fs = require('fs');
const Path = require('path');

// Case-sensitive fix for Render/Linux
let Intl;
try {
    Intl = require('./intl').Intl;
} catch (e) {
    Intl = require('./Intl').Intl;
}

class DiscordBot extends Client {
    constructor(options) {
        super(options);

        this.commands = new Collection();
        this.events = new Collection();
        this.instances = new Collection();
        this.activeRustplusInstances = {};
        this.intl = new Intl();
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
        
        await this.login(this.config.token);
    }

    loadCommands() {
        const path = Path.join(__dirname, '../commands');
        const commandFiles = Fs.readdirSync(path).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            // Original repo uses command.data.name
            this.commands.set(command.data.name, command);
        }
    }

    loadEvents() {
        const path = Path.join(__dirname, '../events');
        const eventFiles = Fs.readdirSync(path).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
        for (const file of eventFiles) {
            const event = require(`../events/${file}`);
            if (event.once) {
                this.once(event.name, (...args) => event.execute(this, ...args));
            } else {
                this.on(event.name, (...args) => event.execute(this, ...args));
            }
        }
    }

    loadDiscordEvents() {
        // Fix for v14 rest.on crash
        if (this.rest && typeof this.rest.on === 'function') {
            const path = Path.join(__dirname, '../discordEvents');
            if (Fs.existsSync(path)) {
                const eventFiles = Fs.readdirSync(path).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
                for (const file of eventFiles) {
                    const event = require(`../discordEvents/${file}`);
                    this.rest.on(event.name, (...args) => event.execute(this, ...args));
                }
            }
        }
    }

    // Original Repo Helper Functions
    logInteraction(commandName, interaction) {
        this.log('Interaction', `${interaction.user.tag} used ${commandName}`);
    }

    getInstance(guildId) {
        return this.instances.get(guildId);
    }

    intlGet(guildId, key, variables) {
        return this.intl.get(guildId, key, variables);
    }

    log(title, message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    }
}

module.exports = DiscordBot;