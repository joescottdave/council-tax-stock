var count = 0;
var width;
var height;
var chartWidth;
var chartHeight;

var svg;
var g;
var key;
var gMoney;

var projection;
var path;

var active = d3.select(null);

var medianColors = d3.scaleOrdinal()
    .domain([0,8])
    .range(["#EE4035", "#F3A530" ,"#56B949", "#30499B"]);

var letter = d3.scaleOrdinal()
        .domain([0,1,2,3,4,5,6,7,8])
        .range(['A','B','C','D','E','F','G','H','I']);
var letterColor = d3.scaleLinear()
                .domain([0,1,2,3,4])
                .range(["#FA5A5A", "#FFCB4F","#00BE70", "#295EA4" ]);

var wales_data;
var charge_data;
var rent_data;
var wage_data;
var rentRatios = [];
var wageRatios = [];

function draw(lad_bounds) {
    projection
        .scale(1)
        .translate([0,0]);

    var b = path.bounds(topojson.feature(lad_bounds, lad_bounds.objects['lad']));
    var s = .95/Math.max((b[1][0] - b[0][0])/width, (b[1][1] - b[0][1])/height);
    var t = [(width - s * (b[1][0] + b[0][0]))/2, (height - s*(b[1][1] + b[0][1]))/2];

    projection
        .scale(s)
        .translate(t);

    var areas = g.selectAll(".area")
        .data(topojson.feature(lad_bounds, lad_bounds.objects['lad']).features);

    var areasMedian = gMedian.selectAll(".area-median")
        .data(topojson.feature(lad_bounds, lad_bounds.objects['lad']).features);

    areas
        .enter()
        .append('path')
        .attr('class', 'area')
        .attr('data-key', function(d) { return d['id']; })
        .attr('d', path)
        .style('fill', medianColors(2))
        .style('stroke', "#f7f7f7")
        .style('stroke-width', '0.5px')
        .on("click", clicking);

    areasMedian
        .enter()
        .append('path')
        .attr('class', 'area')
        .attr('data-key', function(d) { return d['id']; })
        .attr('data-color', function(d) {return getMedianHouseholdColor(d); })
        .attr('data-band', function(d) { return getMedianHouseholdBand(d); })
        .attr('d', path)
        .style('stroke', "#f7f7f7")
        .style('stroke-width', '0.5px')
        .style('fill', function(d){ return getMedianHouseholdColor(d); })
        .on("click", medianClicking);

    var keyData = [0,1,2,3,4];
    var keyBoxes = key.selectAll('.boxes')
        .data(keyData);
    var keyText = key.selectAll('.keytext')
        .data(keyData);
    
    keyBoxes.enter()
        .append('rect')
        .attr("class", "boxes")
        .attr("height", "20px")
        .attr("width", "20px")
        .attr("transform", function(d,i){ return "translate(4, " + ((i+1) * 24) + ")"; })
        .style("stroke", function(d,i){ return letterColor(i); })
        .style("stroke-width", "0px")
        .style("fill", function(d,i){ return letterColor(i); });
    
    keyText.enter()
        .append('text')
        .attr('class', 'keytext')
        .attr("transform", function(d,i){ return "translate(28, " + (15 + ((i+1) * 24)) + ")"; })
        // .style("fill", function(d,i){ return letterColor(i); })
        .style("fill", "black")
        .text(function(d,i){ return "Band " + letter(d); });

    var areasMoney = gMoney.selectAll(".area")
        .data(topojson.feature(lad_bounds, lad_bounds.objects['lad']).features);

    areasMoney
        .enter()
        .append('path')
        .attr('class', 'moneyarea')
        .attr('data-key', function(d) { return d['id']; })
        .attr('data-color', '#f7f7f7')
        .attr('data-band', function(d) { return getMedianHouseholdBand(d); })
        .attr('data-charge', function(d){
            var band = getMedianHouseholdBand(d)
            var id = d['id']
            var arrayObject = charge_data.filter(function(obj){
                return obj.ECODE == id
            })
            return arrayObject[0][band+" "];
        })
        .attr('data-rent', function(d){
            var band = getMedianHouseholdBand(d)
            var id = d['id']
            var arrayObject = rent_data.filter(function(obj){
                return obj.ECODE == id
            })
            var rentRatio = this.dataset.charge / arrayObject[0]["1 Bedroom"];
            rentRatios.push(rentRatio);
            rentRatios.sort();
            return arrayObject[0]["1 Bedroom"];
        })
        .attr('data-wage', function(d){
            var band = getMedianHouseholdBand(d)
            var id = d['id']
            var arrayObject = wage_data.filter(function(obj){
                return obj.ECODE == id
            })
            var wageRatio = this.dataset.charge / arrayObject[0]['2016 (13)'];
            wageRatios.push(wageRatio);
            wageRatios.sort();
            return arrayObject[0]['2016 (13)'];
        })
        .attr('d', path)
        .style('stroke', '#f7f7f7');
    colorMoneyMap('Wages');
    
}

