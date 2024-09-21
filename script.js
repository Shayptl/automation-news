// URL of your Google Apps Script web app
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw-nLADcYlSnnW5MgmpTY_gJYceiqhHJsQYYo3wH43a6pdEU1G6XZnU0HtZ1n3397Wf6A/exec';

let newsItems = [];
let currentIndex = 0;

async function fetchNewsItems() {
    try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched data:', data); // Log the fetched data
        if (Array.isArray(data)) {
            newsItems = data;
        } else {
            console.error('Fetched data is not an array:', data);
            newsItems = [];
        }
        populateExpertiseOptions();
    } catch (error) {
        console.error("Could not fetch news items:", error);
        newsItems = []; // Set to empty array in case of error
    }
}

function populateExpertiseOptions() {
    const expertiseSelect = document.getElementById('expertise');
    expertiseSelect.innerHTML = '<option value="">בחר תחום מומחיות</option>'; // Clear existing options
    const systems = new Set(newsItems.map(item => item.system.name));
    
    systems.forEach(system => {
        if (system) { // Check if system name is not empty or undefined
            const option = document.createElement('option');
            option.value = system;
            option.textContent = system;
            expertiseSelect.appendChild(option);
        }
    });
    
    // Add 'Other' option
    const otherOption = document.createElement('option');
    otherOption.value = 'other';
    otherOption.textContent = 'אחר';
    expertiseSelect.appendChild(otherOption);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const [date, time] = dateString.split(' ');
    const [day, month, year] = date.split('/');
    return `${day}.${month}.${year}`;
}

function calculateItemsPerRow() {
    const newsGrid = document.getElementById('newsGrid');
    const newsItemWidth = 250; // Approximate width of a news item including gap
    return Math.floor(newsGrid.offsetWidth / newsItemWidth);
}

function loadNewsItems() {
    const newsGrid = document.getElementById('newsGrid');
    const itemsPerRow = calculateItemsPerRow();
    const itemsToLoad = itemsPerRow * 2;
    const endIndex = Math.min(currentIndex + itemsToLoad, newsItems.length);
    
    for (let i = currentIndex; i < endIndex; i++) {
        const item = newsItems[i];
        const newsItemElement = document.createElement('div');
        newsItemElement.className = 'news-item';
        
        // Replace newlines with <br> tags for proper display
        let formattedContent = item.content.replace(/\n/g, '<br>');
        
        // Check if content is long or contains an image
        let hasImage = formattedContent.includes('<img');
        let shouldTruncate = formattedContent.length > 100 || hasImage;
        let displayContent;

        if (hasImage) {
            // If there's an image, show only the first paragraph or a portion of text before the image
            let textBeforeImage = formattedContent.split('<img')[0];
            displayContent = textBeforeImage.length > 100 ? textBeforeImage.substring(0, 100) + '...' : textBeforeImage;
        } else {
            displayContent = shouldTruncate 
                ? formattedContent.substring(0, 100).replace(/<br>$/, '').trim() + '...'
                : formattedContent;
        }

        // Add 'Read More' if content is truncated
        let readMoreText = shouldTruncate ? '<span class="read-more">קרא עוד</span>' : '';

        newsItemElement.innerHTML = `
            <img src="${item.system.logo || ''}" alt="${item.system.name || ''} logo" class="logo">
            <h3>${item.title || ''}</h3>
            <div class="content">
                <p>${displayContent}</p>
                ${readMoreText}
            </div>
            <div class="author-info">
                <img src="${item.author.image || ''}" alt="${item.author.name || ''}">
                <div class="author-text">
                    <span class="author-name">${item.author.name || ''}</span>
                    <span class="author-description">${item.author.description || ''}</span>
                </div>
            </div>
            <span class="date">${formatDate(item.date) || ''}</span>
        `;
        newsItemElement.addEventListener('click', () => openModal(item));
        newsGrid.appendChild(newsItemElement);
    }
    
    currentIndex = endIndex;
    
    if (currentIndex >= newsItems.length) {
        document.getElementById('loadMoreBtn').style.display = 'none';
    } else {
        document.getElementById('loadMoreBtn').style.display = 'block';
    }
}

