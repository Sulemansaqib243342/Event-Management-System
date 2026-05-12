// API_URL is defined globally in auth.js
const API_BASE_URL = API_URL;

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats();
    fetchEvents();
    fetchRegistrations();

    const saveEventBtn = document.getElementById('btn-save-event');
    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', saveEvent);
    }

    const createEventBtn = document.getElementById('btn-create-event');
    if (createEventBtn) {
        createEventBtn.addEventListener('click', () => {
            // Reset form for creating new event
            document.getElementById('event-form').reset();
            document.getElementById('event-id').value = '';
            document.getElementById('eventModalLabel').innerText = 'Create New Event';
        });
    }

    // Sidebar navigation
    const navLinks = document.querySelectorAll('#dashboard-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            if (section) {
                switchSection(section);
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active', 'text-body'));
                navLinks.forEach(l => l.classList.add('text-body'));
                link.classList.add('active');
                link.classList.remove('text-body');
            }
        });
    });
});

// Switch between dashboard sections
function switchSection(sectionId) {
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(s => s.classList.add('d-none'));
    
    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
        target.classList.remove('d-none');
        
        // Load specific section data if needed
        if (sectionId === 'revenue') {
            fetchRevenueReport();
        } else if (sectionId === 'attendees') {
            fetchAttendees();
        }
    }
}

// Fetch dashboard stats
async function fetchDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/registrations/stats`, {
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });
        const result = await response.json();

        if (result.success) {
            const stats = result.data;
            document.getElementById('stat-total-events').innerText = stats.totalEvents;
            document.getElementById('stat-total-attendees').innerText = stats.totalAttendees.toLocaleString();
            document.getElementById('stat-total-revenue').innerText = `$${stats.totalRevenue.toLocaleString()}`;
            document.getElementById('stat-total-registrations').innerText = stats.totalRegistrations.toLocaleString();
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

// Fetch events and populate table
async function fetchEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });
        const result = await response.json();
        
        const tbody = document.getElementById('events-tbody');
        tbody.innerHTML = ''; // Clear table

        if (result.success && result.data.length > 0) {
            result.data.forEach(event => {
                // Ensure date format is readable
                const dateStr = event.date ? new Date(event.date).toLocaleDateString() : 'N/A';
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <span class="editable-title fw-medium" 
                              contenteditable="true" 
                              data-id="${event._id}" 
                              title="Click to edit title">
                            ${event.title}
                        </span>
                    </td>
                    <td>${dateStr} <br><small class="text-muted">${event.time || ''}</small></td>
                    <td>${event.venue}</td>
                    <td><span class="badge bg-primary bg-opacity-10 text-primary px-3 rounded-pill">${event.category}</span></td>
                    <td>$${event.price}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary rounded-circle me-1" onclick="editEvent('${event._id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="deleteEvent('${event._id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);

                // Add event listeners for inline editing
                const titleSpan = tr.querySelector('.editable-title');
                
                // Prevent Enter key from creating new line, save instead
                titleSpan.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        titleSpan.blur();
                    }
                });

                // Save when user clicks away
                titleSpan.addEventListener('blur', async () => {
                    const newTitle = titleSpan.innerText.trim();
                    if (newTitle && newTitle !== event.title) {
                        await updateEventTitle(event._id, newTitle);
                    } else if (!newTitle) {
                        // Reset if empty
                        titleSpan.innerText = event.title;
                    }
                });
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No events found. Create one!</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching events:', error);
        document.getElementById('events-tbody').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load events. Is the backend running?</td></tr>';
    }
}

// Open modal and load event data
async function editEvent(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${id}`, {
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });
        const result = await response.json();

        if (result.success) {
            const event = result.data;
            document.getElementById('event-id').value = event._id;
            document.getElementById('event-title').value = event.title;
            // Format date for <input type="date"> (YYYY-MM-DD)
            let dateVal = '';
            if (event.date) {
                const d = new Date(event.date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                dateVal = `${year}-${month}-${day}`;
            }
            document.getElementById('event-date').value = dateVal;
            document.getElementById('event-time').value = event.time || '';
            document.getElementById('event-venue').value = event.venue || '';
            document.getElementById('event-category').value = event.category || 'Corporate';
            document.getElementById('event-price').value = event.price || 0;
            document.getElementById('event-image').value = event.imageUrl || 'images/event_corporate.png';
            document.getElementById('event-description').value = event.description || '';

            document.getElementById('eventModalLabel').innerText = 'Edit Event';
            
            // Show modal using Bootstrap API
            const eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
            eventModal.show();
        }
    } catch (error) {
        console.error('Error fetching event details:', error);
        showToast('Failed to load event details.', 'error');
    }
}

