const { joinVoiceChannel, VoiceConnectionStatus, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require("@discordjs/voice");

// const ytdlcore = require('ytdl-core');
const ytdl = require('youtube-dl-exec');
const { spawn } = require('child_process');

const SOURCE_SOUND_PATTERN = /{([^{}()\[\]<>=|\\]+?)}/;
const RANDOM_SOUND_PATTERN = /{rand(?:om)?(?:([<>])(\d+))?(?:([<>])(\d+))?(?::([\w\d]+))?}/;
const TTS_SOUND_PATTERN = /{tts(?::"?([^{}()\[\]<>=|\\]+))?"?}/;
const VALID_SOUND_PATTERN = /^[!@#$%^&*?\w-]+$/;
const URL_PATTERN = /<((?:https?:\/\/)?(?:[\w-]+\.)+[\w-]+(?:\/.+)?)>/;

const mongoose = require('mongoose');
const Sound    = require('./models/sound.js');
const Config   = require('./models/config.js');
const Log      = require('./models/log.js');
const randToken = require('rand-token');

const {filterTable, filterList} = require('./filters.js');

mongoose.connect(process.env.MONGODB_URI);

module.exports = (bot) => {
    let queues = new Map();
    let playerStates = new Map();
    let runningCommands = new Map();
    let disconnectTimers = new Map();
    return {
        queues,
        playerStates,
        runningCommands,
        connect(guild, vc){
            return new Promise((resolve, reject) => {
                let connection = getVoiceConnection(guild.id);
                if(connection && connection.st){ //???
                    this.createPlayer(guild, connection);
                    return resolve();
                } else {
                    bot.dj.startDisconnectTimer(guild);
                    connection = joinVoiceChannel({
                        channelId: vc.id,
                        guildId: guild.id,
                        adapterCreator: guild.voiceAdapterCreator,
                    });
                    connection.on(VoiceConnectionStatus.Ready, async (oldState, newState) => {
                        this.createPlayer(guild, connection)
                        return resolve();
                    });
                }
            });
        },
        async disconnect(guild){

            let playerState = playerStates.get(guild.id);
            //TODO: only leave if at least one person in current vc
            try{
                let config = await Config.findOne({guildId: guild.id}).exec();
                if(config.leaveSound){
                    let cb = () => {
                        console.log(`idle`, queues.get(guild.id));
                        let queue = queues.get(guild.id);
                        if(queue && queue.length > 0){
                        } else {
                            playerState.player.removeListener(AudioPlayerStatus.Idle, cb);
                            fin();
                        }
                    }
                    playerState.player.on(AudioPlayerStatus.Idle, cb);
                    await bot.dj.playLeaveSound(guild, config.leaveSound);
                } else {
                    fin();
                }
            } catch(err){
                fin();
            }

            function fin(){
                if(playerState){
                    playerState.player.stop();
                }
                playerStates.delete(guild.id);
                queues.delete(guild.id);
                let connection = getVoiceConnection(guild.id);
                if(connection){
                    connection.disconnect();
                    connection.destroy();
                }
            }
        },
        createPlayer(guild, connection){
            if(playerStates.has(guild.id)) return;
            const player = createAudioPlayer();
            playerState = {player, connection, idle:true};
            playerStates.set(guild.id, playerState);
            connection.subscribe(player);
            player.on('error', (error) => console.error(error));
            player.on(AudioPlayerStatus.Idle, () => {
                bot.dj.startDisconnectTimer(guild);
                console.log(`idle`);
                playerState.idle = true;
                let queue = queues.get(guild.id);
                if(queue){
                    if(queue.length === 0){
                        console.log(`queue finished`);
                        // playerState.connection.disconnect();
                    } else {
                        console.log(`next`, queue);
                        queue.shift();
                        this.runQueue(guild);
                    }
                }
            });
            return playerState;
        },
        queue(mori, guild, vc, member, sounds, index = -1, reset = false){
            let queue = queues.get(guild.id);
            if(!queue){
                queue = [];
                queues.set(guild.id, queue);
            }
            if(!Array.isArray(sounds)){
                sounds = [sounds];
            }
            let newEntries = [];

            for(sound of sounds){
                let data = {
                    mori,
                    input: sound,
                    member,
                    startedAt:-1,
                    info:'pending...'
                };
                newEntries.push(data);
            }
            /* ytdlcore.getInfo(url).then(info => {
                data.info = info;
            }); */
            if(reset){
                // queue.splice(0, queue.length, ...newEntries);
                /* if(queue.length > 0){
                    queue.push(...newEntries);
                    let playerState = playerStates.get(guild.id);
                    if(playerState && !playerState.player.idle){
                        playerState.player.stop();
                    } else {
                        this.runQueue(guild, vc, reset);
                    }
                } else {
                    queue.push(...newEntries);
                    this.runQueue(guild, vc, reset);
                } */
                if(queue.length > 0){
                    queue.splice(1);
                } else {
                    reset = false;
                }
                queue.push(...newEntries);
            } else {
                if(index < 0){
                    queue.push(...newEntries);
                } else {
                    queue.splice(index, 0, ...newEntries);
                }
            }
            this.runQueue(guild, vc, reset);
        },
        //reset should be true only when the queue[0] track is known to be playing
        async runQueue(guild, vc, reset = false){
            let queue = queues.get(guild.id);
            if(!queue || queue.length === 0) return;
            let playerState = playerStates.get(guild.id);
            if(!playerState){
                if(!vc){
                    return console.error('no vc');
                }
                await this.connect(guild, vc);
                playerState = playerStates.get(guild.id);
            } else if(!playerState.idle){
                if(reset){
                    // this.skip(guild);
                } else {
                    return;
                }
            }
            // let stream = ytdlcore('https://www.youtube.com/watch?v=mXVm36pKZCA', {filter: 'audioonly'});
            
            try {
                // let output = bot.getTempFile();
                /* await ytdl(queue[0].input, {
                    output,
                    x: true,
                    audioFormat: 'mp3',
                }) */
                /* .then(out => {
                    console.log(out);
                    return resolve(output);
                }).catch(err => {
                    console.log(err);
                    return reject(err);
                }); */
    
                // let stream = ytdlcore(queue[0].url, {filter: 'audioonly'});
                // let resource = createAudioResource(stream);
                // let resource = createAudioResource(output);

                //NOTE: this is done so that the currently playing audio skip happens as late as possible
                //currently playing track will be removed from queue but not stopped
                if(reset && queue.length > 1){
                    queue.shift();
                }

                let file = await bot.dj.makeSoundFile(queue[0].input);
                if(queue.length === 0){ //failsafe
                    return;
                }
                let resource = createAudioResource(file);
                bot.dj.cancelDisconnectTimer(guild); //cancel to prevent disconnecting while playing
                await playerState.player.play(resource); //this will cancel the current audio if it's playing
                // bot.dj.startDisconnectTimer(guild);
                queue[0].startedAt = Date.now();
                playerState.idle = false;
            } catch(err) {
                queue[0].mori.deny(err);
            }
        },
        skip(guild, position = 0, end){
            if(typeof end === 'undefined' || end === null){
                end = position;
            }
            let queue = queues.get(guild.id);
            if(end < 0){
                end = queue.length+1+end;
            }
            if(end < position){
                let temp = position;
                position = end;
                end = position;
            }
            if(!queue || queue.length === 0){
                // this.disconnect(guild);
                return;
            }
            queue.splice(position, (end+1)-position); //clear future tracks
            if(position === 0){
                let playerState = playerStates.get(guild.id); //stop current track (position 0)
                if(playerState){
                    playerState.player.stop();
                    playerState.idle = true;
                }
            }
            if(queue.length > 0){
                this.runQueue(guild);
            } else {
                // this.disconnect(guild);
            }
        },
        skipUser(guild, member){
            let queue = queues.get(guild.id);
            if(!queue || queue.length === 0){
                this.disconnect(guild);
                return;
            }
            if(queue[0].member.id === member.id){
                playerState = playerStates.get(guild.id); //stop current track (position 0)
                playerState.player.stop();
                playerState.idle = true;
            }
            queue = queue.filter(v => v.member.id !== member.id);
            queues.set(guild.id, queue);
            if(queue.length > 0){
                this.runQueue(guild);
            } else {
                this.disconnect(guild);
            }
        },
        stop(guild){
            return bot.dj.skip(guild, 0, -1);
        },
        getQueue(guild){
            return queues.get(guild.id);
        },
        playLeaveSound(guild, input){
            return new Promise((resolve, reject) => {
                input = bot.dj.getInput(guild, input);
                bot.dj.convertInput({guild}, input, 0).then(fin).catch(reject);
                function fin(sounds){
                    if(!Array.isArray(sounds)){
                        sounds = [sounds];
                    }
                    // queueIds.set(guild.id, (queueIds.get(guild.id) || 1) + 1);
                    // soundQueues.set(guild.id, sounds);
                    // streamStates.set(guild.id, true);
                    //playQueue(guild, null);
                
                    // play(queueIds.get(guild.id));
                    // play();


                    bot.dj.playInput(bot.tempMori({guild}), input, false, false).then(resolve).catch(reject);


                    function play(id){
                        if(soundQueues.get(guild.id).length === 0){
                            streams.delete(guild.id);
                            streamStates.set(guild.id, false);
                            return resolve();
                        }
                        console.log({soundQueues});
                        let sound = soundQueues.get(guild.id).shift();
                        console.log("::play sound:", sound, "queue:", soundQueues.get(guild.id));
                        
                        //filtered sound
                        //let input = parseSound(sound);
                        let stream = voiceConnections.get(guild.id).play(sound);
                        stream.streams.ffmpeg.process.stderr.on('data', err => {
                            console.error(err.toString());
                            warning(null, err);
                        });
                        streams.set(guild.id, stream);
                        /*stream.on('error', err => {
                            console.error(err);
                            reject(err);
                        });
                        stream.on('data', data => {
                            console.error('::::ONDATA::::', data);
                            //reject(err);
                        });
                        stream.on('debug', data => {
                            console.error('::::ONDEBUG::::', data);
                            //reject(err);
                        });*/
                        /*stream.on('start', ()=>{
                            console.log('start');
                        });*/
                        //cancelDisconnectTimer(guild);
                        stream.on('end', (a, b)=>{
                            //startDisconnectTimer(guild);
                            // if(queueIds.get(guild.id) === id){
                            //     play(id);
                            // }
                            return resolve();
                            //stream.end();
                            //stream.destroy();
                        });
                    }
                }
            });
        },

        startDisconnectTimer(guild){
            if(disconnectTimers.has(guild.id)){
                bot.dj.cancelDisconnectTimer(guild);
            }
            disconnectTimers.set(guild.id, setTimeout(() => {
                bot.dj.disconnect(guild);
                disconnectTimers.delete(guild.id);
            }, 15 * 60 * 1000)); //15 minutes
        },
        cancelDisconnectTimer(guild){
            if(disconnectTimers.has(guild.id)){
                clearTimeout(disconnectTimers.get(guild.id));
            }
        },



        playInput(mori, input, queue, buffer){
            let guild = mori.guild
            
            //runningCommands.set(message.id, {guild: message.guild, message});
            
            return new Promise((resolve, reject) => {
                input = bot.dj.getInput(guild, input);
                
                //TODO: change to fin(sounds, randResults){} (?) and have convertInput return random results
                //  results are compiled here to put into info() call
                function fin(sounds){
                    let randResults = bot.dj.runningCommands.get(mori.id).randomResults,
                        details;
                    if(randResults && randResults.length > 0){
                        
                        randResults.sort((a, b) => a.idx - b.idx);
                        details = '__random sounds:__\n';
                        details += randResults.map(v => '> ' + (v.flag ? `**${v.flag}:** ` : '') + v.name).join('\n');
                        
                        //this might be better but happens before confirm react :/
                        // mori.info(details, '🔆');
                    }
                    
                    console.log('||||||||', {sounds}, {randResults});
                    
                    bot.dj.runningCommands.delete(mori.id);
                    
                    bot.dj.queue(mori, mori.guild, mori?.member?.voice?.channel, mori?.member, sounds, -1, !queue);
                    return resolve(details);
                }
                if(buffer){
                    bot.dj.convertInput(mori, input, 0).then(fin).catch(reject);
                } else {
                    // convert each top-level item, play when available.
                    Promise.all(input.map((v, i) => bot.dj.convertInput(mori, [v], i))).then(fin).catch(reject);
                }
            });
            
        },

        

        async getSound(guild, name){
            if(RANDOM_SOUND_PATTERN.test(name)){
                return bot.dj.getRandomSound(guild, name);
            } else {
                /* return new Promise((resolve, reject)=>{
                    Sound.findOne({guildId: guild.id, name}).exec((err, sound) => {
                        if(err){
                            return reject(err);
                        }
                        if(!sound){
                            return reject('could not find sound with name ' + name);
                        }
                        return resolve(sound.link);
                    });
                }); */
                try{
                    let snd = await Sound.findOne({guildId: guild.id, name}).exec();
                    if(snd){
                        return snd.link;
                    } else {
                        return Promise.reject('could not find sound with name ' + name);
                    }
                } catch(err) {
                    return Promise.reject(err);
                }
            }
        },

        getRandomSound(guild, name){
            return new Promise((resolve, reject)=>{
                let filter = {};
                let [, f1side, f1dur, f2side, f2dur, flag] = name.match(RANDOM_SOUND_PATTERN);
                if(f1side || f2side){
                    f1dur = parseInt(f1dur);
                    f2dur = parseInt(f2dur);
                    if(f1side === f2side){
                        //collapse identical filters to one
                        if(f1side === '>'){
                            f1dur = Math.max(f1dur, f2dur);
                            f2side = undefined;
                            f2dur = undefined;
                        } else {
                            f1dur = Math.min(f1dur, f2dur);
                            f2side = undefined;
                            f2dur = undefined;
                        }
                    } else if(f1side && f2side){
                        if(
                            (f1side === '>' && f2side === '<' && f1dur > f2dur) ||
                            (f1side === '<' && f2side === '>' && f1dur < f2dur)
                        ){
                            return reject('invalid filter (impossible range)'); //impossible range
                        }
                    }
                    filter = {$and:[]};
                    let cur = filter.$and;
                    if(f1side){
                        cur.push({length: {[f1side === '>' ? '$gt' : '$lt']: f1dur}});
                    }
                    if(f2side){
                        cur.push({length: {[f2side === '>' ? '$gt' : '$lt']: f2dur}});
                    }
                }
                Sound.random({guildId: guild.id, ...filter}, (err, randSound) => {
                    //info(`random sound: ${randSound.name}`);
                    //ret(null, randSound)
                    if(err){
                        return reject(err);
                    }
                    if(!randSound){
                        return reject('could not find sound with name ' + name);
                    }
                    return resolve({link: randSound.link, name: randSound.name, flag});
                });
            });
        },

        deepSplit(item, delim){
            if(Array.isArray(item)){
                let set = item.map(v => bot.dj.deepSplit(v, delim));
                for(let i = 0; i < set.length; i++){
                    if(set[i].__s){
                        let c = set[i].__s.length-1;
                        set.splice(i, 1, ...set[i].__s)
                        i += c;
                    }
                }
                return set;
            } else if(typeof item === 'string') {
                return {__s: item.split(delim).filter((v,i,a) => (i !== 0 && i !== a.length-1) || v !== '')};
            } else {
                return item;
            }
        },
        
        deepFlatten(arr) {
            return arr.reduce(function (flat, toFlatten) {
                return flat.concat(Array.isArray(toFlatten) ? bot.dj.deepFlatten(toFlatten) : toFlatten);
            }, []);
        },

        parseNestedGroup(str, splitDelim, beginChars = ['('], endChars = [')']){
            if(!Array.isArray(beginChars)){
                beginChars = [beginChars];
            }
            if(!Array.isArray(endChars)){
                endChars = [endChars];
            }
            let s = str,
                out = [],
                pointers = [out],
                start = 0,
                cur = 0;
            for(; cur < s.length; cur++){
                if(beginChars.includes(s[cur])){
                    if(start < cur){
                        pointers[0].push(s.slice(start, cur));
                    }
                    start = cur+1;
                    let pointer = [];
                    pointers[0].push(pointer);
                    pointers.unshift(pointer);
                } else if(endChars.includes(s[cur])){
                    if(pointers.length === 1){
                        continue;
                    }
                    if(start < cur){
                        pointers[0].push(s.slice(start, cur));
                    }
                    start = cur+1;
                    pointers.shift();
                }
            }
            if(start < s.length){
                pointers[0].push(s.slice(start, s.length));
            }
            
            if(splitDelim !== undefined && splitDelim !== null){
                out = bot.dj.deepSplit(out, splitDelim);
            }
            return out;
        },

        getInput(guild, input){

            input = bot.dj.parseNestedGroup(input);
            input = input.filter(v => v && !/^\s+$/.test(v));
            input = splitFilters(input);
            input = convertSources(input); //before deep split because tts source may have spaces
            input = bot.dj.deepSplit(input, /\s/g);
            //console.log("[][][]", input);
            input = splitSidechain(input);
            input = splitMerges(input);
            // input = flattenSingles(input);
            input = bot.dj.deepFlatten(input);
            input = arrangeFilters(input);
            input = convertSidechain(input);
            input = parseMerges(input);
            return input;
            
        
            function splitSidechain(arr){
                for(let i = 0; i < arr.length; i++){
                    if(Array.isArray(arr[i])){
                        splitSidechain(arr[i]);
                    } else if(/(&{1,2})/.test(arr[i])){
                        let s = arr[i].split(/(&{1,2})/).filter(v => v);
                        arr.splice(i, 1, ...s);
                        i += s.length-1;
                    }
                }
                return arr;
            }
        
            function convertSidechain(arr){
                //let sidechainPattern = /^\(([^,]+),([^,]+)\)$/;
                let sidechainPattern = /^([^&]*)&{1,2}([^&]*)$/;
        
                //pull out leading/trailing commas, i guess
                /* for(let i = 0; i < arr.length; i++){
                    if(Array.isArray(arr[i]) && arr[i].length === 2){
                        if(Array.isArray(arr[i][0]) && arr[i][0][arr[i].length-1] === '&'){
                            var newArr = [
                                arr[i][0].slice(0,arr[i][0].length-1),
                                '&',
                                arr[i][1]
                            ];
                            arr.splice(i, 1, newArr);
                        } else if(Array.isArray(arr[i][1]) && arr[i][1][0] === '&'){
                            var newArr = [
                                arr[i][0],
                                '&',
                                arr[i][1].slice(1)
                            ];
                            arr.splice(i, 1, newArr);
                        }
                    }
                } */
                
                //TODO: 
                for(let i = 0; i < arr.length; i++){
                    if(Array.isArray(arr[i])){
                        convertSidechain(arr[i]);
                    } else if(typeof arr[i] === 'string') {
                        if(sidechainPattern.test(arr[i])){
                            arr[i] = arr[i].trim();
                            let signalA = arr[i].match(sidechainPattern)[1];
                            if(signalA === '' && i > 0){
                                signalA = arr.splice(i-1, 1)[0];
                                i--;
                            }
                            let signalB = arr[i].match(sidechainPattern)[2];
                            if(signalB === '' && i < arr.length-1){
                                signalB = arr.splice(i+1, 1)[0];
                            }
                            if(/&&/.test(arr[i])){
                                arr.splice(i, 1, {sidechaininv: [signalA, signalB]});
                            } else {
                                arr.splice(i, 1, {sidechain: [signalA, signalB]});
                            }
                        }
                    }
                }
                return arr;
            }
        
            function splitFilters(arr){
                for(let i = 0; i < arr.length; i++){
                    if(Array.isArray(arr[i])){
                        splitFilters(arr[i]);
                    } else if(typeof arr[i] === 'string') {
                        if(/^(\[[^\[\]]*?\])$/.test(arr[i])){
                            //already split
                        } else {
                            arr.splice(i, 1, arr[i].split(/(\[[^\[\]]*?\])/g));
                        }
                    }
                }
                return arr;
            }
        
            //e.g. {tts:...}
            function convertSources(arr){
                for(let i = 0; i < arr.length; i++){
                    if(Array.isArray(arr[i])){
                        convertSources(arr[i]);
                    } else if(typeof arr[i] === 'string') {
                        let group = arr[i].split(/(\{.+?\})/).filter(v => v).map(v => v.trim());
                        for(let j = 0; j < group.length; j++){
                            if(SOURCE_SOUND_PATTERN.test(group[j])){
                                group.splice(j, 1, {source: group[j]});
                            }
                        }
                        arr[i] = group;
                    }
                }
                return arr;
            }
            
            function splitMerges(arr){
                for(let i = 0; i < arr.length; i++){
                    if(Array.isArray(arr[i])){
                        splitMerges(arr[i]);
                    } else if(/(\+)/.test(arr[i])){
                        let s = arr[i].split(/(\+)/).filter(v => v);
                        arr.splice(i, 1, ...s);
                        i += s.length-1;
                    } else if(/^(\[.+\])([^\[\]]+)$/.test(arr[i])){
                        // ehhh maybe just throw an error.
                        /* let s = arr[i].split(/^(\[.+\])([^\[\]]+)$/).filter(v => v);
                        arr.splice(i, 1, ...s);
                        i += s.length-1; */
                    }
                }
                return arr;
                
            }
            // i can technically flatten arrays with multiple items as long as the group has  no merging and no appended filter.
            //  single items is fine for now
            function flattenSingles(arr){
                for(let i = 0; i < arr.length; i++){
                    if(Array.isArray(arr[i])){
                        if(arr[i].some(v => Array.isArray(v))){
                            arr[i] = flattenSingles(arr[i]);
                        }
                        if(arr[i].length === 1){
                            arr.splice(i, 1, ...arr[i]);
                        } else if(arr[i].length === 0){
                            arr.splice(i, 1);
                            i--;
                        }
                    }
                }
                return arr;
            }
            
            function arrangeFilters(arr){
                for(let i = 0; i < arr.length; i++){
                    if(Array.isArray(arr[i])){
                        arrangeFilters(arr[i]);
                    } else if(typeof arr[i] === 'object'){
                        continue;
                    } else if(/^\[.+\]$/.test(arr[i])){
                        if(i <= 0){
                            break;
                        }
                        //let sound = {group: arr[i-1], filter: arr[i]};
                        let filters = arr[i].split(/[\[\], ]/).filter(v => v);
                        let group = Array.isArray(arr[i-1]) ? arr[i-1] : [arr[i-1]];
                        arr.splice(i-1, 2, {group, filters});
                        i--;
                    } else if(/^[^\[\]]+\[.+\]$/.test(arr[i])){
                        console.log(arr[i]);
                        let s = arr[i].split(/^([^\[\]]+)(\[.+\])$/).filter(v => v);
                        console.log(s);
                        //arr.splice(i, 1, {group: s[0], filter: s[1]});
                        let filters = s[1].split(/[\[\], ]/).filter(v => v);
                        arr.splice(i, 1, {group: [s[0]], filters});
                    }
                }
                return arr;
            }
            
            function parseMerges(arr){
                let out = [],
                    group,
                    cur,
                    captured = -1;
                function pushParse(item){
                    if(Array.isArray(item)){
                        item = parseMerges(item);
                    } else if(item.group && Array.isArray(item.group)){
                        item.group = parseMerges(item.group);
                    }
                    cur.push(item);
                }
                function add(){
                    group = {group: cur = []};
                    //out.push(cur = []);
                }
                function setMerge(){
                    if(group.merge){
                        return;
                    }
                    group.merge = group.group;
                    delete group.group;
                }
                for(let i = 0; i < arr.length; i++){
                    if(Array.isArray(arr[i])){
                        out.push(parseMerges(arr[i]));
                    } else if(arr[i].group && Array.isArray(arr[i].group)){
                        arr[i].group = parseMerges(arr[i].group);
                        out.push(arr[i]);
                    } else if(/^\+.+\+$|^\+$/.test(arr[i])){
                        if(i <= 0){
                            break;
                        }
                        if(i > 0 && captured < i-1){
                            add();
                            cur.push(...out.splice(-1));
                            out.push(group);
                        }
                        if(!/^\+$/.test(arr[i])){
                            cur.push(arr[i]);
                        }
                        if(i < arr.length - 1){
                            pushParse(arr[i+1]);
                            i++;
                        }
                        captured = i;
                        setMerge();
                    } else if(/^.+\+$/.test(arr[i])){
                        if(i >= arr.length - 1){
                            break;
                        }
                        add();
                        out.push(group);
                        cur.push(arr[i]);
                        pushParse(arr[i+1]);
                        i++;
                        captured = i;
                        setMerge();
                    } else if(/^\+.+$/.test(arr[i])){
                        if(i <= 0){
                            break;
                        }
                        if(captured < i-1){
                            add();
                            cur.push(...out.splice(-1));
                            out.push(group);
                        }
                        cur.push(arr[i]);
                        captured = i;
                        setMerge();
                    } else {
                        out.push(arr[i]);
                    }
                }
                return arr = out;
            }
            
            
            
        },

        convertInput(mori, arr, idx){
            let guild = mori.guild;
            let inputs = [],
                index = 0,
                filters = [],
                nestedAction = ['concat'],
                randomSounds = {};
            
            if(!bot.dj.runningCommands.get(mori.id)){
                bot.dj.runningCommands.set(mori.id, {guild: mori.guild, mori});
            }
        
            let adjustments = {
                reverb(){
                    //ffmpeg -y -i monkeygun.mp3 -i null2.mp3 -i reverbIR.wav -filter_complex "[0:0][1:0]concat=n=2:v=0:a=1[r1out],[r1out][2:0]afir=wet=7:dry=9" out17.mp
                    //'-i reverbIR.wav -i null2.mp3'
                    //return {add: 'reverb', filter: `[null2]concat=n=2:v=0:a=1[${randLink}],[${randLink}][reverb]afir=wet=7:dry=9`};
                    //inputs.push({input: 'reverb', sound: 'reverbIR.wav'});
                    // inputs.push({input: 'reverb', sound: 'TunnelToHell.wav'});
                    // inputs.push({input: 'reverb', sound: 'GraffitiHallway.wav'});
                    inputs.push({input: 'reverb', sound: 'GalbraithHall.wav'});
                    inputs.push({input: 'null2', sound: 'null2.mp3'});
                }
            }
            
            function parseFilter(f){
                //check if special filter
                if(/^x(\d+)(?:[-:=|](\d+))?$/.test(f)){
                    return filterTable['aloop'].parse(f.match(/^x(\d+)(?:[-:=|](\d+))?$/).slice(1).join(':'));
                } else {
                    let [alias, args] = f.split(/=(.+)/).filter(v=>v);
                    for(let [name, filter] of Object.entries(filterTable)){
                        if(name === alias || filter.aliases.includes(alias)){
                            let ret = '';
                            if(filter.parse){
                                let parse = filter.parse(args);
                                if(typeof parse === 'object'){
                                    return parse;
                                }
                                ret = parse;
                            } else if(args) {
                                ret = `${name}=${args}`;
                            } else {
                                ret = name;
                            }
                            return ret;
                        }
                    }
                    throw new Error(`no filter with alias \`${alias}\` found`);
                }
            }
            
            function parseInput(input){
                return new Promise((resolve, reject) => {
                    if(input.source){
                        input = input.source;
                    }
                    if(RANDOM_SOUND_PATTERN.test(input)){
                        let flag = input.match(RANDOM_SOUND_PATTERN)[5];
                        if(flag){
                            let curRandSounds = bot.dj.runningCommands.get(mori.id).randomSounds;
                            if(curRandSounds && curRandSounds[flag]){
                                return resolve(curRandSounds[flag]);
                            } else {
                                if(!curRandSounds){
                                    bot.dj.runningCommands.get(mori.id).randomSounds = {};
                                }
                                let sound = bot.dj.getRandomSound(guild, input);
                                bot.dj.runningCommands.get(mori.id).randomSounds[flag] = sound;
                                return resolve(sound);
                            }
                        } else {
                            return resolve(bot.dj.getRandomSound(guild, input));
                        }
                    } else if(TTS_SOUND_PATTERN.test(input)){
                        let text = input.match(TTS_SOUND_PATTERN)[1];
                        //let output = getTempFile();
                        //let stream = gtts.stream(text);
                        
                        /* stream.pipe(fs.createWriteStream(output));
                        stream.on('end', () => {
                            console.log('[[tts END]]', text);
                            return resolve(sound);
                        }); */
                        
                        /* gtts.save(output, text, () => {
                            console.log('[[tts END]]', text);
                            return resolve(output);
                        }); */
        
                        let output = googleTTS.getAudioUrl(text);
                        return resolve(output);
                    } else if(URL_PATTERN.test(input)){
                        /*
                        let stream = ytdl(input.match(URL_PATTERN)[1],
                                          ['--format=bestvideo[filesize<10MB]/best'] //TODO: specify audio bitrate(?)/sameplrate(?) (maybe a dynamic filter) to reduce download times
                                         ),
                            token = randToken.generate(6),
                            output = token + '.mp3';
                        
                        let url;
                        
                        stream.on('info', info => {
                            //TODO: probably do a "downloading" or "loading" reaction, this is very easy.
                            //  this could even have a response message where it shows the progress, and updates it
                            //  this is a bit out of scope, but i can suggest it as a feature
                            
                            //unfortunately, i have to assume the entire video needs to be downloaded.
                            //  for filters such as [reverse], the last samples need to be known immediately
                            //  its theoretically possible i can do some heuristic/tree to determine which
                            //  sources (urls to be downloaded)
                            
                            console.log('[[ytdl download START]]', info);
                            url = info.manifest_url;
                        });
                        
                        stream.pipe(fs.createWriteStream(output));
                        
                        stream.on('complete', info => {
                            
                            console.log('[[ytdl download COMPLETE]]', info);
                        });
                        
                        stream.on('end', () => {
                            //TODO: return stream + filename (?) i actually dont know how this is going to work.
                            //  it may require parseInput to return a promise itself, and have another async layer. god damn
                            console.log('[[ytdl download END]]');
                            setTimeout(()=>{
                                
                            return resolve(url || output); //TODO: return video name/etc. as well? i dont know if thst's necessary
                            }, 1000);
                        });
                        */
                        /*
                        let origin = input.match(URL_PATTERN)[1];
                        if(!origin.includes('http')){
                            origin = 'http://' + origin;
                        }
                        info(message, null, '🔄');
                        
                        ytdl.getInfo(origin, (err, fileInfo) => {
                            
                            //console.log('!!!!!!', err, fileInfo);
                            
                            if(err){
                                return reject(err);
                                return reject(err);
                            }
                            
                            
                            if(!fileInfo){
                                return reject('could not find audio stream from url');
                            }
                            
                            let formats = [];
                            
                            if(Array.isArray(fileInfo)){
                                formats = fileInfo[0].formats;
                            } else {
                                formats = fileInfo.formats;
                            }
                            
                            if(!formats || !formats[0] || !formats[0].url){
                                if(fileInfo.url){
                                    return resolve(fileInfo.url);
                                }
                                return reject('could not find audio stream from url');
                            }
                            
                            return resolve(formats[0].url);
                            
                        });
                        */
                        let origin = input.match(URL_PATTERN)[1];
                        if(!origin.includes('http')){
                            origin = 'http://' + origin;
                        }
                        mori.info(null, '🔄');
                        /* ytdl.getInfo(origin, (err, fileInfo) => {
                            
                            console.log('!!!!!!', err, fileInfo);
                        }); */
                        /* 
                        let stream = ytdl(origin
                                          //,['--format=bestvideo[filesize<10MB]/best'] //TODO: specify audio bitrate(?)/sameplrate(?) (maybe a dynamic filter) to reduce download times
                                         ),
                            output = getTempFile();
                        
                        //let url;
                        
                        stream.on('info', info => {
                            //TODO: probably do a "downloading" or "loading" reaction, this is very easy.
                            //  this could even have a response message where it shows the progress, and updates it
                            //  this is a bit out of scope, but i can suggest it as a feature
                            
                            //unfortunately, i have to assume the entire video needs to be downloaded.
                            //  for filters such as [reverse], the last samples need to be known immediately
                            //  its theoretically possible i can do some heuristic/tree to determine which
                            //  sources (urls to be downloaded)
                            
                            console.log('[[ytdl download START]]', info);
                            //url = info.manifest_url;
                        });
                        
                        stream.pipe(fs.createWriteStream(output));
                        
                        stream.on('complete', info => {
                            
                            console.log('[[ytdl download COMPLETE]]', info);
                        });
        
                        stream.on('error', err => {
                            message.reactions.each(v => {
                                if(v.emoji.toString() === '🔄'){
                                    message.reactions.removeAll();
                                }
                            })
                            return reject(err);
                        })
                        
                        stream.on('end', () => {
                            //TODO: return stream + filename (?) i actually dont know how this is going to work.
                            //  it may require parseInput to return a promise itself, and have another async layer. god damn
                            console.log('[[ytdl download END]]');
                            setTimeout(()=>{
                                message.reactions.each(v => {
                                    if(v.emoji.toString() === '🔄'){
                                        message.reactions.removeAll();
                                    }
                                })
                                return resolve(output); //TODO: return video name/etc. as well? i dont know if thst's necessary
                            }, 1000);
                        });
                        
                        //TODO: i believe (need to test more) that ytdl takes longer to download url-based files
                        //  than ffmpeg. i should be using ytdl only when i dont know if the url points to a file
                        //  so, check for file extension and use ffmpeg.
                        //  this may require a dictionary of known acceptable filetypes (audio, video?)
                        //  i should theoretically accept video files as well, since they contain audio
                        //  if this is the case, i need a special case to strip just the audio track from the file
                        //  perhaps there is a simple ffmpeg flag to only take audio from a source
                         */
        
                        let output = bot.getTempFile();
                        ytdl(origin, {
                            output,
                            x: true,
                            audioFormat: 'mp3',
                        }).then(out => {
                            console.log(out);
                            return resolve(output);
                        }).catch(err => {
                            console.log(err);
                            return reject(err);
                        });
                    } else {
                        return resolve(bot.dj.getSound(guild, input));
                    }
                });
            }
            
            function convert(arr){
                let curGroup = [],
                    curFilters = [],
                    output = '';
                for(let i = 0; i < arr.length; i++){
                    if(Array.isArray(arr[i])){
                        nestedAction.unshift('concat');
                        output = convert(arr[i]);
                    } else if(arr[i].group && Array.isArray(arr[i].group)){
                        nestedAction.unshift('concat');
                        if(arr[i].filters){
                            curFilters.push(...arr[i].filters);
                        }
                        output = convert(arr[i].group);
                    } else if(arr[i].merge && Array.isArray(arr[i].merge)){
                        nestedAction.unshift('merge');
                        if(arr[i].filters){
                            curFilters.push(...arr[i].filters);
                        }
                        output = convert(arr[i].merge);
                    } else if(arr[i].sidechain && Array.isArray(arr[i].sidechain)){
                        nestedAction.unshift('sidechain');
                        if(arr[i].filters){
                            curFilters.push(...arr[i].filters);
                        }
                        output = convert(arr[i].sidechain);
                    } else if(arr[i].sidechaininv && Array.isArray(arr[i].sidechaininv)){
                        nestedAction.unshift('sidechaininv');
                        if(arr[i].filters){
                            curFilters.push(...arr[i].filters);
                        }
                        output = convert(arr[i].sidechaininv);
                    } else {
                        output = '' + index++;
                        
                        let sound = parseInput(arr[i]); //this is now a promise
                        inputs.push({input: output, sound});
                    }
                    curGroup.push(output);
                    curFilters.forEach(f => {
                        let parse = parseFilter(f),
                            filter = parse.filter || parse;
                        if(parse.add && adjustments[parse.add]){
                            adjustments[parse.add]();
                            parse = parse.filter;
                        }
                        filters.push(`[${output}]${parse}[${output}]`)
                    });
                    curFilters = [];
                }
                
                //dont do this top-level
                if(curGroup.length > 1){
                    output = '' + index++;
                    if(nestedAction[0] === 'concat'){
                        filters.push(`${curGroup.map(g => `[${g}]`).join('')}concat=n=${curGroup.length}:v=0:a=1[${output}]`);
                    } else if(nestedAction[0] === 'merge') {
                        filters.push(`${curGroup.map(g => `[${g}]`).join('')}amix=inputs=${curGroup.length}:duration=longest:dropout_transition=60[${output}];[${output}]volume=${curGroup.length}[${output}]`);
                    } else if(nestedAction[0] === 'sidechain'){
                        filters.push(`${curGroup.map(g => `[${g}]`).join('')}sidechaincompress=ratio=20:threshold=0.08:detection=peak[${output}]`);
                    } else if(nestedAction[0] === 'sidechaininv'){
                        filters.push(`${curGroup.map(g => `[${g}]`).join('')}sidechaingate=detection=peak[${output}]`);
                    } else {
                        console.error("unknown nested action");
                    }
                }
                
                nestedAction.shift();
                return output;
            }
            
            let out = convert(arr);
            
            let requests = inputs.map(s => s.sound);
            
            console.log({requests});
            
            return new Promise((resolve, reject) => {
                Promise.all(requests).then(soundRequests => {
                    Promise.all(soundRequests).then(sounds => {
                        
                        //TODO: if(typeof sound === 'object') then it's a random return, so save the name and
                        //  compile info() result of all returned names
                        let randResults = [];
                        //let curRandSounds = runningCommands.get(message.id).randomSounds || {};
                        sounds = sounds.map((v, i) => {
                            if(typeof v === 'object'){
                                //console.log(v.flag, curRandSounds[v.flag]);
                                //if(v.flag === undefined || !curRandSounds[v.flag]){
                                    let r = {...v};
                                    console.log(r, i, idx);
                                    r.idx = idx + i / 1000;
                                    console.log('=====', r);
                                    randResults.push(r); //link, name, flag
                                //}
                                return v.link;
                            } else {
                                return v;
                            }
                        });
                        
                        let ins = sounds.join(' -i ');
                        let pipes = inputs.map((v, i) => `[${i}:a]acopy[${v.input}]`);
                        let ret = '';
                        if(filters.length > 0){
                            filters[filters.length-1] = filters[filters.length-1].replace(/\[[^\[\]]+\]$/, '');
                            ret = `${ins} -filter_complex ${pipes.join(';')};${filters.join(';')}`;
                        } else {
                            ret = ins;
                        }
                        console.log({filters});
                        
                        let curRandResults = bot.dj.runningCommands.get(mori.id).randomResults;
                        if(curRandResults && curRandResults.length > 0){
                            curRandResults.push(...randResults);
                        } else {
                            bot.dj.runningCommands.get(mori.id).randomResults = [...randResults];
                        }
                        //info(message, randResults.map(v => (v.flag ? v.flag + ': ' : '') + v.name).join('\n'));
                        
                        console.log('::FINAL:', {ret});
                        // can run out of sequence, won't work unless i do some index placement shit.
                        /*if(idx === 0){
                            setQueue(guild, ret);
                        } else {
                            addToQueue(guild, ret);
                        }*/
                        return resolve(ret);
                        
                    }).catch(reject);
                }).catch(reject);
            });
        
        },

        getSoundLength(input){
            return new Promise((resolve, reject) => {
                console.log({input});
                
                let output = bot.getTempFile();
                
                let setup = spawn('ffmpeg', [
                    '-i', ...input.split(' '),
                    output
                ]);
                
                setup.stdout.on('end', res => {
                    let ffmpeg = spawn('ffprobe', [
                        '-v', 'error',
                        '-show_entries', 'format=duration',
                        '-of', 'default=noprint_wrappers=1:nokey=1',
                        output
                    ]);
                    
                    ffmpeg.stdout.on('data', res => {
                        return resolve(res.toString().trim());
                    });
                    
                    ffmpeg.stderr.on('data', d => {
                        return resolve(d.toString().trim());
                    });
                }); 
            });
        },
        
        makeSoundFile(input){
            return new Promise((resolve, reject) => {
                console.log({input});
                
                let output = bot.getTempFile();
                
                let setup = spawn('ffmpeg', [
                    '-i', ...input.split(' '),
                    output
                ]);
                
                setup.stdout.on('end', res => {
                    return resolve(output);
                }); 
            });
        }
    }
};