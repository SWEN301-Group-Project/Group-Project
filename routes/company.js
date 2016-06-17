/**
 * Created by elliot on 17/06/16.
 */

var express = require('express');
var router = express.Router();


var Company = require('../database/company');

//company
router.get("/", function(req, res) {
    "use strict";
    Company.getAllCompanies(function(allCompanies){
        res.render('company', {companyActive: true, title: "Company", loggedin: req.session.manager ? true : false, companies: allCompanies});
    });
});

router.get("/:companyid", function(req, res){
    var companyid = req.params.companyid;
    Company.getCompanyById(companyid, function(company){
        console.log(company);
        res.render('updateCompany', {
            companyActive: true,
            title: "Update Company",
            loggedin: req.session.manager ? true : false,
            companyid: companyid,
            company: company
        });
    });
});

router.post("/delete/:companyid", function(req,res){
    var companyid = req.params.companyid;

    Company.deleteCompany(companyid, function(result){
        console.log(result);
        if(result){
            //success
            Company.getAllCompanies(function(allCompanies){
                res.render('company', {companyActive: true, title: "Company", loggedin: req.session.manager ? true : false, companies: allCompanies, notify: "company successfully deleted", notifyType:"warning"});
            });
        } else {
            Company.getCompanyById(companyid, function(company){
                res.render('updateCompany', {
                    companyActive: true,
                    title: "Update Company",
                    loggedin: req.session.manager ? true : false,
                    companyid: companyid,
                    company: company,
                    notify: "Error deleting company: " + company.name,
                    notifyType: "danger"
                });
            });
        }
    });
});

router.post("/update/:companyid", function(req,res){
    var company = req.body;
    var companyid = req.params.companyid;
    Company.updateCompany(companyid, company, function(result){
        console.log(result);
        if (result){
            Company.getAllCompanies(function(allCompanies){
                res.render('company', {companyActive: true, title: "Company", loggedin: req.session.manager ? true : false, companies: allCompanies, notify: company.name + " successfully updated", notifyType: "warning"});
            });
        } else {
            //could not update the location
            Company.getCompanyById(companyid, function(company){
                res.render('updateCompany', {
                    companyActive: true,
                    title: "Update Company",
                    loggedin: req.session.manager ? true : false,
                    companyid: companyid,
                    company: company,
                    notify: "Error deleting company: " + company.name,
                    notifyType: "danger"
                });
            });
        }
    });
});

router.post("/", function (req, res) {
    console.log(req.body);
    var newCompany = req.body;
    var error;
    if (!newCompany.name){
        error = "Must provide a valid company name";
    } else if (!newCompany.type) {
        error = "Must provide the required details";
    }
    if (error) {
        Company.getAllCompanies(function(allCompanies){
            res.status(404);
            res.render('company', {
                companyActive: true,
                title: "Company",
                loggedin: req.session.manager ? true : false,
                company: newCompany,
                companies: allCompanies,
                error: error
            });
        });
    } else {
        Company.insertCompany(newCompany, function (result) {
            console.log(result);
            Company.getAllCompanies(function (allCompanies) {
                if (result.changes) {
                    res.render('company', {
                        companyActive: true,
                        title: "Company",
                        loggedin: req.session.manager ? true : false,
                        companies: allCompanies,
                        notify: "Successfully added: " + newCompany.name
                    });
                } else {
                    res.render('company', {
                        companyActive: true, title: "Company",
                        loggedin: req.session.manager ? true : false,
                        companies: allCompanies,
                        notify: "Error occurred",
                        notifyType: "danger"
                    });
                }
            });
        });
    }
});

module.exports = router;