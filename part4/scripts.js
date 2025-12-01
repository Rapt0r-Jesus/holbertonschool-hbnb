/* ==========================================================================
   API CONFIGURATION
   --------------------------------------------------------------------------
   Defines the base API URL and authentication endpoints.
========================================================================== */
const API_BASE_URL = 'http://localhost:5000/api/v1';
const API_LOGIN_ENDPOINT = `${API_BASE_URL}/auth/login`;

/* ==========================================================================
   MAIN PAGE INITIALIZER
   --------------------------------------------------------------------------
   Runs on every page load.
   - Detects which page is open
   - Initializes page-specific features
   - Always updates login/logout visibility
========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
    const currentPage = window.location.pathname.split('/').pop();

    // Update login/logout button visibility
    updateLoginDisplay();

    /* ==========================================================================
       INDEX PAGE LOGIC
       --------------------------------------------------------------------------
       Loaded only on index.html
       - Populate price filter
       - Fetch list of places
       - Attach filter event
    ========================================================================== */
    const priceFilter = document.getElementById('price-filter');

    if (currentPage === 'index.html') {
        setupPriceFilterOptions();
        fetchPlaces();

        if (priceFilter) {
            priceFilter.addEventListener('change', filterPlacesByPrice);
        }

        // Function used in onclick to open place details
        window.viewPlaceDetails = (placeId) => {
            window.location.href = `place.html?place_id=${encodeURIComponent(placeId)}`;
        };
    }

    /* ==========================================================================
       PLACE DETAILS PAGE LOGIC
       --------------------------------------------------------------------------
       Loaded only on place.html
       - Retrieves place_id from URL
       - Loads place information + reviews
    ========================================================================== */
    if (currentPage === 'place.html') {
        const placeId = new URLSearchParams(window.location.search).get('place_id');
        if (placeId) loadPlaceDetails(placeId);
    }

    /* ==========================================================================
       LOGIN PAGE LOGIC
       --------------------------------------------------------------------------
       Loaded only on login.html
       - Validates email/password
       - Calls backend login
       - Saves access token on success
    ========================================================================== */
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Basic validation
            if (!email || !password) return alert('Please complete all fields.');

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) return alert('Please enter a valid email address.');

            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Logging in...';
            submitButton.disabled = true;

            try {
                const success = await loginUser(email, password);

                if (success) {
                    updateLoginDisplay();
                    alert('Login successful! Redirecting...');
                    setTimeout(() => (window.location.href = 'index.html'), 1000);
                }

            } catch (error) {
                console.error('Login process failed:', error);
                alert('An unexpected error occurred.');
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }

    /* ==========================================================================
       REVIEW FORM LOGIC (ONLY ON PLACE PAGE)
       --------------------------------------------------------------------------
       - Populates rating dropdown
       - Validates review input
       - Sends POST /reviews/ to backend
    ========================================================================== */
    const reviewForm = document.getElementById('review-form');

    // Populate rating selector (1–5)
    const ratingSelect = document.getElementById('rating');
    if (ratingSelect) {
        ratingSelect.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            ratingSelect.appendChild(option);
        }
    }

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Require login
            if (!isUserLoggedIn()) return alert('You must be logged in to submit a review.');

            const placeId = new URLSearchParams(window.location.search).get('place_id');
            if (!placeId) return alert('Place ID is missing.');

            const comment = document.getElementById('review').value.trim();
            const rating = parseInt(document.getElementById('rating').value, 10);

            // Validation
            if (!comment) return alert('Please enter your review before submitting.');
            if (!rating || rating < 1 || rating > 5) return alert('Please select a valid rating.');

            const submitButton = reviewForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Submitting...';
            submitButton.disabled = true;

            try {
                const token = getCookie('token');

                // POST review to backend
                const response = await fetch(`${API_BASE_URL}/reviews/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        text: comment,
                        place_id: placeId,
                        rating: rating
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    alert(errorData.message || 'Failed to submit review.');
                    return;
                }

                alert('Review submitted successfully!');
                reviewForm.reset();
                loadPlaceDetails(placeId); // Refresh list

            } catch (error) {
                console.error('Review submission error:', error);
                alert('Network error. Please try again.');

            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }

    /* ==========================================================================
       LOGOUT BUTTON HANDLER
    ========================================================================== */
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }
});

/* ==========================================================================
   LOAD PLACE DETAILS + REVIEWS FROM BACKEND
========================================================================== */
async function loadPlaceDetails(placeId) {
    const placeContainer = document.getElementById('place-details');
    const reviewsContainer = document.getElementById('reviews');
    const token = getCookie('token');

    if (!placeContainer || !reviewsContainer) return;

    try {
        // Fetch place details
        const response = await fetch(`${API_BASE_URL}/places/${placeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });

        if (!response.ok) {
            placeContainer.innerHTML = `<p style="color:red;">Error: Place not found</p>`;
            return;
        }

        const place = await response.json();

        // Render place info
        placeContainer.innerHTML = `
            <h2>${place.title || place.name}</h2>
            <p>${place.description}</p>
            <p><strong>Price:</strong> ${place.price}€</p>
            <p><strong>Coordinates:</strong> ${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}</p>
            <p><strong>Amenities:</strong> ${
                place.amenities?.length ? place.amenities.map(a => a.name).join(', ') : 'No amenities listed'
            }</p>
        `;

        // Fetch reviews
        const reviewsResponse = await fetch(`${API_BASE_URL}/places/${placeId}/reviews/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });

        if (!reviewsResponse.ok) {
            reviewsContainer.innerHTML = `<p style="color:red;">Unable to load reviews.</p>`;
            return;
        }

        const reviews = await reviewsResponse.json();

        // Render review list
        reviewsContainer.innerHTML = `<h3>User Reviews</h3><ul id="reviews-list"></ul>`;
        const reviewsList = document.getElementById('reviews-list');

        if (reviews.length === 0) {
            reviewsList.innerHTML = '<li>No reviews available.</li>';
        } else {
            for (let r of reviews) {
                const li = document.createElement('li');
                const username = await getUserName(r.user_id);

                const stars = '★'.repeat(r.rating || 0) + '☆'.repeat(5 - (r.rating || 0));

                li.textContent = `${username} (${stars}): ${r.comment || r.text}`;
                reviewsList.appendChild(li);
            }
        }

    } catch (error) {
        console.error('Network error:', error);
        placeContainer.innerHTML = `<p style="color:red;">Unable to retrieve place details.</p>`;
    }
}

/* ==========================================================================
   GET USER NAME FROM BACKEND
========================================================================== */
async function getUserName(user_id) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${user_id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) return 'Unknown user';

        const user = await response.json();
        return user.name || 'Unknown user';

    } catch {
        return 'Unknown user';
    }
}

/* ==========================================================================
   LOGIN FUNCTION – SENDS CREDENTIALS TO BACKEND
========================================================================== */
async function loginUser(email, password) {
    try {
        const response = await fetch(API_LOGIN_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();

            if (data.access_token) {
                saveTokenToCookie(data.access_token);
                return true;
            }

            alert('Server error: Missing token.');
            return false;
        }

        let errorMessage = 'Incorrect email or password.';
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {}

        alert(errorMessage);
        return false;

    } catch (error) {
        console.error('Network issue:', error);
        alert('Network error. Please try again.');
        return false;
    }
}

/* ==========================================================================
   HOMEPAGE FUNCTIONS & FILTERS
========================================================================== */
function updateLoginDisplay() {
    const token = getCookie('token');
    const loginLink = document.querySelector('.login-button');
    const logoutButton = document.querySelector('.logout-button');

    if (token) {
        if (loginLink) loginLink.style.display = 'none';
        if (logoutButton) logoutButton.style.display = 'inline-block';
    } else {
        if (loginLink) loginLink.style.display = 'inline-block';
        if (logoutButton) logoutButton.style.display = 'none';
    }
}

function setupPriceFilterOptions() {
    const priceFilter = document.getElementById('price-filter');
    if (!priceFilter) return;

    const options = [
        { value: 'all', text: 'All' },
        { value: '10', text: '10€' },
        { value: '50', text: '50€' },
        { value: '100', text: '100€' }
    ];

    priceFilter.innerHTML = '';
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        priceFilter.appendChild(option);
    });
}

async function fetchPlaces() {
    const token = getCookie('token');

    try {
        const response = await fetch(`${API_BASE_URL}/places/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });

        if (!response.ok) return alert('Unable to load available places.');

        const places = await response.json();
        displayPlaces(places);

    } catch (error) {
        alert('Could not connect to server.');
    }
}

