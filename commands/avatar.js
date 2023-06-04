const { SlashCommandBuilder, PermissionFlagsBits, ActivityType } = require("discord.js");

const Config = require('../models/config.js');

module.exports = (bot) => {
    let _ = {
        name: 'avatar', 
        aliases: ['avatar', 'av', 'icon'],
        desc: 'changes the avatar image of the bot',
		help: {
			text: 'changes the avatar image of the bot',
			examples: [
				bot.prefix + 'avatar {image url}',
				bot.prefix + 'avatar [image file attachment]',
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
            .addSubcommand((subcommand) => 
                subcommand.setName('url')
                .setDescription('set avatar by url')
                .addStringOption(option => 
                    option.setName('url')
                    .setDescription('sound url')
                    .setRequired(true))
            )
            .addSubcommand((subcommand) => 
                subcommand.setName('attachment')
                .setDescription('set avatar by attachment')
                .addAttachmentOption(option => 
                    option.setName('attachment')
                    .setDescription('sound file attachment')
                    .setRequired(true))
            )
    }

    function call(mori){
        mori.respond(
            run(mori, mori.paramMap.url || mori.paramMap.attachment),
            mori
        );
    }

    async function run(mori, payload){
        let url = '';
        if(mori.type === 'interaction'){
            if(typeof payload === 'object'){
                url = payload.url;
            } else {
                url = payload;
            }
        } else {
            if(mori.message?.attachments && mori.message?.attachments.first()){
                url = mori.message?.attachments.first().url;
            } else {
                url = payload;
            }
        }
        if(!url){
            return Promise.reject('please provide an image attachment or url');
        }
        return bot.client.user.setAvatar(link);

    }
    
    return _;
};