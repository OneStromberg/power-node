var five = require("johnny-five");
var board = new five.Board({repl:false});
var CronJob = require('cron').CronJob;

new CronJob('0 */15 * * * *', () => {
  console.log('every 15 what?')
}, ()=>{}, true);

const onBoardHandler = () => {

  const r1 = new five.Relay(11);
  const r2 = new five.Relay(10);

  var waterJob = new CronJob('0 */15 * * * *', () => {
      r1.on();
      setTimeout(() => {
        r2.off();
      }, 3 * 1000);
    }, () => {
      r1.off();
    },
    true
  );

  var lightJobOn = new CronJob('0 0 21 * * *', () => {
      r2.on();
    }, () => {

    },
    true
  );

  var lightJobOff = new CronJob('0 0 9 * * *', () => {
      r2.off();
    }, () => {
      
    },
    true
  );
}

board.on("ready", onBoardHandler);
