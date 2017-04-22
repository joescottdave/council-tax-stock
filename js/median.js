var councilTaxArray = [1,2,3,4,70,6,82,8,9];
var merthyrArray = [14050,6630,2170,2090,1390,550,140,0,10];
var heading = document.getElementById("heading");

var getMedianHousehold = function(anArray){
    var target = 0;
    var median = 0;
    var medColor;
    var letter = d3.scaleOrdinal()
                .domain([0,1,2,3,4,5,6,7,8])
                .range(['A','B','C','D','E','F','G','H','I']);
    var letterColor = d3.scaleOrdinal()
                .domain([0,1,2,3,4,5,6,7,8])
                .range(["#fa5a5a", "#ffcb4f", "#00be70","#295ea4"]);

    for (i=0; i < anArray.length; i++){
        median += anArray[i]
    };

    median = Math.round(median/2);

    for (i=0; i < anArray.length; i++){
        if (target < median){
            target += anArray[i]
        }else{
            medColor = letterColor(i-1)
            break;
        }
    };

    console.log(median, target);
    return medColor;
} 

getMedianHousehold(councilTaxArray);
getMedianHousehold(merthyrArray);