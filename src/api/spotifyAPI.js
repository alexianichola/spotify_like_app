async function fetchSpotify(token, endpoint) {
  const baseUrl = "https://api.spotify.com/v1/";
  const cleanEndpoint = endpoint.trim();
  const url = baseUrl + (cleanEndpoint.startsWith('/') ? cleanEndpoint.substring(1) : cleanEndpoint);
  
  console.log("Fetching URL:", url);
  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + token },
  });

  if (!response.ok) {
    throw new Error(`Eroare API (${response.status})`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function getUserProfile(token) {
  return fetchSpotify(token, "me");
}

export async function getTopArtists(token, limit = 5) {
  return fetchSpotify(token, `me/top/artists?limit=${limit}&time_range=medium_term`);
}

export async function getTopAlbums(token, limit = 5) {
  const topTracks = await fetchSpotify(token, `me/top/tracks?limit=50&time_range=medium_term`);
  const uniqueAlbums = [];
  const albumIds = new Set();

  if (topTracks && topTracks.items) {
      for (const track of topTracks.items) {
        if (!albumIds.has(track.album.id)) {
          albumIds.add(track.album.id);
          uniqueAlbums.push(track.album);
          if (uniqueAlbums.length >= limit) break;
        }
      }
  }
  return { items: uniqueAlbums };
}

export async function search(token, query) {
  if (!query) return null;
  const safeQuery = encodeURIComponent(query);
  return fetchSpotify(token, `search?q=${safeQuery}&type=artist,track,album&limit=10`);
}

export async function getRecommendations(token, seedArtistsIds, limit = 5) {
  if (!seedArtistsIds) return null;
  const mainArtistId = seedArtistsIds.split(',')[0].trim();
  const endpoint = `artists/${mainArtistId}/top-tracks?market=RO`;
  return fetchSpotify(token, endpoint);
}

export async function getUserPlaylists(token) {
    return fetchSpotify(token, `me/playlists?limit=20`); 
}

export async function createPlaylist(token, userId, playlistName) {
    const url = `https://api.spotify.com/v1/users/${userId}/playlists`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: playlistName,
            description: "Created via SpotiPuff App",
            public: false
        })
    });

    if (!response.ok) {
        throw new Error("Eroare la crearea playlist-ului");
    }
    return response.json();
}

// === FUNCȚII NOI PENTRU ADD TO PLAYLIST ===

// Obține toate track-urile dintr-un album
export async function getAlbumTracks(token, albumId) {
    return fetchSpotify(token, `albums/${albumId}/tracks?limit=50`);
}

// Obține top tracks ale unui artist
export async function getArtistTopTracks(token, artistId) {
    return fetchSpotify(token, `artists/${artistId}/top-tracks?market=RO`);
}

// Adaugă track-uri într-un playlist
export async function addTracksToPlaylist(token, playlistId, trackUris) {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    
    // Spotify permite max 100 tracks per request
    const chunks = [];
    for (let i = 0; i < trackUris.length; i += 100) {
        chunks.push(trackUris.slice(i, i + 100));
    }
    
    for (const chunk of chunks) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                uris: chunk
            })
        });

        if (!response.ok) {
            throw new Error(`Eroare la adăugarea track-urilor: ${response.status}`);
        }
    }
    
    return true;
}