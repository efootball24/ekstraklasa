function toggleSubButtons(subButtonContainerId) {
    console.log("Function toggleSubButtons called."); // Debugging log

    // Get the specific sub-button container
    var subButtons = document.getElementById(subButtonContainerId);

    // Toggle the display of the sub-buttons
    if (subButtons.style.display === 'none' || subButtons.style.display === '') {
        subButtons.style.display = 'flex';
    } else {
        subButtons.style.display = 'none';
    }
}

document.addEventListener('click', function(event) {
    var isClickInsideMainButton = document.getElementById('statystykiMainButton').contains(event.target);
    var isClickInsideDropdown = document.getElementById('statystykiSubButtons').contains(event.target);

    if (!isClickInsideMainButton && !isClickInsideDropdown) {
        document.getElementById('statystykiSubButtons').style.display = 'none';
        document.getElementById('statystykiMainButton').classList.remove('active');
    }

    isClickInsideMainButton = document.getElementById('sezonMainButton').contains(event.target);
    isClickInsideDropdown = document.getElementById('sezonSubButtons').contains(event.target);

    if (!isClickInsideMainButton && !isClickInsideDropdown) {
        document.getElementById('sezonSubButtons').style.display = 'none';
        document.getElementById('sezonMainButton').classList.remove('active');
    }
});

function fetchAndChangeSeason(season) {
    // Fetch data for the main table
    fetchData('data', 'dataContainer', false, false, season);

    // Fetch data for stats
    fetchData('stats', 'statsContainer', true, false, season);

    // Fetch data for events
    fetchData('dates', 'eventsContainer', false, true, season);

    // Update the season text
    if(season != "Sezon 2")
    {
        updateSeasonText("Archiwum: "+season);
    }else{
        updateSeasonText(season);
    }
    

    //STATY
    window.fetchCSVData(season);

        // Change background color based on the season
    // Change background color based on the season
    switch(season) {
        case 'Sezon 1':
            document.body.style.background = 'grey';
            document.documentElement.style.background = 'grey';
            break;
        case 'Sezon 2':
            document.body.style.background = '';
            document.documentElement.style.background = 'linear-gradient(to bottom right, #eca2ff, #1d2783)';
            document.documentElement.style.backgroundRepeat = 'no-repeat';
            document.documentElement.style.height = '100%'; 
            document.documentElement.style.fontFamily = 'Arial, sans-serif';
            document.documentElement.style.padding= '40px 40px'; 
            document.documentElement.style.textAlign= 'center';
            document.documentElement.style.backgroundAttachment= 'fixed';
            document.documentElement.style.backgroundSize= '100% 100%';
            document.documentElement.style.margin= '0';
            break;
        // Add more cases for other seasons if needed
    }

}


