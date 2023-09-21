let statsData = [];
let currentSortColumn = null;
let sortAscending = true;
let lastSortedTh = null;

window.onload = function() {
    fetchData('data', 'dataContainer');
    fetchData('stats', 'statsContainer', true);
    fetchData('dates', 'eventsContainer', false, true);
    showTable('dataContainer');
};

function fetchData(endpointType, containerId, isStats = false, isEvents = false) {
    let url;
    if (endpointType === 'data') {
        url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgf7dDX0kmak9-vMcxSKa_560ubpjwRylvJBsoSw8BzCQ9vmowEuuv0R0XtLj4fPgEnizxWqk3pEbg/pub?gid=117637307&single=true&output=csv";
    } else if (endpointType === 'stats'){
        url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgf7dDX0kmak9-vMcxSKa_560ubpjwRylvJBsoSw8BzCQ9vmowEuuv0R0XtLj4fPgEnizxWqk3pEbg/pub?gid=1938115636&single=true&output=csv";
    } else if (endpointType === 'dates'){
        url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgf7dDX0kmak9-vMcxSKa_560ubpjwRylvJBsoSw8BzCQ9vmowEuuv0R0XtLj4fPgEnizxWqk3pEbg/pub?gid=1145917757&single=true&output=csv";
    }

    fetch(url)
    .then(response => response.text()) // Always parse as CSV since all endpoints now return CSV
    .then(data => {
        const parsedData = parseCSV(data);

        if (isStats) {
            statsData = parsedData;
            displayData(statsData.slice(0, 9), containerId);
        } else if (isEvents) {
            console.log("Event data:", parsedData);
            filterAndDisplayEvents(parsedData, containerId);
        } else {
            const sortedData = sortByColumn(parsedData, 2, true);
            displayData(sortedData, containerId);
        }
    })
    .catch(error => {
        console.error(`There was an error fetching the data for ${containerId} from Google Sheets:`, error);
    });
}


function parseCSV(csvString) {
    const rows = csvString.trim().split('\n');
    return rows.map(row => row.split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1')));
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
        th.style.color = "white";
        th.classList.add('column100', `column${index+1}`, 'hov-column-ver1', 'respon4');
        
        if (containerId === 'statsContainer') {
            th.onclick = function() {
                // Reset styles for all th elements
                document.querySelectorAll(`#${containerId} th`).forEach(thElement => {
                    thElement.style.color = "white";
                    thElement.classList.remove("sorted-ascending", "sorted-descending");
                });

                if (currentSortColumn === index) {
                    sortAscending = !sortAscending;
                } else {
                    currentSortColumn = index;
                    sortAscending = true;
                }
                
                statsData = sortByColumn(statsData, currentSortColumn);
                lastSortedTh = th;
                displayData(statsData, containerId);
            };
            
            // Add sorting styles (if the column is sorted)
            if (currentSortColumn === index) {
                th.classList.add(sortAscending ? 'sorted-ascending' : 'sorted-descending');
                th.innerHTML = `${header} ${sortAscending ? '<i class="fa fa-arrow-up" style="color:black;"></i>' : '<i class="fa fa-arrow-down" style="color:black;"></i>'}`;
                th.style.color = sortAscending ? "green" : "red";
            }
        }
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Data rows
    for(let i=1; i<rows.length; i++) {
        const tr = document.createElement("tr");
        tr.classList.add('row100');
        rows[i].forEach((cell, index) => {
            const td = document.createElement("td");
            td.textContent = cell;
            td.classList.add('column100', `column${index+1}`, 'respon4');
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

function sortByColumn(data, columnIndex) {
    const headers = data[0];
    const rows = data.slice(1);

    const ascending = (columnIndex === currentSortColumn) ? sortAscending : true;

    rows.sort((a, b) => {
        let valA = a[columnIndex];
        let valB = b[columnIndex];

        // Check if values are numbers
        if (!isNaN(valA) && !isNaN(valB)) {
            valA = Number(valA);
            valB = Number(valB);
        }

        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
    });

    return [headers].concat(rows);
}

function showTable(containerToShow) {
    const containers = ['dataContainer', 'statsContainer', 'eventsContainer']; // Added 'eventsContainer'
    const titles = ['title1', 'title2', 'title3'];

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
        } else if (title === 'title3') {
            document.getElementById(title).style.display = (containerToShow !== 'dataContainer' && containerToShow !== 'statsContainer') ? "block" : "none";
        } else {
            document.getElementById(title).style.display = "none";
        }
    });

    const buttons = document.querySelectorAll('.table-button');
    buttons.forEach(button => {
        button.classList.remove('active');
    });

    if (containerToShow === 'dataContainer') {
        document.querySelector(".button-container .table-button:nth-child(1)").classList.add('active');
    } else if (containerToShow === 'statsContainer') {
        document.querySelector(".button-container .table-button:nth-child(2)").classList.add('active');
    } else {
        document.querySelector(".button-container .table-button:nth-child(3)").classList.add('active');
    }

    
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