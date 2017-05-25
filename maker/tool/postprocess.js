var fs = require('fs');
var jsTplStr = fs.readFileSync('./jsTpl.js', 'utf-8');


var worldNameMap = {
    // 'United States': 'United States of America',
    // 'Côte d\'Ivoire': 'Ivory Coast',
    // 'Central African Rep.': 'Central African Republic',
    // 'S. Sudan': 'South Sudan',
    // 'Dem. Rep. Congo': 'Democratic Republic of the Congo',
    'Republic of Congo': 'Republic of the Congo'
};

var cpAdjustMap = {
    'France': [2.8719426, 46.8222422],
    'United Kingdom': [-2.5830348, 54.4598409],
    'Netherlands': [5.0752777, 52.358465],
    'Denmark': [10.2768332, 56.1773879],
    'Portugal': [-8.7440694, 39.9251454],
    'Spain': [-2.9366964, 40.3438963]
};

// World
var worldGeo = JSON.parse(fs.readFileSync('../raw/world-fixed.json', 'utf-8'));
var chinaFeature;
var mergeFeatures = [];
worldGeo.features = worldGeo.features.filter(function (feature) {
    var name = feature.properties && feature.properties.name;

    if (['Taiwan', 'Hong Kong', 'Macao'].indexOf(name) >= 0) {
        mergeFeatures.push(feature);
        return;
    }
    if (name === 'China') {
        chinaFeature = feature;
    }
    return feature.geometry && feature.properties && feature.geometry.coordinates.length
        && feature.properties.name !== 'Antarctica';
});

mergeFeatures.forEach(function (mergeFeature) {
    // console.log(mergeFeature.properties.name, mergeFeature.geometry.type);
    if (mergeFeature.geometry.type === 'Polygon') {
        chinaFeature.geometry.coordinates.push(mergeFeature.geometry.coordinates);
    }
    else {
        chinaFeature.geometry.coordinates
            = chinaFeature.geometry.coordinates.concat(mergeFeature.geometry.coordinates);
    }
});

worldGeo.features = worldGeo.features.map(function (feature) {
    // console.log(feature.properties.name);
    var name = feature.properties.name;

    // Note: Using `feature.properties.sovereignt` can merge areas to one country.

    var res = {
        geometry: {
            type: feature.geometry.type,
            coordinates: feature.geometry.coordinates
        },
        properties: {
            name: worldNameMap[name] || name,
            childNum: feature.geometry.coordinates.length
       }
    };

    if (feature.properties.cp) {
        res.properties.cp = feature.properties.cp;
    }

    // Adjust cp, for some countries that have colonies overseas.
    var cpAdjust = cpAdjustMap[feature.properties.name];
    if (cpAdjust) {
        res.properties.cp = cpAdjust;
    }

    return res;
});



var worldGeoStr = JSON.stringify(worldGeo);
fs.writeFileSync('../json/world.json', worldGeoStr , 'utf-8');
fs.writeFileSync(
    '../js/world.js',
    jsTplStr.replace('{{name}}', 'world')
        .replace('{{data}}', worldGeoStr),
    'utf-8'
);