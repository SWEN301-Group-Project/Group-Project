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
    Mail = require('./database/mail').Mail,
    Location = require('./database/location'),
    Route = require('./database/routes'),
    Price = require('./database/customerprice'),

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


/**
 * Initialise the database.
 */
var database = new Database().init();
Mail = new Mail();



// Homepage
router.get("/", function(req, res) {
	"use strict";

    Mail.getMailStats(function(){
        res.render('index');
    });
});


router.get("/graph", function (req, res) {
    "use strict";
    Graph.loadGraph();
    res.render('index', {});
});


router.get("/locations", function(req, res) {
	"use strict";
    Location.getAllLocations(function(result){
        console.log(result);
        for (var i = 0; i < result.length; i++) {
            console.log(result[i].name);
        }
    });
});

router.get("/routes", function(req, res) {
	"use strict";

    var route = {
        company: 2,
        origin: 1,
        destination: 2,
        type: 'Air / Land / Sea',
        weightcost: 5,
        volumecost: 6,
        maxweight: 350,
        maxvolume: 50,
        duration: 16,
        frequency: 36,
        day: 0
    };
    Location.getAllLocations(function (result) {
        console.log(result)
        res.render(index);
    });
});

router.post("/addMail", function(req,res, next){
   "use strict";
    console.log(req.body);
    var mail = req.body;

    //server-side error checking
    //destination and origin cannot be the same
    if (mail.destination == mail.origin) {
        console.log("error");
        Location.getAllLocations(function (locations) {
            Mail.getAllMail(function (mails) {
                res.status(404);
                res.render('mails', {mailActive: true, mail: mail, mails: mails, locations: locations});
            });
        });
    } else {
        //perform error checking such as determine if route can be calculated
        /*
         If route can be calculated then update the business and customer cost
         Then add mail to event and insert into database
         */
        /**
         * 1. render the confirmation page while sending the mail object
         */
        req.session.mail = mail;
        res.render('confirmMail', {mail: mail, mailActive: true});
    }
});

router.get('/confirmMail', function(req,res){
    //insert mail
    console.log
    var mail = req.session.mail;
    console.log('confirmMail');
    console.log(mail);
    Mail.insertMail(mail, function (result) {
        console.log("mail entered");
        console.log(result);
        Location.getAllLocations(function(locations){
            Mail.getAllMail(function(mails){
                //add notification of mail added successfully
                res.render('mails', {mailActive: true, mailAdded: true, locations: locations, mails: mails});
                req.session.mail = null;
            });
        });
    });
});

router.get("/mails", function(req, res) {
	"use strict"

    Location.getAllLocations(function(locations){
        console.log(locations);
        Mail.getAllMail(function(mails){
            res.render('mails', {mailActive:true, mails:mails, locations:locations});
        });
    });
});

router.get("/price", function(req, res){
  console.log('PRICE: GET');
  Location.getAllLocations(function(cb){
      console.log(cb);
      res.render('updPrice', {priceActive: true, locations: cb});
  });
});

router.post("/price/getprice/:origin/:destination", function(req, res){
  console.log('Origin' + req.params.origin);
  console.log('Destin' + req.params.destination);

  Location.getLocationByName(req.params.origin, function(cbOri){
    Location.getLocationByName(req.params.destination, function(cbDest){
      if (cbOri && cbDest){
        Price.getPriceByOriginAndDestination(cbOri.locationid, cbDest.locationid, function(cbPri){
          console.log(cbPri[0]);
          res.send(cbPri[0]);
        });

      } else {
        res.status('204').send('No Match');
      }
    });
  });
});

