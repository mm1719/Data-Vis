// Define the properties of the svg element
const augSvgWidth = 1000;
const augSvgHeight = 600;
const svgWidth = 800;
const svgHeight = 500;
const margin = { top: 40, left: 40, bottom: 40, right: 40 };
const svg = d3.select("#parallel-plot")
    .attr("width", augSvgWidth)
    .attr("height", augSvgHeight);

// Initialize the original prder of the attributes
let attributes = ["sepal length", "sepal width", "petal length", "petal width"];
const xCoordinates = attributes.map((_, i) => margin.left + (i * (svgWidth - margin.left - margin.right) / (attributes.length - 1)));

let data
// Use the url to get iris.csv
async function getData(){
    try {
        const csvUrl = "https://raw.githubusercontent.com/mm1719/DataSet/9fee74b81a00afbf2cb1330a2f25cba67a272f21/iris.csv";
        data = await d3.csv(csvUrl);
        console.log(data);
        parallel_coordinate(data);
    } catch (error) {
        console.error("Error loading CSV file: ", error);
    }
}
getData();

function parallel_coordinate(data) {
    // Remove existing paths and axis elements
    svg.selectAll(".path-group").remove();
    svg.selectAll(".axis").remove();
    //svg.selectAll(".axis-label").remove();

    const colorScale = d3.scaleOrdinal()
        .domain(["Iris-setosa", "Iris-versicolor", "Iris-virginica"])
        .range(["#8C2020", "#80BFB4", "#1B618C"]);
    
    const scales = {};
    attributes.forEach(attr => {
        const minVal = d3.min(data, d => parseFloat(d[attr]));
        const maxVal = d3.max(data, d => parseFloat(d[attr]));
        const minInterval = (maxVal - minVal) * 0.1;
        scales[attr] = d3.scaleLinear()
            .domain([minVal - minInterval, maxVal + minInterval])
            .range([svgHeight - margin.bottom, margin.top]);
    });

    //console.log(xCoordinates);
    const lineGenerator = d3.line()
        .x((_, i) => xCoordinates[i])
        .y((d, i) => scales[attributes[i]](d))
        .curve(d3.curveLinear); //.curve(d3.curveMonotoneX);

    // Append paths to a group to easily remove them later
    const pathGroup = svg.append("g").attr("class", "path-group");

    pathGroup.selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("d", d => lineGenerator(attributes.map(attr => parseFloat(d[attr]))))
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d["class"]))
        .attr("stroke-width", 1);
    
    attributes.forEach((attr, i) => {
        const axis = d3.axisLeft(scales[attr]);
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(${xCoordinates[i]}, 0)`)
            .call(axis);
    });
}

// Define a drag behavior
const drag = d3.drag()
    .on("start", dragStarted)
    .on("drag", dragged)
    .on("end", dragEnded);

// Create a group for each label and apply drag behavior
const labelGroups = svg.selectAll(".label-group")
    .data(attributes)
    .enter()
    .append("g")
    .attr("class", "label-group")
    .attr("transform", (d, i) => `translate(${xCoordinates[i]}, ${svgHeight - 20})`)
    .call(drag);

// Append text elements to the label groups
labelGroups.append("text")
    .attr("class", "axis-label")
    .attr("dy", "0.71em")
    .attr("text-anchor", "middle")
    .text(d => d);

function dragStarted(event, d) {
    // Bring the dragged label to the front
    d3.select(this).raise();
}

function dragged(event, d) {
    const x = event.x;

    // Find the index of the nearest label position
    const newIndex = d3.bisect(xCoordinates, x);

    if (newIndex !== attributes.indexOf(d)) {
        // Swap the positions in the attributes array
        const oldIndex = attributes.indexOf(d);
        [attributes[oldIndex], attributes[newIndex]] = [attributes[newIndex], attributes[oldIndex]];

        // Update the positions of the labels
        svg.selectAll(".label-group")
            .attr("transform", (d, i) => `translate(${xCoordinates[attributes.indexOf(d)]}, ${svgHeight - 20})`);
    }
    parallel_coordinate(data)
}

function dragEnded(event, d) {
    // Check if the dragged label is at the right boundary
    const isAtRightBoundary = event.x >= xCoordinates[xCoordinates.length - 1];

    if (isAtRightBoundary) {
        // Place the label at the rightmost position
        const lastIndex = xCoordinates.length - 1;
        const currentIndex = attributes.indexOf(d);
        if (currentIndex !== lastIndex) {
            // Swap the positions in the attributes array
            [attributes[currentIndex], attributes[lastIndex]] = [attributes[lastIndex], attributes[currentIndex]];

            // Update the positions of the labels
            svg.selectAll(".label-group")
                .attr("transform", (d, i) => `translate(${xCoordinates[attributes.indexOf(d)]}, ${svgHeight - 20})`);
        }
    }
    parallel_coordinate(data)
}

// Append an instruction text element
svg.append("text")
    .attr("class", "instruction-text")
    .attr("x", svgWidth / 2 - 200)
    .attr("y", svgHeight + 50)
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .text("Drag a label and reorder the attributes !");