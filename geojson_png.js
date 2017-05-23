/**
 * mapbox geojson/simplestyle example
 *
 */
'use strict';
var path = require('path');

var L = require('leaflet-headless');
var st = require('geojson-bounds');

var document = global.document;

require('mapbox.js');
var fs = require("fs");

var sInputFP = "data/2017-05-01_Morning ride_Cycling.json"


function mapboxGeojsonExample (filename, callback) {
    // create an element for the map.
    var element = document.createElement('div');
    element.id = 'map-leaflet-image';
    document.body.appendChild(element);
    
    var geojson = JSON.parse(fs.readFileSync(sInputFP));
    //var extent = st.extent(geojson);
    geojson.features[0].properties = Object.assign(geojson.features[0].properties,
        {
            "stroke": "#fa946e",
            "stroke-opacity": 1,
            "stroke-width": 6
        });
    
    var map = L.map(element.id);
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    
    var oRoute = L.geoJson(geojson, {
        style: L.mapbox.simplestyle.style
    }).addTo(map);
    
    var bounds = oRoute.getBounds();
    map.fitBounds(bounds, { padding: [20, 20] });
    
    
    map.saveImage(filename, callback);
}

// run the example if it's ran directly
if (require.main === module) {
    console.log('Saving a mapbox styled image using leaflet-image...');
    console.time('leaflet-image');

    var filename = path.join(__dirname, 'example-mapbox-image.png');
    mapboxGeojsonExample(filename, function () {
        console.log('Saved file to ' + filename);
        console.timeEnd('leaflet-image');
    });
}
