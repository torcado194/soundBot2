const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const Log = require('../models/log.js');

module.exports = (bot) => {
    let _ = {
        name: 'log', 
        aliases: ['log', 'logs'],
        desc: 'lists added, removed, and renamed sounds for this server',
        help: {
            text: 'lists added, removed, and renamed sounds for this server',
            examples: [
                bot.prefix + 'log',
                bot.prefix + 'log {count}',
            ]
        },
        command,
        call,
        run
    };

    function command(){
        return new SlashCommandBuilder().setName(_.name).setDescription(_.desc)
            .addStringOption(option => 
                option.setName('count')
                .setDescription('log line count'))
    }

    function call(mori){
        mori.respond(
            run(mori, mori.paramMap.count),
            mori
        );
    }

    async function run(mori, count){
        if(!count){
            count = 100;
        }
        try {
            let logs = await Log.find({guildId: mori.guild.id}).sort('-date').limit(count).exec();

            logs = logs.reverse();
            let combined = '';
            for(let i = 0; i < logs.length; i++){
                //combined += `${logs[i].soundName}: ${logs[i].action === 'remove' ? '-removed' : 'added'} by ${logs[i].username} at ${logs[i].date.toLocaleString('en-US', { timeZone: 'UTC' })} (UTC)\n`;
                let listing = '';
                if(logs[i].action === 'rename'){
                    listing = `~ ${logs[i].soundName} -> ${logs[i].newName}`
                } else {
                    listing = `${logs[i].action === 'remove' ? '-' : '+'} ${logs[i].soundName}`;
                }
                combined += `${listing}:\n    ${logs[i].username} at ${logs[i].date.toLocaleString('en-US', { timeZone: 'UTC' })} (UTC)\n`;
            }
            let segs = bot.longMessage(combined, '\n', {code: 'diff'});
            segs = segs.map(s => mori.channel.send(s));
            Promise.all(segs).then(bot.delayedRemove).catch(err => mori.deny(err));
            
            return Promise.resolve();
        } catch(err) {
            return Promise.reject(err);
        }

    }
    
    return _;
};