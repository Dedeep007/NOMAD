// --- Basic JavaScript for Screen Navigation Simulation ---
const screens = document.querySelectorAll('.screen');
const loadingMessages = ["Analyzing weather patterns for Goa...", "Checking local news for the latest vibe...", "Calculating travel times and distances...", "Finding top-rated adventurous spots...", "Crafting your personalized itinerary..."];
let messageInterval;

function showScreen(id) {
    screens.forEach(screen => screen.classList.remove('active'));
    const screenElement = document.getElementById(id);
    if (screenElement) {
        screenElement.classList.add('active');
    }


    if (id === 'screen3') {
        startLoadingAnimation();
        setTimeout(() => showScreen('screen4'), 5000);
    } else {
        stopLoadingAnimation();
    }

    // Initialize map when screen 4 is shown
    if (id === 'screen4' && !window.mapInitialized) {
        initializeMap();
        window.mapInitialized = true;
    }
}

function startLoadingAnimation() {
    const loadingTextElement = document.getElementById('loading-text');
    let currentMessageIndex = 0;
    if(loadingTextElement) {
        loadingTextElement.textContent = loadingMessages[currentMessageIndex];
        messageInterval = setInterval(() => {
            currentMessageIndex = (currentMessageIndex + 1) % loadingMessages.length;
            loadingTextElement.textContent = loadingMessages[currentMessageIndex];
        }, 1000);
    }
}

function stopLoadingAnimation() {
    clearInterval(messageInterval);
}

function simulateSelection(button) {
    console.log('simulateSelection called with:', button);
    
    // Remove 'selected' class from all buttons in the button group
    const allButtons = document.querySelectorAll('.button-group button');
    console.log('Found buttons:', allButtons.length);
    
    allButtons.forEach(btn => {
        btn.classList.remove('selected');
        console.log('Removed selected from button:', btn.textContent);
    });
    
    // Add 'selected' class to clicked button
    button.classList.add('selected');
    console.log('Added selected to button:', button.textContent);
    console.log('Button classes now:', button.classList.toString());
}

// Also add event listeners as backup
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up button event listeners...');
    const buttons = document.querySelectorAll('.button-group button');
    console.log('Found buttons for event listeners:', buttons.length);
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            console.log('Event listener triggered for:', this.textContent);
            simulateSelection(this);
        });
    });
});

