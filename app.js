import { login } from './src/api/auth.js';
import { getUserProfile, getTopArtists, getTopAlbums, search, getRecommendations, getUserPlaylists, createPlaylist, getAlbumTracks, getArtistTopTracks, addTracksToPlaylist } 
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
        // === PLAY BUTTON HANDLER ===
        const btn = e.target.closest('.play-button');
        
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            
            const uri = btn.dataset.uri; 
            
            console.log("🎵 Click detected on play button");
            console.log("📀 URI:", uri);
            
            if (uri) {
                const parts = uri.split(':');
                const type = parts[1]; 
                const id = parts[2];
                
                console.log(`✅ Playing ${type} with ID: ${id}`);
                
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

                    const searchOverlay = document.getElementById('global-search-overlay');
                    if(searchOverlay) searchOverlay.style.display = 'none';
                } else {
                    console.error("❌ Nu găsesc elementul 'player-content'");
                }
            } else {
                console.error("❌ Butonul nu are atributul data-uri!");
                console.log("Butonul problematic:", btn);
            }
        }

        // === ADD TO PLAYLIST BUTTON HANDLER ===
        const addBtn = e.target.closest('.add-to-playlist-btn');
        
        if (addBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const type = addBtn.dataset.type; // "artist" sau "album"
            const id = addBtn.dataset.id;
            const name = addBtn.dataset.name;
            
            console.log(`➕ Add to playlist: ${type} - ${name}`);
            
            handleAddToPlaylist(type, id, name);
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
async function loadProfileData(token) {
    try {
        const user = await getUserProfile(token);
        
        if (user) {
            // 1. Populare Nume și scoatere clasă skeleton
            const nameEl = document.getElementById('user-display-name');
            if(nameEl) {
                nameEl.innerText = user.display_name;
                nameEl.classList.remove('skeleton', 'skeleton-text');
            }

            // 2. Email
            const emailEl = document.getElementById('user-email-address');
            if(emailEl) {
                emailEl.innerText = user.email || ''; 
                emailEl.classList.remove('skeleton', 'skeleton-text');
            }

            // 3. Poza
            const imgEl = document.getElementById('user-profile-image');
            if (imgEl) {
                if (user.images && user.images.length > 0) {
                    imgEl.src = user.images[0].url;
                } else {
                    const initial = user.display_name ? user.display_name.charAt(0).toUpperCase() : '?';
                    imgEl.src = `https://placehold.co/150x150/8884ff/121131?text=${initial}`;
                }
                imgEl.classList.remove('skeleton'); 
            }
            
            // 4. Followers & Plan
            const followEl = document.getElementById('user-followers');
            if(followEl) {
                followEl.innerHTML = `<i class="fas fa-users"></i> ${user.followers.total} Followers`;
                followEl.classList.remove('skeleton');
                followEl.style.backgroundColor = "rgba(255,255,255,0.1)";
                followEl.style.color = "white";
            }

            const prodEl = document.getElementById('user-product');
            if(prodEl) {
                prodEl.innerText = user.product || 'free';
                prodEl.classList.remove('skeleton');
                prodEl.style.backgroundColor = (user.product === 'premium') ? '#FFD700' : '#8884ff';
                prodEl.style.color = '#121131';
            }

            // ✅ AICI E FIX-UL - APELĂM FUNCȚIA DE PLAYLIST
            await setupPlaylists(token, user.id);
        }
        
        // --- Încărcare Liste ---
        const artistsData = await getTopArtists(token, 5);
        renderTopArtists(artistsData.items);

        const albumsData = await getTopAlbums(token, 5);
        renderTopAlbums(albumsData.items);

        if (artistsData.items.length > 0) {
            const topArtist = artistsData.items[0];
            console.log("Generare recomandări bazate pe artistul:", topArtist.name);
            const recommendations = await getRecommendations(token, topArtist.id, 5);
            
            if (recommendations && recommendations.tracks) {
                renderRecommendations(recommendations.tracks);
            }
        } else {
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

function renderRecommendations(tracks) {
    const container = document.getElementById('recommendations-grid');
    if(!container) return;
    container.innerHTML = '';

    if(!tracks || tracks.length === 0) {
        container.innerHTML = '<p class="subtle-text">No recommendations found.</p>';
        return;
    }

    tracks.forEach((track, index) => {
        const img = track.album.images[0]?.url || 'https://placehold.co/150';
        const trackUri = track.uri || `spotify:track:${track.id}`;
        
        const html = `
            <div class="music-card recommendation-card" style="position: relative;">
                <div style="position: absolute; top:10px; left:10px; background:#8884ff; color:#121131; padding:4px 10px; border-radius:12px; font-size:0.7em; font-weight:bold; z-index:2;">
                    <i class="fas fa-magic"></i> Pick
                </div>
                
                <img src="${img}" class="card-image" alt="${track.name}">
                <h4 class="card-title">${track.name}</h4>
                <p class="card-subtitle">${track.artists[0].name}</p>
                
                <!-- Butoane în partea de jos -->
                <div style="position: absolute; bottom: 15px; right: 15px; display: flex; gap: 10px; z-index: 3;">
                    <button class="add-to-playlist-btn" 
                            data-type="track" 
                            data-id="${track.id}" 
                            data-name="${track.name}"
                            data-uri="${trackUri}"
                            style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; color: #121131; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"
                            title="Add to Playlist">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="play-button" data-uri="${trackUri}" 
                        style="width: 50px; height: 50px; border-radius: 50%; background: #8884ff; border: none; color: #121131; font-size: 1.2em; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(136, 132, 255, 0.4); transition: all 0.3s ease;">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
    
    console.log(`✅ Rendered ${tracks.length} recommendations with play buttons`);
}

function renderTopArtists(artists) {
    const container = document.getElementById('top-artists-grid');
    if(!container) return;
    container.innerHTML = ''; 
    artists.forEach((artist, index) => {
        const img = artist.images[0]?.url || 'https://placehold.co/150';
        container.innerHTML += `
            <div class="music-card artist-card" style="position: relative;">
                <span class="card-rank">${index + 1}</span>
                <img src="${img}" class="card-image">
                <h4 class="card-title">${artist.name}</h4>
                <p class="card-subtitle">Artist</p>
                
                <!-- Butoane în partea de jos -->
                <div style="position: absolute; bottom: 15px; right: 15px; display: flex; gap: 10px; z-index: 3;">
                    <button class="add-to-playlist-btn" 
                            data-type="artist" 
                            data-id="${artist.id}" 
                            data-name="${artist.name}"
                            style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; color: #121131; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"
                            title="Add to Playlist">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="play-button" data-uri="${artist.uri}" style="width: 50px; height: 50px;">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
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
            <div class="music-card album-card" style="position: relative;">
                <span class="card-rank">${index + 1}</span>
                <img src="${img}" class="card-image">
                <h4 class="card-title">${album.name}</h4>
                <p class="card-subtitle">${album.artists[0].name}</p>
                
                <!-- Butoane în partea de jos -->
                <div style="position: absolute; bottom: 15px; right: 15px; display: flex; gap: 10px; z-index: 3;">
                    <button class="add-to-playlist-btn" 
                            data-type="album" 
                            data-id="${album.id}" 
                            data-name="${album.name}"
                            style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; color: #121131; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"
                            title="Add to Playlist">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="play-button" data-uri="${album.uri}" style="width: 50px; height: 50px;">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
            </div>`;
    });
}

// --- FUNCȚII PLAYLIST (UPGRADED) ---
async function setupPlaylists(token, userId) {
    const listContainer = document.getElementById('dynamic-playlists-container');
    const createBtn = document.getElementById('create-playlist-btn');

    if (!listContainer) {
        console.warn("⚠️ Nu găsesc elementul 'dynamic-playlists-container' în HTML!");
        return;
    }

    // Funcție helper pentru a reîncărca lista
    const renderList = async () => {
        try {
            listContainer.innerHTML = '<li style="color:#999; padding:10px;">Loading playlists...</li>';
            
            const data = await getUserPlaylists(token);
            
            if (data && data.items && data.items.length > 0) {
                listContainer.innerHTML = ''; 
                data.items.forEach(playlist => {
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
            } else {
                listContainer.innerHTML = '<li style="color:#999; padding:10px;">No playlists yet. Create one!</li>';
            }
        } catch (e) {
            console.error("Eroare la încărcarea playlist-urilor:", e);
            listContainer.innerHTML = '<li style="color:red; padding:10px;">Error loading playlists</li>';
        }
    };

    // Încarcă lista inițial
    await renderList();

    // Butonul de creare
    if (createBtn) {
        // Prevenim duplicate listeners
        if (!createBtn.hasAttribute('data-listening')) {
            createBtn.setAttribute('data-listening', 'true');
            
            createBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const name = prompt("🎵 Enter playlist name:");
                
                if (name && name.trim() !== "") {
                    try {
                        console.log("Creating playlist:", name);
                        await createPlaylist(token, userId, name.trim());
                        
                        // Success feedback
                        alert("✅ Playlist created successfully!");
                        
                        // Refresh lista
                        await renderList();
                    } catch (error) {
                        console.error("Eroare creare playlist:", error);
                        alert("❌ Could not create playlist. Check console (F12) for details.");
                    }
                }
            });
        }
    } else {
        console.warn("⚠️ Nu găsesc butonul 'create-playlist-btn' în HTML!");
    }
}

// === FUNCȚIE NOUĂ: ADD TO PLAYLIST ===
async function handleAddToPlaylist(type, id, name) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        alert("❌ No token found. Please login again.");
        return;
    }

    try {
        // 1. Obținem lista de playlist-uri
        const playlistsData = await getUserPlaylists(token);
        
        if (!playlistsData || !playlistsData.items || playlistsData.items.length === 0) {
            alert("❌ You don't have any playlists yet. Create one first!");
            return;
        }

        // 2. Construim lista pentru prompt
        let message = `Add "${name}" to which playlist?\n\n`;
        playlistsData.items.forEach((pl, idx) => {
            message += `${idx + 1}. ${pl.name}\n`;
        });
        message += `\nEnter number (1-${playlistsData.items.length}):`;

        const choice = prompt(message);
        
        if (!choice) return; // User canceled
        
        const index = parseInt(choice) - 1;
        
        if (index < 0 || index >= playlistsData.items.length) {
            alert("❌ Invalid choice!");
            return;
        }

        const selectedPlaylist = playlistsData.items[index];
        
        // 3. Obținem track URIs bazate pe tip
        let trackUris = [];
        
        if (type === 'track') {
            // Pentru track individual, folosim direct URI-ul
            const trackUri = event.target.closest('.add-to-playlist-btn').dataset.uri;
            trackUris = [trackUri];
        } else if (type === 'album') {
            const albumTracks = await getAlbumTracks(token, id);
            trackUris = albumTracks.items.map(track => track.uri);
        } else if (type === 'artist') {
            const artistTracks = await getArtistTopTracks(token, id);
            trackUris = artistTracks.tracks.map(track => track.uri);
        }

        if (trackUris.length === 0) {
            alert("❌ No tracks found!");
            return;
        }

        // 4. Adăugăm track-urile în playlist
        await addTracksToPlaylist(token, selectedPlaylist.id, trackUris);
        
        const trackWord = trackUris.length === 1 ? 'track' : 'tracks';
        alert(`✅ Added ${trackUris.length} ${trackWord} to "${selectedPlaylist.name}"!`);
        
    } catch (error) {
        console.error("Error adding to playlist:", error);
        alert("❌ Failed to add to playlist. Check console for details.");
    }
}