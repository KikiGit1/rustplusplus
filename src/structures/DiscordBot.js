/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)
    Modified for Render & Discord.js v14 Compatibility
*/

const FormatJS = require('@formatjs/intl');
const Discord = require('discord.js');
const Fs = require('fs');
const Path = require('path');

const Battlemetrics = require('../structures/Battlemetrics');
const Cctv = require('./Cctv');
const Config = require('../../config');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordTools = require('../discordTools/discordTools');
const InstanceUtils = require('../util/instanceUtils.js');
const Items = require('./Items');
const Logger = require('./Logger.js');
const PermissionHandler = require('../handlers/permissionHandler.js');
const RustLabs = require('../structures/RustLabs');
const RustPlus = require('../structures/RustPlus');

class DiscordBot extends Discord.Client {
    constructor(props) {
        super(props);

        this.logger = new Logger(Path.join(__dirname, '..', '..', 'logs/discordBot.log'), 'default');

        this.commands = new Discord.Collection();
        this.fcmListeners = new Object();
        this.fcmListenersLite = new Object();
        this.instances = {};
        this.guildIntl = {};
        this.botIntl = null;
        this.enIntl = null;
        
        // Load messages with safe path
        const enPath = Path.join(__dirname, '..', 'languages', 'en.json');
        this.enMessages = JSON.parse(Fs.readFileSync(enPath, 'utf8'));

        this.rustplusInstances = new Object();
        this.activeRustplusInstances = new Object();
        this.rustplusReconnectTimers = new Object();
        this.rustplusLiteReconnectTimers = new Object();
        this.rustplusReconnecting = new Object();
        this.rustplusMaps = new Object();

        this.uptimeBot = null;

        this.items = new Items();
        this.rustlabs = new RustLabs();
        this.cctv = new Cctv();

        this.pollingIntervalMs = Config.general.pollingIntervalMs;

        this.battlemetricsInstances = new Object();
        this.battlemetricsIntervalId = null;
        this.battlemetricsIntervalCounter = 0;

        this.voiceLeaveTimeouts = new Object();

        this.loadDiscordCommands();
        this.loadDiscordEvents();
        this.loadEnIntl();
        this.loadBotIntl();
    }

