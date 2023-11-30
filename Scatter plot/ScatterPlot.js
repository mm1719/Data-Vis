let dataGet

// Use the url to get iris.csv
async function getData() {
  try {
    const csvUrl = 'https://raw.githubusercontent.com/mm1719/DataSet/9fee74b81a00afbf2cb1330a2f25cba67a272f21/iris.csv';
    dataGet = await d3.csv(csvUrl);
    scatter(dataGet);
  } catch (error) {
    console.error('Error loading CSV file: ', error);
  }
}
getData();

// Initialize x's and y's attributes
let xAttr = "sepal length"
let yAttr = "sepal length"

// If the id from the menu changes, update the attributes
function updateScatterPlot(){
  xAttr = document.getElementById('dropdown-X').value;
  yAttr = document.getElementById('dropdown-Y').value;
  scatter(dataGet);
}
document.getElementById('dropdown-X').addEventListener('change', updateScatterPlot);
document.getElementById('dropdown-Y').addEventListener('change', updateScatterPlot);

// Draw the scatter plot
function scatter(data){
  d3.select(".scatter-plot").select('svg').remove();
  
  irisType = "class"
  
  // Set the porperty of svg
  const svgWidth = 500
        svgHeight = 500
        margin = 40
  const svg = d3.select(".scatter-plot")
          .append('svg')
          .attr('width', svgWidth)
          .attr('height', svgHeight)
  
  // Set up x-axis        
  const xScale = d3.scaleLinear()
                   .domain([d3.min(data, d => parseFloat(d[xAttr])) -1, 
                            d3.max(data, d => parseFloat(d[xAttr])) +1])
                   .range([0, (svgWidth - margin*2)])
  const xAxis = d3.axisBottom(xScale)
  svg.append('g')
     .attr('transform', `translate(${margin}, ${svgHeight - margin/2})`)
     .call(xAxis);

  // Set up y-axis    
  const yScale = d3.scaleLinear()
                   .domain([d3.min(data, d => parseFloat(d[yAttr])) -1, 
                            d3.max(data, d => parseFloat(d[yAttr])) +1])
                   .range([(svgHeight - margin), 0])
  const yAxis = d3.axisLeft(yScale)
  svg.append('g')
     .attr('transform', `translate(${margin}, ${margin/2})`)
     .call(yAxis)
  
  const legendColors = {
    'Iris-setosa': '#8C2020',
    'Iris-versicolor': '#80BFB4',
    'Iris-virginica': '#1B618C',
  };

  // Add circles (dots) and labels to the legend
  const legend = d3.select('.legend');
  const legendItems = legend.selectAll('.legend-item')
                            .data(Object.keys(legendColors))
                            .enter()
                            .append('div')
                            .attr('class', 'legend-item');

  const legendSvg = legendItems.append('svg')
                               .attr('width', 120)
                               .attr('height', 20)

  const legendGroup = legendSvg.append('g')
                               .attr('transform', 'translate(5, 10)'); // Adjust the position as needed

  legendGroup.append('circle')
             .attr('cx', 5) // X-coordinate of the circle's center
             .attr('cy', 0) // Y-coordinate of the circle's center
             .attr('r', 5)
             .attr('fill', d => legendColors[d]);

  legendGroup.append('text')
             .attr('x', 15) // X-coordinate of the text
             .attr('y', 0)
             .attr('dy', '0.35em') // Adjust vertical alignment as needed
             .text(d => d);

  // Draw the scatter points
  svg.append('g')
     .selectAll('dot')
     .data(data)
     .enter()
     .append('circle')
     .attr('cx', d => xScale(parseFloat(d[xAttr])))
     .attr('cy', d => yScale(parseFloat(d[yAttr])))
     .attr('r', 1.5)
     .style('fill', d => {
      switch(d[irisType]){
        case "Iris-setosa":
          return '#8C2020';
          break;
        case "Iris-versicolor":
          return '#80BFB4';
          break;
        case "Iris-virginica":
          return '#1B618C';
          break;
        }
      })
}

// RWD
d3.select(window).on("resize", function(){
  scatter(dataGet)
});