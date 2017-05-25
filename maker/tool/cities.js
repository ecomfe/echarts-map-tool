var fs = require('fs');
var glob = require('glob');

var centralCityList = ['北京', '天津', '上海', '重庆', '香港', '澳门'];
var centralCityPinyin = ['beijing', 'tianjin', 'shanghai', 'chongqing', 'xianggang', 'aomen'];

var zizhi = ['蒙古自治州', '蒙古族藏族自治州', '苗族侗族自治州', '布依族苗族自治州', '土家族苗族自治州', '朝鲜族自治州', '藏族羌族自治州', '柯尔克孜自治州', '哈萨克自治州', '傣族景颇族自治州', '傈僳族自治州', '白族自治州', '哈尼族彝族自治州', '壮族苗族自治州', '傣族自治州', '藏族自治州', '回族自治州', '彝族自治州', '黎族自治县', '黎族苗族自治县'];
glob('../json/province/*.json', function (err, list) {
    var cities = [];
    list.forEach(function (provincePath) {
        if (centralCityPinyin.find(function (cityName) {
            return provincePath.indexOf(cityName) >= 0;
        })) {
            return;
        }
        var json = JSON.parse(fs.readFileSync(provincePath, 'utf-8'));
        cities = cities.concat(json.features.filter(function (item) {
            return item.properties.name !== '三沙市';
        }).map(function (feature) {
            feature.properties.name = feature.properties.name.replace(/(市|地区|林区)$/, '');
            zizhi.forEach(function (postfix) {
                feature.properties.name = feature.properties.name.replace(postfix, '');
            });
            return feature;
        }));
    });

    var chinaJson = JSON.parse(fs.readFileSync('../json/china.json', 'utf-8'));

    chinaJson.features.forEach(function (feature) {
        if (feature.properties.name === '台湾'
            || (centralCityList.indexOf(feature.properties.name) >= 0)) {
            cities.push(feature);
        }
    });

    fs.writeFileSync('../json/china-cities.json', JSON.stringify({
        UTF8Encoding: true,
        type: 'FeatureCollection',
        features: cities
    }), 'utf-8');
});