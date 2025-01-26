class BookSearch {
    constructor() {
        this.searchForm = document.getElementById('search-form');
        this.searchInput = document.getElementById('search-input');
        this.searchType = document.getElementById('search-type');
        this.resultsContainer = document.getElementById('results');
        this.paginationContainer = document.getElementById('pagination');
        this.themeToggle = document.getElementById('theme-toggle');
        
        this.currentPage = 1;
        this.booksPerPage = 9;
        this.totalBooks = 0;
        this.searchData = [];

        this.initEventListeners();
        this.initTheme();
    }

    initEventListeners() {
        this.searchForm.addEventListener('submit', this.handleSearch.bind(this));
        this.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
    }

    initTheme() {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    toggleTheme() {
        document.documentElement.classList.toggle('dark');
        localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }

    async handleSearch(e) {
        e.preventDefault();
        this.currentPage = 1;
        const query = this.searchInput.value.trim();
        const searchType = this.searchType.value;

        if (!query) {
            this.showToast('Por favor, ingrese un término de búsqueda', 'error');
            return;
        }

        try {
            let url;
            switch(searchType) {
                case 'title':
                    url = `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}`;
                    break;
                case 'author':
                    url = `https://openlibrary.org/search.json?author=${encodeURIComponent(query)}`;
                    break;
                case 'isbn':
                    url = `https://openlibrary.org/search.json?isbn=${encodeURIComponent(query)}`;
                    break;
            }

            const response = await fetch(url);
            const data = await response.json();
            
            this.searchData = data.docs;
            this.totalBooks = data.docs.length;
            
            this.displayResults();
            this.createPagination();
        } catch(error) {
            console.error(error);
            this.showToast('Ocurrió un error al buscar', 'error');
        }
    }

    displayResults() {
        this.resultsContainer.innerHTML = '';
        
        const startIndex = (this.currentPage - 1) * this.booksPerPage;
        const endIndex = startIndex + this.booksPerPage;
        const paginatedBooks = this.searchData.slice(startIndex, endIndex);

        if (paginatedBooks.length === 0) {
            this.resultsContainer.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 col-span-full">No se encontraron resultados</p>';
            return;
        }

        paginatedBooks.forEach(book => {
            const coverUrl = book.cover_i 
                ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                : 'https://via.placeholder.com/200x300?text=No+Cover';

            const bookElement = document.createElement('div');
            bookElement.classList.add(
                'bg-white', 'dark:bg-gray-800', 'rounded-xl', 
                'p-4', 'shadow-lg', 'hover:shadow-xl', 'transition-all',
                'duration-300', 'transform', 'hover:-translate-y-1',
                'border', 'dark:border-gray-700'
            );
            bookElement.innerHTML = `
                <div class="relative aspect-[2/3] mb-4 overflow-hidden rounded-lg">
                    <img src="${coverUrl}" alt="${book.title}" class="w-full h-full object-cover">
                </div>
                <h3 class="font-bold text-lg mb-2 text-gray-900 dark:text-white truncate">${book.title}</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-1 text-sm">
                    <span class="font-semibold">Autor:</span> ${book.author_name ? book.author_name.join(', ') : 'Desconocido'}
                </p>
                <p class="text-gray-600 dark:text-gray-300 text-sm">
                    <span class="font-semibold">Año:</span> ${book.first_publish_year || 'Desconocido'}
                </p>
                ${book.language ? `
                <p class="text-gray-600 dark:text-gray-300 text-sm mt-1">
                    <span class="font-semibold">Idioma:</span> ${book.language.join(', ')}
                </p>
                ` : ''}
            `;
            this.resultsContainer.appendChild(bookElement);
        });
    }

    createPagination() {
        this.paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(this.totalBooks / this.booksPerPage);
        
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        if (this.currentPage > 1) {
            this.createPaginationButton('«', this.currentPage - 1);
        }

        if (startPage > 1) {
            this.createPaginationButton(1, 1);
            if (startPage > 2) {
                this.paginationContainer.appendChild(this.createEllipsis());
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            this.createPaginationButton(i, i);
        }

      
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                this.paginationContainer.appendChild(this.createEllipsis());
            }
            this.createPaginationButton(totalPages, totalPages);
        }

        if (this.currentPage < totalPages) {
            this.createPaginationButton('»', this.currentPage + 1);
        }
    }

    createPaginationButton(text, page) {
        const button = document.createElement('button');
        button.textContent = text;
        
     
        const baseClasses = ['px-4', 'py-2', 'rounded-lg', 'transition-colors', 'duration-300', 'border'];
   
        const stateClasses = this.currentPage === page 
            ? ['bg-blue-500', 'text-white']
            : ['bg-white', 'dark:bg-gray-800', 'text-blue-500', 'dark:text-blue-400', 'hover:bg-blue-100', 'dark:hover:bg-gray-700', 'dark:border-gray-700'];
        
 
        [...baseClasses, ...stateClasses].forEach(className => {
            button.classList.add(className);
        });
    
        button.addEventListener('click', () => {
            this.currentPage = page;
            this.displayResults();
            this.createPagination();
        });
    
        this.paginationContainer.appendChild(button);
        return button;
    }

    createEllipsis() {
        const span = document.createElement('span');
        span.textContent = '...';
        span.classList.add('px-3', 'py-2', 'text-gray-600', 'dark:text-gray-400');
        return span;
    }

    showToast(message, icon, time = 2000) {
        Swal.fire({
            position: 'top-end',
            icon: icon,
            title: message,
            showConfirmButton: false,
            timer: time,
            background: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
            color: document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#000000'
        });
    }
}

new BookSearch();