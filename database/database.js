var sqlite3 = require("sqlite3").verbose(),
    logFile = require('./logFile').logFile,
    fs = require("fs"),
    Mail = require('./mail').Mail,
    assert = require("assert"),
    Company = require('./company'),
    Location = require('./location'),
    Route = require('./routes'),
    Price = require('./customerprice');

Mail = new Mail();
/*
This will be the database object that will be used to perform database queries
The Database object will contain functions that will be invoked for specific
query result.

*/

function Database(){
    "use strict";
    this._dbFile = "./database/test.db";

    this.init = function (dbFile) {
        //Setup sqlite database
        if (dbFile) {
            this._dbFile = dbFile;
        }
        console.log("dbFile = " + this._dbFile);

        var dbExists = fs.existsSync(this._dbFile);
        //check if database file exists
        if (!dbExists) {
            console.log("DB file does not exist:\n\t Creating one now.");
            fs.openSync(this._dbFile, "w"); //create database file for writing to
        }
        //initialise the database
        var db = new sqlite3.Database(this._dbFile);
        var $this = this;
        db.serialize(function(){
            //create the tables
            db.serialize(function(){
                /*
                 database queries scheduled in parallelize function will run
                 in parallel
                 */
                //assume that each location has unique name
                db.run('CREATE TABLE IF NOT EXISTS locations ('
                    + 'locationid INTEGER PRIMARY KEY, '
                    + 'name TEXT, '
                    + 'isInternational INTEGER'
                    + ')');

                db.run('CREATE TABLE IF NOT EXISTS companies ('
                    + 'companyid INTEGER PRIMARY KEY, '
                    + 'name TEXT, '
                    + 'type TEXT'
                    + ')');

                db.run('CREATE TABLE IF NOT EXISTS routes ('
                    + 'routeid INTEGER PRIMARY KEY, '
                    + 'company INTEGER, '
                    + 'type TEXT, '
                    + 'origin INTEGER, '
                    + 'destination INTEGER, '
                    + 'weightcost INTEGER, '
                    + 'volumecost INTEGER, '
                    + 'maxweight INTEGER, '
                    + 'maxvolume INTEGER, '
                    + 'frequency INTEGER, '
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
                    + 'duration REAL, '
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
                db.run('CREATE TABLE IF NOT EXISTS managers ('
                    + 'managerid INTEGER PRIMARY KEY, '
                    + 'username TEXT, '
                    + 'password TEXT, '
                    + 'UNIQUE (username, password)'
                    + ')');
                db.run('INSERT OR IGNORE INTO managers (username, password) VALUES ("admin","admin")', function(){
                    //
                    // Dear fellow coder:
                    //
                    // Once you are done trying to 'optimize' this routine,
                    // and have realized what a terrible mistake that was,
                    // please increment the following counter as a warning
                    // to the next guy:
                    //
                    // total_hours_wasted_here = 3
                    //
                    // When I wrote this, only God and I understood what I was doing
                    // Now, God only knows
                    //
                    // Magic, Do not touch

                    //initialise the table values from log file
                    // I want to read the xml file after the database tables have been created. HACK HACK!!!
                    $this.readLogFile();
                    console.log('Loaded Data from XML document');
                });
            });
        });
    };

    this.readLogFile = function(callback){
        //read the log file
        //if logFile filename is given then set it as default logFile name otherwise use the default
        var $this = this;
        new logFile().loadXMLDoc(function (json) {
            //the plugin stores the events as an event array so we rename it here for clarity and simplicity in code
            var events = json.events.event;
            var event;
            if(events) {
                for (var i = 0; i < events.length; i++) {
                    /**
                     * Now we iterate over each event in the log file
                     *
                     * There are 4 types of types:
                     *  1. mail
                     *      * a mail event
                     *  2. location
                     *      * a location event
                     *  3. company
                     *      * a company event
                     *  4. route
                     *      * a route event
                     *  5. price
                     *      * a customer price event
                     */
                    var eventAdded = false;
                    event = events[i];
                    if (event.type[0] == 'mail') {
                        $this.readMailEvent(event, function(){
                            eventAdded = true;
                        });
                    }
                    else if (event.type[0].toLowerCase() == 'location') {
                        $this.readLocationEvent(event, function(){
                            eventAdded = true;
                        });
                    }
                    else if (event.type[0].toLowerCase() == 'company') {
                        $this.readCompanyEvent(event, function(){
                            eventAdded = true;
                        });
                    }
                    else if (event.type[0].toLowerCase() == 'routes') {
                        $this.readRouteEvent(event, function(){
                            eventAdded = true;
                        });
                    }
                    else if (event.type[0].toLowerCase() == 'price') {
                        $this.readPriceEvent(event, function(){
                            eventAdded = true;
                        });
                    }
                    else {
                        console.log('Unknown event found: ');
                        console.log(event);
                        eventAdded = true;
                    }
                    //Wow look at this HACK : COOOOL
                    require('deasync').loopWhile(function () {
                        return !eventAdded;
                    });
                }
            }
            if(callback) {
                callback();
            }
        });
    };

    this.readPriceEvent = function(priceEvent, callback){
        var price = {};
        for(var prop in priceEvent.data[0]){
            price[prop] = priceEvent.data[0][prop][0];
        }
        if (priceEvent.action[0].toLowerCase() == 'insert'){
            Price.insertCustomerPrice(price, function(){
               callback();
            });
        }
        if (priceEvent.action[0].toLowerCase() == 'update'){
            Price.updateCustomerPrice(price.priceid, price, function(){
                callback();
            });
        }
        if (priceEvent.action[0].toLowerCase() == 'delete'){
            Price.deleteCustomerPrice(price.priceid, function(){
                callback();
            });
        }
    };

    this.readRouteEvent = function(routeEvent, callback){
        var route = {};
        for(var prop in routeEvent.data[0]){
            route[prop] = routeEvent.data[0][prop][0];
        }
        if (routeEvent.action[0].toLowerCase() == 'insert'){
            Route.insertRoute(route, function(){
                callback();
            });
        }
        if (routeEvent.action[0].toLowerCase() == 'update'){
            Route.updateRoute(route.routeid, route, function(){
                callback();
            });
        }
        if (routeEvent.action[0].toLowerCase() == 'delete'){
            Route.deleteRoute(route.routeid, function(){
                callback();
            });
        }
    };

    this.readMailEvent = function(mailEvent, callback){
        /**
         * There are three types of applicable actions:
         *  1. insert
         *      * doesn't contain the id
         */
        var mail = {};
        for(var prop in mailEvent.data[0]){
            mail[prop] = mailEvent.data[0][prop][0];
        }
        if (mailEvent.action[0].toLowerCase() == 'insert'){
            Mail.insertMail(mail, function(){
                callback();
            });
        }
    };

    this.readCompanyEvent = function(companyEvent, callback){
        /**
         * There are three types of applicable actions:
         *  1. insert
         *      * doesn't contain the id
         *  2. update
         *      * must contain the id for reference
         *  3. delete
         *      * must contain the id for reference
         */
        var company = {};
        for(var prop in companyEvent.data[0]){
            company[prop] = companyEvent.data[0][prop][0];
        }
        if (companyEvent.action[0].toLowerCase() == 'insert'){
            Company.insertCompany(company, function(){
                callback();
            });
        }
        if (companyEvent.action[0].toLowerCase() == 'update'){
            Company.updateCompany(companyEvent.data[0].companyid[0],company, function(){
                callback();
            });
        }
        if (companyEvent.action[0].toLowerCase() == 'delete'){
            Company.deleteCompany(company.companyid, function(){
                callback();
            });
        }
    };

    this.readLocationEvent = function(locationEvent, callback){
        /**
         * There are three types of applicable actions:
         *  1. insert
         *      * doesn't contain the id
         *  2. update
         *      * must contain the id for reference
         *  3. delete
         *      * must contain the id for reference
         */
        var location = {};
        for(var prop in locationEvent.data[0]){
            location[prop] = locationEvent.data[0][prop][0];
        }
        if (locationEvent.action[0].toLowerCase() == 'insert'){
            Location.insertLocation(location, function(){
                callback();
            });
        }
        if (locationEvent.action[0].toLowerCase() == 'update'){
            Location.updateLocation(location.locationid, location, function(){
                callback();
            });
        }
        if (locationEvent.action[0].toLowerCase() == 'delete'){
            Location.deleteLocation(location.locationid, function(){
                callback();
            })
        }
    }
}

module.exports.Database = Database;