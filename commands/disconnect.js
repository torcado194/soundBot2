const { SlashCommandBuilder } = require("discord.js");

module.exports = (bot) => {
    let _ = {
        name: 'disconnect', 
        aliases: ['disconnect', 'dc', 'leave'],
        desc: 'disconnects from the current voice channel.',
		help: {
			text: 'disconnects from the current voice channel.',
			examples: [bot.prefix + 'disconnect']
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
        return bot.dj.disconnect(mori.guild);
    }
    
    return _;
};