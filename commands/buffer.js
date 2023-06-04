const { SlashCommandBuilder } = require("discord.js");

module.exports = (bot) => {
    let _ = {
        name: 'buffer', 
        aliases: [ 'buffer', 'b', 'soundbuffer', 'sb', 'playbuffer', 'pb'],
        desc: 'play buffered sound command',  
        help: {
            text: 'similar to `play` but buffers the input so computation time happens at the start rather than inbetween sounds',  
            examples: [
                bot.prefix + 'buffer',
                bot.prefix + 'buffer {sound name | url}',
                bot.prefix + 'buffer {sound 1} {sound 2} {...}',
                bot.prefix + 'buffer {sound}[filter]',
                bot.prefix + 'buffer {sound}[filter1,filter2]',
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
                .setDescription('sound command text')
                .setRequired(false));
    }

    function call(mori){
        mori.respondInfo(
            run(mori, mori.params[0]),
            mori
        );
    }

    function run(mori, input){
        if(!mori.member.voice.channel){
            return Promise.reject('You must be in a voice channel!');
        }
        return bot.dj.playInput(mori, input, false, true);
    }
    
    return _;
};