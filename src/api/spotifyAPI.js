// spotifyAPI.js

/**
 * Funcție ajutătoare pentru a face cereri GET către API-ul Spotify.
 * @param {string} token - Access Token-ul utilizatorului.
 * @param {string} endpoint - Partea de URL după https://api.spotify.com/v1/
 */
async function fetchSpotify(token, endpoint) {
    const response = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
        headers: {
            // Cheia magică: trimiterea token-ului în header-ul Authorization
            'Authorization': 'Bearer ' + token
        }
    });

    // 1. Verificarea erorilor HTTP
    if (!response.ok) {
        // Ex: 401 Unauthorized (Token invalid), 404 Not Found, etc.
        throw new Error(`Eroare API la ${endpoint}: ${response.status}`);
    }

    // 2. Returnarea datelor JSON
    if (response.status === 204) return null; // No Content (ex: succes la un PUT/DELETE)
    
    return response.json();
}

// --- Implementarea Funcțiilor Cerute ---

/**
 * Obține informațiile de bază despre utilizatorul curent.
 */
export async function getUserProfile(token) {
    return fetchSpotify(token, 'me'); 
}

/**
 * Obține Top 5 Artiști ai utilizatorului.
 */
export async function getTopArtists(token, limit = 5) {
    // time_range: medium_term (ultimele 6 luni)
    return fetchSpotify(token, `me/top/artists?limit=${limit}&time_range=medium_term`); 
}

/**
 * Obține Top 5 Albume (prin extragerea albumelor unice din Top 5 Melodii).
 */
export async function getTopAlbums(token, limit = 5) {
    // 1. Obținem Top Tracks (melodiile)
    const topTracks = await fetchSpotify(token, `me/top/tracks?limit=50&time_range=medium_term`);

    // 2. Filtrăm pentru a obține doar albume unice (un album poate avea mai multe melodii în top)
    const uniqueAlbums = [];
    const albumIds = new Set(); // Folosim Set pentru a urmări ID-urile unice

    for (const track of topTracks.items) {
        if (!albumIds.has(track.album.id)) {
            albumIds.add(track.album.id);
            uniqueAlbums.push(track.album);
            if (uniqueAlbums.length >= limit) break; // Ne oprim la limita cerută
        }
    }

    // Întoarcem rezultatul într-un format similar cu cel al API-ului
    return { items: uniqueAlbums }; 
}

/**
 * Caută piese, artiști și albume.
 */
export async function search(token, query) {
    if (!query) return null;
    // Căutăm tipurile 'artist', 'track', 'album'
    return fetchSpotify(token, `search?q=${encodeURIComponent(query)}&type=artist,track,album&limit=10`);
}


export async function getRecommendations(token, seedArtists, limit = 5) {
    // Ex: Caută recomandări pe baza a 5 artiști (ID-uri separate prin virgulă)
    const endpoint = `recommendations?limit=${limit}&seed_artists=${seedArtists}`;
    return fetchSpotify(token, endpoint); 
}


export async function createPlaylist(token, userId, playlistName) {
    // Endpoint: /users/{user_id}/playlists
    const endpoint = `users/${userId}/playlists`;
    const response = await fetch('http://googleusercontent.com/spotify.com/7' + endpoint, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: playlistName,
            public: true 
        })
    });

    if (!response.ok) {
        throw new Error(`Eroare la crearea playlist-ului: ${response.status}`);
    }
    return response.json();
}