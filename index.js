var five = require("johnny-five");
var board = new five.Board({repl:false});
var ipc = require('node-ipc');

ipc.config.id   = 'board';
ipc.config.retry = 1500;

//Atomatization call builds on query
var to = -1;
var auto = function(value, element){

  const _auto = (iterator, callback) => {
    clearTimeout(to);
    var t = value[iterator % value.length];
    to = setTimeout(()=> {
      callback(t > 0);
      _auto(++iterator, callback);
    }, Math.abs(parseInt(t)) * 1000 * 60);
  }

  if (value){
    clearTimeout(to);
    _auto(0, (v) => {
      element.modificator(v);
    });
  } else {
    clearTimeout(to);
    to = 1;
  }
}

const message = (type, payload = null) => {
    return {
        node: ipc.config.id,
        type: type,
        payload: payload
    }
}

const buildElement = (element, modificator) => {
  return {element, modificator}
}

const buildReleyElement = (relay) => {
  return buildElement(relay, (value) => {
      ipc.of.world.emit('message', message('api', {pin:relay.pin, value: value}));
      if (relay){
        if (value){
          relay.on();
        } else {
          relay.off();
        }
      }
  });
}

board.on("ready", function() {

  const r1 = new five.Relay(11);
  const r2 = new five.Relay(10);

  const interface = {}
  interface['r1'] = buildReleyElement(r1);
  interface['r2'] = buildReleyElement(r2);
  interface['auto(r1)'] = buildElement(null, (value) => auto(value, buildReleyElement(r1)))
  interface['auto(r2)'] = buildElement(null, (value) => auto(value, buildReleyElement(r2)))

  ipc.connectTo(
      'world',
      function(){
          ipc.of.world.on(
              'connect',
              function(){
                  ipc.of.world.emit(
                      'message',  //any event or message type your server listens for
                      message('connect')
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
              (data) => {
                  if (data.node == "api" && data.type == "board"){
                    var el = interface[data.payload.key];
                    if (el){
                      el.modificator(data.payload.value);
                    }
                  }
              }
          );
      }
  );

  var col0 = new five.Button({
    pin:5,
    isPullup: true,
    invert: true
  });
  
  const led = new five.Led(13);
  led.off();

  var col1 = new five.Button({
    pin: 4,
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
    if(e.pin == 4){
      r1.toggle()
    } else if (e.pin == 5) {
      r2.toggle();
    } else if (e.pin == 3) {
      auto([-20, 3],  buildReleyElement(r1))
    }
  });
});
