let playersData = [];

const widthA = 600;
const heightA = 400;

function fetchCSVData() {
    fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQgf7dDX0kmak9-vMcxSKa_560ubpjwRylvJBsoSw8BzCQ9vmowEuuv0R0XtLj4fPgEnizxWqk3pEbg/pub?gid=1938115636&single=true&output=csv")
        .then(response => response.text())
        .then(data => {
            const rows = data.split("\n").slice(1);
            playersData = rows.map(row => {
                const columns = row.split(",");
                return {
                    B: columns[1],
                    C: columns[2],
                    D: columns[3],
                    E: columns[4],
                    G: columns[6],
                    K: columns[10],
                    L: columns[11]
                };
            });
            console.log("Fetched and Parsed Data:", playersData);
            populatePlayerSelection();
            updateChart();  // Update the chart immediately after fetching the data
        })
        .catch(error => {
            console.error("Error fetching CSV data:", error);
        });
}


function populatePlayerSelection() {
    const container = document.getElementById('playerCheckboxContainer');
    container.innerHTML = '';

    playersData.forEach((player) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        playerDiv.dataset.playerName = player.B;
        playerDiv.innerText = player.B;

        playerDiv.addEventListener('click', togglePlayerSelection);
        container.appendChild(playerDiv);
    });
}

function togglePlayerSelection(event) {
    const playerDiv = event.currentTarget;
    const selectedPlayers = document.querySelectorAll('.player-item.selected');

    if (selectedPlayers.length < 4 || playerDiv.classList.contains('selected')) {
        playerDiv.classList.toggle('selected');
        updateChart();
    }
}


