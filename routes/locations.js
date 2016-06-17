/**
 * Created by harmansingh on 11/06/16.
 */

var express = require('express');
var router = express.Router();

var Location = require('../database/location');


router.get("/", function(req, res) {
    "use strict";
    Location.getAllLocations(function(allLocations){
        res.render('location', {locationActive: true, title: "Location", locations: allLocations});
    });
});

router.get("/:locationid", function(req, res){
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

router.post("/delete/:locationid", function(req,res){
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

router.post("/update/:locationid", function(req,res){
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

router.post("/", function(req, res){
    console.log(req.body);
    var newLocation = req.body;
    var error;
    if (!newLocation.name) {
        error = "Must provide a valid location name";
    } else if (!newLocation.isInternational) {
        error = "Must provide the required details";
    }
    Location.getLocationByName("", function(result){
        console.log(result);
    });
    Location.getAllLocations(function (allLocations) {
        if (error){
            res.status(404);
            res.render('location', {
                locationActive: true,
                title: "Location",
                location: newLocation,
                locations: allLocations,
                error: error
            });
        } else {
            Location.insertLocation(newLocation, function (result) {
                console.log(result);

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
        }
    });
});

module.exports = router;