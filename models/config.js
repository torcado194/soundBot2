const mongoose = require('mongoose');

let configSchema = mongoose.Schema({
    guildId         : String,  //id of guild this config is for
    prefix          : String,  //command prefix
    status          : String,  //bot status, for persistence across logout/login
    commandChannels : [String],  //id of the channel that allows commands
    leaveSound : String,  //name of the leave sound
});


module.exports = mongoose.model('Config', configSchema);