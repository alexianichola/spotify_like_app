// =======================================================
// MOCK API MODULE (Simuleaza munca Persoanei A)
// =======================================================

// --- Mock Data pentru a simula rezultate reale ---
const MOCK_PROFILE = {
    display_name: 'Mock User',
    email: 'mock.user@spoti.com',
    profile_image_url: 'https://placehold.co/150x150/1C184C/FFeedd?text=MOCK',
    id: 'mock-user-id-123'
};

const MOCK_TRACK_DETAILS = {
    title: 'Simulated Song Title',
    artist: 'Mock Artist',
    album_art: 'https://placehold.co/200x200/8884FF/121131?text=PLAYING'
};


// 1. MOCK: Autentificare si Profil (Necesara pentru initializare)
// Simulează funcția de a obține datele utilizatorului după logare.
export async function getMockUserProfile() {
    console.log("[MOCK API] Fetching user profile...");
    // Simulam o intarziere (latency)
    await new Promise(resolve => setTimeout(resolve, 500)); 
    return MOCK_PROFILE;
}


// 2. MOCK: Funcționalitatea "Play a song"
// Simulează inițierea redării unui URI Spotify (poate fi un track, album sau playlist).
export async function playTrackOrAlbum(uri) {
    console.log(`[MOCK API] Initiating playback for URI: ${uri}`);
    await new Promise(resolve => setTimeout(resolve, 300)); 

    if (!uri) {
        console.error("[MOCK API] ERROR: No URI provided.");
        return { success: false, message: "Missing URI" };
    }
    
    // Returneaza detaliile melodiei care "se redă"
    return { 
        success: true, 
        current_playback: {
            is_playing: true,
            uri: uri,
            ...MOCK_TRACK_DETAILS
        }
    };
}


// 3. MOCK: Controalele Player-ului (Pause, Skip)
// Simulează acțiunile trimise player-ului (ca în #player-controls).
export async function playerControls(action) {
    console.log(`[MOCK API] Executing player action: ${action}`);
    await new Promise(resolve => setTimeout(resolve, 100)); 

    return { success: true, status: action + ' done' };
}


// 4. MOCK: Căutare Dinamică
// Simulează rezultatele de căutare (necesară pentru Persoana C în Search Overlay).
export async function searchContent(query) {
    console.log(`[MOCK API] Searching for: ${query}`);
    await new Promise(resolve => setTimeout(resolve, 200)); 

    if (query.length < 3) {
        return { artists: [], albums: [], tracks: [] };
    }

    // Returnează rezultate mock pe baza query-ului
    return {
        artists: [{ name: `Mock Artist ${query}` }, { name: 'Another Mock Artist' }],
        tracks: [{ title: `Mock Track ${query}`, uri: 'spotify:track:123' }],
    };
}


// 5. MOCK: Listarea Playlist-urilor (Pentru noua secțiune din Sidebar)
export async function getPlaylists() {
    console.log("[MOCK API] Fetching user playlists...");
    await new Promise(resolve => setTimeout(resolve, 300)); 

    return [
        { name: 'My Party Mix', uri: 'spotify:playlist:party' },
        { name: 'Chill Vibes', uri: 'spotify:playlist:chill' },
        { name: 'Mock Study List', uri: 'spotify:playlist:study' }
    ];
}


// 6. MOCK: Creare Playlist
export async function createPlaylist(name) {
    console.log(`[MOCK API] Creating playlist: ${name}`);
    return { success: true, message: `Playlist '${name}' created.` };
}