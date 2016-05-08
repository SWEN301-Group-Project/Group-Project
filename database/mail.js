var sqlite3 = require("sqlite3").verbose(),
    assert = require("assert");

var dbFile = "./database/test.db";
var db = new sqlite3.Database(dbFile);

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
    1. getAllMail ==> returns array of mail objects
    2 getLocationByDate ==> returns array of mail object that have date <= Date parameter
    3 getLocationById ==> returns mail object by id
    4 insertMail ==> inserts new mail object to database
    5 deleteMail ==> deletes mail by id
    6 updateMail ==> update Location by id
*/

//returns list of all mail objects
exports.getAllMail = function(callback){
    var stmt = "SELECT * FROM mails";
    db.all(stmt, function(err, rows){
        if (err){
            console.log("Error loading mails: " + err);
            callback([]);
        } else if (callback){
            callback(rows);
        }
    });
}

//returns mail objects where date <= dateAsString paramters.
//The paramter: dateAsString must be string representation of date.
// e.g. new Date().toISOString();
exports.getMailByDate = function(dateAsString, callback){
    var stmt = "SELECT * FROM mails WHERE date <= $date";
    db.all(stmt, {$date: dateAsString}, function(err, rows){
        if(err){
            console.log("Error loading mail: " + err);
            callback([]);
        } else if (callback){
            callback(rows);
        }
    });
}
//returns mail object that has id == mailid
exports.getMailById = function(mailid, callback){
    var stmt = "SELECT * FROM mails WHERE mailid = $mailid";
    db.get(stmt, {$mailid: mailid}, function(err, mail){
        if(err){
            console.log("Error loading mail: " + err)
            callback();
        } else if (callback){
            callback(mail);
        }
    });
}

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
//TODO: do left join to return the origin and destination strings
exports.insertMail = function(mail, callback){
	var stmt = db.prepare("INSERT INTO mails (origin, destination, weight, volume, priority, totalcustomercost, totalbusinesscost, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ");

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
}

//removes a mail from table by its id
//The number of rows removed is returned
//PostCondition: if return > 0 ==> {return} rows deleted successfully
exports.deleteMail = function(mailid, callback){
    db.run("DELETE FROM mails WHERE mailid = $id", {$id: mailid}, function(err){
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

}

//updates a mail row specified by the id
//the newMail object must be similar to mail object of insertMail paramters
//Returns the number of rows changed
exports.updateMail = function(mailid, newMail, callback){
    db.run("UPDATE mails SET origin = $origin, destination=$destination, weight=$weight, volume=$volume, priority=$priority, totalcustomercost=$totalcustomercost, totalbusinesscost=$totalbusinesscost, date=$date WHERE mailid = $id", {
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