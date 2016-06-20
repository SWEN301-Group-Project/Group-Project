/**
 * Created by Neel on 16/06/2016.
 */
var fs = require('fs');
function logFile() {
    "use strict";
    // this.XMLPath = "logFile.xml";


    this.loadXMLDoc = function(callback) {
        var xml2js = require('xml2js');
        var json;
        try {
            var fileData = fs.readFileSync("logFile.xml", 'utf8');
            var parser = new xml2js.Parser();
            parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
                console.log("File logFile.xml was successfully read.");
                if (callback) {
                    callback(result);
                } else {
                    return result;
                }
            });
        } catch (ex) {console.log(ex)}
    };
    this.addEvent = function(event, callback){

        //event = {type: __, action: __, data: {mail/route/location/company/customerprice}}
        var content = "\n\t<event>";
        content += "\n\t\t<type>" + event.type + "</type>";
        content += "\n\t\t<action>" + event.action + "</action>";
        content += "\n\t\t<data>";
        //
        var tag;
        for(var property in event.data){
            tag = property + ">";
            content += "\n\t\t\t<" + tag + event.data[property] + "</" + tag;
        }
        content += "\n\t\t</data>";
        content += "\n\t</event>";
        //content to be inserted
        // var content = "\n\t<text>this is new content appended to the end of the XML</text>";
        var fileName = 'logFile.xml',
            buffer = new Buffer(content+'\n'+'</events>'),
            fileSize = fs.statSync(fileName)['size'];

        fs.open(fileName, 'r+', function(err, fd) {
            fs.write(fd, buffer, 0, buffer.length, fileSize-10, function(err) {
                if (err) throw err;
                console.log('done');
                if (callback) {
                    callback();
                } else {
                    return null;
                }
            })
        });
    };
    // this.rawJSON = this.loadXMLDoc();

}

module.exports.logFile = logFile;