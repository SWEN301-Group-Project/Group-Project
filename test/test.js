var expect = require("chai").expect,
    request = require('supertest'),
    Database = require('../database/database').Database,
    Mail = require('../database/mail').Mail;

var express = require('express');

var app = express();

app.get('/user', function(req, res) {
    res.status(200).json({ name: 'tobi' });
});

/**
 * Mail.html form tests
 */
describe("Post mail", function(){
    before(function(done){
        //this needs to be in before
        /**
         * Initialise the database.
         */
        var database = new Database().init("./database/test2.db");
        Mail = new Mail("./database/test2.db");
        done();

    });
    it('check adding valid mail', function () {
        request(app)
            .post('/addMail')
            .send({"origin": 1, "destination": 2, "weight": 88, "volume": 9, "priority": "INTERNATIONAL STANDARD"})
            .end(function (err, res) {
                if (err) return done(err);
                done();
            });
    });
    it('check invalid weight', function(){
        request(app)
            .post('/addMail')
            .send({"origin": 1,"destination": 2, "weight": "invalid", "volume": 9, "priority":"INTERNATIONAL STANDARD"})
            .expect(404)
            .end(function(err, res) {
                if (err) return done(err);
                done();
            });
    });
    it('check invalid volume', function(){
        request(app)
            .post('/addMail')
            .send({"origin": 1,"destination": 2, "weight": 88, "volume": "invalid", "priority":"INTERNATIONAL STANDARD"})
            .expect(404)
            .end(function(err, res) {
                if (err) return done(err);
                done();
            });
    });

    it('check duplicate origin and destination', function(){
        request(app)
            .post('/addMail')
            .send({"origin": 1,"destination": 1, "weight": "invalid", "volume": 9, "priority":"INTERNATIONAL STANDARD"})
            .expect(404)
            .end(function(err, res) {
                if (err) return done(err);
                done();
            });
    });
});

// /**
//  * Mail.js database tests.
//  */
// describe("Mail database tests", function () {
//     //use existing database via database.init("") to use existing locations'
//     //Mail = new Mail("./database/test2.db");
//
//     var Mail;
//     var testMail = {};
//
//     before(function(done){
//         //this needs to be in before
//         /**
//          * Initialise the database.
//          */
//         var database = new Database().init("./database/test2.db");
//         Mail = new Mail("./database/test2.db");
//         testMail = {
//             origin: '1',
//             destination: '2',
//             weight: '3',
//             volume: '3',
//             priority: 'DOMESTIC STANDARD'
//         };
//         done();
//
//     });
//
//     it("Test insert mail", function () {
//         Mail.insertMail(testMail, function (result) {
//             console.log(result);
//             expect(result).to.be.true;
//             testMail.id = result.lastID;
//         });
//     });
//
//     it("Test get all mail", function () {
//         Mail.getAllMail(function(result){
//             expect(result instanceof Array).to.be.true;
//         })
//     });
//
//     it("Test get mail by id", function(){
//         Mail.getMailById(1, function(result){
//             console.log(result);
//             expect(result).to.be.true;
//         });
//     });
//
//
// });
