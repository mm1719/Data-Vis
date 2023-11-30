// Load the data
let predata, score_data, rank_data, default_score_data, default_rank_data
async function getData(){
    try {
        const csvUrl = "https://raw.githubusercontent.com/mm1719/DataSet/master/TIMES_WorldUniversityRankings_2024.csv";
        predata = await d3.csv(csvUrl);
        
        // Filter out the data to avoid universities without ranking
        predata = predata.filter(function(d) {
            return d.scores_overall !== "n/a";
        });
        //console.log(predata);

        predata.forEach(function(d) {
            d.rank = d.rank.replace("=", "");
            d.rank = d.rank.replace("+", "");
        });
        default_score_data = predata.map(function(d) {
            return { // score data stores the scores
                rank: d.rank,
                name: d.name,
                overall: d.scores_overall,
                teaching: +d.scores_teaching,
                research: +d.scores_research,
                citations: +d.scores_citations,
                industry_income: +d.scores_industry_income,
                international_outlook: +d.scores_international_outlook,
            };
        });
        default_rank_data = predata.map(function(d) {
            return { // rank data stores the rank
                rank: d.rank,
                name: d.name,
                overall_rank: +d.scores_overall_rank,
                teaching_rank: +d.scores_teaching_rank,
                research_rank: +d.scores_research_rank,
                citations_rank: +d.scores_citations_rank,
                industry_income_rank: +d.scores_industry_income_rank,
                international_outlook_rank: +d.scores_international_outlook_rank
            };
        });
        console.log(default_score_data);
        //console.log(default_rank_data[0]);

        score_data = [...default_score_data];
        rank_data = [...default_rank_data];
        //console.log(score_data);

        // Using default data to store the orignal dataset cause the ranking is not sortable
        stacked_bar_chart(default_score_data, default_rank_data);
    } catch (error) {
        console.error("Error loading CSV file: ", error);
    }
}
getData();

function stacked_bar_chart(univ_score, univ_rank) {
    //console.log(univ_score);
    const stackedBarChart = d3.select("#stacked_bar_chart");
    const tooltip = d3.select("#tooltip");

    // Define the svg
    const svgWidth = 1000;
    const svgHeight = 50000;
    const svgMargin = {top: 20, left: 350, right: 120, bottom: 40};

    const svg = stackedBarChart.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    
    // Define and draw the x-axis the
    const xScale = d3.scaleLinear()
        .domain([0, 500])
        .range([svgMargin.left, svgWidth - svgMargin.right]);

    const xAxisGroup = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${svgMargin.top})`);

    const xAxis = d3.axisTop(xScale);
    xAxisGroup.call(xAxis);
    xAxisGroup.selectAll(".tick text")
        .style("font-size", "8px");

    // Define and draw the y-axis
    const yScale = d3.scaleBand()
        .domain(univ_score.map(d => d.name))
        .range([svgMargin.top, svgHeight - svgMargin.bottom])
        .padding(0.1);

    const yAxisGroup = svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${svgMargin.left}, ${svgMargin.top - 10})`);

    const yAxis = d3.axisLeft(yScale);
    yAxisGroup.call(yAxis);
    yAxisGroup.selectAll("text")
        .attr("x", -5)
        .style("text-anchor", "end");
    
    yAxisGroup.selectAll(".tick text")
        .style("font-size", "8px");

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const attributeNames = Object.keys(univ_score[0]).slice(3);
    //console.log(attributeNames);
    const stack = d3.stack()
        .keys(attributeNames)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);
    
    //console.log(univ_score[0]);
    //console.log(univ_rank[0]);
    const stackedData = stack(univ_score);

    const barsGroup = svg.append("g")
        .attr("class", "bars-group")
        .attr("transform", `translate(0, ${svgMargin.top - 10})`);
    
    // Draw the stacked bar chart
    barsGroup.selectAll("g")
        .data(stackedData)
        .enter().append("g")
        .attr("fill", d => colorScale(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => xScale(d[0]))
        .attr("y", d => yScale(d.data.name))
        .attr("height", yScale.bandwidth())
        .attr("width", d => xScale(d[1]) - xScale(d[0]))
        .on("mouseover", function(event, d) {
            const rank = d.data.rank;
            const overall_score = d.data.overall;
            const overall_score_rank = getRankBySection(d.data, "overall", univ_rank);
            const criteria = d3.select(this.parentNode).datum().key;
            const score = d.data[criteria];
            const score_rank = getRankBySection(d.data, criteria, univ_rank);
            const name = d.data.name;
            //console.log("Mouse over!");
            //console.log(overall_rank);
            //console.log("scores_overall");
            //console.log(score_rank);
            //<p><strong>Overall Score Rank:</strong> ${overall_score_rank}</p>
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 30) + "px")
                .html(`
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Rank:</strong> ${rank}</p>
                    <p><strong>Overall Score:</strong> ${overall_score}</p>
                    <p><strong>Score in ${criteria}:</strong> ${score}</p>
                    <p><strong>Rank in ${criteria}:</strong> ${score_rank}</p>
                `)
                .style("opacity", 1);
        })
        .on("mouseout", function(){
            //console.log("Mouse out!");
            tooltip.style("opacity", 0);
        })
}


// Since I split the data into rank and score, I need a function to map them for neccessary
function getRankBySection(data, criteria, univ_rank) {
    //console.log(data);
    //console.log(criteria);
    const matchingRank = univ_rank.find(d => d.name === data.name);
    //console.log(matchingRank);
    if(matchingRank) {
        //console.log(criteria + "_rank");
        return matchingRank[criteria + "_rank"];
    }
    else {
        return "N/A";
    }
}


// All the code below are for the button, sorting and update part
let currentCriterion = "default";
//let isReversed = false;
function updateSorting(criterion) {
    currentCriterion = criterion;
    if(currentCriterion === "default") {
        updateChart(false);
        updateTitle("overall")
        return;
    };
    score_data.sort((a, b) => {
        const aRank = rank_data.find(d => d.name === a.name)[criterion + "_rank"];
        const bRank = rank_data.find(d => d.name === b.name)[criterion + "_rank"];
        return aRank - bRank;
    });
    //console.log(score_data);
    updateChart(true);
    updateTitle(criterion);
}
function reverseOrder() {
    score_data.reverse();
    reverseChart();
}
document.getElementById("default-sort").addEventListener("click", () => updateSorting("default"));
document.getElementById("teaching-sort").addEventListener("click", () => updateSorting("teaching"));
document.getElementById("research-sort").addEventListener("click", () => updateSorting("research"));
document.getElementById("citation-sort").addEventListener("click", () => updateSorting("citations"));
document.getElementById("industry-sort").addEventListener("click", () => updateSorting("industry_income"));
document.getElementById("international-sort").addEventListener("click", () => updateSorting("international_outlook"));
document.getElementById("reverse-sort").addEventListener("click", () => reverseOrder());

function updateChart(flag) {
    d3.select("#stacked_bar_chart").selectAll("*").remove();
    if (!flag) {
        score_data = [...default_score_data];
        rank_data = [...default_rank_data];
    }
    stacked_bar_chart(score_data, rank_data);
}

function reverseChart() {
    d3.select("#stacked_bar_chart").selectAll("*").remove();
    stacked_bar_chart(score_data, rank_data); // Redraw the chart with the reversed data
}

function updateTitle(criterion) {
    d3.select("#title")
        .text(`Times World University Ranking 2024 (rank in ${criterion})`);
}