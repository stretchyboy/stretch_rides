/**
 * mapbox geojson/simplestyle example
 *
 */
'use strict';
var path = require('path');

var L = require('leaflet-headless');
//var st = require('geojson-bounds');
var gu = require('gps-util');

//require('leaflet-hotline')(L);

require("Leaflet.MultiOptionsPolyline")

var document = global.document;

require('mapbox.js');
L.Line3 = require("l.line3");
    
    
function getImageFromTCX (outfilename, callback, error, ride) {
    if(error){
        console.error(error);
        process.exit(1);
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
    
    //geoJSON.features[0].properties = Object.assign(geoJSON.features[0].properties,
    /*geoJSON.features[0].properties = {
            "stroke": "#00ff00",
            //"stroke": "#ff746e",
            "stroke-opacity": 0.7,
            "stroke-width": 4
        };
    */
    
    var map = L.map(element.id);
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    //console.log("L=",L)
    //console.log("L.Line3=", L.Line3)
    
    var oRoute2 = L.geoJson(geoJSON, {
        //style: L.mapbox.simplestyle.style
    }).addTo(map);
    
    
    var oRoute = new L.Line3(map);
    oRoute.set(geoJSON);//.addTo(map);
    console.log("oRoute", oRoute);
    
    //var oRoute = L.hotline(aPoints, {min:0, max:500, palette:{ 0.0: 'green', 0.5: 'yellow', 1.0: 'red' }}).addTo(map);
    
    /*var oRoute = L.multiOptionsPolyline(aPoints, {
    multiOptions: {
        optionIdxFn: function (latLng) {
            var i,
                altThresholds = [0, 100, 200, 300, 400, 500, 600, 700];

            for (i = 0; i < altThresholds.length; ++i) {
                if (latLng.alt <= altThresholds[i]) {
                    return i;
                }
            }
            return altThresholds.length;
        },
        options: [
            {color: '#0000FF'}, {color: '#0040FF'}, {color: '#0080FF'},
            {color: '#00FFB0'}, {color: '#00E000'}, {color: '#80FF00'},
            {color: '#FFFF00'}, {color: '#FFC000'}, {color: '#FF0000'}
        ]
    },
    weight: 5,
    lineCap: 'butt',
    opacity: 0.75,
    smoothFactor: 1}).addTo(map);
    */

    var bounds = oRoute2.getBounds();
    map.fitBounds(bounds);
    //map.fitBounds(bounds, { padding: [10, 10] });
    
    map.saveImage(outfilename, callback);
}

// run the example if it's ran directly
if (require.main === module) {
    console.log('Saving a mapbox styled image using leaflet-image...');
    console.time('leaflet-image');

    var outfilename = path.join(__dirname, 'tcx.png');
    var filename = "data/2017-05-01_Morning ride_Cycling.tcx"; 
    gu.tcxParseFile(filename, getImageFromTCX.bind(this, outfilename, function () {
        console.log('Saved file to ' + outfilename);
        console.timeEnd('leaflet-image');
        process.exit(1);
    }));
}
