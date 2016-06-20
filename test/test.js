var chai = require("chai"),
    expect = require("chai").expect,
    server = require('../app'),
    chaiHttp = require('chai-http'),
    Mail = require('../database/mail').Mail,
    Location = require('../database/location'),
    Company = require('../database/company');

chai.use(chaiHttp);

describe("Location Tests", function(){
    var testLocation;
    before(function (done) {
        this.timeout(5000);
        /**
         * Initialise the database.
         */
        testLocation = {name: 'test', isInternational: '1'};
        console.log("Testing Insertion of Location");
        Location.insertLocation(testLocation, function (result) {
            testLocation.id = result.lastID;
            done();
        });

    });
    after(function(done){
        done();
    });

    it('should list ALL locations', function (done) {
        chai.request(server)
            .get('/locations')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.text).to.contain("Add new Location");
                expect(res.text).to.contain("Locations");
                done();
            });
    });
    it('should not add location with empty name', function (done) {
        chai.request(server)
            .post('/locations')
            .send({name: "", isInternational: 1})
            .end(function (err, res) {
                expect(res).to.have.status(404);
                expect(res.text).to.contain("Must provide a valid location name");
                done();
            });
    });
    it('should not add location with empty international', function (done) {
        chai.request(server)
            .post('/locations')
            .send({name: "Test"})
            .end(function (err, res) {
                expect(res).to.have.status(404);
                expect(res.text).to.contain("Must provide the required details");
                done();
            });
    });
    it('should open the test location page', function(done){
        chai.request(server)
            .get('/locations/' + testLocation.id)
            .end(function(err, res){
                expect(res).to.have.status(200);
                expect(res.text).to.contain(testLocation.name);
                done();
            });
    });
    it('should update the test location', function(done){
        chai.request(server)
            .post("/locations/update/" + testLocation.id)
            .send({name: testLocation.name, isInternational: '0'})
            .end(function(err, res){
                expect(res).to.have.status(200);
                done();
            });
    });
    it('should show the updated test location', function(done){
        Location.getLocationById(testLocation.id, function(location){
            expect(location.isInternational).to.eql(0);
            done();
        });
    });
    it('should delete the test location', function(done){
        chai.request(server)
            .post("/locations/delete/" + testLocation.id)
            .end(function(err, res){
                expect(res).to.have.status(200);
                done();
            });
    });
});

describe("Companies Test", function(){
    var testCompany;

    before(function (done) {
        this.timeout(5000);
        /**
         * Initialise the database.
         */
        testCompany = {name: 'test', type: 'air'};
        console.log("Testing insertion of company");
        Company.insertCompany(testCompany, function(result){
            testCompany.id = result.lastID;
            done();
        });
    });

    after(function(done){
        done();
    });

    it('should list ALL companies', function (done) {
        chai.request(server)
            .get('/companies')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.text).to.contain("Add new Company");
                expect(res.text).to.contain("Companies");
                done();
            });
    });
    it('should not add company with empty name', function (done) {
        chai.request(server)
            .post('/companies')
            .send({name: "", type: "air"})
            .end(function (err, res) {
                expect(res).to.have.status(404);
                expect(res.text).to.contain("Must provide a valid company name");
                done();
            });
    });
    it('should not add company with empty type', function (done) {
        chai.request(server)
            .post('/companies')
            .send({name: "Test"})
            .end(function (err, res) {
                expect(res).to.have.status(404);
                expect(res.text).to.contain("Must provide the required details");
                done();
            });
    });
    it('should open the test company page', function(done){
        chai.request(server)
            .get('/companies/' + testCompany.id)
            .end(function(err, res){
                expect(res).to.have.status(200);
                expect(res.text).to.contain(testCompany.name);
                done();
            });
    });
    it('should update the test company', function(done){
        chai.request(server)
            .post("/companies/update/" + testCompany.id)
            .send({name: testCompany.name, type: 'sea'})
            .end(function(err, res){
                expect(res).to.have.status(200);
                done();
            });
    });
    it('should show the updated test company', function(done){
        Company.getCompanyById(testCompany.id, function(company){
            expect(company.type).to.eql('sea');
            done();
        });
    });
    it('should delete the test company', function(done){
        chai.request(server)
            .post("/companies/delete/" + testCompany.id)
            .end(function(err, res){
                expect(res).to.have.status(200);
                done();
            });
    });
});
// /**
//  * Mail.html form tests
//  */
// describe("Post mail", function(){
//     before(function(done){
//         //this needs to be in before
//         /**
//          * Initialise the database.
//          */
//         var database = new Database().init("./database/test2.db");
//         // Mail = new Mail("./database/test2.db");
//         done();
//
//     });
//     it('check confirmation page', function (done) {
//         var mail = {
//             "origin": 2,
//             "destination": 1,
//             "weight": 88,
//             "volume": 9,
//             "priority": "INTERNATIONAL STANDARD"
//         };
//         request("http://localhost:3000")
//             .post('/addMail')
//             .send(mail)
//             .set('Content-Type', 'application/json')
//             .end(function (err, res) {
//                 // Should.js fluent syntax applied
//                 // res.body.should.have.property("origin", 1);
//                 // res.body.destination.should.equal(2);
//                 // res.body.weight.should.equal(88);
//                 // res.body.destination.should.equal(9);
//                 // res.body.priority.should.equal("INTERNATIONAL STANDARD");
//                 // console.log(res);
//                 if (err) return done(err);
//                 done();
//             });
//     });
//     it('check invalid weight', function(done){
//         request(app)
//             .post('/addMail')
//             .send({"origin": 1,"destination": 2, "weight": "invalid", "volume": 9, "priority":"INTERNATIONAL STANDARD"})
//             .expect(404)
//             .end(function(err, res) {
//                 if (err) return done(err);
//                 done();
//             });
//     });
//     it('check invalid volume', function(done){
//         request(app)
//             .post('/addMail')
//             .send({"origin": 1,"destination": 2, "weight": 88, "volume": "invalid", "priority":"INTERNATIONAL STANDARD"})
//             .expect(404)
//             .end(function(err, res) {
//                 if (err) return done(err);
//                 done();
//             });
//     });
//
//     it('check duplicate origin and destination', function(done){
//         request(app)
//             .post('/addMail')
//             .send({"origin": 1,"destination": 1, "weight": "invalid", "volume": 9, "priority":"INTERNATIONAL STANDARD"})
//             .expect(404)
//             .end(function(err, res) {
//                 if (err) return done(err);
//                 done();
//             });
//     });
// });
//
// /**
//  * Location.html form tests
//  */
// describe("Location test", function(){
//     before(function(done){
//         var database = new Database().init("./database/test2.db");
//         done();
//     });
//
//     it('add new location', function (done) {
//         var location = {
//             name: "Test",
//             isInternational : 1
//         };
//         request("http://localhost:3000")
//             .post('/locations')
//             .send(location)
//             .set('Accept', /json/)
//             .type('form')
//             .end(function (err, res) {
//                 // Should.js fluent syntax applied
//                 console.log(res);
//                 // res.body.destination.should.equal(2);
//                 // res.body.weight.should.equal(88);
//                 // res.body.destination.should.equal(9);
//                 // res.body.priority.should.equal("INTERNATIONAL STANDARD");
//
//                 if (err) return done(err);
//                 done();
//             });
//     });
// });