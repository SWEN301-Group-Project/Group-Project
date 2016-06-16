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
        console.log("Price: ");
        console.log(price);
        console.log(price.destination);
        console.log(mail.destination);
        if (price.destination === mail.destination && price.origin === mail.origin) {
            this.wCost = price.weightcost * mail.weight;
            this.vCost = price.volumecost * mail.volume;
            this.data.costToCustomer = this.wCost + this.vCost;
            console.log("Found destination and origin in database");
            break;
        }
        if (i == (prices.length - 1)) {
            this.data.errorMessage = "We don't ship from" + mail.origin + " to " + mail.destination;
            isGraphLoaded = false;
            return this.data;
        }
    }

    if (mail.priority.toUpperCase() === "DOMESTIC AIR" || mail.priority.toUpperCase() === "DOMESTIC STANDARD") {
        console.log('nodes[mail.destination]');
        console.log(nodes[mail.destination]);
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
    console.log("inside findDomesticRoute");
    console.log("Parameters:");
    console.log(mail);
    console.log(data);
    console.log("---Finished Parameters");
    console.log("---");
    //Create a set of all the unvisited nodes called the unvisited set and init node values
    var unvisited = [];
    // for(var i = 0; i < nodes.length; i++){
    for (var node in nodes) {
        nodes[node].distance = Number.POSITIVE_INFINITY;
        nodes[node].visited = false;
        nodes[node].fromSegment = null;
        unvisited.push(nodes[node]);
    }
    console.log("Univisited Nodes: ");
    console.log(unvisited);
    this.data = data;
    console.log("Data");
    console.log(this.data);
    this.currentNode = nodes[mail.origin];
    this.currentNode.distance = 0;
    var sentDate = new Date().getTime();
    while (true) {
        this.currentNode.visited = true;
        console.log("currentNode");
        console.log(this.currentNode);
        //If the destination node has been visited then stop. The algorithm has finished.
        if (nodes[mail.destination].visited) {
            console.log("Reached Destination. Route:");
            this.cost = 0;
            this.currentNode = nodes[mail.destination];
            while (this.currentNode != nodes[mail.origin]) {
                this.data.routeTaken.push(this.currentNode.fromSegment.id);
                console.log(this.currentNode.name + " from " + this.currentNode.fromSegment.startNode.name);
                this.cost += (this.currentNode.fromSegment.weightCost * mail.weight) + (this.currentNode.fromSegment.volumeCost * mail.volume);
                this.currentNode = this.currentNode.fromSegment.startNode;
            }
            this.data.routeTaken.reverse();
            this.data.costToCompany = this.cost;
            this.data.errorMessage = false;
            console.log("Completed");
            isGraphLoaded = false;
            return this.data;
        }
        //date and time mail arrived at current node
        this.arrivalTime = sentDate + this.currentNode.distance;

        //For the current node consider all of its unvisited neighbors
        for (var i = 0; i < this.currentNode.segments.length; i++){
        // for (var segmentId in this.currentNode.segments) {
            var segment = this.currentNode.segments[i];
            if (!segment.endNode.visited && segment.maxWeight >= mail.weight && segment.maxVolume >= mail.volume) {
                console.log("segment");
                console.log(segment);
                //calculate time for next departure
                this.currentDay = new Date(this.arrivalTime).getDay();
                console.log("currentDay: " + this.currentDay);
                this.routeStart = segment.day;
                console.log("routeStart: " + this.routeStart);
                this.hours = ((this.arrivalTime) / 3600000) % 24;
                this.days = 0;
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
            }

            //calculate tentative distance. Compare tentative distance to the current assigned value
            //assign the smaller one.

            if ((this.currentNode.distance + segment.duration + this.waitTime) < segment.endNode.distance) {
                segment.endNode.distance = this.currentNode.distance + segment.duration + this.waitTime;
                segment.endNode.fromSegment = segment;
            }
        }
        //When we are done considering all of the neighbors of the current node,
        //remove node from unvisited
        //A visited node will never be checked again.
        this.index = unvisited.indexOf(this.currentNode);
        if (index >= 0) {
            unvisited.splice(index, 1);
        }

        //get the node with the smallest distance from unvisited
        this.smallestNode;
        for(var i = 0; i < unvisited.length; i++){
        // for (var nodeId in unvisited) {
            var node = unvisited[i];
            if (i == 0) {
                this.smallestNode = node;
            }
            else if (this.smallestNode.distance > node.distance) {
                this.smallestNode = node;
            }
        }

        //if the smallest distance in the unvisited set is infinity, the graph is not connected
        if (this.smallestNode.distance == Number.POSITIVE_INFINITY) {
            console.log("No route");
            this.data.errorMessage = "No route";
            isGraphLoaded = false;
            return this.data;
        }

        // Otherwise, select the unvisited node that is marked with the smallest tentative distance, set it as the new "current node", and go back to step 3.
        this.currentNode = this.smallestNode;
    }
};

