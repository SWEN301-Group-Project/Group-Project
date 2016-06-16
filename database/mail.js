var sqlite3 = require("sqlite3").verbose(),
    assert = require("assert"),
    // dbFile = "./database/test.db",
    // db = new sqlite3.Database(dbFile),
	 Company = require('./company'),
    Location = require('./location');
/*
A mail object looks like:
var mail = {
    origin: 1,
    destination: 2,
    weight: 50,
    volume: 20,
    priority: "Land",
    totalcustomercost: 500,
    totalbusinesscost: 100
};
The id is the primary key and is autoincremented. So when updating or inserting
a mail object you do not need to supply the id.
The mail also has a date field, but that is auto generated.
The date field contains last date the mail was updated/created

The following are the database function implemented by mail.js file:
    1.getAllMail ==> returns array of mail objects
    2 getLocationByDate ==> returns array of mail object that have date <= Date parameter
    3 getLocationById ==> returns mail object by id
    4 insertMail ==> inserts new mail object to database
    5 deleteMail ==> deletes mail by id
    6 updateMail ==> update Location by id

*/
var Mail = function(dbFile){

    this._dbFile = dbFile ? dbFile : "./database/test.db";
    this.db = new sqlite3.Database(this._dbFile);

    this.getMailStats = function(stringOffset, callback) {
        var stmt = "SELECT mailid, ORIGIN.name AS origin, DEST.name AS destination, weight, volume, priority, totalcustomercost, totalbusinesscost, date "
            + "FROM mails "
            + "LEFT JOIN locations AS ORIGIN ON mails.origin = ORIGIN.locationid "
            + "LEFT JOIN locations AS DEST ON mails.destination = DEST.locationid";

        this.db.all(stmt, function(err, rows){
            if (err){
                console.log("Error loading mails: " + err);
                callback([]);
            } else if (callback){

                var dateOffset = parseInt(stringOffset);

                var date = new Date();

                while (date.getDay() != 1) {
                    date.setDate(date.getDate() - 1);
                }

                date.setDate(date.getDate() + (dateOffset * 7));

                var range = date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear();

                var labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

                var series = [
                    [0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0]
                ];

                // This is super inefficient, looping over each entry in the database
                // against each date, but it works and for the purpose of this assignment
                // the database is unlikely to get large enough for this to create any
                // speed issues.
                for (var i = 0; i < 7; i++) {
                    labels[i] = labels[i] + ", " + date.getDate() + "/" + date.getMonth();

                    var stringDate = date.getFullYear() + '-'
                    + ('0' + (date.getMonth() + 1)).slice(-2) + '-'
                    + ('0' + (date.getDate())).slice(-2);

                    for (var j = 0; j < rows.length; j++) {
                        if (stringDate == rows[j].date.slice(0, 10)) {
                            series[0][1] += rows[j].totalcustomercost;
                            series[0][2] += rows[j].totalbusinesscost;
                        }
                    }

                    date.setDate(date.getDate() + 1);
                }

                date.setDate(date.getDate() - 1);

                range = range + " to " + date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear();

                callback(labels, series, range, dateOffset - 1, dateOffset + 1);
            }
        });
    },

    //returns list of all mail objects
    this.getAllMail = function(callback){
        var stmt = "SELECT mailid, ORIGIN.name AS origin, DEST.name AS destination, weight, volume, priority, totalcustomercost, totalbusinesscost, date "
            + "FROM mails "
            + "LEFT JOIN locations AS ORIGIN ON mails.origin = ORIGIN.locationid "
            + "LEFT JOIN locations AS DEST ON mails.destination = DEST.locationid";

//    var stmt = "SELECT * from mails";
        //need to join table with location
        this.db.all(stmt, function(err, rows){
            if (err){
                console.log("Error loading mails: " + err);
                callback([]);
            } else if (callback){
                callback(rows);
            }
        });
    },

//returns mail objects where date <= dateAsString paramters.
//The paramter: dateAsString must be string representation of date.
// e.g. new Date().toISOString();
    this.getMailByDate = function(dateAsString, callback){
        var stmt = "SELECT mailid, ORIGIN.name AS origin, DEST.name AS destination, weight, volume, priority, totalcustomercost, totalbusinesscost, date "
            + "FROM mails "
            + "LEFT JOIN locations AS ORIGIN ON mails.origin = ORIGIN.locationid "
            + "LEFT JOIN locations AS DEST ON mails.origin = DEST.locationid "
            + "WHERE date <= $date";
        this.db.all(stmt, {$date: dateAsString}, function(err, rows){
            if(err){
                console.log("Error loading mail: " + err);
                callback([]);
            } else if (callback){
                callback(rows);
            }
        });
    },
//returns mail object that has id == mailid
    this.getMailById = function(mailid, callback){
        var stmt = "SELECT mailid, ORIGIN.name AS origin, DEST.name AS destination, weight, volume, priority, totalcustomercost, totalbusinesscost, date "
            + "FROM mails "
            + "LEFT JOIN locations AS ORIGIN ON mails.origin = ORIGIN.locationid "
            + "LEFT JOIN locations AS DEST ON mails.origin = DEST.locationid "
            + "WHERE mailid = $mailid";
        this.db.get(stmt, {$mailid: mailid}, function(err, mail){
            if(err){
                console.log("Error loading mail: " + err)
                callback();
            } else if (callback){
                callback(mail);
            }
        });
    },

//Adds a new mail row to the mails table
//The mail object must similar to:
    /*    var mail = {
     origin: 1,
     destination: 2,
     weight: 50,
     volume: 20,
     priority: "Land",
     totalcustomercost: 500,
     totalbusinesscost: 100
     };*/
//Origin and destination are foreign keys so they must be integers
//PostCondition: if return value > 0 ==> mail inserted sucessfully
    this.insertMail = function(mail, callback){
        var stmt = this.db.prepare("INSERT INTO mails (origin, destination, weight, volume, priority, totalcustomercost, totalbusinesscost, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ");

        stmt.run([
            mail.origin,
            mail.destination,
            mail.weight,
            mail.volume,
            mail.priority,
            mail.totalcustomercost,
            mail.totalbusinesscost,
            new Date().toISOString()

        ], function(err){
            if(err){
                callback(0)}
            else{
                console.log(this);
                callback(this.changes);
            }
        });
    },

//removes a mail from table by its id
//The number of rows removed is returned
//PostCondition: if return > 0 ==> {return} rows deleted successfully
    this.deleteMail = function(mailid, callback){
        this.db.run("DELETE FROM mails WHERE mailid = $id", {$id: mailid}, function(err){
            if(err){
                console.log("Error removing mail with id: " + mailid);
                callback(0);
            }else{
                console.log(this);
                if(callback){
                    callback(this.changes);
                }
            }
        });

    },

//updates a mail row specified by the id
//the newMail object must be similar to mail object of insertMail paramters
//Returns the number of rows changed
    this.updateMail = function(mailid, newMail, callback){
        this.db.run("UPDATE mails SET origin = $origin, destination=$destination, weight=$weight, volume=$volume, priority=$priority, totalcustomercost=$totalcustomercost, totalbusinesscost=$totalbusinesscost, date=$date WHERE mailid = $id", {
            $id: mailid,
            $origin: newMail.origin,
            $destination : newMail.destination,
            $weight: newMail.weight,
            $volume: newMail.volume,
            $priority: newMail.priority,
            $totalcustomercost:newMail.totalcustomercost,
            $totalbusinesscost:newMail.totalbusinesscost,
            $date: new Date().toISOString()
        }, function(err){
            if(err){
                console.log("Error updating mail with id: " + mailid);
            }else{
                console.log(this);
                callback(this.changes);
            }
        });
    }


};

module.exports.Mail = Mail;
