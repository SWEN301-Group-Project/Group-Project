/**
 * Created by harmansingh on 11/06/16.
 */

var express = require('express'),
    router = express.Router(),
    logFile = require('../database/logFile').logFile,
    Location = require('../database/location');


router.get("/", function(req, res) {
    "use strict";
    Location.getAllLocations(function(allLocations){
        res.render('location', {locationActive: true, title: "Location", loggedin: req.session.manager ? true : false, locations: allLocations});
    });
});

router.get("/:locationid", function(req, res){
    var locationid = req.params.locationid;
    Location.getLocationById(locationid, function(location){
        res.render('updateLocation', {
            locationActive: true,
            title: "Update Location",
            loggedin: req.session.manager ? true : false,
            locationid: locationid,
            location: location
        });
    });
});

router.post("/delete/:locationid", function(req,res){
    var locationid = req.params.locationid;
    Location.getLocationById(locationid, function(deleteLocation){
        Location.deleteLocation(locationid, function(result){
            if(result){
                new logFile().addEvent({type: 'location', action: 'delete', data: deleteLocation});
                //success
                Location.getAllLocations(function(allLocations){
                    res.render('location', {locationActive: true, title: "Location", loggedin: req.session.manager ? true : false, locations: allLocations, notify: "Location successfully deleted", notifyType:"warning"});
                });
            } else {
                    console.log(deleteLocation);
                    res.render('updateLocation', {
                        locationActive: true,
                        title: "Update Location",
                        loggedin: req.session.manager ? true : false,
                        locationid: locationid,
                        location: deleteLocation,
                        notify: "Error deleting location: " + location.name,
                        notifyType: "danger"
                    });
            }
        });
    });
});

router.post("/update/:locationid", function(req,res){
    var location = req.body;
    var locationid = req.params.locationid;
    Location.updateLocation(locationid, location, function(result){
        if (result){
            var data = location;
            data.locationid = locationid;
            new logFile().addEvent({type: 'location', action: 'update', data: data});
            Location.getAllLocations(function(allLocations){
                res.render('location', {locationActive: true, title: "Location",loggedin: req.session.manager ? true : false,  locations: allLocations, notify: location.name + " successfully updated", notifyType: "warning"});
            });
        } else {
            //could not update the location
            Location.getLocationById(locationid, function(location){
                console.log(location);
                res.render('updateLocation', {
                    locationActive: true,
                    title: "Update Location",
                    loggedin: req.session.manager ? true : false,
                    locationid: locationid,
                    location: location,
                    notify: "Error updating location: " + location.name,
                    notifyType: "danger"
                });
            });
        }
    });
});

router.post("/", function(req, res){
    console.log(req.body);
    var newLocation = req.body;
    var error;
    if (!newLocation.name) {
        error = "Must provide a valid location name";
    } else if (!newLocation.isInternational) {
        error = "Must provide the required details";
    }
    if (error){
        Location.getAllLocations(function(allLocations){
            res.status(404);
            res.render('location', {
                locationActive: true,
                title: "Location",
                loggedin: req.session.manager ? true : false,
                location: newLocation,
                locations: allLocations,
                error: error
            });
        });
    } else {
        Location.insertLocation(newLocation, function (result) {
            Location.getAllLocations(function (allLocations) {
                if (result.changes) {
                    new logFile().addEvent({type: 'location', action: 'insert', data: newLocation});
                    res.render('location', {
                        locationActive: true,
                        title: "Location",
                        loggedin: req.session.manager ? true : false,
                        locations: allLocations,
                        notify: "Successfully added: " + newLocation.name
                    });
                } else {
                    res.render('location', {
                        locationActive: true,
                        title: "Location",
                        loggedin: req.session.manager ? true : false,
                        locations: allLocations,
                        notify: "Error occurred",
                        notifyType: "danger"
                    });
                }
            });
        });
    }
});

module.exports = router;