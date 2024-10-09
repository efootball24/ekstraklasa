let statsData = [];
let currentSortColumn = null;
let sortAscending = true;
let lastSortedTh = null;

window.onload = function() {
    fetchData('data', 'dataContainer');
    fetchData('stats', 'statsContainer', true);
    fetchData('dates', 'eventsContainer', false, true);
    fetchData('rules', 'rulesContainer');
    fetchData('cards', 'cardsContainer');
    showTable('dataContainer');
    updateMarqueeWithLatestNews();
};

function fetchData(endpointType, containerId, isStats = false, isEvents = false, seasonName = 'Sezon 5') {
    let url;

    // Check if the season exists in the seasonUrls object
    if (seasonUrls.hasOwnProperty(seasonName)) {
        const seasonData = seasonUrls[seasonName];

        // Determine the URL based on the endpointType
        if (endpointType === 'data') {
            url = seasonData.data;
        } else if (endpointType === 'stats') {
            url = seasonData.stats;
        } else if (endpointType === 'dates') {
            url = seasonData.dates;
        } else if (endpointType === 'rules') {
            url = seasonData.rules;
        } else if (endpointType === 'cards') {
            url = seasonData.cards;
        }
    } else {
        // Handle the case when the selected season is not found
        console.error(`Season "${seasonName}" not found.`);
        return;
    }

    // Display Loading message
    const container = document.getElementById(containerId);
    container.innerHTML = "<p>Loading...</p>";
    // Fetch data from the dynamically determined URL
    fetch(url)
        .then(response => response.text())
        .then(data => {
            const parsedData = parseCSV(data);

            // Check if any row in parsedData contains #NAME?
            let containsError = parsedData.some(row => row.includes("#NAME?"));
            if (containsError) {
                console.log("#NAME? error found. Refreshing data...");
                setTimeout(() => fetchData(endpointType, containerId, isStats, isEvents, seasonName), 3000); // Retry after 3 seconds
                return;
            }

            if (isStats) {
                statsData = parsedData;
                displayData(statsData.slice(0, 9), containerId);
            } else if (isEvents) {
                filterAndDisplayEvents(parsedData, containerId);
            } else {
                // Ensure the `tabela` is always sorted by 'miejsce'
                const miejsceIndex = parsedData[0].indexOf("Miejsce");
                if (miejsceIndex !== -1) {
                    const sortedData = sortByColumn(parsedData, miejsceIndex, false);
                    displayData(sortedData, containerId);
                } else {
                    displayData(parsedData, containerId);
                }
            }
        })
        .catch(error => {
            console.error(`There was an error fetching the data for ${containerId} from Google Sheets:`, error);
        });
}

function parseCSV(csvString) {
    const rows = csvString.trim().split('\n');
    return rows.map(row => {
        let inQuotes = false;
        let cellBuffer = [];
        let cells = [];
        for (let char of row) {
            if (char === '"') {
                inQuotes = !inQuotes;
            }
            if (char === ',' && !inQuotes) {
                cells.push(cellBuffer.join('').trim().replace(/^"(.*)"$/, '$1'));
                cellBuffer = [];
            } else {
                cellBuffer.push(char);
            }
        }
        if (cellBuffer.length) {
            cells.push(cellBuffer.join('').trim().replace(/^"(.*)"$/, '$1'));
        }
        return cells;
    });
}

function areDatesEqual(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() && 
           date1.getMonth() === date2.getMonth() && 
           date1.getDate() === date2.getDate();
}

function resetTime(date) {
    date.setHours(0, 0, 0, 0);
    return date;
}