function showContentPanel(panelId, button) {
    document.querySelectorAll('.tab-content').forEach(panel => panel.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
}

// --- NEW: Typing Animation Function ---
function typeWriter(text, inputElement, cursorElement, buttonElement) {
    let i = 0;
    inputElement.value = ''; // Clear the input field
    inputElement.placeholder = ''; // Clear placeholder to make typing look clean
    cursorElement.style.display = 'block'; // Ensure cursor is visible
    buttonElement.classList.remove('visible'); // Ensure button is hidden

    function type() {
        if (i < text.length) {
            inputElement.value += text.charAt(i);
            i++;
            // Adjust typing speed here (in ms)
            setTimeout(type, 90);
        } else {
            // Typing finished: fade out cursor, fade in button
            cursorElement.style.opacity = '0';
            buttonElement.classList.add('visible');
        }
    }
    type();
}

// Replace the immediate transition with a small loading pause
function simulateLoading(btn, duration = 2000, screenId, flag = 1) {
    // Disable interaction while "loading"
    btn.disabled = true;
    btn.classList.add('loading');

    // Dim and disable the preference buttons for clarity
    document.querySelectorAll('.button-group button').forEach(b => b.disabled = true);

    // Replace button text with a small animated spinner
    const spinnerHTML = '<span class="spinner">Generating<span class="dot"></span><span class="dot"></span><span class="dot"></span></span>';
    const spinnerHTML2 = '<span class="round-spinner" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="20" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="31.4 31.4"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/></circle></svg></span>';
    const originalHTML = btn.innerHTML;
    btn.innerHTML = flag? spinnerHTML: spinnerHTML2;

    // Slightly longer pause to feel like "loading"
    setTimeout(() => {
        // Move to the loading screen
        showScreen(screenId);
    }, duration); // 1.2 seconds
}

function initializeMap() {
    // Initialize map (centered on Goa)
    var map = L.map('map').setView([15.3501, 74.005], 9);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add a marker for Goa itself
    L.marker([15.3501, 74.005]).addTo(map)
        .bindPopup("Goa")
        .openPopup(); // Open the popup by default

    // Multiple markers for your itinerary
    var locations = [
        { lat: 15.5525, lng: 73.7517, popup: "Baga Beach - Watersports" },
        { lat: 15.5626, lng: 73.7510, popup: "Britto's Restaurant" },
        { lat: 15.5750, lng: 73.7449, popup: "Anjuna Flea Market" },
        { lat: 15.3146, lng: 74.3142, popup: "Dudhsagar Falls" },
        { lat: 15.4087, lng: 74.0169, popup: "Spice Plantation" }
    ];

    locations.forEach(function (loc) {
        L.marker([loc.lat, loc.lng]).addTo(map)
            .bindPopup(loc.popup);
    });

    // Goa boundary (simplified GeoJSON)
var goaBoundary = {
  "type": "Feature",
  "properties": { "name": "Goa" },
  "geometry": {
    "type": "MultiPolygon",
    "coordinates": [
      [[[73.77212,15.35231],[73.78095,15.35467],[73.78324,15.35243],[73.76791,15.35117],[73.77212,15.35231]]],
      [[[73.85162,15.36144],[73.80854,15.37706],[73.78355,15.41225],[73.87281,15.39596],[73.9067,15.41415],
        [73.88454,15.43288],[73.86211,15.42907],[73.84843,15.45261],[73.80295,15.45146],[73.78806,15.4616],
        [73.80435,15.46545],[73.80898,15.49451],[73.76554,15.49423],[73.73542,15.61427],[73.67787,15.72919],
        [73.72889,15.71988],[73.74262,15.7358],[73.78609,15.72599],[73.82179,15.74009],[73.85666,15.80079],
        [73.87885,15.77333],[73.87467,15.75164],[73.93678,15.7424],[73.94891,15.69776],[73.96536,15.69181],
        [73.96294,15.64078],[73.99571,15.60969],[74.0229,15.6063],[74.12176,15.65166],[74.16679,15.65246],
        [74.18247,15.67977],[74.20748,15.64952],[74.22492,15.6663],[74.25217,15.65575],[74.24461,15.62532],
        [74.26422,15.6143],[74.2459,15.56655],[74.26415,15.56373],[74.28316,15.53238],[74.25128,15.49127],
        [74.27856,15.44081],[74.27786,15.38945],[74.32446,15.36633],[74.32072,15.32629],[74.33732,15.29536],
        [74.2765,15.2811],[74.25347,15.25683],[74.30216,15.22454],[74.32222,15.18379],[74.28708,15.14568],
        [74.27673,15.09814],[74.29765,15.0412],[74.25526,14.99746],[74.26501,14.97876],[74.25346,14.95777],
        [74.23725,14.9636],[74.20383,14.92134],[74.17868,14.95733],[74.16411,14.95648],[74.16497,14.91136],
        [74.12524,14.92365],[74.08725,14.89904],[74.04388,14.91792],[74.04848,14.96057],[74.02586,15.00727],
        [73.99178,15.01822],[73.96687,15.06619],[73.91212,15.08467],[73.94968,15.14305],[73.88908,15.34348],
        [73.87118,15.3709],[73.85162,15.36144]]],
      [[[74.04255,15.35174],[74.07977,15.33014],[74.0903,15.33171],[74.06269,15.3503],[74.04255,15.35174]]],
      [[[74.10274,15.34848],[74.09263,15.35369],[74.08865,15.35018],[74.09595,15.34583],[74.10274,15.34848]]],
      [[[74.02661,15.4098],[74.0387,15.40152],[74.03515,15.41688],[74.02163,15.4304],[74.02661,15.4098]]],
      [[[73.86218,15.4045],[73.86201,15.40782],[73.86492,15.40769],[73.86508,15.40429],[73.86218,15.4045]]]
    ]
  }
};


    // Add boundary polygon to map
    L.geoJSON(goaBoundary, {
        style: {
            color: "red",
            weight: 2,
            fillColor: "orange",
            fillOpacity: 0.1
        }
    }).addTo(map);
}

document.addEventListener('DOMContentLoaded', () => {
    showScreen('screen1'); // Show the first screen on load

    // Get elements for the animation
    const searchInput = document.getElementById('search-input');
    const cursor = document.querySelector('.search-bar .cursor');
    const nextButton = document.getElementById('next-button');
    const textToType = "A weekend trip to Goa";

    if (searchInput && cursor && nextButton) {
        // Start the typing animation after a short delay for dramatic effect
        setTimeout(() => {
            typeWriter(textToType, searchInput, cursor, nextButton);
        }, 1200); // 1.2-second delay
    }
});
