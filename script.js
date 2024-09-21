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
        console.log('Fetched data:', data);
        if (Array.isArray(data)) {
            newsItems = data;
        } else {
            console.error('Fetched data is not an array:', data);
            newsItems = [];
        }
        populateExpertiseOptions();
    } catch (error) {
        console.error("Could not fetch news items:", error);
        newsItems = [];
    }
}

function populateExpertiseOptions() {
    const expertiseSelect = document.getElementById('expertise');
    if (!expertiseSelect) {
        console.error('Expertise select element not found');
        return;
    }
    expertiseSelect.innerHTML = '<option value="">בחר תחום מומחיות</option>';
    const systems = new Set(newsItems.map(item => item.system.name));
    
    systems.forEach(system => {
        if (system) {
            const option = document.createElement('option');
            option.value = system;
            option.textContent = system;
            expertiseSelect.appendChild(option);
        }
    });
    
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
    if (!newsGrid) {
        console.error('News grid element not found');
        return 1;
    }
    const newsItemWidth = 250;
    return Math.floor(newsGrid.offsetWidth / newsItemWidth);
}

function loadNewsItems() {
    const newsGrid = document.getElementById('newsGrid');
    if (!newsGrid) {
        console.error('News grid element not found');
        return;
    }
    const itemsPerRow = calculateItemsPerRow();
    const itemsToLoad = itemsPerRow * 2;
    const endIndex = Math.min(currentIndex + itemsToLoad, newsItems.length);
    
    for (let i = currentIndex; i < endIndex; i++) {
        const item = newsItems[i];
        const newsItemElement = document.createElement('div');
        newsItemElement.className = 'news-item';
        
        let formattedContent = item.content.replace(/\n/g, '<br>');
        let hasImage = formattedContent.includes('<img');
        let shouldTruncate = formattedContent.length > 100 || hasImage;
        let displayContent;

        if (hasImage) {
            let textBeforeImage = formattedContent.split('<img')[0];
            displayContent = textBeforeImage.length > 100 ? textBeforeImage.substring(0, 100) + '...' : textBeforeImage;
        } else {
            displayContent = shouldTruncate 
                ? formattedContent.substring(0, 100).replace(/<br>$/, '').trim() + '...'
                : formattedContent;
        }

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
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = currentIndex >= newsItems.length ? 'none' : 'block';
    }
}

function openModal(item) {
    const modal = document.getElementById('newsModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalAuthorImg = document.getElementById('modalAuthorImg');
    const modalAuthorName = document.getElementById('modalAuthorName');
    const modalAuthorDescription = document.getElementById('modalAuthorDescription');
    const modalDate = document.getElementById('modalDate');

    if (modal && modalTitle && modalBody && modalAuthorImg && modalAuthorName && modalAuthorDescription && modalDate) {
        modalTitle.textContent = item.title;
        modalBody.innerHTML = item.content.replace(/\n/g, '<br>');
        modalAuthorImg.src = item.author.image;
        modalAuthorImg.alt = item.author.name;
        modalAuthorName.textContent = item.author.name;
        modalAuthorDescription.textContent = item.author.description;
        modalDate.textContent = formatDate(item.date);

        modal.style.display = 'block';
    } else {
        console.error('One or more modal elements are missing');
    }
}

async function initializeNewsGrid() {
    const newsGrid = document.getElementById('newsGrid');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (newsGrid) {
        newsGrid.innerHTML = '';
        newsGrid.style.display = 'none';
    }
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';

    await fetchNewsItems();

    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (newsGrid) newsGrid.style.display = 'grid';

    loadNewsItems();
}

document.addEventListener('DOMContentLoaded', function() {
    initializeNewsGrid();

const form = document.getElementById('joinForm');

if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const webhookUrl = 'https://hook.integrator.boost.space/xk3ycvp1v7qeho3bdxemaiswvkn2q8bm';
        
        fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(result => {
            console.log('Success:', result);
            if (result === 'Accepted') {
                alert('הטופס נשלח בהצלחה!');
                form.reset();
            } else {
                throw new Error('Unexpected response');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('אירעה שגיאה בשליחת הטופס. אנא נסה שוב.');
        });
    });
} else {
    console.error('Join form not found');
}

    const modal = document.getElementById('newsModal');
    const closeBtn = document.querySelector('.close');
    if (closeBtn && modal) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        }
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    const appreciateBtn = document.getElementById('appreciateBtn');
    const floatingAppreciateBtn = document.getElementById('floatingAppreciateBtn');

    function openAppreciationLink(e) {
        e.preventDefault();
        window.open('https://shayptl.github.io/buy-me-coffee', '_blank');
    }

    if (appreciateBtn) {
        appreciateBtn.addEventListener('click', openAppreciationLink);
    }
    if (floatingAppreciateBtn) {
        floatingAppreciateBtn.addEventListener('click', openAppreciationLink);
    }

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadNewsItems);
    }

    window.addEventListener('resize', function() {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(function() {
            const newsGrid = document.getElementById('newsGrid');
            if (newsGrid) {
                newsGrid.innerHTML = '';
                currentIndex = 0;
                loadNewsItems();
            }
        }, 250);
    });

    const mainAppreciateBtn = document.getElementById('appreciateBtn');
    if (mainAppreciateBtn && floatingAppreciateBtn) {
        window.addEventListener('scroll', function () {
            const mainBtnRect = mainAppreciateBtn.getBoundingClientRect();
            if (mainBtnRect.top <= window.innerHeight && mainBtnRect.bottom >= 0) {
                floatingAppreciateBtn.style.opacity = '0';
                floatingAppreciateBtn.style.pointerEvents = 'none';
            } else {
                floatingAppreciateBtn.style.opacity = '1';
                floatingAppreciateBtn.style.pointerEvents = 'auto';
            }
        });
    }
});
