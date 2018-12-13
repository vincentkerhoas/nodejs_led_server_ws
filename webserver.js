express = require('express');
var app = express();
var http = require('http').Server(app);
var fs = require('fs'); 
var io = require('socket.io')(http) 
var Gpio = require('onoff').Gpio; 
var LED = new Gpio(4, 'out'); 
var url = require('url'); 
const imu = require("node-sense-hat").Imu;
const IMU = new imu.IMU();

//======================================================================
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.static(__dirname + '/www'))
//======================================================================
http.listen(8080); //listen to port 8080
//======================================================================
//					SERVE INDEX
//======================================================================
app.get("/", function(req, res) {
	res.setHeader('Content-type', 'text/xml');
    res.sendFile('index.html');
})
//======================================================================
app.get('/index.html', function (req, res) {
   res.sendFile( __dirname + "/" + "index.html" );
})
//======================================================================
//						SWITCH LED
//======================================================================
app.get("/switch_led/", function(req, res) {
    var q = url.parse(req.url, true);
	var query = q.query;
	var ledS="OFF";
	
    if( query.gpio4 == 'true' ) 
		{
			console.log("query true");
			LED.writeSync(1);
			ledS="ON";
		}	
		else	
		{
			LED.writeSync(0);
			console.log("query false");
			ledS="OFF";
			
		}	
	var date = new Date();      
   	res.setHeader('Content-type', 'text/xml');
    res.render('ajax_led_response', {ledS: ledS, time: date});
})


//======================================================================
// 		Get Pressure and Temperature Measurements with Websocket
//======================================================================
io.sockets.on('connect', function (socket) {// WebSocket Connection
  var it = 0; 
  socket.on('create', function(data) { 
    it =data['iterations'];
    if (it) {
      console.log(it); 
      var sleep = require('system-sleep');
      for(var i=0 ; i < it ; i++)
      {
			
							IMU.getValue((err, data) => {
							  if (err !== null) {
								console.error("Could not read sensor data: ", err);
								return;
							  }

							  console.log("Accelleration is: ", JSON.stringify(data.accel, null, "  "));
							  console.log("Gyroscope is: ", JSON.stringify(data.gyro, null, "  "));
							  console.log("Compass is: ", JSON.stringify(data.compass, null, "  "));
							  console.log("Fusion data is: ", JSON.stringify(data.fusionPose, null, "  "));

							  console.log("Temp is: ", data.temperature);
							  console.log("Pressure is: ", data.pressure);
							  console.log("Humidity is: ", data.humidity);
							  
							  socket.emit('mess_from_server', {'pressure': Number(data.pressure.toFixed(2)), 'temperature' : Number( data.temperature.toFixed(2))});
							  
							});

			sleep(1000); // 1 second
	   }
		
    }
  });
}); 

//======================================================================

process.on('SIGINT', function () { //on ctrl+c
  LED.writeSync(0); // Turn LED off
  LED.unexport(); // Unexport LED GPIO to free resources
  process.exit(); //exit completely
}); 

//======================================================================
