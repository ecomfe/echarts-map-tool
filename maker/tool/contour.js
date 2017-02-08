Error.stackTraceLimit = 200;

var glob = require('glob');
var fs = require('fs');
var path = require('path');
var clipper = require('./clipper');

var echarts = require('../../dist/echarts');

// Generate thumb
var Canvas = require('Canvas');
echarts.setCanvasCreator(function () {
    var canvas = new Canvas(128, 128);
    return canvas;
});
var canvas = new Canvas(512, 512);
var myChart = echarts.init(canvas);
var json = JSON.parse(fs.readFileSync('../json/china.json', 'utf-8'));
echarts.registerMap('china-2', json);
myChart.setOption({
    series: [{
        type: 'map',
        map: 'china-2',
        data: []
    }]
});

var geo = myChart.getModel().getSeriesByIndex(0).coordinateSystem;
var subject = new clipper.Paths();
geo.regions.forEach(function (region) {
    region.contours.forEach(function (contour) {
        var path = new clipper.Path();
        contour.forEach(function (pt) {
            path.push(new clipper.IntPoint(pt[0] * 1000, pt[1] * 1000));
        });
        subject.push(path);
    });
});
var c = new clipper.Clipper();
c.AddPaths(subject, clipper.PolyType.ptSubject, true);
var solution = new clipper.Paths();
c.Execute(clipper.ClipType.ctUnion, solution);

function polygonArea(pts) {
    var area = 0;
    for (var i = pts.length - 1, j = 0; j < pts.length;) {
        var pt0 = pts[0];
        var pt1 = pts[1];
        i = j;
        j++;
        area += pt0[0] * pt1[1] - pt1[0] * pt0[1];
    }
    return Math.abs(area);
}

var feature = {
    geometry: {
        type: 'MultiPolygon',
        coordinates: [solution.map(function (path) {
            return path.map(function (pt) {
                return [pt.X / 1000, pt.Y / 1000];
            })
        }).filter(function (polygon) {
            return polygonArea(polygon) > 500
        })]
    },
    properties: {
        name: 'china',
        childNum: 1
    }
};
var geoJson = {
    type: 'FeatureCollection',
    features: [feature]
};
fs.writeFileSync('./china-contour.json', JSON.stringify(geoJson, null, 2), 'utf-8')

myChart.dispose();