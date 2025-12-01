/* =======================
   API CONFIGURATION
========================== */
const API_BASE_URL = 'http://localhost:5000/api/v1';
const API_LOGIN_ENDPOINT = `${API_BASE_URL}/auth/login`;

/* =======================
   MAIN PAGE INITIALIZER
========================== */
document.addEventListener('DOMContentLoaded', async () => {
    const currentPage = window.location.pathname.split('/').pop();

    // Always update login/logout display on page load
    updateLoginDisplay();

    /* =============== INDEX PAGE LOGIC =============== */
    const priceFilter = document.getElementById('price-filter');

    if (currentPage === 'index.html') {
        setupPriceFilterOptions();
        fetchPlaces();

        if (priceFilter) {
            priceFilter.addEventListener('change', filterPlacesByPrice);
        }

        // Function used in HTML onclick()
        window.viewPlaceDetails = (placeId) => {
            window.location.href = `place.html?place_id=${encodeURIComponent(placeId)}`;
        };
    }

    /* ================= PLACE DETAILS PAGE ================ */
    if (currentPage === 'place.html') {
        const placeId = new URLSearchParams(window.location.search).get('place_id');
        if (placeId) loadPlaceDetails(placeId);
    }

    /* ========================= LOGIN PAGE ========================= */
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                alert('Please complete all fields.');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }

            const submitButton = loginForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Logging in...';
            submitButton.disabled = true;

            try {
                const success = await loginUser(email, password);

                if (success) {
                    updateLoginDisplay(); // show logout button, hide login link
                    alert('Login successful! Redirecting...');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
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

    /* ============= REVIEW FORM (PLACE PAGE) ============== */
    const reviewForm = document.getElementById('review-form');

    // Populate rating select (1-5)
    const ratingSelect = document.getElementById('rating');
    if (ratingSelect) {
        ratingSelect.innerHTML = ''; // Clear any existing options
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

            // Check if user is logged in
            if (!isUserLoggedIn()) {
                alert('You must be logged in to submit a review.');
                return;
            }

            const placeId = new URLSearchParams(window.location.search).get('place_id');
            if (!placeId) {
                alert('Place ID is missing.');
                return;
            }

            const comment = document.getElementById('review').value.trim();
            const rating = parseInt(document.getElementById('rating').value, 10);

            // Validate input
            if (!comment) {
                alert('Please enter your review before submitting.');
                return;
            }

            if (!rating || rating < 1 || rating > 5) {
                alert('Please select a valid rating.');
                return;
            }

            const submitButton = reviewForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Submitting...';
            submitButton.disabled = true;

            try {
                const token = getCookie('token');
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

                // Refresh the reviews list
                loadPlaceDetails(placeId);

            } catch (error) {
                console.error('Review submission error:', error);
                alert('Network error. Please try again.');
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }

    /* ================= LOGOUT BUTTON ================= */
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }
});

/* ===================================================================
   DISPLAY PLACE DETAILS + REVIEWS
=================================================================== */
async function loadPlaceDetails(placeId) {
    const placeContainer = document.getElementById('place-details');
    const reviewsContainer = document.getElementById('reviews');
    const token = getCookie('token');

    if (!placeContainer || !reviewsContainer) return;

    try {
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

        placeContainer.innerHTML = `
            <h2>${place.title || place.name}</h2>
            <p>${place.description}</p>
            <p><strong>Price:</strong> ${place.price}€</p>
            <p><strong>Coordinates:</strong> ${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}</p>
            <p><strong>Amenities:</strong> ${
                place.amenities && place.amenities.length > 0 
                ? place.amenities.map(a => a.name).join(', ') 
                : 'No amenities listed'
            }</p>
        `;

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

        reviewsContainer.innerHTML = `<h3>User Reviews</h3><ul id="reviews-list" style="padding-left:20px;"></ul>`;
        const reviewsList = document.getElementById('reviews-list');

        if (reviews.length === 0) {
            reviewsList.innerHTML = '<li>No reviews available.</li>';
        } else {
            for (let r of reviews) {
                const li = document.createElement('li');
                const username = await getUserName(r.user_id);

                // Display stars for rating
                const rating = r.rating || 0;
                const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

                li.textContent = `${username} (${stars}): ${r.comment || r.text}`;
                reviewsList.appendChild(li);
            }
        }
    } catch (error) {
        console.error('Network error:', error);
        placeContainer.innerHTML = `<p style="color:red;">Unable to retrieve place details.</p>`;
    }
}

/* ===================================================================
   GET USER NAME FROM USER ID
=================================================================== */
async function getUserName(user_id) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${user_id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) return 'Unknown user';
        const user = await response.json();
        return user.name || 'Unknown user';
    } catch (err) {
        console.error('Failed to fetch username:', err);
        return 'Unknown user';
    }
}

/* ===================================================================
   LOGIN FUNCTION — CALL BACKEND AUTH
=================================================================== */
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
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {}

        alert(errorMessage);
        return false;

    } catch (error) {
        console.error('Network issue:', error);
        alert('Network error. Please try again.');
        return false;
    }
}

/* ===================================================================
   HOMEPAGE FUNCTIONS (INDEX)
=================================================================== */
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
            headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) }
        });

        if (!response.ok) {
            alert('Unable to load available places.');
            return;
        }

        const places = await response.json();
        displayPlaces(places);

    } catch (error) {
        console.error('Network error:', error);
        alert('Could not connect to server.');
    }
}

function displayPlaces(places) {
    const container = document.getElementById('places-list');
    if (!container) return;

    places.forEach(place => {
        const card = createPlaceCard(place);
        container.appendChild(card);
    });
}

function createPlaceCard(place) {
    const card = document.createElement('div');
    card.className = 'place-card';
    card.dataset.price = place.price;

    card.innerHTML = `
        <h2>${place.title}</h2>
        <p>${place.description || 'No description available'}</p>
        <p class="price">${place.price}€ / night</p>
        <button class="details-button" onclick="viewPlaceDetails('${place.id}')">More details</button>
    `;
    return card;
}

function filterPlacesByPrice() {
    const priceFilter = document.getElementById('price-filter');
    const value = priceFilter.value;
    const cards = document.querySelectorAll('.place-card');

    cards.forEach(card => {
        const price = parseFloat(card.dataset.price);

        if (value === 'all' || price <= parseFloat(value)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

/* ===================================================================
   TOKEN MANAGEMENT FUNCTIONS
=================================================================== */
function saveTokenToCookie(token) {
    const days = 7;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `token=${token}; ${expires}; path=/; SameSite=Lax`;
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
