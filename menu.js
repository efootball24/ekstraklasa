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

    // Fetch data for rules
    fetchData('rules', 'rulesContainer', true, false, "Sezon 6");

    // Fetch data for rules
    fetchData('cards', 'cardsContainer', true, false, "Sezon 6");

    // Update the season text
    if(season != "Sezon 6")
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
            break;
        case 'Sezon 2':
            document.body.style.background = 'linear-gradient(to bottom right, #eca2ff, #1d2783)';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundSize = '100% 100%';
            break;
        case 'Sezon 3':
            document.body.style.background = 'linear-gradient(to bottom right, #eff1c5, #035e7b)';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundSize = '100% 100%';
            break;
        case 'Sezon 4':
            document.body.style.background = 'linear-gradient(to bottom right, #ff9e00, #9d4edd)';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundSize = '100% 100%';
            break;
        case 'Sezon 5':
            document.body.style.background = 'linear-gradient(to bottom right,  #C7253E, #FABC3F)';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundSize = '100% 100%';
            break;
        case 'Sezon 6':
            document.body.style.background = 'linear-gradient(135deg, #3a1c71, #d76d77, #ffaf7b)';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundSize = '100% 100%';
            break;
        // Add more cases for other seasons if needed
    }

}


