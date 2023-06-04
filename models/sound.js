const mongoose = require('mongoose');

let soundSchema = mongoose.Schema({
    guildId      : String,  //id of guild this sound is stored for
    name         : String,  //name of sound
    aliases      : [String], //aliases of sound name
    link         : String,  //url of sound source
    length       : Number,  //length of the sound in milliseconds
});


soundSchema.statics.random = async function(opts, callback) {
    try{
        let count = await this.countDocuments(opts);
        var rand = Math.floor(Math.random() * count);
        let ret = await this.findOne(opts).skip(rand).exec();
        callback(null, ret);
    } catch(err) {
        return callback(err);
    }
};


module.exports = mongoose.model('Sound', soundSchema);