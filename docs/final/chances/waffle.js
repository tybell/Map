/**
 * TODO:
 *     ticker animation
 *     Window.resize function that redraws on resize 
 */

var spinnerContainerWidth = $('.race-category').width();
var spinnerMargin = {top: 40, right: 10, bottom:20, left: 10 }

// Control Variables for the rotation animation
var spinnerRandomDelay;
var spinnerRandomDuration;
var spinnerMinTime = 4000;    // minimum amount of time you want the animation to spin for 
var spinnerNumRotation = 10;  // rotations you want each spinner to complete 
var spinnerDurationStep = 50; // steps are in ms 

// Other initializing variables
var numAnimateCycle = {}
var offsetAngle = {};
var animationDuration = {};
var animationDelay = {};
var raceTotals = {'democrat': 0, 'republican': 0, 'other': 0}

var spinnerWidth = 125, // or 100 for testing
    spinnerHeight = 75, // height is actually what determines the size of our spinner (since it is always smaller than width)
    spinnerRadius = Math.min(spinnerWidth, spinnerHeight) / 2;

var spinnerColor = d3.scale.ordinal()
    .domain([0, 1])
    .range(["#c8c8c8", "#c40f3a"]);

var spinnerArc = d3.svg.arc()
    .outerRadius(spinnerRadius - 10)  // changes the big radius of each of our pie arcs
    .innerRadius(spinnerRadius - 24); // changes the smaller radius of the inner of our pie

var spinnerPie = d3.layout.pie()
    .value(function(d){ return d.probability })
    .sort(null);

d3.json('chances/data.json', function(error, data) {
    if(error) throw error;

    var g; 
    var svg;
    var staticSvgNeedle;

    // iterate over each state, and make a div + svg for each
    // Adds the state's short-form name and builds a spinner for each state
    for (var i = 0 ; i < data.states.length; i ++) {
        var currentState = data.states[i]
        var abbreviation = currentState.abbreviation.replace(/\s+/g, '');
        abbreviation = abbreviation.replace(/[()]/g, '');
        var text = currentState.state;
        var rank = currentState.rank;
        var prob = currentState.chances;
 
        if (i < (data.states.length / 2)) {
            var first = d3.select('#first-column')
                .append('div').attr('class', 'spinner-container')
                .append('div').attr('class', 'small-spinner')
                .attr('id', abbreviation)
                .datum(data.states[i])
                .append('span')
                .datum(data.states[i]);
            first.append('span')
                    .text(rank + ". " + text)
                    .attr('class', 'spinner-state-name');
            first.append('span')
                    .html('1 in <span class="probability">' + prob + '</span> people')
                    .attr('class', 'spinner-person-probability');
        } else {
            var second = d3.select('#second-column')
                .append('div').attr('class', 'spinner-container')
                .append('div').attr('class', 'small-spinner')
                .attr('id', abbreviation)
                .datum(data.states[i])
                .append('span')
                .datum(data.states[i]);
            second.append('span')
                    .text(rank + ". " + text)
                    .attr('class', 'spinner-state-name');
            second.append('span')
                    .html('1 in <span class="probability">' + prob + '</span> people')
                    .attr('class', 'spinner-person-probability');
        }
        $('.spinner-person-probability').hide();
        /*d3.select('#' + abbreviation)
            .append('div').attr('class', 'name')
            .datum(data.states[i])
            .append('span')
                .text(text)
                .attr('class', 'spinner-state-name');*/

        // initialize the animation cycle number
        numAnimateCycle[abbreviation] = 0;

        // appends a new div to fill in with color that represents the race result
        d3.select('#' + abbreviation)
            .append('div')
            .attr('class', 'race-result')

        // appends a new svg for each state
        svg = d3.select('#' + abbreviation)
            // .append('div').attr('class', 'spinner-container')
            .append('svg')
            .attr('class', 'spinner-svg spinner-svg-body')
            .attr('width', spinnerWidth)
            .attr('height', spinnerHeight);

        // draws the pie with each states values 
        g = svg.selectAll(".arc").data(spinnerPie(data.states[i].value))
            .enter().append('g')
            .attr('class', 'arc')
            .attr('data-key', abbreviation)
            .attr("transform", "translate(" + (spinnerWidth / 2 + 30)  + "," + (spinnerHeight / 2 - 10) + ")");
        
        // polyfill for each arc color    
        g.append("path")
            .attr("d", spinnerArc)
            .style("fill", function(d, i) { return spinnerColor(i); });

        svgStaticNeedle = svg
            .append('polygon')
            .attr('points', '0,3 0,-3 20,0')
            .attr('style', 'fill:gray;stroke:gray;stroke-width:0.5')
            .attr('class', 'svg-static-needle')
            .attr('width', spinnerWidth)
            .attr('height', spinnerHeight)
            .attr('transform', "translate(" + (spinnerWidth / 2 - 15)  + "," + (spinnerHeight / 2 - 10) + ")");

        // draws the 10 marks that divide the circle
        drawGuides(abbreviation);

    }
});

