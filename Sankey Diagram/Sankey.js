// Load the data
async function getData() {
    try{
        const textUrl = "https://raw.githubusercontent.com/mm1719/DataSet/master/car.data";
        const text = await d3.text(textUrl);

        const colNames = "buying,maintenance,doors,persons,luggage_boot,safety,class\n";
        const modifiedText = colNames + text;

        const data = await d3.csvParse(modifiedText);
        //console.log(data);
        //downloadData(preData);
        completeSankeyLink(data);
        sankeyDiagram();
    } catch(error) {
        console.error("Error getting data: ", error);
    }
}

// This cool thing was generated from GPT, it downloads processed data in CSV format
function downloadData(data) {
    const headers = Object.keys(data[0]);
    let csvContent = headers.join(",") + "\n";
    //console.log(headers.join(", "));
    
    data.forEach(row => {
        const values = headers.map(header => row[header]);
        csvContent += values.join(",") + "\n";
        //console.log(values.join(","));
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "HW8_transformed_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// This is the structure for implementing the sankey diagram
// nodeId x has value with nodeId xi
// e.g. nodeId 1 has values with nodeId 11, 12, 13, 14
const sankeyData = {
    nodes : [ // All the nodes for the Sankey Diagram
        { nodeId: 1, name: "buying" },
        { nodeId: 2, name: "maintenance" },
        { nodeId: 3, name: "doors" },
        { nodeId: 4, name: "persons" },
        { nodeId: 5, name: "luggage_boot" },
        { nodeId: 6, name: "safety" },
        { nodeId: 11, name: "vhigh" },
        { nodeId: 12, name: "high" },
        { nodeId: 13, name: "med" },
        { nodeId: 14, name: "low" },
        { nodeId: 21, name: "vhigh" },
        { nodeId: 22, name: "high" },
        { nodeId: 23, name: "med" },
        { nodeId: 24, name: "low" },
        { nodeId: 31, name: "2" },
        { nodeId: 32, name: "3" },
        { nodeId: 33, name: "4" },
        { nodeId: 34, name: "5more" },
        { nodeId: 41, name: "2" },
        { nodeId: 42, name: "4" },
        { nodeId: 43, name: "more" },
        { nodeId: 51, name: "small" },
        { nodeId: 52, name: "med" },
        { nodeId: 53, name: "big" },
        { nodeId: 61, name: "low" },
        { nodeId: 62, name: "med" },
        { nodeId: 63, name: "high" },
        { nodeId: 9, name: "class" },
        { nodeId: 91, name: "unacc" },
        { nodeId: 92, name: "acc" },
        { nodeId: 93, name: "good" },
        { nodeId: 94, name: "vgood" },
    ],
    links: [ // Set up the left-side links: 1728/4=432, 1728/3=576
        { source: 1, target: 11, value: 432 },
        { source: 1, target: 12, value: 432 },
        { source: 1, target: 13, value: 432 },
        { source: 1, target: 14, value: 432 },
        { source: 2, target: 21, value: 432 },
        { source: 2, target: 22, value: 432 },
        { source: 2, target: 23, value: 432 },
        { source: 2, target: 24, value: 432 },
        { source: 3, target: 31, value: 432 },
        { source: 3, target: 32, value: 432 },
        { source: 3, target: 33, value: 432 },
        { source: 3, target: 34, value: 432 },
        { source: 4, target: 41, value: 576 },
        { source: 4, target: 42, value: 576 },
        { source: 4, target: 43, value: 576 },
        { source: 5, target: 51, value: 576 },
        { source: 5, target: 52, value: 576 },
        { source: 5, target: 53, value: 576 },
        { source: 6, target: 61, value: 576 },
        { source: 6, target: 62, value: 576 },
        { source: 6, target: 63, value: 576 },
    ]
};

// sourceIDs stores the sources values' ID
// targetIDs stores the target("class") values' ID
const sourceIDs = [11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34, 41, 42, 43, 51, 52, 53, 61, 62, 63];
const targetIDs = [91, 92, 93, 94];

// Use nodes.nodeId to get nodes.name
function getNodeNameByID(nodeId) {
    const node = sankeyData.nodes.find(n => n.nodeId === nodeId);
    //console.log(node);
    return node ? node.name : null;
}

// Calculates the value of the right-side links
function sumClassValue(data, tID) {
    const classFeature = getNodeNameByID(tID);
    console.log(classFeature);
    if (!classFeature) {
        console.error("invalid ID");
    }
    return data.filter(row => row.class === classFeature).length * 6;
}

// Calculates the value of the middle links
function featureToClass(data, sID, tID) {
    let sourceFeature = getNodeNameByID(sID);
    let targetFeature = getNodeNameByID(tID);

    let attrID = Number(String(sID)[0]);
    let attrName = getNodeNameByID(attrID);

    if (!attrName) {
        console.error("invalid ID");
    }
    let count = 0;
    for (let row of data) {
        if (row[attrName] === sourceFeature && row.class === targetFeature) {
            count++;
        }
    }
    return count;
}

// Append the remained links to sankeyData based on sumClassValue() and featureToClass()
function completeSankeyLink(data) {
    targetIDs.forEach(tID => {
        const value = sumClassValue(data, tID);
        const newlink = { source: tID, target: 9, value: value };
        sankeyData.links.push(newlink);
    });

    targetIDs.forEach(tID => {
        sourceIDs.forEach(sID => {
            const value = featureToClass(data, sID, tID);
            const newlink = { source: sID, target: tID, value: value };
            sankeyData.links.push(newlink);
        });
    });
    //console.log(sankeyData);
    //nodeIdtoRealID();
    //amplifyLink(5);
    nodeRename();
    console.log(sankeyData);
}

// Find the actual index of the node with the given nodeId
// e.g. the actual index of the node with nodeId = 1 is 0
function getNodeIndex(nodeId) {
    return sankeyData.nodes.findIndex(node => node.nodeId === nodeId);
}

// Relabel with the real ID, but this is no use anymore
function nodeIdtoRealID() {
    sankeyData.links = sankeyData.links.map(link => ({
        source: getNodeIndex(link.source),
        target: getNodeIndex(link.target),
        value: link.value
    }));
    console.log(sankeyData);
}

// Rename some nodes for better visualization
function nodeRename() {
    sankeyData.nodes[getNodeIndex(1)].name = "Buying";
    sankeyData.nodes[getNodeIndex(2)].name = "Maintenance";
    sankeyData.nodes[getNodeIndex(3)].name = "Doors";
    sankeyData.nodes[getNodeIndex(4)].name = "Persons";
    sankeyData.nodes[getNodeIndex(5)].name = "Luggage_boot";
    sankeyData.nodes[getNodeIndex(6)].name = "Safety";
    sankeyData.nodes[getNodeIndex(9)].name = "Class";

    sankeyData.nodes[getNodeIndex(11)].name += "(B)";
    sankeyData.nodes[getNodeIndex(12)].name += "(B)";
    sankeyData.nodes[getNodeIndex(13)].name += "(B)";
    sankeyData.nodes[getNodeIndex(14)].name += "(B)";

    sankeyData.nodes[getNodeIndex(21)].name += "(M)";
    sankeyData.nodes[getNodeIndex(22)].name += "(M)";
    sankeyData.nodes[getNodeIndex(23)].name += "(M)";
    sankeyData.nodes[getNodeIndex(24)].name += "(M)";

    sankeyData.nodes[getNodeIndex(31)].name += "_doors";
    sankeyData.nodes[getNodeIndex(32)].name += "_doors";
    sankeyData.nodes[getNodeIndex(33)].name += "_doors";
    sankeyData.nodes[getNodeIndex(34)].name = "5+_doors";

    sankeyData.nodes[getNodeIndex(41)].name += "_persons";
    sankeyData.nodes[getNodeIndex(42)].name += "_persons";
    sankeyData.nodes[getNodeIndex(43)].name = "5+_persons";

    sankeyData.nodes[getNodeIndex(51)].name += "_space";
    sankeyData.nodes[getNodeIndex(52)].name += "_space";
    sankeyData.nodes[getNodeIndex(53)].name += "_space";

    sankeyData.nodes[getNodeIndex(61)].name += "(S)";
    sankeyData.nodes[getNodeIndex(62)].name += "(S)";
    sankeyData.nodes[getNodeIndex(63)].name += "(S)";
}

// This is just a experiment, amplify the value won't change the width of the links
function amplifyLink(ratio) {
    sankeyData.links.forEach(link => {
        link.value = link.value * ratio;
    })
}

// Draw the Sankey Diagram and interaction features
function sankeyDiagram() {
    // Set the SVG
    const margin = { top: 10, right: 10, bottom: 10, left: 200 };
    const svgWidth = 1000 - margin.left - margin.right;
    const svgHeight = 800 - margin.top - margin.bottom;

    const svg = d3.select("#sankey-diagram")
        .append("svg")
        .attr("width", svgWidth + margin.left + margin.right)
        .attr("height", svgHeight + margin.top + margin.bottom);

    // Set the background color (used as boundary for dragging nodes)
    svg.append("rect")
        .attr("width", svgWidth)
        .attr("height", svgHeight + margin.bottom)
        .attr("x", margin.left)
        .attr("y", margin.top)
        .style("fill", "#EAEAEA")
        .style("border-radius", 100);

    // Set the diagram after setting the background
    const sankeyDiagram = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    // Set the color scale
    // Let the same sorts of weights have similar color
    const colorScale = d3.scaleOrdinal()
            .domain(["Buying", "vhigh(B)", "high(B)", "med(B)", "low(B)",
                     "Maintenance", "vhigh(M)", "high(M)", "med(M)", "low(M)",
                     "Doors", "2_doors", "3_doors", "4_doors", "5+_doors",
                     "Persons", "2_persons", "4_persons", "5+_persons",
                     "Luggage_boot", "small_space", "med_space", "big_space",
                     "Safety", "low(S)", "med(S)", "high(S)",
                     "Class", "unacc", "acc", "good", "vgood"])
            .range(["#FFD000", "#B39200", "#997D00", "#CCA700", "#E6BB00",
                    "#FF5900", "#993600", "#B33E00", "#CC4700", "#E65000",
                    "#FF7F00", "#994D00", "#B35900", "#CC6600", "#E67300",
                    "#0CB300", "#076600", "#088000", "#0A9900",
                    "#0099FF", "#00548C", "#006BB3", "#0082D9",
                    "#823DCC", "#512680", "#622E99", "#7236B3", 
                    "#990003", "#B30003", "#CC0003", "#E60004", "#FF0004"]);

    // Apply the d3-sankey plugin to caculate the position and width of the nodes and links
    const sankey = d3.sankey()
        .nodeWidth(20)
        .nodePadding(20)
        .size([svgWidth, svgHeight])
        .nodeId((d) => d.nodeId);

    const { nodes, links } = sankey({
        nodes: sankeyData.nodes,
        links: sankeyData.links
    });

    // Stores the original position for later reset
    nodes.forEach(node => {
        node.originalX0 = node.x0;
        node.originalX1 = node.x1;
        node.originalY0 = node.y0;
        node.originalY1 = node.y1;
    });

    // Draw the links of the diagram
    const link = sankeyDiagram.append("g")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.5)
        .selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke-width", d => d.width)
        .style("stroke", function(d) { return d.color = colorScale(d.source.name); });

    // Draw the nodes with labels and dragging feature
    const node = sankeyDiagram.append("g")
        .selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node");
    // Draw the nodes
    node.append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", sankey.nodeWidth())
        .attr("rx", 1)
        .attr("ry", 1)
        .style("fill", d => colorScale(d.name))
        .style("stroke", "black")
        .style("stroke-width", 1);
    // Draw the labels    
    node.append("text")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("x", d => d.x0)
        .attr("y", d => d.y1 + 7)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .text(d => d.name);
    // Apply dragging feature
    node.call(d3.drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded));
    // Dragging function
    const drag = d3.drag()
        .on("start", dragStarted)
        .on("drag", dragged);

    function dragStarted(event, d) {
        d3.select(this).raise();
        d.rectStartX = d.x0;
    }
    function dragged(event, d) {
        d.x0 += event.dx;
        d.x1 += event.dx;
        d.y0 += event.dy;
        d.y1 += event.dy;
        let xWidth = d.x1 - d.x0;
        let yHeight = d.y1 - d.y0;
        
        if (d.x0 < 0) { // Left bound
            d.x0 = 0;
            d.x1 = d.x0 + xWidth;
        }
        if (d.x1 > svgWidth) { // Right Bound
            d.x1 = svgWidth;
            d.x0 = d.x1 - xWidth;
        }
        if (d.y0 < 0) { // Ceiling
            d.y0 = 0;
            d.y1 = d.y0 + yHeight;
        }
        if (d.y1 > svgHeight) { // Floor
            d.y1 = svgHeight;
            d.y0 = d.y1 - yHeight;
        }

        // Move node and label simultanuously while dragging either a node or its label
        d3.select(this).attr("transform", `translate(${d.x0 - d.rectStartX},${d.y0 - d.rectStartY})`);
        d3.select(this).select("rect")
            .attr("x", d.x0)
            .attr("y", d.y0);
        d3.select(this).select("text")
            .attr("x", d.x0)
            .attr("y", d.y1 + 7);

        // Update the position
        sankey.update({ nodes, links });

        // Redraw links
        sankeyDiagram.selectAll("path")
            .data(links)
            .attr("d", d3.sankeyLinkHorizontal());
    }
    function dragEnded(event, d) {}

    // Apply tooltip feature
    const tooltip = d3.select("#tooltip");
    link.on("mouseover", (event, d) => {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);

        let sourceTotal = d.source.sourceLinks.reduce((total, link) => total + link.value, 0);
        let percentage = ((d.value / sourceTotal) * 100).toFixed(2);
        
        tooltip.style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        
        if (d.target.name !== "Class") { // Class would have the different content
            tooltip.html(`${d.source.name}: <br><strong>${percentage}% ${d.target.name}</strong>`);
        }
        else {
            let percent = (d.value / (1728 * 6 * 100)).toFixed(2);
            switch (d.source.name) {
                case "unacc":
                    tooltip.html(`Evalutation Level: <br><strong>unacceptable (${percent}%)</strong>`);
                case "acc":
                    tooltip.html(`Evalutation Level: <br><strong>acceptable (${percent}%)</strong>`);
                case "good":
                    tooltip.html(`Evalutation Level: <br><strong>good (${percent}%)</strong>`);
                case "vgood":
                    tooltip.html(`Evalutation Level: <br><strong>very good (${percent}%)</strong>`);
            }
        }
    })
    .on("mousemove", (event, d) => {
        let sourceTotal = d.source.sourceLinks.reduce((total, link) => total + link.value, 0);
        let percentage = ((d.value / sourceTotal) * 100).toFixed(2);
        
        tooltip.style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
        
        if (d.target.name !== "Class") { // Class would have the different content
            tooltip.html(`${d.source.name}: <br><strong>${percentage}% ${d.target.name}</strong>`);
        }
        else {
            let percent = (d.value / (1728 * 6) * 100).toFixed(2);
            switch (d.source.name) {
                case "unacc":
                    tooltip.html(`Evalutation Level: <br><strong>unacceptable (${percent}%)</strong>`);
                case "acc":
                    tooltip.html(`Evalutation Level: <br><strong>acceptable (${percent}%)</strong>`);
                case "good":
                    tooltip.html(`Evalutation Level: <br><strong>good (${percent}%)</strong>`);
                case "vgood":
                    tooltip.html(`Evalutation Level: <br><strong>very good (${percent}%)</strong>`);
            }
        }
    })
    .on("mouseout", () => {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    });

    // Apply the reset feature
    d3.select("#resetButton").on("click", resetDiagram);
    function resetDiagram() {
        sankeyData.nodes.forEach((node) => { // Get the original position
            node.x0 = node.originalX0;
            node.x1 = node.originalX1;
            node.y0 = node.originalY0;
            node.y1 = node.originalY1;
        })
        sankey.update({ nodes, links });

        sankeyDiagram.selectAll(".node rect") // Reset the position of the nodes
            .transition()
            .duration(100)
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0);

        sankeyDiagram.selectAll(".node text") // Reset the position of the labels
            .transition()
            .duration(100)
            .attr("x", d => d.x0)
            .attr("y", d => d.y1 + 7);
        
        sankeyDiagram.selectAll("path") // Reset the position of the links
            .transition()
            .duration(100)
            .attr("d", d3.sankeyLinkHorizontal());
    }
}

getData();