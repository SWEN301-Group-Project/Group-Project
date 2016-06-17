var sqlite3 = require("sqlite3").verbose(),
    assert = require("assert");

var dbFile = "./database/test.db";
var db = new sqlite3.Database(dbFile);

//adds a new manager row to the managers table
//the manager object must be ==> {username : <manager username>}
//The number of rows changed is returned.
//PostCondition: returns > 0 ==> inserted successful
exports.insertManager = function(manager, callback){
    //TODO: ensure manager does not exist already??
    var stmt = db.prepare("INSERT INTO managers (username, password) VALUES (?, ?)");
    console.log("Inside insert Manager");
    stmt.run([manager.username.toLowerCase(), manager.password], function(err){
        console.log("done query");
        console.log(this);
        if(err){callback(0)}
        else if (callback){
            callback(this.changes);
        }
    });
};

//removes a manager from table by their id
//The number of rows removed is returned
//PostCondition: if return > 0 ==> {return} rows deleted successfully
exports.deleteManager = function(managerid, callback){
    db.run("DELETE FROM managers WHERE managerid = $id", {$id: managerid}, function(err){
        if(err){
            console.log("Error removing manager with id: " + managerid);
            callback(0);
        }else{
            console.log(this);
            if(callback){
                callback(this.changes);
            }
        }
    });
};

//updates a manager row specified by the id.
//the newManager parameter must be ==> {username : <manager username>}
//Returns number of rows changed.
exports.updateManager = function(managerid, newManager, callback){
    db.run("UPDATE managers SET username = $username, password = $password WHERE managerid = $id", {
        $id: managerid,
        $username: newManager.username.toLowerCase(),
        password : newManager.password
    }, function(err){
        if(err){
            console.log("Error updating manager with id: " + managerid);
            console.log(err);
            callback(0);
        }else{
            console.log(this);
            if(callback){
                callback(this.changes);
            }
        }
    });
};

//finds a manager from table by their username and password
//The number of rows removed is returned
//PostCondition: if return > 0 ==> {return} rows deleted successfully
exports.loginManager = function(username, password, callback){
    var stmt = "SELECT * FROM managers WHERE username = $username AND password = $password";
    db.get(stmt, {$username: username, $password: password}, function(err, manager){
        if(err){
            console.log("Error finding manager with username: " + username);
            callback(0);
        }else{
            console.log(this);
            if(callback){
                callback(manager);
            }
        }
    });
};

exports.getAllManagers = function(callback){
    console.log("inside getallmanagers");
    db.all("SELECT * FROM managers", function(err, rows){
        console.log("done query");
        if (err){console.log("Error loading managers: " + err); callback([]);}
        else{
            console.log("returning from getallmanagers");
            console.log(rows);
            callback(rows);
        }
    });
};

//returns manager that matches the username. This is used to retrieve specific manager objects
exports.getManagerByUsername= function(username, callback){
    var stmt = "SELECT * FROM managers WHERE username = $username";
    db.get(stmt, {$username: username}, function(err, manager){
        if(err){console.log("Error loading manager: " + err); callback();}
        else if (callback){
            callback(manager);
        }
    });
};