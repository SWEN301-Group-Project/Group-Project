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
    Graph = require('./database/graph'),
    findRoute = Graph.findRoute;


// Set up express
app = express();
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
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
/*
    Custom methods for nunjucks
 */
var nunjucksEnv = new nunjucks.Environment();

env.addFilter('isMailOrigin', function(locationid, mail) {
    return mail ? locationid == mail.origin : false;
});

env.addFilter('isMailDestination', function(locationid, mail) {
    return mail ? locationid == mail.destination : false;
});


var nunjucksDate = require('nunjucks-date');
nunjucksDate.setDefaultFormat('YYYY-MM-Do, hh:mm:ss');
env.addFilter("date", nunjucksDate);

var router = express.Router();


/**
 * Initialise the database.
 */
var database = new Database().init();
Mail = new Mail();
Graph.loadGraph();


// Homepage
router.get("/", function(req, res) {
	"use strict";
	res.render('index',{title: "Dashboard", homeActive: true});
});

router.get("/logFile", function(req, res) {
    "use strict";
    res.render('logFile',{loggedin: loggedin});
});

// Login page
router.get("/login", function(req, res) {
    "use strict";
    res.render('login',{});
});
var password = 1234;
var loggedin = false;
router.post("/login", function(req, res) {
    var code = req.body.code;
    if(code != password){
        loggedin = false;
        res.render("login", {loggedin: loggedin, error: "Invalid code."});
    }
    else {
        loggedin = true;
        res.render('logFile', {loggedin: loggedin});
    }
});

router.get("/logout",function(request,response) {
    loggedin = false;
    res.render('login', {loggedin: loggedin});
});

router.get("/graph", function (req, res) {
    "use strict";
    Graph.loadGraph();
    res.render('index', {title: "Dashboard", homeActive: true});
});

// Location routes
router.get("/locations", function(req, res) {
	"use strict";
    Location.getAllLocations(function(allLocations){
        res.render('location', {locationActive: true, title: "Location", locations: allLocations});
    });
});

router.get("/locations/:locationid", function(req, res){
    var locationid = req.params.locationid;
    Location.getLocationById(locationid, function(location){
        console.log(location);
        res.render('updateLocation', {
            locationActive: true,
            title: "Update Location",
            locationid: locationid,
            location: location
        });
    });
});

router.post("/locations/delete/:locationid", function(req,res){
    var locationid = req.params.locationid;

    Location.deleteLocation(locationid, function(result){
        console.log(result);
        if(result){
            //success
            Location.getAllLocations(function(allLocations){
                res.render('location', {locationActive: true, title: "Location", locations: allLocations, notify: "Location successfully deleted", notifyType:"warning"});
            });
        } else {
            Location.getLocationById(locationid, function(location){
                console.log(location);
                res.render('updateLocation', {
                    locationActive: true,
                    title: "Update Location",
                    locationid: locationid,
                    location: location,
                    notify: "Error deleting location: " + location.name,
                    notifyType: "danger"
                });
            });
        }
    });
});

router.post("/locations/update/:locationid", function(req,res){
    var location = req.body;
    var locationid = req.params.locationid;
    Location.updateLocation(locationid, location, function(result){
        console.log(result);
        if (result){
            Location.getAllLocations(function(allLocations){
                res.render('location', {locationActive: true, title: "Location", locations: allLocations, notify: location.name + " successfully updated", notifyType: "warning"});
            });
        } else {
            //could not update the location
            Location.getLocationById(locationid, function(location){
                console.log(location);
                res.render('updateLocation', {
                    locationActive: true,
                    title: "Update Location",
                    locationid: locationid,
                    location: location,
                    notify: "Error updating location: " + location.name,
                    notifyType: "danger"
                });
            });
        }
    });
});

router.post("/locations", function(req, res){
    console.log(req.body);
    var newLocation = req.body;
    Location.insertLocation(newLocation, function(result){
        console.log(result);
        Location.getAllLocations(function(allLocations){
            if (result) {
                res.render('location', {
                    locationActive: true,
                    title: "Location",
                    locations: allLocations,
                    notify: "Successfully added: " + newLocation.name
                });
            } else {
                res.render('location', {
                    locationActive: true,
                    title: "Location",
                    locations: allLocations,
                    notify: "Error occurred",
                    notifyType: "danger"
                });
            }
        });
    });
});

