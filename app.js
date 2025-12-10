import { login } from './src/api/auth.js';
import { getUserProfile, getTopArtists, getTopAlbums, search } from './src/api/SpotifyAPI.js';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    const path = window.location.pathname;

    // --- 1. LOGICA LOGIN ---
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        const loginBtn = document.getElementById('login-button');
        if (loginBtn) loginBtn.addEventListener('click', login);
        if (token) window.location.href = 'profile.html';
    }

    // --- 2. LOGICA PROFILE ---
    if (path.includes('profile.html') || path.includes('top-')) { 
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // Logout
        const logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('access_token');
                window.location.href = 'index.html';
            });
        }

        // Activăm Search-ul (Corelat cu CSS-ul colegei)
        setupSearch(token);

        // Date Profil
        if (path.includes('profile.html')) {
            loadProfileData(token);
        }
    }
});

// --- 3. FUNCȚIA DE SEARCH (COMPATIBILĂ CU CSS) ---
// --- ÎNLOCUIEȘTE ACESTE 2 FUNCȚII ÎN app.js ---

function setupSearch(token) {
    const searchBtnSidebar = document.getElementById('activate-search-btn');
    const searchBtnMobile = document.getElementById('activate-search-btn-mobile');
    const closeBtn = document.getElementById('close-search-btn');
    
    const searchOverlay = document.getElementById('global-search-overlay');
    const searchInput = document.getElementById('global-search-input');
    const resultsContainer = document.getElementById('search-results-list');
    
    // NOU: Selectăm și containerul părinte care poate fi ascuns
    const resultsWrapper = document.getElementById('global-search-results');

    const openSearch = (e) => {
        if(e) e.preventDefault();
        console.log("Deschid fereastra...");

        if (searchOverlay) {
            // 1. Vizibilitate Overlay
            searchOverlay.style.display = 'block';
            searchOverlay.style.position = 'fixed';
            searchOverlay.style.top = '0';
            searchOverlay.style.left = '0';
            searchOverlay.style.width = '100vw';
            searchOverlay.style.height = '100vh';
            searchOverlay.style.backgroundColor = '#121131'; 
            searchOverlay.style.zIndex = '99999';
            searchOverlay.style.opacity = '1'; 

            // 2. Vizibilitate Container Rezultate (ASTA LIPSEA!)
            if (resultsWrapper) {
                resultsWrapper.style.display = 'block';
                resultsWrapper.style.visibility = 'visible';
                resultsWrapper.style.opacity = '1';
            }

            // 3. Focus Input
            if(searchInput) {
                searchInput.value = ''; 
                searchInput.focus();
                searchInput.style.color = 'white'; 
            }
        }
    };

    const closeSearch = () => {
        if (searchOverlay) searchOverlay.style.display = 'none';
        if (resultsContainer) resultsContainer.innerHTML = '';
    };

    if (searchBtnSidebar) searchBtnSidebar.addEventListener('click', openSearch);
    if (searchBtnMobile) searchBtnMobile.addEventListener('click', openSearch);
    if (closeBtn) closeBtn.addEventListener('click', closeSearch);

    if (searchInput && resultsContainer) {
        let timeoutId;
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if(query.length === 0) { resultsContainer.innerHTML = ''; return; }
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                if (query.length >= 2) {
                    try {
                        const results = await search(token, query);
                        renderSearchResults(results, resultsContainer);
                    } catch (error) { console.error(error); }
                }
            }, 500);
        });
    }
}

// --- ÎNLOCUIEȘTE DOAR FUNCȚIA renderSearchResults ---

