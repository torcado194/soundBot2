const { SlashCommandBuilder } = require("discord.js");

module.exports = (bot) => {
    let _ = {
        name: 'stop', 
        aliases: ['stop', 'st', 'd'],
        desc: 'stops the currently playing audio',
		help: {
			text: 'stops the currently playing audio',
			examples: [
				bot.prefix + 'stop',
			]
		},
        command,
        call,
        run
    };

    function command(){
        return new SlashCommandBuilder().setName(_.name).setDescription(_.desc)
    }

    function call(mori){
        mori.respondInfo(
            run(mori),
            mori
        );
    }

    function run(mori){
        if(!mori.member.voice.channel){
            return Promise.reject('You must be in a voice channel!');
        }
        bot.dj.stop(mori.guild);
        return Promise.resolve();
    }
    
    return _;
};