function clicking(d){
    if (active.node() === this){
        null;
    }else{
        var id = this.dataset.key;
        var arrayObject = (wales_data.filter(function(obj){
            return obj.ECODE == id;
        }));
        var list2 = buildArray(arrayObject[0]);
        var areaName = arrayObject[0].AREA_NAME;
        console.log(areaName);
        var locationSpan = d3.select("#location");
        locationSpan.transition(1).style("color",medianColors(0));
        active.style("fill", medianColors(2));
        active = d3.select(this);
        active.transition().style("fill", medianColors(0));
        drawChart(list2,areaName);
    }
}

function medianClicking(d){
    var bill = d3.select("#council-tax-bill");
    bill.style("color", this.dataset.color );
    var id = this.dataset.key;
        var arrayObject = (charge_data.filter(function(obj){
            return obj.ECODE == id;
        }));
    var location = d3.select("#second_location");
    location.html("in " + arrayObject[0]["AREA_NAME"])
        .style("color", this.dataset.color );
    bill.html("£" + arrayObject[0][this.dataset.band + " "]);
}

function buildArray(object){
    var list = [object.BAND_A, object.BAND_B, object.BAND_C, object.BAND_D, object.BAND_E, object.BAND_F, object.BAND_G, object.BAND_H, object.BAND_I];
    for (i=0; i < 8; i++){
        if(isNaN(list[i])){
            list[i] = 0
        }
    }
    if (isNaN(list[8])) {
        list.pop()
    }
    return list
}

function init() {
    width = document.getElementById("distribution-map").offsetWidth;

    height = document.getElementById("distribution-map").offsetHeight;

    distributionMap = d3.select("#distribution-map")
        .append("svg")
        .attr("class", "map")
        .attr("position", "absolute")
        .attr("width", width)
        .attr("height", height);

    medianMap = d3.select("#median-map")
        .append("svg")
        .attr("class", "map")
        .attr("position", "absolute")
        .attr("width", width)
        .attr("height", height);

    moneyMap = d3.select("#money-map")
        .append("svg")
        .attr("class","map")
        .attr("width", width)
        .attr("height", height);
    
    g = distributionMap.append("g");
    gMedian = medianMap.append("g")
    gMoney = moneyMap.append("g");

    key = medianMap.append("g")
        .attr("class", "key");

    projection = d3.geoAlbers()
        .rotate([0,0]);

    path = d3.geoPath()
        .projection(projection);

    chart = d3.select("#chart")
        .append('svg')
        .attr("position","absolute")
        .attr("width", width)
        .attr("height", height*0.9);

    chartWidth = width*0.9;
    chartHeight = height*0.55;
    
    gChart = chart.append("g");

    selector1 = d3.select(".selectors")
                    .append("select")
                    .attr("class", "selector")
                    .attr("id","selector1")
                    .on("change", function(){
                        colorMoneyMap(this.value);
                    });

    var options = selector1.selectAll("option")
                    .data(["Wages", "Rent"])
                .enter().append("option")
                    .html(function(d){
                        return d;
                    });

    selector2 = d3.select(".selectors")
                    .append("select")
                    .attr("class", "selector")
                    .attr("id","selector2")
                    .on("change", function(){
                            colorMoneyMap(document.getElementById('selector1').value);
                    });

    var options = selector2.selectAll("option")
                    .data(["1 Bedroom", "2 Bedrooms", "3 Bedrooms", "4 Bedrooms"])
                .enter().append("option")
                    .html(function(d){
                        return d;
                    });

    queue()
        .defer(d3.json, "./geoJSON/topo_lad.json")
        .defer(d3.csv, "./data/ctsop2016.csv")
        .defer(d3.csv, "./data/ctcharges.csv")
        .defer(d3.csv, "./data/medianearnings.csv")
        .defer(d3.csv, "./data/medianrents.csv")
        .await(function(error, boundaries, ctsop2016, ctcharges, wages, rents){
            wales_data = ctsop2016.filter(function(obj){
                if (/^W/.test(obj.ECODE)){
                    return obj
                }
            });

            //Has to be a better way to do the below
            wales_data.forEach(function(element){
                element.BAND_A = parseInt(element.BAND_A.replace(/,/g,""))
                element.BAND_B = parseInt(element.BAND_B.replace(/,/g,""))
                element.BAND_C = parseInt(element.BAND_C.replace(/,/g,""))
                element.BAND_D = parseInt(element.BAND_D.replace(/,/g,""))
                element.BAND_E = parseInt(element.BAND_E.replace(/,/g,""))
                element.BAND_F = parseInt(element.BAND_F.replace(/,/g,""))
                element.BAND_G = parseInt(element.BAND_G.replace(/,/g,""))
                element.BAND_H = parseInt(element.BAND_H.replace(/,/g,""))
                element.BAND_I = parseInt(element.BAND_I.replace(/,/g,""))
                if (/^Isle/.test(element.AREA_NAME)){
                    element.AREA_NAME = "Isle of Anglesey / Ynys Mon"
                }
            }, this);

            charge_data = ctcharges.filter(function(obj){
                if (/^W/.test(obj.ECODE)){
                    return obj
                }
            });
            wage_data = wages;
            rent_data = rents;
            draw(boundaries);
            var walesObject = (wales_data.filter(function(obj){
                return obj.ECODE == "W92000004";
            }));
            var list1 = buildArray(walesObject[0]);
            drawChart(list1, "Wales / Cymru");
        })
}

