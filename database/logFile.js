/**
 * Created by Neel on 16/06/2016.
 */

function logFile() {
    "use strict";
    this.XMLPath = "logFile.xml";


    this.loadXMLDoc = function(filePath) {
        if (!filePath){
            filePath = this.XMLPath;
        }
        var fs = require('fs');
        var xml2js = require('xml2js');
        var json;
        try {
            var fileData = fs.readFileSync(filePath, 'utf8');

            var parser = new xml2js.Parser();
            console.log(fileData);
            parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
                console.log(err);
                json = JSON.stringify(result);
                console.log(JSON.stringify(result));
                console.log('Done');
            });

            console.log("File '" + filePath + "/ was successfully read.\n");
            return json;
        } catch (ex) {console.log(ex)}
    };
        this.rawJSON = this.loadXMLDoc();
}

module.exports.logFile = logFile;