// Save or Update Event
async function saveEvent() {
    const id = document.getElementById('event-id').value;
    const isEditing = !!id;

    // Get values
    const eventData = {
        title: document.getElementById('event-title').value,
        date: document.getElementById('event-date').value,
        time: document.getElementById('event-time').value,
        venue: document.getElementById('event-venue').value,
        category: document.getElementById('event-category').value,
        price: Number(document.getElementById('event-price').value),
        imageUrl: document.getElementById('event-image').value,
        description: document.getElementById('event-description').value
    };

    // Basic validation
    if (!eventData.title || !eventData.date || !eventData.venue || !eventData.description) {
        showToast('Please fill out all required fields.', 'error');
        return;
    }

    try {
        const url = isEditing ? `${API_BASE_URL}/events/${id}` : `${API_BASE_URL}/events`;
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.getToken()}`
            },
            body: JSON.stringify(eventData)
        });

        const result = await response.json();

        if (result.success) {
            // Hide modal
            const modalEl = document.getElementById('eventModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInstance.hide();
            
            // Remove modal backdrop properly if it lingers
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            document.body.classList.remove('modal-open');
            document.body.style = '';

            // Refresh table and stats
            fetchEvents();
            fetchDashboardStats();
            showToast(isEditing ? 'Event updated successfully!' : 'Event created successfully!', 'success');
        } else {
            showToast('Error saving event: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving event:', error);
        showToast('Failed to save event. Make sure backend is running.', 'error');
    }
}

// Delete Event
async function deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/events/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });
        const result = await response.json();

        if (result.success) {
            fetchEvents(); // refresh table
            fetchDashboardStats(); // refresh stats
            showToast('Event deleted successfully.', 'success');
        } else {
            showToast('Error deleting event: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showToast('Failed to delete event.', 'error');
    }
}

// Quick Update Title Inline
async function updateEventTitle(id, newTitle) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.getToken()}`
            },
            body: JSON.stringify({ title: newTitle })
        });
        const result = await response.json();

        if (result.success) {
            showToast('Title updated successfully!', 'success');
            // No need to refresh the whole table as it's already updated in UI
        } else {
            showToast('Error updating title: ' + result.message, 'error');
            fetchEvents(); // Revert on error
        }
    } catch (error) {
        console.error('Error updating title:', error);
        showToast('Failed to update title.', 'error');
        fetchEvents(); // Revert on error
    }
}

// Fetch Registrations and populate table
async function fetchRegistrations() {
    try {
        const response = await fetch(`${API_BASE_URL}/registrations/all-registrations`, {
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });
        const result = await response.json();
        
        const tbody = document.getElementById('registrations-tbody');
        tbody.innerHTML = ''; // Clear table

        if (result.success && result.data.length > 0) {
            result.data.forEach(reg => {
                const dateStr = reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : 'N/A';
                
                let badgeClass = 'bg-warning text-dark';
                if (reg.status === 'Confirmed') badgeClass = 'bg-success';
                if (reg.status === 'Cancelled') badgeClass = 'bg-danger';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${reg._id}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center me-2" style="width: 30px; height: 30px; font-size: 0.8rem;">
                                ${reg.user.name ? reg.user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                ${reg.user.name} <br>
                                <small class="text-muted" style="font-size: 0.75rem;">${reg.user.email}</small>
                            </div>
                        </div>
                    </td>
                    <td>${reg.event.title}</td>
                    <td>${dateStr}</td>
                    <td><span class="badge ${badgeClass} rounded-pill px-3">${reg.status || 'Pending'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger rounded-circle" onclick="deleteRegistration('${reg._id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No registrations found.</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching registrations:', error);
        document.getElementById('registrations-tbody').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load registrations.</td></tr>';
    }
}

// Delete Registration
async function deleteRegistration(id) {
    if (!confirm('Are you sure you want to cancel and delete this registration?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/registrations/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });
        const result = await response.json();

        if (result.success) {
            fetchRegistrations(); // refresh table
            fetchDashboardStats(); // refresh stats
            showToast('Registration cancelled successfully.', 'success');
        } else {
            showToast('Error cancelling registration: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting registration:', error);
        showToast('Failed to cancel registration.', 'error');
    }
}

// Fetch Revenue Report
async function fetchRevenueReport() {
    try {
        const response = await fetch(`${API_BASE_URL}/registrations/revenue-report`, {
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });
        const result = await response.json();
        
        const tbody = document.getElementById('revenue-report-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (result.success && result.data.length > 0) {
            result.data.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="fw-bold">${item.title}</td>
                    <td><span class="badge bg-secondary bg-opacity-10 text-secondary px-3 rounded-pill">${item.category}</span></td>
                    <td>${item.registrationsCount}</td>
                    <td>${item.totalGuests}</td>
                    <td class="fw-bold text-success">$${item.revenue.toLocaleString()}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No revenue data available.</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching revenue report:', error);
    }
}

// Fetch All Attendees (Users)
async function fetchAttendees() {
    try {
        // We can fetch from all registrations and unique them, or just all users if we have an endpoint
        // For now, let's fetch all registrations to see who is coming to what
        const response = await fetch(`${API_BASE_URL}/registrations/all-registrations`, {
            headers: {
                'Authorization': `Bearer ${auth.getToken()}`
            }
        });
        const result = await response.json();
        
        const tbody = document.getElementById('all-attendees-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (result.success && result.data.length > 0) {
            // Use a Map to show unique users
            const users = new Map();
            result.data.forEach(reg => {
                if (!users.has(reg.user.email)) {
                    users.set(reg.user.email, reg.user);
                }
            });

            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="rounded-circle bg-info text-white d-flex justify-content-center align-items-center me-2" style="width: 35px; height: 35px;">
                                ${user.name.charAt(0).toUpperCase()}
                            </div>
                            <span class="fw-medium">${user.name}</span>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>${user.phone || '<span class="text-muted small">Not provided</span>'}</td>
                    <td><span class="badge bg-light text-dark border">${user.role || 'User'}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No attendees found.</td></tr>';
        }
    } catch (error) {
        console.error('Error fetching attendees:', error);
    }
}
