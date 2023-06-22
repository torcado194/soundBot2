/** config **/

const Discord = require('discord.js');

const fs = require('fs');
const randToken = require('rand-token');

const Log      = require('./models/log.js');

/** bot **/

const VERSION = '1.0.3';

function Bot(prefix = '-'){
    let bot = this;
    
    bot.VERSION = VERSION;
    bot.Discord = Discord;
    bot.USERS_PATTERN    = new RegExp(bot.Discord.MessageMentions.USERS_PATTERN,    '');
    bot.ROLES_PATTERN    = new RegExp(bot.Discord.MessageMentions.ROLES_PATTERN,    '');
    bot.CHANNELS_PATTERN = new RegExp(bot.Discord.MessageMentions.CHANNELS_PATTERN, '');
    bot.EVERYONE_PATTERN = new RegExp(bot.Discord.MessageMentions.EVERYONE_PATTERN, '');
    
    bot.prefix = prefix;
    bot.defaultPrefix = bot.prefix;
    bot.color = 0xf03484;
    
    bot.commands = require('./commands.js')(bot);
    bot.rights   = require('./rights.js')(bot);

    bot.dj = require('./dj.js')(bot);
    bot.configs = new Map();
    const Config = require('./models/config.js');
    
    ////////////////////
    /** client setup **/
    ////////////////////
    
    let client = bot.client = new Discord.Client({
        intents: [
            Discord.GatewayIntentBits.Guilds,
            Discord.GatewayIntentBits.GuildMessages,
            Discord.GatewayIntentBits.MessageContent,
            Discord.GatewayIntentBits.GuildMembers,
            Discord.GatewayIntentBits.GuildVoiceStates,
            Discord.GatewayIntentBits.GuildMessageReactions
        ],
    });
    
    client.on('error', console.error);
    
    client.on('ready', () => {	
        console.log(client.user.username + ' is ready');
        bot.init();
    });
    
    client.on('messageCreate', message => {

        console.log(message);
        
        if(message.author.bot){
            return;
        }
        
        let selfMentioned = !!message.mentions.users.get(client.user.id) && message.content.trim().match(bot.USERS_PATTERN).index === 0;
        if(!selfMentioned && !message.content.startsWith(bot.prefix)){
            return;
        }
        
        // let params = bot.getParams(message.content);
        
        bot.call(bot.toMori(message));
        
    });

    client.on('interactionCreate', async (interaction) => {
        console.log(interaction.commandName);
        if(bot.commands[interaction.commandName]){
            // if(process.env.NODE_ENV !== 'production'){
            //     await interaction.deferReply();
            // }
            await interaction.deferReply();
            bot.commands[interaction.commandName].call(bot.toMori(interaction));
        } else {
            bot.toMori(interaction).reply('Command not found.');
        }
    });

    client.on('voiceStateUpdate', async (oldState, newState) => {
        if(oldState.channel 
            && oldState.channel.members.has(bot.client.user.id)
            && oldState.channel.members.size === 1){ //user moved out of channel and that channel only contains the bot
            bot.dj.disconnect(oldState.guild);
        }
    });
    
    ////////////
    /** init **/
    ////////////
    
    bot.init = () => {
        let appCommands = Object.values(bot.commands).map(cmd => cmd.command?.().toJSON()).filter(v=>v);
        //console.log(appCommands);
        bot.client.application.commands.set(appCommands).catch(console.error);
    }

    bot.getTempFile = () => {
        if (!fs.existsSync('./__temp')){
            fs.mkdirSync('./__temp');
        }
        return '__temp/' + randToken.generate(6) + '.mp3';
    }

    bot.toHMS = (secs) => {
        let sec_num = parseInt(secs, 10)
        let hours   = Math.floor(sec_num / 3600)
        let minutes = Math.floor(sec_num / 60) % 60
        let seconds = sec_num % 60

        return [hours,minutes,seconds]
            .map(v => v < 10 ? "0" + v : v)
            .filter((v,i) => v !== "00" || i > 0)
            .join(":")
    }
    
    ///////////////////
    /** bot methods **/
    ///////////////////
    
    bot.login = () => {
        console.log('logging in...');   ``
        console.log('  env:' + process.env.NODE_ENV);
        if(process.env.NODE_ENV === 'production' || process.argv[2] === '-p'){
            client.login(process.env.BOT_TOKEN);
        } else {
            client.login(process.env.TEST_BOT_TOKEN);
        }
    }

    function reduceInteractionParams(interaction){
        /* function reduce(map){
            return map.map(v => {
                if(v.options){
                    return reduce(v.options);
                } else if(v.type === Discord.ApplicationCommandOptionType.Attachment) {
                    return v.attachment;
                } else {
                    return v.value;
                } 
            });
        }
        return deepFlat(reduce(interaction.options.data)); */
        return Object.values(mapInteractionParams(interaction));
    }

    function mapInteractionParams(interaction){
        function reduce(map){
            return map.map(v => {
                let val;
                if(v.options){
                    return reduce(v.options);
                } else if(v.type === Discord.ApplicationCommandOptionType.Attachment) {
                    val = v.attachment;
                } else {
                    val = v.value;
                } 
                return {name: v.name, value: val};
            });
        }
        let list = deepFlat(reduce(interaction.options.data));
        let map = list.reduce((acc, v) => {
            acc[v.name] = v.value;
            return acc;
        }, {});
        return map;
    }

    function deepFlat(array){
        return array.reduce((acc, e) => {
            if(Array.isArray(e)){
                return acc.concat(deepFlat(e));
            } else {
                return acc.concat(e);
            }
        }, []);
    }

    let tempId = 12345
    class Mori {
        source;
        interaction = null;
        message = null;
        type = 'message';
        keep = false;
        command = null;

        params;
        options;
        paramMap;

        id;
        member;
        user;
        guild;
        channel;

        constructor(source, opts = null){
            if(!opts){
                this.source = source;
                // this.type = source instanceof Discord.BaseInteraction ? Discord.BaseInteraction : Discord.Message,
                this.type = source instanceof Discord.BaseInteraction ? "interaction" : "message";
                if(this.type == 'interaction'){
                    this.interaction = this.source;
                    this.options = this.interaction.options;
                    this.params = reduceInteractionParams(this.interaction);
                    this.paramMap = mapInteractionParams(this.interaction);
                    this.command = this.interaction.command;
                } else {
                    this.message = this.source;
                    this.params = bot.getParams(this.message).slice(1);
                    this.command = bot.getCommand(bot.getParams(this.message)[0]).command();

                    var refOptions = this.command.toJSON().options;
                    var deep = refOptions.some(v => v.options);
                    if(deep){
                        for(let v of refOptions){
                            if(v.options){
                                refOptions = v.options;
                            }
                            if(v.options.length === this.params.length){
                                break;
                            }
                        }
                    }
                    this.paramMap = {};
                    this.params.forEach((v, i) => {
                        let r = refOptions[i];
                        this.paramMap[r?.name || i] = v;
                    });
                }
                this.id = this.source.id;
                this.member = this.source.member;
                this.user = this.member.user;
                this.guild = this.source.guild;
                this.channel = this.source.channel;
            } else {
                opts.source && (this.source = opts.source);
                opts.interaction && (this.interaction = opts.interaction);
                opts.message && (this.message = opts.message);
                opts.type && (this.type = opts.type);
                opts.keep && (this.keep = opts.keep);
                opts.command && (this.command = opts.command);
                opts.params && (this.params = opts.params);
                opts.options && (this.options = opts.options);
                opts.paramMap && (this.paramMap = opts.paramMap);
                opts.id && (this.id = opts.id);
                opts.member && (this.member = opts.member);
                opts.user && (this.user = opts.user);
                opts.guild && (this.guild = opts.guild);
                opts.channel && (this.channel = opts.channel);

                if(!this.id){
                    this.id = ''+(tempId++)
                }
            }
        }

        async reply(body, simple = false, keep = false){
            if(!body){
                body = '👍';
            }
            let segs = body;
            if(!Array.isArray(segs)){
                segs = [segs];
            }
            if(simple){
                
            } else {
                segs = bot.longMessage(body);
                // segs = segs.map((s, i) => ({embeds:[{
                //     description: s,
                //     color: bot.color
                // }]}));
            }
            
            try{
                for(let i = 0; i < segs.length; i++){
                    let seg = segs[i];
                    if(typeof seg === 'object'){
                        seg.content = '';
                    } else if(typeof seg === 'string'){
                        seg = {content: seg};
                    }
                    if(this.interaction){
                        if(this.interaction.deferred || (this.interaction.replied && !this.keep)){
                            await this.interaction.editReply(seg);
                        } else if(this.interaction.replied) {
                            await this.interaction.followUp(seg);
                        } else {
                            seg.allowedMentions = {repliedUser: false};
                            await this.interaction.reply(seg);
                        }
                    } else {
                        seg.allowedMentions = {repliedUser: false};
                        await this.message.reply(seg);
                    }
                }
            } catch(err){
                console.error(err);
            }
            // if(interaction.deferred){
            //     return interaction.editReply(body);
            // } else if(interaction.replied) {
            //     return interaction.followUp(seg);
            // } else {
            //     return interaction.reply(body);
            // }
            if(keep){
                this.keep = true;
            }
        }

        async respond(promise){
            if(this.interaction){
                if(!this.interaction.deferred) await this.interaction.deferReply();
            }
            try {
                let data = await promise;
                if(data){
                    this.reply(data, false, true);
                } else {
                    return this.confirm();
                }
            } catch(err) {
                return this.deny(err);
            }
        }

        async respondInfo(promise){
            if(this.interaction){
                if(!this.interaction.deferred) await this.interaction.deferReply();
            }
            try {
                let data = await promise;
                if(data){
                    this.confirm();
                    return this.info(data, '🔆');
                } else {
                    // return this.reply(undefined, true);
                    return this.confirm();
                }
                // return this.confirm(data);
            } catch(err) {
                return this.deny(err);
            }
        }

        confirm(){
            if(this.interaction){
                return this.reply('👍', true);
            } else {
                return this.message.react('👍');
            }
        }
        
        deny(error){
            if(error){
                return this.reply(error.toString(), false, true);
            } else if(this.interaction){
                return this.reply('❌', true, true);
            }
        }

        async info(body, emoji, show = false){
            if(show && body){
                return this.reply(body, false, true);
            }

            if(!emoji){
                emoji = 'ℹ️';
            }
            
            let msg;
            if(this.interaction){
                msg = await this.interaction.fetchReply();
            } else {
                msg = this.message;
            }
            msg.react(emoji).then((reaction) => {
                if(!show){
                    msg.awaitReactions({filter: (r, user) => !user.bot && r.emoji.name === emoji, max: 1}).then(collected => {
                        this.reply(body, false, true);
                    });
                }
            }).catch(console.error);
        }


        warning(error, show = false){
            return this.info(error, '⚠', show);
        }
        
    }

    // Message OR Interaction
    bot.Mori = Mori;
    bot.toMori = (source) => {
        return new Mori(source);
    }

    bot.tempMori = (opts) => {
        return new Mori(null, opts);
    }

    // bot.respond = async (promise, interaction) => {
    //     if(!interaction.deferred) await interaction.deferReply();
    //     promise.then((data)=>{
    //         bot.reply(interaction, data);
    //     }).catch(err => {
    //         console.error(err);
    //         bot.deny(interaction, err);
    //     });
    // }
    
    bot.getParams = (message) => {
        let selfMentioned = !!message.mentions.users.get(bot.client.user.id) && message.content.trim().match(bot.USERS_PATTERN).index === 0;
        if(selfMentioned){
            return message.content.split(/\s+/g).slice(1);
        } else {
            return message.content.slice(bot.prefix.length).split(/\s+/g);
        }
    }

    bot.getCommand = (name) => {
        name = name.trim().toLowerCase();
        let m = Object.keys(bot.commands);
        for(let i = 0; i < m.length; i++){
            let command = bot.commands[m[i]];
            if(command.aliases && command.aliases.includes(name)){
                return command;
            }
        }
    }
    
    bot.call = (mori) => {
        let params = bot.getParams(mori.message);
        let name = params[0].toLowerCase(),
            m = Object.keys(bot.commands);
        for(let i = 0; i < m.length; i++){
            let command = bot.commands[m[i]];
            if(command.aliases && command.aliases.includes(name)){
                if(bot.rights.check(mori.member, command.rights)){
                    command.call(mori, params);
                } else {
                    mori.deny(`insufficient rights. must be \`${command.rights}\` or higher`);
                }
                break;
            }
        }
    }
    
    bot.send = (channel, body) => {
        if(typeof channel === 'string'){
            channel = bot.client.channels.get(channel);
        }
        let segs = bot.longMessage(body.toString());
        // segs = segs.map(s => channel.send({embeds:[{
        //     description: s,
        //     color: bot.color
        // }]}));
        return Promise.all(segs);
    }

    // bot.initReply = async (interaction, body) => {
    //     if(!interaction) return Promise.reject();
    //     if(interaction.deferred || interaction.replied){
    //         return interaction.editReply(body);
    //     } else {
    //         return interaction.reply(body);
    //     }
    // }

    // bot.reply = async (interaction, body) => {
    //     if(!interaction){
    //         return Promise.reject();
    //     }
    //     if(typeof body === 'undefined'){
    //         body = '👍';
    //     }
    //     let segs = bot.longMessage(body.toString());
    //     segs = segs.map((s, i) => ({embeds:[{
    //         description: s,
    //         color: bot.color
    //     }]}));
    //     try{
    //         for(let i = 0; i < segs.length; i++){
    //             let seg = segs[i];
    //             if(i === 0){
    //                 await bot.initReply(interaction, seg);
    //             } else {
    //                 await interaction.followUp(seg);
    //             }
    //         }
    //     } catch(err){
    //         console.error(err);
    //     }
    // }
    
    // bot.confirm = (interaction) => {
    //     if(interaction){
    //         // message.react('👍').then((reaction) => {
    //         // }).catch(console.error);
    //         bot.initReply(interaction, '👍');
    //     }
    // }
    
    // bot.deny = (interaction, error) => {
    //     if(error){
    //         bot.reply(interaction, error.toString());
    //     } else if(interaction){
    //         bot.initReply(interaction, '❌').then((reaction) => {
    //         }).catch(console.error);
    //     }
    // }
    
    // bot.warning = (message, error, show = false) => {
    //     if(show){
    //         bot.send(message, error);
    //     }
    //     if(message){
    //         message.react('⚠').then((reaction) => {
    //             if(!show){
    //                 message.awaitReactions((r, user) => !user.bot && r.emoji.name === '⚠', {max: 1}).then(collected => {
    //                     bot.send(message, error);
    //                 });
    //             }
    //         }).catch(console.error);
    //     }
    // }
    
    // bot.info = (message, body, emoji, show = false) => {
    //     if(show && body){
    //         bot.send(message, body);
    //     }
    //     if(message){
    //         bot.initReply(message, emoji);
    //         /* message.react(emoji).then((reaction) => {
    //             if(!show && body){
    //                 message.awaitReactions((r, user) => !user.bot && r.emoji.name === emoji, {max: 1}).then(collected => {
    //                     bot.send(message, body);
    //                 });
    //             }
    //         }).catch(console.error); */
    //     }
    // }
    
    bot.longMessage = (msg, delimiter, options = {}) => {
        const LAMBDA = 80,
              BODY_SIZE = 2048 - LAMBDA,
              FIELD_SIZE = 1024 - LAMBDA,
              EMBED_SIZE = 6000 - LAMBDA,
              FIELD_COUNT = 25;
        
        delimiter = delimiter || '\n';
        
        if(msg instanceof Error){
            msg = msg.toString();
        }

        let ret = null;

        if(typeof msg === 'string'){
            if(msg.length <= BODY_SIZE){
                ret = options.code ? ['```' + options.code + '\n' + msg + '```'] : [msg];
            } else {
                let segs = msg.split(delimiter);
                for(let i = 1; i < segs.length; i++){
                    let join = segs[i-1] + delimiter + segs[i];
                    if(join.length < BODY_SIZE){
                        segs[i-1] = join;
                        segs.splice(i, 1);
                        i--;
                    }
                }
                if(options.code){
                    segs = segs.map(s => '```' + options.code + '\n' + s + '```')
                }
                ret = segs;
            }
        } else if(msg.embeds) {
            if(msg.delim){
                delimiter = msg.delim;
            }
            let fields = msg.embeds[0].fields || [];
            for(let i = 0; i < fields.length; i++){
                if(fields[i].value.length > FIELD_SIZE){
                    let segs = fields[i].value.split(delimiter),
                        code = fields[i].code;
                    for(let j = 1; j < segs.length; j++){
                        let join = segs[j-1] + delimiter + segs[j];
                        if(join.length < FIELD_SIZE){
                            segs[j-1] = join;
                            segs.splice(j, 1);
                            j--;
                        }
                    }
                    fields.splice(i, 1, ...segs.map((s, n) => ({
                        name: n === 0 ? fields[i].name : '͘' /*fields[i].name + ' (cont.)'*/,
                        value: s,
                        code
                    })));
                    i += (segs.length - 1);
                }
            }
            if(options.code){
                msg.embeds[0].fields = fields.map(f => ({name: f.name, value: '```' + options.code + '\n' + f.value + '```'}));
            }
            fields = fields.map(f => {
                if(f.code){
                    return {name: f.name, value: `\`\`\`${f.code}\n${f.value}\`\`\``};
                } else {
                    return f;
                }
            });
            let totalText = fields.reduce((acc, cur) => acc + cur.name + cur.value, 0);
            let fieldCount = FIELD_COUNT;
            if(totalText.length > EMBED_SIZE){
                let out = [],
                    acc = '',
                    lastIdx = 0,
                    minFields = FIELD_COUNT;
                for(let i = 0; i < fields.length; i++){
                    acc += fields[i].name + fields[i].value;
                    if(acc.length > EMBED_SIZE){
                        out.push(fields.slice(lastIdx, i));
                        if(i - lastIdx < minFields){
                            minFields = i - lastIdx;
                        }
                        lastIdx = i;
                        acc = '';
                    }
                }
                if(lastIdx < fields.length - 1){
                    out.push(fields.slice(lastIdx));
                }
                fields = [];
                out.forEach(a => fields.push(...a));
                fieldCount = 6;
            }
            if(fields.length > fieldCount){
                let count = Math.ceil(fields.length / fieldCount),
                    out = [];
                for(let i = 0; i < count; i++){
                    out.push(fields.slice(i * fieldCount, i * fieldCount + fieldCount));
                }
                let outObj = out.map((f, n) => {
                    let obj = Object.assign({}, msg.embeds[0]);
                    obj.fields = f;
                    if(n > 0){
                        obj.title = undefined;
                        obj.url = undefined;
                        obj.description = undefined;
                    }
                    return {embeds:[obj]};
                });
                ret = outObj;
            } else {
                ret = [msg];
            }
        } else {
            return [msg];
        }

        if(ret){
            if(!Array.isArray(ret)){
                ret = [ret]
            }

            ret = ret.map((s, i) => {
                if(typeof s === 'object' && s.embeds){
                    return s;
                } else {
                    return ({embeds:[{
                        description: s.toString(),
                        color: bot.color
                    }]})
                }
            });

            return ret;
        }
        return [];
    }
    
    bot.getMentions = (message) => {
        let mentions = message.mentions.members && message.mentions.members.array();
        if(mentions[0] && mentions[0].id === bot.client.user.id){
            mentions.shift();
        }
        return mentions;
    }

    bot.logUpload = async (guildId, username, userId, soundName, date) => {
        let newLog = new Log({guildId, username, userId, soundName, date, action: 'add'});
        try {
            let saved = await newLog.save();
            return Promise.resolve(saved);
        } catch(err) {
            return Promise.reject(err);
        }
    }

    bot.logRemove = async (guildId, username, userId, soundName, date) => {
        let newLog = new Log({guildId, username, userId, soundName, date, action: 'remove'});
        try {
            let saved = await newLog.save();
            return Promise.resolve(saved);
        } catch(err) {
            return Promise.reject(err);
        }
    }

    bot.logRename = async (guildId, username, userId, soundName, newName, date) => {
        let newLog = new Log({guildId, username, userId, soundName, newName, date, action: 'rename'});
        try {
            let saved = await newLog.save();
            return Promise.resolve(saved);
        } catch(err) {
            return Promise.reject(err);
        }
    }

    bot.getConfig = async (guildId) => {
        let config = await Config.findOne({guildId}).exec();
        if(!config){
            config = {};
        }
        return config;
    }

    bot.updateConfig = (config) => {
        let c = bot.configs.get(config.guildId);
        if(c){
            config.prefix && (c.prefix = config.prefix);
            config.commandChannels && (c.commandChannels = config.commandChannels);
            config.status && (c.status = config.status);
            config.leaveSound && (c.leaveSound = config.leaveSound);
            config.autoDisconnect && (c.autoDisconnect = config.autoDisconnect);
        } else {
            bot.configs.set(config.guildId, config);
        }
    }

    bot.delayedRemove = (messages) => {
        if(!Array.isArray(messages)){
            messages = [messages];
        }
        setTimeout(() => {
            messages.forEach(m => m.delete());
        }, 30*60*1000) //30 minutes
    }
    
};


module.exports = Bot;