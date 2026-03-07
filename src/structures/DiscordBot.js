const FormatJS = require('@formatjs/intl');
const Discord = require('discord.js');
const Fs = require('fs');
const Path = require('path');
const Config = require('../../config');

// Load all the original structures
const Items = require('./Items');
const RustLabs = require('../structures/RustLabs');
const Cctv = require('./Cctv');
const Logger = require('./Logger.js');

class DiscordBot extends Discord.Client {
    constructor(props) {
        super(props);
        this.commands = new Discord.Collection();
        this.instances = {};
        this.guildIntl = {};
        
        // Load original English messages
        this.enMessages = JSON.parse(Fs.readFileSync(Path.join(__dirname, '..', 'languages', 'en.json'), 'utf8'));

        this.items = new Items();
        this.rustlabs = new RustLabs();
        this.cctv = new Cctv();
        this.logger = new Logger(Path.join(__dirname, '..', '..', 'logs/discordBot.log'), 'default');

        this.loadDiscordCommands();
        this.loadDiscordEvents();
        this.loadEnIntl();
        this.loadBotIntl();
    }

    loadDiscordCommands() {
        const files = Fs.readdirSync(Path.join(__dirname, '..', 'commands')).filter(f => f.endsWith('.js'));
        for (const file of files) {
            const cmd = require(`../commands/${file}`);
            this.commands.set(cmd.name || cmd.data.name, cmd);
        }
    }

    loadDiscordEvents() {
        const files = Fs.readdirSync(Path.join(__dirname, '..', 'discordEvents')).filter(f => f.endsWith('.js'));
        for (const file of files) {
            const ev = require(`../discordEvents/${file}`);
            if (ev.once) this.once(ev.name, (...args) => ev.execute(this, ...args));
            else this.on(ev.name, (...args) => ev.execute(this, ...args));
        }
    }

    loadEnIntl() {
        const messages = JSON.parse(Fs.readFileSync(Path.join(__dirname, '..', 'languages', 'en.json'), 'utf8'));
        this.enIntl = FormatJS.createIntl({ locale: 'en', messages }, FormatJS.createIntlCache());
    }

    loadBotIntl() {
        const lang = Config.general.language || 'en';
        const messages = JSON.parse(Fs.readFileSync(Path.join(__dirname, '..', 'languages', `${lang}.json`), 'utf8'));
        this.botIntl = FormatJS.createIntl({ locale: lang, messages }, FormatJS.createIntlCache());
    }

    intlGet(guildId, id, vars = {}) {
        let intl = (guildId && this.guildIntl[guildId]) ? this.guildIntl[guildId] : this.botIntl;
        return intl.formatMessage({ id, defaultMessage: this.enMessages[id] || id }, vars);
    }

    build() { this.login(Config.discord.token); }
    log(title, text, level = 'info') { console.log(`[${level}] ${title}: ${text}`); }
}
module.exports = DiscordBot;