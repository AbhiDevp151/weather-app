// --- 1. Select all necessary DOM elements ---

const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const userContainer = document.querySelector(".Weather-container");

const grantaccessContainer = document.querySelector(".grant-location-container");
// **FIX:** Added brackets [] to the data attribute selector
const searchForm = document.querySelector("[data-Searchform]"); 
// **FIX:** Used the class selector '.'
const loadingScreen = document.querySelector(".loading-container"); 
// **FIX:** Used the class selector '.'
const userInfoContainer = document.querySelector(".user-info-container"); 
// **NEW:** Added this selector for the parameters section
const parameterContainer = document.querySelector(".parameter-container"); 

// Grant access button
const grantAccessButton = document.querySelector("[data-grantAcccess]");
// Search input
const searchInput = document.querySelector("[data-searchInput]");

// Weather display elements
const cityName = document.querySelector("[data-cityname]");
const countryIcon = document.querySelector("[data-countryIcon]");
const weatherDesc = document.querySelector("[data-weatherdesc]");
const weatherIcon = document.querySelector("[data-weatherIcon]");
// Corresponds to data-emp in your HTML
const temp = document.querySelector("[data-emp]"); 
const windspeed = document.querySelector("[data-windspeed]");
const humidity = document.querySelector("[data-humidity]");
const clouds = document.querySelector("[data-clouds]");

// --- 2. Initial variables ---

let currentTab = userTab;
const API_kEY = "51657f2cbcd8f70305906a6f27a9e7f5"; // Your API key
currentTab.classList.add("current-tab");

// --- 3. Initial setup on load ---
// Hide all screens by default
searchForm.classList.remove("active");
loadingScreen.classList.remove("active");
userInfoContainer.classList.remove("active");
parameterContainer.classList.remove("active");

// Check for user's coordinates on load
getfromsessionstorage(); 

// --- 4. Event Listeners ---

userTab.addEventListener("click", () => {
    switchTab(userTab);
});

searchTab.addEventListener("click", () => {
    switchTab(searchTab);
});

searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let city = searchInput.value;

    if (city === "") {
        return; // Do nothing if search bar is empty
    } else {
        fetchSearchWeather(city);
        searchInput.value = ""; // Clear input field
    }
});

grantAccessButton.addEventListener("click", getLocation);

// --- 5. Core Functions ---

/**
 * Handles switching between "Your Weather" and "Search Weather" tabs.
 */
function switchTab(newTab) {
    // If the clicked tab is not already the active tab
    if (newTab !== currentTab) {
        currentTab.classList.remove("current-tab");
        currentTab = newTab;
        currentTab.classList.add("current-tab");

        // --- Handle screen visibility ---

        if (currentTab === searchTab) {
            // If switching to Search Tab:
            // Hide all other screens
            grantaccessContainer.classList.remove("active");
            userInfoContainer.classList.remove("active");
            parameterContainer.classList.remove("active");
            // Show the search form
            searchForm.classList.add("active");
        } else {
            // If switching to User Weather Tab:
            // Hide search form
            searchForm.classList.remove("active");
            // Hide any visible weather info
            userInfoContainer.classList.remove("active");
            parameterContainer.classList.remove("active");
            // Check session storage for coordinates to decide what to show
            getfromsessionstorage();
        }
    }
}

/**
 * Checks session storage for user coordinates.
 * If found, fetches weather. If not, shows the grant access screen.
 */
function getfromsessionstorage() {
    const localCoordinates = sessionStorage.getItem("user-coordinates");

    if (!localCoordinates) {
        // If coordinates are not in session storage, show grant access screen
        grantaccessContainer.classList.add("active");
    } else {
        // If coordinates are found, parse them and fetch weather
        const coordinates = JSON.parse(localCoordinates);
        fetchUserWeather(coordinates);
    }
}

/**
 * Uses browser's Geolocation API to get user's position.
 */
