const { SlashCommandBuilder } = require("discord.js");

module.exports = (bot) => {
    let _ = {
        name: 'queuebuffer', 
        aliases: ['queuebuffer', 'queueb', 'qb'],
        desc: 'queues a buffered sound command',
        help: {
            text: 'adds one or more sounds to the current queue, connecting to the voice channel if necessary.',
            examples: [
                bot.prefix + 'queue {sound name | url}',
                bot.prefix + 'queue {sound 1} {sound 2} {...}',
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
        return bot.dj.playInput(mori, input, true, true);
    }
    
    return _;
};