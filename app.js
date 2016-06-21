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
    Managers = require('./database/managers'),
    Graph = require('./database/graph'),
    findRoute = Graph.findRoute,
    logFile = require('./database/logFile').logFile;

// Set up express
app = express();
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser());
app.use(session({secret: 'apparentlythishastobeaverylongsessionsecret', resave: false, saveUninitialized: true}));

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

env.addFilter('round', function(value){
    value = parseFloat(value);
    return value.toFixed(2);
});

var nunjucksDate = require('nunjucks-date');
nunjucksDate.setDefaultFormat('YYYY-MM-DD, hh:mm:ss');
env.addFilter("date", nunjucksDate);

var router = express.Router();

/**
 * Initialise the database.
 */
var database = new Database().init();
Mail = new Mail();

// redirects to the stats page by default, this could be another page.
router.get("/", function(req, res) {
   res.redirect('/stats/0')
});

// sets date range as default it you go to stats page without a range entered
router.get("/stats", function(req, res) {
    res.redirect('/stats/0');
});

// Stats page
router.get("/stats/:dateOffset", function(req, res) {
	"use strict";

    Mail.getMailStats(req.params.dateOffset, function(labels, series, range, prev, next, weekTotal, mailAmount, criticalRoutes, durations){
        res.render('index', {
            title: 'Business Figures',
            loggedin: req.session.manager ? true : false,
            homeActive: true,
            labels: labels,
            series: series,
            dateRange: range,
            prevDate: prev,
            nextDate: next,
            weekTotal: weekTotal,
            mailAmount: mailAmount,
            criticalRoutes: criticalRoutes,
            durations: durations
        });
    });
});

// Login page
router.get("/login", function (req, res) {
    "use strict";
    res.render('login', {});
});

router.post("/login", function(req, res) {
    var manager = req.body;
    var username = req.body.username;
    var password = req.body.password;
    Managers.loginManager(username, password, function(result){
        if (result){
            req.session.manager = manager; //save user in session
            res.redirect('/stats/0')
        } else {
            res.render("login", {loggedin: req.session.manager ? true : false, error: "Invalid credentials. Please try again."});
        }

    });
});

router.get("/logFile", function (req, res) {
    "use strict";
    if(req.session.manager){
        new logFile().loadXMLDoc(function (json) {
                res.render('logFile', {logActive : true, events: json.events.event, loggedin: req.session.manager ? true : false});
        });
    } else {
        res.render('login', {loggedin: false});
    }
});

