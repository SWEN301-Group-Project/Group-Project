var routes = require('./routes.js');
var location = require('./location.js');
var mail = require('./mail.js');
var customerprice = require('./customerprice.js');

var segments = [];
var nodes = {};
var prices = [];
var days = {"Sunday" : 0, "Tuesday": 1, "Wednesday" : 2, "Thursday" : 3, "Friday" : 4, "Saturday" : 5, "Monday" : 6};
var isGraphLoaded = false;

/**
* @param {mail} mail being delivered
*/
var findRoute = function(mail){
    this.data = new mailRouteData();

    if (!isGraphLoaded) {
        this.data.errorMessage = "The graph has not finished loading";
        return this.data;

    }
    //check if we have a price for this routes
    for (var i = 0; i < prices.length; i++) {
        var price = prices[i];
        if (price.destination === mail.destination && price.origin === mail.origin) {
          // if(((mail.priority.toUpperCase() === "DOMESTIC AIR" || mail.priority.toUpperCase() === "INTERNATIONAL AIR") && price.priority.toUpperCase() === "AIR") || ((mail.priority.toUpperCase() === "DOMESTIC STANDARD" || mail.priority.toUpperCase() === "INTERNATIONAL STANDARD") && (price.priority.toUpperCase() === "LAND" || price.priority.toUpperCase() === "SEA"))){
            this.wCost = price.weightcost * mail.weight;
            this.vCost = price.volumecost * mail.volume;
            this.data.costToCustomer = this.wCost + this.vCost;
            console.log("Found destination and origin in database");
            break;
          // }
        }
        if (i == (prices.length - 1)) {
            this.data.errorMessage = "We don't ship from " + mail.origin + " to " + mail.destination;
            isGraphLoaded = false;
            return this.data;
        }
    }

    if (mail.priority.toUpperCase() === "DOMESTIC AIR" || mail.priority.toUpperCase() === "DOMESTIC STANDARD") {
        if (nodes[mail.destination].international > 0) {
            this.data.errorMessage = "This mail must be sent via International Priority";
            isGraphLoaded = false;
            return this.data;
        }
        return findDomesticRoute(mail, this.data);
    }
    if (mail.priority.toUpperCase() === "INTERNATIONAL AIR") {
        if (nodes[mail.destination].international == 0) {
            this.data.errorMessage = "This mail must be sent via Domestic Priority";
            isGraphLoaded = false;
            return this.data;
        }
        return findInternationalAirRoute(mail, this.data);
    }
    if (mail.priority.toUpperCase() === "INTERNATIONAL STANDARD") {
        if (nodes[mail.destination].international == 0) {
            this.data.errorMessage = "This mail must be sent via Domestic Priority";
            isGraphLoaded = false;
            return this.data;
        }
        return findInternationalStandardRoute(mail, this.data);
    }
};

