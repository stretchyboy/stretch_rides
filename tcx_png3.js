/**
 * mapbox geojson/simplestyle example
 *
 */
'use strict';
var path = require('path');

var L = require('leaflet-headless');
var gu = require('gps-util');
var stats = require("stats-lite");
require('mapbox.js');
var Color = require('color');

var document = global.document;

var SecondsTohhmmss = function(totalSeconds) {
  var hours   = Math.floor(totalSeconds / 3600);
  var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
  var seconds = totalSeconds - (hours * 3600) - (minutes * 60);

  // round seconds
  seconds = Math.round(seconds * 100) / 100;

  var result = (hours < 10 ? "0" + hours : hours);
      result += ":" + (minutes < 10 ? "0" + minutes : minutes);
      result += ":" + (seconds  < 10 ? "0" + seconds : seconds);
  return result;
};

function getImageFromTCX (callback, error, ride) {
    if(error){
        console.error(error);
        process.exit(1);
    }  
    
    var outfilename = path.join(__dirname, "images", path.basename(filename, "tcx")+"png");

    var altitude_first = ride.reduce(function(altitude_counting, segment, i){
        if(altitude_counting == null && segment.altitude > 0){
            altitude_counting = segment.altitude;
        }
        return altitude_counting;
    }, null);
    
    if(altitude_first == null){
        altitude_first = 0;
    }
    
    var aPoints = ride.map(function (item) {
                var trkpt = L.latLng(item.lat, item.lng, item.altitude);
                trkpt.meta = item.meta;
                return trkpt;    });
    
    var points = ride.map(function(segment, i){
        //console.log(segment)
        //process.exit(1);
        return [segment.lng, segment.lat, segment.altitude];
    });
  
    var geoJSON = {
      "type": "FeatureCollection",
      "features": [{
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": points
        },
        "properties": {
          "color": "rgb(0,255,0)"
        }
      }]
    };

    // create an element for the map.
    var element = document.createElement('div');
    element.id = 'map-leaflet-image';
    document.body.appendChild(element);
    
    var map = L.map(element.id, {preferCanvas: true});
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    
    var oRoute = L.geoJson(geoJSON, {
        style: L.mapbox.simplestyle.style
    });//.addTo(map);
    
    var bounds = oRoute.getBounds();
    map.fitBounds(bounds);
    //map.fitBounds(bounds, { padding: [10, 10] });

    L.control.scale(
        {
            updateWhenIdle:true,
            renderer: L.canvas()
        }
        ).addTo(map);
    
    var iCurrDistKM = 0;
    var iCurrDistM = 0;
    
    var iDistKM = 0;
    var iDistM  = 0;
    
    var samples = 4;
    var max_percentage = 30;
    var altsample = [];
    
    
    ride = ride.map(function(segment, i, segments){
        
        segment.gain = 0;
        if(segment.altitude == 0 && altitude_first>20){
            segment.altitude = altitude_first;
        }
        segment.date = new Date(segment.time);
        //console.log(segment.date);
        segment.unixtime = Math.round(segment.date.getTime() / 1000);
        
        
        if(i >= 1){
            segment.dist_delta = segment.distance - ride[i-1].distance ;
            segment.gradient = segments[i-1].gradient;
            segment.percent = segments[i-1].percent;
            segment.altitude_smoothed = segments[i-1].altitude_smoothed;
            segment.elapsed =  segment.unixtime - segments[0].unixtime; 
            segment.duration =  segment.unixtime - segments[i-1].unixtime; 
        
        } else {
            segment.elapsed = 0;  
            segment.duration = 0;
            segment.dist_delta = 0;
            segment.gradient = 0;
            segment.percent =0;
            segment.altitude_smoothed = segment.altitude;
        }
        
        if(!isNaN(segment.altitude)){
            altsample = altsample.slice(-samples);  
            if(altsample.length==0 || Math.abs(segment.altitude - segment.altitude_smoothed) < (segment.dist_delta * (max_percentage / 100))){
                altsample.push(segment.altitude);
            }
        }
        
        if(altsample.length){
            segment.altitude_smoothed = stats.mean(altsample);
        }
        
        if (segment.dist_delta > 0){
            segment.gain = segment.altitude_smoothed - segments[i-1].altitude_smoothed ;
            segment.gradient = segment.gain / segment.dist_delta;
            segment.percent = Math.round(segment.gradient * 100);
        }
        
        segment.point = L.latLng(segment.lat, segment.lng, segment.altitude_smoothed);
                
        if(i%1000 == 0){
            console.log(segment, altsample);
            //process.exit();
        }
        return segment;
    });
    
    var aPoints = ride.map(function (item, i,segments) {
        var color = Color('rgb(255, 0, 0)');
        color = color.hsl().rotate(Math.round(item.speed * (240/32))).rgb();
        
        iDistKM = Math.floor(item.distance /1000);
        iDistM  = Math.floor(item.distance /1600);
        
        // DONE : So we could portray different info as well maybe using ,
            //an elevation profile insert https://github.com/MrMufflon/Leaflet.Elevation
            //elevation on the map https://github.com/kekscom/L.Line3
            //speed by colour https://github.com/hgoebl/Leaflet.MultiOptionsPolyline or https://iosphere.github.io/Leaflet.hotline/demo/
        
        if(i==0){
            var circleOpts =  {
                color:"black", 
                radius: 150,
                opacity:1,
                stroke:true
            };

            var circle = L.circle(item.point, circleOpts).addTo(map);
        } else {            
            var lineOpts =  {
                color:color.toString(), 
                //lineCap:"butt",
                //lineCap:"square",
                //weight: Math.max(0.1, 15 + Math.round(item.percent*2)),
                weight: Math.max(0.1, 2*Math.sqrt(30 + Math.round(item.percent*20) / Math.PI)),
                opacity:Math.min(1, Math.max(0.2, 0.8 - Math.round(item.percent*0.05))),
                // TODO : maybe change the weight to reflect the area of the rounded line caps rather than radius propotional to gradient
                //stroke:false
            };
            
            var line = L.polyline([segments[i-1].point,item.point], lineOpts).addTo(map);
        }
        
        
        
        if(i==0|| (iDistKM > iCurrDistKM && (iDistKM % 10) ==0) ){
            //console.log(item, cirleOpts);
        
            /*var popup = L.popup()
                .setLatLng(trkpt)
                .setContent(iDistKM+"km")
                .openOn(map);
            */
            var marker = L.marker(item.point, {
                title:iDistKM+"km", 
                renderer: L.canvas(),
                permanent:true
            }).bindTooltip(iDistKM+"km",{ 
                renderer: L.canvas(),
                permanent:true
                
            }).addTo(map);
            iCurrDistKM = iDistKM;
        }
        
        if(iDistM > iCurrDistM && (iDistM % 10) ==0 ){
            
        }
        return circle;    
        
    });
    
    callback = callback.bind(this, ride, outfilename);

    map.saveImage(outfilename, callback);
}

