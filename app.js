// 1. IMPORT THE API TOOLS
// We use the files your colleagues created in the 'api' folder
import { login } from './api/auth.js';
import { getUserProfile, getTopArtists, search } from './api/spotifyAPI.js';

// 2. GET HTML ELEMENTS
const loginView = document.getElementById('login-view');
const mainView = document.getElementById('main-view');
const btnLogin = document.getElementById('login-hero');
const userGreeting = document.getElementById('user-greeting');
const btnLoadArtists = document.getElementById('btn-load-artists');
const artistsContainer = document.getElementById('artists-container');
const btnSearch = document.getElementById('btn-search');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

// 3. CHECK LOGIN STATUS
const token = localStorage.getItem('spotifyToken');

if (token) {
    // If we have a token, show the app
    showApp();
} else {
    // If not, wait for user to click Login
    btnLogin.addEventListener('click', () => {
        login();
    });
}

// 4. MAIN APP LOGIC
async function showApp() {
    // Hide Login, Show Main
    loginView.classList.add('hidden');
    mainView.classList.remove('hidden');

    // Load Profile Name
    try {
        const profile = await getUserProfile(token);
        userGreeting.innerText = `Welcome, ${profile.display_name}!`;
    } catch (error) {
        console.error("Token expired or invalid", error);
        localStorage.removeItem('spotifyToken');
        window.location.reload();
    }

    // Button: Load Artists
    btnLoadArtists.addEventListener('click', async () => {
        const data = await getTopArtists(token);
        artistsContainer.innerHTML = ''; // Clear old data
        
        data.items.forEach(artist => {
            const card = document.createElement('div');
            card.className = 'card';
            // Use a default image if the artist has none
            const img = artist.images[0] ? artist.images[0].url : 'https://via.placeholder.com/150';
            card.innerHTML = `
                <img src="${img}" alt="${artist.name}">
                <h4>${artist.name}</h4>
            `;
            artistsContainer.appendChild(card);
        });
    });

    // Button: Search
    btnSearch.addEventListener('click', async () => {
        const query = searchInput.value;
        if (!query) return;

        const result = await search(token, query);
        searchResults.innerHTML = ''; // Clear old results

        if (result.tracks && result.tracks.items) {
            result.tracks.items.forEach(track => {
                const item = document.createElement('div');
                item.className = 'track-item';
                item.innerHTML = `
                    <div>
                        <strong>${track.name}</strong> <br>
                        <span style="color:#aaa; font-size:0.9em">${track.artists[0].name}</span>
                    </div>
                    <a href="${track.external_urls.spotify}" target="_blank" style="color:#1DB954; text-decoration:none;">Play</a>
                `;
                searchResults.appendChild(item);
            });
        }
    });
}