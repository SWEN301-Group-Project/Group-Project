/**
 * Created by harmansingh on 11/06/16.
 */

var express = require('express');
var router = express.Router();

var Location = require('../database/location');


router.get("/", function(req, res) {
    "use strict";
    Location.getAllLocations(function(allLocations){
        res.render('location', {locationActive: true, title: "Location", loggedin: req.session.manager ? true : false, locations: allLocations});
    });
});

router.get("/:locationid", function(req, res){
    var locationid = req.params.locationid;
    Location.getLocationById(locationid, function(location){
        console.log(location);
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

    Location.deleteLocation(locationid, function(result){
        console.log(result);
        if(result){
            //success
            Location.getAllLocations(function(allLocations){
                res.render('location', {locationActive: true, title: "Location", loggedin: req.session.manager ? true : false, locations: allLocations, notify: "Location successfully deleted", notifyType:"warning"});
            });
        } else {
            Location.getLocationById(locationid, function(location){
                console.log(location);
                res.render('updateLocation', {
                    locationActive: true,
                    title: "Update Location",
                    loggedin: req.session.manager ? true : false,
                    locationid: locationid,
                    location: location,
                    notify: "Error deleting location: " + location.name,
                    notifyType: "danger"
                });
            });
        }
    });
});

router.post("/update/:locationid", function(req,res){
    var location = req.body;
    var locationid = req.params.locationid;
    Location.updateLocation(locationid, location, function(result){
        console.log(result);
        if (result){
            Location.getAllLocations(function(allLocations){
                res.render('location', {locationActive: true, title: "Location", loggedin: req.session.manager ? true : false, locations: allLocations, notify: location.name + " successfully updated", notifyType: "warning"});
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
    Location.insertLocation(newLocation, function(result){
        console.log(result);
        Location.getAllLocations(function(allLocations){
            if (result) {
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
});

module.exports = router;