// run the example if it's ran directly
if (require.main === module) {
    console.log('Saving a mapbox styled image using leaflet-image...');
    console.time('leaflet-image');
    // TODO : We need to change it to loading and converting the tcx files that come in the dropbox info
    // DONE : Graphics it working pretty well from geojson so far but needs to convey more info.
    
    // DONE : Save png with sensible name
    var filename = "data/2017-05-01_Morning ride_Cycling.tcx"; 
    
    //var filename = "data/2017-06-02_Cycling (1).tcx";
    //var filename = "data/2017-06-02_Cycling.tcx";
    //var outfilename = path.join(__dirname, "images", path.basename(filename, "tcx")+"png");
    
    gu.tcxParseFile(filename, getImageFromTCX.bind(this, function (ride, outfilename) {
        console.log('Saved file to ' + outfilename);
        console.timeEnd('leaflet-image');
        //console.log(ride[5]);
        
        var last = ride[ride.length-1];
        
        
        var moving = ride.filter(function(segment, i){
            return segment.speed > 0 || segment.percent > 3;
        });
        
        var movingduration = moving.reduce(function(dur, segment, j){
                return dur+segment.duration;
        }, 0);
        
        var ascent = moving.reduce(function(asc, segment, j){
                if(segment.gain > 0){
                    asc += segment.gain;
                }
                return asc;
        }, 0);
        
        
        var summary = {
            duration    : SecondsTohhmmss(last.elapsed),
            distance    : Math.floor((last.distance/1000) * 10) / 10,
            speed       : Math.floor(10*((last.distance/1000) / (last.elapsed / (60*60))))/10,
            distanceM   : Math.floor((last.distance/1600) * 10) / 10,
            speedM      : Math.floor(10*((last.distance/1600) / (last.elapsed / (60*60))))/10,
            moving      : SecondsTohhmmss(movingduration),
            movingspeed : Math.floor(10*((last.distance/1000) / (movingduration / (60*60))))/10,
            movingspeedM: Math.floor(10*((last.distance/1600) / (movingduration / (60*60))))/10,
            ascent      : Math.floor(ascent)
        };
        
        console.log(summary);
        // TODO : Summary text (duration, distance, average speed)
        // TODO : Scale visible , difficult to do it as its not on canvas
        // TODO : Save back to dropbox ??
        // TODO : Have another ifttt turn it into twitter and facebook??
        // TODO : Or do the FB and Twitter posting from here.
        //process.exit();

    }));
}