router.get("/logFile/:logFileId", function(req, res){
    var index = req.params.logFileId-1;
    new logFile().loadXMLDoc(function (json) {
        var mail;
        var totalcustomercost = 0;
        var totalbusinesscost = 0;
        var totalvolume = 0;
        var totalweight = 0;
        var totalmail = 0;
        var mailEvents = [];
        var mailStats = {};
        var routes = [];
        var length = 0;
        for (var i = 0; i < (index + 1); i++) {
            var event = json.events.event[i];
            var data = event.data[0];
            length = json.events.event.length;
            if (data.totalcustomercost) {
                totalcustomercost += parseFloat(data.totalcustomercost[0]);
            }
            if (data.totalbusinesscost) {
                totalbusinesscost += parseFloat(data.totalbusinesscost[0]);
            }
            if (event.type == "mail") {
                totalmail += 1;
            }
            if (data.volume) {
                totalvolume += parseFloat(data.volume[0]);
            }
            if (data.weight) {
                totalweight += parseFloat(data.weight[0]);
            }
            if (event.type == "mail") {
                mailEvents.push({
                    event: event
                })
            }
        }
        var origin, destination;
        for (var j = 0; j < mailEvents.length; j++){
            mail = mailEvents[j].event;
            origin = mail.data[0].origin[0];
            var originName = mail.data[0].originName[0];
            var destinationName = mail.data[0].destinationName[0];
            destination = mail.data[0].destination[0];
            if (!mailStats[origin]){
                mailStats[origin] = {};
            }
            if (mailStats[origin][destination]){
                continue;
            }
            else {
                mailStats[origin][destination] = {volume: 0, weight: 0, mails: 0};
            // }

                for (var k = 0; k < mailEvents.length; k++) {
                    var anotherMail = mailEvents[k].event;
                    if (anotherMail.data[0].origin[0] == origin && anotherMail.data[0].destination[0] == destination) {
                        mailStats[origin][destination].weight += parseFloat(anotherMail.data[0].weight[0]);
                        mailStats[origin][destination].volume += parseFloat(anotherMail.data[0].volume[0]);
                        mailStats[origin][destination].mails += 1;
                        // console.log(origin);
                        // console.log(destination);
                        // console.log(mailStats[origin][destination]);
                    }
                }
            }
        }
        var deliveryStats = {};
        var criticalRoutes = {};
        for (var j = 0; j < mailEvents.length; j++){
            mail = mailEvents[j].event;
            var origin = mail.data[0].origin[0];
            var destination = mail.data[0].destination[0];
            var priority = mail.data[0].priority[0];

            if (!deliveryStats[origin]) {
                deliveryStats[origin] = {};
            }
            if (!deliveryStats[origin][destination]){
                deliveryStats[origin][destination] = {};
            }
            if(deliveryStats[origin][destination][priority]){
                continue;
            }
            else {
                deliveryStats[origin][destination][priority] = {duration : 0, customercost: 0, businesscost: 0, count: 0};
                for (var k = 0; k < mailEvents.length; k++) {
                    var anotherMail = mailEvents[k].event;
                    
                    if (anotherMail.data[0].origin[0] == origin && anotherMail.data[0].destination[0] == destination) {

                        for (var l = 0; l < mailEvents.length; l++) {
                            var thirdMail = mailEvents[l].event;
                            if (thirdMail.data[0].origin[0] == origin && thirdMail.data[0].destination[0] == destination && thirdMail.data[0].priority[0] == priority) {
                                deliveryStats[origin][destination][priority].duration += parseFloat(thirdMail.data[0].duration[0]);
                                deliveryStats[origin][destination][priority].count += 1;
                                deliveryStats[origin][destination][priority].originName = originName;
                                deliveryStats[origin][destination][priority].destinationName = destinationName;
                                deliveryStats[origin][destination][priority].customercost += parseFloat(thirdMail.data[0].totalcustomercost[0]);
                                deliveryStats[origin][destination][priority].businesscost += parseFloat(thirdMail.data[0].totalbusinesscost[0]);
                            }
                        }
                        var data = deliveryStats[origin][destination][priority];
                        var difference = (data.customercost/parseFloat(data.count)) - (data.businesscost/parseFloat(data.count));
                        if(difference < 0){
                            if (!criticalRoutes[origin]){
                                criticalRoutes[origin] = {};
                            }
                            if (!criticalRoutes[origin][destination]){
                                criticalRoutes[origin][destination] = {};
                            }
                            criticalRoutes[origin][destination][priority] = {originName : originName, destinationName: destinationName, difference: difference};
                        }
                    }
                }
            }
        }
        for (var start in criticalRoutes){
            for(var end in criticalRoutes[origin]){
                for(var pri in criticalRoutes[start][end]){
                    var data = {};
                    data.originName = criticalRoutes[start][end][pri].originName;
                    data.destinationName = criticalRoutes[start][end][pri].destinationName;
                    data.priority = pri;
                    data.difference = criticalRoutes[start][destination][priority].difference;
                    routes.push(data);
                }
            }

        }
        res.render('logs',
            {logActive: true,
                customercost: totalcustomercost,
                businesscost: totalbusinesscost,
                volume: totalvolume,
                weight: totalweight,
                mails: totalmail,
                events: json.events.event[index],
                index: index + 1,
                length: length,
                ori: origin,
                dest: destination,
                totalWeight: (mailStats[origin] && mailStats[origin][destination]) ? mailStats[origin][destination].weight : 0,
                totalVolume: (mailStats[origin] && mailStats[origin][destination]) ? mailStats[origin][destination].volume : 0,
                totalItems: (mailStats[origin] && mailStats[origin][destination]) ? mailStats[origin][destination].mails : 0,
                avgDelivery: (deliveryStats[origin] && deliveryStats[origin][destination] && deliveryStats[origin][destination][priority]) ? (deliveryStats[origin][destination][priority].duration/deliveryStats[origin][destination][priority].count) : 0,
                routes: routes.length ? routes : null,
                loggedin: req.session.manager ? true : false});
    });
});

