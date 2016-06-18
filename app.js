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
    logFile = require('./database/logFile.js').logFile;
    findRoute = Graph.findRoute;


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
    value = parseInt(value);
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

//Graph.loadGraph();

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

    Mail.getMailStats(req.params.dateOffset, function(labels, series, range, prev, next, weekTotal, mailAmount, criticalRoutes){
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
            criticalRoutes: criticalRoutes
        });
    });

    //res.render('index',{title: "Dashboard", homeActive: true});
});

// Login page
router.get("/login", function (req, res) {
    "use strict";
    res.render('login', {});
});

router.post("/login", function(req, res) {
    console.log(req.body);
    var manager = req.body;
    var username = req.body.username;
    var password = req.body.password;
    Managers.loginManager(username, password, function(result){
        if (result){
            req.session.manager = manager; //save user in session
            res.render("index", {loggedin: req.session.manager ? true : false});
        } else {
            res.render("index", {loggedin: req.session.manager ? true : false, error: "Invalid code."});
        }

    });
});

router.get("/logFile", function (req, res) {
    "use strict";
    new logFile().loadXMLDoc(function (json) {
        console.log("in callback");
        console.log(json.events.event);
        if (req.session.manager) {
            // res.send(JSON.parse(json));
            res.render('logFile', {events: json.events.event, loggedin: req.session.manager ? true : false});
        }
        else {
            res.render('login', {loggedin: req.session.manager ? true : false});
        }
    });
});

router.get("/logFile/:logFileId", function(req, res){
    var index = req.params.logFileId-1;
    new logFile().loadXMLDoc(function (json) {
        var totalcustomercost = 0;
        var totalbusinesscost = 0;
        //var event = json.events.event;
        console.log("in logfile id");
        console.log(json.events.event.data);
        for (var i = 0; i < (index + 1); i++){
            var event = json.events.event[i];
            console.log(event);
            var data = event.data[0];
            if (data.totalcustomercost){
                console.log("TCC: " + totalcustomercost);
                console.log("PARSE: " + parseInt(data.totalcustomercost[0]));
                totalcustomercost += parseInt(data.totalcustomercost[0]);
                console.log("TCC2: " + totalcustomercost);
            }
            if (data.totalbusinesscost){
                console.log("TBC: " + totalbusinesscost);
                console.log("PARSE: " + parseInt(data.totalbusinesscost[0]));
                totalbusinesscost += parseInt(data.totalbusinesscost[0]);
                console.log("TBC2: " + totalbusinesscost);
            }
            
        }
        //1. calculate business figures
        //2. show events[i]
        res.render('logs', {customercost: totalcustomercost, businesscost: totalbusinesscost, events: json.events.event[index],index: index + 1, loggedin: req.session.manager ? true : false});
    });
});

router.get("/logout",function(req,res) {
    "use strict";
    req.session.manager = null;
    res.render('index', {loggedin: req.session.manager ? true : false});
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
                    var routes = Route.getListOfRoutes(mailFindRoute.routeTaken);
                    if(mailFindRoute.routeTaken.length > 0 && !mailFindRoute.errorMessage) {
                        mail.totalcustomercost = mailFindRoute.costToCustomer;

                        mail.totalbusinesscost = mailFindRoute.costToCompany;
                        res.render('confirmMail', {
                            mail: mail,
                            title: "Mails",
                            loggedin: req.session.manager ? true : false,
                            origin: originLocation,
                            destination: destinationLocation,
                            mailActive: true
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
    console.log
    var mail = req.session.mail;
    console.log('confirmMail');
    console.log(mail);
    Mail.insertMail(mail, function (result) {
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
        console.log(locations);
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
