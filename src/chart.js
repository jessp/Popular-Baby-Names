import * as d3 from "d3";

class Chart {
	constructor(colours) {

		this.width = d3.select(".svgHolder").node().clientWidth;
		this.height = d3.select(".svgHolder").node().clientHeight;
		this.data = [];
		this.display = true;
		this.parseTime = d3.timeParse("%Y");
		this.formatTime = d3.timeFormat("%Y");
		this.numFormat = d3.format(",");
		this.percentFormat = d3.format(",.0%");
		this.selected = null;
		this.margin = ({top: 20, right: 20, bottom: 20, left: 50});
		this.svg = 
		d3.select("#theSvg")
		.attr("viewBox", [0, 0, this.width, this.height]);
		this.colours = colours;

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
		this.changeScale = this.changeScale.bind(this);
		this.debounce = this.debounce.bind(this);
		this.resize = this.resize.bind(this);
		this.hover = this.hover.bind(this);
		this.moved = this.moved.bind(this);
		this.entered = this.entered.bind(this);
		this.left = this.left.bind(this);

		this.xAxis = this.svg.append("g").attr("class", "xAxis")
		.attr("transform", "translate(0," + (this.height - this.margin.bottom) + ")")
		.call(d3.axisBottom(this.x).ticks(this.width / 80).tickSizeOuter(0))

		this.yAxis = this.svg.append("g").attr("class", "yAxis")
		.attr("transform", "translate(" + this.margin.left + ",0)");

		d3.selectAll(".trend").on("click", function(d){
			let isChecked = d3.select(this).classed("active");
			d3.select(".trendGroup").style("opacity", isChecked ? 0 : 1);
			d3.select(this).classed("active", !isChecked);
		});

		d3.selectAll(".highest").on("click", function(d){
			let isChecked = d3.select(this).classed("active");
			d3.select(".peakGroup").style("opacity", isChecked ? 0 : 1);
			d3.select(this).classed("active", !isChecked);
		});

		let setDisplay = (e) => this.display = e;
		let drawChart = this.drawChart;

		//we have two different checkbox things for changing scales
		//so we need to handle them 2 different ways
		let changeScale = this.changeScale;
		$("#scaleType").dropdown({
			onChange: changeScale
		});

		d3.select("#percChange").on("click", (e) => changeScale("percChange"));
		d3.select("#numBabies").on("click", (e) => changeScale("numBabies"));

		//we're both debouncing after resizing and then giving a delay
		var myEfficientFn = this.debounce(this.resize, 350);

		window.addEventListener('resize', myEfficientFn);
		

	}

