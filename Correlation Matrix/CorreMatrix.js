// Load the data and split it intot 3 parts
let data, data_female, data_male, data_infant;
async function getData() {
    try {
        // Load the data using d3.text()
        const textUrl = "https://raw.githubusercontent.com/mm1719/DataSet/master/abalone.data";
        const text = await d3.text(textUrl);

        // Since the abalone.data has no names of attribute, wee need to preprocess the plain text
        const columnNames = "Sex,length,diameter,height,whole_weight,shucked_weight,viscera_weight,shell_weight,rings\n";
        const modifiedText = columnNames + text;
        
        // Convert the modified text to csv format
        const preData = await d3.csvParse(modifiedText);
        console.log(preData.length); //Ensure that every row is remained
        
        // Convert the data type from string to its proper type
        const Length = [], Diameter = [], Height = [], Whole_weight = [], Shucked_weight = [], Viscera_weight = [], Shell_weight = [], Rings = [];
        preData.forEach(function(row) {
            Length.push(parseFloat(row.length));
            Diameter.push(parseFloat(row.diameter));
            Height.push(parseFloat(row.height));
            Whole_weight.push(parseFloat(row.whole_weight));
            Shucked_weight.push(parseFloat(row.shucked_weight));
            Viscera_weight.push(parseFloat(row.viscera_weight));
            Shell_weight.push(parseFloat(row.shell_weight));
            Rings.push(parseInt(row.rings, 10));
        });
        data = preData.map(function(row, index) {
            return {
                Sex: row.Sex,
                Length: Length[index],
                Diameter: Diameter[index],
                Height: Height[index],
                Whole_weight: Whole_weight[index],
                Shucked_weight: Shucked_weight[index],
                Viscera_weight: Viscera_weight[index],
                Shell_weight: Shell_weight[index],
                Rings: Rings[index]
            };
        });

        //Check the data type
        const row = data[0];
        for (const attributeName in row) {
            if (row.hasOwnProperty(attributeName)) {
                const attributeValue = row[attributeName];
                const dataType = typeof attributeValue;
                console.log(`Attribute: ${attributeName}, Data Type: ${dataType}`);
            }
        };

        // Split the data by different sex
        data_female = data.filter(d => d.Sex == "F");
        data_infant = data.filter(d => d.Sex == "I");
        data_male = data.filter(d => d.Sex == "M");

        // Check if thery are split well
        //console.log(data_female);
        //console.log(data_infant);
        //console.log(data_male);

        // Initialize the matrix and gradient box
        visualizeCorrMatrix("Female", data_female);
        updateGradientBox("Female");

        // Remove the data to minimize the space
        data = null;
    } catch(error) {
        console.error("Error getting data: ", error);
    }
}
getData();

// Calculate the correlation coefficient
function correlation(arrX, arrY) {
    if(arrX.length !== arrY.length) {
        throw new Error("arr1 and arr2 must have the same length");
    }
    const n = arrX.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    for(let i=0; i < n; i++) {
        sumX = sumX + arrX[i];
        sumY = sumY + arrY[i];
        sumXX = sumXX + (arrX[i]) ** 2;
        sumYY = sumYY + (arrY[i]) ** 2;
        sumXY = sumXY + arrX[i] * arrY[i];
    }
    let numerator = (n * sumXY) - (sumX * sumY);
    let denominator = Math.sqrt(((n*sumXX) - (sumX * sumX)) * ((n*sumYY) - (sumY * sumY)));
    let coeff = numerator / denominator;
    return coeff;
}