//company
router.get("/companies", function(req, res) {
    "use strict";
    Company.getAllCompanies(function(allCompanies){
        res.render('company', {companyActive: true, title: "Company", companies: allCompanies});
    });
});

router.get("/companies/:companyid", function(req, res){
    var companyid = req.params.companyid;
    Company.getCompanyById(companyid, function(company){
        console.log(company);
        res.render('updateCompany', {
            companyActive: true,
            title: "Update Company",
            companyid: companyid,
            company: company
        });
    });
});

router.post("/companies/delete/:companyid", function(req,res){
    var companyid = req.params.companyid;

    Company.deleteCompany(companyid, function(result){
        console.log(result);
        if(result){
            //success
            Company.getAllCompanies(function(allCompanies){
                res.render('company', {companyActive: true, title: "Company", companies: allCompanies, notify: "company successfully deleted", notifyType:"warning"});
            });
        } else {
            Company.getCompanyById(companyid, function(company){
                res.render('updateCompany', {
                    companyActive: true,
                    title: "Update Company",
                    companyid: companyid,
                    company: company,
                    notify: "Error deleting company: " + company.name,
                    notifyType: "danger"
                });
            });
        }
    });
});

router.post("/companies/update/:companyid", function(req,res){
    var company = req.body;
    var companyid = req.params.companyid;
    Company.updateCompany(companyid, company, function(result){
        console.log(result);
        if (result){
            Company.getAllCompanies(function(allCompanies){
                res.render('company', {companyActive: true, title: "Company", companies: allCompanies, notify: company.name + " successfully updated", notifyType: "warning"});
            });
        } else {
            //could not update the location
            Company.getCompanyById(companyid, function(company){
                res.render('updateCompany', {
                    companyActive: true,
                    title: "Update Company",
                    companyid: companyid,
                    company: company,
                    notify: "Error deleting company: " + company.name,
                    notifyType: "danger"
                });
            });
        }
    });
});

router.post("/companies", function (req, res) {
    console.log(req.body);
    var newCompany = req.body;
    Company.insertCompany(newCompany, function (result) {
        console.log(result);
        Company.getAllCompanies(function (allCompanies) {
            if (result) {
                res.render('company', {
                    companyActive: true,
                    title: "Company",
                    companies: allCompanies,
                    notify: "Successfully added: " + newCompany.name
                });
            } else {
                res.render('company', {
                    companyActive: true, title: "Company", companies: allCompanies,
                    notify: "Error occurred",
                    notifyType: "danger"
                });
            }
        });
    });
});

router.post("/addMail", function(req,res, next){
   "use strict";
    console.log("/addMail");
    console.log(req.body);
    var mail = req.body;
    req.session.mail = mail; //save mail in session
    var error = ""; //server side error message to be displayed
    //server-side error checking. Destination and origin cannot be the same
    if (mail.destination == mail.origin) {
        if (mail.destination) {
            error += "Unknown error occurred.\n";
        }
        error += "Destination cannot be same as Origin.";
        Location.getAllLocations(function (locations) {
            Mail.getAllMail(function (mails) {
                res.status(404);
                res.render('mails', {
                    mailActive: true,
                    title: "Mails",
                    error: error,
                    mail: mail,
                    mails: mails,
                    locations: locations
                });
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
        Location.getLocationById(mail.origin, function(originLocation){
            Location.getLocationById(mail.destination, function(destinationLocation){
                var testMail = {
                    origin: originLocation.name,
                    destination: destinationLocation.name,
                    weight: mail.weight,
                    volume: mail.volume,
                    priority: mail.priority
                };
                console.log(testMail);
                var mailFindRoute = findRoute(testMail);

                console.log(mailFindRoute);
                res.render('confirmMail', {
                    mail: mail,
                    title: "Mails",
                    origin: originLocation,
                    destination: destinationLocation,
                    mailActive: true
                });
            });
        });
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
                res.render('mails', {
                    mailActive: true,
                    title: "Mails",
                    mailAdded: true,
                    locations: locations,
                    mails: mails
                });
                req.session.mail = null;
            });
        });
    });
});

router.get("/mails", function(req, res) {
	"use strict";
    Location.getAllLocations(function(locations){
        console.log(locations);
        Mail.getAllMail(function(mails){
            res.render('mails', {
                mailActive: true,
                title: "Mails",
                mail: req.session.mail,
                mails: mails,
                locations: locations
            });
        });
    });
});

