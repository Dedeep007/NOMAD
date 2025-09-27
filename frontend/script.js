// Wait for the DOM to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {

    // === Get all Screen elements ===
    const screens = document.querySelectorAll(".screen");
    const screenSplash = document.getElementById("screen-1-splash");
    const screenRefine = document.getElementById("screen-2-refine");
    const screenLoading = document.getElementById("screen-3-loading");
    const screenDashboard = document.getElementById("screen-4-dashboard");
    const screenDetail = document.getElementById("screen-5-detail");

    // === Get all Interactive Buttons & Elements ===
    // Screen 1
    const startSearchBtn = document.getElementById("start-search-btn");
    
    // Screen 2
    const generateBtn = document.getElementById("generate-btn");
    
    // Screen 3
    const loadingText = document.getElementById("loading-text");

    // Screen 4 (Dashboard)
    const cardAnjuna = document.getElementById("card-anjuna");
    const tabItinerary = document.getElementById("tab-itinerary");
    const tabTravel = document.getElementById("tab-travel");
    const contentItinerary = document.getElementById("itinerary-content");
    const contentTravel = document.getElementById("travel-content");

    // Screen 5 (Detail)
    const detailCloseBtn = document.getElementById("detail-close-btn");

    // === Helper Function to Change Screens ===
    function showScreen(screenToShow) {
        // Hide all screens
        screens.forEach(screen => {
            screen.classList.remove("active");
        });
        // Show the target screen
        screenToShow.classList.add("active");
    }

    // === --- Event Listeners for Prototype Flow --- ===

    // 1. (Splash -> Refine)
    // When user clicks the fake search bar on the splash screen
    startSearchBtn.addEventListener("click", () => {
        showScreen(screenRefine);
    });

    // 2. (Refine -> Loading)
    // When user clicks "Generate Itinerary"
    generateBtn.addEventListener("click", () => {
        showScreen(screenLoading);
        
        // --- Simulate the loading text animation ---
        const loadingMessages = [
            "Analyzing weather patterns for Goa...",
            "Checking local news for the latest vibe...",
            "Calculating travel times and distances...",
            "Finding top-rated adventurous spots...",
            "Crafting your personalized itinerary..."
        ];
        let messageIndex = 0;
        
        const textInterval = setInterval(() => {
            messageIndex++;
            if (messageIndex < loadingMessages.length) {
                loadingText.textContent = loadingMessages[messageIndex];
            } else {
                clearInterval(textInterval);
            }
        }, 800); // Change text every 0.8 seconds

        // --- Simulate loading time, then go to Dashboard ---
        setTimeout(() => {
            showScreen(screenDashboard);
        }, 4500); // 4.5 seconds total loading time
    });

    // 3. (Dashboard -> Show Detail)
    // When user clicks the "Anjuna Flea Market" card
    cardAnjuna.addEventListener("click", () => {
        screenDetail.classList.add("active");
    });

    // 4. (Detail -> Hide Detail)
    // When user clicks the 'X' button on the detail overlay
    detailCloseBtn.addEventListener("click", () => {
        screenDetail.classList.remove("active");
    });

    // 5. (Dashboard Tabs)
    // When user clicks the "Travel & Stays" tab
    tabTravel.addEventListener("click", () => {
        // Update tab visual
        tabTravel.classList.add("active");
        tabItinerary.classList.remove("active");
        
        // Update content visual
        contentTravel.classList.add("active");
        contentItinerary.classList.remove("active");
    });

    // When user clicks the "Itinerary" tab
    tabItinerary.addEventListener("click", () => {
        // Update tab visual
        tabItinerary.classList.add("active");
        tabTravel.classList.remove("active");

        // Update content visual
        contentItinerary.classList.add("active");
        contentTravel.classList.remove("active");
    });

});