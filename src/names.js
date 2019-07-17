import * as d3 from "d3";

class Names {
  constructor(callback) {
  	this.holder = d3.select(".names");
  	this.data = [];
  	this.callback = callback;
  	this.selected = null;
  }

  updateList(data) {
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
	  			callback(null);
  			} else {
  				selected = d;
	  			d3.selectAll(".selected").classed("selected", false);
	  			d3.select(this).classed("selected", true);
	  			callback(d);
  			}
  		})
  		.attr("class", function(d){ return d.type + " name " + (selected === d ? "selected" : "")})
  		.append("p")
  		.html(function(d){ return d.name});

  	items.exit().remove();
  }

}

export default Names;