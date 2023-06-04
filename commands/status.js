const { SlashCommandBuilder, PermissionFlagsBits, ActivityType } = require("discord.js");

const Config = require('../models/config.js');

module.exports = (bot) => {
    let _ = {
        name: 'status', 
        aliases: ['status', 'msg'],
        desc: 'changes the status message of the bot',
		help: {
			text: 'changes the status message of the bot. an empty message clears the status',
			examples: [
				bot.prefix + 'status {message}',
				bot.prefix + 'status',
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
            .addStringOption(option => 
                option.setName('message')
                .setDescription('sound name or command'))
    }

    function call(mori){
        mori.respond(
            run(mori, mori.paramMap.message),
            mori
        );
    }

    async function run(mori, status){
        try {
            await bot.client.user.setPresence(status ? { activities: [{ name: status, type:ActivityType.Playing}] } : { activities: [] });
            let config = await Config.findOne({guildId: mori.guild.id}).exec();
            if(config){
                config.status = status;
                await config.save();
                return Promise.resolve();
            }
        } catch (err) {
            return Promise.reject(err);
        }

    }
    
    return _;
};