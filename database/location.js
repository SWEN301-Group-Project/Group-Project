var sqlite3 = require("sqlite3").verbose(),
    assert = require("assert");

var dbFile = "./database/test.db";
var db = new sqlite3.Database(dbFile);

/*
A location object looks like: {id: <id> name: <name>}
The id is the primary key and is autoincremented. So when updating or inserting
a location object you do not need to supply the id.

The following are the database function implemented by location.js file:
    1. getAllLocations ==> returns array of location objects
    2 getLocationByName ==> returns location object that has name equal to parameter
    3 getLocationById ==> returns location object that has id == parameter
    4 insertLocation ==> inserts new location object to database
    5 deleteLocation ==> deletes location by id
    6 updateLocation ==> update Location by id
*/
//retuns all locations
exports.getAllLocations = function(callback){
    // var stmt = db.prepare("SELECT * FROM locations");
    db.all("SELECT locationid, name FROM locations", function(err, rows){
        if (err){console.log("Error loading locations: " + err); callback([]);}
        else if (callback){
            callback(rows);
        }
    });
}

//returns 1 location object that match the locationNames
//TODO: ask group if they want array of locations rather than the first location
exports.getLocationByName = function(locationName, callback){
    var stmt = "SELECT locationid, name FROM locations WHERE name = $locationName";
    db.get(stmt, {$locationName: locationName.toLowerCase()}, function(err, location){
        if(err){console.log("Error loading location: " + err); callback();}
        else if (callback){
            callback(location);
        }
    });
}

//returns location that matches the id. This is used to retrieve specific location objects
exports.getLocationById = function(locationid, callback){
    var stmt = "SELECT locationid, name FROM locations WHERE locationid = $locationid";
    db.get(stmt, {$locationid: locationid}, function(err, location){
        if(err){console.log("Error loading location: " + err); callback();}
        else if (callback){
            callback(location);
        }
    });
}
//adds a new location row to the locations table
//the location object must be ==> {name : <location name>}
//The number of rows changed is returned.
//PostCondition: returns > 0 ==> inserted successfull
exports.insertLocation = function(location, callback){
    //TODO: ensure location does not exist already??
    var stmt = db.prepare("INSERT INTO locations (name) VALUES (?)");

    stmt.run(location.name.toLowerCase(), function(err){
        if(err){callback(0)}
        else if (callback){
            callback(this.changes);
        }
    });
}

//removes a location from table by its id
//The number of rows removed is returned
//PostCondition: if return > 0 ==> {return} rows deleted successfully
exports.deleteLocation = function(locationid, callback){
    db.run("DELETE FROM locations WHERE locationid = $id", {$id: locationid}, function(err){
        if(err){
            console.log("Error removing location with id: " + locationid);
            callback(0);
        }else{
            console.log(this);
            if(callback){
                callback(this.changes);
            }
        }
    });

}

//updates a location row specified by the id.
//the newLocation paramter must be ==> {name : <location name>}
//Returns number of rows changed.
exports.updateLocation = function(locationid, newLocation, callback){
    db.run("UPDATE locations SET name = $name WHERE locationid = $id", {
	$id: locationid,
	$name: newLocation.name.toLowerCase()
    }, function(err){
        if(err){
            console.log("Error updating location with id: " + locationid);
            callback(0);
        }else{
            console.log(this);
            if(callback){
                callback(this.changes);
            }
        }
    });
}