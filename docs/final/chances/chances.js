(function() {
	var chancesChart = dc.barChart("#chart-chances"),
	chancesChartWidth = 1000,
	chancesChartHeight = 600;
	var dataArray;

	loadData();

	function loadData() {
		d3.csv("chances/causes_of_death.csv", function(d) {
		  return {
		    cause : d.Cause,
		    deaths : d.Deaths
		  };
		}, function(data) {
		  dataArray = data;
		  render_plots();
		});
	}

	function render_plots(){ 
		var ndx = crossfilter(dataArray),
	      	chancesDim = ndx.dimension(function(d) {return d.cause;}),
	      	chancesGroup = chancesDim.group().reduceSum(function(d) {return d.deaths; });

	    chancesChart
	    	.width(chancesChartWidth).height(chancesChartHeight)
	    	.margins({top: 0, left: 70, right: 0, bottom: 100})
			.x(d3.scale.ordinal())
			.xUnits(dc.units.ordinal)
			.brushOn(false)
			.xAxisLabel('Causes of Death in the US')
			.yAxisLabel('Number of Deaths')
			.dimension(chancesDim)
			.barPadding(0.1)
			.outerPadding(1)
			.group(chancesGroup)
			.elasticY(true);

		chancesChart.render();
	}

}) ();