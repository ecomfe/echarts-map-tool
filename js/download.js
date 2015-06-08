//geojson对象
function Geojson() {
    this.type  = "FeatureCollection";
    this.features =[];
}

//feature对象
function Feature() {
    this.type = "Feature";
    this.id = '';
    this.properties = {
        "name" : '',
        "cp" : [],
        "childNum" : 1
    };
    this.geometry = {
        "type" : "Polygon",
        "coordinates" : []
    };
}

//下载geojson文件
function fetchGeoJson(range, isOnlyOutline, isCompressed, cb) {

    var level;
    var keyword;
    var arrTemp;
    var citycode;

    if (range == '中国') {
        level = 'country';
        keyword = '中国';

    }
    else {

        arrTemp = range.val().split('|');
        level = arrTemp[0];//行政级别
        citycode = arrTemp[1];// 城市编码
        keyword = range.text(); //关键字

    }

    if (isOnlyOutline) {
        district.setSubdistrict(0);
    }
    else {
        district.setSubdistrict(1);
    }

    //行政区级别
    district.setLevel(level);


    if(isCentralCity && isOnlyOutline && level == 'city') {
        keyword = keyword.substring(0, keyword.length-3);
    }

    //行政区查询
    district.search(keyword, function(status, result){

        if (status === 'no_data') {
            cb();
            return;
        }
        if (isOnlyOutline) {
            createOutlineGeojson(result.districtList, isCompressed, cb);
        }
        else {
            createDetailedGeojson(result.districtList, isCompressed, cb);
        }
    });
}


// 生成仅有区域外轮廓的geojson文件
function createOutlineGeojson(list, isCompressed, cb) {

    // 实例化features, 该数据为geojson的features属性
    var geojson = new Geojson();
    var features = geojson.features;

    var data = list[0];
    var cityCode = data.citycode;
    var level = data.level;

    //获取市以及市下面的地区
    var feature;
    if(level === 'district') {
        feature = createDistFeature(list, citycode);
    } else {
        feature = createFeature(data);
    }
    features.push(feature);

    if (isCompressed) {
        geojson = compress(geojson);
    }

    cb(geojson);

    district.setSubdistrict(1);
}

// 生成包含外部轮廓和内部分界的geojson文件
function createDetailedGeojson(list, isCompressed, cb) {

    var geojson = new Geojson();
    var features = geojson.features;

    var data = list[0];

    var dList = data.districtList;
    var cityCode = data.citycode;

    var reqCount = 0;

    //// 考虑区县同名问题,分为两种情况: 获取市以及市下属区县; 其他
    if(cityCode.length) {
        for(var m = 0, mlength = dList.length; m < mlength; m++) {

            var keyword = dList[m].name;
            reqCount++;

            district.search(keyword, function(status, result){
                reqCount--;
                var subDistrictList = result.districtList;
                var feature = createDistFeatures(subDistrictList, citycode);

                if (feature) {
                    features.push(feature);
                }

                if (reqCount === 0) {
                    if (isCompressed) {
                        geojson = compress(geojson);
                    }
                    cb(geojson);

                    district.setSubdistrict(1);
                }
            });
        }

    } else {
        for(var m = 0, mlength = dList.length; m < mlength; m++) {

            var keyword = dList[m].name;
            reqCount++;

            district.search(keyword, function(status, result){
                reqCount--;
                var subDistrictList = result.districtList;
                var feature = createFeatures(subDistrictList);
                features.push(feature);

                if (reqCount === 0) {
                    geojson = compress(geojson);
                    cb(geojson);

                    district.setSubdistrict(1);
                }
            });
        }
    }
}


// 生成单一轮廓（包括国家，省，市）
function createFeature (district) {

    // 实例化feature，对于仅有轮廓的地图数据，features数组仅有的一项
    var feature = new Feature();

    var cp = [];
    var coordinatesSet = [];

    feature.id = district.adcode;
    feature.properties.name = district.name;
    feature.properties.childNum = district.boundaries.length;

    if(feature.properties.childNum > 1) {
        feature.geometry.type = "MultiPolygon";
    }

    cp[0] = district.center.lng;
    cp[1] = district.center.lat;
    feature.properties.cp = cp;
    cp = [];
    getCoo(district, coordinatesSet);
    feature.geometry.coordinates = coordinatesSet;
    return feature;

}

// 生成单一区县轮廓
function createDistFeature (districtList, citycode) {

    // 实例化feature，对于仅有轮廓的地图数据，features数组仅有的一项
    var feature = new Feature();

    var cp = [];
    var coordinatesSet = [];

    for (var t = 0, tlength =  districtList.length; t < tlength; t++) {

        var district = districtList[t];

        if(district.citycode == citycode) {
            feature.id = district.adcode;
            feature.properties.name = district.name;
            feature.properties.childNum = district.boundaries.length;

            if(feature.properties.childNum > 1) {
                feature.geometry.type = "MultiPolygon";
            }

            cp[0] = district.center.lng;
            cp[1] = district.center.lat;
            feature.properties.cp = cp;
            cp = [];
            getCoo(district, coordinatesSet);
            feature.geometry.coordinates = coordinatesSet;
            return feature;
        }

    }

}

