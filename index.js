var five = require("johnny-five");
var board = new five.Board({repl:false});
var ipc = require('node-ipc');

var r1, r2;

ipc.config.id   = 'board';
ipc.config.retry = 1500;

/*ipc.connectTo(
    'world',
    function(){
        ipc.of.world.on(
            'connect',
            function(){
                ipc.log('## connected to world ##'.rainbow, ipc.config.delay);
                ipc.of.world.emit(
                    'message',  //any event or message type your server listens for
                    'hello'
                )
            }
        );
        ipc.of.world.on(
           'disconnect',
            function(){
                ipc.log('disconnected from world'.notice);
            }
        );
        ipc.of.world.on(
            'message',  //any event or message type your server listens for
            function(data){
		if (r1){
			r1.toggle();
		}
                ipc.log('got a message from world : '.debug, data);
            }
        );
    }
);*/

var to = -1;

var _autoWatering = (flag, callback) => {
  clearTimeout(to);
  to = setTimeout(()=> {
    callback(flag);
    _autoWatering(!flag, callback);
  }, flag ? 20 * 1000 * 60 : 3 * 1000 * 60);
}

board.on("ready", function() {
  r1 = new five.Relay(11);
  r2 = new five.Relay(10);
  
  var col0 = new five.Button({
    pin:5,
    isPullup: true,
    invert: true
  });
  
  var led = new five.Led(13);
  led.off();

  var autoWatering = function(callback){
    if (callback) {
      if (to == -1){
        led.on();
        _autoWatering(true, callback);
      } else {
        led.off();
        clearInterval(to);
      }
    }
  }

  var col1 = new five.Button({
    pin:4,
    isPullup: true,
    invert: true
  });

  var col2 = new five.Button({
    pin:3,
    isPullup: true,
    invert: true
  });

  var buttons = new five.Buttons([col0, col1, col2]);

  buttons.on("hold", function() {
    console.log( "Button held" );
  });

  buttons.on("down", function(e) {
    if( e.pin == 4){
      r1.toggle()
    } else if (e.pin == 5) {
      r2.toggle();
    } else if (e.pin == 3) {
      autoWatering((value) => {
        value ? r2.on() : r2.off();
      })
    }
  });

});
