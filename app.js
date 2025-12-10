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
    
    // NU mai folosim containerul vechi care face probleme.
    // Vom crea unul nou dinamic sau îl folosim pe cel existent dacă l-am creat deja.
    let resultsContainer = document.getElementById('dynamic-search-results');
    
    // Funcția de deschidere
    const openSearch = (e) => {
        if(e) e.preventDefault();
        if (searchOverlay) {
            // 1. Vizibilitate Overlay
            searchOverlay.style.display = 'block';
            searchOverlay.style.backgroundColor = '#121131'; 
            searchOverlay.style.zIndex = '99999';
            searchOverlay.style.opacity = '1'; 
            searchOverlay.style.position = 'fixed';
            searchOverlay.style.top = '0';
            searchOverlay.style.left = '0';
            searchOverlay.style.width = '100vw';
            searchOverlay.style.height = '100vh';

            // 2. Focus Input
            if(searchInput) {
                searchInput.value = ''; 
                searchInput.focus();
                searchInput.style.color = 'white'; 
            }

            // 3. Creăm containerul nostru sigur (dacă nu există)
            if (!document.getElementById('dynamic-search-results')) {
                resultsContainer = document.createElement('div');
                resultsContainer.id = 'dynamic-search-results';
                // Îl stilizăm să fim SIGURI că se vede
                resultsContainer.style.marginTop = '20px';
                resultsContainer.style.width = '100%';
                resultsContainer.style.color = 'white';
                
                // Îl adăugăm în overlay, imediat după input container
                const inputContainer = document.getElementById('search-input-container');
                inputContainer.parentNode.insertBefore(resultsContainer, inputContainer.nextSibling);
            } else {
                resultsContainer = document.getElementById('dynamic-search-results');
                resultsContainer.innerHTML = '';
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

    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            // Ne asigurăm că avem unde să afișăm
            if (!resultsContainer) resultsContainer = document.getElementById('dynamic-search-results');
            
            if(query.length === 0) { 
                 if(resultsContainer) resultsContainer.innerHTML = ''; 
                 return; 
            }
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                if (query.length >= 2) {
                    try {
                        const results = await search(token, query);
                        // Apelează funcția de randare direct aici
                        renderDynamicResults(results, resultsContainer);
                    } catch (error) { console.error(error); }
                }
            }, 500);
        });
    }
}

// --- ÎNLOCUIEȘTE DOAR FUNCȚIA renderSearchResults ---

function renderDynamicResults(data, container) {
    if(!container) return;
    container.innerHTML = ''; 

    if (!data) return;

    // Tracks
    if (data.tracks?.items.length > 0) {
        container.innerHTML += `<h3 style="color:#8884ff; margin: 20px 0 10px 0;">Songs</h3>`;
        data.tracks.items.slice(0, 5).forEach(track => {
            const img = track.album.images[2]?.url || track.album.images[0]?.url;
            const html = `
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <img src="${img}" style="width: 50px; height: 50px; border-radius: 4px;">
                    <div>
                        <div style="font-weight: bold;">${track.name}</div>
                        <div style="font-size: 0.85em; opacity: 0.7;">${track.artists[0].name}</div>
                    </div>
                </div>`;
            container.innerHTML += html;
        });
    }

    // Artists
    if (data.artists?.items.length > 0) {
        container.innerHTML += `<h3 style="color:#8884ff; margin: 20px 0 10px 0;">Artists</h3>`;
        data.artists.items.slice(0, 3).forEach(artist => {
            const img = artist.images[0]?.url || 'https://placehold.co/50';
            const html = `
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 50px;">
                    <img src="${img}" style="width: 50px; height: 50px; border-radius: 50%;">
                    <div style="font-weight: bold;">${artist.name}</div>
                </div>`;
            container.innerHTML += html;
        });
    }
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