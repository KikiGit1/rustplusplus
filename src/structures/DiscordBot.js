const FormatJS = require('@formatjs/intl');
const Discord = require('discord.js');
const Fs = require('fs');
const Path = require('path');
const Config = require('../../config');

// Load original structures
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
        
        // Language initialization
        const enPath = Path.join(__dirname, '..', 'languages', 'en.json');
        this.enMessages = JSON.parse(Fs.readFileSync(enPath, 'utf8'));

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
        const path = Path.join(__dirname, '..', 'commands');
        const files = Fs.readdirSync(path).filter(f => f.endsWith('.js'));
        for (const file of files) {
            const cmd = require(`../commands/${file}`);
            const name = (cmd.data && cmd.data.name) ? cmd.data.name : cmd.name;
            if (name) this.commands.set(name, cmd);
        }
    }

    loadDiscordEvents() {
        const path = Path.join(__dirname, '..', 'discordEvents');
        const files = Fs.readdirSync(path).filter(f => f.endsWith('.js'));
        for (const file of files) {
            const ev = require(`../discordEvents/${file}`);
            if (ev.once) this.once(ev.name, (...args) => ev.execute(this, ...args));
            else this.on(ev.name, (...args) => ev.execute(this, ...args));
        }
    }

    loadEnIntl() {
        const path = Path.join(__dirname, '..', 'languages', 'en.json');
        const messages = JSON.parse(Fs.readFileSync(path, 'utf8'));
        this.enIntl = FormatJS.createIntl({ locale: 'en', messages }, FormatJS.createIntlCache());
    }

    loadBotIntl() {
        const lang = Config.general.language || 'en';
        const path = Path.join(__dirname, '..', 'languages', `${lang}.json`);
        const messages = JSON.parse(Fs.readFileSync(path, 'utf8'));
        this.botIntl = FormatJS.createIntl({ locale: lang, messages }, FormatJS.createIntlCache());
    }

    intlGet(guildId, id, vars = {}) {
        let intl = (guildId && this.guildIntl[guildId]) ? this.guildIntl[guildId] : this.botIntl;
        if (!intl) intl = this.enIntl;
        return intl.formatMessage({ id, defaultMessage: this.enMessages[id] || id }, vars);
    }

    // Interaction Handlers (Crucial for buttons and slash commands)
    async interactionReply(interaction, content) {
        try { return await interaction.reply(content); } catch (e) { console.error('Reply Error:', e); }
    }

    async interactionEditReply(interaction, content) {
        try { return await interaction.editReply(content); } catch (e) { console.error('Edit Error:', e); }
    }

    logInteraction(interaction, verifyId, type) {
        console.log(`[${type.toUpperCase()}] User: ${interaction.user.tag} | ID: ${verifyId}`);
    }

    getInstance(guildId) { return this.instances[guildId]; }

    build() {
        this.login(Config.discord.token).then(() => {
            console.log("Bot connection successful.");
        }).catch(err => {
            console.error("Login failed. Check your RPP_DISCORD_TOKEN in Render.", err);
        });
    }

    log(title, text, level = 'info') {
        console.log(`[${level.toUpperCase()}] ${title}: ${text}`);
    }
}

module.exports = DiscordBot;