function updateChart() {
    const selectedPlayers = [...document.querySelectorAll('.player-item.selected')].map(div => div.dataset.playerName);
    console.log("Selected Players:", selectedPlayers);

    document.getElementById('roseChart').style.display = 'block';

    const titles = ["Suma\npunktów w grze", "Średnia\npunktów w grze", "Bramki", "Asysty", "Punkty za pozycję", "Średnia\npunktów za pozycję"];
    const keys = ['C', 'D', 'E', 'G', 'K', 'L'];

    const maxValues = {};
    keys.forEach(key => {
        maxValues[key] = d3.max(playersData, d => +d[key]);
    });
    const globalMaxValue = d3.max(Object.values(maxValues));

    const margin = { top: 50, right: 80, bottom: 50, left: 80 };
    const isPC = window.innerWidth >= 769;

    const width = widthA + margin.left + margin.right;
    const height = heightA + margin.top + margin.bottom;
    const radius = Math.min(width, height) / 2 - Math.max(margin.left, margin.right);

    const angleScale = d3.scaleBand()
        .range([0, 2 * Math.PI])
        .domain(keys);

    const radiusScale = d3.scaleLinear()
        .range([0, radius])
        .domain([0, globalMaxValue]);

    const svg = d3.select("#roseChart")
        .html("")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

    const colors = d3.scaleOrdinal()
        .domain(selectedPlayers)
        .range(d3.schemeSet2);

    const gridLevels = 7;
    for (let i = 1; i <= gridLevels; i++) {
        const gridRadius = radius * (i / gridLevels);
        const gridData = keys.map(key => {
            return { key: key, value: globalMaxValue * (i / gridLevels) };
        });
        gridData.push(gridData[0]);

        const gridLineGenerator = d3.lineRadial()
            .angle(d => angleScale(d.key) + angleScale.bandwidth() / 2)
            .radius(d => gridRadius);

        svg.append("path")
            .datum(gridData)
            .attr("fill", "none")
            .attr("stroke", "lightgray")
            .attr("stroke-width", 0.5)
            .attr("d", gridLineGenerator);
    }

    if (selectedPlayers.length === 0) {
        const maxData = keys.map(key => {
            return { key: key, value: globalMaxValue };
        });

        const lineGenerator = d3.lineRadial()
            .angle(d => angleScale(d.key) + angleScale.bandwidth() / 2)
            .radius(d => radiusScale(d.value));

        svg.append("path")
            .datum(maxData)
            .attr("fill", "lightgray")
            .attr("stroke", "gray")
            .attr("d", lineGenerator)
            .style("fill-opacity", 0.5);
    } else {
        const selectedData = playersData.filter(player => selectedPlayers.includes(player.B));
        selectedData.forEach(player => {
            const playerData = keys.map(key => {
                return { key: key, value: +player[key] / maxValues[key] * globalMaxValue };
            });

            console.log("Player Data for Rendering:", playerData);

            const lineGenerator = d3.lineRadial()
                .angle(d => angleScale(d.key) + angleScale.bandwidth() / 2)
                .radius(d => radiusScale(d.value));

            svg.append("path")
                .datum(playerData)
                .attr("fill", colors(player.B))
                .attr("stroke", colors(player.B))
                .attr("d", lineGenerator)
                .style("fill-opacity", 0.2);

            playerData.forEach(dataPoint => {
                svg.append("circle")
                    .attr("cx", Math.cos(angleScale(dataPoint.key) + angleScale.bandwidth() / 2 - Math.PI / 2) * radiusScale(dataPoint.value))
                    .attr("cy", Math.sin(angleScale(dataPoint.key) + angleScale.bandwidth() / 2 - Math.PI / 2) * radiusScale(dataPoint.value))
                    .attr("r", 4)
                    .attr("fill", colors(player.B))
                    .style("fill-opacity", 0.8);
            });
        });
    }

    // Determine font size based on window width
    const fontSize = window.innerWidth <= 768 ? "25px" : "12px";

    keys.forEach(key => {
        svg.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", Math.cos(angleScale(key) + angleScale.bandwidth() / 2 - Math.PI / 2) * radius)
            .attr("y2", Math.sin(angleScale(key) + angleScale.bandwidth() / 2 - Math.PI / 2) * radius)
            .attr("stroke", "lightgray");

        // Split the title into two lines based on the '\n' character
        const titleLines = titles[keys.indexOf(key)].split('\n');

        // First line of the title
        svg.append("text")
            .attr("x", Math.cos(angleScale(key) + angleScale.bandwidth() / 2 - Math.PI / 2) * (radius + 40))
            .attr("y", Math.sin(angleScale(key) + angleScale.bandwidth() / 2 - Math.PI / 2) * (radius + 40))
            .attr("text-anchor", "middle")
            .attr("dy", "-1em")  // Adjusted for two lines
            .style("font-size", fontSize)
            .text(titleLines[0]);

        // Second line of the title (if it exists)
        if (titleLines[1]) {
            svg.append("text")
                .attr("x", Math.cos(angleScale(key) + angleScale.bandwidth() / 2 - Math.PI / 2) * (radius + 40))
                .attr("y", Math.sin(angleScale(key) + angleScale.bandwidth() / 2 - Math.PI / 2) * (radius + 40))
                .attr("text-anchor", "middle")
                .attr("dy", "0.5em")  // Adjusted for two lines
                .style("font-size", fontSize)
                .text(titleLines[1]);
        }

        svg.append("text")
            .attr("x", Math.cos(angleScale(key) + angleScale.bandwidth() / 2 - Math.PI / 2) * (radius + 40))
            .attr("y", Math.sin(angleScale(key) + angleScale.bandwidth() / 2 - Math.PI / 2) * (radius + 40))
            .attr("text-anchor", "middle")
            .attr("dy", "1.5em")
            .style("font-size", fontSize)
            .text(`(Max: ${maxValues[key]})`);
    });

    const legend = svg.selectAll(".legend")
        .data(selectedPlayers)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => "translate(" + (width / 2 - 150) + "," + ((i * 20) - (selectedPlayers.length * 10) + height / 2 - 50) + ")");

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", colors);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(d => d);
}


// Fetch the CSV data when the script is loaded
fetchCSVData();

window.addEventListener('resize', updateChart);
