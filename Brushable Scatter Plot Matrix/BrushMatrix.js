// Load the data
let data
async function getData(){
    try {
        const csvUrl = "https://raw.githubusercontent.com/mm1719/DataSet/9fee74b81a00afbf2cb1330a2f25cba67a272f21/iris.csv";
        data = await d3.csv(csvUrl);
        scatter_plot_matrix(data);
    } catch (error) {
        console.error("Error loading CSV file: ", error);
    }
}
getData();

function scatter_plot_matrix(data) {
    // Load the svg
    const svgWidth = 700;
    const svgHeight = 700;
    const margin = {top: 10, left: 10, bottom: 10, right: 10};

    const svg = d3.select("#scatter_plot_matrix")
        .append("svg")
            .attr("width", svgWidth + margin.left + margin.right)
            .attr("height", svgHeight + margin.top + margin.bottom)
        .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
     
    // Define the attrubutes and some porperties of every plots
    const attributes = ["sepal length", "sepal width", "petal length", "petal width"];
    const colNum = attributes.length;

    const plotmargin = 15;
    const plotWidth = svgWidth / colNum;
    const plotHeight= svgHeight / colNum;

    const position = d3.scalePoint()
        .domain(attributes)
        .range([0, svgWidth - plotWidth]);

    const circleArrays = [];
    
    for (let i in attributes) {
        for (let j in attributes) {
            const attr1 = attributes[i];
            const attr2 = attributes[j];

            if (i === j) {  // Draw the histogram
                let xminVal = d3.min(data, d => parseFloat(d[attr1]));
                let xmaxVal = d3.max(data, d => parseFloat(d[attr1]));
                let xminInterval = (xmaxVal - xminVal) * 0.1;
                let xScale = d3.scaleLinear()
                    .domain([xminVal - xminInterval, xmaxVal + xminInterval]).nice()
                    .range([0, plotWidth - plotmargin * 2]);

                let plot = svg
                    .append("g")
                    .attr("transform", `translate(${position(attr1) + plotmargin}, ${position(attr2) + plotmargin})`);
                
                plot.append("g")
                    .attr("transform", `translate(0, ${plotHeight - plotmargin * 2})`)
                    .call(d3.axisBottom(xScale).ticks(3));
                
                const histogram = d3.histogram()
                    .value(function (d) { return parseFloat(d[attr1]); })
                    .domain(xScale.domain())
                    .thresholds(xScale.ticks(15));

                const bins = histogram(data);

                let yScale = d3.scaleLinear()
                    .range([plotHeight - plotmargin * 2, 0])
                    .domain([0, d3.max(bins, function(d) { return d.length; })]);
                
                plot.append("g")
                    .selectAll("rect")
                    .data(bins)
                    .join("rect")
                        .attr("x", 1)
                        .attr("transform", d => `translate(${xScale(d.x0)}, ${yScale(d.length)})`)
                        .attr("width", function(d) { return xScale(d.x1) - xScale(d.x0); })
                        .attr("height", function(d) { return (plotHeight - plotmargin * 2) - yScale(d.length); })
                        .style("fill", "#b8b8b8")
                        .attr("stroke", "white");
                
                plot.append("text")
                    .attr("transform", `translate(${plotWidth / 2 - plotmargin}, ${plotHeight - plotmargin * 2 - 3})`)
                    .attr("text-anchor", "middle")
                    .style("font", "bold 12px sans-serif")
                    .text(attributes[i]);
            }
            else if(i != j) {  // Draw the scatter plot
                let xminVal = d3.min(data, d => parseFloat(d[attr1]));
                let xmaxVal = d3.max(data, d => parseFloat(d[attr1]));
                let xminInterval = (xmaxVal - xminVal) * 0.1;
                let xScale = d3.scaleLinear()
                    .domain([xminVal - xminInterval, xmaxVal + xminInterval]).nice()
                    .range([0, plotWidth - plotmargin * 2]);

                let yminVal = d3.min(data, d => parseFloat(d[attr2]));
                let ymaxVal = d3.max(data, d => parseFloat(d[attr2]));
                let yminInterval = (ymaxVal - yminVal) * 0.1;
                let yScale = d3.scaleLinear()
                    .domain([yminVal - yminInterval, ymaxVal + yminInterval]).nice()
                    .range([plotWidth - plotmargin * 2, 0]);
                
                //console.log(xminVal, xmaxVal, yminVal, ymaxVal);
                //console.log(xScale, yScale);
                //console.log(parseFloat(data[attr1]));
                //console.log(parseFloat(data[attr2]));
                let plot = svg
                    .append("g")
                    .attr("transform", `translate(${position(attr1) + plotmargin}, ${position(attr2) + plotmargin})`);
                
                plot.append("g")
                    .attr("transform", `translate(0 ,${plotHeight - plotmargin * 2})`)
                    .call(d3.axisBottom(xScale).ticks(3));
                plot.append("g")
                    .call(d3.axisLeft(yScale).ticks(3));
                
                const circle = plot.selectAll("myCircles")
                    .data(data)
                    .join("circle")
                        .attr("cx", function(d) { return xScale(parseFloat(d[attr1])); })
                        .attr("cy", function(d) { return yScale(parseFloat(d[attr2])); })
                        .attr("r", 3)
                        .style("fill", d => {
                            switch(d["class"]){
                                case "Iris-setosa":
                                    return "#8C2020";
                                case "Iris-versicolor":
                                    return "#80BFB4";
                                case "Iris-virginica":
                                    return "#1B618C";
                                default:
                                    return "none";
                            }
                        })
                        .attr("fill-opacity", 0.7);
                
                const x0 = position(attr1) + plotmargin;
                const y0 = position(attr2) + plotmargin;
                const x1 = x0 + plotWidth - plotmargin * 2;
                const y1 = y0 + plotHeight - plotmargin * 2;
                
                circleArrays.push(circle);
                plot.call(brush, circle, circleArrays, svg, {plotmargin, plotWidth, plotHeight, xScale, yScale, attr1, attr2});
            }
        }
    }
    // Create the labels
    const dotsPos = [[10, 0], [100, 0], [210, 0]];
    const dotsColor = ["#8C2020", "#80BFB4", "#1B618C"];
    const dotGroup = svg.append("g");
    const dots = dotGroup
        .selectAll("circle")
        .data(dotsPos)
        .enter().append("circle");
    
    dots.attr("cx", (d) => d[0])
        .attr("cy", (d) => d[1])
        .attr("r", 5)
        .attr("fill", (d, i) => dotsColor[i])
        .attr("fill-opacity", 0.7);

    const labelPos = [[20, 4], [110, 4], [220, 4]];
    const labelNames = ["Iris Setosa", "Iris Versicolor", "Iris Virginica"];
    const labelGroup = svg.append("g");
    const labels = labelGroup
        .selectAll("text")
        .data(labelPos)
        .enter().append("text");

    labels.style("font", "bold 12px sans-serif")
        .attr("x", (d) => d[0])
        .attr("y", (d) => d[1])
        .text((d, i) => labelNames[i]);
}

