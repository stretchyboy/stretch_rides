/**
 * mapbox geojson/simplestyle example
 *
 */
'use strict';
var path = require('path');

var L = require('leaflet-headless');
var gu = require('gps-util');
var stats = require("stats-lite")

var document = global.document;

require('mapbox.js');

function getImageFromTCX (outfilename, callback, error, ride) {
    if(error){
        console.error(error);
        process.exit(1);
    }  

    callback =callback.bind(this, ride);
    
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
    
    var map = L.map(element.id);
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var oRoute = L.geoJson(geoJSON, {
        style: L.mapbox.simplestyle.style
    });//.addTo(map);
    
    var bounds = oRoute.getBounds();
    map.fitBounds(bounds);
    //map.fitBounds(bounds, { padding: [10, 10] });
    
    var Color = require('color');
    var iCurrDistKM = 0;
    var iCurrDistM = 0;
    
    var iDistKM = 0;
    var iDistM  = 0;
    
    var samples = 4;
    var max_percentage = 25;
    var altsample = [];
    
    
    ride = ride.map(function(segment, i, segments){
          
        segment.gain = 0;
        if(segment.altitude == 0 && altitude_first>20){
            segment.altitude = altitude_first;
        }
        
        if(i >= 1){
            segment.dist_delta = segment.distance - ride[i-1].distance ;
            segment.gradient = segments[i-1].gradient;
            segment.percent = segments[i-1].percent;
            segment.altitude_smoothed = segments[i-1].altitude_smoothed;
        
        } else {
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
            
        if(i%100 == 0){
            console.log(segment, altsample);
            //process.exit();
        }
        return segment;
    });
      
    /*
  var moving = ride.filter(function(segment, i){
      return segment.speed > 0 || segment.recent_gradient > 0.01;
  })
  */
  
    var aPoints = ride.map(function (item, index) {
                var color = Color('rgb(255, 0, 0)');
                //var color = Color('hsl(0, 100%, 100%)');
                //color.hsl().rotate(Math.round(item.speed * (360/40))).rgb();
                color = color.hsl().rotate(Math.round(item.speed * (240/32))).rgb();
                
                iDistKM = Math.floor(item.distance /1000);
                iDistM  = Math.floor(item.distance /1600);
                
                var trkpt = L.latLng(item.lat, item.lng, item.altitude);
                var cirleOpts =  {
                    color:color.toString(), 
                    //radius: Math.ceil(item.altitude/5),
                    //radius: Math.ceil(item.altitude/5), //altude
                    radius: Math.max(20, 70 + Math.round(item.percent*15)),
                    opacity:0.8,
                    stroke:false
                };
                
                var circle = L.circle(trkpt,cirleOpts).addTo(map);
                
                if(iDistKM > iCurrDistKM && (iDistKM % 10) ==0 ){
                    console.log(item, cirleOpts);
                
                    /*var popup = L.popup()
                        .setLatLng(trkpt)
                        .setContent(iDistKM+"km")
                        .openOn(map);
                    */
                    var marker = L.marker(trkpt,{title:iDistKM+"km"}).openTooltip(trkpt);
                    //marker.bindLabel(iDistKM+"km").openTooltip();
                    //marker.bindTooltip(iDistKM+"km").openTooltip();
                    iCurrDistKM = iDistKM;
                }
                
                
                if(iDistM > iCurrDistM && (iDistM % 10) ==0 ){
                    
                }
                
                
                return circle;    });
                
    map.saveImage(outfilename, callback);
    /*var outfilename2 = path.join(__dirname, 'tcx2.png');
    var fs = require('fs');
        var drawing = require('pngjs-draw');
        var png = drawing(require('pngjs').PNG);
         
        fs.createReadStream(outfilename)
          .pipe(new png({ filterType: 4 }))
          .on('parsed', function() {
            // Draws a pixel with transparent green 
            this.drawText(20,20, "Martyn rode "+iDistKM+"km", this.colors.new(0,0,0))
         
            // Writes file 
            this.pack().pipe(fs.createWriteStream(outfilename2));
          });
      */  
}


// run the example if it's ran directly
if (require.main === module) {
    console.log('Saving a mapbox styled image using leaflet-image...');
    console.time('leaflet-image');
    // TODO : We need to change it to loading and converting the tcx files that come in the dropbox info
    // DONE : Graphics it working pretty well from geojson so far but needs to convey more info.
    
    var outfilename = path.join(__dirname, 'tcx.png');
    //var filename = "data/2017-05-01_Morning ride_Cycling.tcx"; 
    
    var filename = "data/2017-05-27_Cycling (1).tcx";
    gu.tcxParseFile(filename, getImageFromTCX.bind(this, outfilename, function (ride) {
        console.log('Saved file to ' + outfilename);
        console.timeEnd('leaflet-image');
        console.log(ride[5]);
        
    // TODO : Summary text (duration, distance, average speed)
    // TODO : Scale visible
    // TODO : So we could portray different info as well maybe using ,
        //an elevation profile insert https://github.com/MrMufflon/Leaflet.Elevation
        //elevation on the map https://github.com/kekscom/L.Line3
        //speed by colour https://github.com/hgoebl/Leaflet.MultiOptionsPolyline or https://iosphere.github.io/Leaflet.hotline/demo/
    // TODO : Save png with sensible name
    // TODO : Save back to dropbox ??
    // TODO : Have another ifttt turn it into twitter and facebook??
    // TODO : Or do the FB and Twitter posting from here.
        //process.exit();

    }));
}
