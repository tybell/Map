(function() {
	var currYear = 1970;

	var sizeMin;
	var sizeMax;
	var rangeMin = 2;
	var rangeMax = 50;

	var height = 500,
		width = 770;

	var colorRangeStart = "#315f8e",
		colorRangeEnd = "#b00c38";

	var svg = d3.select("#map")
				.append("svg")
				.attr("height", height)
				.attr("width", width)
				.append("g");

	var g = svg.append("g");

	d3.queue()
		.defer(d3.json, "world-countries.json")
		.await(ready)

	// *********CARSON STUFF --- selecting data by year
	// load data and convert to array
	// store data for reference elsewhere
	var dataArray;
	var globalData;
	var selectedYearDataArray;
	var countries;

	
	function loadGlobalData() {
		d3.csv("global_data.csv", function(rows) {
			globalData = rows;
			updatePanelWorld();
			dataArrayLoaded();
		});
	}

	function loadAttackData() {
		d3.csv("data.csv", function(rows) {
			dataArray = rows;
			// this method will not be called until the above data is fully loaded
			loadGlobalData();
		});
	}

	function dataArrayLoaded() {
		// Num killed
		var numKilled = [];
		for (var i = 0; i < dataArray.length; i++) {
			numKilled.push(dataArray[i].num_killed);
		}

		sizeMin = Math.min.apply(Math, numKilled);
		sizeMax = Math.max.apply(Math, numKilled);

		var radius = d3.scaleSqrt()
			.domain([sizeMin, sizeMax])
			.range([rangeMin, rangeMax]);

		// Num attacks
		var numAttacks = [];
		for (var i = 0; i < dataArray.length; i++) {
			numAttacks.push(dataArray[i].num_attacks);
		}
		var colorMin = Math.min.apply(Math, numAttacks);
		var colorMax = Math.max.apply(Math, numAttacks);

		var color = d3.scaleSqrt()
			.domain([colorMin, colorMax])
			.range([d3.rgb(colorRangeStart), d3.rgb(colorRangeEnd)]);

		// Make slider
		makeSlider(dataArray, radius, color);

		// Make legend
		makeLegend();
	}

	// for creating an array of years 1970-2015
	function range(start, count) {
    	return Array.apply(0, Array(count + 1))
      		.map(function (element, index) { 
        		return index + start;  
    	});
    }
	// *********END CARSON STUFF

	var projection = d3.geoMercator()
		.translate([width/2, height/2+50])
		.scale(148)

	var path = d3.geoPath().projection(projection)

	function ready (error, data) {
		loadAttackData();
		countries = topojson.feature(data, data.objects.countries1).features
		drawCountries(data);
	}

	function drawCountries (data) {
		g.selectAll(".country")
			.data(countries)
			.enter().append("path")
			.attr("class", "country")
			.attr("d", path)
			.on('mouseover', function(d) {
				d3.select(this).classed("selected", true)
				dataArray.forEach(function(entry) {
					if (entry.alpha_3_code == d.id && entry.iyear == currYear) {
						updatePanel(entry);
					}
				});

			})
			.on('mouseout', function(d) {
				d3.select(this).classed("selected", false)
				updatePanelWorld();
			})
	}

	function drawBubbles(attackData, radius, color) {
		// make bubbles on map
		var bubbles = g.selectAll(".bubbles")
			.data(attackData)
			.enter().append("circle")
			.attr("r", function (d) {
				return radius(d.num_killed);
			})
			.attr("cx", function (d) {
				var coords = projection([d.longitude, d.latitude])
				return coords[0];
			})
			.attr("cy", function (d) {
				var coords = projection([d.longitude, d.latitude])
				return coords[1];
			})
			.style("fill", function (d) {
				return color(d.num_attacks);
			})
			.style("opacity", 0.8)
			// fade in on mouseover
			.on("mouseover", function(d) {

           		updatePanel(d);

				this.parentNode.appendChild(this);

				d3.select(this).transition()
					.duration(200)
					.style("opacity", 1)
					.style("stroke", "#000")
			})
			// fade out tooltip on mouse out               
		    .on("mouseout", function(d) {       
		        d3.select(this).transition()
		           .duration(500)
		           .style("opacity", 0.8)
		           .style("stroke", "none");

		        updatePanelWorld();

		    });

		    customZoom(bubbles, radius);
	}

	function updatePanel(d) {
		d3.select("#panelInfo")
			.html("<span id=\"countryTitle\">" + currYear + " | " + d.country_txt + "</span>"
				+ "<br/> Number killed: " + d.num_killed
				+ "<br/> Number of attacks: " + d.num_attacks);
	}

	function updatePanelWorld() {
		var d;
		globalData.forEach(function(entry) {
			if (entry.iyear == currYear) {
				d = entry;
			}
		});

		d3.select("#panelInfo")
			.html("<span id=\"countryTitle\">" + currYear + " | World</span>"
				+ "<br/> Number killed: " + d.num_killed
				+ "<br/> Number of attacks: " + d.num_attacks);
	}


	function makeSlider(dataArray, radius, color) {
		var margin = {right: 15, left: 15},
			containerWidth = 840,
			containerHeight = 40;
		    sliderWidth = containerWidth - margin.left - margin.right,
		    sliderHeight = containerHeight
		    startYear = 1970,
		    endYear = 2015;

		var svgSlider = d3.select("#slider")
						  .append("svg")
						  .attr("height", containerHeight)
						  .attr("width", containerWidth);

		var x = d3.scaleLinear()
		    .domain([startYear, endYear])
		    .range([0, sliderWidth])
		    .clamp(true);

		var slider = svgSlider.append("g")
		    .attr("class", "slider")
		    .attr("transform", "translate(" + margin.left + "," + sliderHeight / 2 + ")");

		// Slider body
		slider.append("line")
		    .attr("class", "track")
		    .attr("x1", x.range()[0])
		    .attr("x2", x.range()[1])
		  	.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		    .attr("class", "track-inset")
		  	.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		    .attr("class", "track-overlay")
		    .call(d3.drag()
		        .on("start.interrupt", function() { slider.interrupt(); })
		        .on("start drag", function() { handleDrag(x.invert(d3.event.x)); }));

		// Ticks
		slider.insert("g", ".track-overlay")
		    .attr("class", "ticks")
		    .attr("transform", "translate(0," + 18 + ")")
		  	.selectAll("text")
		  	.data(x.ticks(10))
		  	.enter().append("text")
		    .attr("x", x)
		    .attr("text-anchor", "middle")
		    .text(function(d) { return d; });

		// Handle
		var handle = slider.insert("circle", ".track-overlay")
		    .attr("class", "handle")
		    .attr("r", 9);

		slider.transition()
		    .duration(750);

		// Must be nested function because of d3.drag().on("start drag", ...) code,
		// drag function has to be defined after slider's handle is created, 
		// but handle has to be created last to be drawn on top of slider
		function handleDrag(eventX) {
			handle.attr("cx", x(eventX));

			// gather data only for the selected year			
			var selectedYear = Math.round(eventX);

			selectedYearDataArray = [];
			currYear = selectedYear;

			dataArray.forEach(function(entry) {
				if (entry.iyear == selectedYear) {
					selectedYearDataArray.push(entry);
				}
			});

			// clear old circles and draw new
			var circles = svg.selectAll("circle");
			circles.remove();
			drawBubbles(selectedYearDataArray, radius, color);
			updatePanelWorld();
		}

		// Manually call to instantiate map upon load
		handleDrag(x.invert(0));
	}


}) ();