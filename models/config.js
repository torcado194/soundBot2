const mongoose = require('mongoose');

let configSchema = mongoose.Schema({
    guildId         : String,  //id of guild this config is for
    prefix          : String,  //command prefix
    status          : String,  //bot status, for persistence across logout/login
    commandChannels : [String],  //id of the channel that allows commands
    leaveSound : String,  //name of the leave sound
    autoDisconnect  : {type: Boolean, default: true}, //whether or not bot automatically leaves vc after 15 minutes 
});


module.exports = mongoose.model('Config', configSchema);