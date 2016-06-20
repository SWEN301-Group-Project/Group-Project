var sqlite3 = require("sqlite3").verbose(),
    dbFile = "./database/test.db",
    db = new sqlite3.Database(dbFile);
/*
A mail object looks like:


var customerprice = {
    origin: 1,
    destination: 2,
    weightcost: 50,
    volumecost: 20,
    priority: "Land"
};

The id is the primary key and is autoincremented. So when updating or inserting
a customerprice object you do not need to supply the id.

The following are the database function implemented by customerprice.js file:
    1.getAllPrices ==> returns array of customerprice objects
    2.getpriceById ==> 
    2 getPriceByOrigin ==> returns array of customerprice object that have origin = Origin parameter
    3 getPriceByOriginAndDestination ==> returns array of customerprice object that have origin = Origin parameter AND destination = Destination parameter
    4 insertPrice ==> inserts new customerprice object to database
    5 deletePrice ==> deletes customerprice by id
    6 updatePrice ==> update customerprice by id

*/

//returns list of all customerprice objects
exports.getAllPrices = function(callback){
    var stmt = "SELECT priceid, ORIGIN.name AS origin, customerprice.origin as originid, DEST.name AS destination, customerprice.destination as destinationid, weightcost, volumecost, priority "
    			 + "FROM customerprice "
    			 + "LEFT JOIN locations AS ORIGIN ON customerprice.origin = ORIGIN.locationid "
    			 + "LEFT JOIN locations AS DEST ON customerprice.destination = DEST.locationid";
    
    db.all(stmt, function(err, rows){
        if (err){
            console.log("Error loading customerprices: " + err);
            callback([]);
        } else if (callback){
            callback(rows);
        }
    });
};

//returns customerprice objects where origin == origin parameter.
//The paramter: origin must be location id.
exports.getPriceByOrigin = function(originid, callback){
    var stmt = "SELECT priceid, ORIGIN.name AS origin, DEST.name AS destination, weightcost, volumecost, priority "
    			 + "FROM customerprice "
    			 + "LEFT JOIN locations AS ORIGIN ON customerprice.origin = ORIGIN.locationid "
    			 + "LEFT JOIN locations AS DEST ON customerprice.destination = DEST.locationid "
    			 + "WHERE customerprice.origin = $originid";
    			 
    db.all(stmt, {$originid: originid}, function(err, rows){
        if(err){
            console.log("Error loading customerprice: " + err);
            callback([]);
        } else if (callback){
            callback(rows);
        }
    });
};

//returns customerprice objects where origin == origin parameter AND destination == destination parameter.
//The paramters: origin and destination must be location id.
exports.getPriceByOriginAndDestination = function(originid, destinationid, callback){
    var stmt = "SELECT priceid, ORIGIN.name AS origin, DEST.name AS destination, weightcost, volumecost, priority "
    			 + "FROM customerprice "
    			 + "LEFT JOIN locations AS ORIGIN ON customerprice.origin = ORIGIN.locationid "
    			 + "LEFT JOIN locations AS DEST ON customerprice.destination = DEST.locationid "
    			 + "WHERE customerprice.origin = $originid AND customerprice.destination = $destinationid";
    			 
    db.all(stmt, {$originid: originid, $destinationid: destinationid}, function(err, rows){
        if(err){
            console.log("Error loading customerprice: " + err);
            callback([]);
        } else if (callback){
            callback(rows);
        }
    });
};

//returns customerprices object by id
exports.getPriceById = function(priceid, callback){
	var stmt = "SELECT priceid, ORIGIN.name AS origin, DEST.name AS destination, weightcost, volumecost, priority "
    			 + "FROM customerprice "
    			 + "LEFT JOIN locations AS ORIGIN ON customerprice.origin = ORIGIN.locationid "
    			 + "LEFT JOIN locations AS DEST ON customerprice.destination = DEST.locationid "
    			 + "WHERE priceid = $priceid";
    db.get(stmt, {$priceid: priceid}, function(err, customerprice){
        if(err){
            console.log("Error loading customerprice: " + err)
            callback();
        } else if (callback){
            callback(customerprice);
        }
    });
};

//Adds a new customerprice row to the customerprice table
//The customerprice object must be similar to:
/* var customerprice = {
    origin: 1,
    destination: 2,
    weightcost: 50,
    volumecost: 20,
    priority: "Land"
	};*/
//Origin and destination are foreign keys so they must be integers
//PostCondition: if return value > 0 ==> customerprice inserted sucessfully
exports.insertCustomerPrice = function(customerprice, callback){
	var stmt = db.prepare("INSERT INTO customerprice (origin, destination, weightcost, volumecost, priority) VALUES (?, ?, ?, ?, ?) ");
	stmt.run([
        customerprice.origin,
        customerprice.destination,
        customerprice.weightcost,
        customerprice.volumecost,
        customerprice.priority
    ], function(err){
        if(err) {
            if (callback) {
                callback(0);
            }
        }else{
            if(callback) {
                callback(this.changes);
            }
        }
    });
};

//removes a customerprice from table by its id
//The number of rows removed is returned
//PostCondition: if return > 0 ==> {return} rows deleted successfully
exports.deleteCustomerPrice = function(priceid, callback){
    db.run("DELETE FROM customerprice WHERE priceid = $id", {$id: priceid}, function(err){
        if(err){
            console.log("Error removing customerprice with id: " + priceid);
            if(callback) {
                callback(0);
            }
        }else{
            console.log(this);
            if(callback){
                callback(this.changes);
            }
        }
    });

};

//updates a customerprice row specified by the id
//the newCustomerPrice object must be similar to customerprice object of insertCustomerPrice paramter
//Returns the number of rows changed
exports.updateCustomerPrice = function(priceid, newCustomerPrice, callback){
    db.run("UPDATE customerprice SET origin = $origin, destination=$destination, weightcost=$weightcost, volumecost=$volumecost, priority=$priority WHERE priceid = $id", {
		$id: priceid,
		$origin: newCustomerPrice.origin,
        $destination: newCustomerPrice.destination,
        $weightcost: newCustomerPrice.weightcost,
        $volumecost: newCustomerPrice.volumecost,
        $priority: newCustomerPrice.priority
    	}, function(err){
        if(err){
            console.log("Error updating customerprice with id: " + priceid);
            console.log(err);
        }else{
            if(callback) {
                callback(this.changes);
            }
        }
    });
};