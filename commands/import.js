const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const Log = require('../models/log.js');
const Sound = require('../models/sound.js');

module.exports = (bot) => {
    let _ = {
        name: 'import', 
        aliases: ['import', 'i'],
        desc: 'imports sounds from another server',
        help: {
            text: 'imports sounds from another server into this one',
            examples: [
                bot.prefix + 'import {server id}',
                bot.prefix + 'import {server id} {count}',
            ]
        },
        rights: ['owner'],
        command,
        call,
        run
    };

    function command(){
        return new SlashCommandBuilder().setName(_.name).setDescription(_.desc)
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption(option => 
                option.setName('server_id')
                .setDescription('id of server to import from')
                .setRequired(true))
            .addStringOption(option => 
                option.setName('count')
                .setDescription('limit for number of sounds to import'))
    }

    function call(mori){
        mori.respond(
            run(mori, mori.paramMap.server_id, mori.paramMap.count),
            mori
        );
    }

    async function run(mori, importFrom, count){
        if(!importFrom){
            return Promise.reject('plese specify a server id to import from');
        }

        return new Promise(async (resolve, reject) => {
            let guildId = mori.guild.id;
            try {
                let newSounds = await Sound.find({guildId: importFrom}).sort('-_id').limit(count || 0).exec();
                if(!newSounds || newSounds.length === 0){
                    return reject('no sounds found in that server');
                }
                let newSoundNames = newSounds.map(v => v.name).sort((a, b) => a > b ? 1 : -1);
                let curSounds = await Sound.find({guildId}).sort('name').exec();
                let curSoundNames = curSounds.map(v => v.name);
                let conflicts = newSounds.filter(v => curSoundNames.includes(v.name)),
                    conflictNames = conflicts.map(v => v.name),
                    hasConflict = conflicts && conflicts.length > 0,
                    nonConflicts = newSounds.filter(v => !curSoundNames.includes(v.name)),
                    list = [];
                let fields = [];
                fields.push({name: 'import sounds', value: ` you are about to import the following sounds:`});
                let newSoundsText = newSoundNames.join('\n');
                
                let maxLength = 0;
                newSounds.forEach(s => {
                    if(s.name && s.name.length > maxLength){
                        maxLength = s.name.length;
                    }
                });
                maxLength += 2;
                let combined = [''],
                    maxLines = 9999999,
                    lineCount = 0,
                    j = 0;
                for(let i = 0; i < newSounds.length; i++){
                    if(lineCount === maxLines){
                        lineCount = 0;
                        j++;
                        combined.push('');
                    }
                    combined[j] += newSounds[i].name + (i % 5 == 4 ? (lineCount++, '\n') : ' '.repeat(maxLength - (newSounds[i].name ? newSounds[i].name.length : 0)));
                }
                //console.log({combined});
                combined.forEach(c => fields.push({name: '_', value: c, code: 'YAML'}));
                
                //fields.push({name: '_', value: `\`\`\`YAML\n${newSounds.map(v => v.name).join('\n')}\`\`\``});
                if(hasConflict){
                    fields.push({name: '_', value: `these sounds conflict with ones in your server:`});
                    let conflictsText = conflictNames.join('\n');
                    
                    let maxLength = 0;
                    conflicts.forEach(s => {
                        if(s.name && s.name.length > maxLength){
                            maxLength = s.name.length;
                        }
                    });
                    maxLength += 2;
                    let combined = [''],
                        maxLines = 9999999,
                        lineCount = 0,
                        j = 0;
                    for(let i = 0; i < conflicts.length; i++){
                        if(lineCount === maxLines){
                            lineCount = 0;
                            j++;
                            combined.push('');
                        }
                        combined[j] += conflicts[i].name + (i % 5 == 4 ? (lineCount++, '\n') : ' '.repeat(maxLength - (conflicts[i].name ? conflicts[i].name.length : 0)));
                    }
                    //console.log({combined});
                    combined.forEach(c => fields.push({name: '_', value: c, code: 'YAML'}));
                    //fields.push({name: '_', value: `${conflicts.map(v => v.name).join('\n')}`, code: 'YAML'});
                    fields.push({name: 'choose action:', value: `\n🇴 - import and overwrite\n🇮 - import and ignore conflicts (does not import sounds that conflict)\n🇷 - import and rename (appends numbers to imported sounds)\n❌ - cancel`});
                    list = ['🇴', '🇮', '🇷', '❌'];
                } else {
                    fields.push({name: 'choose action:', value: `\n✅ - continue\n❌ - cancel`});
                    list = ['✅', '❌'];
                }
                let embed = {
                    fields,
                    color: bot.color
                }
                let segs = bot.longMessage({embeds: [embed]}, '\n');
                console.log(segs[0]);
                segs = segs.map(s => mori.channel.send(s));
                Promise.all(segs).then(ms => {
                    console.log({ms});
                    let collect = ms.pop();
                    list.reduce((pre, item, i) => pre.finally(res => {
                        return collect.react(item);
                    }).catch(reject), Promise.resolve());
                    collect.awaitReactions({filter: (r, user) => user.id === mori.user.id && list.includes(r.emoji.name), max: 1}).then(collected => {
                        let name = collected.at(0).emoji.name;
                        function fin(){
                            mori.channel.send('import finshed!');
                            return resolve();
                        }
                        if(name === '✅'){
                            let count = newSounds.length;
                            if(count <= 0){
                                return fin();
                            }
                            newSounds.forEach(async s => {
                                let newSound = new Sound();
                                newSound.link = s.link;
                                newSound.name = s.name;
                                newSound.guildId = guildId;
                                newSound.length = s.length
                                await newSound.save();
                                count--;
                                if(count <= 0){
                                    fin();
                                }
                                logUpload(guildId, mori.user.username, mori.user.id, s.name, new Date());
                            });
                        } else if(name === '🇴'){
                            let count = newSounds.length;
                            if(count <= 0){
                                return fin();
                            }
                            nonConflicts.forEach(async s => {
                                let newSound = new Sound();
                                newSound.link = s.link;
                                newSound.name = s.name;
                                newSound.guildId = guildId;
                                newSound.length = s.length
                                await newSound.save()
                                count--;
                                if(count <= 0){
                                    fin();
                                }
                                bot.logUpload(guildId, mori.user.username, mori.user.id, s.name, new Date());
                            });
                            conflicts.forEach(async s => {
                                await Sound.findOneAndUpdate({guildId, name: s.name}, {link: s.link}).exec();
                                count--;
                                if(count <= 0){
                                    fin();
                                }
                                bot.logRename(guildId, mori.user.username, mori.user.id, s.name, s.name, new Date()); //rename to same name to denote overwrite
                            });
                        } else if(name === '🇮'){
                            let count = nonConflicts.length;
                            console.log({nonConflicts});
                            if(count <= 0){
                                return fin();
                            }
                            nonConflicts.forEach(async s => {
                                let newSound = new Sound();
                                newSound.link = s.link;
                                newSound.name = s.name;
                                newSound.guildId = guildId;
                                newSound.length = s.length
                                await newSound.save();
                                count--;
                                if(count <= 0){
                                    fin();
                                }
                                bot.logUpload(guildId, mori.user.username, mori.user.id, s.name, new Date());
                            });
                        } else if(name === '🇷'){
                            let count = newSounds.length;
                            if(count <= 0){
                                return fin();
                            }
                            nonConflicts.forEach(async s => {
                                let newSound = new Sound();
                                newSound.link = s.link;
                                newSound.name = s.name;
                                newSound.guildId = guildId;
                                newSound.length = s.length
                                await newSound.save();
                                count--;
                                if(count <= 0){
                                    fin();
                                }
                                bot.logUpload(guildId, mori.user.username, mori.user.id, s.name, new Date());
                            });
                            conflicts.reduce((pre, s, i) => pre.finally(r => {
                                return new Promise(async (res, rej) => {
                                    let baseName = s.name.replace(/\d+$/, '');
                                    console.log({baseName});
                                    let sounds = await Sound.find({guildId, name: new RegExp(`^${baseName}\\d+$`)}).exec();
                                    if(!sounds || sounds.length === 0){
                                        mori.deny('no sound found from base name ' + baseName);
                                        return rej();
                                    }
                                    let biggest = 0;
                                    console.log('  FIND:', sounds);
                                    sounds.forEach(v => {
                                        let num = parseInt(v.name.match(/\d+$/));
                                        if(!num){
                                            return;
                                        }
                                        if(biggest < num){
                                            biggest = num;
                                        }
                                    });
                                    let num = biggest + 1;
                                    let newName = baseName + num;
                                    console.log('  NAME:', newName);
                                    let newSound = new Sound();
                                    newSound.link = s.link;
                                    newSound.name = newName;
                                    newSound.guildId = guildId;
                                    newSound.length = s.length
                                    let saved = await newSound.save();
                                    mori.channel.send(`"${s.name}" imported as \`${newName}\``);
                                    count--;
                                    if(count <= 0){
                                        fin();
                                    }
                                    console.log('SSAVVE', saved);
                                    bot.logUpload(guildId, mori.user.username, mori.user.id, newName, new Date());
                                    return res();
                                });
                            }).catch(reject), Promise.resolve());
                        } else if(name === '❌'){
                            mori.channel.send('import canceled');
                            return resolve();
                        }
                    });
                }).catch(reject);
            } catch (err) {
                return reject(err);
            }
        });
    }
    
    return _;
};