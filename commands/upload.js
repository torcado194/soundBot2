const { SlashCommandBuilder } = require("discord.js");

const Sound    = require('../models/sound.js');

module.exports = (bot) => {
    let _ = {
        name: 'upload', 
        aliases: ['upload', 'ul', 'u', 'store', 'st', 'save'],
        desc: 'uploads a sound to the database',
		help: {
			text: 'uploads a sound to the database to be played later.',
			examples: [
				bot.prefix + 'upload {sound name} {url}',
				bot.prefix + 'upload {sound name} [audio file attachment]',
			]
		},
        command,
        call,
        run
    };

    function command(){
        return new SlashCommandBuilder().setName(_.name).setDescription(_.desc)
            .addSubcommand((subcommand) => 
                subcommand.setName('url')
                .setDescription('upload sound by url')
                .addStringOption(option => 
                    option.setName('name')
                    .setDescription('sound name')
                    .setRequired(true))
                .addStringOption(option => 
                    option.setName('url')
                    .setDescription('sound url')
                    .setRequired(true))
            )
            .addSubcommand((subcommand) => 
                subcommand.setName('attachment')
                .setDescription('upload sound by attachment')
                .addStringOption(option => 
                    option.setName('name')
                    .setDescription('sound name')
                    .setRequired(true))
                .addAttachmentOption(option => 
                    option.setName('attachment')
                    .setDescription('sound file attachment')
                    .setRequired(true))
            )
    }

    function call(mori){
        mori.respond(
            run(mori, mori.paramMap.name, mori.paramMap.url || mori.paramMap.attachment),
            mori
        );
    }

    async function run(mori, name, payload){
        if(!name){
            return Promise.reject('please include both a name for the sound and a link/file');
        }
        if(!payload && !(mori.message?.attachments && mori.message?.attachments.first())){
            return Promise.reject('please include both a name for the sound and a link/file');
        }

        let url;
        if(mori.type === 'interaction'){
            if(typeof payload === 'object'){
                await mori.reply({files: [payload.url]}, true, true);
                let reply = await mori.interaction.fetchReply()
                url = reply.attachments.at(0).url;
                console.log(url);
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
        name = name.trim();

        let count = 0;
        try {
            count = await Sound.countDocuments({guildId: mori.guild.id, name}).exec();
            if(count > 0){
                return Promise.reject('a sound with that name already exists');
            }
            let newSound = new Sound();
            newSound.guildId = mori.guild.id;
            newSound.name    = name;
            newSound.aliases = [];
            newSound.link    = url;
            let length = await bot.dj.getSoundLength(url);
            newSound.length = length;
            let savedPost = await newSound.save();
            bot.logUpload(mori.guild.id, mori.user.username, mori.member.id, name, new Date());
            // return Promise.resolve(savedPost);
            return Promise.resolve(`uploaded sound \`${savedPost.name}\`, link: ${savedPost.link}`);
        } catch(err) {
            return Promise.reject(err);
        }

        return Promise.resolve();
    }
    
    return _;
};