// 生成某区域（国家，省）的内部子区域
function createFeatures (districtList) {

    var feature = new Feature();
    var cp = [];
    var coordinatesSet = [];

    for (var d = 0, dlength = districtList.length; d < dlength; d++) {
        var district = districtList[d];
        feature.id = district.adcode;
        feature.properties.name = district.name;
        feature.properties.childNum = district.boundaries.length;

        if(feature.properties.childNum > 1) {
            feature.geometry.type = "MultiPolygon";
        }

        cp[0] = district.center.lng;
        cp[1] = district.center.lat;
        feature.properties.cp = cp;
        cp = [];
        getCoo(district, coordinatesSet);
        feature.geometry.coordinates = coordinatesSet;
        coordinatesSet = [];
        return feature;
    }

}

// 生成城市的内部子区域，即内部区县
function createDistFeatures(districtList, citycode) {
    var feature = new Feature();
    var cp = [];
    var coordinatesSet = [];

    for (var d = 0, dlength = districtList.length; d < dlength; d++) {
        var district = districtList[d];
        if (district.citycode === citycode) {
            feature.id = district.adcode;
            feature.properties.name = district.name;
            feature.properties.childNum = district.boundaries.length;

            if(feature.properties.childNum > 1) {
                feature.geometry.type = "MultiPolygon";
            }

            cp[0] = district.center.lng;
            cp[1] = district.center.lat;
            feature.properties.cp = cp;
            cp = [];
            getCoo(district, coordinatesSet);
            feature.geometry.coordinates = coordinatesSet;
            coordinatesSet = [];

            return feature;
        }
    }

}

// 生成区域坐标点集
function getCoo (obj, coo) {
    var point = [];
    var cooItem = [];
    var cooSet = [];
    var plength = obj.boundaries.length;

    // feature为Polygon
    if (plength === 1) {
        var boundary = obj.boundaries[0];
        for (var b = 0; b < boundary.length; b++) {
            point[0] = boundary[b].lng;
            point[1] = boundary[b].lat;
            cooItem.push(point);
            point = [];
        }
        coo.push(cooItem);

    // feature为MultiPolygon
    } else {
        for (var p = 0; p < plength; p++) {
            var boundary = obj.boundaries[p];
            for (var b = 0; b < boundary.length; b++) {
                point[0] = boundary[b].lng;
                point[1] = boundary[b].lat;
                cooItem.push(point);
                point = [];
            }
            cooSet.push(cooItem);
            cooItem = [];
            coo.push(cooSet);
            cooSet = [];
        }
    }
}

// 不压缩，下载地图文件
function downloadGeoJson(geojson) {

    var str = JSON.stringify(geojson);
    var blob = new Blob([str], {
        type: 'text/plain;charset=utf8'
    });
    var fileName = [];
    fileName.push(fileStr);
    fileName.push('json');
    saveAs(blob, fileName.join('.'));

}

function compress(json) {

    json.UTF8Encoding = true;

    var features = json.features;
    if (!features) {
    return;
    }
    features.forEach(function (feature){
    var encodeOffsets = feature.geometry.encodeOffsets = [];
    var coordinates = feature.geometry.coordinates;
    if (feature.geometry.type === 'Polygon') {
        coordinates.forEach(function (coordinate, idx){
            coordinates[idx] = encodePolygon(
                coordinate, encodeOffsets[idx] = []
            );
        });
    } else if(feature.geometry.type === 'MultiPolygon') {
        coordinates.forEach(function (polygon, idx1){
            encodeOffsets[idx1] = [];
            polygon.forEach(function (coordinate, idx2) {
                coordinates[idx1][idx2] = encodePolygon(
                    coordinate, encodeOffsets[idx1][idx2] = []
                );
            });
        });
    }
    });

    return json;
}

function encodePolygon(coordinate, encodeOffsets) {

    var result = '';

    var prevX = quantize(coordinate[0][0]);
    var prevY = quantize(coordinate[0][1]);
    // Store the origin offset
    encodeOffsets[0] = prevX;
    encodeOffsets[1] = prevY;

    for (var i = 0; i < coordinate.length; i++) {
        var point = coordinate[i];
        result+=encode(point[0], prevX);
        result+=encode(point[1], prevY);

        prevX = quantize(point[0]);
        prevY = quantize(point[1]);
    }

    return result;
}

function quantize(val) {
    return Math.ceil(val * 1024);
}

function encode(val, prev){
    // Quantization
    val = quantize(val);
    // var tmp = val;
    // Delta
    val = val - prev;

    if (((val << 1) ^ (val >> 15)) + 64 === 8232) {
        //WTF, 8232 will get syntax error in js code
        val--;
    }
    // ZigZag
    val = (val << 1) ^ (val >> 15);
    // add offset and get unicode
    return String.fromCharCode(val+64);
    // var tmp = {'tmp' : str};
    // try{
    //     eval("(" + JSON.stringify(tmp) + ")");
    // }catch(e) {
    //     console.log(val + 64);
    // }
}