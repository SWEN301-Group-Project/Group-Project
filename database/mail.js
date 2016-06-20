var sqlite3 = require("sqlite3").verbose(),
    assert = require("assert"),
// dbFile = "./database/test.db",
// db = new sqlite3.Database(dbFile),
    Company = require('./company'),
    Location = require('./location'),
    priorities = ['DOMESTIC AIR', 'DOMESTIC STANDARD', 'INTERNATIONAL AIR', 'INTERNATIONAL STANDARD'];
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
var Mail = function (dbFile) {

    this._dbFile = dbFile ? dbFile : "./database/test.db";
    this.db = new sqlite3.Database(this._dbFile);

    this.getMailStats = function (stringOffset, callback) {
        var stmt = "SELECT mailid, ORIGIN.name AS origin, DEST.name AS destination, weight, volume, priority, totalcustomercost, totalbusinesscost, duration, date "
            + "FROM mails "
            + "LEFT JOIN locations AS ORIGIN ON mails.origin = ORIGIN.locationid "
            + "LEFT JOIN locations AS DEST ON mails.destination = DEST.locationid";

        this.db.all(stmt, function (err, rows) {
            if (err) {
                console.log("Error loading mails: " + err);
                callback([]);
            } else if (callback) {

                var dateOffset = parseInt(stringOffset);

                var date = new Date();

                // go to previous day of week until we get to Monday
                while (date.getDay() != 1) {
                    date.setDate(date.getDate() - 1);
                }

                // calculate the week offset
                date.setDate(date.getDate() + (dateOffset * 7));

                // String representing the date range
                var range = date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear();

                var labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

                var series = [
                    [0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0]
                ];

                // will be only the rows for this week
                var weekRows = [];

                // This is super inefficient, looping over each entry in the database
                // against each date, but it works and for the purpose of this assignment
                // the database is unlikely to get large enough for this to create any
                // speed issues.
                for (var i in labels) {
                    labels[i] = labels[i] + ", " + date.getDate() + "/" + date.getMonth();
/*
                    var stringDate = date.getFullYear() + '-'
                        + ('0' + (date.getMonth() + 1)).slice(-2) + '-'
                        + ('0' + (date.getDate())).slice(-2);
                    console.log(stringDate);
*/
						  var stringDate = date.toLocaleDateString(); //gets date in dd/mm/yyyy format
						  
                    for (var j in rows) {
                    	var rowDate = new Date(rows[j].date); //parse the date
                        if (stringDate == rowDate.toLocaleDateString()) {
                            series[0][i] += rows[j].totalcustomercost;
                            series[1][i] += rows[j].totalbusinesscost;
                            weekRows.push(rows[j]);
                        }
                    }

                    date.setDate(date.getDate() + 1);
                }

                // End of the date range
                date.setDate(date.getDate() - 1);
                range = range + " to " + date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear();

                //now to count all of the mail from each origin to each destination!
                //this logic will end up a bit ugly :(
                //may the gods of computer science have mercy on me for this hackery.

                var fullMailAmount = [];

                for (var i in weekRows) {
                    var originMatch = false;

                    for (var j in fullMailAmount) {
                        if (fullMailAmount[j].origin == weekRows[i].origin) {
                            originMatch = true;

                            var destinationMatch = false;
                            for (var k = 0; k < fullMailAmount[j].destinations.length; k++) {
                                if (fullMailAmount[j].destinations[k].destination == weekRows[i].destination) {
                                    destinationMatch = true;
                                    fullMailAmount[j].destinations[k].priorities[priorities.indexOf(weekRows[i].priority)].push(weekRows[i]);
                                }
                            }

                            if (!destinationMatch) {
                                fullMailAmount[j].destinations.push({
                                    destination: weekRows[i].destination,
                                    priorities: [[], [], [], []]
                                });
                                var k = fullMailAmount[j].destinations.length - 1;
                                fullMailAmount[j].destinations[k].priorities[priorities.indexOf(weekRows[i].priority)].push(weekRows[i]);
                            }
                        }
                    }

                    if (!originMatch) {
                        var j = fullMailAmount.length;
                        fullMailAmount.push({
                            origin: weekRows[i].origin,
                            destinations: [{
                                destination: weekRows[i].destination,
                                priorities: [[], [], [], []]
                            }]
                        });
                        fullMailAmount[j].destinations[0].priorities[priorities.indexOf(weekRows[i].priority)].push(weekRows[i]);
                    }
                }

                // need to extract the details for each origin and destination, ignoring priorities
                var mailAmount = [];

                for (var i in fullMailAmount) {
                    mailAmount.push({
                        origin: capitalizeFirstLetter(fullMailAmount[i].origin),
                        destinations: []
                    });
                    for (var j in fullMailAmount[i].destinations) {
                        mailAmount[i].destinations.push({
                            destination: capitalizeFirstLetter(fullMailAmount[i].destinations[j].destination),
                            totalNumber: 0,
                            totalVolume: 0,
                            totalWeight: 0,
                            totalIncome: 0,
                            totalExpenses: 0
                        })
                        for (var k in fullMailAmount[i].destinations[j].priorities) {
                            for (var l in fullMailAmount[i].destinations[j].priorities[k]) {
                                mailAmount[i].destinations[j].totalNumber++;
                                mailAmount[i].destinations[j].totalVolume
                                   += fullMailAmount[i].destinations[j].priorities[k][l].volume;
                                mailAmount[i].destinations[j].totalWeight
                                    += fullMailAmount[i].destinations[j].priorities[k][l].weight;
                                mailAmount[i].destinations[j].totalIncome
                                    += fullMailAmount[i].destinations[j].priorities[k][l].totalcustomercost;
                                mailAmount[i].destinations[j].totalExpenses
                                    += fullMailAmount[i].destinations[j].priorities[k][l].totalbusinesscost;
                            }
                        }
                    }
                }

                // also need to calculate critical routes and durations!
                // logic here is: for each origin, for each destination, for each priority, for each mail...
                var criticalRoutes = [];
                var durations = [];

                for (var i in fullMailAmount) {
                    for (var j in fullMailAmount[i].destinations) {
                        for (var k in fullMailAmount[i].destinations[j].priorities) {
                            if (fullMailAmount[i].destinations[j].priorities[k].length > 0) {
                                var count = 0;

                                var income = 0;
                                var expenses = 0;

                                var duration = 0;

                                for (var l in fullMailAmount[i].destinations[j].priorities[k]) {
                                    count++;
                                    duration += fullMailAmount[i].destinations[j].priorities[k][l].duration;
                                    income += fullMailAmount[i].destinations[j].priorities[k][l].totalcustomercost;
                                    expenses += fullMailAmount[i].destinations[j].priorities[k][l].totalbusinesscost;
                                }

                                var difference = (income-expenses)/count;

                                if (difference < 0) {
                                    criticalRoutes.push({
                                        origin: capitalizeFirstLetter(fullMailAmount[i].origin),
                                        destination: capitalizeFirstLetter(fullMailAmount[i].destinations[j].destination),
                                        priority: fullMailAmount[i].destinations[j].priorities[k][0].priority,
                                        difference: "$" + difference.toFixed(2)
                                    })
                                }

                                duration = duration/count;

                                var hours = Math.floor(duration);
                                var minutes = Math.floor((duration-hours)*60);

                                durations.push({
                                    origin: capitalizeFirstLetter(fullMailAmount[i].origin),
                                    destination: capitalizeFirstLetter(fullMailAmount[i].destinations[j].destination),
                                    priority: fullMailAmount[i].destinations[j].priorities[k][0].priority,
                                    duration: hours + " hours, " + minutes + " minutes"
                                })
                            }
                        }
                    }
                }

                // calculate the total for the week
                var weekTotal = {
                    number: 0,
                    volume: 0,
                    weight: 0,
                    income: 0,
                    expenses: 0
                };

                for (var i in weekRows) {
                    weekTotal.number += 1;
                    weekTotal.volume += weekRows[i].volume;
                    weekTotal.weight += weekRows[i].weight;
                    weekTotal.income += weekRows[i].totalcustomercost;
                    weekTotal.expenses += weekRows[i].totalbusinesscost;
                }

                // convert everything into readable format

                for (var i in mailAmount) {
                    for (var j in mailAmount[i].destinations) {
                        mailAmount[i].destinations[j].totalVolume = mailAmount[i].destinations[j].totalVolume.toFixed(2) + " cm³";
                        mailAmount[i].destinations[j].totalWeight = mailAmount[i].destinations[j].totalWeight.toFixed(2) + " g";
                        mailAmount[i].destinations[j].totalIncome = "$" + mailAmount[i].destinations[j].totalIncome.toFixed(2);
                        mailAmount[i].destinations[j].totalExpenses = "$" + mailAmount[i].destinations[j].totalExpenses.toFixed(2);
                    }
                }

                weekTotal.volume = weekTotal.volume.toFixed(2) + " cm³";
                weekTotal.weight = weekTotal.weight.toFixed(2) + " g";
                weekTotal.income = "$" + weekTotal.income.toFixed(2);
                weekTotal.expenses = "$" + weekTotal.expenses.toFixed(2);

                // looks nicer sorted

                mailAmount.sort(function(a, b){return a.origin > b.origin});

                for (var i in mailAmount) {
                    mailAmount[i].destinations.sort(function(a, b){return a.destination > b.destination});
                }

                criticalRoutes.sort(sortMail);

                durations.sort(sortMail);

                callback(labels, series, range, dateOffset - 1, dateOffset + 1, weekTotal, mailAmount, criticalRoutes, durations);
            }
        });
    },

        //returns list of all mail objects
        this.getAllMail = function (callback) {
            var stmt = "SELECT mailid, ORIGIN.name AS origin, DEST.name AS destination, weight, volume, priority, totalcustomercost, totalbusinesscost, duration, date "
                + "FROM mails "
                + "LEFT JOIN locations AS ORIGIN ON mails.origin = ORIGIN.locationid "
                + "LEFT JOIN locations AS DEST ON mails.destination = DEST.locationid";

            //need to join table with location
            this.db.all(stmt, function (err, rows) {
                if (err) {
                    console.log("Error loading mails: " + err);
                    callback([]);
                } else if (callback) {
                    callback(rows);
                }
            });
        },

//returns mail objects where date <= dateAsString paramters.
//The paramter: dateAsString must be string representation of date.
// e.g. new Date().toISOString();
        this.getMailByDate = function (dateAsString, callback) {
            var stmt = "SELECT mailid, ORIGIN.name AS origin, DEST.name AS destination, weight, volume, priority, totalcustomercost, totalbusinesscost, duration, date "
                + "FROM mails "
                + "LEFT JOIN locations AS ORIGIN ON mails.origin = ORIGIN.locationid "
                + "LEFT JOIN locations AS DEST ON mails.origin = DEST.locationid "
                + "WHERE date <= $date";
            this.db.all(stmt, {$date: dateAsString}, function (err, rows) {
                if (err) {
                    console.log("Error loading mail: " + err);
                    callback([]);
                } else if (callback) {
                    callback(rows);
                }
            });
        },
//returns mail object that has id == mailid
        this.getMailById = function (mailid, callback) {
            var stmt = "SELECT mailid, ORIGIN.name AS origin, DEST.name AS destination, weight, volume, priority, totalcustomercost, totalbusinesscost, duration, date "
                + "FROM mails "
                + "LEFT JOIN locations AS ORIGIN ON mails.origin = ORIGIN.locationid "
                + "LEFT JOIN locations AS DEST ON mails.origin = DEST.locationid "
                + "WHERE mailid = $mailid";
            this.db.get(stmt, {$mailid: mailid}, function (err, mail) {
                if (err) {
                    console.log("Error loading mail: " + err)
                    callback();
                } else if (callback) {
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
        this.insertMail = function (mail, callback) {
            if (!mail.date){
                mail.date = new Date().toString();
            }
            if (!mail.duration){
                mail.duration = 0.00;
            }
            var stmt = this.db.prepare("INSERT INTO mails (origin, destination, weight, volume, priority, totalcustomercost, totalbusinesscost, duration, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ");

            stmt.run([
                mail.origin,
                mail.destination,
                mail.weight,
                mail.volume,
                mail.priority,
                mail.totalcustomercost,
                mail.totalbusinesscost,
                mail.duration,
                mail.date
            ], function (err) {
                if (err) {
                    if(callback) {
                        callback(0)
                    }
                }
                else {
                    if(callback) {
                        callback(this.changes);
                    }
                }
            });
        },

//removes a mail from table by its id
//The number of rows removed is returned
//PostCondition: if return > 0 ==> {return} rows deleted successfully
        this.deleteMail = function (mailid, callback) {
            this.db.run("DELETE FROM mails WHERE mailid = $id", {$id: mailid}, function (err) {
                if (err) {
                    console.log("Error removing mail with id: " + mailid);
                    callback(0);
                } else {
                    console.log(this);
                    if (callback) {
                        callback(this.changes);
                    }
                }
            });

        },

//updates a mail row specified by the id
//the newMail object must be similar to mail object of insertMail paramters
//Returns the number of rows changed
        this.updateMail = function (mailid, newMail, callback) {
            if (!newMail.duration){
                newMail.duration = 0.00;
            }
            this.db.run("UPDATE mails SET origin = $origin, destination=$destination, weight=$weight, volume=$volume, priority=$priority, totalcustomercost=$totalcustomercost, totalbusinesscost=$totalbusinesscost, duration=$duration, date=$date WHERE mailid = $id", {
                $id: mailid,
                $origin: newMail.origin,
                $destination: newMail.destination,
                $weight: newMail.weight,
                $volume: newMail.volume,
                $priority: newMail.priority,
                $totalcustomercost: newMail.totalcustomercost,
                $totalbusinesscost: newMail.totalbusinesscost,
                $duration: newMail.duration,
                $date: new Date().toISOString()
            }, function (err) {
                if (err) {
                    console.log("Error updating mail with id: " + mailid);
                } else {
                    console.log(this);
                    callback(this.changes);
                }
            });
        }
    
};

module.exports.Mail = Mail;

function capitalizeFirstLetter(string) {
    var splitName = string.split(" ");

    var fullName = "";

    for (var word in splitName) {
        fullName = fullName + splitName[word].charAt(0).toUpperCase() + splitName[word].slice(1) + " ";
    }

    return fullName.trim();
}

function sortMail(a, b) {
    if (a.origin != b.origin) {
        return a.origin > b.origin
    }
    else if (a.destination != b.destination) {
        return a.destination > b.destination;
    }
    else {
        return a.priority > b.priority;
    }
}