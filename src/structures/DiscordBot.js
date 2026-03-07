const { Client, Collection } = require('discord.js');
const Fs = require('fs');
const Path = require('path');

// Safe Intl Import
let IntlModule;
try {
    IntlModule = require('./intl').Intl || require('./intl');
} catch (e) {
    try {
        IntlModule = require('./Intl').Intl || require('./Intl');
    } catch (e2) {
        IntlModule = class { get() { return "Translation Missing"; } };
    }
}

class DiscordBot extends Client {
    constructor(options) {
        super(options);
        this.commands = new Collection();
        this.events = new Collection();
        this.instances = new Collection();
        this.activeRustplusInstances = {};
        this.intl = new IntlModule();
        this.config = {
            token: process.env.RPP_DISCORD_TOKEN,
            clientId: process.env.RPP_DISCORD_CLIENT_ID
        };
    }

    async build() {
        this.loadCommands();
        this.loadEvents();
        this.loadDiscordEvents();
        
        if (!this.config.token) {
            console.error("CRITICAL: Token missing in Render Environment!");
            return;
        }

        try {
            await this.login(this.config.token);
            console.log("SUCCESS: Bot logged into Discord.");
        } catch (err) {
            console.error("LOGIN FAILED:", err.message);
        }
    }

    loadCommands() {
        const path = Path.join(__dirname, '../commands');
        if (!Fs.existsSync(path)) return;
        Fs.readdirSync(path).filter(f => f.endsWith('.js') || f.endsWith('.ts')).forEach(file => {
            try {
                const cmd = require(`../commands/${file}`);
                const commandName = cmd.data?.name || cmd.name;
                if (commandName) this.commands.set(commandName, cmd);
            } catch (e) { console.error(`Failed to load ${file}`); }
        });
    }

    loadEvents() {
        const path = Path.join(__dirname, '../events');
        if (!Fs.existsSync(path)) return;
        Fs.readdirSync(path).filter(f => f.endsWith('.js') || f.endsWith('.ts')).forEach(file => {
            const ev = require(`../events/${file}`);
            if (ev.once) this.once(ev.name, (...args) => ev.execute(this, ...args));
            else this.on(ev.name, (...args) => ev.execute(this, ...args));
        });
    }

    loadDiscordEvents() {
        if (this.rest && typeof this.rest.on === 'function') {
            const path = Path.join(__dirname, '../discordEvents');
            if (Fs.existsSync(path)) {
                Fs.readdirSync(path).forEach(file => {
                    const ev = require(`../discordEvents/${file}`);
                    this.rest.on(ev.name, (...args) => ev.execute(this, ...args));
                });
            }
        }
    }

    // THE FIX: Adding the missing function the commands are calling
    logInteraction(commandName, message) {
        const user = message.author ? message.author.tag : 'Unknown User';
        console.log(`[USE] ${user} used !${commandName}`);
    }

    getInstance(guildId) { return this.instances.get(guildId); }
    intlGet(guildId, key, vars) { return this.intl.get(guildId, key, vars); }
    log(t, m, type = 'info') { console.log(`[${type.toUpperCase()}] ${t}: ${m}`); }
}

module.exports = DiscordBot;