function renderSearchResults(data, container) {
    // 1. Verificăm în consolă ce a trimis Spotify
    console.log("📦 DATE PRIMITE DE LA SPOTIFY:", data);

    container.innerHTML = ''; 
    
    // 2. FORȚĂM stilurile containerului
    container.style.display = 'block';
    container.style.marginTop = '20px';
    container.style.color = '#00FF00'; // Verde strident (Matrix style) ca să se vadă!
    container.style.zIndex = '999999';

    if (!data) {
        container.innerHTML = '<p>Eroare: Nu am primit date.</p>';
        return;
    }

    // Verificăm dacă există tracks
    const hasTracks = data.tracks && data.tracks.items && data.tracks.items.length > 0;
    const hasArtists = data.artists && data.artists.items && data.artists.items.length > 0;

    if (!hasTracks && !hasArtists) {
        container.innerHTML = '<p style="color:white; font-size:1.2em;">⚠️ Spotify a răspuns, dar lista e goală.</p>';
        return;
    }

    // A. TRACKS
    if (hasTracks) {
        container.innerHTML += `<h3 style="color:#8884ff; border-bottom:1px solid #555; padding-bottom:5px;">Songs</h3>`;
        
        data.tracks.items.slice(0, 5).forEach(track => {
            // Verificăm imaginile
            const img = (track.album.images && track.album.images.length > 0) 
                        ? track.album.images[0].url 
                        : 'https://placehold.co/50';

            const html = `
                <div class="search-track-item" style="margin: 10px 0; background: #222; padding: 10px; border-radius: 5px; display:flex; align-items:center;">
                    <button class="play-button" data-uri="${track.uri}" style="margin-right:15px; padding:10px; background:green; border:none; border-radius:50%; cursor:pointer;">
                        ▶
                    </button>
                    <img src="${img}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 15px;">
                    <div>
                        <div style="color: white; font-weight: bold; font-size: 1.1em;">${track.name}</div>
                        <div style="color: #ccc;">${track.artists[0].name}</div>
                    </div>
                </div>`;
            container.innerHTML += html;
        });
    }

    // B. ARTISTS
    if (hasArtists) {
        container.innerHTML += `<h3 style="color:#8884ff; margin-top:20px;">Artists</h3>`;
        data.artists.items.slice(0, 3).forEach(artist => {
            const img = (artist.images && artist.images.length > 0) 
                        ? artist.images[0].url 
                        : 'https://placehold.co/50';
            
            const html = `
                <div style="margin: 10px 0; background: #222; padding: 10px; border-radius: 5px; display:flex; align-items:center;">
                    <img src="${img}" style="width: 50px; height: 50px; border-radius: 50%; margin-right: 15px;">
                    <div style="color: white; font-weight: bold;">${artist.name}</div>
                </div>`;
            container.innerHTML += html;
        });
    }
}

// --- 5. LOGICA DATE PROFIL ---
async function loadProfileData(token) {
    try {
        const user = await getUserProfile(token);
        if(user){
            document.getElementById('user-display-name').innerText = user.display_name;
            document.getElementById('user-email-address').innerText = user.email;
            document.getElementById('user-id-display').innerText = `ID: ${user.id}`;
            if (user.images?.length > 0) document.getElementById('user-profile-image').src = user.images[0].url;
        }
        const artistsData = await getTopArtists(token, 5);
        renderTopArtists(artistsData.items);
        const albumsData = await getTopAlbums(token, 5);
        renderTopAlbums(albumsData.items);
    } catch (error) { console.error(error); }
}

function renderTopArtists(artists) {
    const container = document.getElementById('top-artists-grid');
    if(!container) return;
    container.innerHTML = ''; 
    artists.forEach((artist, index) => {
        container.innerHTML += `
            <div class="music-card artist-card">
                <span class="card-rank">${index + 1}</span>
                <img src="${artist.images[0]?.url}" class="card-image">
                <h4 class="card-title">${artist.name}</h4>
                <p class="card-subtitle">Artist</p>
            </div>`;
    });
}

function renderTopAlbums(albums) {
    const container = document.getElementById('top-albums-grid');
    if(!container) return;
    container.innerHTML = '';
    albums.forEach((album, index) => {
        container.innerHTML += `
            <div class="music-card album-card">
                <span class="card-rank">${index + 1}</span>
                <img src="${album.images[0]?.url}" class="card-image">
                <h4 class="card-title">${album.name}</h4>
                <p class="card-subtitle">${album.artists[0].name}</p>
            </div>`;
    });
}