
var strava = require('strava-v3');

var onStarredSegments = function(err,payload,limits) {
  console.log("onStarredSegments");
  payload = payload.map(function(oSeg){
    delete oSeg.start_latitude;
    delete oSeg.start_longitude;
    delete oSeg.end_latitude;
    delete oSeg.end_longitude;
    delete oSeg.starred;
    delete oSeg.starred_date;
    return oSeg;
  });
    if(!err) {
        console.log(payload);
    }
    else {
        console.log(err);
    }
};

var onAthlete = function(err,payload,limits) {
    console.log("onAthlete");
    if(!err) {
        console.log(payload);
        strava.segments.listStarred({page: 1, per_page: 30} , onStarredSegments);
    }
    else {
        console.log(err);
    }
};


var onListEfforts = function(err,payload,limits) {
    console.log("onListEfforts");
    if(!err) {
        console.log(payload);
    }
    else {
        console.log(err);
    }
};

var onListSegments = function(err,payload,limits) {
  console.log("onListSegments");
    if(!err) {
        console.log(payload);
        strava.segments.listEfforts({page: 1, per_page: 30} , onListEfforts);
    }
    else {
        console.log(err);
    }
};


strava.athlete.get({},onAthlete);

    
// JavaScript File
var gu = require('gps-util');
//console.log(Object.keys(gu));
var filename = "data/2017-05-01_Morning ride_Cycling.tcx"; 
var callback = function(error, ride){
  if(error){
      console.error(error);
  }  
  console.log("ride", ride.length,"segments");
  
  var samples = 3;
  ride = ride.map(function(segment, i){
      
      segment.recent_dist = 0;
      segment.recent_gain = 0;
      segment.recent_gradient = 0;
      
      if(i >= samples){
        segment.recent_dist = segment.distance - ride[i-samples].distance ;
        segment.recent_gain = segment.altitude - ride[i-samples].altitude ;
        if (segment.recent_dist > 0){
            segment.recent_gradient = segment.recent_gain / segment.recent_dist;
        }
      }
      
      segment.dist_delta = 0;
      segment.gain = 0;
      segment.gradient = 0;
      
      if(i >= 1){
        segment.dist_delta = segment.distance - ride[i-1].distance ;
        segment.gain = segment.altitude - ride[i-1].altitude ;
        if (segment.dist_delta > 0){
            segment.gradient = segment.gain / segment.dist_delta;
            segment.percent = Math.round(segment.gradient * 100);
        }
      }
      
      return segment;
  });
  
  var moving = ride.filter(function(segment, i){
      return segment.speed > 0 || segment.recent_gradient > 0.01;
  })
  
  var notmoving = ride.filter(function(segment, i){
      return segment.speed == 0 && segment.recent_dist > 0;
  })
  console.log("moving", moving.length,"segments");
  
  console.log("notmoving", notmoving.length,"segments", ride.length - notmoving.length);
  
  //find natural segments (contigumous by steepness)
  var aSegments = [];
  
  ride.forEach(function(segment, i){
    //classify the segments (gradient, length, time into ride)
    //save the file (or master file with sections??)
    if(aSegments.length == 0){
      aSegments.push(segment);
    } else{
      var currSegment = aSegments[aSegments.length - 1];
      if(currSegment.percent == segment.percent)
      {
        // do avergaes
      }
    }
  });
  
  
  
  //gu.tcxParseFile(filename, callback);

  //Anaylise target race in same way 
  //score for simliarnessthe each segment of every race versus each segement of the target
  //choose the best match for each segemnt 
  //multiply the time from the matching segement by the ratio of the distances
  //add it all up.
}
  //TODO;