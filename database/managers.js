//adds a new manager row to the managers table
//the manager object must be ==> {username : <manager username>}
//The number of rows changed is returned.
//PostCondition: returns > 0 ==> inserted successful
exports.insertManager = function(manager, callback){
    //TODO: ensure manager does not exist already??
    var stmt = db.prepare("INSERT INTO managers (username, password) VALUES (?, ?)");

    stmt.run([manager.name.toLowerCase(), manager.password], function(err){
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
    db.run("SELECT * FROM managers WHERE username = $username AND password = $password", {$username: username, $password: password}, function(err){
        if(err){
            console.log("Error finding manager with username: " + username);
            callback(0);
        }else{
            console.log(this);
            if(callback){
                callback(this.changes);
            }
        }
    });
};

exports.getAllManagers = function(callback){
    db.all("SELECT * FROM managers", function(err, rows){
        if (err){console.log("Error loading managers: " + err); callback([]);}
        else if (callback){
            callback(rows);
        }
    });
};

exports.getOneManagers = function(callback){
    db.all("SELECT * FROM managers WHERE username = admin", function(err, rows){
        if (err){console.log("Error loading managers: " + err); callback([]);}
        else if (callback){
            callback(rows);
        }
    });
};