function drawChart(list, name){
    var barWidth = chartWidth/9;
    var locationSpan = document.getElementById("location");
    locationSpan.innerHTML = name;
    if (/^Isle/.test(name)){
        locationSpan.innerHTML = "Isle of Anglesey / Ynys M&#0244;n"
    }
    var x = d3.scaleLinear()
        .domain([0,d3.max(list)])
        .range([0, ((chartHeight/100)*90)]);
    var letters = d3.scaleOrdinal()
        .domain([0,1,2,3,4,5,6,7,8])
        .range(["A","B","C","D","E","F","G","H", "I"]);

    var bar = gChart.selectAll("rect")
        .data(list);
    
    var text = gChart.selectAll("text")
        .data(list);       
    
    gChart.exit().transition().remove();

    bar.transition()
        .attr("transform", function(d,i){ return "translate(" + (i * barWidth) + "," + (chartHeight - x(d)) + ")"; })
        .attr("height", function(d){ return x(d); })
        .attr("width", barWidth-1)
        .style("fill", function(){ return (count > 0) ? medianColors(0) : medianColors(2) });
    
    text.transition()
        .attr("y", function(d){ return (chartHeight - x(d) - 10); })
        .attr("x", function(d,i){return i * barWidth + barWidth / 2 })
        .attr("dy", ".35em")
        .style("fill", function(){ return (count > 0) ? medianColors(0) : medianColors(2) })
        .text(function(d,i){return letters(i);}); 

    bar.enter().append("rect")
        .attr("transform", function(d,i){ return "translate(" + (i * barWidth) + "," + (chartHeight - x(d)) + ")"; })
        .attr("height", function(d){ return x(d); })
        .attr("width", barWidth-1)
        .style("fill", function(){ return (count > 0) ? medianColors(0) : medianColors(2) });

    text.enter().append("text")
        .attr("y", function(d){ return (chartHeight - x(d) - 10); })
        .attr("x", function(d,i){return (i * barWidth + barWidth / 2) - 4 })
        .attr("dy", ".35em")
        .style("fill", function(){ return (count > 0) ? medianColors(0) : medianColors(2) })
        .text(function(d,i){return letters(i);}); 
    
    count +=1
}

function getMedianHouseholdColor(d){
    // variable I want returned to produce fill color
    var medColor;
    //get the relevant numbers for this area from CSV data and arrange into an array
    var councilObject = (wales_data.filter(function(obj){ return obj.ECODE == d['id']; }))
    var anArray = buildArray(councilObject[0]);
    // variables for calculating 
    var target = 0;
    var median = 0;
    // the work 
    // get the total for area
    for (i=0; i < anArray.length; i++){
        median += anArray[i]
    };
    // find the midway point
    median = Math.round(median/2);
    // add bands until we reach the midway point
    for (i=0; i < anArray.length; i++){
        if (target < median){
            target += anArray[i]
        }else{
            medColor = letterColor(i-1)
            break;
        }
    }
    // return newly arrived at color
    return medColor;
}

function getMedianHouseholdBand(d){
    // variable I want returned to produce fill color
    var band;
    //get the relevant numbers for this area from CSV data and arrange into an array
    var councilObject = (wales_data.filter(function(obj){ return obj.ECODE == d['id']; }))
    var anArray = buildArray(councilObject[0]);
    // variables for calculating 
    var target = 0;
    var median = 0;
    // the work 
    // get the total for area
    for (i=0; i < anArray.length; i++){
        median += anArray[i]
    };
    // find the midway point
    median = Math.round(median/2);
    // add bands until we reach the midway point
    for (i=0; i < anArray.length; i++){
        if (target < median){
            target += anArray[i]
        }else{
            band = letter(i-1)
            break;
        }
    }
    // return newly arrived at color
    return band;
}

function colorMoneyMap(input){
    console.log(rentRatios.length);
    d3.selectAll(".moneyarea")
        .style("fill", function(d){
            var id = this.dataset.key;
            secondValue = document.getElementById("selector2").value;
            if (input == "Rent"){
                document.getElementById("selector2").style.visibility = "visible"
                var arrayObject = rent_data.filter(function(obj){
                    return obj.ECODE == id;
                });
                var rentRatio = this.dataset.charge / arrayObject[0][secondValue];
                var ratioScale = d3.scaleLinear()
                                    .domain([1.8, d3.max(rentRatios)])
                                    .range(["#FFF", "#EE4035"]);
                return ratioScale(rentRatio);
            } else {
                document.getElementById("selector2").style.visibility = "hidden"
                var ratio = this.dataset.charge / this.dataset.wage;
                var ratioScale = d3.scaleLinear()
                                    // .domain([1.8, 3.7])
                                    .domain([d3.min(wageRatios), d3.max(wageRatios)])
                                    .range(["#FFF", "#56B949"]);
                return ratioScale(ratio);
            }
        });
}