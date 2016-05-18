var routes = require('./routes.js');
var location = require('./location.js');
var mail = require('./mail.js');
var customerprice = require('./customerprice.js');

var segments = [];
var nodes = {};
var prices = [];
var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
* @param {mail} mail being delivered
*/
var findRoute = function(mail){
  if(mail.priority.toUppercase() === "DOMESTIC AIR" || mail.priority === "DOMESTIC STANDARD"){
    return findDomesticRoute(mail);
  }
  if(mail.priority.toUppercase() === "INTERNATIONAL AIR"){
    return findInternationalAirRoute(mail);
  }
  if(mail.priority.toUppercase() === "INTERNATIONAL STANDARD"){
    return findInternationalStandardRoute(mail);
  }
}

var findDomesticRoute = function(mail){
  //TODO store how we got to each node
  //Create a set of all the unvisited nodes called the unvisited set and init node values
  var unvisited = [];
  for(var node in nodes){
    unvisited.push(node);
    node.distance =  Number.POSITIVE_INFINITY;
    node.visited = false;
    node.fromSegment = null;
  }
  this.currentNode = nodes[mail.from];
  this.currentNode.distance = 0;

  while(true){
    //For the current node consider all of its unvisited neighbors
      for(var segment in this.currentNode.segments){
        if(!segement.endNode.visited && segment.maxWeight >= mail.weight && segment.maxVolume >= mail.volume){
          //calculate time for next departure
          this.today = mail.date.getDay();
          this.waitTime = findRouteWaitTime(this.today, segment);
          //calculate tentative distance. Compare tentative distance to the current assigned value
          //assign the smaller one.
          if((this.currentNode.distance + segment.duration + this.waitTime) < segment.endNode.distance){
            segment.endNode.distance = this.currentNode.distance + segment.duration + this.waitTime;
            segment.endNode.fromSegment = segment;
          }
        }
      }
      //When we are done considering all of the neighbors of the current node, mark the current node as visited and remove it from the unvisited set. A visited node will never be checked again.
      this.currentNode.visited = true;
      removeItem(this.currentNode, unvisited);
      //If the destination node has been visited then stop. The algorithm has finished.
      if(nodes[mail.to].visted){
        this.cost = 0;
        while(this.currentNode != nodes[mail.from]){
          this.cost += (this.currentNode.fromSegment.weightCost * mail.weight) + (this.currentNode.fromSegment.volumeCost * mail.volume);
          this.currentNode = this.currentNode.fromSegment.startNode;
        }
        return this.cost;
      }
      //if the smallest distance in the unvisited set is infinity, the graph is not connected
      if(getSmallestDistance(unvisited) == Number.POSITIVE_INFINITY){
        return 0;
      }
      // Otherwise, select the unvisited node that is marked with the smallest tentative distance, set it as the new "current node", and go back to step 3.
      this.minDistance = Number.POSITIVE_INFINITY;
      for(var node in unvisted){
        if(node.distance< minDistance){
          this.currentNode = node;
        }
      }
  }


}

var findInternationalAirRoute = function(mail){
  //Create a set of all the unvisited nodes called the unvisited set and init node values
  var unvisited = [];
  for(var node in nodes){
    unvisited.push(node);
    node.distance =  Number.POSITIVE_INFINITY;
    node.visited = false;
    node.fromSegment = null;
  }
  this.currentNode = nodes[mail.from];
  this.currentNode.distance = 0;

  while(true){
    //For the current node consider all of its unvisited neighbors
      for(var segment in this.currentNode.segments){
        if(!segement.endNode.visited && segment.type === "Air" && segment.maxWeight >= mail.weight && segment.maxVolume >= mail.volume){
          //TODO check type format
          //calculate time for next departure
          this.today = mail.date.getDay();
          this.waitTime = findRouteWaitTime(this.today, segment);
          //calculate tentative distance. Compare tentative distance to the current assigned value
          //assign the smaller one.
          segment.endNode.distance = min(this.currentNode.distance + segment.duration + this.waitTime, segment.endNode.distance);
        }
      }
      //When we are done considering all of the neighbors of the current node, mark the current node as visited and remove it from the unvisited set. A visited node will never be checked again.
      this.currentNode.visited = true;
      removeItem(this.currentNode, unvisited);
      //If the destination node has been visited then stop. The algorithm has finished.
      if(nodes[mail.to].visted){
        this.cost = 0;
        while(this.currentNode != nodes[mail.from]){
          this.cost += (this.currentNode.fromSegment.weightCost * mail.weight) + (this.currentNode.fromSegment.volumeCost * mail.volume);
          this.currentNode = this.currentNode.fromSegment.startNode;
        }
        return this.cost;
      }
      //if the smallest distance in the unvisited set is infinity, the graph is not connected by air routes only
      if(getSmallestDistance(unvisited) == Number.POSITIVE_INFINITY){
        return 0;
      }
      // Otherwise, select the unvisited node that is marked with the smallest tentative distance, set it as the new "current node", and go back to step 3.
      this.minDistance = Number.POSITIVE_INFINITY;
      for(var node in unvisted){
        if(node.distance< minDistance){
          this.currentNode = node;
        }
      }
  }
}

