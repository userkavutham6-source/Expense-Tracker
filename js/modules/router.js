/**
 * Simple Hash-based Router for SPA
 */

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.container = document.getElementById('view-container');
        this.pageTitle = document.getElementById('page-title');
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleHashChange());
    }

    addRoute(path, title, renderFunction) {
        this.routes[path] = { title, renderFunction };
    }

    init() {
        this.handleHashChange();
    }

    handleHashChange() {
        // Get path from hash, default to '/'
        let path = window.location.hash.slice(1) || '/';
        
        // Remove trailing slash if not root
        if (path !== '/' && path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        if (this.routes[path]) {
            this.currentRoute = path;
            this.updateView();
            this.updateNavigation();
        } else {
            // 404 - redirect to root
            window.location.hash = '/';
        }
    }

    updateView() {
        const route = this.routes[this.currentRoute];
        if (route) {
            // Update Title
            if (this.pageTitle) {
                this.pageTitle.textContent = route.title;
            }
            document.title = `${route.title} - SmartTrack`;

            // Clear container
            this.container.innerHTML = '';
            
            // Create a wrapper for animation
            const viewWrapper = document.createElement('div');
            viewWrapper.className = 'view-section active';
            this.container.appendChild(viewWrapper);

            // Render view
            route.renderFunction(viewWrapper);
        }
    }

    updateNavigation() {
        // Update active state on sidebar links
        const links = document.querySelectorAll('.nav-item');
        links.forEach(link => {
            link.classList.remove('active');
            // Assuming href="#/path"
            const linkPath = link.getAttribute('href').slice(1);
            if (linkPath === this.currentRoute) {
                link.classList.add('active');
            }
        });

        // Auto-close mobile menu if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    }

    navigate(path) {
        window.location.hash = path;
    }
}

export const router = new Router();