var findDomesticRoute = function (mail, data) {
    //Create a set of all the unvisited nodes called the unvisited set and init node values
    var unvisited = [];
    // for(var i = 0; i < nodes.length; i++){
    for (var node in nodes) {
        nodes[node].travelPenalty = Number.POSITIVE_INFINITY;
        nodes[node].visited = false;
        nodes[node].fromSegment = null;
        nodes[node].timeToHere = 0;
        nodes[node].waitTime = 0;
        unvisited.push(nodes[node]);
    }
    this.data = data;
    this.currentNode = nodes[mail.origin];
    this.currentNode.travelPenalty = 0;
    var sentDate = new Date().getTime();
    while (true) {
        this.currentNode.visited = true;
        //If the destination node has been visited then stop. The algorithm has finished.
        if (nodes[mail.destination].visited) {
            console.log("Reached Destination. Route:");
            this.cost = 0;
            this.currentNode = nodes[mail.destination];
            while (this.currentNode != nodes[mail.origin]) {
                // this.data.routeTakenName.push(this.currentNode.fromSegment.)
                var route = [];
                route.push(this.currentNode.fromSegment.startNode.name);
                route.push(this.currentNode.fromSegment.endNode.name);
                this.data.routeTakenName.push(route);

                this.data.routeTaken.push(this.currentNode.fromSegment.id);
                console.log(this.currentNode.name + " from " + this.currentNode.fromSegment.startNode.name);
                this.cost += (this.currentNode.fromSegment.weightCost * mail.weight) + (this.currentNode.fromSegment.volumeCost * mail.volume);
                this.currentNode = this.currentNode.fromSegment.startNode;
            }
            this.data.routeTaken.reverse();
            this.data.routeTakenName.reverse();
            this.data.costToCompany = this.cost;
            this.data.departureTime = new Date((nodes[mail.origin].waitTime * 3600000) + sentDate);
            this.data.duration = nodes[mail.destination].timeToHere;
            this.data.estArrival = new Date((nodes[mail.destination].timeToHere * 3600000) + sentDate);
            this.data.errorMessage = false;
            console.log("Completed");
            isGraphLoaded = false;
            return this.data;
        }
        //date and time mail arrived at current node
        this.arrivalTime = sentDate + (this.currentNode.timeToHere * 24);

        //For the current node consider all of its unvisited neighbors
        for (var i = 0; i < this.currentNode.segments.length; i++){
        // for (var segmentId in this.currentNode.segments)
            var segment = this.currentNode.segments[i];
            if (!segment.endNode.visited && segment.maxWeight >= mail.weight && segment.maxVolume >= mail.volume) {
                //calculate time for next departure
                this.currentDay = new Date(this.arrivalTime).getDay(); //today
                this.routeStart = segment.day; //day mail is sent from this route
                this.hours = ((this.arrivalTime) / 3600000) % 24;
                this.days = 0; //
                if (this.currentDay === this.routeStart) {
                    this.days = 0;
                }
                if (this.currentDay < this.routeStart) {
                    this.days = 7 - this.routeStart + this.currentDay;
                }
                else {
                    this.days = this.currentDay - this.routeStart;
                }

                this.waitTime = (segment.frequency - ((24 * this.days + this.hours) % segment.frequency));

            //if the currentNode is the origin, the wait time is also the departure time
            if(this.currentNode === nodes[mail.origin]){
              this.data.departureTime = this.waitTime;
            }

            //calculate tentative travelPenalty. Compare tentative travelPenalty to the current assigned value
            //assign the smaller one.

            if ((this.currentNode.travelPenalty + segment.duration + this.waitTime) < segment.endNode.travelPenalty) {
                segment.endNode.travelPenalty = this.currentNode.travelPenalty + segment.duration + this.waitTime;
                segment.endNode.timeToHere = this.currentNode.travelPenalty + segment.duration + this.waitTime;
                segment.endNode.fromSegment = segment;
                this.currentNode.waitTime = this.waitTime;
            }
          }
        }
        //When we are done considering all of the neighbors of the current node,
        //remove node from unvisited
        //A visited node will never be checked again.
        this.index = unvisited.indexOf(this.currentNode);
        if (index >= 0) {
            unvisited.splice(index, 1);
        }

        //get the node with the smallest travelPenalty from unvisited
        this.smallestNode;
        for(var i = 0; i < unvisited.length; i++){
        // for (var nodeId in unvisited) {
            var node = unvisited[i];
            if (i == 0) {
                this.smallestNode = node;
            }
            else if (this.smallestNode.travelPenalty > node.travelPenalty) {
                this.smallestNode = node;
            }
        }

        //if the smallest travelPenalty in the unvisited set is infinity, the graph is not connected
        if (this.smallestNode.travelPenalty == Number.POSITIVE_INFINITY) {
            console.log("No route");
            this.data.errorMessage = "No route";
            isGraphLoaded = false;
            return this.data;
        }

        // Otherwise, select the unvisited node that is marked with the smallest tentative travelPenalty, set it as the new "current node", and go back to step 3.
        this.currentNode = this.smallestNode;
    }
};