router.get("/price", function(req, res){
  console.log('PRICE: GET');
  Location.getAllLocations(function(cb){
      Price.getAllPrices(function(prices){
          console.log(prices);
          res.render('updPrice', {priceActive: true, title: "Customer Prices", locations: cb, customerprices: prices});
      });
  });
});

router.post("/price", function(req, res){
    console.log("PRICE: POST");
    console.log(req.body);
    var err = [];
    if (!req.body.sourceLocation) {err.push('Origin cannot be Blank.');}
    if (!req.body.destLocation) {err.push('Destination cannot be Blank.');}
    if (!req.body.wgt) {err.push('Weight Price cannot be Blank.');}
    if (!req.body.vol) {err.push('Volume Price cannot be Blank.');}
    console.log(err);
    if (err.length) {
        Location.getAllLocations(function(cb){
            Price.getAllPrices(function(prices){
                console.log(prices);
                res.render('updPrice', {priceActive: true, title: "Customer Prices", locations: cb, customerprices: prices, error: err});
            });
        });
    } else {
        var price = req.body;
        console.log('insert');
        console.log('origin: ' + price.sourceLocation);
        console.log('destination: ' + price.destLocation);

        Price.insertCustomerPrice({
            origin: price.sourceLocation,
            destination: price.destLocation,
            weightcost: price.wgt,
            volumecost: price.vol,
            priority: price.priority
        }, function (result){
            console.log(result);
            Location.getAllLocations(function(allLocations){
               Price.getAllPrices(function(allPrices){
                   res.render('updPrice', {priceActive: true, title: "Customer Prices", locations: allLocations, customerprices: allPrices});
               });
            });
        });
    }
});

router.get("/price/:customerpriceid", function(req, res){
    var customerpriceid = req.params.customerpriceid;
    Price.getPriceById(customerpriceid, function(customerprice){
        console.log(customerprice);
        Location.getAllLocations(function(allLocations){
            console.log(allLocations);
            res.render('updatePrice', {
                priceActive: true,
                title: "Customer Prices",
                locations: allLocations,
                customerprice: customerprice,
                customerpriceid: customerpriceid
            });
        });
    });
});

router.post("/price/delete/:priceid", function(req,res){
    var priceid = req.params.priceid;
    Price.deleteCustomerPrice(priceid, function(result){
       console.log(result);
        Location.getAllLocations(function(allLocations){
           if(result){
               Price.getAllPrices(function(allPrices){
                   res.render('updPrice', {priceActive: true, title: "Customer Prices", locations: allLocations, customerprices: allPrices, notify: "Price successfully deleted", notifyType:"warning"});
               });
           } else {
               Price.getPriceById(priceid, function(customerprice){
                   console.log(customerprice);
                   res.render('updatePrice', {
                       priceActive: true,
                       title: "Customer Prices",
                       locations: allLocations,
                       customerprice: customerprice,
                       priceid: priceid,
                       notify: "Error deleting price",
                       notifyType: "danger"
                   });
               });
           }
        });
    });
});

router.post("/price/update/:priceid", function(req,res){
    var customerprice = req.body;
    var priceid = req.params.priceid;
    Price.updateCustomerPrice(priceid, customerprice, function(result){
       console.log(result);
        Location.getAllLocations(function(allLocations){
           if(result){
               Price.getAllPrices(function(allPrices){
                   res.render('updPrice', {priceActive: true, title: "Customer Prices", locations: allLocations, customerprices: allPrices, notify: "Price successfully updated", notifyType:"warning"});
               });
           } else {
               Price.getPriceById(priceid, function(customerprice){
                   console.log(customerprice);
                   res.render('updatePrice', {
                       priceActive: true,
                       title: "Customer Prices",
                       locations: allLocations,
                       customerprice: customerprice,
                       priceid: priceid,
                       notify: "Error updating price",
                       notifyType: "danger"
                   });
               });
           }
        });
    });
});

router.get("/cost", function(req, res){
	console.log('COST: GET');
    Location.getAllLocations(function (cbLoc) {
        Company.getAllCompanies(function (cbComp) {
            Route.getAllRoutes(function (routes) {
                res.render('updCost', {
                    costActive: true,
                    title: "Route Costs",
                    locations: cbLoc,
                    companies: cbComp,
                    routes: routes
                });
            });
        });
    });
});


