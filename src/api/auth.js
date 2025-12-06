// auth.js

const CLIENT_ID = '60baf3871be946408432c88fba3b0f57'; // ID-ul tău de aplicație Spotify
// URL-ul complet al fișierului callback.html pe care îl rulezi local
const REDIRECT_URI = 'http://127.0.0.1:5500/callback.html'; 
// Permisiunile (Scopes) cerute de la utilizator
const SCOPES = 'user-read-private user-top-read'; 

const CLIENT_SECRET = '8ccb68010896419b92cfd56d3eeed802'; 

/**
 * Redirecționează utilizatorul către pagina de login Spotify.
 */
export async function login() {
    const authUrl = new URL('https://accounts.spotify.com/authorize');

    // 1. Generăm un string aleatoriu pentru a proteja împotriva atacurilor CSRF
    const state = generateRandomString(16); 
    localStorage.setItem('spotify_auth_state', state);

    // 2. Parametrii cererii de autorizare
    const params = {
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: SCOPES,
        redirect_uri: REDIRECT_URI,
        state: state
    };

    // 3. Construim și efectuăm redirecționarea
    authUrl.search = new URLSearchParams(params).toString();
    console.log(authUrl.search)
    window.location = authUrl.toString();
}

/**
 * Schimbă codul de autorizare (primit în callback) cu un Access Token.
 */
export async function getToken(code) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            // Autentificare Basic (Client ID:Client Secret) codată Base64
            'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET) 
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        })
    });

    if (!response.ok) {
        throw new Error(`Eroare la obținerea token-ului: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token; 
}

/**
 * Funcție ajutătoare pentru a genera un string aleatoriu.
 */
function generateRandomString(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}