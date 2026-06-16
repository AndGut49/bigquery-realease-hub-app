document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const btnRefresh = document.getElementById('btn-refresh');
    const spinner = document.getElementById('spinner');
    const releasesFeed = document.getElementById('releases-feed');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const filterChips = document.getElementById('filter-chips');
    const statsCounter = document.getElementById('stats-counter');
    
    // Composer elements
    const composerEmptyState = document.getElementById('composer-empty-state');
    const composerActive = document.getElementById('composer-active');
    const selectedBadge = document.getElementById('selected-badge');
    const selectedDate = document.getElementById('selected-date');
    const selectedPreview = document.getElementById('selected-preview');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCount = document.getElementById('char-count');
    const btnTweet = document.getElementById('btn-tweet');
    const btnOriginalLink = document.getElementById('btn-original-link');

    let allReleases = [];
    let activeFilter = 'all';
    let selectedReleaseId = null;

    // Fetch releases from API
    async function fetchReleases() {
        setLoading(true);
        hideError();
        
        try {
            const response = await fetch('/api/releases');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.success) {
                allReleases = data.releases;
                renderReleases();
                
                // Keep selected release highlighted if it's still in the list
                if (selectedReleaseId) {
                    const selectedItem = allReleases.find(r => r.id === selectedReleaseId);
                    if (selectedItem) {
                        selectRelease(selectedItem);
                    }
                }
            } else {
                showError(data.error || 'Failed to fetch release notes.');
            }
        } catch (e) {
            console.error('Error fetching release notes:', e);
            showError('Network error or server unavailable. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    // Set loading state
    function setLoading(isLoading) {
        if (isLoading) {
            spinner.classList.add('spinning');
            btnRefresh.disabled = true;
        } else {
            spinner.classList.remove('spinning');
            btnRefresh.disabled = false;
        }
    }

    // Show error alert
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    // Hide error alert
    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // Render cards list
    function renderReleases() {
        releasesFeed.innerHTML = '';
        
        const filteredReleases = activeFilter === 'all' 
            ? allReleases 
            : allReleases.filter(r => r.type.toLowerCase() === activeFilter.toLowerCase());
            
        statsCounter.textContent = `Showing ${filteredReleases.length} updates`;

        if (filteredReleases.length === 0) {
            releasesFeed.innerHTML = `
                <div class="glass-panel" style="padding: 3rem; text-align: center; color: var(--text-secondary); width: 100%;">
                    <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; opacity: 0.5; margin-bottom: 1rem; display: block;"></i>
                    <p>No release notes found for the selected type.</p>
                </div>
            `;
            return;
        }

        filteredReleases.forEach(release => {
            const card = document.createElement('div');
            const typeClass = `type-${release.type.toLowerCase()}`;
            card.className = `release-card ${typeClass} ${selectedReleaseId === release.id ? 'selected' : ''}`;
            card.dataset.id = release.id;
            
            card.innerHTML = `
                <div class="card-header">
                    <span class="badge ${typeClass}">${release.type}</span>
                    <span class="card-date">${release.date}</span>
                </div>
                <div class="card-body">
                    ${release.html}
                </div>
            `;
            
            card.addEventListener('click', () => selectRelease(release));
            releasesFeed.appendChild(card);
        });
    }

    // Select release card
    function selectRelease(release) {
        selectedReleaseId = release.id;
        
        // Update selected style on cards
        document.querySelectorAll('.release-card').forEach(card => {
            if (card.dataset.id === release.id) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // Populate composer
        composerEmptyState.classList.add('hidden');
        composerActive.classList.remove('hidden');
        
        // Dynamic badges
        selectedBadge.className = `badge type-${release.type.toLowerCase()}`;
        selectedBadge.textContent = release.type;
        selectedDate.textContent = release.date;
        selectedPreview.innerHTML = release.html;
        
        // Clean tweet text and limit to 280 characters
        let defaultTweet = release.tweet_text;
        
        // Ensure tweet contains hashtags and fit inside character limits
        // Include source URL
        const suffix = ` #BigQuery #GoogleCloud ${release.link}`;
        const maxTextLen = 280 - suffix.length - 4; // space and ellipses
        
        if (defaultTweet.length + suffix.length > 280) {
            // Cut text content
            const baseText = `BigQuery [${release.type}] (${release.date}): ${release.text}`;
            const trimmed = baseText.substring(0, maxTextLen) + "...";
            defaultTweet = trimmed + suffix;
        } else {
            defaultTweet = defaultTweet + " " + suffix;
        }
        
        tweetTextarea.value = defaultTweet;
        updateCharCounter();

        // Original link action
        btnOriginalLink.href = release.link;
    }

    // Update char counter
    function updateCharCounter() {
        const len = tweetTextarea.value.length;
        charCount.textContent = len;
        if (len > 280) {
            charCount.classList.add('error');
            btnTweet.disabled = true;
        } else {
            charCount.classList.remove('error');
            btnTweet.disabled = false;
        }
    }

    // Filter Chips event listeners
    filterChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        activeFilter = chip.dataset.type;
        renderReleases();
    });

    // Character counter check
    tweetTextarea.addEventListener('input', updateCharCounter);

    // Refresh click handler
    btnRefresh.addEventListener('click', fetchReleases);

    // Tweet click handler
    btnTweet.addEventListener('click', () => {
        const text = encodeURIComponent(tweetTextarea.value);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    });

    // Initial load
    fetchReleases();
});
