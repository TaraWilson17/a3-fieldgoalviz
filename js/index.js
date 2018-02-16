$(function() {
    var dataset;
    var all = new RegExp("all");
    var svg;
    let currTeam = new RegExp("all");
    let currData;
    let currValues = [0, 30];


    document.querySelector("#zoom").addEventListener("click", function() {
        document.querySelector(".zoom").style.pointerEvents = "all";
    });

    document.querySelector("#tooltip").addEventListener("click", function() {
        document.querySelector(".zoom").style.pointerEvents = "none";
    });

    var margin = {top: 20, right: 20, bottom: 110, left: 40},
        margin2 = {top: 430, right: 20, bottom: 30, left: 40}
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
        height2 = 500 - margin2.top - margin2.bottom;

    // parse the data and time
    var parseTime = d3.timeParse("%M:%S");

    let x = d3.scaleTime().range([0, width]);
    let x2 = d3.scaleTime().range([0, width]);
    let y = d3.scaleLinear().range([height, 0]);
    let y2 = d3.scaleLinear().range([height2, 0]);
    
    let xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%M:%S"));
    let xAxis2 = d3.axisBottom(x2).tickFormat(d3.timeFormat("%M:%S"));
    let yAxis = d3.axisLeft(y);

    var yScale = d3.scaleLinear().range([0, height]);
    var xScale = d3.scaleTime().range([0, width]);

    //setup x
    var xValue = function (d) { return d.Time; }, // data -> value
        xMap = function (d) { return xScale(xValue(d)); }, // data -> display
        x2Map = function (d) { return xScale(xValue(d)); };

    // setup y
    var yValue = function (d) { return d.YardLineFixed; }, // data -> value
        yMap = function (d) { return yScale(yValue(d)); },
        y2Map = function (d) { return y2(yValue(d)); }; // data -> display

    xScale.domain([parseTime("00:00"), parseTime("59:59")]);
    yScale.domain([50, 0]);

    svg = d3.select("#plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);
    
    // Add label to the x-axis
    svg.append("text")             
        .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top + 10) + ")")
        .style("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text("Time of Game");
    
    // // Add label to the y-axis //MIGHT WANT THIS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
    // svg.append("text")
    //     .attr("transform", "rotate(-90)")
    //     .attr("y", 0 - margin.left)
    //     .attr("x", )
    //     .attr("dy", "1em")
    //     .attr("font-weight", "bold")
    //     .style("text-anchor", "middle")
    //     .text("Field Position");

    let brush = d3.brushX()
        .extent([[0,0], [width, height2]])
        .on("brush", brushed);
    
    let zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0,0], [width, height]])
        .extent([[0,0], [width, height]])
        .on("zoom", zoomed);

    // let area = d3.area()
    //     .curve(d3.curveMonotoneX)
    //     .x(function(d) {return x(d.Time); })
    //     .y0(height)
    //     .y1(function(d) { return y(d.YardLineFixed); });
    
    // let area2 = d3.area()
    //     .curve(d3.curveMonotoneX)
    //     .x(function(d) {return x2(d.Time); })
    //     .y0(height2)
    //     .y1(function(d) {return y2(d.YardLineFixed); });
    
    //////////////////////
    svg.append("defs").append("clipPath")
            .attr("id", "clip")
        .append("rect")
            .attr("width", width)
            .attr("height", height);
    
    let focus = svg.append("g")
        .attr("class", "focus")
        .attr("width", width - 800)
        .attr("transform", "translate(40,0)");

    focus.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text("Field Position"); 

    let context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(40,410)");

    d3.csv("data/FG.csv", function (error, data) {
        if (error) throw error;
        // change string (from CSV) into number format
        data.forEach(function (d) {
            d.Time = parseTime(d.Times);
            d.Team = d.OffenseTeam;
            d.Down = +d.Down;
            d.ToGo = +d.ToGo;
            d.Result = d.Result;
            d.YardLine = +d.YardLineFixed;
        });
        dataset = data;
        currData = data;
        drawVis(data);

        focus.append("path")
            .datum(data)
            .attr("class", "area")
            //.attr("d", area);
        
        focus.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + (height + 4) + ")")
            .call(xAxis);
        
        focus.append("g")
            .attr("class", "axis axis--y")
            .attr("transform", "translate(0,4)")
            .call(yAxis);
        
        context.append("path")
            .datum(data)
            .attr("class", "area")
            //.attr("d", area2)
        
        context.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(10,42)")
            .call(xAxis2);
        
        context.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, x.range());

        svg.append("rect")
            .attr("class", "zoom")
            .attr("width", (width - 100))
            .attr("height", height)
            .attr("transform", "translate(40,40)")
            .call(zoom);
    });

    // Add a title to the visual
    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 17)
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")  
        .style("font-size", "24px") 
        .text("NFL Field Goals in the 2017 Season");

    let maxYards = 30; //29 is the current maximum of yards to go in dataset

    $("#yards").slider({
        range:true,
        min:0,
        max:maxYards,
        values:[0, maxYards],
        slide: function(event, ui) {
            $("#yardsToGo").val(ui.values[0] + "-" + ui.values[1]); 
            currValues = ui.values;
            filterType(currTeam);
            filterYards(ui.values);
        }
    });

    $("#yardsToGo").val($("#yards").slider("values", 0) + "-" + $("#yards").slider("values", 1));

    drawLegend();

    function drawVis(data) {

        x.domain([parseTime("00:00"), parseTime("59:59")]);
        y.domain([0, 50]);
        x2.domain(x.domain());
        y2.domain(y.domain());

        //set up tooltip
        var div = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity, 0");
    
        //call tooltip
        let tooltip = d3.select(".tooltip");
    
        //draw dots
        let points = focus.selectAll(".point")
            .data(data)
        
        focus.append("g").attr("clip-path", "url(#clip)");
        
        points.exit().remove()

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
            .on("mouseover", function(d) {
                d3.select(this).attr("r", 8);
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9)
                tooltip.html(" Team: " + d.Team + "<br/> Down: " + d.Down + "<br/> Yard Line: " + d.YardLine)
                    .style("left", (d3.event.pageX + 5) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                d3.select(this).attr("r", 4);
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        
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

        let contextPts = context.selectAll(".point")
            .data(data)
        
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
            })
        
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
    
        document.querySelector("#selectform").onchange = function() {
            filterType(this.value);
            filterYards(currValues);
            currTeam = this.value;
        }
        
    }
    
    function filterType(type) {
        let match = all.test(type);
        if(match) {
            drawVis(dataset);
            currData = dataset;
        } else {
            let ndata = dataset.filter(function(d) {
                return d["Team"] == type;
            });
            drawVis(ndata);
            currData = ndata;
        }
    }

    function filterYards(values) {
        var dataInRange = currData.filter(function(d) {
            return d["ToGo"] >= values[0] && d["ToGo"] < values[1];
        });
        drawVis(dataInRange);
        currData = dataInRange;
    }

    function brushed() {
        if(d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;
        let selected = d3.event.selection || x2.range();
        x.domain(selected.map(x2.invert, x2));
        //focus.select(".area").attr("d", area);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (selected[1] - selected[0]))
            .translate(-selected[0], 0));
        focus.selectAll(".point")
            .attr("cx", function(d) {return x(d.Time); })
            .attr("cy", function(d) {return y(d.YardLineFixed); })
        focus.select(".axis--x").call(xAxis);
    }

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return;
        let transform = d3.event.transform;
        x.domain(transform.rescaleX(x2).domain());
        //focus.select(".area").attr("d", area);
        focus.select(".axis--x").call(xAxis);
        context.select(".brush").call(brush.move, x.range().map(transform.invertX, transform));
        context.select(".brush").call(brush);
        focus.selectAll(".point")
            .attr("cx", function(d) {return x(d.Time); })
            .attr("cy", function(d) {return y(d.YardLineFixed); })
    }

    function drawLegend() {
        let legend = d3.select("#legend").append("svg");
        
        legend.append("circle")
            .attr("class", "point")
            .attr("r", 6)
            .attr("cx", 30)
            .attr("cy", 25)
            .style("fill", "green");
        
        legend.append("text")
            .attr("x", 40)
            .attr("y", 31)
            .attr("font-size", "20px")
            .text("Made Field Goal")
           
        legend.append("circle")
            .attr("class", "point")
            .attr("r", 6)
            .attr("cx", 30)
            .attr("cy", 55)
            .style("fill", "red");
        
        legend.append("text")
            .attr("x", 40)
            .attr("y", 61)
            .attr("font-size", "20px")
            .text("Missed Field Goal")
    }

})
