var sqlite3 = require("sqlite3").verbose(),
    assert = require("assert");

var dbFile = "./database/test.db";
var db = new sqlite3.Database(dbFile);

/*
A company object looks like: {name: <name>, type: <type: air or land>}
The id is the primary key and is autoincremented. So when updating or inserting
a company object you do not need to supply the id.

The following are the database function implemented by mail.js file:
    1. getAllCompanies ==> returns array of company objects
    2 getCompanyByNameAndType ==> returns location object that has name and type equal to parameter
    3 getCompanyById ==> returns company object that has id equal to parameter
    4 insertCompany ==> inserts new company object to database
    5 deleteCompany ==> deletes company by id
    6 updateCompany ==> update company by id
*/
//returns all company
exports.getAllCompanies = function(callback){
    // var stmt = db.prepare("SELECT * FROM locations");
    db.all("SELECT * FROM companies", function(err, rows){
        if (err){
            console.log("Error loading companies: " + err);
            callback([]);
        }else if(callback){
            callback(rows);
        }
    });
};

//returns company objects where name == companyName and type=comanyType
exports.getCompanyByNameAndType = function(companyName, companyType, callback){
    var stmt = "SELECT * FROM companies WHERE name = $name AND type = $type";
    db.get(stmt, {$name: companyName, $type:companyType}, function(err, company){
        if(err){
            console.log("Error loading company: " + err);
            callback();}
        else {
            callback(company);
        }
    });
};

//returns company object that has id == companyId
exports.getCompanyById = function(companyId, callback){
    var stmt = "SELECT * FROM companies WHERE companyid = $companyid";
    db.get(stmt, {$companyid: companyId}, function(err, location){
        if(err){console.log("Error loading location: " + err); callback();}
        else{
            callback(location);
        }
    });
};

//Adds a new company row to the companies table
//The mail object must similar to:
/*    var company = {
        name: Air NZ,
        type: "Air"
      };*/
//PostCondition: if return value > 0 ==> company inserted sucessfully
exports.insertCompany = function(company, callback){
    var stmt = db.prepare("INSERT INTO companies (name, type) VALUES (?, ?)");

    stmt.run([
        company.name,
        company.type
    ], function(err){
        if(err){console.log(err); if(callback){callback(0);}}
        else{
            if(callback) {
                callback(this);
            }
        }
    });
};

//removes a company from table by its id
//The number of rows removed is returned
//PostCondition: if return > 0 ==> {return} rows deleted successfully
exports.deleteCompany = function(companyid, callback){
    db.run("DELETE FROM companies WHERE companyid = $id", {$id: companyid}, function(err){
        if(err){
            console.log("Error removing company with id: " + companyid);
            callback(0);
        }else{
            console.log(this);
            if(callback){
                callback(this.changes);
            }
        }
    });

};

//updates a company row specified by the id
//the newCompany object must be similar to company parameter of insertCompany
//Returns the number of rows changed
exports.updateCompany = function(companyid, newCompany, callback){
    db.run("UPDATE companies SET name = $name, type = $type WHERE companyid = $id", {
        $id: companyid,
	    $name: newCompany.name,
        $type: newCompany.type
    }, function(err){
        if(err){
            console.log("Error updating company with id: " + companid);
        }else{
            console.log(this);
            if(callback) {
                callback(this.changes);
            }
        }
    });
};