router.post("/price", function(req, res){
    console.log("PRICE: POST");
    console.log(req.body);
  var err = []
  if (!req.body.sourceLocation) {err.push('Origin cannot be Blank.');}
  if (!req.body.destLocation) {err.push('Destination cannot be Blank.');}
  if (!req.body.wgt) {err.push('Weight Price cannot be Blank.');}
  if (!req.body.vol) {err.push('Volume Price cannot be Blank.');}
  console.log(err);
  if (err.length) {
    Location.getAllLocations(function(cb){
      console.log(cb);
      res.render('updPrice', {priceActive: true, error: err, locations: cb});
    });
  } else {
    // this means that there is nothing wrong, so we can be do the actual work
    var ori, dest;
    console.log('getting origin');
    Location.getLocationById(req.body.sourceLocation, function(cbOrigin){
      var ori = cbOrigin;
      console.log(ori);
      console.log('getting destination');
      Location.getLocationById(req.body.destLocation, function(cbDest){
        var dest = cbDest;
        console.log(dest);
        if (!ori){
          console.log('Origin: {' + req.body.sourceLocation +'} not in database, aborting');
        } else if (!dest){
          console.log('Destination: {' + req.body.destLocation +'} not in database, aborting');
        } else {
          console.log("We have enough information to add/update a customer price");
          var price; // do these return an object?
          Price.getPriceByOriginAndDestination(ori.locationid, dest.locationid, function(priceCB){
            var price = priceCB;
            console.log('Price: ');
            console.log(priceCB);
            console.log(priceCB==false);
            if (priceCB==false){
              console.log('insert');
              Price.insertCustomerPrice({origin: ori.locationid,
                                  destination: dest.locationid,
                                  weightcost: req.body.wgt,
                                  volumecost: req.body.vol,
                                  priority: req.pri},
                                  function(callback){ });
            } else {
              console.log('update');
              Price.updateCustomerPrice(priceCB.priceid,
                                 {origin: ori.locationid,
                                  destination: dest.locationid,
                                  weightcost: req.body.wgt,
                                  volumecost: req.body.vol,
                                  priority: req.pri},
                                  function(callback){ });
            }
            // do stuff for log file?

/*             Location.getAllLocations(function(cb){
                console.log(cb);
                res.render('updPrice', {priceActive: true, locations: cb});
            });
            return; */
          });
          // turn priority into something usefull
        }
      });
    });
    // we want to do something if ori and dest have no value
  	Location.getAllLocations(function(cb){
        console.log(cb);
        res.render('updPrice', {priceActive: true, locations: cb});
    });
  }
});

router.get("/cost", function(req, res){
	console.log('COST: GET');
  Location.getAllLocations(function(cbLoc){
    Company.getAllCompanies(function(cbComp){
      console.log(cbLoc);
      console.log(cbComp);
      res.render('updCost', {locations: cbLoc, companies: cbComp});
    })
  });
});

router.post("/cost/getcost/:origin/:destination", function(req, res){
  console.log('Origin' + req.params.origin);
  console.log('Destin' + req.params.destination);

  Location.getLocationByName(req.params.origin, function(cbOri){
    Location.getLocationByName(req.params.destination, function(cbDest){
      if (cbOri && cbDest){
        Route.getRouteByOriginAndDestination(cbOri.locationid, cbDest.locationid, function(cbRou){
          console.log(cbRou);
          res.send(cbRou);
        });

      } else {
        res.status('204').send('No Match');
      }
    });
  });
});

