Error.stackTraceLimit = 200;

var glob = require('glob');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var echarts = require('../../dist/echarts');

// Generate thumb
var Canvas = require('Canvas');
glob('../json/province/*.json', function (err, files) {
    files.forEach(function (filePath) {
        var name = path.basename(filePath, '.json');
        var json = fs.readFileSync(filePath, 'utf-8');
        echarts.registerMap(name, JSON.parse(json));
        createThumb(name);
    });
});

echarts.setCanvasCreator(function () {
    var canvas = new Canvas(128, 128);
    return canvas;
});
function createThumb(mapType) {
    var canvas = new Canvas(512, 512);
    var myChart = echarts.init(canvas);
    myChart.setOption({
        series: [{
            type: 'map',
            map: mapType,
            data: [],
            itemStyle: {
                normal: {
                    areaColor: '#3BA7DC',
                    borderColor: '#fff'
                }
            },
            label: {
                normal: {
                    show: false
                }
            }
        }]
    });
    console.log(mapType);
    // Must dispose after used, or the animation instance will always run
    myChart.dispose();
    fs.writeFileSync('./thumb/' + mapType + '.png', canvas.toBuffer());
}