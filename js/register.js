// API_URL is defined globally in auth.js
const API_EVENTS_URL = `${API_URL}/events`;
const API_REGISTRATIONS_URL = `${API_URL}/registrations`;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    if (form) {
        form.addEventListener('submit', handleRegistrationSubmit);
    }
    
    // Check if user is logged in to pre-fill info
    checkAuthState();
    
    // Load events for the dropdown
    loadEventsForDropdown();
});

/**
 * Pre-fill name and email if user is logged in
 */
function checkAuthState() {
    // auth object is available from auth.js
    if (typeof auth !== 'undefined' && auth.isAuthenticated()) {
        const user = auth.getUser();
        if (user) {
            const nameInput = document.getElementById('fullName');
            const emailInput = document.getElementById('email');
            
            if (nameInput) {
                nameInput.value = user.name;
                nameInput.readOnly = true;
                nameInput.classList.add('bg-light');
            }
            
            if (emailInput) {
                emailInput.value = user.email;
                emailInput.readOnly = true;
                emailInput.classList.add('bg-light');
            }

            const phoneInput = document.getElementById('phone');
            if (phoneInput && user.phone) {
                phoneInput.value = user.phone;
            }
            
            // Optionally add a note
            const formHeader = document.querySelector('.card-body p.text-muted');
            if (formHeader) {
                formHeader.innerHTML = `Registering as <strong>${user.name}</strong> (${user.email})`;
            }
        }
    }
}

async function loadEventsForDropdown() {
    const select = document.getElementById('eventSelect');
    if (!select) return;

    try {
        const response = await fetch(API_EVENTS_URL);
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            select.innerHTML = '<option value="" selected disabled>Choose an event...</option>';
            result.data.forEach(event => {
                const dateStr = event.date ? new Date(event.date).toLocaleDateString() : '';
                select.innerHTML += `<option value="${event._id}">${event.title} (${dateStr})</option>`;
            });

            // Pre-select event if eventId is in URL
            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get('eventId');
            if (eventId) {
                select.value = eventId;
            }
        } else {
            select.innerHTML = '<option value="" selected disabled>No events available</option>';
        }
    } catch (error) {
        console.error('Error fetching events:', error);
        select.innerHTML = '<option value="" selected disabled>Error loading events</option>';
    }
}

async function handleRegistrationSubmit(event) {
    const form = event.target;
    
    if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        form.classList.add('was-validated');
        return;
    }
    
    event.preventDefault();
    form.classList.add('was-validated');

    // Gather data
    const registrationData = {
        name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        event: document.getElementById('eventSelect').value,
        guests: Number(document.getElementById('guests').value),
        paymentMethod: document.getElementById('payment').value,
        specialRequirements: document.getElementById('requirements').value
    };

    // Change button state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registering...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(API_REGISTRATIONS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add authorization header if available
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(registrationData)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Registration Successful! Your spot is secured.', 'success');
            form.reset();
            form.classList.remove('was-validated');
            
            // Re-run auth check to restore pre-filled values if logged in
            checkAuthState();
            
            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            showToast('Registration Failed: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Failed to connect to the server. Please ensure the backend is running.', 'error');
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}
