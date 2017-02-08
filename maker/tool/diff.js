var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;

var fileName = process.argv[2];

if (!fileName) {
    console.error('File name should be specified, like, `node diff.js world`');
    return;
}

var oldFilePath = path.join(__dirname, '../../../echarts/map/json', fileName + '.json');
var newFilePath = path.join(__dirname, '../json', fileName + '.json');

if (!fs.statSync(oldFilePath).isFile()) {
    console.error(oldFilePath + ' does not exist.');
    return;
}

if (!fs.statSync(newFilePath).isFile()) {
    console.error(newFilePath + ' does not exist.');
    return;
}

var oldContent = fs.readFileSync(oldFilePath, 'utf-8');
var newContent = fs.readFileSync(newFilePath, 'utf-8');

oldContent = JSON.stringify(JSON.parse(oldContent), null, 4);
newContent = JSON.stringify(JSON.parse(newContent), null, 4);

var tmpPathOld = path.join(__dirname, 'tmp-map-old.json');
var tmpPathNew = path.join(__dirname, 'tmp-map-new.json');

fs.writeFileSync(tmpPathOld, oldContent , 'utf-8');
fs.writeFileSync(tmpPathNew, newContent , 'utf-8');

console.log('\n\nDIFF "' + oldFilePath + '"\nWITH "' + newFilePath + '"\n');

// Do diff
var diff = spawn('diff', [tmpPathOld, tmpPathNew]);
diff.stdout.on('data', function (data) {
    console.log('standard output:\n' + data);
});
diff.stderr.on('data', function (data) {
    console.log('standard error output:\n' + data);
});
diff.on('exit', function (code, signal) {
    console.log('child process eixt ,exit:' + code);

    // Clear
    fs.unlinkSync(tmpPathOld);
    fs.unlinkSync(tmpPathNew);
});
