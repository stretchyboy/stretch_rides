/**
 * mapbox geojson/simplestyle example
 *
 */
'use strict';
var stretchMaps = function(){
    
    var path = require('path');
    var L = require('leaflet-headless');
    var gu = require('gps-util');
    var stats = require("stats-lite");
    require('mapbox.js');
    var Color = require('color');
    
    var document = global.document;
    
    
    this.SecondsTohhmmss = function(totalSeconds) {
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
    
    this.getImageFromTCX = function(inputfilename, callback, error, ride) {
        if(error){
            console.error(error);
            process.exit(1);
        }  
        
        var outfilename = path.basename(inputfilename, "tcx")+"png";
        var outfilepath = path.join(__dirname, "images", outfilename);
        
    
        var altitude_first = ride.reduce(function(altitude_counting, segment, i){
            if(altitude_counting == null && segment.altitude > 0){
                altitude_counting = segment.altitude;
            }
            return altitude_counting;
        }, null);
        
        if(altitude_first == null){
            altitude_first = 0;
        }
        
        var aPoints = ride.map(function (segment) {
                    var trkpt = L.latLng(segment.lat, segment.lng, segment.altitude);
                    trkpt.meta = segment.meta;
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
        //element.id = 'map-leaflet-image'+(inputfilename.replace(/\W/,""));
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
        var max_percentage = 33; //The steepest road in the UK is 33%
        var max_display_percentage = 15; //The steepest road in the UK is 33%
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
                    
            if(false && i%1000 == 0){
                console.log(segment, altsample);
                //process.exit();
            }
            return segment;
        });
        
        var aPoints = ride.map(function (segment, i, segments) {
            var color = Color('rgb(0, 0, 255)');
            //move to Math.sqrt(percentage based one) where 
            var prescale = 100;
            var anglescale = 120 / Math.sqrt( max_display_percentage *prescale );
            var direction = 1;
            if(segment.percent < 0){
                direction = -1;
            }
            segment.angle = direction * Math.min(120, anglescale * Math.sqrt(Math.abs(segment.percent*prescale)));
            
            //segment.angle = Math.round(120 * Math.max(- max_display_percentage, Math.min(segment.percent, max_display_percentage))/max_display_percentage);
            color = color.hsl().rotate(segment.angle).rgb(); 
            
            //color = color.hsl().rotate(Math.round(segment.speed * (240/32))).rgb();
            
            iDistKM = Math.floor(segment.distance /1000);
            iDistM  = Math.floor(segment.distance /1600);
            
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
    
                var circle = L.circle(segment.point, circleOpts).addTo(map);
            } else {            
                var multiplier = 1.5;
                var zero = 15;
                var scaler = 20 * Math.PI;
                
                /*var weight = Math.ceil(multiplier*Math.sqrt(Math.pow(zero/multiplier,2) + (scaler * (segment.percent/ Math.PI))));
                if(segment.percent < 0){
                    weight = Math.max(1, zero + Math.round(segment.percent*1));
                }*/
                //var weight =  segment.speed+2;//Math.ceil(multiplier*Math.sqrt(Math.pow(zero/multiplier,2) + (scaler * (segment.percent/ Math.PI))));
                var max_speed = 40;
                var max_weight = 20;
                var weightscale = (max_weight - 1) / Math.sqrt( max_speed );
                var weight = max_weight - (weightscale * Math.sqrt(Math.abs(segment.speed)));
                
                
                //var weight =  Math.max(1, 20 - segment.speed);//Math.ceil(multiplier*Math.sqrt(Math.pow(zero/multiplier,2) + (scaler * (segment.percent/ Math.PI))));
                var opacity =  0.2;//Math.max(0.1, Math.min(1, segment.speed/20));
                
                var lineOpts =  {
                    color:color.toString(), 
                    //lineCap:"butt",
                    //lineCap:"square",
                    //weight: Math.max(0.1, 15 + Math.round(segment.percent*2)),
                    weight:  weight,
                    opacity: opacity, //Math.min(1, Math.max(0.2, 0.8 - Math.round(segment.percent*0.05))),
                    //opacity:Math.min(1, Math.max(0.2, 0.8 - Math.round(segment.percent*0.05))),
                    // TODO : maybe change the weight to reflect the area of the rounded line caps rather than radius propotional to gradient
                    //stroke:false
                };
                
                var line = L.polyline([segments[i-1].point,segment.point], lineOpts).addTo(map);
            }
            
            if(i==0|| (iDistKM > iCurrDistKM && (iDistKM % 10) ==0) ){
                //console.log(segment, lineOpts);
            
                /*var popup = L.popup()
                    .setLatLng(trkpt)
                    .setContent(iDistKM+"km")
                    .openOn(map);
                */
                var marker = L.marker(segment.point, {
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
            /*if (i%100000 == 0 && segment.percent > 0){
                console.log(segment, lineOpts, Math.max(- max_display_percentage, Math.min(segment.percent, max_display_percentage)));
            }*/
            return circle;    
            
        });
        
        callback = callback.bind(this, ride, outfilename);
    
        map.saveImage(outfilepath, callback);
    };

    this.onImageSaved = function (onImageCompleteCallback, ride, outfilename) {
       // console.log("onImageCompleteCallback", onImageCompleteCallback, "ride", ride)
        console.log('Saved file to ' + outfilename);
        
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
            name        : outfilename.replace(".png","").replace("_", " "),
            start       : ride[0].time,
            duration    : this.SecondsTohhmmss(last.elapsed),
            distance    : Math.floor((last.distance/1000) * 10) / 10,
            speed       : Math.floor(10*((last.distance/1000) / (last.elapsed / (60*60))))/10,
            distanceM   : Math.floor((last.distance/1600) * 10) / 10,
            speedM      : Math.floor(10*((last.distance/1600) / (last.elapsed / (60*60))))/10,
            moving      : this.SecondsTohhmmss(movingduration),
            movingspeed : Math.floor(10*((last.distance/1000) / (movingduration / (60*60))))/10,
            movingspeedM: Math.floor(10*((last.distance/1600) / (movingduration / (60*60))))/10,
            ascent      : Math.floor(ascent)
        };
        
        //console.log(summary);
        onImageCompleteCallback(outfilename, summary);
        // TODO : Summary text (duration, distance, average speed)
        // TODO : Scale visible , difficult to do it as its not on canvas
        // TODO : Save back to dropbox ??
        // TODO : Have another ifttt turn it into twitter and facebook??
        // TODO : Or do the FB and Twitter posting from here.
        //process.exit();

    };

    this.getImageFromTCXfile = function(filename, onImageCompleteCallback){
        this.onImageSaved = this.onImageSaved.bind(this, onImageCompleteCallback);
        gu.tcxParseFile(filename, this.getImageFromTCX.bind(this, filename, this.onImageSaved));
    };
};

// run the example if it's ran directly
if (require.main === module) {
    var fs = require("fs");
    
    var filename = "data/2017-05-27_Cycling.tcx";
    if(fs.existsSync(filename)){
        console.log('Saving a mapbox styled image using leaflet-image...');
        var oStretchMaps= new stretchMaps();
        oStretchMaps.getImageFromTCXfile(filename, function(res, outfile, summary){
            process.exit();
        });
    } else {
        console.log("Test File Not Here");
        process.exit();
    }
} else {
    exports.stretchmaps = new stretchMaps(); 
}
