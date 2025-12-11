import { login } from './src/api/auth.js';
import { getUserProfile, getTopArtists, getTopAlbums, search } from './src/api/SpotifyAPI.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    const path = window.location.pathname;

    console.log("Sunt pe pagina:", path);

    // --- 1. LOGICA LOGIN ---
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        const loginBtn = document.getElementById('login-button');
        if (loginBtn) loginBtn.addEventListener('click', login);
        if (token) window.location.href = 'profile.html';
    }

    // --- 2. LOGICA GLOBALA ---
    if (token && (path.includes('html'))) { 
        setupSearch(token);

        const logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('access_token');
                window.location.href = 'index.html';
            });
        }

        // --- 3. LOGICA SPECIFICĂ ---
        if (path.includes('profile.html')) {
            await loadProfileData(token);
        }
        if (path.includes('artists')) {
            try {
                const artistsData = await getTopArtists(token, 20); 
                renderTopArtists(artistsData.items); 
            } catch (e) { console.error("Eroare Top Artists:", e); }
        }
        if (path.includes('albums')) {
            try {
                const albumsData = await getTopAlbums(token, 20); 
                renderTopAlbums(albumsData.items);
            } catch (e) { console.error("Eroare Top Albums:", e); }
        }
    } else if (!token && !path.includes('index.html') && path !== '/' && !path.includes('callback')) {
        window.location.href = 'index.html';
    }

    // --- 4. ACTIVARE PLAY BUTTONS (FIX FINAL) ---
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.play-button');
        
        if (btn) {
            e.preventDefault();
            const uri = btn.dataset.uri; 
            
            if (uri) {
                console.log("Play la:", uri);

                // A. Identificăm containerul Player
                const playerContainer = document.getElementById('player-content');
                if (!playerContainer) {
                    alert("EROARE: Nu găsesc zona 'player-content' în HTML. Verifică dacă ești pe pagina bună!");
                    return;
                }

                // B. Construim URL-ul
                const parts = uri.split(':');
                const type = parts[1]; 
                const id = parts[2];
                const embedUrl = `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;

                // C. Injectăm Player-ul
                playerContainer.innerHTML = `
                    <h3 style="color: #8884ff; margin-bottom: 15px;">Now Playing</h3>
                    <iframe 
                        style="border-radius:12px" 
                        src="${embedUrl}" 
                        width="100%" 
                        height="352" 
                        frameBorder="0" 
                        allowfullscreen="" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="lazy">
                    </iframe>
                    <button id="close-player" style="margin-top:10px; background:none; border:1px solid #555; color:white; padding:5px 10px; border-radius:20px; cursor:pointer;">Close Player</button>
                `;

                // Funcționalitate buton Close
                document.getElementById('close-player').addEventListener('click', () => {
                    playerContainer.innerHTML = `
                        <div id="no-song-message">
                            <i class="fas fa-headphones-alt fa-3x" style="color: var(--color-main-accent);"></i>
                            <p class="subtle-text" style="margin-top: 15px;">Looking for a song to play...</p>
                        </div>`;
                });

                // D. IMPORTANT: ÎNCHIDEM SEARCH-UL CA SĂ VEZI PLAYER-UL!
                const searchOverlay = document.getElementById('global-search-overlay');
                if (searchOverlay && searchOverlay.style.display !== 'none') {
                    console.log("Închid search-ul ca să vezi player-ul...");
                    searchOverlay.style.display = 'none';
                }
            }
        }
    });

}); 

// --- FUNCȚII SEARCH ---
function setupSearch(token) {
    const elements = {
        overlay: document.getElementById('global-search-overlay'),
        input: document.getElementById('global-search-input'),
        btnSidebar: document.getElementById('activate-search-btn'),
        btnMobile: document.getElementById('activate-search-btn-mobile'),
        btnClose: document.getElementById('close-search-btn')
    };

    if (!elements.overlay || !elements.input) return;

    const openSearch = (e) => {
        if(e) e.preventDefault();
        elements.overlay.style.display = 'block';
        elements.overlay.style.backgroundColor = '#121131'; 
        elements.overlay.style.zIndex = '99999';
        elements.overlay.style.opacity = '1'; 
        elements.overlay.style.position = 'fixed';
        elements.overlay.style.top = '0';
        elements.overlay.style.left = '0';
        elements.overlay.style.width = '100vw';
        elements.overlay.style.height = '100vh';

        elements.input.value = ''; 
        elements.input.focus();
        elements.input.style.color = 'white'; 
        
        if (!document.getElementById('dynamic-search-results')) {
            const resContainer = document.createElement('div');
            resContainer.id = 'dynamic-search-results';
            resContainer.style.marginTop = '20px';
            resContainer.style.width = '100%';
            elements.input.parentNode.parentNode.insertBefore(resContainer, elements.input.parentNode.nextSibling);
        } else {
            document.getElementById('dynamic-search-results').innerHTML = '';
        }
    };

    const closeSearch = () => {
        elements.overlay.style.display = 'none';
    };

    if (elements.btnSidebar) elements.btnSidebar.addEventListener('click', openSearch);
    if (elements.btnMobile) elements.btnMobile.addEventListener('click', openSearch);
    if (elements.btnClose) elements.btnClose.addEventListener('click', closeSearch);

    let timeoutId;
    elements.input.addEventListener('input', (e) => {
        const query = e.target.value;
        const resultsContainer = document.getElementById('dynamic-search-results');
        
        if(query.length === 0) { 
             if(resultsContainer) resultsContainer.innerHTML = ''; 
             return; 
        }
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
            if (query.length >= 2) {
                try {
                    const results = await search(token, query);
                    renderDynamicResults(results, resultsContainer);
                } catch (error) { console.error(error); }
            }
        }, 500);
    });
}

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
                    <div style="flex-grow:1;">
                        <div style="font-weight: bold; color: white;">${track.name}</div>
                        <div style="font-size: 0.85em; opacity: 0.7; color: #ccc;">${track.artists[0].name}</div>
                    </div>
                    <button class="play-button" data-uri="${track.uri}" style="width: 35px; height: 35px; border-radius: 50%; border: none; background: #8884ff; color: #121131; cursor: pointer; display: flex; align-items: center; justify-content: center;">▶</button>
                </div>`;
            container.innerHTML += html;
        });
    }
}