// Choose each party's affiliation / win on button click, then start all the animations
// on animation end, update the winners and final count for each party 
$('.spin-button').click(function(e) {

    // Resets state to original state
    raceTotals.democrat = 0;
    raceTotals.republican = 0;
    raceTotals.other = 0;
    $('.spinner-person-probability').show();
    $('.spin-button').text('SPINNING...');
    for (var key in numAnimateCycle) {
        numAnimateCycle[key] = 0
    }

    $('.small-spinner').each(function() {
        // reset our chosen race-result back to transparent + otherwise
        $(this).find('.race-result').css({
            "background-color": 'transparent',
            "border": "#5c5c5c 1px solid"
        });

        // choose some random number between 1-100 inclusive, calculate end point of spinner
        var rand = Math.floor(Math.random() * 100) + 1;
        var chosen;
        var fillColor; 
        d3.select(this)
            .attr('data-race-result', function(d){ 
                var temp = calculateOffsetAngle(d, rand, this.getAttribute('id'));
                chosen = temp.party;
                return temp.party; 
            });
        //console.log(this.getAttribute('id') + ": " + chosen);
        raceTotals[chosen]++;
    }) 

    // start our spinning animation
    d3.selectAll('.arc')
        .transition()
        .duration(calculateDuration) // randomly calculates a duration for each spinner
        .delay(calculateDelay) // randomly calculates a delay for each spinner
        .ease(d3.easeCubicInOut) // maybe change to ease in / out? a bit awkward
        .attrTween('transform', angleTween) // this also handles our x/y translations of the charts
        .each(function() {
            fillCircle(this)
            $('.spin-button').text('SPIN AGAIN');
        });

});

/**
 * draws the 10 even marks for the pie to divide the spinner
 * also draws the center circle in the spinner 
 * @param  string   $id   the state abbreviation that is targeted to draw the guide for
 */
function drawGuides($id) {

    // appends a new svg group that we will use to spin + animate the guides
    var s = d3.select('#' + $id)
        .append('svg')
        .attr('class', 'spinner-svg spinner-svg-guides')
        .attr('width', spinnerWidth)
        .attr('height', spinnerHeight);

    // draws group associated with the center path
    var group = s.append('g')
        .attr('class', 'arc guide')
        .attr('data-key', $id)
        .attr("transform", "translate(" + (spinnerWidth / 2 + 30)  + "," + (spinnerHeight / 2 - 10) + ")");

    // appends the corresponding path to creating the internal spinner
    //  data/credit for the path comes from http://www.nytimes.com/newsgraphics/2014/senate-model/
    group.append('path')
        .attr('d', 'M0,-20L0,-12M11.756,-16.18L7.053,-9.708M19.021,-6.18L11.413,-3.708M19.021,6.18L11.413,3.708M11.756,16.18L7.053,9.708M0,20L0,12M-11.756,16.18L-7.053,9.708M-19.021,6.18L-11.413,3.708M-19.021,-6.18L-11.413,-3.708M-11.756,-16.18L-7.053,-9.708')
        .attr('stroke', 'white')
        .style('fill', 'transparent')
        .attr('transform', 'scale(1.0)')

    // appends the circle that is at the center of the spinner (exists only for aesthetics)
    s.append('g')
        .attr('class', 'center spinner-center')
        .append('circle')
            .attr('r', 3)
            .attr('cx', (spinnerWidth / 2 + 30))
            .attr('cy', (spinnerHeight / 2 - 9.5))
            .attr('fill', '#ddd')
}

/**
 * Iterates for each .race-result div and fills the colors in dependent on the race results
 * Called when the rotation for each arc ends
 */
