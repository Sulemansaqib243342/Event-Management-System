/**
 * EventSphere Authentication Module
 * Handles login, signup, logout, and auth state management
 */

const API_URL = 'http://localhost:5000/api/v1';

const auth = {
    /**
     * Login user
     */
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Login error:', err);
            return false;
        }
    },

    /**
     * Signup user
     */
    signup: async (userData) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (err) {
            console.error('Signup error:', err);
            return { success: false, message: 'Server error. Please try again.' };
        }
    },

    /**
     * Logout user
     */
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    },

    /**
     * Get current user
     */
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    /**
     * Get JWT token
     */
    getToken: () => {
        return localStorage.getItem('token');
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    /**
     * Check if user is admin
     */
    isAdmin: () => {
        const user = auth.getUser();
        return user && user.role === 'admin';
    },

    /**
     * Update Navbar based on auth state
     */
    updateNavbar: () => {
        const navbarNav = document.querySelector('#navbarNav ul');
        if (!navbarNav) return;

        const user = auth.getUser();
        
        // Find existing auth-related items
        const authItems = navbarNav.querySelectorAll('.auth-item');
        authItems.forEach(item => item.remove());

        // Find Register/Admin links and add class to handle them if needed
        // For simplicity, we will just replace the end of the list

        if (auth.isAuthenticated()) {
            // Remove Register link if it exists (it's for event registration, but might be confusing)
            // Actually, keep event registration, but maybe move it.
            
            const dashboardLink = user.role === 'admin' ? 
                `<li class="nav-item auth-item">
                    <a class="nav-link" href="dashboard.html">Dashboard</a>
                </li>` : '';

            const userDropdown = `
                ${dashboardLink}
                <li class="nav-item dropdown auth-item ms-lg-3">
                    <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fa-solid fa-circle-user fs-4 me-2"></i>
                        <span>${user.name.split(' ')[0]}</span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0 glass-card" aria-labelledby="userDropdown">
                        <li><a class="dropdown-item" href="#"><i class="fa-solid fa-user-gear me-2"></i> Profile</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" id="logout-link"><i class="fa-solid fa-right-from-bracket me-2"></i> Logout</a></li>
                    </ul>
                </li>
            `;
            
            // Append before the theme toggle
            const themeToggleItem = navbarNav.querySelector('#theme-toggle')?.closest('li');
            if (themeToggleItem) {
                themeToggleItem.insertAdjacentHTML('beforebegin', userDropdown);
            } else {
                navbarNav.insertAdjacentHTML('beforeend', userDropdown);
            }

            // Add logout listener
            document.getElementById('logout-link')?.addEventListener('click', (e) => {
                e.preventDefault();
                auth.logout();
            });
        } else {
            const loginLinks = `
                <li class="nav-item auth-item ms-lg-3">
                    <a class="btn btn-outline-primary rounded-pill px-4 me-2" href="login.html">Login</a>
                </li>
                <li class="nav-item auth-item">
                    <a class="btn btn-gradient rounded-pill px-4" href="signup.html">Sign Up</a>
                </li>
            `;
            
            const themeToggleItem = navbarNav.querySelector('#theme-toggle')?.closest('li');
            if (themeToggleItem) {
                themeToggleItem.insertAdjacentHTML('beforebegin', loginLinks);
            } else {
                navbarNav.insertAdjacentHTML('beforeend', loginLinks);
            }
        }
    }
};

// Auto-run on page load
document.addEventListener('DOMContentLoaded', () => {
    auth.updateNavbar();

    // Protect Dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        if (!auth.isAuthenticated()) {
            window.location.href = 'login.html';
        } else if (!auth.isAdmin()) {
            showToast('Access Denied: You do not have administrator privileges.', 'error');
            window.location.href = 'index.html';
        }
    }
});
