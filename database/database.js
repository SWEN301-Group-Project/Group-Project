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
            + 'location INTEGER, '
            + 'weightcost INTEGER, '
            + 'volumecost INTEGER, '
            + 'maxweight INTEGER, '
            + 'maxvolume INTEGER, '
            + 'duration INTEGER, '
            + 'day INTEGER, ' //day of the week will be represented as an integer 0 <= day < 7
            + 'FOREIGN KEY(company) REFERENCES companies(companyid), '
            + 'FOREIGN KEY(location) REFERENCES locations(locationid) '
            + ')');

        db.run('CREATE TABLE IF NOT EXISTS mails ('
            + 'mailid INTEGER PRIMARY KEY, '
            + 'origin INTEGER, '
            + 'destination INTEGER, '
            + 'weight INTEGER, '
            + 'volume INTEGER, '
            + 'priority TEXT, '
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

}

module.exports.Database = Database;
