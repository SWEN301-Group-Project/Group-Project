var expect = require("chai").expect,
    Database = require('../database/database').Database,
    Mail = require('../database/mail').Mail;

describe("Test test", function () {
    it("should pass this test", function () {
        expect(true).to.be.true;
    });
});



/**
 * Mail.js database tests.
 */
describe("Mail database tests", function () {
    //use existing database via database.init("") to use existing locations'
    //Mail = new Mail("./database/test2.db");


    var testMail = {};

    before(function(done){
        //this needs to be in before
        /**
         * Initialise the database.
         */
        var database = new Database().init("./database/test2.db");
        Mail = new Mail("./database/test2.db");
        testMail = {
            origin: '1',
            destination: '2',
            weight: '3',
            volume: '3',
            priority: 'DOMESTIC STANDARD'
        };
        done();

    });

    it("Test insert mail", function () {
        Mail.insertMail(testMail, function (result) {
            console.log(result);
            expect(result).to.be.true;
            testMail.id = result.lastID;
        });
    });

    it("Test get all mail", function () {
        Mail.getAllMail(function(result){
            expect(result instanceof Array).to.be.true;
        })
    });

    it("Test get mail by id", function(){
        Mail.getMailById(1, function(result){
            console.log(result);
            expect(result).to.be.true;
        });
    });


});
