import data from "./top_names_years.json";
import chart from "./chart.js";
import names from "./names.js";
import {set} from "d3-collection";
import {select, selectAll} from "d3-selection";
import './../semantic/dist/semantic.css';

require('./../semantic/dist/components/transition');
require('./../semantic/dist/components/dropdown');
import css from './main.scss';

let colours = {
    	"athlete": "red",
    	"notable_person": "blue",
    	"reality_star": "green",
    	"actor": "orange",
    	"unknown": "purple",
    	"music_related": "lime",
    	"fictional_character": "turquoise"
    };

//initial values
let type = "all";
let subtype = "all";
let filterData = data["values"];
let selected = null;

//the type selector never changes
let possible_types = 
	set(data.values.map(function(d){ return d.type})).values();
	possible_types.unshift("all");


let select_item = 
	select("#type").select(".menu")
		.selectAll(".item")
		.data(possible_types, function(d){ return d})
		.enter()
		.append("div")
		.attr("data-value", function(d){ return d})
		.attr("class", "item")
		.each(function(d){
			let theThis = select(this);
			theThis.append("div")
				.attr("class", "ui empty circular label")
				.style("background-color", (colours[d] ? colours[d] : "grey"));
			theThis.append("span").html(function(d){ return d.split("_").join(" ").toUpperCase()});
		})

$("#type").dropdown({
    onChange: updateSubtypes
});


let myChart = new chart(colours);
let myNames = new names(setSelected);
filterMyData();

function setSelected(name){
	selected = name;
	myChart.setSelected(name);
}

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

	if (selected !== null){
		let exists = filterData.some(function(d){ return d === selected});
		setSelected(null);
	}
	myChart.drawChart(filterData);
	myNames.updateList(filterData);
}
		

function updateSubtypes(e){
	type = e;
	
	$("#subtype").dropdown("set selected", "all");

	let select_sub_item = 
			select("#subtype")
			.select(".menu")
			.selectAll(".item")
			.remove();
	subtype = "all";

	if (type === "all" || type === "actor" || type === "unknown"){
		let possible_subvalues = ["all"];
		let select_sub_item = 
			select("#subtype")
			.select(".menu")
			.selectAll(".item")
			.data(possible_subvalues, function(d){ return d})
			.enter()
			.append("div")
			.attr("data-value", function(d){ return d})
			.attr("class", "item")
			.each(function(d){
				let theThis = select(this);	
				theThis.append("span").html(function(d){ return d.split("_").join(" ").toUpperCase()});
			})

		select_sub_item.exit().remove();

		select("#subtype").classed("disabled", true);

	} else {
		let filtered_subvalues = 
			data.values.filter(function(d){ return d["type"] === type});

		let possible_subvalues = 
			set(filtered_subvalues.map(function(d){ return d.subtype})).values();
		possible_subvalues.unshift("all");

		let select_sub_item = 
			select("#subtype")
			.select(".menu")
			.selectAll(".item")
			.data(possible_subvalues, function(d){ return d})
			.enter()
			.append("div")
			.attr("data-value", function(d){ return d})
			.attr("class", "item")
			.each(function(d){
				let theThis = select(this);
				theThis.append("span").html(function(d){ return d.split("_").join(" ").toUpperCase()});
			})

		select("#subtype").classed("disabled", false);

		$("#subtype").dropdown({
    		onChange: changeSubtypeDropdown
		});

	}


	filterMyData();

}

function changeSubtypeDropdown(e){
	subtype = e;
	filterMyData();
}