var findInternationalAirRoute = function(mail, data){
    //Create a set of all the unvisited nodes called the unvisited set and init node values
    var unvisited = [];
    for (var node in nodes) {
        nodes[node].travelPenalty = Number.POSITIVE_INFINITY;
        nodes[node].visited = false;
        nodes[node].fromSegment = null;
        nodes[node].timeToHere = 0;
        nodes[node].waitTime = 0;
        unvisited.push(nodes[node]);
    }

    this.data = data;
    //Set up starting node
    this.currentNode = nodes[mail.origin];
    this.currentNode.travelPenalty = 0;
    var sentDate = new Date().getTime();

    while (true) {
        this.currentNode.visited = true;

        //If the destination node has been visited then stop. The algorithm has finished.
        if (nodes[mail.destination].visited) {
            console.log("Reached Destination. Route:");
            this.cost = 0;
            this.currentNode = nodes[mail.destination];
            while (this.currentNode != nodes[mail.origin]) {
                var route = [];
                route.push(this.currentNode.fromSegment.startNode.name);
                route.push(this.currentNode.fromSegment.endNode.name);
                this.data.routeTakenName.push(route);

                this.data.routeTaken.push(this.currentNode.fromSegment.id);
                console.log(this.currentNode.name + " from " + this.currentNode.fromSegment.startNode.name);
                this.cost += (this.currentNode.fromSegment.weightCost * mail.weight) + (this.currentNode.fromSegment.volumeCost * mail.volume);
                this.currentNode = this.currentNode.fromSegment.startNode;
            }
            this.data.routeTaken.reverse();
            this.data.routeTakenName.reverse();
            this.data.costToCompany = this.cost;
            this.data.departureTime = new Date((nodes[mail.origin].waitTime * 3600000) + sentDate);
            this.data.duration = nodes[mail.destination].timeToHere;
            this.data.estArrival = new Date((nodes[mail.destination].timeToHere * 3600000) + sentDate);
            this.data.errorMessage = false;

            console.log("Completed");
            isGraphLoaded = false;
            return this.data;
        }
        //date and time mail arrived at current node
        this.arrivalTime = sentDate + this.currentNode.travelPenalty;

        //For the current node consider all of its unvisited neighbors
        for(var i = 0; i < this.currentNode.segments.length; i++){
            var segment = this.currentNode.segments[i];
            if (!segment.endNode.visited && segment.type.toLowerCase() === "air" && segment.maxWeight >= mail.weight && segment.maxVolume >= mail.volume) {
                //calculate time for next departure
                this.currentDay = new Date(this.arrivalTime).getDay();
                //calculate time for next departure
                this.routeStart = segment.day;
                this.hours = (this.arrivalTime / 3600000) % 24;
                if (this.currentDay === this.routeStart) {
                    this.days = 0;
                }
                if (this.currentDay < this.routeStart) {
                    this.days = 7 - this.routeStart + this.currentDay;
                }
                else {
                    this.days = this.currentDay - this.routeStart;
                }
                this.waitTime = (segment.frequency - ((24 * this.days + this.hours) % segment.frequency));

                //calculate tentative travelPenalty. Compare tentative travelPenalty to the current assigned value
                //assign the smaller one.
                if ((this.currentNode.travelPenalty + segment.duration + this.waitTime) < segment.endNode.travelPenalty) {
                    segment.endNode.travelPenalty = this.currentNode.travelPenalty + segment.duration + this.waitTime;
                    segment.endNode.timeToHere = this.currentNode.travelPenalty + segment.duration + this.waitTime;
                    segment.endNode.fromSegment = segment;
                    this.currentNode.waitTime = this.waitTime;
                }
            }
        }

        //When we are done considering all of the neighbors of the current node,
        //remove node from unvisited
        //A visited node will never be checked again.
        this.index = unvisited.indexOf(this.currentNode);
        if (this.index >= 0) {
            unvisited.splice(this.index, 1);
        }

        //get the node with the smallest travelPenalty from unvisited
        this.smallestNode;
        for(var j = 0; j < unvisited.length; j++){
            var node = unvisited[j];
            if (j == 0) {
                this.smallestNode = node;
            }
            else if (this.smallestNode.travelPenalty > node.travelPenalty) {
                this.smallestNode = node;
            }
        }

        //if the smallest travelPenalty in the unvisited set is infinity, the graph is not connected
        if (this.smallestNode.travelPenalty == Number.POSITIVE_INFINITY) {
            console.log("No route");
            this.data.errorMessage = "No route";
            isGraphLoaded = false;
            return this.data;
        }

        // Otherwise, select the unvisited node that is marked with the smallest tentative travelPenalty, set it as the new "current node", and go back to step 3.
        this.currentNode = this.smallestNode;
    }
};

