const { SlashCommandBuilder, PermissionFlagsBits, ActivityType } = require("discord.js");

const Config = require('../models/config.js');

module.exports = (bot) => {
    let _ = {
        name: 'restart', 
        aliases: ['restart', 'reset'],
        desc: 'restarts the bot, may solve various issues',
		help: {
			text: 'restarts the bot, may solve various issues',
			examples: [
				bot.prefix + 'restart',
			]
		},
		// rights: ['owner'],
        command,
        call,
        run
    };

    function command(){
        return new SlashCommandBuilder().setName(_.name).setDescription(_.desc)
            // .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    }

    function call(mori){
        mori.respond(
            run(mori),
            mori
        );
    }

    async function run(mori){
        console.log('restarting');
        await mori.reply("restarting...");
        process.exit();
    }
    
    return _;
};