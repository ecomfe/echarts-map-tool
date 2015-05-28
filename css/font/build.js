var Fontmin = require('fontmin');
var htmlToText = require('html-to-text');
var path = require('path');



htmlToText.fromFile(path.join(__dirname, '../../index.html'), {}, function (err, text) {

    new Fontmin()
        .src('./noto-thin.ttf')
        .use(Fontmin.glyph({
            text: text
        }))
        .run(function (err, files) {
            if (err) {
                throw new Error(err);
            }
            require('fs').writeFileSync('./noto-thin.min.ttf', files[0]._contents);
        });
})