// Draw the matrix
function visualizeCorrMatrix(sex, subData) {
    const corrMatrix = [];
    const attributes = ["Length", "Diameter", "Height", "Whole_weight", "Shucked_weight", "Viscera_weight", "Shell_weight", "Rings"];

    // 1. Form a symetric matrix filled with correlation coefficient
    attributes.forEach((attr1) => {
        const row = [];
        attributes.forEach((attr2) => {
            const values1 = subData.map(d => d[attr1]);
            const values2 = subData.map(d => d[attr2]);
            const corrCoeff = correlation(values1, values2);
            row.push(corrCoeff.toFixed(2));
        })
        //console.log(row);
        corrMatrix.push(row);
    });
    console.log(corrMatrix);
    console.log(subData[0].Sex);

    // 2. Initialize some property for later drawing
    const cellSize = 60;
    const halfCellSize = cellSize / 2;
    const width = cellSize * attributes.length;
    const height = cellSize * attributes.length;

    const mat = d3.select("#Correlogram").append("svg")
        .attr("width", width)
        .attr("height", height);

    let colorStyle;
    switch(sex) {
        case "Female":
            colorStyle = ["#67001F", "#D0D0D0", "#053061"];
            break;
        case "Infant":
            colorStyle = ["#8F5418", "#D0D0D0", "#0b655d"];
            break;
        case "Male":
            colorStyle = ["#FF6201", "#D0D0D0", "#2D005D"];
            break;
    }
    const colorScale = d3.scaleLinear()
        .domain([-1, 0, 1])
        .range(colorStyle)

    const dotSize = d3.scaleSqrt()
        .domain([0, 1])
        .range([0, 12]);

    // 3. The drawing procces contains the following 3 parts
    // The labels here are a bit different from the usual matrix
    const attrName = ["Length", "Diameter", "Height", "Whole weight", "Shucked weight", "Viscera weight", "Shell weight", "Rings"];
    for(let i = 0; i < corrMatrix.length; i++) {
        for(let j = 0; j < corrMatrix[0].length; j++) {

            // Get the coordinate and value for later drawing
            let xCoor = i * cellSize + halfCellSize;
            let yCoor = j * cellSize + halfCellSize;
            const value = corrMatrix[i][j];

            // 3-a If the cell is in the diagonal, fill in the name of attibute
            if(i == j) {
                mat.append("text")
                    .attr("x", xCoor)
                    .attr("y", yCoor)
                    .attr("dy", "0.35em")
                    .style("text-anchor", "middle")
                    .style("font-size", "12")
                    .text(attrName[i]);
            }
            // 3-b If the cell is in the lower triangle, fill in the colored coefficient
            else if(i < j) {
                mat.append("text")
                    .attr("x", xCoor)
                    .attr("y", yCoor)
                    .attr("dy", "0.35em")
                    .style("text-anchor", "middle")
                    .style("font-size", "14")
                    .style("fill", colorScale(value))
                    .text(value);
            }
            // 3-c If the cell is in the upper triangle, fill in colored dot
            else if(i > j) {
                mat.append("circle")
                    .attr("cx", xCoor)
                    .attr("cy", yCoor)
                    .attr("r", dotSize(Math.abs(value)))
                    .style("fill", colorScale(value));
            }
        }
    }
}

// If the click event happened, switch the matrix
function switchCorrMatrix(sex) {
    console.log("Selected 'Sex' category:", sex);
    d3.select("svg").remove();
    let subData;
    switch(sex) {
        case "Female":
            subData = data_female;
            break;
        case "Infant":
            subData = data_infant;
            break;
        case "Male":
            subData = data_male;
            break;
    }
    if (subData) { // Check if subData is defined
        visualizeCorrMatrix(sex, subData);
    } else {
        // Handle the case when an invalid 'Sex' category is selected
        console.error("Invalid 'Sex' category selected.");
    }
}

// If the click event happened, switch the title
function updateTitle(sex) {
    d3.select("#title")
        .text(`Correlogram of ${sex} Abalone`);
}

// If the click event happened, switch the gradient box
function updateGradientBox(sex) {
    //console.log("updateGradientBox");

    const previousGradientBox = document.getElementById("gradient-box");
    if (previousGradientBox) {
        previousGradientBox.remove();
    }

    const gradientBox = document.createElement("div");
    gradientBox.id = "gradient-box";
    gradientBox.style.marginLeft = "20px";
    gradientBox.style.width = "435px";
    gradientBox.style.height = "20px";
    gradientBox.style.borderRadius = "5px";
    let colorStyle;
    switch(sex) {
        case "Female":
            colorStyle = "linear-gradient(to right, #67001F, #D0D0D0, #053061)";
            break;
        case "Infant":
            colorStyle = "linear-gradient(to right, #8F5418, #D0D0D0, #0b655d)";
            break;
        case "Male":
            colorStyle = "linear-gradient(to right, #FF6201, #D0D0D0, #2D005D)";
            break;
    }
    gradientBox.style.background = colorStyle;

    const legendContainer = document.querySelector(".legend-container");
    legendContainer.appendChild(gradientBox);
}

// The crucial part of clicking buttons and update everything
const sexCategories = ["Female", "Infant", "Male"];
const buttonsGroup = d3.select("#Buttons").append("g");
buttonsGroup.selectAll("button")
    .data(sexCategories)
    .enter().append("button")
    .text(d => d)
    .on("click", function() {
        const sex = d3.select(this).text();
        updateTitle(sex);
        switchCorrMatrix(sex);
        updateGradientBox(sex);
});