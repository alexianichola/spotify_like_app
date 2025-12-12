# SpotiPuff - Spotify Web Application

A web application that integrates with Spotify's Web API to display user listening statistics, manage playlists, and provide music recommendations.

## Project Overview

SpotiPuff is a client-side JavaScript application that uses OAuth 2.0 to authenticate users with Spotify and display their personalized music data. It provides an interactive interface.

## Tech Stack

- HTML, CSS, JavaScript
- Spotify Web API
- Google Fonts (Outfit family)

## File Structure and Descriptions

### HTML Files

**index.html**
The application entry point and login page. Contains the authentication trigger button that initiates the OAuth flow. Minimal design with centered layout.

**profile.html**
The main dashboard displaying user information and music statistics. This is the primary interface after authentication, showing:
- User profile header with name, email, followers, and subscription type
- Top 5 artists 
- Top 5 albums based on listening history
- Recommendations section
- Sidebar navigation with playlist management
- Embedded music player panel

**top-artists.html**
Dedicated page for viewing an expanded list of the user's most-listened artists. Shares the same layout structure as profile.html but focuses exclusively on artist data with larger grid display.

**top-albums.html**
Similar to top-artists.html but displays the user's most-played albums. Shows album artwork, titles, and artist names in an expanded grid format.

**callback.html**
OAuth redirect handler. This page receives the authorization code from Spotify after successful login, exchanges it for an access token, stores it in localStorage, and redirects to profile.html. Critical for the authentication flow but invisible to users.

### JavaScript Files

**app.js** (Main Application Controller)
The central file that manages application state and user interactions.

Key functions:

`DOMContentLoaded event handler`
Initializes the application by checking for existing tokens, determining the current page, and setting up appropriate event listeners.

`setupSearch(token)`
Configures the global search functionality. Creates overlay interface, attaches input listeners, and manages search result rendering. Handles both desktop sidebar and mobile bottom navigation triggers.

`renderDynamicResults(data, container)`
Processes Spotify search API responses and generates HTML for track results. Creates interactive song cards with play buttons and album artwork. Limited to displaying top 5 results for clean UI.

`loadProfileData(token)`
Async function that orchestrates profile page data loading. Makes parallel API calls to fetch user info, top 5 artists, top 5 albums, and generates recommendations. Handles skeleton loading states and error scenarios including token expiration.

`renderTopArtists(artists)` / `renderTopAlbums(albums)` / `renderRecommendations(tracks)`
Rendering functions that convert API response objects into HTML card elements. Each card includes:
- Ranking badge (for top content)
- Album/artist artwork
- Title and subtitle
- Play button with data-uri attribute
- Add to playlist button with metadata

`setupPlaylists(token, userId)`
Manages playlist display in sidebar and creation functionality. Fetches user's existing playlists via API and renders them as clickable links. Attaches event listener to "Create Playlist" button that prompts for name and calls Spotify's playlist creation endpoint.

`handleAddToPlaylist(type, id, name)`
Complex function that handles adding content to playlists. Logic branches based on content type:
- For tracks: adds single song URI
- For albums: fetches all album tracks then adds them
- For artists: fetches top 10 tracks then adds them

Shows interactive prompt for playlist selection and provides feedback on success/failure.

Global click event delegation
Single event listener on document.body that handles all play button and add-to-playlist button clicks throughout the app using event delegation pattern. Prevents multiple listener attachments and improves performance.

**src/api/auth.js** (Authentication Module)

Contains OAuth 2.0 implementation for Spotify authentication.

Constants:
- `CLIENT_ID`: Spotify application identifier
- `CLIENT_SECRET`: Application secret key (should be server-side in production)
- `REDIRECT_URI`: Callback URL registered with Spotify
- `SCOPES`: Space-separated permissions requested from user

`login()`
Constructs Spotify authorization URL with required parameters (client_id, scope, redirect_uri, state). Generates random state string for CSRF protection and stores in localStorage. Redirects browser to Spotify's authorization page.

`getToken(code)`
Exchanges authorization code for access token using POST request to Spotify's token endpoint. Uses Basic authentication with base64-encoded client credentials. Returns access_token string that must be included in all subsequent API requests.

`generateRandomString(length)`
Helper function that creates cryptographically random string for state parameter. Uses character pool of alphanumeric characters.

**src/api/spotifyAPI.js** (API Wrapper Module)

Encapsulates all Spotify Web API calls with consistent error handling.

`fetchSpotify(token, endpoint)`
Core utility function that all other API functions use. Handles:
- URL construction from base + endpoint
- Authorization header injection
- Response status checking
- JSON parsing
- Special case for 204 No Content responses

`getUserProfile(token)`
Fetches authenticated user's profile data from /v1/me endpoint. Returns object containing display_name, email, images array, followers, and product (subscription type).

`getTopArtists(token, limit = 5)`
Retrieves user's most-listened artists from /v1/me/top/artists. Uses medium_term time range (approximately 6 months of listening data). Returns paginated response with artist objects containing names, images, genres, and URIs.

`getTopAlbums(token, limit = 5)`
Custom implementation since Spotify doesn't have a direct "top albums" endpoint. Fetches top 50 tracks, then extracts unique albums while preserving order. Uses Set to track already-seen album IDs and stops when reaching requested limit.

`search(token, query)`
Performs multi-type search across artists, tracks, and albums. Encodes query string to handle special characters. Returns object with separate arrays for each content type.

`getRecommendations(token, seedArtistsIds, limit = 5)`
Initially designed to use /v1/recommendations endpoint but switched to /v1/artists/{id}/top-tracks for reliability. Takes artist ID as seed and returns their most popular tracks. Uses RO (Romania) as market parameter.

`getUserPlaylists(token)`
Fetches user's playlist collection from /v1/me/playlists. Returns array of playlist objects with id, name, external_urls, and track counts. Limited to 20 results.

`createPlaylist(token, userId, playlistName)`
Creates new empty playlist for user. POST request to /v1/users/{userId}/playlists with JSON body containing name, description, and public flag. Returns created playlist object with unique ID.

`getAlbumTracks(token, albumId)`
Retrieves all tracks from specific album. Returns simplified track objects (without full album info) up to 50 tracks per request.

`getArtistTopTracks(token, artistId)`
Gets an artist's most popular tracks in specified market. Returns array of full track objects ordered by popularity.

`addTracksToPlaylist(token, playlistId, trackUris)`
Adds tracks to existing playlist. Handles chunking for large track lists (Spotify limits to 100 tracks per request). Sends POST requests with array of Spotify URIs in format "spotify:track:ID".

### CSS File

**style.css**
Contains all styling with CSS custom properties for theming. Implements responsive design with media queries for mobile (<768px). Uses CSS Grid for card layouts and Flexbox for component alignment.

## Setup Instructions

1. Register application at https://developer.spotify.com/dashboard
2. Note your Client ID and Client Secret
3. Add http://127.0.0.1:5500/callback.html to app's Redirect URIs
4. Update CLIENT_ID and CLIENT_SECRET in src/api/auth.js
5. Start local server on port 5500
6. Navigate to http://127.0.0.1:5500/index.html
7. Click Login and authorize application

## API Flow

1. User clicks Login → redirected to Spotify authorization page
2. User grants permissions → redirected to callback.html with code parameter
3. callback.html exchanges code for access_token via auth.js
4. Token stored in localStorage for session persistence
5. All subsequent API calls include token in Authorization header
6. Token expires after 1 hour 

## Browser Compatibility

Requires modern browser with support for:
- Fetch API
- LocalStorage
- CSS Grid and Flexbox
- Arrow functions and async/await