router.post("/cost", function(req, res){
    console.log("COST: POST");
    console.log(req.body);
    route = req.body;
    // verify input
    var err = [];
    if (!route.sourceLocation) {err.push('Origin cannot be Blank.');}
    if (!route.destLocation) {err.push('Destination cannot be Blank.');}
    if (!route.weightCost) {err.push('Weight Cost cannot be Blank.');}
    if (!route.volumeCost) {err.push('Volume Cost cannot be Blank.');}
    if (!route.frequency) {err.push('Frequency cannot be Blank.');}
    if (!route.duration) {err.push('Duration cannot be Blank.');}
    if (!route.weightLimit) {err.push('Weight Limit cannot be Blank.');}
    if (!route.volumeLimit) {err.push('Volume Limit cannot be Blank.');}
    if (err.length) {
        Location.getAllLocations(function (cbLoc) {
            Company.getAllCompanies(function (cbComp) {
                console.log('COST: POST: Error: ' + err);
                res.render('updCost', {
                    costActive: true,
                    title: "Route Costs",
                    error: err,
                    locations: cbLoc,
                    companies: cbComp
                });
            })
        });
    } else {
        console.log('insert');
        Company.getCompanyById(route.company, function(company){
            Route.insertRoute({
                company: company.companyid,
                origin: route.sourceLocation,
                destination: route.destLocation,
                type: company.type,
                weightcost: route.weightCost,
                volumecost: route.volumeCost,
                maxweight: route.weightLimit,
                maxvolume: route.volumeLimit,
                duration: route.duration,
                frequency: route.frequency,
                day: route.day
            }, function (result) {
                console.log(result);
                Location.getAllLocations(function (allLocations) {
                    Company.getAllCompanies(function (allCompanies) {
                        Route.getAllRoutes(function(routes){
                            res.render('updCost', {costActive: true, title: "Route Costs", locations: allLocations, companies: allCompanies, routes: routes, notify: "route successfully added"});
                        });

                    })
                });
            });
        });
    }
});

router.get("/cost/:routeid", function(req, res){
    var routeid = req.params.routeid;
    Route.getPriceById(routeid, function(route){
        console.log(route);
        Location.getAllLocations(function(allLocations){
            Company.getAllCompanies(function(allCompanies){
                res.render('updateCost', {
                    costActive: true,
                    title: "Update Route",
                    routeid: routeid,
                    route: route,
                    locations: allLocations,
                    companies: allCompanies
                });
            });
        });
    });
});

router.post("/cost/delete/:routeid", function(req,res){
    var routeid = req.params.routeid;
    Route.deleteRoute(routeid, function(result){
       console.log(result);
        Company.getAllCompanies(function(allCompanies){
            Location.getAllLocations(function(allLocations){
                if(result){
                    Route.getAllRoutes(function(routes){
                        res.render('updCost', {costActive: true, title: "Route Costs", locations: allLocations, companies: allCompanies, routes: routes, notify: "route successfully deleted", notifyType:"warning"});
                    });
                } else {
                    Route.getPriceById(routeid, function(route){
                        console.log(route);
                        res.render('updateCost', {
                            costActive: true,
                            title: "Update Route",
                            routeid: routeid,
                            route: route,
                            locations: allLocations,
                            companies: allCompanies,
                            notify: "Error deleting route",
                            notifyType: "danger"
                        });
                    });
                }
            });
        });
    });
});

router.post("/cost/update/:routeid", function(req,res){
    var route = req.body;
    var routeid = req.params.routeid;
    Route.updateRoute(routeid, route, function(result){
       console.log(result);
       Company.getAllCompanies(function(allCompanies){
           Location.getAllLocations(function(allLocations){
               if(result){
                   Route.getAllRoutes(function(routes){
                       res.render('updCost', {costActive: true, title: "Route Costs", locations: allLocations, companies: allCompanies, routes: routes, notify: "route successfully updated", notifyType:"warning"});
                   });
               } else {
                   //could not update the route
                   Route.getPriceById(routeid, function(route){
                       console.log(route);
                       res.render('updateCost', {
                           costActive: true,
                           title: "Update Route",
                           routeid: routeid,
                           route: route,
                           locations: allLocations,
                           companies: allCompanies,
                           notify: "Error updating route",
                           notifyType: "danger"
                       });
                   });
               }
           });
       });
    });
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

module.exports = server;