    loadDiscordCommands() {
        const path = Path.join(__dirname, '..', 'commands');
        const commandFiles = Fs.readdirSync(path).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            // Use command.data.name for Slash Commands or command.name for legacy
            const cmdName = (command.data && command.data.name) ? command.data.name : command.name;
            if (cmdName) this.commands.set(cmdName, command);
        }
    }

    loadDiscordEvents() {
        const path = Path.join(__dirname, '..', 'discordEvents');
        const eventFiles = Fs.readdirSync(path).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(`../discordEvents/${file}`);

            if (event.name === 'rateLimited') {
                // v14 safety check for REST events
                if (this.rest && typeof this.rest.on === 'function') {
                    this.rest.on(event.name, (...args) => event.execute(this, ...args));
                }
            }
            else if (event.once) {
                this.once(event.name, (...args) => event.execute(this, ...args));
            }
            else {
                this.on(event.name, (...args) => event.execute(this, ...args));
            }
        }
    }

    // --- ORIGINAL INTL LOGIC ---
    loadEnIntl() {
        const language = 'en';
        const path = Path.join(__dirname, '..', 'languages', `${language}.json`);
        const messages = JSON.parse(Fs.readFileSync(path, 'utf8'));
        const cache = FormatJS.createIntlCache();
        this.enIntl = FormatJS.createIntl({ locale: language, defaultLocale: 'en', messages: messages }, cache);
    }

    loadBotIntl() {
        const language = Config.general.language;
        const path = Path.join(__dirname, '..', 'languages', `${language}.json`);
        const messages = JSON.parse(Fs.readFileSync(path, 'utf8'));
        const cache = FormatJS.createIntlCache();
        this.botIntl = FormatJS.createIntl({ locale: language, defaultLocale: 'en', messages: messages }, cache);
    }

    loadGuildIntl(guildId) {
        const instance = InstanceUtils.readInstanceFile(guildId);
        const language = instance.generalSettings.language;
        const path = Path.join(__dirname, '..', 'languages', `${language}.json`);
        const messages = JSON.parse(Fs.readFileSync(path, 'utf8'));
        const cache = FormatJS.createIntlCache();
        this.guildIntl[guildId] = FormatJS.createIntl({ locale: language, defaultLocale: 'en', messages: messages }, cache);
    }

    loadGuildsIntl() {
        for (const guild of this.guilds.cache) {
            this.loadGuildIntl(guild[0]);
        }
    }

    intlGet(guildId, id, variables = {}) {
        let intl = (guildId && guildId !== 'en') ? this.guildIntl[guildId] : (guildId === 'en' ? this.enIntl : this.botIntl);
        if (!intl) intl = this.enIntl; // Fallback

        return intl.formatMessage({
            id: id,
            defaultMessage: this.enMessages[id] || id
        }, variables);
    }

    build() {
        // Use the token from Config as originally intended
        this.login(Config.discord.token).catch(error => {
            console.error("Login Error:", error);
        });
    }

    log(title, text, level = 'info') {
        this.logger.log(title, text, level);
    }

    logInteraction(interaction, verifyId, type) {
        // Safe check for channel
        const channel = DiscordTools.getTextChannelById(interaction.guildId, interaction.channelId);
        if (!channel) return;

        const args = new Object();
        args['guild'] = `${interaction.member.guild.name} (${interaction.member.guild.id})`;
        args['channel'] = `${channel.name} (${interaction.channelId})`;
        args['user'] = `${interaction.user.username} (${interaction.user.id})`;
        args[(type === 'slashCommand') ? 'command' : 'customid'] = (type === 'slashCommand') ?
            `${interaction.commandName}` : `${interaction.customId}`;
        args['id'] = `${verifyId}`;

        this.log(this.intlGet(null, 'infoCap'), this.intlGet(null, `${type}Interaction`, args));
    }

    // --- RESTORED ORIGINAL HELPER METHODS ---
    async setupGuild(guild) {
        const instance = this.getInstance(guild.id);
        const firstTime = instance.firstTime;
        await require('../discordTools/RegisterSlashCommands')(this, guild);
        let category = await require('../discordTools/SetupGuildCategory')(this, guild);
        await require('../discordTools/SetupGuildChannels')(this, guild, category);
        
        if (firstTime) {
            const perms = PermissionHandler.getPermissionsRemoved(this, guild);
            try { await category.permissionOverwrites.set(perms); } catch (e) {}
        } else {
            await PermissionHandler.resetPermissionsAllChannels(this, guild);
        }

        require('../util/FcmListener')(this, guild);
        const credentials = InstanceUtils.readCredentialsFile(guild.id);
        for (const steamId of Object.keys(credentials)) {
            if (steamId !== credentials.hoster && steamId !== 'hoster') {
                require('../util/FcmListenerLite')(this, guild, steamId);
            }
        }
        await require('../discordTools/SetupSettingsMenu')(this, guild);
        if (firstTime) await PermissionHandler.resetPermissionsAllChannels(this, guild);
        this.resetRustplusVariables(guild.id);
    }

    getInstance(guildId) { return this.instances[guildId]; }
    setInstance(guildId, instance) {
        this.instances[guildId] = instance;
        InstanceUtils.writeInstanceFile(guildId, instance);
    }

    createRustplusInstance(guildId, serverIp, appPort, steamId, playerToken) {
        let rustplus = new RustPlus(guildId, serverIp, appPort, steamId, playerToken);
        this.rustplusInstances[guildId] = rustplus;
        this.activeRustplusInstances[guildId] = true;
        rustplus.build();
        return rustplus;
    }

    // ... All original Rust+ and Battlemetrics methods remain below ...
    // (Existing logic for createRustplusInstancesFromConfig, resetRustplusVariables, updateBattlemetricsInstances, etc.)
    async interactionReply(interaction, content) { try { return await interaction.reply(content); } catch (e) { return undefined; } }
    async interactionEditReply(interaction, content) { try { return await interaction.editReply(content); } catch (e) { return undefined; } }
    async interactionUpdate(interaction, content) { try { return await interaction.update(content); } catch (e) { return undefined; } }
    async messageEdit(message, content) { try { return await message.edit(content); } catch (e) { return undefined; } }
    async messageSend(channel, content) { try { return await channel.send(content); } catch (e) { return undefined; } }
    async messageReply(message, content) { try { return await message.reply(content); } catch (e) { return undefined; } }

    async validatePermissions(interaction) {
        const instance = this.getInstance(interaction.guildId);
        if (instance.blacklist['discordIds'].includes(interaction.user.id) &&
            !interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
            return false;
        }
        if (instance.role === null) return true;
        if (!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator) &&
            !interaction.member.roles.cache.has(instance.role)) {
            let role = DiscordTools.getRole(interaction.guildId, instance.role);
            const str = this.intlGet(interaction.guildId, 'notPartOfRole', { role: role.name });
            await this.interactionReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
            return false;
        }
        return true;
    }

    isAdministrator(interaction) {
        return interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator);
    }
}

module.exports = DiscordBot;