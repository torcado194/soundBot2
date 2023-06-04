const { SlashCommandBuilder } = require("discord.js");

let {filterTable, filterList} = require('../filters.js')

module.exports = (bot) => {
    let _ = {
        name: 'help',
        aliases: ['help', 'h'],
        desc: 'displays documentation for all commands or a specific command',
		help: {
			text: 'displays documentation for all commands or a specific command',
			examples: [
				bot.prefix + 'help',
				bot.prefix + 'help {command}'
			]
		},
        command,
        call,
        run
    };
    
    function command(){
        return new SlashCommandBuilder().setName(_.name).setDescription(_.desc)
            .addStringOption(option => 
                option.setName('name')
                .setDescription('name of a command, or "filters"')
                .setRequired(false));
    }
    
    function call(mori){
        mori.respond(
            run(mori, mori.params[0]),
            mori
        );
    }
    
    async function run(mori, name){
        if(name === 'filters'){
            let resEmbed = {embeds:[{
                author: {
                    name: `soundBot version ${bot.VERSION}`,
                    iconURL: bot.client.user.avatarURL() || 'https://cdn.discordapp.com/attachments/357948589747732481/547952204745670705/1.png'
                },
                fields: [
                    {
                        name: 'filters',
                        value: 'filters can be applied to sounds by putting them in [brackets] directly after a sound name. filters consist of a name and one or more parameters separated by `=`. multiple filters can be applied by either adding additional [bracketted] filters or separating the name/parameter group with a comma.\nfilters can also be applied to a group of sounds by surrounding the sounds in (parentheses) and placing the filters directly after.'
                        + '```YAML\n'
                        + 'sound[pitch=1.5,volume=2]\n'
                        + '(sound1 sound2 sound3)[tempo=.8,reverse]\n'
                        + '```\n'
                        + filterList.map(name => [
                            '\r**‣ ' + filterTable[name].aliases[0] + '**',
                            filterTable[name].help.text,
                            '⸺*aliases*⸺',
                            filterTable[name].aliases.map(e=>'`'+e+'`').join(', '),
                        ].join('\n')).join('\n')
                    }
                ],
                color: bot.color
            }]}
            // mori.reply(resEmbed);
            return resEmbed;
        } else if(name){
            let resEmbed = null;
            let m = Object.keys(bot.commands);
            for(let i = 0; i < m.length; i++){
                let method = bot.commands[m[i]];
                if(method.aliases.includes(name)){
                    
                    resEmbed = {embeds:[{
                        title: '‣ ' + m[i],
                        description: [
                            '```yaml',
                            method.help.examples/*.map(e=>'`'+e+'`')*/.join('\n').replace(new RegExp(bot.defaultPrefix, 'g'), bot.prefix),
                            '```' + method.help.text,
                            '⸺*aliases*⸺',
                            method.aliases.map(e=>'`'+e+'`').join(', '),
                        ].join('\n'),
                        color: bot.color
                    }]}
                    
                    break;
                }
            }
            if(resEmbed){
                // mori.reply(resEmbed);
                return resEmbed;
            } else {
                return Promise.reject("no command with that name");
            }
        } else {
            let commands = Object.keys(bot.commands).filter(n => !bot.commands[n].hidden),
                filters = Object.keys(filterTable);
            let resEmbed = {embeds:[{
                author: {
                    name: `soundBot version ${bot.VERSION}`,
                    iconURL: bot.client.user.avatarURL() || 'https://cdn.discordapp.com/attachments/357948589747732481/547952204745670705/1.png'
                },
                description: 'save and play sound clips!\na bot made by [torcado](http://twitter.com/torcado) :)',
                fields: [
                    {
                        name: 'commands',
                        value: commands.map(name => [
                            '\r**‣ ' + name + '**',
                            '```YAML',
                            bot.commands[name].help.examples/*.map(e=>'`'+e+'`')*/.join('\n').replace(new RegExp(bot.defaultPrefix, 'g'), bot.prefix),
                            '```' + bot.commands[name].help.text,
                            '⸺*aliases*⸺',
                            bot.commands[name].aliases.map(e=>'`'+e+'`').join(', '),
                        ].join('\n')).join('\n')
                    },
                    /*{
                        name: 'filters',
                        value: 'filters can be applied to sounds by putting them in [brackets] directly after a sound name. filters consist of a name and one or more parameters separated by `=`. multiple filters can be applied by either adding additional [bracketted] filters or separating the name/parameter group with a comma.\nfilters can also be applied to a group of sounds by surrounding the sounds in (parentheses) and placing the filters directly after.'
                        + '```YAML\n'
                        + 'sound[pitch=1.5,volume=2]\n'
                        + '(sound1 sound2 sound3)[tempo=.8,reverse]\n'
                        + '```\n'
                        + filters.map(name => [
                            '\r**‣ ' + filterTable[name].aliases[0] + '**',
                            filterTable[name].help.text,
                            '⸺*aliases*⸺',
                            filterTable[name].aliases.map(e=>'`'+e+'`').join(', '),
                        ].join('\n')).join('\n')
                    }*/
                ],
                color: bot.color
            }]};
            // console.log(segments);
            // segments.forEach(s => message.channel.send(s));
            let resFilters = {embeds:[{
                author: {
                    name: `soundBot version ${bot.VERSION}`,
                    iconURL: bot.client.user.avatarURL() || 'https://cdn.discordapp.com/attachments/357948589747732481/547952204745670705/1.png'
                },
                fields: [
                    {
                        name: 'filters',
                        value: 'filters can be applied to sounds by putting them in [brackets] directly after a sound name. filters consist of a name and one or more parameters separated by `=`. multiple filters can be applied by either adding additional [bracketted] filters or separating the name/parameter group with a comma.\nfilters can also be applied to a group of sounds by surrounding the sounds in (parentheses) and placing the filters directly after.'
                        + '```YAML\n'
                        + 'sound[pitch=1.5,volume=2]\n'
                        + '(sound1 sound2 sound3)[tempo=.8,reverse]\n'
                        + '```\n'
                        + filters.map(name => [
                            '\r**‣ ' + filterTable[name].aliases[0] + '**',
                            filterTable[name].help.text,
                            '⸺*aliases*⸺',
                            filterTable[name].aliases.map(e=>'`'+e+'`').join(', '),
                        ].join('\n')).join('\n')
                    }
                ],
                color: bot.color
            }]};

            resEmbed.embeds[0].fields.push(...resFilters.embeds[0].fields);

            return resEmbed;
        }
        
        // //return new Promise((resolve, reject) => {
        //     if(false){
        //         let name = command,
        //             m = Object.keys(bot.commands);
        //         for(let i = 0; i < m.length; i++){
        //             let command = bot.commands[m[i]];
        //             let hasRights = !command.rights || bot.rights.check(message.member, command.rights);
        //             if(hasRights && command.name === name){
                        
        //                 message.channel.send({embeds:[{
        //                     title: '‣ ' + m[i],
        //                     description: [
        //                         '```yaml',
        //                         command.help.text,
        //                         '```',
        //                     ].join('\n'),
        //                     color: bot.color
        //                 }]});
                        
        //                 break;
        //             }
        //         }
        //     } else {
        //         let commands = Object.keys(bot.commands).filter(n => {
        //             let c = bot.commands[n];
        //             if(c.hidden){
        //                 return false;
        //             }
        //             if(c.rights && bot.rights.check(interaction.member, c.rights)){
        //                 return false;
        //             }
        //             return true;
        //         });
        //         let segments = bot.longMessage({embeds:[{
        //             author: {
        //                 name: `version ${bot.VERSION}`,
        //                 iconURL: bot.client.user.avatarURL || undefined
        //             },
        //             description: sections.find(s => s.name === 'description').value,
        //             fields: [
        //                 {
        //                     name: 'commands',
        //                     value: commands.map(name => [
        //                         '\r**/' + name + '**',
        //                         bot.commands[name].help.examples && '```YAML',
        //                         bot.commands[name].help.examples && bot.commands[name].help.examples.join('\n'),
        //                         (bot.commands[name].help.examples ? '```' : '') + bot.commands[name].help.text,
        //                     ].filter(v=>v).join('\n')).join('\n')
        //                 }
        //             ],
        //             color: bot.color
        //         }]}, '\r');
        //         // segments.forEach(s => interaction.channel.send(s));
        //         let segs = segments;
        //         for(let i = 0; i < segs.length; i++){
        //             let seg = segs[i];
        //             if(i === 0){
        //                 await bot.initReply(interaction, seg);
        //             } else {
        //                 await interaction.followUp(seg);
        //             }
        //         }
        //     }
        // // });
    }

    return _;
};