var findInternationalStandardRoute = function(mail, data){

    //Create a set of all the unvisited nodes called the unvisited set and init node values
    var unvisited = [];
    for (var node in nodes) {
        nodes[node].travelPenalty = Number.POSITIVE_INFINITY;
        nodes[node].visited = false;
        nodes[node].fromSegment = null;
        nodes[node].timeToHere = 0;
        nodes[node].waitTime = 0;
        unvisited.push(nodes[node]);
    }

    this.data = data;

    //set up starting node
    this.currentNode = nodes[mail.origin];
    this.currentNode.travelPenalty = 0;

    var sentDate = new Date().getTime();

    while (true) {
        this.currentNode.visited = true;

        //If the destination node has been visited then stop. The algorithm has finished.
        if (nodes[mail.destination].visited) {
            console.log("Reached Destination. Route:");
            this.cost = 0;
            this.currentNode = nodes[mail.destination];
            while (this.currentNode != nodes[mail.origin]) {
                var route = [];
                route.push(this.currentNode.fromSegment.startNode.name);
                route.push(this.currentNode.fromSegment.endNode.name);
                this.data.routeTakenName.push(route);

                this.data.routeTaken.push(this.currentNode.fromSegment.id);
                console.log(this.currentNode.name + " from " + this.currentNode.fromSegment.startNode.name);
                this.cost += (this.currentNode.fromSegment.weightCost * mail.weight) + (this.currentNode.fromSegment.volumeCost * mail.volume);
                this.currentNode = this.currentNode.fromSegment.startNode;
            }
            this.data.routeTaken.reverse();
            this.data.routeTakenName.reverse();
            this.data.costToCompany = this.cost;
            this.data.departureTime = new Date((nodes[mail.origin].waitTime * 3600000) + sentDate);
            this.data.duration = nodes[mail.destination].timeToHere;
            this.data.estArrival = new Date((nodes[mail.destination].timeToHere * 3600000) + sentDate);
            this.data.errorMessage = false;
            console.log("");
            isGraphLoaded = false;
            return this.data;
        }

        this.arrivalTime = sentDate + (this.currentNode.timeToHere * 24);

        //For the current node consider all of its unvisited neighbors
        for (var j = 0; j < this.currentNode.segments; j++) {
            var segment = this.currentNode.segments[j];
            if (!segment.endNode.visited && segment.maxWeight >= mail.weight && segment.maxVolume >= mail.volume) {
                //Add weighting penalty for using air
                this.airPenalty = 0;
                if (segment.type.toLowerCase() === "air") {
                    this.airPenalty = 1000;
                }
                this.weightCost = mail.weight * segment.weightCost;
                this.volumeCost = mail.volume * segment.volumeCost;

                //calculate time for next departure
                this.currentDay = new Date(this.arrivalTime).getDay();
                //calculate time for next departure
                this.routeStart = segment.day;
                this.hours = (this.arrivalTime / 3600000) % 24;
                if (this.currentDay === this.routeStart) {
                    this.days = 0;
                }
                if (this.currentDay < this.routeStart) {
                    this.days = 7 - this.routeStart + this.currentDay;
                }
                else {
                    this.days = this.currentDay - this.routeStart;
                }
                this.waitTime = (segment.frequency - ((24 * this.days + this.hours) % segment.frequency));

                //calculate tentative cost. Compare tentative travelPenalty to the current assigned value
                //assign the smaller one.
                if ((this.currentNode.travelPenalty + this.weightCost + this.volumeCost + this.airPenalty) < segment.endNode.travelPenalty) {
                    segment.endNode.travelPenalty = this.currentNode.travelPenalty + this.weightCost + this.volumeCost + this.airPenalty;
                    segment.endNode.timeToHere = this.currentNode.timeToHere + segment.duration + this.waitTime;
                    segment.endNode.fromSegment = segment;
                    this.currentNode.waitTime = this.waitTime;
                }
            }
        }
        //When we are done considering all of the neighbors of the current node,
        //remove node from unvisited
        //A visited node will never be checked again.
        this.index = unvisited.indexOf(this.currentNode);
        if (this.index >= 0) {
            unvisited.splice(this.index, 1);
        }

        //get the node with the smallest travelPenalty from unvisited
        this.smallestNode;
        for (var k = 0; k < unvisited.length; k++) {
            var node = unvisited[k];
            if (k == 0) {
                this.smallestNode = node;
            }
            else if (this.smallestNode.travelPenalty > node.travelPenalty) {
                this.smallestNode = node;
            }
        }

        //if the smallest travelPenalty in the unvisited set is infinity, the graph is not connected
        if (this.smallestNode && this.smallestNode.travelPenalty == Number.POSITIVE_INFINITY) {
            console.log("No route");
            this.data.errorMessage = "No route";
            isGraphLoaded = false;
            return this.data;
        }
        // Otherwise, select the unvisited node that is marked with the smallest tentative travelPenalty, set it as the new "current node", and go back to step 3.
        this.currentNode = this.smallestNode;
    }
};


