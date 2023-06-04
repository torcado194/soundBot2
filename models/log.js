const mongoose = require('mongoose');

let logSchema = mongoose.Schema({
    guildId      : String, //id of guild
    username     : String, //username of user
    userId       : String, //id of user
    soundName    : String, //name of changed sound
    newName      : String, //new name of renamed sound, if applicable
    action       : String, //one of "add", "remove" (and later possibly "rename", etc.)
    date         : Date,   //date sound was changed
});


module.exports = mongoose.model('Log', logSchema);