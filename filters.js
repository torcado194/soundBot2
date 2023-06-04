let filterTable = {
    asetrate: {
		aliases: ['speed', 's'],
        help: {
            text: 'change speed (and pitch) of sound'
        },
		parse(a = 1){
            return `aresample=44100,asetrate=${parseFloat(a) * 44100}`;
		},
        random(){
            return filterTable['asetrate'].parse(rand(0.333, 3));
        }
	},
    pitch: {
        aliases: ['pitch', 'p'],
        help: {
            text: 'change pitch (without changing speed) of sound'
        },
        parse(a = 1){
            a = parseFloat(a) || 0;
            if(a < 0.1 || a > 2){
                throw new Error('pitch value must be in the range [0.1 - 2]')
            }
            let c = (1+4)-(16/(a+3));
            return `aresample=44100,asetrate=${a * 44100},atempo=${1 / a}`;
        },
        random(){
            return filterTable['pitch'].parse(rand(0.333, 2));
        }
    },
	areverse: {
		aliases: ['reverse', 'r'],
        help: {
            text: 'reverse sound'
        },
        random(){
            return 'areverse';
        }
	},
	vibrato: {
		aliases: ['vibrato', 'vibrate', 'wobble', 'w'],
        help: {
            text: 'add vibrato to sound'
        },
        random(){
            return 'vibrato';
        }
	},
	volume: {
		aliases: ['volume', 'vol', 'v'],
        help: {
            text: 'change volume of sound. 1 is normal'
        },
        random(){
            return 'volume=' + rand(0.5, 4);
        }
	},
	atempo: {
		aliases: ['tempo', 't'],
        help: {
            text: 'change tempo of sound'
        },
        parse(a = 1){
            a = parseFloat(a) || 0;
            if(a < 0.5 || a > 100){
                throw new Error('tempo value must be in the range [0.5 - 100]')
            }
            return `atempo=${a}`;
        },
        random(){
            return 'atempo=' + rand(0.5, 3);
        }
	},
    adelay: {
        aliases: ['delay', 'd'],
        help: {
            text: 'add delay before sound plays in milliseconds.'
        },
        parse(d = 0){
            return `adelay=${d + '|' + d}`;
        },
        random(){
            return filterTable['adelay'].parse(rand(100, 1500));
        }
    },
    aecho: {
        aliases: ['echo', 'e'],
        help: {
            text: 'add echo to sound, single parameter sets delay between echos in milliseconds (default is 200)'
        },
        parse(delay){
            //aecho=1.0:0.75:200|400|600:0.5|0.25|0.1
            delay = parseFloat(delay) || 200;
            let count = 4,
                decay = 0.75,
                delayList = (new Array(count)).fill(0).map((_,i) => (i+1)*delay).join('|'),
                s = 1 / (count + 1),
                decayList = (new Array(count)).fill(0).map((_,i) => (((1+s) / (i+2)) - s).toFixed(3)).join('|'),
                list = `1.0:${decay}:${delayList}:${decayList}`;
            return `aecho=${list}`;
        },
        random(){
            return filterTable['aecho'].parse(rand(80, 800));
        }
    },
    lowpass: {
        aliases: ['lowpass', 'l'],
        help: {
            text: 'apply lowpass filter at specified frequency (default is 500)'
        },
        random(){
            return 'lowpass=' + rand(150, 3000);
        }
    },
    highpass: {
        aliases: ['highpass', 'h'],
        help: {
            text: 'apply highpass filter at specified frequency (default is 3000)'
        },
        random(){
            return 'highpass=' + rand(300, 8000);
        }
    },
    chorus: {
        aliases: ['chorus', 'cho', 'ch'],
        help: {
            text: 'add chorus effect to sound'
        },
        parse(){
            return `chorus=0.5:0.9:50|60|40:0.4|0.32|0.3:0.25|0.4|0.3:2|2.3|1.3`;
        },
        random(){
            return filterTable['chorus'].parse();
        }
    },
    pan: {
        aliases: ['pan'],
        help: {
            text: 'pan audio left (-100) or right (100)'
        },
        parse(dir = ''){
            dir = parseInt(dir) || 0;
            dir = (dir+101) / 202;
            return `pan=stereo|c0=${1-dir}*c0|c1=${dir}*c1`;
        },
        random(){
            return filterTable['pan'].parse(rand(-100, 100));
        }
    },
    apulsator: {
        aliases: ['pulsator', 'pulse', 'pul', 'autopan', 'ap'],
        help: {
            text: 'autopan at a specified frequency'
        },
        parse(frequency){
            frequency = parseFloat(frequency) || 1;
            return `apulsator=hz=${frequency}`;
        },
        random(){
            return filterTable['apulsator'].parse(rand(1, 10));
        }
    },
    oldreverb: {
        aliases: ['oldreverb', 'orvb', 'orv'],
        help: {
            text: 'add reverb. can take two parameters separated by `:` or `-`, the first is wet gain and second is dry gain'
        },
        parse(amps = ''){
            let [wet, dry] = amps.split(/[-:=|]/);
            wet = parseFloat(wet) || 1;
            dry = parseFloat(dry) || 1;
            //return {add: 'reverb', filter: `afir=wet=7:dry=9`};
            //let randLink = Math.random().toString(36).substring(7);
            //console.log({randLink});
            return {add: 'reverb', filter: `[null2]concat=n=2:v=0:a=1[a],[a][reverb]afir=gtype=gn:wet=${wet * 0.375}:dry=${dry * 0.75}`};
        },
        random(){
            //return filterTable['afir'].parse(rand(0.5, 3), rand(0.5, 3));
            return '';
        }
    },
    reverb: {
        aliases: ['reverb', 'rvb', 'rv'],
        help: {
            text: ''
        },
        parse(amps = ''){
            let [size, gain] = amps.split(/[-:=|]/);
            size = parseFloat(size);
            size = (size || size === 0) ? size : 20;
            gain = parseFloat(gain);
            gain = (gain || gain === 0) ? gain : 1;
            let length = 10 + (size/100) * (4000 - 10);
            //return {add: 'reverb', filter: `afir=wet=7:dry=9`};
            //let randLink = Math.random().toString(36).substring(7);
            //console.log({randLink});
            let reverbSrc = `anoisesrc=d=${length}ms,afade=d=${length}ms:curve=par,areverse`;
            return `apad=pad_dur=${length}ms[a];${reverbSrc}[reverb];[a][reverb]afir=gtype=gn:wet=${gain * 0.9}:dry=${gain * 0.9}`;
        },
        random(){
            //return filterTable['afir'].parse(rand(0.5, 3), rand(0.5, 3));
            return '';
        }
    },
    atrim: {
        aliases: ['trim', 'cut', /* 'clip', */ 'c', 'keep', 'k'],
        help: {
            text: 'keep a slice of the sound from and/or to specified times in milliseconds. `start` and `end` (or any other non-number) can take the place of a start or end time to default to the beginning or end of the sound. providing only one number defaults it to the `end` cut time'
        },
        parse(args = ''){
            args = args.split(/[-:|]/);
            let [start, end] = args;
            if(start && end === undefined){
                end = parseFloat(start);
                start = undefined;
            } else {
                start = parseFloat(start);
                end = parseFloat(end);
            }
            return `atrim=${(start ? `start=${start/1000}:` : '') + (end ? `end=${end/1000}` : '')}`;
        },
        random(){
            return filterTable['atrim'].parse(rand(100, 400) + ':' + rand(300, 800));
        }
    },
    aloop: {
        aliases: ['repeat', 'rep', 'loop'],
        help: {
            text: 'repeat sound n times with d delay between sounds in ms. can also be used like `sound[x10]`, `sound[x7:100]`, etc.'
        },
        parse(args = '1'){
            args = args.split(/[-:=|]/);
            let [count, delay] = args;
            count = parseInt(count) || 1;
            //count -= 1;
            console.log({delay});
            //TODO: revert to old method when no delay specified
            let randLink = Math.random().toString(36).substring(7);
            if(delay){
                let inputs = '';
                let delays = (new Array(count)).fill(0).map((v, i) => {
                    inputs += `[${randLink}${i}]`
                    return `[${randLink}${i}]adelay=${i*delay}|${i*delay}[${randLink}${i}]`;
                });
                return `asplit=${delays.length}${inputs};${delays.join(';')};${inputs}amix=inputs=${delays.length}:duration=longest:dropout_transition=60,volume=${delays.length}`;
            } else {
                count -= 1;
                return `aloop=loop=${count}:size=1000000000`; //alright..
            }
        },
        random(){
            return filterTable['aloop'].parse(Math.floor(rand(1, 18)) + ':' + rand(20, 400));
        }
    },
    fadein: {
        aliases: ['fadein', 'fi'],
        help: {
            text: 'fade sound in for n milliseconds. can also specify the curve shape as a second parameter, see: https://ffmpeg.org/ffmpeg-filters.html#afade-1'
        },
        parse(args = '1000'){
            let [d, curve] = args.split(/[-:=|]/);
            let dur = parseFloat(d);
            curve = curve || 'cub';
            return `afade=t=in:curve=${curve}:d=${dur / 1000}`;
        },
        random(){
            return filterTable['fadein'].parse(rand(50, 1500));
        }
    },
    fadeout: {
        aliases: ['fadeout', 'fo'],
        help: {
            text: 'fade sound out for n milliseconds. can also specify the curve shape as a second parameter, see: https://ffmpeg.org/ffmpeg-filters.html#afade-1'
        },
        parse(args = '1000'){
            let [d, curve] = args.split(/[-:=|]/);
            let dur = parseFloat(d);
            curve = curve || 'cub';
            return `areverse,afade=t=in:curve=${curve}:d=${dur / 1000},areverse`;
            //return `afade=t=out:d=${dur / 1000}`;
        },
        random(){
            return filterTable['fadeout'].parse(rand(50, 1500));
        }
    },
    silencetrim: {
        aliases: ['silencetrim', 'siltrim', 'strim', 'silencestop', 'sils'],
        help: {
            text: 'trim silence from the beginning and end of the sound, making it shorter'
        },
        parse(){
            let sil = `silenceremove=start_periods=1:start_threshold=0.008:detection=peak`;
            return `${sil},areverse,${sil},areverse`;
        },
        random(){
            return filterTable['silencetrim'].parse();
        }
    },
    silenceremove: {
        aliases: ['silence', 'sil', 'silenceall'],
        help: {
            text: 'remove silence from anywhere in the sound, making it shorter'
        },
        parse(args = '0.008'){
            let threshold = parseFloat(args);
            threshold = threshold || 0.008;
            return `silenceremove=stop_periods=-1:stop_duration=0.02:stop_threshold=${threshold}:detection=peak`;
        },
        random(){
            return filterTable['silenceremove'].parse(rand(0.01, 0.6));
        }
    },
    afftdn: {
        aliases: ['afftdn', 'denoise', 'dn'],
        help: {
            text: 'remove background noise from sound. takes a strength value from 0 to 100'
        },
        parse(args = '100'){
            let strength = parseFloat(args);
            strength = (strength || strength === 0) ? strength : 100;
            strength = Math.max(0, Math.min(100, strength));
            strength /= 100;
            let nr = 1 + (97 - 1) * strength;
            let nf = -80 + (-20 - (-80)) * strength;
            return `afftdn=nr=${nr}:nf=${nf}`;
        },
        random(){
            return filterTable['afftdn'].parse(rand(0, 100));
        }
    },
    agate: {
        aliases: ['gate', 'gt'],
        help: {
            text: 'applies a noise gate to the sound. takes a threshold value from 0 to 100, e.g. 50 means any audio below 50% volume is set to 0'
        },
        parse(args = '100'){
            let threshold = parseFloat(args);
            threshold = (threshold || threshold === 0) ? threshold : 20;
            threshold = threshold/100;
            return `agate=threshold=${threshold}:ratio=100:range=0`;
        },
        random(){
            return filterTable['agate'].parse(rand(0, 100));
        }
    },
    asoftclip: {
        aliases: ['softclip', 'clip', 'sc'],
        help: {
            // text: 'applies a smooth clipping effect to the sound. takes a threshold value in dB, any audio above which is clipped'
            text: 'applies a smooth clipping effect to the sound'
        },
        parse(args = '1'){
            let threshold = parseFloat(args);
            threshold = (threshold || threshold === 0) ? threshold : 1;
            // return `asoftclip=type=atan:threshold=${threshold}`;
            return `asoftclip=type=atan`;
        },
        random(){
            return filterTable['asoftclip'].parse();
        }
    },
    earwax: {
        aliases: ['earwax', 'ear', 'ew'],
        help: {
            text: '"Make audio easier to listen to on headphones"'
        },
        parse(){
            return `earwax`;
        },
        random(){
            return filterTable['earwax'].parse();
        }
    },
    stereowiden: {
        aliases: ['stereowiden', 'stereo', 'widen', 'sw'],
        help: {
            // text: 'enhances the stereo effect by delaying the left and right signals and suppressing common signal. takes a delay value in ms between 0-100, and a crossfeed value between 0-0.8'
            text: 'enhances the stereo effect by delaying the left and right signals and suppressing common signal. takes a delay value in ms between 0-100'
        },
        parse(args = '20:0.3'){
            let [delay, crossfade] = args.split(/[-:=|]/);
            delay = parseFloat(delay);
            delay = (delay || delay === 0) ? delay : 20;
            crossfade = parseFloat(crossfade);
            crossfade = (crossfade || crossfade === 0) ? crossfade : 0.3;
            // return `stereowiden=delay=${delay}:crossfade=${crossfade}`;
            return `stereowiden=delay=${delay}`;
        },
        random(){
            return filterTable['stereowiden'].parse(`${rand(0,100)}:${rand(0,0.8)}`);
        }
    },
    aphaser: {
        aliases: ['phaser', 'ph'],
        help: {
            text: 'adds a phaser effect to sound. takes a speed value in Hz between 0.1-2 and a decay value between 0-0.99 **WARNING setting a decay value too close to the max will cause some (loud) sounds to create totally broken audio**'
        },
        parse(args = '0.5:0.4'){
            let [speed, decay] = args.split(/[-:=|]/);
            speed = parseFloat(speed);
            speed = (speed || speed === 0) ? speed : 0.5;
            decay = parseFloat(decay);
            decay = (decay || decay === 0) ? decay : 0.4;
            return `aphaser=speed=${speed}:decay=${decay}`;
        },
        random(){
            return filterTable['aphaser'].parse(`${rand(0.1,2)}:${rand(0,0.8)}`);
        }
    },
    flanger: {
        aliases: ['flanger', 'fl'],
        help: {
            text: 'adds a flanger effect to sound. takes a speed value in Hz between 0.1-10 and a depth value between 0-10'
        },
        parse(args = '2:8'){
            let [speed, depth] = args.split(/[-:=|]/);
            speed = parseFloat(speed);
            speed = (speed || speed === 0) ? speed : 2;
            depth = parseFloat(depth);
            depth = (depth || depth === 0) ? depth : 8;
            return `flanger=speed=${speed}:depth=${depth}:width=80`;
        },
        random(){
            return filterTable['flanger'].parse(`${rand(0.1,10)}:${rand(0,10)}`);
        }
    },
    random: {
        aliases: ['random', 'rand'],
        help: {
            text: 'apply a random set of filters. can accept a parameter defining the number of filters to apply'
        },
        parse(args = ''){
            args = parseInt(args);
            let count = (args > 0 && args) || Math.floor(1 + Math.random() * (5 - 1));
            let filters = [...filterList],
                banned = ['random', 'afir'];
            filters = filters.filter(name => !banned.includes(name));
            while(filters.length > count){
                filters.splice(Math.floor(Math.random() * filters.length), 1);
            }
            filters = filters.map(name => {
                return filterTable[name].random();
            });
            return filters.join(',');
        }
    },
}
let filterList = Object.keys(filterTable);

module.exports = {filterTable, filterList};