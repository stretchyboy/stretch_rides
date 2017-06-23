var express = require('express');
var app = express();
var node_dropbox = require('node-dropbox');
var fs = require("fs");
var path = require("path");
var stretchmaps = require("./stretchmaps");
var os = require("os");

var access_token = 'zOcdQG6CisYAAAAAAAAru7phxDRH1I10FlEHjdTvPNmFA5iaU7yIHKNJP1huwlr1';
var api = node_dropbox.api(access_token);

if(!fs.existsSync("data")){
  fs.mkdirSync("data");
}

if(!fs.existsSync("images")){
  fs.mkdirSync("images");
}

function onImageComplete(res, outfile, summary){
  
  // FIXME : host ??
  summary.imageurl = process.env.baseURL+"images/"+outfile;
  //summary.imageurl = "https://stretch-rides-stretchyboy.c9users.io/images/"+outfile;
  console.log("summary", summary);
  res.send('<img src="'+summary.imageurl+'" /><br>Completed succesfully');

  const IFTTTmaker = require('node-ifttt-maker');
  const ifttt_maker = new IFTTTmaker('okLg00sVqcknugfXoX9Oxhf8fpVXjRtZVSv_yY9Wxya');

  const event = 'new_image';
  const values = {
      "value1":summary.imageurl,
      "value2":summary.distance,
      "value3":summary.duration};
   
  // Simple request 
  ifttt_maker
    .request(event, values)
    .then((response) => {
      console.log("Done.")
    })
    .catch((err) => {
      res.send("Oops"+err);
    });
   

  /*var iftttHost = "https://maker.ifttt.com";
  var iftttURL = "trigger/{event}/with/key/okLg00sVqcknugfXoX9Oxhf8fpVXjRtZVSv_yY9Wxya";
  
  iftttURL = iftttURL.replace("{event}", "new_image");
  var values = {"value1":summary.imageurl, "value2":summary.distance,"value3":summary.duration};
  console.log(values);
  //res.send('<img src="'+summary.imageurl+'" /><br>Completed succesfully');
  
  if(true){
    var outrequest = require('request-json');
    var client = outrequest.createClient(iftttHost);
    client.get(iftttURL, values, function(err, res2, body) {
      if (err) { throw err; }
      console.log("body",body);
      //res.send('<img src="'+summary.imageurl+'" /><br>Completed succesfully');
    });
  }
  */
  
}

app.get('/rideimage/:filename', function (req, res) {
  //console.log(req.params);
  var sAppPath = ("/Apps/tapiriik/"+req.params.filename).toLowerCase();
  var sFilePath = "data/"+req.params.filename;
  var onThisImageComplete = onImageComplete.bind(this, res);
  
  // TODO : if file exists just send that back don't rebuild it
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