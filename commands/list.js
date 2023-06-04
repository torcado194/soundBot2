const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const Sound    = require('../models/sound.js');

module.exports = (bot) => {
    let _ = {
        name: 'list', 
        aliases: ['list', 'l', 'soundlist', 'sl'],
        desc: 'lists all available sounds',
		help: {
			text: 'lists all available sounds for a server. current sorting filters: `length`',
			examples: [
				bot.prefix + 'list',
				bot.prefix + 'list {sort by}',
				bot.prefix + 'list {server id}',
				bot.prefix + 'list {server id} {sort by}',
			]
		},
        command,
        call,
        run
    };

    function command(){
        return new SlashCommandBuilder().setName(_.name).setDescription(_.desc)
            .addStringOption(option => 
                option.setName('sort')
                .setDescription('sorting method'))
            .addStringOption(option => 
                option.setName('server')
                .setDescription('server id'))
    }

    function call(mori){
        mori.respond(
            run(mori, mori.params),
            mori
        );
    }

    async function run(mori, params){
        let guildId, sortBy;
        if(/^\d+$/.test(params[1])){ //test if only digits
            guildId = params[1];
            sortBy = params[2];
        } else {
            guildId = mori.guild.id;
            sortBy = params[1];
        }

        if(!guildId){
            return Promise.reject('invalid params');
        }
        sortBy = sortBy || 'name';
        try {
            let sounds = await Sound.find({guildId}).sort(sortBy).exec();
            if(!sounds || sounds.length === 0){
                return reject('no sounds found for that server');
            }
            // return Promise.resolve(sounds);

            let maxLength = 0;
            sounds.forEach(s => {
                if(s.name && s.name.length > maxLength){
                    maxLength = s.name.length;
                }
            });
            maxLength += 2;
            let combined = '';
            for(let i = 0; i < sounds.length; i++){
                combined += sounds[i].name + (i % 5 == 4 ? '\n' : ' '.repeat(maxLength - (sounds[i].name ? sounds[i].name.length : 0)));
            }

            let segs = bot.longMessage(combined, '\n', {code: 'YAML'});
            segs = segs.map(s => mori.channel.send(s));
            Promise.all(segs).then(bot.delayedRemove).catch(err => mori.deny(err));
            
            return Promise.resolve();
        } catch(err) {
            return Promise.reject(err);
        }

    }
    
    return _;
};