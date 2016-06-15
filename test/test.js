var chai = require("chai"),
    expect = require("chai").expect,
    server = require('../app'),
    chaiHttp = require('chai-http'),
    Mail = require('../database/mail').Mail,
    Location = require('../database/location');

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
            console.log("added testlocation: ");
            console.log(testLocation);
            console.log("id: " + testLocation.id);
            done();
        });

    });
    after(function(done){

        console.log(testLocation.id);
        Location.deleteLocation(testLocation.id, function(result){
            console.log("Finished delete location");
            console.log(result);
            done();
        });
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