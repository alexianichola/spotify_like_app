// =======================================================
// MOCK APP INTEGRATION (Simuleaza munca Persoanei C)
// =======================================================

// 1. Importam functiile mock API (din fisierul Persoanei A)
import { 
    getMockUserProfile, 
    playTrackOrAlbum, 
    playerControls, 
    searchContent, 
    getPlaylists 
} from './mockSpotifyAPI.js'; // Asigura-te ca path-ul e corect

// --- Functii de Integrare DOM ---

// 2. Functia de Populare a Profilului
// Populeaza Profile Header si afiseaza Playlist-urile
async function populateUI() {
    // A. Populeaza Profile Header
    const user = await getMockUserProfile();
    document.getElementById('user-display-name').textContent = user.display_name;
    document.getElementById('user-email-address').textContent = user.email;
    document.getElementById('user-profile-image').src = user.profile_image_url;
    document.getElementById('user-id-display').textContent = `ID: ${user.id}`;
    
    // B. Populeaza Playlist-urile (Sidebar)
    const playlists = await getPlaylists();
    const playlistList = document.getElementById('playlist-list');
    
    // Sterge placeholder-urile existente, dar pastreaza 'Create New'
    const createNewItem = playlistList.querySelector('.create-new');
    playlistList.innerHTML = ''; 
    
    playlists.forEach(p => {
        const li = document.createElement('li');
        li.className = 'playlist-item';
        li.innerHTML = `<a href="#"><i class="fas fa-list-ul"></i> <span>${p.name}</span></a>`;
        playlistList.appendChild(li);
    });
    
    // Adauga la loc butonul 'Create New'
    if (createNewItem) {
        playlistList.appendChild(createNewItem);
    }
}

// 3. Functia de Gestionare a Butonului Play (pe carduri)
async function handlePlayButtonClick(event) {
    const button = event.currentTarget;
    const uri = button.getAttribute('data-uri');

    // Apelam functia mock API pentru a initia redarea
    const response = await playTrackOrAlbum(uri);

    if (response.success) {
        const { title, artist, album_art } = response.current_playback;
        
        // Manipularea DOM-ului in Music Player Bar
        document.getElementById('no-song-message').style.display = 'none';
        document.getElementById('song-playing-ui').style.display = 'block'; // Afisam player-ul UI
        
        document.getElementById('current-song-title').textContent = title;
        document.getElementById('current-artist-name').textContent = artist;
        document.getElementById('current-album-art').src = album_art;
    }
}


// 4. Functia de Gestionare a Controalelor Player-ului
async function handlePlayerControls(event) {
    const button = event.currentTarget;
    const action = button.getAttribute('data-action'); 
    
    // Apelam functia mock API pentru control
    const response = await playerControls(action);

    if (response.success) {
        console.log(`Player status updated: ${response.status}`);
        // Aici Persoana C ar schimba iconita din Play in Pause si invers
    }
}


// 5. Functia de Initializare a TUTUROR Event Listener-ilor
export function initMockIntegration() {
    console.log("Mock Integration running...");
    
    // A. Adauga event listener-i pe butoanele de Play/Pauza din carduri
    document.querySelectorAll('.play-button').forEach(button => {
        button.addEventListener('click', handlePlayButtonClick);
    });

    // B. Adauga event listener-i pe controalele Player-ului (Inainte/Inapoi/Play)
    document.querySelectorAll('#player-controls button').forEach(button => {
        // Atribuim actiunea (Pause, Next, Previous) Persoana B (tu) trebuie sa adauge data-action in HTML!
        const icon = button.querySelector('i');
        let action = '';
        if (icon) {
            if (icon.classList.contains('fa-play')) action = 'pause'; // Presupunem ca la click se face pause
            else if (icon.classList.contains('fa-step-forward')) action = 'next';
            else if (icon.classList.contains('fa-step-backward')) action = 'previous';
        }
        button.setAttribute('data-action', action); // Adaugam atributul
        button.addEventListener('click', handlePlayerControls);
    });
    
    // C. Incarca datele de profil (executat o singura data la incarcarea paginii)
    populateUI();
    
    // D. Simuleaza logica de Search (optional, dar util pentru testare)
    // Persoana C ar adauga aici logica de debouncing si afisare rezultate.
}