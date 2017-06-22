var express = require('express');
var app = express();
var node_dropbox = require('node-dropbox');
var fs = require("fs");
var path = require("path");
var stretchmaps = require("./stretchmaps");

var access_token = 'zOcdQG6CisYAAAAAAAAru7phxDRH1I10FlEHjdTvPNmFA5iaU7yIHKNJP1huwlr1';
var api = node_dropbox.api(access_token);

if(!fs.existsSync("data")){
  fs.mkdirSync("data");
}

if(!fs.existsSync("images")){
  fs.mkdirSync("images");
}

function onImageComplete(res, outfile, summary){
  
  summary.imageurl = "https://stretch-rides-stretchyboy.c9users.io/images/"+outfile;
  console.log("summary", summary);
  
  var iftttHost = "https://maker.ifttt.com";
  var iftttURL = "trigger/{event}/with/key/okLg00sVqcknugfXoX9Oxhf8fpVXjRtZVSv_yY9Wxya";
  
  iftttURL = iftttURL.replace("{event}", "new_image");
  var values = {"value1":summary.imageurl, "value2":summary.distance,"value3":summary.duration};
  console.log(values);
  if(true){
    var outrequest = require('request-json');
    var client = outrequest.createClient(iftttHost);
    client.get(iftttURL, values, function(err, res2, body) {
      if (err) { throw err; }
      console.log("body",body);
      res.send('<img src="'+summary.imageurl+'" /><br>Completed succesfully');
    });
  } else {
    res.send('<img src="'+summary.imageurl+'" /><br>Completed succesfully');
  }
  
}

app.get('/rideimage/:filename', function (req, res) {
  //console.log(req.params);
  var sAppPath = ("/Apps/tapiriik/"+req.params.filename).toLowerCase();
  var sFilePath = "data/"+req.params.filename;
  var onThisImageComplete = onImageComplete.bind(this, res);
  
  api.getFile(sAppPath, function(err, response, body){
    if (err) { throw err; }
    //console.log(response, body);
    fs.writeFile(sFilePath, body, 'utf8', function (err) {
      if (err) { throw err; }
      console.log('File: ' + sFilePath + ' saved.');
      stretchmaps.stretchmaps.getImageFromTCXfile(sFilePath,onThisImageComplete);
    });
  });
});
 
app.use('/images', express.static(path.join(__dirname, 'images')))
 
app.listen(process.env.PORT,process.env.IP);