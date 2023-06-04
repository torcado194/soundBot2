const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const Sound    = require('../models/sound.js');

module.exports = (bot) => {
    let _ = {
        name: 'remove', 
        aliases: ['remove', 'rm', 'r', 'delete', 'del'],
        desc: 'removes a sound from the database.',
		help: {
			text: 'removes a sound from the database.\nthis returns the link to the removed sound',
			examples: [
                bot.prefix + 'remove {sound name}'
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
                .setDescription('sound name')
                .setRequired(true))
    }

    function call(mori){
        mori.respond(
            run(mori, mori.params[0]),
            mori
        );
    }

    async function run(mori, name){
        if(!name){
            return Promise.reject('please specify the name of the sound to remove');
        }

        name = name.trim();

        try {
            let sound = await Sound.findOneAndRemove({guildId: mori.guild.id, name}).exec();
            if(!sound){
                return Promise.reject(`there is no sound with the name \`${name}\``);
            }
            bot.logRemove(mori.guild.id, mori.user.username, mori.member.id, name, new Date());
            return Promise.resolve(`removed sound \`${sound.name}\`, link: ${sound.link}`);
        } catch(err) {
            return Promise.reject(err);
        }

        return Promise.resolve();
    }
    
    return _;
};