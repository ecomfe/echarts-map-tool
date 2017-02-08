var fs = require('fs');
var compress = require('./compress');
var jsTplStr = fs.readFileSync('./jsTpl.js', 'utf-8');


var worldNameMap = {
    // 'United States': 'United States of America',
    // 'Côte d\'Ivoire': 'Ivory Coast',
    // 'Central African Rep.': 'Central African Republic',
    // 'S. Sudan': 'South Sudan',
    // 'Dem. Rep. Congo': 'Democratic Republic of the Congo',
    'Republic of Congo': 'Republic of the Congo'
};

// World
var worldGeo = JSON.parse(fs.readFileSync('../raw/world-fixed.json', 'utf-8'));
var taiwanFeature;
var chinaFeature;
worldGeo.features = worldGeo.features.filter(function (feature) {
    if (feature.properties && feature.properties.name === 'Taiwan') {
        taiwanFeature = feature;
        return false;
    }
    if (feature.properties && feature.properties.name === 'China') {
        chinaFeature = feature;
    }
    return feature.geometry && feature.properties && feature.geometry.coordinates.length
        && feature.properties.name !== 'Antarctica';
}).map(function (feature) {
    var res = {
        geometry: {
            type: feature.geometry.type,
            coordinates: feature.geometry.coordinates
        },
        properties: {
            name: worldNameMap[feature.properties.sovereignt]
                || feature.properties.sovereignt,
            childNum: feature.geometry.coordinates.length
       }
    };
    if (feature.properties.cp) {
        res.properties.cp = feature.properties.cp;
    }
    return res;
});

if (taiwanFeature) {
    // if (taiwanFeature.geometry.type === 'Polygon') {
        // chinaFeature.geometry.coordinates.push(taiwanFeature.geometry.coordinates[1]);
        // chinaFeature.properties.childNum++;
        chinaFeature.geometry.coordinates.push(taiwanFeature.geometry.coordinates);
        chinaFeature.properties.childNum++;
    // }
    // else {
    //     console.log(chinaFeature.geometry.coordinates.length);
    //     chinaFeature.geometry.coordinates
    //         = chinaFeature.geometry.coordinates.concat(taiwanFeature.geometry.coordinates);
    //     chinaFeature.properties.childNum += taiwanFeature.geometry.coordinates.length;
    //     console.log(chinaFeature.geometry.coordinates.length);
    // }
}

var worldGeoStr = JSON.stringify(worldGeo);
fs.writeFileSync('../json/world.json', worldGeoStr , 'utf-8');
fs.writeFileSync(
    '../js/world.js',
    jsTplStr.replace('{{name}}', 'world')
        .replace('{{data}}', worldGeoStr),
    'utf-8'
);