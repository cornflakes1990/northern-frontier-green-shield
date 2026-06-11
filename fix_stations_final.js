const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// 1. Remove all DOM-based station overlay code (the whole section)
html = html.replace(/\/\/ ============ 监测站点标记[\s\S]*?function updateStationPositions\(\)\s*\{[\s\S]*?\n        \}/, '');

// 2. Remove CSS keyframes
html = html.replace('@keyframes stationBlink { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.3)} }\n        ', '');

// 3. Remove initStationOverlay calls (handle both \n and \r\n)
html = html.replace(/\t+\t\t\t\tinitStationOverlay\(\);\r?\n/g, '');
html = html.replace(/\t+\t\t\tsetTimeout\(updateStationPositions,\s*\d+\);\r?\n/g, '');
html = html.replace(/updateStationPositions\(\);\r?\n/g, '');
html = html.replace(/updateStationPositions\(\);\s*/g, '');

// 4. Check if STATION_POS exists and where
if (html.includes('var STATION_POS')) {
    // Remove the old STATION_POS definition
    html = html.replace(/var STATION_POS = \[\[[\s\S]*?\];\n?/, '');
}

// 5. Add STATION_POS + scatter3D-based station rendering
// Inject STATION_POS and scatter3D data setup into renderMap3D
const fnStart = html.indexOf('function renderMap3D()');
const seriesStart = html.indexOf("series: [{", fnStart);

// Add station data generation right before the series definition
const stationInjection = `
            // 监测站点 3D 散点数据
            var stationScatterData = (function() {
                var pts = [];
                var coords = [[119.2,49.8],[119.7,50.1],[120.3,49.5],[121.5,50],[120.8,48.9],
                    [121.2,48.2],[122,48.8],[119.5,48.5],[120,47.8],[121.8,47.5],[119,47.2],[122.5,49.2],
                    [121.8,46.5],[122.5,46.8],[120.8,46.2],[121,45.8],[122.2,46],[120.5,45.5],[122,45.2],[121.5,46.8],
                    [122.2,44],[123,43.8],[121.5,43.5],[122.8,43.2],[121.2,43],[123.2,44.2],[122.5,44.5],
                    [118.8,43.5],[119.5,43.2],[118.2,42.8],[119,42.5],[117.8,42.2],[118.5,41.8],[119.8,42],[117.5,43],
                    [116.5,44.5],[117.2,44.8],[115.8,44],[116,43.5],[117.5,43.8],[115,43.2],[116.8,42.8],[114.5,43.5],[117,44.2],[115.5,44.5],
                    [113,42],[113.5,41.8],[112.8,41.5],[113.2,41.2],[112.5,40.8],[114,41.5],
                    [111.5,40.8],[111.8,40.6],[111.2,40.4],[111.7,40.2],[112,40.5],
                    [110,41.2],[110.5,41],[109.8,40.8],[110.2,40.6],[109.5,40.4],[110.8,41.4],
                    [109.5,39.8],[110,39.6],[108.8,39.5],[109.8,39.2],[108.5,39],[110.5,39.5],[109,40],
                    [108,41.2],[107.5,41],[107,40.8],[108.5,40.6],[107.2,41.5],[108.8,41],
                    [106.8,39.6],[106.7,39.5],[106.9,39.7],
                    [105,40],[104,39.5],[103.5,39],[105.5,38.5],[104.5,38],[103,38.5],[106,39],[103.8,40.5]];
                for (var i = 0; i < coords.length; i++) {
                    // 第三个值 = z轴高度（站点浮在地面上方）
                    pts.push({ value: [coords[i][0], coords[i][1], 12], name: '监测站 ' + (i+1) });
                }
                return pts;
            })();
`;

html = html.substring(0, seriesStart) + stationInjection + html.substring(seriesStart);

// 6. Add scatter3D series right before map3D series
html = html.replace(
    "series: [{\n                    type: \"map3D\",",
    "series: [{\n                    type: \"scatter3D\",\n                    data: stationScatterData,\n"
    + "                    symbol: 'circle',\n                    symbolSize: 6,\n"
    + "                    itemStyle: { color: '#00ff88', opacity: 0.9, shadowBlur: 10, shadowColor: 'rgba(0,255,136,0.5)' },\n"
    + "                    label: { show: false }\n"
    + "                },{\n                    type: \"map3D\","
);

fs.writeFileSync('index.html', html, 'utf-8');
console.log('Saved');

var s = html.lastIndexOf('<script>') + 8;
var e = html.lastIndexOf('</script>');
try { new Function(html.substring(s, e)); console.log('SYNTAX: OK'); }
catch(err) { console.log('SYNTAX ERROR:', err.message); }
console.log('scatter3D station:', html.includes('scatter3D'));
console.log('stationScatterData:', html.includes('stationScatterData'));
console.log('DOM overlay:', html.includes('initStationOverlay'));