// Dealing with the brushes issue
let brushPlot = null;

function brush(plot, circle, circleArrays, svg, {plotmargin, plotWidth, plotHeight, xScale, yScale, attr1, attr2}) {
    const brush = d3.brush()
        .extent([[0, 0], [plotWidth - plotmargin * 2, plotHeight - plotmargin * 2]])
        .on("start", brushStarted)
        .on("brush", brushed)
        .on("end", brushEnded);
    const brushRadious = "1";
    const unbrushRadious = "3";
    plot.call(brush);

    //console.log(plot);

    function brushStarted() { // Clean previous brushes, because the brushing area is not continuous
        //console.log(this);
        if (brushPlot !== null && brushPlot !== plot) {
            //console.log(brushPlot);
            brushPlot.call(d3.brush().clear);
        }
        brushPlot = plot;
        //console.log(brushPlot);
        circle.attr("r", unbrushRadious);
    }

    function brushed(event) { // Some pretty cool feature, you can search on Observable
        const [[x0, y0], [x1, y1]] = event.selection;

        let selectedData = [];

        const selected = data.filter(function (d) {
            const cx = xScale(parseFloat(d[attr1]));
            const cy = yScale(parseFloat(d[attr2]));
            return (x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1);
        });

        selectedData = selected;

        circleArrays.forEach((circles) => {
            circles.attr("r", function (d) {
                const cx = xScale(parseFloat(d[attr1]));
                const cy = yScale(parseFloat(d[attr2]));
                if (x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1) {
                    return unbrushRadious;
                } else {
                    return brushRadious;
                }
            });
        });
        //console.log(selectedData);
    }
    
    function brushEnded(event) { // Reset the circle size
        if (event.selection) return;
        circleArrays.forEach((circles) => {
            circles.attr("r", unbrushRadious);
        });
    }
}