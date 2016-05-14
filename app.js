/*
	Copyright (c) 2016 Team 9: Harman, Neel, Paige, Elliot, David

	Permission is hereby granted, free of charge, to any person, except one that is enrolled
	in SWEN301: Structured Methods at Victoria University of Wellington,
	obtaining a copy of this software and associated documentation files (the "Software"),
	to deal in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

*/


var express = require('express'),
    bodyParser = require('body-parser'),
	  cookieParser = require('cookie-parser'),
    nunjucks = require('nunjucks'),
    assert = require('assert'),
	  session = require('express-session'),
    Database = require('./database/database').Database,
    //following are used to interact with the database.
    Company = require('./database/company'),
    Mail = require('./database/mail'),
    Location = require('./database/location');

    Graph = require('./database/graph');


// Set up express
app = express();
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({secret: 'apparentlythishastobeaverylongsessionsecret'}));

/*
 Configure nunjucks to work with express
 Not using consolidate because I'm waiting on better support for template inheritance with
 nunjucks via consolidate. See: https://github.com/tj/consolidate.js/pull/224
*/
var env = nunjucks.configure('views', {
    autoescape: true,
    express: app
});

var nunjucksEnv = new nunjucks.Environment();

var nunjucksDate = require('nunjucks-date');
nunjucksDate.setDefaultFormat('YYYY-MM-Do, hh:mm:ss');
env.addFilter("date", nunjucksDate);

var router = express.Router();
var database = new Database();
// Homepage
router.get("/", function(req, res) {
	"use strict";
	res.render('index',{});
});


router.get("/graph", function(req, res) {
	"use strict";
  Graph.loadGraph();
	Graph.printAll();
  //Graph.createNodes([]);
  res.render('index',{});
});


router.get("/locations", function(req, res) {
	"use strict";
  Location.getAllLocations(function(result){
  	console.log(result);
  	for(var i = 0; i < result.length; i++){
  		console.log(result[0].name);
    }
  });
  /*
  Other examples
  */
  /*
  Location.getAllLocations(function(locations){
    console.log(locations);
  })
  */
});

router.get("/routes", function(req, res) {
	"use strict";

	var route = {
	 company: 2,
    origin: 1,
    destination: 2,
    type: Air/Land/Sea,
    weightcost: 5,
    volumecost: 6,
    maxweight: 350,
    maxvolume: 50,
    duration: 16,
    frequency: 36,
    day: 0
	};
  Location.getAllLocations(function(result){
  	console.log(result)
  });
  /*
  Other examples
  */
  /*
  Location.getAllLocations(function(locations){
    console.log(locations);
  })
  */
});

router.get("/mails", function(req, res) {
	"use strict"

  var mail = {
    origin: 1,
    destination: 2,
    weight: 50,
    volume: 20,
    priority: "Land",
    totalcustomercost: 500,
    totalbusinesscost: 100
  };
  var date = new Date();


  Mail.getAllMail(function(result){
    console.log(result);

  });
  /*
  Other examples
  */
  /*
  var date = new Date().toISOString();
  Mail.getMailByDate(date, function(rows){
    console.log(rows);
  })
  */

});


// Use the router routes in our application
app.use('/', router);

// Start the server listening
var server = app.listen(3000, function() {
	var port = server.address().port;
	console.log('KPSmart App listening on port %s.', port);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	//TODO: add error.html page --> res.render('error',{err : {message : err.message, error: err}});
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  //TODO: add error.html page --> res.render('error', {err : {message : err.message, error : {}}});
});
