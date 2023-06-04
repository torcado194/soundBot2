const { SlashCommandBuilder, PermissionFlagsBits, ActivityType } = require("discord.js");

const Config = require('../models/config.js');

module.exports = (bot) => {
    let _ = {
        name: 'removesoundchannel', 
        aliases: ['removesoundchannel', 'removechannel', 'remchan', 'removecommandschannel'],
        desc: 'removes the specified channel from the list of channels that restrict where commands are allowed',
        help: {
            text: 'removes the specified channel from the list of channels that restrict where commands are allowed',
            examples: [
                bot.prefix + 'removesoundchannel {channel id}',
            ]
        },
		rights: ['owner'],
        command,
        call,
        run
    };

    function command(){
        return new SlashCommandBuilder().setName(_.name).setDescription(_.desc)
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addChannelOption(option => 
                option.setName('channel')
                .setDescription('text channel')
                .setRequired(true))
    }

    function call(mori, channel){
        mori.respond(
            run(mori, mori.paramMap.channel),
            mori
        );
    }

    async function run(mori, channel){
        let channelId;
        if(typeof channel === 'object'){
            channelId = channel.id;
        } else {
            channelId = channel;
        }
        if(!channelId){
            return Promise.reject('please specify the channel');
        }
        
        try {
            let config = await Config.findOne({guildId: mori.guild.id}).exec();
            config.commandChannels.splice(config.commandChannels.indexOf(channelId), 1);
            await config.save();
            bot.updateConfig(config);
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }
    }
    
    return _;
};