router.get("/logout",function(req,res) {
    "use strict";
    req.session.manager = null;
    res.redirect('/stats/0');
});

router.get("/graph", function (req, res) {
    "use strict";
    Graph.loadGraph();
    res.render('index', {title: "Dashboard", loggedin: req.session.manager ? true : false, homeActive: true});
});

// Location routes
router.use('/locations', require('./routes/locations'));

// Customer Price routes
router.use('/price', require('./routes/price'));

// Route Cost routes
router.use('/cost', require('./routes/routecost'));

// Company routes
router.use('/companies', require('./routes/company'));


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
                    loggedin: req.session.manager ? true : false,
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
        Graph.loadGraph(function() {
            Location.getLocationById(mail.origin, function (originLocation) {
                Location.getLocationById(mail.destination, function (destinationLocation) {
                    var testMail = {
                        origin: originLocation.name,
                        destination: destinationLocation.name,
                        weight: mail.weight,
                        volume: mail.volume,
                        priority: mail.priority
                    };
                    console.log(testMail);
                    var mailFindRoute = findRoute(testMail);
                    console.log("mailFindRoute:");
                    console.log(mailFindRoute);

                    if(mailFindRoute.routeTaken.length > 0 && !mailFindRoute.errorMessage) {
                        mail.duration = mailFindRoute.duration;
                        mail.totalcustomercost = mailFindRoute.costToCustomer;
                        mail.totalbusinesscost = mailFindRoute.costToCompany;
                        mail.originName = originLocation.name;
                        mail.destinationName = destinationLocation.name;
                        req.session.mail = mail; //resave mail into session
                        res.render('confirmMail', {
                            mail: mail,
                            title: "Mails",
                            loggedin: req.session.manager ? true : false,
                            origin: originLocation,
                            destination: destinationLocation,
                            mailActive: true,
                            routes: mailFindRoute.routeTakenName,
                            departureTime: mailFindRoute.departureTime,
                            duration: mailFindRoute.duration,
                            arrivalTime: mailFindRoute.estArrival
                        });
                    } else {
                        Location.getAllLocations(function(locations){
                            console.log(locations);
                            Mail.getAllMail(function(mails){
                                res.render('mails', {
                                    mailActive: true,
                                    title: "Mails",
                                    loggedin: req.session.manager ? true : false,
                                    mail: req.session.mail,
                                    mails: mails,
                                    locations: locations,
                                    error: mailFindRoute.errorMessage,
                                    notify: "Could not add Mail",
                                    notifyType: "danger"
                                });
                            });
                        });
                    }
                });
            });
        });
    }
});

router.get('/confirmMail', function(req,res){
    //insert mail
    "use strict";
    var mail = req.session.mail;
    console.log('confirmMail');
    console.log(mail);
    Mail.insertMail(mail, function (result) {
        new logFile().addEvent({type: 'mail', action: 'insert', data: mail});
        console.log("mail entered");
        console.log(result);
        Location.getAllLocations(function(locations){
            Mail.getAllMail(function(mails){
                if (result) {
                    //add notification of mail added successfully
                    res.render('mails', {
                        mailActive: true,
                        title: "Mails",
                        loggedin: req.session.manager ? true : false,
                        mailAdded: true,
                        locations: locations,
                        mails: mails,
                        notify: "Successfully inserted Mail"
                    });
                    req.session.mail = null;
                } else {
                    //could not insert mail
                    res.render('mails', {
                        mailActive: true,
                        title: "Mails",
                        loggedin: req.session.manager ? true : false,
                        mailAdded: true,
                        locations: locations,
                        mails: mails,
                        notify: "Error occurred",
                        notifyType: "danger"
                    });
                }
            });
        });
    });
});

router.get("/mails", function(req, res) {
	"use strict";
    Location.getAllLocations(function(locations){
        Mail.getAllMail(function(mails){
            res.render('mails', {
                mailActive: true,
                title: "Mails",
                loggedin: req.session.manager ? true : false,
                mail: req.session.mail,
                mails: mails,
                locations: locations
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