var createPrices = function (customerprices) {
    prices = customerprices;
    isGraphLoaded = true;
};

var createNodes = function (locs) {
    nodes = {};
    if (typeof locs != 'undefined') {
        for (var i = 0; i < locs.length; i++) {
            nodes[locs[i].name] = new node(locs[i].locationid, locs[i].name, locs[i].isInternational);
        }
        routes.getAllRoutes(createSegments);
    }
    else {
        console.log("Locs undefined");
    }
};

var createSegments = function (costs) {
    segments = [];
    if (typeof costs != 'undefined') {
        for (var i = 0; i < costs.length; i++) {
            var newSegment = new segment(costs[i].routeid, nodes[costs[i].origin], nodes[costs[i].destination], costs[i]['type'], costs[i].weightcost, costs[i].volumecost, costs[i].maxweight, costs[i].maxvolume, costs[i].duration, costs[i].frequency, costs[i].day);
            segments.push(newSegment);
            nodes[costs[i].origin].segments.push(newSegment);
        }
        customerprice.getAllPrices(createPrices);
    }
    else {
        console.log("Costs undefined: ");
    }
};

exports.loadGraph = function (callback) {
    location.getAllLocations(createNodes);
    require('deasync').loopWhile(function () {
        console.log("still loading graph");
        return !isGraphLoaded;
    });
    if (callback) {
        callback();
    }
};
module.exports.findRoute = findRoute;

var printAll = function () {
    console.log("Printing Nodes: ");
    for (var node in nodes) {
        console.log(node);
    }
    console.log("Printing Segments: ");
    for (var seg in segments) {
        console.log(seg);
    }
};

var testMail = function () {
    mail.getAllMail(mailFunction);
};

var mailFunction = function (mailList) {
    for (var mail in mailList) {
        console.log("Finding route from " + mailList[mail].origin + " to " + mailList[mail].destination + " with priority " + mailList[mail].priority);
        mailList[mail].date = new Date();
        findRoute(mailList[mail]);
    }
};

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
var segment = function (id, sNode, eNode, type, wc, vc, mw, mv, dur, freq, day) {
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
};

/**
 * @param {int} id Unique identifier
 * @param {string} name Name of location
 * @param {int} inter Is location international
 */
var node = function (id, name, inter) {
    this.id = id;
    this.name = name;
    this.segments = [];
    this.travelPenalty = Number.POSITIVE_INFINITY;
    this.timeToHere = 0;
    this.visited = false;
    this.fromSegment = null;
    this.waitTime = 0;
    this.international = inter;
};


var mailRouteData = function () {
    this.routeTaken = [];//a list of route Id's, in order from origin to destination
    this.routeTakenName = []; //a list of route names's, in order from origin to destination
    this.duration; //total delivery time in hours
    this.departureTime;//Date it left
    this.estArrival;//estimated arrival date
    this.costToCompany;//total cost to company
    this.costToCustomer;//customer price
    this.errorMessage;//if search was success this is false, else it contains a string
};