function getLocation() {
    if (navigator.geolocation) {
        // Show loading screen while asking for permission
        grantaccessContainer.classList.remove("active");
        loadingScreen.classList.add("active");
        
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        alert("Geolocation is not supported by this browser.");
        grantaccessContainer.classList.add("active"); // Show grant screen again
    }
}

/**
 * Callback function for successful geolocation.
 * Stores coordinates and fetches weather.
 */
function showPosition(position) {
    const userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
    };

    // Store coordinates in session storage
    sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
    
    // Fetch weather for these coordinates
    fetchUserWeather(userCoordinates);
}

/**
 * Callback function for geolocation errors.
 */
function showError(error) {
    loadingScreen.classList.remove("active");
    grantaccessContainer.classList.add("active"); // Show grant screen again

    let message = "";
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = "You denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            message = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            message = "An unknown error occurred.";
            break;
    }
    alert(message);
}

/**
 * Fetches weather data from OpenWeatherMap using coordinates.
 * @param {object} coordinates - An object with lat and lon properties.
 */
async function fetchUserWeather(coordinates) {
    const { lat, lon } = coordinates;

    // Show loading screen
    grantaccessContainer.classList.remove("active");
    loadingScreen.classList.add("active");

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_kEY}&units=metric`
        );
        const data = await response.json();

        loadingScreen.classList.remove("active");
        
        // Show weather info containers
        userInfoContainer.classList.add("active");
        parameterContainer.classList.add("active");
        
        // Populate data into the HTML
        renderWeather(data);
    } catch (err) {
        loadingScreen.classList.remove("active");
        console.error("Error fetching user weather:", err);
        alert("Could not fetch weather data. Please try again.");
    }
}

/**
 * Fetches weather data from OpenWeatherMap using a city name.
 * @param {string} city - The name of the city to search for.
 */
async function fetchSearchWeather(city) {
    // Show loading screen
    loadingScreen.classList.add("active");
    userInfoContainer.classList.remove("active");
    parameterContainer.classList.remove("active");
    grantaccessContainer.classList.remove("active");

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_kEY}&units=metric`
        );
        const data = await response.json();

        loadingScreen.classList.remove("active");

        // Handle "city not found" error (API returns 404)
        if (data?.cod === "404") {
            alert("City not found. Please check the spelling and try again.");
            // We don't show any weather info
        } else {
            // Show weather info containers
            userInfoContainer.classList.add("active");
            parameterContainer.classList.add("active");
            // Populate data into the HTML
            renderWeather(data);
        }
    } catch (err) {
        loadingScreen.classList.remove("active");
        console.error("Error fetching search weather:", err);
        alert("Could not fetch weather data. Please try again.");
    }
}

/**
 * Populates the HTML elements with data from the weather API response.
 * @param {object} weatherInfo - The JSON response from OpenWeatherMap.
 */
function renderWeather(weatherInfo) {
    // Use optional chaining (?.) to prevent errors if a property doesn't exist
    cityName.innerText = weatherInfo?.name || "N/A";
    
    // Use flagcdn for country icon
    if(weatherInfo?.sys?.country) {
        countryIcon.src = `https://flagcdn.com/144x108/${weatherInfo.sys.country.toLowerCase()}.png`;
    } else {
        countryIcon.src = ""; // Clear if no country code
    }
    
    weatherDesc.innerText = weatherInfo?.weather?.[0]?.description || "N/A";
    
    // Use openweathermap icons
    if(weatherInfo?.weather?.[0]?.icon) {
        weatherIcon.src = `https://openweathermap.org/img/w/${weatherInfo.weather[0].icon}.png`;
    } else {
        weatherIcon.src = ""; // Clear if no icon
    }
    
    temp.innerText = `${weatherInfo?.main?.temp?.toFixed(1) ?? '0'} °C`;
    windspeed.innerText = `${weatherInfo?.wind?.speed ?? '0'} m/s`;
    humidity.innerText = `${weatherInfo?.main?.humidity ?? '0'} %`;
    clouds.innerText = `${weatherInfo?.clouds?.all ?? '0'} %`;
}