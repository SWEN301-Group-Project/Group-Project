var routes = require('./routes.js');
var location = require('./location.js');
var customerprice = require('./customerprice.js');

var segments = [];
var nodes = {};
var prices = [];


/**
* @param {mail} mail being delivered
*/
var findRoute = function(mail){
  if(mail.priority === PRIORITY.DOMESTIC_AIR || mail.priority === PRIORITY.DOMESTIC_STANDARD){
    return findDomesticRoute(mail);
  }
  if(mail.priority === PRIORITY.INTERNATIONAL_AIR){
    return findInternationalAirRoute(mail);
  }
  if(mail.priority === PRIORITY.INTERNATIONAL_STANDARD){
    return findInternationalStandardRoute(mail);
  }
}

var findDomesticRoute = function(mail){
  //Create a set of all the unvisited nodes called the unvisited set and init node values
  var unvisited = [];
  for(var node in nodes){
    unvisited.push(node);
    node.distance =  Number.POSITIVE_INFINITY;
    node.visited = false;
  }
  //this.locName = mail.from;
  this.currentNode = nodes[mail.from];
  this.currentNode.distance = 0;

  while(true){
    //For the current node consider all of its unvisited neighbors
      for(var segment in this.currentNode.segments){
        if(!segement.endNode.visited){
          //calculate tentative distance. Compare tentative distance to the current assigned value
          //assign the smaller one.
          segment.endNode.distance = min(this.currentNode.distance + segment.duration, segment.endNode.distance);
        }
      }
      //When we are done considering all of the neighbors of the current node, mark the current node as visited and remove it from the unvisited set. A visited node will never be checked again.
      this.currentNode.visited = true;
      removeItem(this.currentNode, unvisited);
      //If the destination node has been visited then stop. The algorithm has finished.
      if(nodes[mail.to].visted){
        //TODO return actual route
        return;
      }
      // Otherwise, select the unvisited node that is marked with the smallest tentative distance, set it as the new "current node", and go back to step 3.
      this.minDistance = Number.POSITIVE_INFINITY;
      for(var node in unvisted){
        if(node.distance< minDistance){
          this.currentNode = node;
        }
      }
      //TODO check if destination can actually be reached
  }


}

var findInternationalAirRoute = function(mail){

}

var findInternationalStandardRoute = function(mail){

}

var removeItem = function(item, array){
  this.index = array.indexOf(item);
  if(index >= 0){
    array.splice(index, 1);
  }
}

var createNodes = function(locs){
  if(typeof locs != 'undefined'){
    for(var i = 0;i < locs.length; i++){
      nodes[locs[i].name] = new node(locs[i].id, locs[i].name);
    }
  }
}

var createSegments = function(costs){
  if(typeof locs != 'undefined'){
    for(var i = 0; i < costs.length; i++){
      this.segment = new segment(nodes[costs[i].destination], nodes[costs[i].origin], costs[i].type, costs[i].weightcost, costs[i].volumecost, costs[i].maxweight, costs[i].maxVolume, costs[i].duration, costs[i].frequency, costs[i].day);
      segments.push(this.segment);
      nodes.fromName.segments.push(this.segment);
    }
  }
}

exports.loadGraph = function(){
  location.getAllLocations(createNodes);
  routes.getAllRoutes(createSegments);
}

exports.printAll = function(){
  console.log("Printing: ");
  for(var node in nodes){
    console.log(node);
  }
  for(var seg in segments){
    console.log(seg);
  }
}

/**
* @param {int} id Unique identifier
* @param {node} sNode Node where this segment originates
* @param {node} eNode Node where this segment terminates
* @param {string} type Type of transport, land, air or sea
* @param {int} wc weight cost
* @param {int} vc volume cost
* @param {int} mw max weightCost
* @param {int} mv max volumeCost
* @param {int} dur Time it takes this segment to transport
* @param {int} freq The frequency this segment sets out at
* @param {string} day Which day the transport cycle starts at
*/
var segment = function(id, sNode, eNode, type, wc, vc, mw, mv, dur, freq, day){
  this.id = id;
  this.startNode = sNode;
  this.endNode = eNode;
  this.type = type;
  this.weightCost = wc;
  this.volumeCost = vc;
  this.maxWeight = mw;
  this.maxVolume = mv;
  this.duration = dur;
  this.frequency = freq;
  this.day = day;

}

/**
* @param {int} id Unique identifier
* @param {string} name Name of location
*/
var node = function(id, name){
  this.id = id;
  this.name = name;
  this.segments = [];
  this.distance = Number.POSITIVE_INFINITY;
  this.visited = false;
}