var findInternationalAirRoute = function(mail, data){
    //Create a set of all the unvisited nodes called the unvisited set and init node values
    var unvisited = [];
    for (var node in nodes) {
        unvisited.push(nodes[node]);
    //init values
        nodes[node].distance = Number.POSITIVE_INFINITY;
        nodes[node].visited = false;
        nodes[node].fromSegment = null;
    }

    this.data = data;
    //Set up starting node
    this.currentNode = nodes[mail.origin];
    this.currentNode.distance = 0;
    var sentDate = new Date().getTime();

    while (true) {
        this.currentNode.visited = true;

        //If the destination node has been visited then stop. The algorithm has finished.
        if (nodes[mail.destination].visited) {
            console.log("Reached Destination. Route:");
            this.cost = 0;
            this.currentNode = nodes[mail.destination];
            while (this.currentNode != nodes[mail.origin]) {
                this.data.routeTaken.push(this.currentNode.fromSegment.id);
                console.log(this.currentNode.name + " from " + this.currentNode.fromSegment.startNode.name);
                this.cost += (this.currentNode.fromSegment.weightCost * mail.weight) + (this.currentNode.fromSegment.volumeCost * mail.volume);
                this.currentNode = this.currentNode.fromSegment.startNode;
            }
            this.data.routeTaken.reverse();
            this.data.costToCompany = this.cost;
            this.data.errorMessage = false;

            console.log("Completed");
            isGraphLoaded = false;
            return this.data;
        }
        //date and time mail arrived at current node
        this.arrivalTime = sentDate + this.currentNode.distance;

        //For the current node consider all of its unvisited neighbors
        for (var segmentId in this.currentNode.segments) {
            var segment = this.currentNode.segments[segmentId];
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

                //calculate tentative distance. Compare tentative distance to the current assigned value
                //assign the smaller one.
                if ((this.currentNode.distance + segment.duration + this.waitTime) < segment.endNode.distance) {
                    segment.endNode.distance = this.currentNode.distance + segment.duration + this.waitTime;
                    segment.endNode.fromSegment = segment;
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

        //get the node with the smallest distance from unvisited
        this.smallestNode;
        for (var nodeId in unvisited) {
            var node = unvisited[nodeId];
            if (nodeId == 0) {
                this.smallestNode = node;
            }
            else if (this.smallestNode.distance > node.distance) {
                this.smallestNode = node;
            }
        }

        //if the smallest distance in the unvisited set is infinity, the graph is not connected
        if (this.smallestNode.distance == Number.POSITIVE_INFINITY) {
            console.log("No route");
            this.data.errorMessage = "No route";
            isGraphLoaded = false;
            return this.data;
        }

        // Otherwise, select the unvisited node that is marked with the smallest tentative distance, set it as the new "current node", and go back to step 3.
        this.currentNode = this.smallestNode;
    }
};

var findInternationalStandardRoute = function(mail, data){

    //Create a set of all the unvisited nodes called the unvisited set and init node values
    var unvisited = [];
    for (var i = 0; i < nodes.length; i++) {
        unvisited.push(nodes[i]);
    //init values
        nodes[i].distance = Number.POSITIVE_INFINITY;
        nodes[i].visited = false;
        nodes[i].fromSegment = null;
    }

    this.data = data;

    //set up starting node
    this.currentNode = nodes[mail.origin];
    this.currentNode.distance = 0;

    while (true) {
        this.currentNode.visited = true;

        //If the destination node has been visited then stop. The algorithm has finished.
        if (nodes[mail.destination].visited) {
            console.log("Reached Destination. Route:");
            this.cost = 0;
            this.currentNode = nodes[mail.destination];
            while (this.currentNode != nodes[mail.origin]) {
                this.data.routeTaken.push(this.currentNode.fromSegment.id);
                console.log(this.currentNode.name + " from " + this.currentNode.fromSegment.startNode.name);
                this.cost += (this.currentNode.fromSegment.weightCost * mail.weight) + (this.currentNode.fromSegment.volumeCost * mail.volume);
                this.currentNode = this.currentNode.fromSegment.startNode;
            }
            this.data.routeTaken.reverse();
            this.data.costToCompany = this.cost;
            this.data.errorMessage = false;
            console.log("");
            isGraphLoaded = false;
            return this.data;
        }
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
                //calculate tentative cost. Compare tentative distance to the current assigned value
                //assign the smaller one.
                if ((this.currentNode.distance + this.weightCost + this.volumeCost + this.airPenalty) < segment.endNode.distance) {
                    segment.endNode.distance = this.currentNode.distance + this.weightCost + this.volumeCost + this.airPenalty;
                    segment.endNode.fromSegment = segment;
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

        //get the node with the smallest distance from unvisited
        this.smallestNode;
        for (var k = 0; k < unvisited.length; k++) {
            var node = unvisited[k];
            if (k == 0) {
                this.smallestNode = node;
            }
            else if (this.smallestNode.distance > node.distance) {
                this.smallestNode = node;
            }
        }

        //if the smallest distance in the unvisited set is infinity, the graph is not connected
        if (this.smallestNode && this.smallestNode.distance == Number.POSITIVE_INFINITY) {
            console.log("No route");
            this.data.errorMessage = "No route";
            isGraphLoaded = false;
            return this.data;
        }
        // Otherwise, select the unvisited node that is marked with the smallest tentative distance, set it as the new "current node", and go back to step 3.
        this.currentNode = this.smallestNode;
    }
};


var createPrices = function (customerprices) {
    console.log("CustomerPrices: ");
    prices = customerprices;
    console.log(prices);
    console.log("prices.length= " + prices.length);
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
            console.log(costs[i]);
            var newSegment = new segment(costs[i].routeid, nodes[costs[i].origin], nodes[costs[i].destination], costs[i]['type'], costs[i].weightcost, costs[i].volumecost, costs[i].maxweight, costs[i].maxvolume, costs[i].duration, costs[i].frequency, costs[i].day);
            segments.push(newSegment);
            nodes[costs[i].origin].segments.push(newSegment);
        }
        console.log('nodes');
        console.log(nodes);
        console.log('segments');
        console.log(segments);
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
    callback();
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
    this.distance = Number.POSITIVE_INFINITY;
    this.visited = false;
    this.fromSegment = null;
    this.international = inter;
};


var mailRouteData = function () {
    this.routeTaken = [];//a list of route Id's, in order from origin to destination
    this.costToCompany;//total cost to company
    this.costToCustomer;//customer price
    this.errorMessage;//if search was success this is false, else it contains a string
};
