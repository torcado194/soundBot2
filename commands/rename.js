const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const Sound    = require('../models/sound.js');

module.exports = (bot) => {
    let _ = {
        name: 'rename', 
        aliases: ['rename', 'ren', 'rn'],
        desc: 'rename a sound in the database.',
        help: {
            text: 'rename a sound in the database.',
            examples: [
                bot.prefix + 'rename {sound name}'
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
            .addStringOption(option => 
                option.setName('new_name')
                .setDescription('new sound name')
                .setRequired(true))
    }

    function call(mori){
        mori.respond(
            run(mori, mori.paramMap.name, mori.paramMap.new_name),
            mori
        );
    }

    async function run(mori, name, newName){
        if(!name){
            return Promise.reject('please specify the name of the sound to remove');
        }
        if(!newName){
            return Promise.reject('please specify the new name for the sound');
        }

        name = name.trim();
        newName = newName.trim();

        try {
            let sound = await Sound.findOneAndUpdate({guildId: mori.guild.id, name}, {name: newName}).exec();
            if(!sound){
                return Promise.reject(`there is no sound with the name \`${name}\``);
            }
            bot.logRename(mori.guild.id, mori.user.username, mori.member.id, name, newName, new Date());
            return Promise.resolve(`renamed sound \`${name}\` to \`${sound.name}\``);
        } catch(err) {
            return Promise.reject(err);
        }

        return Promise.resolve();
    }
    
    return _;
};