function fillCircle($el) {
    var $chosen = '#' + $el.getAttribute('data-key');

    switch ($($chosen).attr('data-race-result')) {
        case "democrat":
            fillColor = '#c8c8c8';
            break;
        case "republican":
            fillColor = "#c40f3a";
            break;
        case "other":
            fillColor = "#578857";
            break;
    }
    $($chosen).find('.race-result').css({
        "background-color": fillColor,
        "border": fillColor
    })

    // updates the race totals for each of the parties
    $('.race-total').each(function() {
        switch ($(this).hasClass('race-total--dem')) {
            case true:
                $(this).find('.race-total-value').text(raceTotals['democrat'])                
                break;
            case false:
                $(this).find('.race-total-value').text(raceTotals['republican'])      
                break;    
        }
    });
}

/**
 * Calculates the randomized delay of animation for each spinner
 * Value will generally be between 25 - 125 ms
 * @param  int  d  data of specific arc, though we are NOT using this value
 * @param  int  i  index of the arc that we are currently iterating over
 * @return int     time in ms of how long the delay should last
 */
function calculateDelay(d, i) {
    // if the index % 13 = 0, we know that we're iterating on the next arcs of the next spinner
    // therefore we want to set the delay to a new random number
    if(i % 4 === 0)  // mod by 4 since we have our 3 sections of the pie and our 1 arc for the guides
        spinnerRandomDelay = (Math.floor(Math.random() * 10) + 1) * 45; 
    animationDelay[this.getAttribute('data-key')] = spinnerRandomDelay;
    return spinnerRandomDelay;
}

/**
 * Calculates the randomized time of spinning for each spinner
 * Value will generally be between 3500 - 5000ms 
 * @param  int  d  data of specific arc, though we are NOT using this value
 * @param  int  i  index of the arc that we are currently iterating over
 * @return int     time in ms of how long the spinning animation should last
 */
function calculateDuration(d, i) {
    if(i % 4 === 0)
        spinnerRandomDuration = (Math.floor(Math.random() * 15) + 1) * spinnerDurationStep + spinnerMinTime // we want this to be between 3500-5000
    animationDuration[this.getAttribute('data-key')] = spinnerRandomDuration;
    return spinnerRandomDuration;
}

/**
 * Computes the keyframes between two points
 *     Makes sure that the ending rotational position of the spinner is accurate to the ticker
 * @param  int  d   data value of the arc that we are iterating on 
 * @param  int  i   index of the arc that is currently iterating over
 * @return tweenFunction that interpolates angles between the start/end point
 */
function angleTween(d, i) {
    // to calculate the end rotation of the spinner: 
    //  take the data of the section that was chosen (democrat: 40)
    //  270 - (data * 1.8) - (other data * 3.6)
    //  muiltiply the data by 3.6, add the starting point, add 270 and subtract half of the distance
    var angle = 360 * spinnerNumRotation + offsetAngle[this.getAttribute('data-key')];
    var i = d3.interpolate(0, angle);
    return function(t) {
        return "translate(" + (spinnerWidth / 2 + 30) + "," + (spinnerHeight / 2 - 10)+ ")rotate(" + i(t) + ")";
    };
}

/**
 * Given a random integer, calculates the offset angle to rotate the spinner by
 *     in order for the chosen arc of the pie to be centered on the leftmost side
 * @param  object   d       representative of the entire state object 
 * @param  int      rand    a random integer between 1 and 100
 * @param  str      $id     the id representative of the spinner
 * @return {"party" : string, "angle" : int}      party, the political party; angle, the offset angle
 */
function calculateOffsetAngle(d, rand, $id) {
    var a;
    var party;

      // if democrat
    if (rand <= d.value[0].probability) {
        a = 270 - (d.value[0].probability * 1.8); // we want our slice to be centered at the 270 degree mark, so 270 - (percentage of pie * 360)
        party = "democrat"
    } // if republican
    else if (rand <= d.value[0].probability + d.value[1].probability) {
        a = 270 - (d.value[1].probability * 1.8) - (d.value[0].probability * 3.6)
        party = "republican"
    } // otherwise, if other
    else if(rand <= d.value[0].probability + d.value[1].probability + d.value[0].probability + d.value[2].probability) {
        a = 270 - (d.value[2].probability * 1.8) - (d.value[0].probability * 3.6 + d.value[1].probability * 3.6)
        party = "other"
    } 

    offsetAngle[$id] = a; //set the id of this into the offsetAngle array. We will use this later in angleTween
    return {"party": party, "angle": a};
}

// Coerces numeric types
function type(d) {
    for (var i = 0; i < d.states.length; i++) {
        for(var j = 0; j < d.states[i].value.length; j++) {
            d.states[i].value[j].probability = +d.states[i].value[j].probability;
        }   
    }
    return d;
}