(function() {
  var attackChart = dc.pieChart("#chart-attack"),
      targetChart = dc.rowChart("#chart-target"),
      attackChartWidth = 530,
      attackChartHeight = 550,
      attackChartRadius = 175,
      attackChartInnerRadius = 70,
      targetChartWidth = 550,
      targetChartHeight = 500;
  var dataArray;
  
  loadData();

  function loadData() {
    d3.csv("attack-target/attack_target_combo_data.csv", function(d) {
      return {
        attack : d.attacktype1_txt,
        target : d.targtype1_txt,
        count: d.count
      };
    }, function(data) {
      dataArray = data;
      render_plots();
    });
  }
  
  function render_plots(){ 
    var ndx = crossfilter(dataArray),
        attackDim  = ndx.dimension(function(d) {return d.attack;}),
        attackGroup = attackDim.group().reduceSum(function(d) {return d.count; }),
        targetDim = ndx.dimension(function(d) {return d.target;}),
        targetGroup = targetDim.group().reduceSum(function(d) {return d.count; });
   
    // Attack chart
    // var colorScale = d3.scale.ordinal().range(['#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#c3c4d1','#878aa3', '#4b4f76', '#272a48']);
    var colorScale = d3.scale.ordinal().range(['#272a48','#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#c3c4d1','#878aa3', '#4b4f76']);

    attackChart
        .width(attackChartWidth).height(attackChartHeight)
        .radius(attackChartRadius)
        .dimension(attackDim)
        .group(attackGroup)
        .innerRadius(attackChartInnerRadius)
        .minAngleForLabel(0.5)
        .ordering(function(d) { return d.key; })
        .legend(dc.legend().horizontal(true).itemWidth(250).x(30))
        .colors(colorScale)
        .transitionDuration(800);

    attackChart.on('pretransition', function(chart) {
        chart.selectAll('.dc-legend-item text')
             .text('')
             .append('tspan')
             .text(function(d) { return d.name; })
             .append('tspan')
             .attr('x', 240)
             .attr('text-anchor', 'end')
             .text(function(d) { return d.data; })
    });

    // Target chart
    targetChart
      .width(targetChartWidth)
      .height(targetChartHeight)
      .x(d3.scale.linear().domain([0,33760]))
      .elasticX(true)
      .dimension(targetDim)
      .group(targetGroup)
      .ordering(function(d) {return d.key; });

    dc.renderAll();
  }
}) ();