function fixCsvRow(row) {
    for (let i = 0; i < row.length; i++) {
        if (row[i].startsWith('"') && !row[i].endsWith('"')) {
            row[i] = row[i] + ',' + row[i + 1];
            row.splice(i + 1, 1);
        }
        row[i] = row[i].replace(/"/g, '');  // Removing the quotes for cleaned data
    }
    return row;
}

function formatMatch(score1, score2) {
    if (!score1 || !score2 || score1.trim() === '' || score2.trim() === '') {
        return '-';
    }
    return `${score1.trim()} - ${score2.trim()}`;
}

function filterAndDisplayEvents(rows, containerId) {
    if (!rows || rows.length === 0) {
        console.error("No rows provided");
        return;
    }

    // Adjust the header
    const headers = ['Runda', 'Kolejka', 'Data Od', 'Data Do', 'Drużyna Gospodarzy', 'Drużyna Gości', 'Mecz 1', 'Mecz 2', 'Mecz 3'];

    const dataRows = rows.slice(1).map(row => {
        row = fixCsvRow(row);
        const fixedRow = [
            row[0], row[1], row[2], row[3], row[4], row[5],
            formatMatch(row[6], row[7]),
            formatMatch(row[8], row[9]),
            formatMatch(row[10], row[11])
        ];
        return fixedRow;
    });

    // Re-adding the headers to the filtered rows for display
    const matchingEvents = [headers].concat(dataRows);

    displayData(matchingEvents, containerId); // Assuming you have displayData function
}

function displayData(rows, containerId) {
    const container = document.getElementById(containerId);

    if (!rows || !rows.length) {
        container.innerHTML = "No data available.";
        return;
    }

    const fixedHeaders = ["Drużyna", "Zawodnik"]; // List of headers to be fixed

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    table.classList.add('table100', 'ver1', 'm-b-110');
    tbody.classList.add('row100', 'body');

    // Header
    const headers = rows[0];
    const headerRow = document.createElement("tr");
    headerRow.classList.add('row100', 'head');

    headers.forEach((header, index) => {
        const th = document.createElement("th");
        th.textContent = header;
        th.classList.add('column100', `column${index + 1}`, 'hov-column-ver1', 'respon4');

        // Add fixed column class based on header
        if (fixedHeaders.includes(header)) {
            th.classList.add('fixed-column', 'fixed-column-header');
        }

        // Add click event listener for sorting only for stats table
        if (containerId === 'statsContainer') {
            th.addEventListener('click', () => {
                sortByColumnAndDisplay(rows, index, containerId);
            });
        }

        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Data rows
    const miejsceIndex = headers.indexOf("Miejsce");
    const kolejkaIndex = headers.indexOf("Kolejka");

    for (let i = 1; i < rows.length; i++) {
        const tr = document.createElement("tr");
        tr.classList.add('row100');

        // Apply different background color to every second row
        if (i % 2 === 0) {
            tr.classList.add('even-row'); // Add a class for even rows
        } else {
            tr.classList.add('odd-row'); // Add a class for odd rows
        }


        if (kolejkaIndex !== -1){
            var kolejkaValue = rows[i][kolejkaIndex];
            var kolVal = Number(kolejkaValue.substr(8, kolejkaValue.length))
            if (kolVal % 2 === 0){
                tr.classList.add('odd-kolejka');
            }
            else{
                tr.classList.add('even-kolejka');
            }
        }

        // Determine the class based on the value in the "Miejsce" column
        if (miejsceIndex !== -1) {
            const miejsceValue = rows[i][miejsceIndex];
            if (miejsceValue === "1") {
                tr.classList.add('gold-row');
            } else if (miejsceValue === "2") {
                tr.classList.add('silver-row');
            } else if (miejsceValue === "3") {
                tr.classList.add('bronze-row');
            }
        }

        

        rows[i].forEach((cell, index) => {
            const td = document.createElement("td");
            td.textContent = cell;
            td.classList.add('column100', `column${index + 1}`, 'respon4');

            // Add fixed column class based on header
            if (fixedHeaders.includes(headers[index])) {
                td.classList.add('fixed-column');
            }

            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    container.innerHTML = "";
    container.appendChild(table);

    if (containerId === 'statsContainer') {
        appendStatsButtons(container, rows, containerId);
    }
}







function appendStatsButtons(container, rows, containerId) {
    // Append expand button if 'statsContainer' and more than 8 rows
    if (statsData.length > 9 && rows.length < 10) {
        const expandButton = document.createElement('button');
        expandButton.textContent = "Więcej";
        expandButton.classList.add('btn', 'btn-primary');
        expandButton.onclick = function() {
            displayData(statsData, containerId);
            expandButton.style.display = 'none';
        };
        container.appendChild(expandButton);
    } else if (rows.length > 9) {
        const collapseButton = document.createElement('button');
        collapseButton.textContent = "Mniej";
        collapseButton.classList.add('btn', 'btn-primary');
        collapseButton.onclick = function() {
            displayData(statsData.slice(0, 9), containerId);
            collapseButton.style.display = 'none';
        };
        container.appendChild(collapseButton);
    }
}

function sortByColumn(data, columnIndex, ascending = true) {
    const headers = data[0];
    const rows = data.slice(1);

    rows.sort((a, b) => {
        let valA = a[columnIndex];
        let valB = b[columnIndex];

        // Check if values are numbers
        if (!isNaN(valA) && !isNaN(valB)) {
            valA = Number(valA);
            valB = Number(valB);
        }

        if (valA < valB) return ascending ? 1 : -1;  // Switch the comparison for descending order
        if (valA > valB) return ascending ? -1 : 1;
        return 0;
    });

    return [headers].concat(rows);
}

function sortByColumnAndDisplay(data, columnIndex, containerId) {
    const sortedData = sortByColumn(data, columnIndex, true); // Sort descending
    displayData(sortedData, containerId);
}

function showTable(containerToShow) {
    const containers = ['dataContainer', 'statsContainer', 'eventsContainer', 'roseChartContainer','rulesContainer','cardsContainer'];
    const titles = ['title1', 'title2', 'title3', 'title4','title5','title6','title7'];

    // Handle containers
    containers.forEach(container => {
        document.getElementById(container).style.display = container === containerToShow ? "block" : "none";
    });

    // Handle titles
    titles.forEach((title, index) => {
        if (containerToShow === 'dataContainer' && title === 'title1') {
            document.getElementById(title).style.display = "block";
        } else if (containerToShow === 'statsContainer' && title === 'title2') {
            document.getElementById(title).style.display = "block";
        } else if (containerToShow === 'eventsContainer' && title === 'title3') {
            document.getElementById(title).style.display = "block";
        } else if (containerToShow === 'roseChartContainer' && title === 'title4') {
            document.getElementById(title).style.display = "block";
        } else if (containerToShow === 'matchStatsContainer' && title === 'title5') {
            document.getElementById(title).style.display = "block";
        } else if (containerToShow === 'rulesContainer' && title === 'title6') {
            document.getElementById(title).style.display = "block";
        } else if (containerToShow === 'cardsContainer' && title === 'title7') {
            document.getElementById(title).style.display = "block";
        } else {
            document.getElementById(title).style.display = "none";
        }
    });

    const buttons = document.querySelectorAll('.table-button');
    buttons.forEach(button => {
        if (button.getAttribute('onclick') === `showTable('${containerToShow}')`) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function mergeColumns(rows) {
    if (!rows || rows.length === 0) {
        console.error("No rows provided");
        return [];
    }
    
    const headers = rows[0];
    // Add new headers for the merged data
    headers.push("Mecz 1", "Mecz 2", "Mecz 3"); 

    const dataRows = rows.slice(1).map(row => {
        const mergedValues = [];
        for(let i = 6; i <= 10; i+=2) {
            const number1 = row[i];
            const number2 = row[i+1];
            
            // Check if the values are undefined, null, or empty strings
            if (!number1 || !number2) {
                mergedValues.push("");  // Display as blank
            } else {
                mergedValues.push(`${number1}-${number2}`);
            }
        }

        // Return only columns A-F and the merged values, omitting original columns G-L
        return [...row.slice(0, 6), ...mergedValues];
    });

    // Adjust headers to reflect the new structure
    const adjustedHeaders = [...headers.slice(0, 6), ...headers.slice(headers.length-3)];

    return [adjustedHeaders, ...dataRows]; // Combine headers and data rows
}

/////////////////////////////////////////////////////////////// STATY

const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfKfFOYrb6Sic2oGFx3dy6bsnJ8Lgu2JLBvmvqmxAn4QleT_Q/formResponse';

function sendDataToGoogleForm(entryId) {
    const formData = new FormData();
    formData.append(entryId, 1); // Send integer value of 1

    fetch(FORM_URL, {
        method: 'POST',
        body: formData,
        mode: 'no-cors' // Important to avoid CORS issues
    });
}

// Send data when the page loads
sendDataToGoogleForm('entry.23596355'); // Assuming 'entry.23596355' is for page loads

// Attach the function to capture any click on the page
document.addEventListener('click', () => {
    sendDataToGoogleForm('entry.2128479794'); // Assuming 'entry.2128479794' is for clicks
});

// URL of the published CSV
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQnqY6Lnezz9Pc7werBeEfYn5s0Yjcl_Qrl0lTuqs7ulSdCmbMxNiE7vtLLYkYl9MTSyF0rolZ-8-_G/pub?gid=1138249290&single=true&output=csv';

// Function to fetch and display the counters
function fetchAndDisplayCounters() {
    fetch(CSV_URL)
        .then(response => response.text())
        .then(data => {
            // Split the CSV by lines and then by commas to get the values
            const lines = data.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            const values = lastLine.split(',');

            // Assuming the first value is "Page Loads" and the second value is "Button Clicks"
            const pageLoads = values[0];
            const buttonClicks = values[1];

            // Display the values in the footer
            document.getElementById('pageLoadsCounter').textContent = pageLoads;
            document.getElementById('buttonClicksCounter').textContent = buttonClicks;
        })
        .catch(error => {
            console.error('Error fetching the CSV data:', error);
        });
}

// Call the function to fetch and display the counters
fetchAndDisplayCounters();

let countdownInterval;

function parseEventDate(rawData) {
    console.log("Raw Data in parseEventDate:", rawData);

    const parsedDay = parseInt(rawData[0], 10);
    const parsedMonth = parseInt(rawData[1], 10) - 1; // JavaScript months are 0-indexed
    const parsedYear = parseInt(rawData[2], 10);

    if (!rawData[3]) {
        console.error("Time value is missing or undefined:", rawData[3]);
        return null;
    }

    const [hour, minute] = rawData[3].split(':').map(num => parseInt(num, 10));

    return new Date(parsedYear, parsedMonth, parsedDay, hour, minute);
}

function updateMarqueeWithLatestNews() {
    console.log("Loading latest news...");

    const marqueeContentElement = document.querySelector(".marquee-content");
    marqueeContentElement.innerHTML = "Loading latest news...";
    const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeypxxyN-DTlMdx4vFqKsSLi6Ao_0hBm3zUngymYyaW3P8FACjKFDNdn7QZ2ET3Te5odPohd9__gPj/pub?gid=588758860&single=true&output=csv";

    fetch(url)
        .then(response => response.text())
        .then(data => {
            const parsedData = parseCSV(data);

            // Skip the headers by slicing the array from the second element
            const newsItems = parsedData.slice(1);

            // Assuming you want the last 6 news items and the latest news should be displayed first
            const recentNews = newsItems.slice(-10).reverse();

            let marqueeContent = "";

            recentNews.forEach((news, index) => {
                const newsText = news[0];
                const newsLink = news[1];
                const time = news[5];

                if (newsLink && newsLink.trim() !== "" && time && time.trim() !== "") {
                    const eventDate = parseEventDate(news.slice(2, 6));
                    const countdownElementId = `countdown-${index}`;
                    startCountdown(eventDate, newsLink, countdownElementId);
                    marqueeContent += `| &nbsp;&nbsp;&nbsp; ${newsText} &nbsp; ♦ &nbsp; Mecz za: <span id="${countdownElementId}"></span> &nbsp;&nbsp;&nbsp; `;
                } else if (newsLink && newsLink.trim() !== "") {
                    marqueeContent += `| &nbsp;&nbsp;&nbsp; <a href="${newsLink}" target="_blank">${newsText}</a> &nbsp;&nbsp;&nbsp; `;
                } else {
                    marqueeContent += `| &nbsp;&nbsp;&nbsp; ${newsText} &nbsp;&nbsp;&nbsp; `;
                }
            });

            marqueeContentElement.innerHTML = marqueeContent;
        })
        .catch(error => {
            console.error(`There was an error fetching the latest news from Google Sheets:`, error);
        });
}

// Map to store intervals for each news item
const countdownIntervals = new Map();

function startCountdown(eventDate, newsLink, countdownElementId) {
    if (countdownIntervals.has(countdownElementId)) {
        clearInterval(countdownIntervals.get(countdownElementId));
    }

    const interval = setInterval(() => {
        const now = new Date();
        const timeDifference = eventDate - now;

        if (timeDifference <= 0 && timeDifference > -2*60*60*1000) { // 2 hours in milliseconds
            clearInterval(interval);
            document.getElementById(countdownElementId).innerHTML = `<a href="${newsLink}" target="_blank">JUŻ TRWA! Kliknij aby oglądać!</a>`;
        } else if (timeDifference <= -2*60*60*1000) {
            clearInterval(interval);
            document.getElementById(countdownElementId).textContent = "Mecz zakończony.";
        } else {
            const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

            document.getElementById(countdownElementId).textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
    }, 1000);

    countdownIntervals.set(countdownElementId, interval);
}

document.addEventListener("DOMContentLoaded", function() {
    const marqueeContent = document.querySelector('.marquee-content');
    const viewportWidth = window.innerWidth;
    const contentWidth = marqueeContent.offsetWidth;

    // Calculate the percentage of the animation duration the content is off-screen
    const offScreenPercentage = (contentWidth / (viewportWidth + contentWidth)) * 100;

    // Adjust the animation duration and starting position
    const adjustedDuration = (50 * (100 / (100 - offScreenPercentage))).toFixed(2);
    marqueeContent.style.animationDuration = `${adjustedDuration}s`;
    marqueeContent.style.transform = `translateX(${offScreenPercentage}%)`;
});

////// SEZON

const seasonUrls = {
    'Sezon 1': {
        data: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRE_Hb9uaodKomArVWusZ859UDDPIEfcpwCTFhK5_yhcSs4bB_tMK58qPStIvbNcNjutZp2B2vcFxEK/pub?gid=117637307&single=true&output=csv",
        stats: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRE_Hb9uaodKomArVWusZ859UDDPIEfcpwCTFhK5_yhcSs4bB_tMK58qPStIvbNcNjutZp2B2vcFxEK/pub?gid=1938115636&single=true&output=csv",
        dates: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRE_Hb9uaodKomArVWusZ859UDDPIEfcpwCTFhK5_yhcSs4bB_tMK58qPStIvbNcNjutZp2B2vcFxEK/pub?gid=1145917757&single=true&output=csv"
    },
    'Sezon 2': {
        data: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgf7dDX0kmak9-vMcxSKa_560ubpjwRylvJBsoSw8BzCQ9vmowEuuv0R0XtLj4fPgEnizxWqk3pEbg/pub?gid=117637307&single=true&output=csv",
        stats: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgf7dDX0kmak9-vMcxSKa_560ubpjwRylvJBsoSw8BzCQ9vmowEuuv0R0XtLj4fPgEnizxWqk3pEbg/pub?gid=1938115636&single=true&output=csv",
        dates: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgf7dDX0kmak9-vMcxSKa_560ubpjwRylvJBsoSw8BzCQ9vmowEuuv0R0XtLj4fPgEnizxWqk3pEbg/pub?gid=1145917757&single=true&output=csv"
    },
    'Sezon 3': {
        data: "https://docs.google.com/spreadsheets/d/e/2PACX-1vToQgsvV8cnFKGsEETpFOGeDSHpd-yzBT0Jg_-YqCxyjGhVRk6Zs0fuvVsGcy_YGeU46Xk3JzsXnsKk/pub?gid=117637307&single=true&output=csv",
        stats: "https://docs.google.com/spreadsheets/d/e/2PACX-1vToQgsvV8cnFKGsEETpFOGeDSHpd-yzBT0Jg_-YqCxyjGhVRk6Zs0fuvVsGcy_YGeU46Xk3JzsXnsKk/pub?gid=1335223581&single=true&output=csv",
        dates: "https://docs.google.com/spreadsheets/d/e/2PACX-1vToQgsvV8cnFKGsEETpFOGeDSHpd-yzBT0Jg_-YqCxyjGhVRk6Zs0fuvVsGcy_YGeU46Xk3JzsXnsKk/pub?gid=1145917757&single=true&output=csv"
    },
    'Sezon 4': {
        data: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnToJOs6DL0tKymqDQed1mmKNndVBMEcPrx9ETSgn3FJTa9s_GRiJ2f4fXNK28ywCltoI3mEWv26dK/pub?gid=117637307&single=true&output=csv",
        stats: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnToJOs6DL0tKymqDQed1mmKNndVBMEcPrx9ETSgn3FJTa9s_GRiJ2f4fXNK28ywCltoI3mEWv26dK/pub?gid=1335223581&single=true&output=csv",
        dates: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnToJOs6DL0tKymqDQed1mmKNndVBMEcPrx9ETSgn3FJTa9s_GRiJ2f4fXNK28ywCltoI3mEWv26dK/pub?gid=1145917757&single=true&output=csv"
    }
    ,
    'Sezon 5': {
        data: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeypxxyN-DTlMdx4vFqKsSLi6Ao_0hBm3zUngymYyaW3P8FACjKFDNdn7QZ2ET3Te5odPohd9__gPj/pub?gid=117637307&single=true&output=csv",
        stats: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeypxxyN-DTlMdx4vFqKsSLi6Ao_0hBm3zUngymYyaW3P8FACjKFDNdn7QZ2ET3Te5odPohd9__gPj/pub?gid=1335223581&single=true&output=csv",
        dates: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeypxxyN-DTlMdx4vFqKsSLi6Ao_0hBm3zUngymYyaW3P8FACjKFDNdn7QZ2ET3Te5odPohd9__gPj/pub?gid=1145917757&single=true&output=csv",
        rules:  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeypxxyN-DTlMdx4vFqKsSLi6Ao_0hBm3zUngymYyaW3P8FACjKFDNdn7QZ2ET3Te5odPohd9__gPj/pub?gid=1263205549&single=true&output=csv",
        cards: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeypxxyN-DTlMdx4vFqKsSLi6Ao_0hBm3zUngymYyaW3P8FACjKFDNdn7QZ2ET3Te5odPohd9__gPj/pub?gid=409080995&single=true&output=csv"
    }
    // Add more seasons here as needed
};

function updateSeasonText(season) {
    document.getElementById('season-text').innerText = season;
}

function updateSeason(seasonName) {
    if (seasonUrls.hasOwnProperty(seasonName)) {
        const seasonData = seasonUrls[seasonName];
        
        // Fetch and display data for each container
        fetchData('data', 'dataContainer');
        fetchData('stats', 'statsContainer', true);
        fetchData('dates', 'eventsContainer', false, true);
        fetchData('rules', 'rulesContainer');
        fetchData('cards', 'cardsContainer');
    } else {
        // Handle the case when the selected season is not found
        console.error(`Season "${seasonName}" not found.`);
    }
}
