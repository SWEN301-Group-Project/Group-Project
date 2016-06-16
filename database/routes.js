var sqlite3 = require("sqlite3").verbose(),
    assert = require("assert"),
    dbFile = "./database/test.db",
    db = new sqlite3.Database(dbFile),
    Location = require('./location');
/*
A route object looks like:
var route = {
	 routeid: 5,
	 company: 2,
    origin: 1,
    destination: 2,
    type: Air/Land/Sea,
    weightcost: 5,
    volumecost: 6,
    maxweight: 350,
    maxVolume: 50,
    duration: 16,
    frequency: 36,
    day: 0
};
The id is the primary key and is autoincremented. So when updating or inserting
a route object you do not need to supply the id.

The following are the database function implemented by route.js file:
    1.getAllRoutes ==> returns array of customerprice objects
    2.getRouteById ==> get route by id
    2 getRouteByOrigin ==> returns array of route objects that have origin = Origin parameter
    3 getRouteByOriginAndDestination ==> returns array of route objects that have origin = Origin parameter AND destination = Destination parameter
    4 insertRoute ==> inserts new route object to database
    5 deleteRoute ==> deletes route by id
    6 updateRoute ==> update route by id
    
    
    db.run('CREATE TABLE IF NOT EXISTS routes ('
            + 'routeid INTEGER PRIMARY KEY, '
            + 'company INTEGER, '
            + 'type TEXT, '
            + 'origin INTEGER, '
            + 'destination INTEGER'
            + 'weightcost INTEGER, '
            + 'volumecost INTEGER, '
            + 'maxweight INTEGER, '
            + 'maxvolume INTEGER, '
            + 'frequency INTEGER'
            + 'duration INTEGER, '
            + 'day INTEGER, ' //day of the week will be represented as an integer 0 <= day < 7
            + 'FOREIGN KEY(company) REFERENCES companies(companyid), '
            + 'FOREIGN KEY(origin) REFERENCES locations(origin), '
            + 'FOREIGN KEY(destination) REFERENCES locations(destination) '
            + ')');

*/

//returns list of all route objects
exports.getAllRoutes = function(callback){
    var stmt = "SELECT routeid, COMPANY.name AS company, COMPANY.type AS type, ORIGIN.name AS origin, DEST.name AS destination, weightcost, volumecost, maxweight, maxvolume, frequency, duration, day "
                + "FROM routes "
                + "LEFT JOIN companies AS COMPANY ON routes.company = COMPANY.companyid "
                + "LEFT JOIN locations AS ORIGIN ON routes.origin = ORIGIN.locationid "
                + "LEFT JOIN locations AS DEST ON routes.destination = DEST.locationid";
    
    db.all(stmt, function(err, rows){
        if (err){
            console.log("Error loading routes: " + err);
            callback([]);
        } else if (callback){
            callback(rows);
        }
    });
};

//returns route objects where origin == origin parameter.
//The paramter: origin must be location id.
exports.getRouteByOrigin = function(originid, callback){
    var stmt = "SELECT routeid, COMPANY.name AS company, COMPANY.type AS type, ORIGIN.name AS origin, DEST.name AS destination, weightcost, volumecost, maxweight, maxvolume, frequency, duration, day "
    			 + "FROM routes "
                 + "LEFT JOIN companies AS COMPANY ON routes.company = COMPANY.companyid "
    			 + "LEFT JOIN locations AS ORIGIN ON routes.origin = ORIGIN.locationid "
    			 + "LEFT JOIN locations AS DEST ON routes.destination = DEST.locationid "
    			 + "WHERE routes.origin = $originid";
    			 
    db.all(stmt, {$originid: originid}, function(err, rows){
        if(err){
            console.log("Error loading routes: " + err);
            callback([]);
        } else if (callback){
            callback(rows);
        }
    });
};

