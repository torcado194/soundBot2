const { SlashCommandBuilder, PermissionFlagsBits, ActivityType } = require("discord.js");

const Config = require('../models/config.js');

module.exports = (bot) => {
    let _ = {
        name: 'toggleautodc', 
        aliases: ['toggleautodc', 'autodisconnect', 'autodc'],
        desc: 'toggles whether bot automatically disconnects from voice channel',
        help: {
            text: 'toggles whether bot automatically disconnects from voice channel',
            examples: [
                bot.prefix + 'toggleautodc',
                bot.prefix + 'toggleautodc [on|off|true|false]',
            ]
        },
        command,
        call,
        run
    };

    function command(){
        return new SlashCommandBuilder().setName(_.name).setDescription(_.desc)
        .addStringOption(option => 
            option.setName('value')
            .setDescription('value to set to'))
    }

    function call(mori, channel){
        mori.respond(
            run(mori, mori.paramMap.value),
            mori
        );
    }

    async function run(mori, value){
        let toggle = false;
        if(typeof value === 'undefined'){
            toggle = true;
        } else if(typeof value === 'string'){
            value = value.toLowerCase();
            if(value === 'on' || value === 'true'){
                value = true;
            } else {
                value = false;
            }
        }
        try {
            let config = await Config.findOne({guildId: mori.guild.id}).exec();
            if(toggle){
                value = !config.autoDisconnect;
            }
            config.autoDisconnect = value;
            await config.save();
            bot.updateConfig(config);
            bot.dj.startDisconnectTimer(mori.guild);
            return Promise.resolve("autodisconnect is now set to `" + value + "`");
        } catch (err) {
            return Promise.reject(err);
        }
    }
    
    return _;
};