// --- FUNCȚII AFIȘARE ---
async function loadProfileData(token) {
    try {
        const user = await getUserProfile(token);
        if(user) {
            if(document.getElementById('user-display-name')) document.getElementById('user-display-name').innerText = user.display_name;
            if(document.getElementById('user-email-address')) document.getElementById('user-email-address').innerText = user.email;
            if(document.getElementById('user-id-display')) document.getElementById('user-id-display').innerText = `ID: ${user.id}`;
            if (user.images?.length > 0 && document.getElementById('user-profile-image')) 
                document.getElementById('user-profile-image').src = user.images[0].url;
        }
        const artistsData = await getTopArtists(token, 5);
        renderTopArtists(artistsData.items);
        const albumsData = await getTopAlbums(token, 5);
        renderTopAlbums(albumsData.items);
    } catch (error) { console.error("Eroare loadProfile:", error); }
}

function renderTopArtists(artists) {
    const container = document.getElementById('top-artists-grid');
    if(!container) return;
    container.innerHTML = ''; 
    artists.forEach((artist, index) => {
        const img = artist.images[0]?.url || 'https://placehold.co/150';
        container.innerHTML += `
            <div class="music-card artist-card">
                <span class="card-rank">${index + 1}</span>
                <img src="${img}" class="card-image">
                <h4 class="card-title">${artist.name}</h4>
                <p class="card-subtitle">Artist</p>
                <button class="play-button" data-uri="${artist.uri}"><i class="fas fa-play"></i></button>
            </div>`;
    });
}

function renderTopAlbums(albums) {
    const container = document.getElementById('top-albums-grid');
    if(!container) return;
    container.innerHTML = '';
    albums.forEach((album, index) => {
        const img = album.images[0]?.url || 'https://placehold.co/150';
        container.innerHTML += `
            <div class="music-card album-card">
                <span class="card-rank">${index + 1}</span>
                <img src="${img}" class="card-image">
                <h4 class="card-title">${album.name}</h4>
                <p class="card-subtitle">${album.artists[0].name}</p>
                <button class="play-button" data-uri="${album.uri}"><i class="fas fa-play"></i></button>
            </div>`;
    });
}