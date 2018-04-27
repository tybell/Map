(function() {
    // Constant values
    var height = 800, width = 800;

    // D3 objects for map
    var svgMap = d3.select("#map")
        .append("svg")
        .attr("height", height)
        .attr("width", width)
        .append("g");
    var gMap = svgMap.append("g");

    // Map rendering properties
    var nyc_center = [-74,40.7];
    var mapRatio = 1;
    var mapRatioAdjuster = 100;
    var projection = d3.geo.mercator()
        .center(nyc_center)
        .translate([width / 2, height / 2])
        .scale(width * [mapRatio + mapRatioAdjuster])
    var path = d3.geoPath().projection(projection);

    // Fetch map data
    var boroughs;
    d3.queue()
        .defer(d3.json, "map/boroughs.json")
        .await(ready);

    // Draw map
    function ready (error, data) {
        boroughs = topojson.feature(data, data.objects.nyc_boroughs).features
        gMap.selectAll(".borough")
            .data(boroughs)
            .enter().append("path")
            .attr("class", "borough")
            .attr("d", path)
            .on('mouseover', function(d) {
                d3.select(this).classed("selected", true)
            })
            .on('mouseout', function(d) {
                d3.select(this).classed("selected", false)
            })
    }
}) ();