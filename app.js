import { login } from './src/api/auth.js';
import { getUserProfile, getTopArtists, getTopAlbums, search, getRecommendations, getUserPlaylists, createPlaylist } 
from './src/api/spotifyAPI.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    const path = window.location.pathname;

    console.log("Sunt pe pagina:", path);
    // --- 1. LOGIN ---
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        const loginBtn = document.getElementById('login-button');
        if (loginBtn) loginBtn.addEventListener('click', login);
        if (token) window.location.href = 'profile.html';
    }
    // --- 2. LOGICA INTERNĂ ---
    if (token && (path.includes('html'))) { 
        // Activăm Search-ul
        setupSearch(token);
        const logoutBtn = document.getElementById('logout-button');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('access_token');
                window.location.href = 'index.html';
            });
        }

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
    } 
    else if (!token && !path.includes('index.html') && path !== '/' && !path.includes('callback')) {
        window.location.href = 'index.html';
    }

    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.play-button');
        if (btn) {
            e.preventDefault();
            const uri = btn.dataset.uri; 
            
            if (uri) {
                console.log("Play la:", uri);
                const parts = uri.split(':');
                const type = parts[1]; 
                const id = parts[2];
                const playerContainer = document.getElementById('player-content');
                if (playerContainer) {
                    const embedUrl = `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
                    playerContainer.innerHTML = `
                        <h3 style="color: #8884ff; margin-bottom: 15px;">Now Playing</h3>
                        <iframe style="border-radius:12px" src="${embedUrl}" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                        <button id="close-player" style="margin-top:10px; background:none; border:1px solid #555; color:white; padding:5px 10px; border-radius:20px; cursor:pointer;">Close Player</button>
                    `;
                    document.getElementById('close-player').addEventListener('click', () => {
                        playerContainer.innerHTML = `<div id="no-song-message"><i class="fas fa-headphones-alt fa-3x" style="color: var(--color-main-accent);"></i><p class="subtle-text" style="margin-top: 15px;">Looking for a song to play...</p></div>`;
                    });

                    // Ascundem search-ul dacă dăm play din search
                    const searchOverlay = document.getElementById('global-search-overlay');
                    if(searchOverlay) searchOverlay.style.display = 'none';
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
        if(query.length === 0) { if(resultsContainer) resultsContainer.innerHTML = ''; return; }
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

// --- ÎNCĂRCARE DATE PROFIL & RECOMANDĂRI ---
// --- FUNCȚIA COMPLETĂ PENTRU PROFIL + RECOMANDĂRI ---
// --- FUNCȚIA DE PROFIL UPGRADATĂ ---

async function loadProfileData(token) {
    try {
        const user = await getUserProfile(token);
        
        if (user) {
            // 1. Populare Nume și scoatere clasă skeleton
            const nameEl = document.getElementById('user-display-name');
            if(nameEl) {
                nameEl.innerText = user.display_name;
                nameEl.classList.remove('skeleton', 'skeleton-text'); // <--- IMPORTANT
            }

            // 2. Email
           const emailEl = document.getElementById('user-email-address');
            if(emailEl) {
                // Dacă nu avem email, nu afișăm "undefined", ci un text gol sau ID-ul
                emailEl.innerText = user.email || ''; 
                emailEl.classList.remove('skeleton', 'skeleton-text');
            }

            // 3. Poza
            const imgEl = document.getElementById('user-profile-image');
            if (imgEl) {
                // Verificăm dacă userul are imagini de la Spotify
                if (user.images && user.images.length > 0) {
                    imgEl.src = user.images[0].url;
                } else {
                    // Dacă NU are poză, creăm una cu inițiala
                    // Luăm prima literă din nume (ex: S de la SpotiPuff)
                    const initial = user.display_name ? user.display_name.charAt(0).toUpperCase() : '?';
                    
                    // Generăm link-ul: 150x150, Fundal Mov (#8884ff), Text Albastru Închis (#121131)
                    imgEl.src = `https://placehold.co/150x150/8884ff/121131?text=${initial}`;
                }
                
                // Scoatem efectul de încărcare (skeleton)
                imgEl.classList.remove('skeleton'); 
            }
            
            // 4. Followers & Plan
            const followEl = document.getElementById('user-followers');
            if(followEl) {
                followEl.innerHTML = `<i class="fas fa-users"></i> ${user.followers.total} Followers`;
                followEl.classList.remove('skeleton');
                followEl.style.backgroundColor = "rgba(255,255,255,0.1)"; // Resetăm culoarea
                followEl.style.color = "white";
            }

            const prodEl = document.getElementById('user-product');
            if(prodEl) {
                prodEl.innerText = user.product || 'free';
                prodEl.classList.remove('skeleton');
                prodEl.style.backgroundColor = (user.product === 'premium') ? '#FFD700' : '#8884ff';
                prodEl.style.color = '#121131';
            }

            //init PLaylists
           // await setupPlaylists(token, user.id);
        }
        // --- Încărcare Liste ---
        const artistsData = await getTopArtists(token, 5);
        renderTopArtists(artistsData.items);

        const albumsData = await getTopAlbums(token, 5);
        renderTopAlbums(albumsData.items);

    if (artistsData.items.length > 0) {
        // Luăm ID-ul celui mai ascultat artist
        const topArtist = artistsData.items[0];
        
        console.log("Generare recomandări bazate pe artistul:", topArtist.name);

        // Cerem recomandări
        const recommendations = await getRecommendations(token, topArtist.id, 5);
        
        // Randăm rezultatele dacă există
        if (recommendations && recommendations.tracks) {
            renderRecommendations(recommendations.tracks);
        }
    } else {
        // Fallback dacă userul e nou și nu are top artists
        document.getElementById('recommendations-grid').innerHTML = 
            '<p class="subtle-text">Ascultă niște muzică pentru a primi recomandări!</p>';
    }

    } catch (error) { 
        console.error("Eroare loadProfile:", error); 
        if (error.message.includes("401")) {
            alert("Token expirat. Relogare...");
            localStorage.removeItem('access_token');
            window.location.href = 'index.html';
        }
    }
}