//returns route objects where origin == origin parameter AND destination == destination parameter.
//The paramters: origin and destination must be location id.
exports.getRouteByOriginAndDestination = function(originid, destinationid, callback){
    var stmt = "SELECT routeid, COMPANY.name AS company, COMPANY.type AS type, ORIGIN.name AS origin, DEST.name AS destination, weightcost, volumecost, maxweight, maxvolume, frequency, duration, day "
    			 + "FROM routes "
                 + "LEFT JOIN companies AS COMPANY ON routes.company = COMPANY.companyid "
    			 + "LEFT JOIN locations AS ORIGIN ON routes.origin = ORIGIN.locationid "
    			 + "LEFT JOIN locations AS DEST ON routes.destination = DEST.locationid "
    			 + "WHERE routes.origin = $originid AND routes.destination = $destinationid";
    			 
    db.all(stmt, {$originid: originid, $destinationid: destinationid}, function(err, rows){
        if(err){
            console.log("Error loading routes: " + err);
            callback([]);
        } else if (callback){
            callback(rows);
        }
    });
};

//returns route object by id
exports.getPriceById = function(routeid, callback){
	var stmt = "SELECT routeid, COMPANY.name AS company, COMPANY.type AS type, ORIGIN.name AS origin, DEST.name AS destination, weightcost, volumecost, maxweight, maxvolume, frequency, duration, day "
    			 + "FROM routes "
                 + "LEFT JOIN companies AS COMPANY ON routes.company = COMPANY.companyid "
    			 + "LEFT JOIN locations AS ORIGIN ON routes.origin = ORIGIN.locationid "
    			 + "LEFT JOIN locations AS DEST ON routes.destination = DEST.locationid "
    			 + "WHERE routeid = $routeid";
    db.get(stmt, {$routeid: routeid}, function(err, route){
        if(err){
            console.log("Error loading route: " + err)
            callback();
        } else if (callback){
            callback(route);
        }
    });
};

//Adds a new route row to the routes table
//The route object must be similar to:
/* var route = {
	 company: 2,
    origin: 1,
    destination: 2,
    type: Air/Land/Sea,
    weightcost: 5,
    volumecost: 6,
    maxweight: 350,
    maxvolume: 50,
    duration: 16,
    frequency: 36,
    day: 0
};*/
//Origin and destination are foreign keys so they must be integers
//company is foreign key so must be integer corresponding to key 
//PostCondition: if return value > 0 ==> route inserted sucessfully
exports.insertRoute = function(route, callback){
	var stmt = db.prepare("INSERT INTO routes (company, origin, destination, weightcost, volumecost, maxweight, maxvolume, duration, frequency, day) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ");

	stmt.run([
        route.company,
        route.origin,
        route.destination,
        route.weightcost,
        route.volumecost,
        route.maxweight,
        route.maxvolume,
        route.duration,
        route.frequency,
        route.day
    ], function(err){
        if(err){
            callback(0)
        }else{
            console.log(this);
            callback(this.changes);
        }
    });
};

//removes a route from table by its id
//The number of rows removed is returned
//PostCondition: if return > 0 ==> {return} rows deleted successfully
exports.deleteRoute = function(routeid, callback){
    db.run("DELETE FROM routes WHERE routeid = $id", {$id: routeid}, function(err){
        if(err){
            console.log("Error removing route with id: " + routeid);
            callback(0);
        }else{
            console.log(this);
            if(callback){
                callback(this.changes);
            }
        }
    });

};

//updates a routeid row specified by the id
//the newRoute object must be similar to route object of insertRoute paramter
//Returns the number of rows changed
exports.updateRoute = function(routeid, newRoute, callback){
    db.run("UPDATE routes SET company=$company, origin=$origin, destination=$destination, weightcost=$weightcost, volumecost=$volumecost, maxweight=$maxweight, maxvolume=$maxvolume, duration=$duration, frequency=$frequency, day=$day WHERE routeid = $id", {
		$id: routeid,
		$company: newRoute.company,
		$origin: newRoute.origin,
        $destination: newRoute.destination,
        $weightcost: newRoute.weightcost,
        $volumecost: newRoute.volumecost,
        $maxweight: newRoute.maxweight,
        $maxvolume: newRoute.maxvolume,
        $duration: newRoute.duration,
        $frequency: newRoute.frequency,
        $day: newRoute.day
    	}, function(err){
            if(err){
                console.log("Error updating route with id: " + routeid);
            }else{
                console.log(this);
                callback(this.changes);
            }
        });
};
