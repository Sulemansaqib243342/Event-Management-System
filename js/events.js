document.addEventListener('DOMContentLoaded', () => {
    fetchPublicEvents();
});

async function fetchPublicEvents() {
    try {
        // API_URL is defined globally in auth.js
        const response = await fetch(`${API_URL}/events`);
        const result = await response.json();
        
        const grid = document.getElementById('events-grid');
        if (!grid) return;
        grid.innerHTML = '';

        if (result.success && result.data.length > 0) {
            let eventsToDisplay = result.data;
            
            // If we are on the home page (index.html), only show top 3 featured events
            const isHomePage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');
            if (isHomePage) {
                eventsToDisplay = eventsToDisplay.slice(0, 3);
            }

            eventsToDisplay.forEach(event => {
                const dateStr = event.date ? new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
                
                // Select badge color based on category
                let badgeClass = 'bg-primary';
                if (event.category === 'Weddings') badgeClass = 'bg-danger';
                if (event.category === 'Concerts') badgeClass = 'bg-warning text-dark';
                if (event.category === 'Seminars') badgeClass = 'bg-info text-dark';
                if (event.category === 'Parties') badgeClass = 'bg-success';
                
                const cardHtml = `
                <div class="col-lg-4 col-md-6 event-item" data-category="${event.category}">
                    <div class="card glass-card h-100 border-0">
                        <img src="${event.imageUrl || 'images/event_corporate.png'}" class="card-img-top event-img" alt="${event.title}" onerror="this.src='images/event_corporate.png'">
                        <div class="card-body">
                            <span class="badge ${badgeClass} mb-2">${event.category}</span>
                            <h5 class="card-title">${event.title}</h5>
                            <p class="card-text text-muted mb-1"><i class="fa-regular fa-calendar-alt text-primary me-2"></i> ${dateStr} ${event.time ? 'at ' + event.time : ''}</p>
                            <p class="card-text text-muted"><i class="fa-solid fa-location-dot text-primary me-2"></i> ${event.venue}</p>
                            <hr>
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <small class="text-muted d-block">Starting from</small>
                                    <span class="fw-bold fs-5">$${event.price || 0}</span>
                                </div>
                                <a href="register.html?eventId=${event._id}" class="btn btn-gradient btn-sm">Register Now</a>
                            </div>
                        </div>
                    </div>
                </div>
                `;
                grid.innerHTML += cardHtml;
            });
            
            // Re-bind the search and filter logic from script.js since new elements were added dynamically
            bindFilters();

        } else {
            grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fa-regular fa-calendar-xmark fa-3x text-muted mb-3"></i>
                <h4 class="text-muted">No events found</h4>
                <p>There are currently no events scheduled. Please check back later.</p>
            </div>`;
        }
    } catch (error) {
        console.error('Failed to fetch events:', error);
        document.getElementById('events-grid').innerHTML = `
            <div class="col-12 text-center py-5 text-danger">
                <i class="fa-solid fa-triangle-exclamation fa-3x mb-3"></i>
                <h4>Oops! Something went wrong.</h4>
                <p>Failed to connect to the server. Please make sure the backend is running.</p>
            </div>
        `;
    }
}

function bindFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const eventCards = document.querySelectorAll('.event-item');
    
    if (filterBtns.length > 0 && eventCards.length > 0) {
        filterBtns.forEach(btn => {
            // Remove old listeners to avoid duplicates if called multiple times
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', () => {
                const updatedFilterBtns = document.querySelectorAll('.filter-btn');
                updatedFilterBtns.forEach(b => b.classList.remove('btn-primary'));
                updatedFilterBtns.forEach(b => b.classList.add('btn-outline-primary'));
                newBtn.classList.remove('btn-outline-primary');
                newBtn.classList.add('btn-primary');
                
                const filterValue = newBtn.getAttribute('data-filter');
                
                eventCards.forEach(card => {
                    if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    const searchInput = document.getElementById('event-search');
    if (searchInput) {
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);

        newSearchInput.addEventListener('keyup', (e) => {
            const searchValue = e.target.value.toLowerCase();
            eventCards.forEach(card => {
                const title = card.querySelector('.card-title').innerText.toLowerCase();
                if (title.includes(searchValue)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}
