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

router.get("/price", function(req, res){
  console.log('PRICE: GET');
  Location.getAllLocations(function(cb){
      console.log(cb);
      res.render('updPrice', {locations: cb});
  });
});

router.post("/price", function(req, res){
  console.log("PRICE: POST");
	console.log(req.body);
  var err = []
  if (!req.body.ori) {err.push('Origin cannot be Blank.');}
  if (!req.body.dest) {err.push('Destination cannot be Blank.');}
  if (!req.body.wgt) {err.push('Weight Price cannot be Blank.');}
  if (!req.body.vol) {err.push('Volume Price cannot be Blank.');}
  console.log(err);
  if (err.length) {
    Location.getAllLocations(function(cb){
      console.log(cb);
      res.render('updPrice', {error: err, locations: cb});
    });
    // res.render('updPrice', {error: err});
  } else {
    // this means that there is nothing wrong, so we can be do the actual work
    var ori, dest;
    console.log('getting origin');
    Location.getLocationByName(req.body.ori, function(location){
      var ori = location;
      console.log(ori);
      console.log('getting destination');
      Location.getLocationByName(req.body.dest, function(location){
        var dest = location;
        console.log(dest);
        if (!ori){
          console.log('Origin: {' + req.body.ori +'} not in database, aborting');
        } else if (!dest){
          console.log('Destination: {' + req.body.dest +'} not in database, aborting');
        } else {
          console.log("We hav enough information to add/update a customer price");
          var price; // do these return an object?
          // getPriceByOriginAndDestination(ori, dest, function(priceCB){
            // var price = priceCB;
            console.log(price);
            if (price){
              // updateCustomerPrice(price,
              //                    {origin: ori,
              //                     destination: dest,
              //                     weightcost: req.body.wgt,
              //                     volumecost: req.body.vol,
              //                     priority: req.pri},
              //                     function(callback){ });
            } else {
              // insertCustomerPrice({origin: ori,
              //                     destination: dest,
              //                     weightcost: req.body.wgt,
              //                     volumecost: req.body.vol,
              //                     priority: req.pri},
              //                     function(callback){ });

            }
            // do stuff for log file?
            Location.getAllLocations(function(cb){
                console.log(cb);
                res.render('updPrice', {locations: cb});
            });
            return;
          // })
          // turn priority into something usefull
        }
      })
    })
    // we want to do something if ori and dest have no value
  	Location.getAllLocations(function(cb){
        console.log(cb);
        res.render('updPrice', {locations: cb});
    });
  }
});

router.get("/cost", function(req, res){
	console.log('COST');
	// console.log('Origin: ' + req.query.ori);
	// console.log('Destin: ' + req.query.dest);
	// console.log('Compan: ' + req.query.cmpy);
	// console.log('Type  : ' + req.query.pri);
	// console.log('Weight: ' + req.query.wgt);
	// console.log('Volume: ' + req.query.vol);
	// console.log('Day   : ' + req.query.day);
	// console.log('Freque: ' + req.query.freq);
	// console.log('Durati: ' + req.query.dur);
	// verify then do database stuff?
	// res.render('updCost', {});
  Location.getAllLocations(function(cbLoc){
    Company.getAllCompanies(function(cbComp){
      console.log(cbLoc);
      console.log(cbComp);
      res.render('updCost', {locations: cbLoc, companies: cbComp});
    })
  });
});

router.post("/cost", function(req, res){
	console.log(req.body);
	Location.getAllLocations(function(cbLoc){
    Company.getAllCompanies(function(cbComp){
      console.log(cbLoc);
      console.log(cbComp);
      res.render('updCost', {locations: cbLoc, companies: cbComp});
    })
  });
})

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
