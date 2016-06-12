/**
 * Created by harmansingh on 11/06/16.
 */

var express = require('express');
var router = express.Router();


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
        })
    });
});

router.post("/locations/delete/:locationid", function(req,res){
    var locationid = req.params.locationid;

    Location.deleteLocation(locationid, function(result){
        console.log(result);
        //TODO: Harman
        //use result to send notification
        //if result is success then render location page
        //if result is failure then render locations/:locationid page
        Location.getAllLocations(function(allLocations){
            res.render('location', {locationActive: true, title: "Location", locations: allLocations});
        });
    });
});

router.post("/locations/update/:locationid", function(req,res){
    var location = req.body;
    var locationid = req.params.locationid;
    Location.updateLocation(locationid, location, function(result){
        console.log(result);
        //TODO: Harman
        //use result to send notification if successful
        //if result is success then render location page
        //if result is failure then render locations/:locationid page
        Location.getAllLocations(function(allLocations){
            res.render('location', {locationActive: true, title: "Location", locations: allLocations});
        });
    });
});

router.post("/locations", function(req, res){
    console.log(req.body);
    var newLocation = req.body;
    Location.insertLocation(newLocation, function(result){
        console.log(result);
        Location.getAllLocations(function(allLocations){
            //TODO: Harman ==> Add notification of successful insertion of new location
            res.render('location', {locationActive: true, title: "Location", locations: allLocations});
        });
    });
});