	//from https://davidwalsh.name/javascript-debounce-function
	debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};

	changeScale(e){
		this.display = e === "numBabies" ? true : false;
		d3.select("#percChange").classed("active", e === "numBabies" ? false : true);
		d3.select("#numBabies").classed("active", e === "numBabies" ? true : false);
		d3.select(".percChange").classed("selected active", e === "numBabies" ? false : true);
		d3.select(".numBabies").classed("selected active", e === "numBabies" ? true : false);

		this.drawChart();
	}

	resize(){
			this.width = d3.select(".svgHolder").node().clientWidth;
			this.height = d3.select(".svgHolder").node().clientHeight;

			d3.select("#theSvg")
			.attr("viewBox", [0, 0, this.width, this.height]);

			this.x
			.range([this.margin.left, this.width - this.margin.right]);

			this.y
			.range([this.height - this.margin.bottom, this.margin.top]);

			this.xAxis
			.attr("transform", "translate(0," + (this.height - this.margin.bottom) + ")")
			.call(d3.axisBottom(this.x).ticks(this.width / 80).tickSizeOuter(0));

			this.yAxis
			.attr("transform", "translate(" + this.margin.left + ",0)");

			this.drawChart();

	}

	drawChart(data){
		if (data){
			this.data = data;
		}
		let selected = this.selected ? this.selected : "";
		let accessor = this.display ? "years" : "differences";
		let display = this.display;

		let allValues =
		this.data.map(function(d){ return Object.values(display ? d.years : d.differences)})
		.reduceRight(function(a, b) { return a.concat(b); }, []);

		allValues = d3.set(allValues).values().map(e => parseInt(e));

		this.y
		.domain([0, d3.max(allValues)]).nice();

		this.yAxis 
		.call(d3.axisLeft(this.y).tickFormat(display ? this.numFormat : this.percentFormat))
		.call(g => g.select(".domain").remove());

		if (d3.select(".titleOfChart").node()){
			d3.select(".titleOfChart").remove();
		}

		this.yAxis
		.call(g => g.select(".tick:last-of-type text").clone()
			.attr("class", "titleOfChart")
			.attr("x", 3)
			.attr("text-anchor", "start")
			.attr("font-weight", "bold")
			.text(display ? "Number of Babies Born" : "Percent Change Since Previous Year" ))

		let y = this.y;
		let x = this.x;
		let parseTime = this.parseTime;
		let line = d3.line()
		.defined(function(d){
			let accessor = display ? "years" : "differences";
			return d && d[0] && d[0][accessor] && d[0][accessor][d[1]];
		})
		.x(d => this.x(this.parseTime(parseInt(d[1]))))
		.y(function(d){
			let accessor = display ? "years" : "differences";
			if (d[0] && d[0][accessor][d[1]]){
				return y(d[0][accessor][d[1]]);
			} else {
				return y(0);
			}
		});


		let paths = d3.select(".mainGroup").selectAll(".path")
		.data(this.data, function(d){ return d["name"];});

		paths
		.transition().duration(300)
		.attr("d", function(d){
			return line(Object.keys(d.years).map(function(e){ return [d, e]}));
		})
		.attr("stroke-width", function(d){ return selected["name"] === d["name"] ? 1 : null})
		.style("opacity", function(d){
			if (selected === ""){
				return 1;
			} else {
				if (selected["name"] === d["name"]){
					return 1;
				} else {
					return 0.25;
				}
			}
		});

		paths.enter()
		.append("path")
		.attr("class", "path")
		.attr("stroke", (d) => this.colours[d.type])
		.attr("stroke-width", function(d){ return selected["name"] === d["name"] ? 1 : null})
		.style("mix-blend-mode", "multiply")
		.attr("d", function(d){
			if (display){
				return line(Object.keys(d.years).map(function(e){ return [d, e]}));
			} else {
				return line(Object.keys(d.differences).map(function(e){ return [d, e]}));
			}
		})
		.style("opacity", function(d){
			if (selected === ""){
				return 1;
			} else {
				if (selected["name"] === d["name"]){
					return 1;
				} else {
					return 0.25;
				}
			}
		});

		paths
		.exit()
		.remove();

		this.drawSymbols("peak");
		this.drawSymbols("trend");

		d3.select(".theExplainer .info")
		.html(selected["description"] ? selected["description"] : null);
		d3.select(".theExplainer .placeholder").classed("hidden", selected["description"] ? true : false);

		if (selected !== ""){
			this.dot.attr("display", "initial");
			this.dot
			.attr("transform", "translate(" + this.x(this.parseTime(selected["max"])) + "," + this.y(selected[accessor][selected["max"]]) + ")");
			this.dot
			.select("text")
			.text(selected.name + " - " + (this.display ? this.numFormat(selected[accessor][selected["max"]]) : this.percentFormat(selected[accessor][selected["max"]])));
		} else {
			this.dot.attr("display", "none");
		}

		this.svg.call(this.hover, this.group);

	}

	setSelected(name){
		this.selected = name;
		this.drawChart();
	}

	drawSymbols(group){
		let y = this.y;
		let x = this.x;
		let parseTime = this.parseTime;
		let display = this.display;
		let selected = this.selected ? this.selected : "";

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

		shapes
		.transition().duration(300)
		.attr("transform", function(d){
			return "translate(" + x(parseTime(d[attributes.accessor])) + "," + y(d[(display ? "years" : "differences")][d[attributes.accessor]]) + ")";
		})
		.style("opacity", function(d){
			if (selected === ""){
				return 1;
			} else {
				if (selected["name"] === d["name"]){
					return 1;
				} else {
					return 0.25;
				}
			}
		});

		shapes
		.enter()
		.append("path")
		.attr("transform", function(d){
			return "translate(" + x(parseTime(d[attributes.accessor])) + "," + y(d[(display ? "years" : "differences")][d[attributes.accessor]]) + ")";
		})
		.attr("class", group + "Symbol")
		.attr("d", function(d) {
			return d3.symbol().type(attributes.shape).size("12")()
		})
		.attr("stroke", (d) => this.colours[d.type])
		.style("opacity", function(d){
			if (selected === ""){
				return 1;
			} else {
				if (selected["name"] === d["name"]){
					return 1;
				} else {
					return 0.25;
				}
			}
		});

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
		let accessor = this.display ? "years" : "differences";
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
			return d[accessor][newI];
		})
		let colours = this.colours;
		let selected = this.selected ? this.selected : "";
		if (existingData.length > 0){
			const s = existingData.reduce(function(a,b){
				let a1 = a[accessor][newI] ? a[accessor][newI] - ym : -1000000000;
				let b1 = b[accessor][newI] ? b[accessor][newI] - ym : -1000000000;
				return Math.abs(a1) < Math.abs(b1) ? a : b;
			});

			d3.select(".mainGroup").selectAll("path")
			.attr("stroke", function(d){
				return (d["name"] === s["name"] || d["name"] === selected["name"]) ? colours[d.type] : "#ddd";
			})
			.attr("stroke-width", function(d){
				return (d["name"] === s["name"] || d["name"] === selected["name"]) ? 1 : null;
			})
			.filter(d => (d["name"] === s["name"] || d["name"] === selected["name"])).raise();
			this.dot.attr("display", "initial");
			this.dot
			.attr("transform", "translate(" + this.x(this.parseTime(dates[i])) + "," + this.y(s[accessor][newI]) + ")");
			this.dot
			.select("text")
			.text(s.name + " - " + (this.display ? this.numFormat(s[accessor][newI]) : this.percentFormat(s[accessor][newI])));
			d3.select(".theExplainer .placeholder").classed("hidden", true);
			d3.select(".theExplainer .info").html(s.description);
		} else {
			this.group.style("mix-blend-mode", "multiply")
			this.group.selectAll("path")
			.attr("stroke", (d) => this.colours[d.type])
			.attr("stroke-width", (d) => d["name"] === selected["name"] ? 1 : null);
			if (selected !== ""){
				this.dot.attr("display", "initial");
				this.dot
				.attr("transform", "translate(" + this.x(this.parseTime(selected["max"])) + "," + this.y(selected[accessor][selected["max"]]) + ")");
				this.dot
				.select("text")
				.text(s.name + " - " + (this.display ? this.numFormat(selected[accessor][selected["max"]]) : this.percentFormat(selected[accessor][selected["max"]])));
			} else {
				this.dot.attr("display", "none");
			}

			d3.select(".theExplainer .placeholder").classed("hidden", selected["description"] ? true : false);
			d3.select(".theExplainer .info").html(selected["description"] ? selected["description"] : null);
		}

	}

	entered() {
		let accessor = this.display ? "years" : "differences";
		let selected = this.selected ? this.selected : "";
		this.group.style("mix-blend-mode", null);
		this.group.selectAll("path")
		.attr("stroke", function(d){
			if (d["name"] === selected["name"]){
				return null;
			} else {
				return "#ddd";
			}
		})
		.attr("stroke-width", null);
		if (selected !== ""){

			this.dot.attr("display", "initial");
			this.dot
			.attr("transform", "translate(" + this.x(this.parseTime(selected["max"])) + "," + this.y(selected[accessor][selected["max"]]) + ")");
			this.dot
			.select("text")
			.text(selected.name + " - " + (this.display ? this.numFormat(selected[accessor][selected["max"]]) : this.percentFormat(selected[accessor][selected["max"]])));
		} else {
			this.dot.attr("display", "none");
		}
	}

	left() {
		let accessor = this.display ? "years" : "differences";

		let selected = this.selected ? this.selected : "";
		this.group.style("mix-blend-mode", "multiply")
		this.group.selectAll("path")
		.attr("stroke", (d) => this.colours[d.type])
		.attr("stroke-width",  (d) => d["name"] === selected["name"] ? 1 : null);
		d3.select(".theExplainer .info").html(selected["description"] ? selected["description"] : null);
		d3.select(".theExplainer .placeholder").classed("hidden", selected["description"] ? true : false);
		if (selected !== ""){
			this.dot.attr("display", "initial");
			this.dot
			.attr("transform", "translate(" + this.x(this.parseTime(selected["max"])) + "," + this.y(selected[accessor][selected["max"]]) + ")");
			this.dot
			.select("text")
			.text(selected.name + " - " + (this.display ? this.numFormat(selected[accessor][selected["max"]]) : this.percentFormat(selected[accessor][selected["max"]])));
		} else {
			this.dot.attr("display", "none");
		}
	}






}

export default Chart;
