var express = require('express')
var app = express();
var path = require('path');
var Dropbox = require('dropbox');
var access_token = 'zOcdQG6CisYAAAAAAAAru7phxDRH1I10FlEHjdTvPNmFA5iaU7yIHKNJP1huwlr1'
var dbx = new Dropbox({ accessToken:  access_token});
var fs = require("fs");
var imagefromtcx = require("./imagefromtcx");

function onImageComplete(outfile){
  
}

app.get('/rideimage/:filename', function (req, res) {
  console.log(req.params);
  var sAppPath = ("/Apps/tapiriik/"+req.params.filename).toLowerCase();
  var sFilePath = "data/"+req.params.filename;

var node_dropbox = require('node-dropbox');
var api = node_dropbox.api(access_token);
  
  api.getFile(sAppPath, function(err, response, body){
    if (err) { throw err; }
    console.log(response, body);
    fs.writeFile(sFilePath, body, 'utf8', function (err) {
          if (err) { throw err; }
          console.log('File: ' + sFilePath + ' saved.');
          imagefromtcx.stretchmaps.getImageFromTCXfile(sFilePath);
          //process.exit();
        });
  });
  //TRY https://www.npmjs.com/package/node-dropbox instead
  
  /*dbx.filesListFolder({path: '/Apps/tapiriik'})
  .then(function(response) {
    console.log(response);
    response.entries.forEach(function(entry){
     //console.log("entry", entry);
     dbx.filesDownload({ path: entry.path_lower })
      .then(function (data) {
        //console.log(data);
        if (typeof data.fileBinary == 'undefined' || data.fileBinary == 'undefined'){
          throw new Error("data.fileBinary missing");
          
        }
        fs.writeFile("data/"+data.name, data.fileBinary, 'binary', function (err) {
          if (err) { throw err; }
          console.log('File: ' + data.name + ' saved.');
          //process.exit();
        });
      })
      .catch(function (err) {
        throw err;
      });
      // 
    });  
  })
  .catch(function(error) {
    console.log(error);
  });
  */
  /*
  var sAppPath = ("/Apps/tapiriik/"+req.params.filename).toLowerCase();
  var sFilePath = "data/"+req.params.filename;
  
  dbx.filesListFolder({path: '/Apps/tapiriik'})
  .then(function(response) {
    console.log(response);
    response.entries.forEach(function(entry){
     //console.log("entry", entry);
     if( entry.path_lower == sAppPath){
       
     dbx.filesDownload({ path: entry.path_lower })
      .then(function (data) {
        console.log("data", data);
        if (typeof data.fileBinary == 'undefined' || data.fileBinary == 'undefined'){
          throw new Error("data.fileBinary missing");
          
        }
        fs.writeFile("data/"+data.name, data.fileBinary, 'binary', function (err) {
          if (err) { throw err; }
          console.log('File: ' + data.name + ' saved.');
          imagefromtcx.stretchmaps.getImageFromTCXfile(sFilePath);
  
          //process.exit();
        });
      })
      .catch(function (err) {
        throw err;
      });
      }
      // 
    });  
  })
  .catch(function(error) {
    console.log(error);
  });
  */
  
 /* dbx.filesDownload({ path: sAppPath })
      .then(function (data) {
        console.log(data);
        fs.writeFile(sFilePath, data.fileBinary, 'binary', function (err) {
          if (err) { throw err; }
          
          console.log('File: ' + sFilePath + ' being created.');
          });
        })
        .catch(function (err) {
          throw err;
        });
   */     
  res.send('Tar.')
})
 
app.listen(process.env.PORT,process.env.IP);