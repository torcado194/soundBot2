const { SlashCommandBuilder, PermissionFlagsBits, ActivityType } = require("discord.js");

const Config = require('../models/config.js');

module.exports = (bot) => {
    let _ = {
        name: 'setleavesound', 
        aliases: ['setleavesound', 'setleave', 'leavesound'],
        desc: 'sets the sound that plays when the bot leaves the voice channel.',
        help: {
            text: 'sets the sound that plays when the bot leaves the voice channel. leave the name empty to disable the leave sound.',
            examples: [
                bot.prefix + 'setleavesound {sound name}',
            ]
        },
        command,
        call,
        run
    };

    function command(){
        return new SlashCommandBuilder().setName(_.name).setDescription(_.desc)
            .addStringOption(option => 
                option.setName('sound')
                .setDescription('sound command'))
    }

    function call(mori, channel){
        mori.respond(
            run(mori, mori.paramMap.sound),
            mori
        );
    }

    async function run(mori, sound){
        if(!sound){
            sound = "";
        }
        
        try {
            // let config = await Config.findOne({guildId: mori.guild.id}).exec();
            let config = await bot.getConfig(mori.guild.id);
            config.leaveSound = sound;
            await config.save();
            bot.updateConfig(config);
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }
    
    return _;
};