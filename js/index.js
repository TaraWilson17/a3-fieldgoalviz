$(function() {
    let dataset; // to keep variable representing entire, non-filtered dataset
    let all = new RegExp("all"); // to track marker for all teams
    let currTeam = new RegExp("all"); // to keep track of selected team
    let currData; // to keep track of current filtered data
    let currValues = [0, 30]; // to keep track of current selected yards

    // To allow user to toggle between zooming with mouse events and viewing tooltips
    document.querySelector("#zoom").addEventListener("click", function() {
        document.querySelector(".zoom").style.pointerEvents = "all";
    });
    document.querySelector("#tooltip").addEventListener("click", function() {
        document.querySelector(".zoom").style.pointerEvents = "none";
    });

    // sets margins and general layout variables
    let margin = {top: 20, right: 20, bottom: 110, left: 40},
        margin2 = {top: 430, right: 20, bottom: 30, left: 40}
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
        height2 = 500 - margin2.top - margin2.bottom;

    // data is in minutes and seconds only, function to parse time strings
    let parseTime = d3.timeParse("%M:%S");

    // sets x and y ranges
    let x = d3.scaleTime().range([0, width]);
    let x2 = d3.scaleTime().range([0, width]);
    let y = d3.scaleLinear().range([height, 0]);
    let y2 = d3.scaleLinear().range([height2, 0]);
    
    // sets x and y axis
    let xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%M:%S"));
    let xAxis2 = d3.axisBottom(x2).tickFormat(d3.timeFormat("%M:%S"));
    let yAxis = d3.axisLeft(y);

    // sets scales for both axes
    let yScale = d3.scaleLinear().range([0, height]);
    let xScale = d3.scaleTime().range([0, width]);

    // sets up x values
    let xValue = function (d) { return d.Time; }, // maps data -> value
        xMap = function (d) { return xScale(xValue(d)); }, // maps value -> display
        x2Map = function (d) { return xScale(xValue(d)); };

    // sets up y values
    let yValue = function (d) { return d.YardLineFixed; }, // maps data -> value
        yMap = function (d) { return yScale(yValue(d)); }, // maps value  -> display
        y2Map = function (d) { return y2(yValue(d)); }; 

    // sets x and y domains
    xScale.domain([parseTime("00:00"), parseTime("59:59")]);
    yScale.domain([50, 0]); // 0-50 yard range, reversed for clarity

    // selects plot area from HTML and adds svg element for creating visuals
    let svg = d3.select("#plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    
    // Add label to the x-axis
    svg.append("text")             
        .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top + 10) + ")")
        .style("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text("Time of Game");

    // defines brush events to allow user to move mouse and adjust view range
    let brush = d3.brushX()
        .extent([[0,0], [width, height2]])
        .on("brush", brushed);
    
    // defines zoom events to allow user to move brushed range and adjust view range    
    let zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0,0], [width, height]])
        .extent([[0,0], [width, height]])
        .on("zoom", zoomed);

    // appends clip path to display moving viewport
    svg.append("defs").append("clipPath")
            .attr("id", "clip")
        .append("rect")
            .attr("width", width)
            .attr("height", height);
    
    // creates focus area for main visual
    let focus = svg.append("g")
        .attr("class", "focus")
        .attr("width", width - 800)
        .attr("transform", "translate(40,0)");

    // adds y axis label to focus area
    focus.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text("Field Position"); 

    // creates context area to show big picture of current focus view
    let context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(40,410)");

    // imports data from csv format
    d3.csv("data/FG.csv", function (error, data) {
        if (error) throw error;
        data.forEach(function (d) {
            d.Time = parseTime(d.Times); // reads in as minutes and seconds
            d.Team = d.OffenseTeam; 
            d.Down = +d.Down; // reads in as numerical data
            d.ToGo = +d.ToGo; // reads in as numerical data
            d.Result = d.Result;
            d.YardLine = +d.YardLineFixed; // reads in as numerical data
        });
        dataset = data; // sets dataset variable to entire data
        currData = data; // sets current data to entire data since just read in
        drawVis(data);
        
        // adds x axis with scale to focus area
        focus.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + (height + 4) + ")")
            .call(xAxis);
        
        // adds y axis with scale to focus area
        focus.append("g")
            .attr("class", "axis axis--y")
            .attr("transform", "translate(0,4)")
            .call(yAxis);
        
        // adds x axis with scale to context area
        context.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(10,42)")
            .call(xAxis2);
        
        // adds brush listener to context
        context.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, x.range());

        // adds zoom listener to focus area to allow mouse scrolling
        svg.append("rect")
            .attr("class", "zoom")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(40,0)")
            .call(zoom);
    });

    // Adds title to the visual
    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 17)
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")  
        .style("font-size", "24px") 
        .text("NFL Field Goals in the 2017 Season");

    let maxYards = 30; //29 is the current maximum of yards to go in dataset

    // establishes slider to reflect current marked range
    $("#yards").slider({
        range:true,
        min:0,
        max:maxYards,
        values:[0, maxYards],
        slide: function(event, ui) {
            $("#yardsToGo").val(ui.values[0] + "-" + ui.values[1]); 
            currValues = ui.values; // adjusts current values variable to reflect selection
            filterType(currTeam);
            filterYards(ui.values);
        }
    });

    // displays the current range of yards to go selection on the page
    $("#yardsToGo").val($("#yards").slider("values", 0) + "-" + $("#yards").slider("values", 1));

    drawLegend();

    // draws the visual
    function drawVis(data) {
        // sets the domains for x and y data
        x.domain([parseTime("00:00"), parseTime("59:59")]);
        y.domain([0, 50]);
        x2.domain(x.domain());
        y2.domain(y.domain());

        // sets up tooltip
        let div = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity, 0");

        // sets tooltip reference
        let tooltip = d3.select(".tooltip");
    
        // joins data selection with existing data
        let points = focus.selectAll(".point")
            .data(data)
        
        // appends clipping path for re-scaling
        focus.append("g").attr("clip-path", "url(#clip)");
        
        // removes points if more on page than exist in dataset
        points.exit().remove()

        // adds points with given attributes to page
        points.enter().append("circle")
            .attr("class", "point")
            .attr("r", 4)
            .attr("cx", xMap)
            .attr("cy", yMap)
            .style("fill", function(d) {
                if(d.Result === "Missed") {
                    return "red";
                } else {
                    return "green";
                }
            })
            // sets up tooltips on mouse events
            .on("mouseover", function(d) {
                d3.select(this).attr("r", 8);
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9)
                tooltip.html(" Team: " + d.Team + "<br/> Down: " + d.Down + "<br/> Yard Line: " + d.YardLine)
                    .style("left", (d3.event.pageX + 5) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            // removes tooltips on mouseout events
            .on("mouseout", function(d) {
                d3.select(this).attr("r", 4);
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        
        // updates existing points to be in correct placement with correct coloring
        points
            .attr("cx", xMap)
            .attr("cy", yMap)
            .style("fill", function(d) {
                if(d.Result === "Missed") {
                    return "red";
                } else {
                    return "green";
                }
            })

        // repeats all above steps for context map as well
        let contextPts = context.selectAll(".point")
            .data(data);
        context.append("g").attr("clip-path", "url(#clip)");
        contextPts.exit().remove()
        contextPts.enter().append("circle")
            .attr("class", "point")
            .attr("r", 1)
            .attr("cx", x2Map)
            .attr("cy", y2Map)
            .style("fill", function(d) {
                if(d.Result === "Missed") {
                    return "red";
                } else {
                    return "green";
                }
            });
        contextPts
            .attr("cx", x2Map)
            .attr("cy", y2Map)
            .style("fill", function(d) {
                if(d.Result === "Missed") {
                    return "red";
                } else {
                    return "green";
                }
            })    
    
        // sets listener for team filter and calls update data functions to reflect this
        document.querySelector("#selectform").onchange = function() {
            filterType(this.value);
            filterYards(currValues);
            currTeam = this.value; // resets current team variable to reflect selected team
        }
    }
    
    // filters data based on team selection
    function filterType(type) {
        // resets context selection to show entire game width
        d3.selectAll(".selection").attr("width", 900);
        d3.selectAll(".selection").attr("x", 1);

        let match = all.test(type); // compares selection to all via regular expression
        if(match) { // if all teams selected
            drawVis(dataset); // draws points for entire dataset
            currData = dataset;
        } else {
            let ndata = dataset.filter(function(d) { // filters data for selected team
                return d["Team"] == type;
            });
            drawVis(ndata); // draws points for filtered dataset
            currData = ndata;
        }
    }

    // filter data based on yards to go selection
    function filterYards(values) {
        let dataInRange = currData.filter(function(d) { // filters data for points in selected range
            return d["ToGo"] >= values[0] && d["ToGo"] < values[1];
        });
        drawVis(dataInRange); // draws points for selected range
        currData = dataInRange;
    }

    // handles brushing events to update viewport
    function brushed() {
        if(d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;
        let selected = d3.event.selection || x2.range(); // captures selection
        x.domain(selected.map(x2.invert, x2)); // adjusts domain to reflect selection
        // updates zoom area
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (selected[1] - selected[0]))
            .translate(-selected[0], 0));
        // redraws points in correct spot for given domain
        focus.selectAll(".point")
            .attr("cx", function(d) {return x(d.Time); })
            .attr("cy", function(d) {return y(d.YardLineFixed); })
        // updates x axis to reflect brush event
        focus.select(".axis--x").call(xAxis);
    }

    // handles zoom events to update viewport
    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;
        let transform = d3.event.transform; // captures transformation
        x.domain(transform.rescaleX(x2).domain()); // adjusts domain to reflect selection
        focus.select(".axis--x").call(xAxis); // updates x axis to reflect zoom event
        context.select(".brush").call(brush.move, x.range().map(transform.invertX, transform));
        context.select(".brush").call(brush); // brushes to correspond with zoom change
        // redraws points in correct spot for given domain
        focus.selectAll(".point")
            .attr("cx", function(d) {return x(d.Time); })
            .attr("cy", function(d) {return y(d.YardLineFixed); })
    }

    // adds legend to page
    function drawLegend() {
        let legend = d3.select("#legend").append("svg");
        legend.append("circle") // example of green point
            .attr("class", "point")
            .attr("r", 6)
            .attr("cx", 30)
            .attr("cy", 25)
            .style("fill", "green");
        legend.append("text") // labels green point as made field goal attempt
            .attr("x", 40)
            .attr("y", 31)
            .attr("font-size", "20px")
            .text("Made Field Goal")
        legend.append("circle") // example of red point
            .attr("class", "point")
            .attr("r", 6)
            .attr("cx", 30)
            .attr("cy", 55)
            .style("fill", "red");
        legend.append("text") // lables red point as missed field goal attempt
            .attr("x", 40)
            .attr("y", 61)
            .attr("font-size", "20px")
            .text("Missed Field Goal")
    }

})
