const { SlashCommandBuilder, PermissionFlagsBits, ActivityType } = require("discord.js");

const Config = require('../models/config.js');

module.exports = (bot) => {
    let _ = {
        name: 'name', 
        aliases: ['name', 'username'],
        desc: 'changes the username of the bot',
		help: {
			text: 'changes the username of the bot',
			examples: [
				bot.prefix + 'name {name}',
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
                option.setName('name')
                .setDescription('new username')
                .setRequired(true))
    }

    function call(mori){
        mori.respond(
            run(mori, mori.paramMap.name),
            mori
        );
    }

    async function run(mori, name){
        if(!name){
            return Promise.reject('please provide a name');
        }
        try {
            await bot.client.user.setUsername(name);
            return Promise.resolve();
        } catch (err) {
            return Promise.reject(err);
        }

    }
    
    return _;
};