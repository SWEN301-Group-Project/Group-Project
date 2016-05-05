var sqlite3 = require("sqlite3").verbose()
    fs = require("fs")
    assert = require("assert");

//Setup sqlite database
var dbFile = "./database/test.db";
var dbExists = fs.existsSync(dbFile);
//check if database file exists
if(!dbExists){
    console.log("DB file does not exist:\n\t Creating one now.");
    fs.openSync(dbFile, "w"); //create database file for writing to
}
//initialise the database
var db = new sqlite3.Database(dbFile);
db.serialize(function(){
    //create the tables in paralle for efficiency.
    db.serialize(function(){
        /*
        database queries scheduled in parallelize function will run
        in parallel
        */
        //assume that each location has unique name
        db.run('CREATE TABLE IF NOT EXISTS locations ('
            + 'locationid INTEGER PRIMARY KEY, '
            + 'name TEXT'
            + ')');

        db.run('CREATE TABLE IF NOT EXISTS companies ('
            + 'companyid INTEGER PRIMARY KEY, '
            + 'name TEXT, '
            + 'type TEXT'
            + ')');

        db.run('CREATE TABLE IF NOT EXISTS routes ('
            + 'routeid INTEGER PRIMARY KEY, '
            + 'company INTEGER, '
            + 'origin INTEGER, '
            + 'destination INTEGER'
            + 'weightcost INTEGER, '
            + 'volumecost INTEGER, '
            + 'maxweight INTEGER, '
            + 'maxvolume INTEGER, '
            + 'duration INTEGER, '
            + 'day INTEGER, ' //day of the week will be represented as an integer 0 <= day < 7
            + 'FOREIGN KEY(company) REFERENCES companies(companyid), '
            + 'FOREIGN KEY(origin) REFERENCES locations(origin), '
            + 'FOREIGN KEY(destination) REFERENCES locations(destination) '
            + ')');

        db.run('CREATE TABLE IF NOT EXISTS mails ('
            + 'mailid INTEGER PRIMARY KEY, '
            + 'origin INTEGER, '
            + 'destination INTEGER, '
            + 'weight INTEGER, '
            + 'volume INTEGER, '
            + 'priority TEXT, '
            + 'totalcustomercost REAL, '
            + 'totalbusinesscost REAL, '
            + 'date TEXT, ' //storing date as string since it is simplest to work with javascript date object
            + 'FOREIGN KEY(origin) REFERENCES locations(locationid), '
            + 'FOREIGN KEY(destination) REFERENCES locations(locationid) '
            + ')');

        db.run('CREATE TABLE IF NOT EXISTS customerprice ('
            + 'priceid INTEGER PRIMARY KEY, '
            + 'origin INTEGER, '
            + 'destination INTEGER, '
            + 'weightcost INTEGER, '
            + 'volumecost INTEGER, '
            + 'priority TEXT, '
            + 'FOREIGN KEY(origin) REFERENCES locations(locationid), '
            + 'FOREIGN KEY(destination) REFERENCES locations(locationid) '
            + ')');
    })
})

/*
This will be the database object that will be used to perform database queries
The Database object will contain functions that will be invoked for specific
query result.

e.g.
this.getCustomerPrice = function(toLocation, fromLocation, priority, callback){
     var stmt = db.get("SELECT weightcost, volumecost FROM customerprice WHERE to = $to AND from = $from ", {$to: toLocation, $from: fromLocation});
}
*/

function Database(){
    "use strict"
    /*
    Functions to implement:
     1. get locations ==> returns array of location objects
     1.1 get location based on name
     1.2 get location based on id
     1.3 insert location
     1.4 delete location
     2. get mails ==> returns array of mail
     2.1 get mail based on id
     2.2 get mail between dates
     2.3 get mail on date
     2.4 insert mail
     3. get companies ==> returns array of companies
     3.1 get company by name
     3.2 get company by id
     3.3 insert company
     3.4 delete company
     4. get routes ==> returns array of routes
     4.1 get route of origin and destination
     4.2 get route by id
     4.3 insert route
     4.4 delete route
     5. get list of customer prices ==> returns array of customer prices
     5.1 get customer price by id
     5.2 get customer price for given origin and destination
     5.3 insert customer price
    */
    //Returns an array of location objects.
    /*
    Example of return ==> [ { locationid: 1, name: 'Wellington' },
                            { locationid: 2, name: 'Christchurch' },
                            { locationid: 3, name: 'Auckland' } ]
    */
    this.getAllLocations = function(callback){
        db.run("INSERT INTO locations (name) values ('Wellington')");
        // var stmt = db.prepare("SELECT * FROM locations");
        db.all("SELECT locationid, name FROM locations", function(err, rows){
            if (err){console.log("Error loading locations: " + err)}
            else{
                callback(rows);
            }
        });
    }
    this.getLocationFromName = function(locationName, callback){
        // var stmt = 
    }
}

module.exports.Database = Database;