// Function to open the modal with news item details
function openModal(item) {
    const modal = document.getElementById('newsModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalAuthorImg = document.getElementById('modalAuthorImg');
    const modalAuthorName = document.getElementById('modalAuthorName');
    const modalAuthorDescription = document.getElementById('modalAuthorDescription');
    const modalDate = document.getElementById('modalDate');

    modalTitle.textContent = item.title;
    modalBody.innerHTML = item.content.replace(/\n/g, '<br>');
    modalAuthorImg.src = item.author.image;
    modalAuthorImg.alt = item.author.name;
    modalAuthorName.textContent = item.author.name;
    modalAuthorDescription.textContent = item.author.description;
    modalDate.textContent = formatDate(item.date);

    modal.style.display = 'block';
}

// Close the modal when clicking on <span> (x)
document.querySelector('.close').onclick = function() {
    document.getElementById('newsModal').style.display = 'none';
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('newsModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

async function initializeNewsGrid() {
    const newsGrid = document.getElementById('newsGrid');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    loadingSpinner.style.display = 'block';
    newsGrid.innerHTML = ''; // Clear existing content
    newsGrid.style.display = 'none';
    loadMoreBtn.style.display = 'none';

    await fetchNewsItems(); // This now populates newsItems and expertise options

    loadingSpinner.style.display = 'none';
    newsGrid.style.display = 'grid';

    loadNewsItems();
}

// Call this function when the page loads
window.addEventListener('load', initializeNewsGrid);

// Load more button functionality
document.getElementById('loadMoreBtn').addEventListener('click', loadNewsItems);

// Recalculate and reload items on window resize
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        const newsGrid = document.getElementById('newsGrid');
        newsGrid.innerHTML = ''; // Clear existing content
        currentIndex = 0; // Reset the index
        loadNewsItems(); // Reload items
    }, 250);
});

// Appreciation button functionality
document.getElementById('appreciateBtn').addEventListener('click', function (e) {
    e.preventDefault();
    window.open('https://shayptl.github.io/buy-me-coffee', '_blank');
});

// Floating appreciation button functionality
const floatingBtn = document.getElementById('floatingAppreciateBtn');
const mainAppreciateBtn = document.getElementById('appreciateBtn');

floatingBtn.addEventListener('click', function (e) {
    e.preventDefault();
    window.open('https://shayptl.github.io/buy-me-coffee', '_blank');
});

window.addEventListener('scroll', function () {
    const mainBtnRect = mainAppreciateBtn.getBoundingClientRect();
    if (mainBtnRect.top <= window.innerHeight && mainBtnRect.bottom >= 0) {
        floatingBtn.style.opacity = '0';
        floatingBtn.style.pointerEvents = 'none';
    } else {
        floatingBtn.style.opacity = '1';
        floatingBtn.style.pointerEvents = 'auto';
    }
});

// Social media links
document.getElementById('facebookLink').addEventListener('click', function (e) {
    e.preventDefault();
    window.open('https://www.facebook.com/ShayDigitalServices', '_blank');
});

document.getElementById('twitterLink').addEventListener('click', function (e) {
    e.preventDefault();
    window.open('https://twitter.com/ShayDigital', '_blank');
});

document.getElementById('linkedinLink').addEventListener('click', function (e) {
    e.preventDefault();
    window.open('https://www.linkedin.com/company/shay-digital-services', '_blank');
});

// Join form submission
document.getElementById('joinForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    console.log('Form submitted:', data);

    // Send webhook
    const webhookUrl = 'https://hook.integrator.boost.space/xk3ycvp1v7qeho3bdxemaiswvkn2q8bm';
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert('כיף שנרשמת! שלחנו לך הודעת ווצאפ');
            this.reset();
        } else {
            throw new Error('Failed to submit form');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('אירעה שגיאה בשליחת הטופס. אנא נסה שוב מאוחר יותר.');
    }
});