var findInternationalStandardRoute = function(mail){
  //TODO allow use of air if no other option
  //Create a set of all the unvisited nodes called the unvisited set and init node values
  var unvisited = [];
  for(var node in nodes){
    unvisited.push(node);
    node.distance =  Number.POSITIVE_INFINITY;
    node.visited = false;
  }
  this.currentNode = nodes[mail.from];
  this.currentNode.distance = 0;

  while(true){
    //For the current node consider all of its unvisited neighbors
      for(var segment in this.currentNode.segments){
        if(!segement.endNode.visited && (segment.type === "Sea" || segment.type === "Land" ) && segment.maxWeight >= mail.weight && segment.maxVolume >= mail.volume){
          //TODO check type format
          //calculate tentative cost. Compare tentative distance to the current assigned value
          //assign the smaller one.
          this.cost = (segement.weightCost * mail.weight) + (segment.volumeCost * mail.volume);
          segment.endNode.distance = min(this.currentNode.distance + this.cost, segment.endNode.distance);
        }
      }
      //When we are done considering all of the neighbors of the current node, mark the current node as visited and remove it from the unvisited set. A visited node will never be checked again.
      this.currentNode.visited = true;
      removeItem(this.currentNode, unvisited);
      //If the destination node has been visited then stop. The algorithm has finished.
      if(nodes[mail.to].visted){
        //TODO add cost info to mail object
        return this.currentNode.distance;
      }
      //if the smallest distance in the unvisited set is infinity, the graph is not connected by air routes only
      if(getSmallestDistance(unvisited) == Number.POSITIVE_INFINITY){
        return 0;
      }
      // Otherwise, select the unvisited node that is marked with the smallest tentative distance, set it as the new "current node", and go back to step 3.
      this.minDistance = Number.POSITIVE_INFINITY;
      for(var node in unvisted){
        if(node.distance< minDistance){
          this.currentNode = node;
        }
      }
  }
}

var removeItem = function(item, array){
  this.index = array.indexOf(item);
  if(index >= 0){
    array.splice(index, 1);
  }
}

var getSmallestDistance = function(array){
  this.smallestDist = Number.POSITIVE_INFINITY;
  for(var node in array){
    if(this.smallestDist > node.distance){
      this.smallestDist = node.distance;
    }
  }
  return this.smallestDist;
}

var findRouteWaitTime = function(today, route){
  //TODO mail's day is in date form
  this.start = route.day;
  this.days;
  if(today === route){
    return 0;
  }
  if(today < start){
    this.days = 7 - start + today;
  }
  else{
    this.days = today - start;
  }
  return (route.frequency - ((24 * this.days) % route.frequency))
}

var createNodes = function(locs){
  if(typeof locs != 'undefined'){
    for(var i = 0;i < locs.length; i++){
      nodes[locs[i].name] = new node(locs[i].locationid, locs[i].name);
    }
    routes.getAllRoutes(createSegments);
  }
  else{
    console.log("Locs undefined");
  }
}

var createSegments = function(costs){
  if(typeof costs != 'undefined'){
    for(var i = 0; i < costs.length; i++){
      this.segment = new segment(nodes[costs[i].destination], nodes[costs[i].origin], costs[i].type, costs[i].weightcost, costs[i].volumecost, costs[i].maxweight, costs[i].maxvolume, costs[i].duration, costs[i].frequency, costs[i].day);
      segments.push(this.segment);
      nodes[costs[i].origin].segments.push(this.segment);
    }
    testMail();
  }
  else{
    console.log("Costs undefined: ");
  }
}

exports.loadGraph = function(){
    location.getAllLocations(createNodes);
}

var printAll = function(){
  console.log("Printing Nodes: ");
  for(var node in nodes){
    console.log(node);
  }
  console.log("Printing Segments: ");
  for(var seg in segments){
    console.log(seg);
  }
}

var testMail = function(){
  this.mailList = mail.getAllMail();
  for(var mail in this.mailList){
    console.log(findRoute(mail));
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
  this.fromSegment = null;
}
