import data from "./top_names_years.json";
import chart from "./chart.js";
import {set} from "d3-collection";
import {select, selectAll} from "d3-selection";

//initial values
let type = "all";
let subtype = "all";
let filterData = data["values"];

//the type selector never changes
let possible_types = 
	set(data.values.map(function(d){ return d.type})).values();
	possible_types.unshift("all");

let select_item = 
	select("#type")
		.selectAll("option")
		.data(possible_types, function(d){ return d})
		.enter()
		.append("option")
		.attr("value", function(d){ return d})
		.html(function(d){ return d.split("_").join(" ").toUpperCase()});

select("#type").on("change", updateSubtypes);

let myChart = new chart();
filterMyData();

function filterMyData(){
	if (type === "all"){
		filterData = data["values"];
	} else if (type === "actor" || type === "unknown" || type === "unknown"){
		filterData = data["values"].filter(function(d){
			return d["type"] === type;
		})
	} else {
		filterData = data["values"].filter(function(d){
			if (subtype === "all"){
				return d["type"] === type;
			} else {
				return d["type"] === type && d["subtype"] === subtype;
			}
			
		})
	}
	myChart.drawChart(filterData);
}
		

function updateSubtypes(e){
	type = this.value;
	if (type === "all" || type === "actor" || type === "unknown"){
		let possible_subvalues = ["all"];

		let select_sub_item = 
			select("#subtype")
				.selectAll("option")
				.data(possible_subvalues, function(d){ return d});

		select_sub_item.exit().remove();


		select_sub_item
				.enter()
				.append("option")
				.attr("value", function(d){ return d})
				.html(function(d){ return d.split("_").join(" ").toUpperCase()});

		select("#subtype").property("disabled", true);

	} else {
		let filtered_subvalues = 
			data.values.filter(function(d){ return d["type"] === type});

		let possible_subvalues = 
			set(filtered_subvalues.map(function(d){ return d.subtype})).values();
		possible_subvalues.unshift("all");

		let select_sub_item = 
			select("#subtype")
				.selectAll("option")
				.data(possible_subvalues, function(d){ return d});

		select_sub_item.exit().remove();

		select_sub_item
				.enter()
				.append("option")
				.attr("value", function(d){ return d})
				.html(function(d){ return d.split("_").join(" ").toUpperCase()});

		select("#subtype").property("disabled", false);

	}
	select("#subtype").on("change", function(d){
		subtype = this.value;
		filterMyData();
	});
	filterMyData();

}
