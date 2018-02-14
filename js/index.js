$(function() {
    var dataset;
    var all = new RegExp("all");
    var svg;

    var margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    
    var yScale = d3.scaleLinear().range([0, height]);
    var xScale = d3.scaleTime().range([0, width]);

    //setup x
    var xValue = function (d) { return d.Time; }, // data -> value
        xMap = function (d) { return xScale(xValue(d)); }; // data -> display

    // setup y
    var yValue = function (d) { return d.YardLineFixed; }, // data -> value
        yMap = function (d) { return yScale(yValue(d)); }; // data -> display

    // add the graph canvas to the body of the webpage
    svg = d3.select("#plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // parse the data and time
    var parseTime = d3.timeParse("%M:%S");

    d3.csv("data/FG.csv", function (error, data) {
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
        drawVis(data);
    });

    // don't want dots overlapping axis, so add in buffer to data domain
    //xScale.domain(d3.extent(data, function(d) { return d.Time}));
    xScale.domain([parseTime("00:00"), parseTime("60:60")]);
    
    //yScale.domain([50, d3.min(data, yValue) - 1]);
    yScale.domain([50, 0]);

    // Add a title to the visual
    svg.append("text")
        .attr("x", (width / 2))             
        //.attr("y", 0 - (margin.top / 2))
        .attr("y", 0)
        .attr("text-anchor", "middle")  
        .style("font-size", "24px") 
        .text("NFL Field Goals in the 2017 Season");
    
    // Add x axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));
    
    // Add label to the x-axis
    svg.append("text")             
        .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top + 10) + ")")
        .style("text-anchor", "middle")
        .text("Time of Game");
    
    //Add y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale));
    
    // Add label to the y-axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Field Position");

    let maxYards = 30; //29 is the current maximum of yards to go in dataset

    $("#yards").slider({
        range:true,
        min:0,
        max:maxYards,
        values:[0, maxYards],
        slide: function(event, ui) {
            $("#yardsToGo").val(ui.values[0] + "-" + ui.values[1]); 
            filterYards(ui.values);
        }
    });
    $("#yardsToGo").val($("#yards").slider("values", 0) + "-" + $("#yards").slider("values", 1));

    // let legened = document.querySelector("#legend");

    // // draw legend colored rectangles
    // legend.append("rect")
    //     .attr("x", width - 10)
    //     .attr("width", 18)
    //     .attr("height", 18)
    //     .style("fill", color);

    // // draw legend text
    // legend.append("text")
    //     .attr("x", width - 16)
    //     .attr("y", 9)
    //     .attr("dy", ".35em")
    //     .style("text-anchor", "end")
    //     .text(function (d) { return d; })

    function drawVis(data) {
        //set up tooltip
        var div = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity, 0");
    
        //call tooltip
        let tooltip = d3.select(".tooltip");
    
        //draw dots
        let points = svg.selectAll(".point")
            .data(data)
        
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
    
    
        document.querySelector("#selectform").onchange = function() {
            filterType(this.value);
        }
    }
    
    function filterType(type) {
        var res = all.test(type);
        if(res) {
            drawVis(dataset);
        } else {
            var ndata = dataset.filter(function(d) {
                return d["Team"] == type;
            });
            drawVis(ndata);
        }
    }
    
    // function filterYardsToGo() {
    //     $("#yards").slider({
    //         range:true,
    //         min:0,
    //         max:maxYards,
    //         values:[0, maxYards],
    //         slide: function(event, ui) {
    //             $("#yardsToGo").val(ui.values[0] + "-" + ui.values[1]); 
    //             filterYards(ui.values);
    //         }
    //     });
    //     $("#yardsToGo").val($("#yards").slider("values", 0) + "-" + $("#yards").slider("values", 1));
    // }

    function filterYards() {
        console.log("A");
    }
})