function displayPlaces(places) {
    const container = document.getElementById('places-list');
    if (!container) return;

    places.forEach(place => container.appendChild(createPlaceCard(place)));
}

function createPlaceCard(place) {
    const card = document.createElement('div');
    card.className = 'place-card';
    card.dataset.price = place.price;

    card.innerHTML = `
        <h2>${place.title}</h2>
        <p>${place.description || 'No description available'}</p>
        <p class="price">${place.price}€ / night</p>
        <button onclick="viewPlaceDetails('${place.id}')">More details</button>
    `;

    return card;
}

function filterPlacesByPrice() {
    const priceFilter = document.getElementById('price-filter');
    const value = priceFilter.value;
    const cards = document.querySelectorAll('.place-card');

    cards.forEach(card => {
        const price = parseFloat(card.dataset.price);

        card.style.display =
            value === 'all' || price <= parseFloat(value)
                ? 'block'
                : 'none';
    });
}

/* ==========================================================================
   TOKEN MANAGEMENT
========================================================================== */
function saveTokenToCookie(token) {
    const days = 7;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);

    document.cookie = `token=${token}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';')[0];
    return null;
}

function isUserLoggedIn() {
    return getCookie('token') !== null;
}

function logoutUser() {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    updateLoginDisplay();
    window.location.href = 'login.html';
}
