/**
 * Created by Neel on 16/06/2016.
 */

function logFile() {
    "use strict";
    // this.XMLPath = "logFile.xml";


    this.loadXMLDoc = function(callback) {
        var fs = require('fs');
        var xml2js = require('xml2js');
        var json;
        try {
            var fileData = fs.readFileSync("logFile.xml", 'utf8');

            var parser = new xml2js.Parser();
            console.log(fileData);
            parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
                console.log(err);
                console.log(result);
                console.log('Done');
                console.log("File logFile.xml was successfully read.\n");
                if (callback) {
                    callback(result);
                } else {
                    return result;
                }
            });
        } catch (ex) {console.log(ex)}
    };
    // this.rawJSON = this.loadXMLDoc();
}

module.exports.logFile = logFile;