var mail = require('./mail.js');
var customerprice = require('./customerprice.js');

var triples = {};
var critical = [];

var checkCriticalRoutes = function(mailList){
  //create triples
  for(var mail in mailList){
    this.key = mail.origin + mail.destination + mail.priority;
    //if this triple doesn't exist create it
    if(!(this.key in triples)){
      triples[this.key] = new triple(mail.origin, mail.destination, mail.priority);
    }
    triples[this.key].expenditure += mail.totalbusinesscost;
    triples[this.key].income += mail.totalcustomercost;
  }
  //find critical
  for(var triple in triples){
    if((triple.income - triple.expenditure) < 0){
      critical.add(triple);
    }
  }
  return critical;
}


var triple = function(origin, destination, priority){
  this.key = origin + destination + priority;
  this.origin = origin;
  this.destination = destination;
  this.priority = priority;
  this.expenditure = 0;
  this.income = 0;
}
