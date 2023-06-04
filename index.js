let prefix;
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
    prefix = '==';
} 
if(process.env.NODE_ENV === 'pause') {
    console.log('DEBUG PAUSE');
    setInterval(function() {
        console.log("timer that keeps nodejs processing running");
    }, 1000 * 60 * 60);
} else {
    let bot = new (require('./bot.js'))(prefix);
    
    bot.login();
}