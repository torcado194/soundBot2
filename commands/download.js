const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const Log = require('../models/log.js');
const Sound = require('../models/sound.js');

const VALID_SOUND_PATTERN = /^[!@#$%^&*?\w-]+$/;

module.exports = (bot) => {
    let _ = {
        name: 'download', 
        aliases: ['download', 'dl', 'link', 'url', 'show'],
        desc: 'get sound link or sound command audio',
        help: {
            text: 'responds with a link to the sound stored in the database, or a compiled sound file',
            examples: [
                bot.prefix + 'download {sound name}',
                bot.prefix + 'download {sound command}',
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
                .setDescription('sound name or command')
                .setRequired(true))
    }

    function call(mori){
        mori.respond(
            run(mori, mori.paramMap.sound),
            mori
        );
    }

    async function run(mori, input){
        if(!input){
            return Promise.reject('plese specify the name of the sound');
        }
        
        if(VALID_SOUND_PATTERN.test(input)){ //test for single sound or sound command
            try {
                let sound = await Sound.findOne({guildId: mori.guild.id, name: input}).exec();
                if(!sound){
                    return Promise.reject('could not find sound with name ' + input);
                }
                
                return Promise.resolve(`${sound.name}: ${sound.link}`);
            } catch(err) {
                Promise.reject(err);
            }
        } else {
            try {
                let sounds = await bot.dj.convertInput(mori, bot.dj.getInput(mori.guild, input), 0);
                let file = await bot.dj.makeSoundFile(sounds);
                return Promise.resolve({
                    files: [{
                        attachment: file,
                        name: file
                    }]
                });
            } catch(err) {
                Promise.reject(err);
            }
        }

    }
    
    return _;
};