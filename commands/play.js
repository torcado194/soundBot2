const { joinVoiceChannel, VoiceConnectionStatus, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { SlashCommandBuilder } = require("discord.js");

const fs = require('fs');
const s = require('stream');

const ytdl = require('youtube-dl-exec');
const ytdlcore = require('ytdl-core');
const youtubedl = require('youtube-dl');
const YoutubeDlWrap = require('youtube-dl-wrap');

const spawn = require('child_process');
const path = require('path');

module.exports = (bot) => {
    let _ = {
        name: 'play',
        aliases: ['sound', 's', 'play', 'p'],
        desc: 'plays a sound or a queue of sounds',
		help: {
			text: 'plays a sound or a queue of sounds, connecting to the voice channel if necessary.\nthis will cancel any currently playing sound/queue. omitting the soundname will simply stop the currently playing sound.\nfilters can be applied to sounds by putting them inside [brackets] at the end of the sound name. check the `filters` section of the help message for more information',  
			examples: [
				bot.prefix + 'play',
				bot.prefix + 'play {sound name | url}',
				bot.prefix + 'play {sound 1} {sound 2} {...}',
				bot.prefix + 'play {sound}[filter]',
				bot.prefix + 'play {sound}[filter1,filter2]',
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
                .setDescription('sound command text')
                .setRequired(false));
    }

    function call(mori){
        mori.respondInfo(
            run(mori, mori.params[0]),
            mori
        );
    }

    function run(mori, input){
        // return new Promise((resolve, reject) => {
            if(!mori.member.voice.channel){
                console.error("not in channel!");
                return Promise.reject('You must be in a voice channel!');
            }
            // bot.dj.queue(interaction.guild, {id:'227172502114271234'}, 'https://www.youtube.com/watch?v=mXVm36pKZCA');
            // bot.dj.queue(interaction, interaction.guild, interaction.member.voice.channel, interaction.member, interaction.options.getString('url'), -1, true);
            if(!input){
                bot.dj.stop(mori.guild);
                return Promise.resolve();
            }
            return bot.dj.playInput(mori, input, false, false);

            // let output = bot.getTempFile();
            // await ytdl("https://www.youtube.com/watch?v=K03MQUWWf0Y", {
            //     output,
            //     x: true,
            //     audioFormat: 'mp3',
            // });

            // let subprocess = ytdl.exec("https://www.youtube.com/watch?v=K03MQUWWf0Y", {
            //     output,
            //     x: true,
            //     audioFormat: 'mp3',
            // });

            // console.log(`Running subprocess as ${subprocess.pid}`)

            // subprocess.stdout.pipe(fs.createWriteStream('stdout.txt'))
            // subprocess.stderr.pipe(fs.createWriteStream('stderr.txt'))




            // var stream = new s.Readable();

            // // var video = youtubedl("https://www.youtube.com/watch?v=K03MQUWWf0Y");
            // var video = spawn(path.resolve(__dirname, '../node_modules/youtube-dl/bin/youtube-dl'), "https://www.youtube.com/watch?v=K03MQUWWf0Y");
            // var size, filename;
        
            // video.on("info", function(info) {
            //     console.log("Download Started", info);
            // });
        
            // video.on('data',(data)=>{
            //     stream.push(data);
            //     // stream.write(data)
            // });
        
            // video.on('end',(end)=>{
            //     console.log('Download end')
        
            //     res.end();
            // });


            //await YoutubeDlWrap.downloadFromWebsite();
            // let stream = ytdlcore('https://www.youtube.com/watch?v=K03MQUWWf0Y', {filter: 'audioonly'});
            let stream = ytdlcore('https://www.youtube.com/watch?v=mXVm36pKZCA', {filter: 'audioonly'});

            // let youtubeDlWrap = new YoutubeDlWrap(path.resolve(__dirname, '../node_modules/youtube-dl/bin/youtube-dl.exe'));
            // let youtubeDlWrap = new YoutubeDlWrap('./youtube-dl');
            // let stream = youtubeDlWrap.execStream(['https://www.youtube.com/watch?v=mXVm36pKZCA', '-f', 'bestaudio']);

            const connection = joinVoiceChannel({
                channelId: '227172502114271234'/* interaction.channel.id */,
                guildId: interaction.channel.guild.id,
                adapterCreator: interaction.channel.guild.voiceAdapterCreator,
            });
    
            connection.on(VoiceConnectionStatus.Ready, async (oldState, newState) => {
                const player = createAudioPlayer();
                const resource = createAudioResource(stream);

                connection.subscribe(player);
                await player.play(resource);

                player.on('error', (error) => console.error(error));
                player.on(AudioPlayerStatus.Idle, () => {
                    console.log(`song's finished`);
                    connection.disconnect();
                });


                // let stream = connection.play(output);
                // stream.streams.ffmpeg.process.stderr.on('data', err => {
                //     console.error(err);
                //     bot.warning(interaction, err);
                // });
                return resolve();
            });
        // })
    }
    
    return _;
};