// La finalul fișierului app.js

function renderRecommendations(tracks) {
    const container = document.getElementById('recommendations-grid');
    if(!container) return;
    container.innerHTML = '';

    if(!tracks || tracks.length === 0) {
        container.innerHTML = '<p class="subtle-text">No recommendations found.</p>';
        return;
    }

    tracks.forEach((track, index) => {
        // Imaginea albumului (fallback dacă nu există)
        const img = track.album.images[0]?.url || 'https://placehold.co/150';
        
        // Construim HTML-ul similar cu Top Albums/Artists pentru consistență vizuală
        const html = `
            <div class="music-card recommendation-card">
                <!-- Putem pune un mic badge de "Picked" opțional -->
                <div style="position: absolute; top:10px; left:10px; background:#8884ff; color:#121131; padding:2px 8px; border-radius:10px; font-size:0.7em; font-weight:bold;">
                    <i class="fas fa-magic"></i> Pick
                </div>

                <img src="${img}" class="card-image" alt="${track.name}">
                
                <h4 class="card-title">${track.name}</h4>
                <p class="card-subtitle">${track.artists[0].name}</p>
                
                <!-- Butonul de Play funcțional -->
                <button class="play-button" data-uri="${track.uri}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        `;
        container.innerHTML += html;
    });
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

// --- FUNCȚII PLAYLIST ---
async function setupPlaylists(token, userId) {
    // 1. Schimbăm ținta: căutăm containerul din interiorul listei
    const listContainer = document.getElementById('dynamic-playlists-container');
    const createBtn = document.getElementById('create-playlist-btn');

    const renderList = async () => {
        try {
            const data = await getUserPlaylists(token);
            if (data && data.items) {
                listContainer.innerHTML = ''; 
                data.items.forEach(playlist => {
                    // Păstrăm clasa 'playlist-item' ca să arate la fel ca în design
                    const html = `
                        <li class="playlist-item">
                            <a href="${playlist.external_urls.spotify}" target="_blank">
                                <i class="fas fa-list-ul"></i> 
                                <span>${playlist.name}</span>
                            </a>
                        </li>
                    `;
                    listContainer.innerHTML += html;
                });
            }
        } catch (e) {
            console.error("Eroare playlist-uri:", e);
        }
    };

    await renderList();

    // Logica de creare rămâne aceeași
    if (createBtn && !createBtn.hasAttribute('data-listening')) {
        createBtn.setAttribute('data-listening', 'true');
        createBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const name = prompt("Enter playlist name:"); // Simplu popup
            if (name && name.trim() !== "") {
                try {
                    await createPlaylist(token, userId, name);
                    await renderList(); // Refresh la listă
                } catch (error) {
                    alert("Nu pot crea playlist-ul. Verifică consola (F12).");
                    console.error(error);
                }
            }
        });
    }
}