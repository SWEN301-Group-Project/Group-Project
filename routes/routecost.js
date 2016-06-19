var express = require('express'),
    router = express.Router(),
    logFile = require('../database/logFile').logFile,
    Location = require('../database/location'),
    Company = require('../database/company'),
    Route = require('../database/routes');


router.get("/", function(req, res){
	console.log('COST: GET');
    Location.getAllLocations(function (cbLoc) {
        Company.getAllCompanies(function (cbComp) {
            Route.getAllRoutes(function (routes) {
                res.render('updCost', {
                    costActive: true,
                    title: "Route Costs",
                    loggedin: req.session.manager ? true : false,
                    locations: cbLoc,
                    companies: cbComp,
                    routes: routes
                });
            });
        });
    });
});


router.post("/", function(req, res){
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
                    loggedin: req.session.manager ? true : false,
                    error: err,
                    locations: cbLoc,
                    companies: cbComp
                });
            })
        });
    } else {
        console.log('insert');
        Company.getCompanyById(route.company, function(company){
            var data = {
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
            };
            Route.insertRoute(data, function (result) {
                console.log(result);
                new logFile().addEvent({type: 'routes', action: 'insert', data: data});
                Location.getAllLocations(function (allLocations) {
                    Company.getAllCompanies(function (allCompanies) {
                        Route.getAllRoutes(function(routes){
                            res.render('updCost', {costActive: true, title: "Route Costs", loggedin: req.session.manager ? true : false, locations: allLocations, companies: allCompanies, routes: routes, notify: "route successfully added"});
                        });

                    })
                });
            });
        });
    }
});

router.get("/:routeid", function(req, res){
    var routeid = req.params.routeid;
    Route.getPriceById(routeid, function(route){
        console.log(route);
        Location.getAllLocations(function(allLocations){
            Company.getAllCompanies(function(allCompanies){
                res.render('updateCost', {
                    costActive: true,
                    title: "Update Route",
                    loggedin: req.session.manager ? true : false,
                    routeid: routeid,
                    route: route,
                    locations: allLocations,
                    companies: allCompanies
                });
            });
        });
    });
});

router.post("/delete/:routeid", function(req,res){
    var routeid = req.params.routeid;
    Route.getPriceById(routeid, function(route) {
        Route.deleteRoute(routeid, function (result) {
            console.log(result);
            Company.getAllCompanies(function (allCompanies) {
                Location.getAllLocations(function (allLocations) {
                    if (result) {
                        new logFile().addEvent({type: 'routes', action: 'delete', data: route});
                        Route.getAllRoutes(function (routes) {
                            res.render('updCost', {
                                costActive: true,
                                title: "Route Costs",
                                loggedin: req.session.manager ? true : false,
                                locations: allLocations,
                                companies: allCompanies,
                                routes: routes,
                                notify: "route successfully deleted",
                                notifyType: "warning"
                            });
                        });
                    } else {
                        console.log(route);
                        res.render('updateCost', {
                            costActive: true,
                            title: "Update Route",
                            loggedin: req.session.manager ? true : false,
                            routeid: routeid,
                            route: route,
                            locations: allLocations,
                            companies: allCompanies,
                            notify: "Error deleting route",
                            notifyType: "danger"
                        });
                    }
                });
            });
        });
    });
});

router.post("/update/:routeid", function(req,res){
    var route = req.body;
    var routeid = req.params.routeid;
    Route.updateRoute(routeid, route, function(result){
       console.log(result);
       Company.getAllCompanies(function(allCompanies){
           Location.getAllLocations(function(allLocations){
               if(result){
                   var data = route;
                   data.routeid = routeid;
                   new logFile().addEvent({type: 'routes', action: 'update', data: data});
                   Route.getAllRoutes(function(routes){
                       res.render('updCost', {costActive: true, title: "Route Costs", loggedin: req.session.manager ? true : false, locations: allLocations, companies: allCompanies, routes: routes, notify: "route successfully updated", notifyType:"warning"});
                   });
               } else {
                   //could not update the route
                   Route.getPriceById(routeid, function(route){
                       console.log(route);
                       res.render('updateCost', {
                           costActive: true,
                           title: "Update Route",
                           loggedin: req.session.manager ? true : false,
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


module.exports = router;