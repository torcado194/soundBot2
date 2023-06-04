const { SlashCommandBuilder } = require("discord.js");

module.exports = (bot) => {
    let _ = {
        name: 'connect', 
        aliases: ['connect', 'c', 'join'],
        desc: 'connects to the voice channel',
		help: {
			text: 'connects to the voice channel that the calling user is in.',
			examples: [bot.prefix + 'connect']
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
            return Promise.reject('user not in voice channel')
        }
        return bot.dj.connect(mori.guild, mori.member.voice.channel);
    }
    
    return _;
};