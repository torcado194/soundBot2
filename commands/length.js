const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = (bot) => {
    let _ = {
        name: 'length', 
        aliases: ['length', 'len', 'duration', 'dur'],
        desc: 'get the duration of a sound',
        help: {
            text: 'responds with the duration of a sound name or command',
            examples: [
                bot.prefix + 'length {sound name}',
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

        try {
            let sounds = await bot.dj.convertInput(mori, bot.dj.getInput(mori.guild, input), 0);
            let length = await bot.dj.getSoundLength(sounds);

            return Promise.resolve(`${input}: \`${length}\` seconds`);
        } catch(err) {
            Promise.reject(err);
        }

    }
    
    return _;
};