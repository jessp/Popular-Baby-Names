import * as d3 from "d3";

class Chart {
  constructor() {
  	this.width = 500;
  	this.height = 300;
  	this.data = [];
  	this.parseTime = d3.timeParse("%Y");
  	this.formatTime = d3.timeFormat("%Y");
  	this.numFormat = d3.format(",");
  	this.margin = ({top: 20, right: 20, bottom: 30, left: 50});
    this.svg = 
    	d3.select("#theSvg")
    		.attr("viewBox", [0, 0, this.width, this.height]);
    this.colours = {
    	"athlete": "red",
    	"notable_person": "blue",
    	"reality_star": "green",
    	"actor": "orange",
    	"unknown": "purple",
    	"music_related": "lime",
    	"fictional_character": "turquoise"
    }

    this.group = this.svg.append("g")
    	.attr("class", "mainGroup")
      .attr("fill", "none")
      .attr("stroke-width", 0.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round");

    this.dot = this.svg.append("g")
    	.attr("class", "dot")
      .attr("display", "none");

  	this.dot.append("circle")
      .attr("r", 2.5);

  	this.dot.append("text")
      .style("font", "10px sans-serif")
      .attr("text-anchor", "middle")
      .attr("y", -8);

    this.peakGroup = this.group.append("g")
    	.attr("class", "peakGroup")
    	.attr("fill", "none")
		.attr("stroke-width", 0.5);

	this.trendGroup = this.group.append("g")
    	.attr("class", "trendGroup")
    	.attr("fill", "none")
		.attr("stroke-width", 0.5);

    this.x = d3.scaleUtc()
    	.domain([this.parseTime(1950), this.parseTime(2018)])
    	.range([this.margin.left, this.width - this.margin.right]);

    this.y = d3.scaleLinear()
    	.range([this.height - this.margin.bottom, this.margin.top])


    this.drawChart = this.drawChart.bind(this);
    this.drawSymbols = this.drawSymbols.bind(this);
    this.hover = this.hover.bind(this);
    this.moved = this.moved.bind(this);
    this.entered = this.entered.bind(this);
    this.left = this.left.bind(this);

    this.xAxis = this.svg.append("g").attr("class", "xAxis")
    	.attr("transform", "translate(0," + (this.height - this.margin.bottom) + ")")
    	.call(d3.axisBottom(this.x).ticks(this.width / 80).tickSizeOuter(0))
    
    this.yAxis = this.svg.append("g").attr("class", "yAxis")
	    .attr("transform", "translate(" + this.margin.left + ",0)");

	d3.select("#trend").on("change", function(d){
		let isChecked = d3.select(this).property("checked");
		d3.select(".trendGroup").style("opacity", isChecked ? 1 : 0);
	});

	d3.select("#highest").on("change", function(d){
		let isChecked = d3.select(this).property("checked");
		d3.select(".peakGroup").style("opacity", isChecked ? 1 : 0);
	});
	    
    
  }

  drawChart(data){
  	this.data = data;

  	let allValues =
  		 data.map(function(d){ return Object.values(d.years)})
  		.reduceRight(function(a, b) { return a.concat(b); }, []);
  	allValues = d3.set(allValues).values().map(e => parseInt(e));

  	this.y
  		.domain([0, d3.max(allValues)]).nice();

  	this.yAxis 
  	.call(d3.axisLeft(this.y))
	    .call(g => g.select(".domain").remove())
	    .call(g => g.select(".tick:last-of-type text").clone()
	        .attr("x", 3)
	        .attr("text-anchor", "start")
	        .attr("font-weight", "bold")
	        .text(this.data.y))

  	let y = this.y;
  	let x = this.x;
  	let parseTime = this.parseTime;
	let line = d3.line()
	    .defined(function(d){
	    	return d && d[0] && d[0]["years"] && d[0]["years"][d[1]];
	    })
	    .x(d => this.x(this.parseTime(parseInt(d[1]))))
	    .y(function(d){
	    	if (d[0] && d[0]["years"][d[1]]){
	    		return y(d[0]["years"][d[1]]);
	    	} else {
	    		return y(0);
	    	}
	    });


    let paths = d3.select(".mainGroup").selectAll(".path")
	    .data(data, function(d){ return d["name"];});

	paths.attr("d", function(d){
	      	return line(Object.keys(d.years).map(function(e){ return [d, e]}));
	      });

	paths.enter()
	    .append("path")
	    .attr("class", "path")
	    	.attr("stroke", (d) => this.colours[d.type])
	    	.style("mix-blend-mode", "multiply")
	    	.attr("d", function(d){
	    		return line(Object.keys(d.years).map(function(e){ return [d, e]}));
	    	});

	paths.exit().remove();

	this.drawSymbols("peak");
	this.drawSymbols("trend");


	this.svg.call(this.hover, this.group);

  }

  drawSymbols(group){
  	let y = this.y;
  	let x = this.x;
  	let parseTime = this.parseTime;

  	let attributes = group === "peak" ? {
  		group: this.peakGroup,
  		accessor: "max",
  		"shape": d3.symbolCross
  	} :
  	{
  		group: this.trendGroup,
  		accessor: "max_increase",
  		"shape": d3.symbolStar
  	}

  	let shapes = attributes.group
	.selectAll("." + group + "Symbol")
	.data(this.data, function(d){ return d["name"];});

	shapes.attr("transform", function(d){
			return "translate(" + x(parseTime(d[attributes.accessor])) + "," + y(d["years"][d[attributes.accessor]]) + ")";
		})

	shapes
		.enter()
		.append("path")
		.attr("transform", function(d){
			return "translate(" + x(parseTime(d[attributes.accessor])) + "," + y(d["years"][d[attributes.accessor]]) + ")";
		})
		.attr("class", group + "Symbol")
		.attr("d", function(d) {
			return d3.symbol().type(attributes.shape).size("12")()
		})
		.attr("stroke", (d) => this.colours[d.type]);

	shapes.exit().remove();
  }

  hover(svg, path){

  	if ("ontouchstart" in document){
  		svg
    		.style("-webkit-tap-highlight-color", "transparent")
    		.on("touchmove", this.moved)
    		.on("touchstart", this.entered)
    		.on("touchend", this.left)
  	} else {
  		svg
	    	.on("mousemove", this.moved)
	    	.on("mouseenter", this.entered)
	    	.on("mouseleave", this.left);
	}


  }

    moved() {
    	let dates = d3.range(1950,2019);
	    d3.event.preventDefault();
	    const ym = this.y.invert(d3.event.layerY);
	    const xm = this.x.invert(d3.event.layerX);
	    const i1 = d3.bisectLeft(dates, this.formatTime(xm), 1);
	    const i0 = i1 - 1;
	    let theX = this.x;
	    const i = xm - dates[i0] > dates[i1] - xm ? i1 : i0;
	    let newI = i + 1950;
	    let existingData = this.data.filter(function(d){
	    	return d.years[newI];
	    })
	    let colours = this.colours;
	    if (existingData.length > 0){
	    	const s = existingData.reduce(function(a,b){
		    	let a1 = a.years[newI] ? a.years[newI] - ym : -1000000000;
		    	let b1 = b.years[newI] ? b.years[newI] - ym : -1000000000;
		    	return Math.abs(a1) < Math.abs(b1) ? a : b;
	   		});

		    d3.select(".mainGroup").selectAll("path")
		    .attr("stroke", function(d){
		    	return d["name"] === s["name"] ? colours[d.type] : "#ddd";
		    })
		    .attr("stroke-width", function(d){
		    	return d["name"] === s["name"] ? 1 : null;
		    })
		    .filter(d => d["name"] === s["name"]).raise();
		    this.dot.attr("transform", "translate(" + this.x(this.parseTime(dates[i])) + "," + this.y(s.years[newI]) + ")");
		    this.dot.select("text").text(s.name + " - " + this.numFormat(s["years"][newI]));
	    	d3.select(".theExplainer p").html(s.description);
	    } else {
	    	this.group.style("mix-blend-mode", "multiply")
		    this.group.selectAll("path")
		    .attr("stroke", (d) => this.colours[d.type])
		    .attr("stroke-width", null);
		    this.dot.attr("display", "none");
		    d3.select(".theExplainer p").html(null);
	    }
	    
  }

  entered() {
    this.group.style("mix-blend-mode", null);
    this.group.selectAll("path")
    	.attr("stroke", "#ddd")
    	.attr("stroke-width", null);
    this.dot.attr("display", null);
  }

  left() {
    this.group.style("mix-blend-mode", "multiply")
    this.group.selectAll("path")
    	.attr("stroke", (d) => this.colours[d.type])
    	.attr("stroke-width", null);
    this.dot.attr("display", "none");
    d3.select(".theExplainer p").html(null);
  }






}

export default Chart;
