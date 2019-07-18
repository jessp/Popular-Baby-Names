import * as d3 from "d3";

class Names {
  constructor(callback, colours) {
  	this.holder = d3.select(".names");
  	this.data = [];
  	this.callback = callback;
  	this.selected = null;
    this.colours = colours;
  }

  updateList(data) {
    let colours = this.colours;

  	this.data = data.sort(function(a, b) {
	  var nameA = a.name.toUpperCase(); // ignore upper and lowercase
	  var nameB = b.name.toUpperCase(); // ignore upper and lowercase
	  if (nameA < nameB) {
	    return -1;
	  }
	  if (nameA > nameB) {
	    return 1;
	  }

	  // names must be equal
	  return 0;
	});

  	let items = this.holder
  		.selectAll(".name")
  		.data(this.data, function(d){ return d.name});

  	let selected = this.selected;
  	let callback = this.callback;

  	items.enter()
  		.append("div")
  		.on("click", function(d){ 
  			if (selected === d){
  				selected = null;
	  			d3.selectAll(".selected").classed("selected", false);
	  			d3.select(this).classed("selected", false);
          d3.select(this).select("i").classed("circle", true);
          d3.select(this).select("i").classed("close", false);

	  			callback(null);
  			} else {
  				selected = d;
	  			d3.selectAll(".selected").classed("selected", false);
	  			d3.select(this).classed("selected", true);
          d3.select(this).select("i").classed("circle", false);
          d3.select(this).select("i").classed("close", true);
	  			callback(d);
  			}
  		})
  		.attr("class", function(d){ return d.type + " name item " + (selected === d ? "selected" : "")})
  		.each(function(d){
        let theThis = d3.select(this);
        theThis.append("i")
        .attr("class", (selected === d ? "close" : "circle") + " middle aligned icon " + (window.width > 350 ? "large" : ""))
        .style("color", (colours[d.type] ? colours[d.type] : "grey"));
        
        let contentDiv = theThis.append("div").attr("class", "content");
        contentDiv.append("div").attr("class", "header").html(d.name);
        contentDiv.append("div").attr("class", "description").html(d.type.split("_").join(" "));
      })

  	items.exit().remove();
  }


}

export default Names;