router.post("/cost", function(req, res){
  console.log("COST: POST");
	console.log(req.body);

  // verify input
  var err = []
  if (!req.body.sourceLocation) {err.push('Origin cannot be Blank.');}
  if (!req.body.destLocation) {err.push('Destination cannot be Blank.');}
  if (!req.body.weightCost) {err.push('Weight Cost cannot be Blank.');}
  if (!req.body.volumeCost) {err.push('Volume Cost cannot be Blank.');}
  if (!req.body.frequency) {err.push('Frequency cannot be Blank.');}
  if (!req.body.duration) {err.push('Duration cannot be Blank.');}
  if (!req.body.weightLimit) {err.push('Weight Limit cannot be Blank.');}
  if (!req.body.volumeLimit) {err.push('Volume Limit cannot be Blank.');}
  if (err.length){
    Location.getAllLocations(function(cbLoc){
      Company.getAllCompanies(function(cbComp){
        console.log('COST: POST: Error: ' + err);
        res.render('updCost', {error: err, locations: cbLoc, companies: cbComp});
        return;
      })
    });
  } else {

    // check if the locations exist, if not then add them
    Location.getAllLocations(function(cbLoc){
      var origin = cbLoc.find(function(find){
        return find.locationid == req.body.sourceLocation;
      });
      if (!origin){
        console.log(req.body.sourceLocation + ' not found in Location database, inserting');
/*         Location.insertLocation({name: req.body.sourceLocation}, function(cb){
          console.log(cb);
        }); */
      }
      var destination = cbLoc.find(function(find){
        return find.locationid == req.body.destLocation;
      });
      if (!destination){
        console.log(req.body.destLocation + ' not found in Location database, inserting');
/*         Location.insertLocation({name: req.body.destLocation}, function(cb){
          console.log(cb);
        }); */
      }
    });
    // check if the company exists, if not then add it
    Company.getCompanyByNameAndType(req.body.company, req.body.pri, function(cbCompany){
      if (!cbCompany){
        Company.insertCompany({name: req.body.company, type: req.body.pri}, function(callback){
          if (callback){
            console.log(callback);
          }
        });
      }
    });

    // then get them again, because callbacks
    // but this time we are going to trust that they exist....
    Location.getAllLocations(function(cbLoc){
      console.log(cbLoc);
      var origin = cbLoc.find(function(find){
        return find.locationid == req.body.sourceLocation;
      });
      console.log('Origin: ')
      console.log(origin);
      var destination = cbLoc.find(function(find){
        return find.locationid == req.body.destLocation;
      });
      console.log('Destination: ')
      console.log(destination);
      // next we get the company
      Company.getCompanyByNameAndType(req.body.company, req.body.pri, function(cbCompany){
        if (!cbCompany){
          // no company so we are screwed?
          console.log("There was no company, aborting");
          return;
        } else {
          console.log(cbCompany);
          // now we get the route
          // or we would if we had access to the route db...
          Route.getRouteByOriginAndDestination(origin.locationid, destination.locationid, function(cbRoute){
            console.log('Route: ');
            console.log(cbRoute);
            var route = cbRoute.find(function(find){
              return find.type == req.body.pri && find.name == req.body.company;
            });
            console.log(route);
            if (!route){
              // no route exists, so create one (this will probably happen if neither location existed)
              console.log('insert');
              Route.insertRoute({company: cbCompany.companyid,
                                origin: origin.locationid,
                                destination: destination.locationid,
                                type: req.body.pri,
                                weightcost: req.body.weightCost,
                                volumecost: req.body.volumeCost,
                                maxweight: req.body.weightLimit,
                                maxvolume: req.body.volumeLimit,
                                duration: req.body.duration,
                                frequency: req.body.frequency,
                                day: req.body.day}, function(cbInsRoute){
                                  console.log(cbInsRoute);
                                });
            } else {
              console.log('update');
              Route.updateRoute(route.routeid, {company: cbCompany.id,
                                origin: origin.id,
                                destination: destination.id,
                                type: req.body.pri,
                                weightcost: req.body.weightCost,
                                volumecost: req.body.volumeCost,
                                maxweight: req.body.weightLimit,
                                maxvolume: req.body.volumeLimit,
                                duration: req.body.duration,
                                frequency: req.body.frequency,
                                day: req.body.day}, function(cbInsRoute){
                                  console.log(cbInsRoute);
                                });
            }
            // Route.getAllRoutes(function(cb){
            //   console.log(cb);
            // });
          });
        }

      });


    });


    Location.getAllLocations(function(cbLoc){
      Company.getAllCompanies(function(cbComp){
        // console.log(cbLoc);
        // console.log(cbComp);
        res.render('updCost', {locations: cbLoc, companies: cbComp});
      })
    });
  }
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
