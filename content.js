// Content script for YouTube Grid Control Extension

class YouTubeGridController {
  constructor() {
    this.settings = {
      columns: 3,
      spacing: 'normal'
    };
    this.init();
  }

  async init() {
    // Load settings from storage
    await this.loadSettings();

    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupGridControl());
    } else {
      this.setupGridControl();
    }

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.columns || changes.spacing) {
        this.loadSettings().then(() => this.applyGridChanges());
      }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('YouTube Grid Control: Received message', request);

      if (request.action === 'applySettings') {
        this.settings.columns = parseInt(request.columns);
        this.settings.spacing = request.spacing;

        // Save to storage
        chrome.storage.sync.set({
          columns: this.settings.columns,
          spacing: this.settings.spacing
        });

        // Apply changes immediately
        this.applyGridChanges();

        sendResponse({success: true});
      }
    });
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['columns', 'spacing'], (result) => {
        this.settings.columns = result.columns || 3;
        this.settings.spacing = result.spacing || 'normal';
        resolve();
      });
    });
  }

  setupGridControl() {
    // Wait for YouTube to fully load
    const waitForYouTube = () => {
      const gridContainer = document.querySelector('ytd-rich-grid-renderer');
      if (gridContainer) {
        this.applyGridChanges();
        this.startObserver();
      } else {
        // Retry after a short delay
        setTimeout(waitForYouTube, 500);
      }
    };

    // Use MutationObserver to watch for grid changes
    this.startObserver = () => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            // Debounce the grid changes to avoid excessive updates
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
              this.applyGridChanges();
            }, 100);
          }
        });
      });

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    };

    // Initial application with delay to ensure YouTube is loaded
    setTimeout(waitForYouTube, 1000);
  }

  applyGridChanges() {
    console.log('YouTube Grid Control: Applying settings', this.settings);

    const gridContainers = document.querySelectorAll('ytd-rich-grid-renderer');
    console.log('YouTube Grid Control: Found grid containers', gridContainers.length);

    gridContainers.forEach((container, index) => {
      console.log(`YouTube Grid Control: Processing container ${index}`);

      // Update items-per-row attribute
      const items = container.querySelectorAll('ytd-rich-item-renderer');
      items.forEach(item => {
        item.setAttribute('items-per-row', this.settings.columns);
      });

      // Update CSS variables for spacing
      const root = container.closest('#contents') || container;
      const spacingValue = this.getSpacingValue(this.settings.spacing);

      root.style.setProperty('--ytd-rich-grid-item-margin', `${spacingValue}px`);
      root.style.setProperty('--ytd-rich-grid-items-per-row', this.settings.columns);

      // Always apply grid layout override for proper control
      const gridElement = container.querySelector('#contents');
      if (gridElement) {
        console.log(`YouTube Grid Control: Applying grid layout with ${this.settings.columns} columns`);

        // Force grid layout with custom columns
        gridElement.style.display = 'grid';
        gridElement.style.gridTemplateColumns = `repeat(${this.settings.columns}, 1fr)`;
        gridElement.style.gap = `${spacingValue}px`;
        gridElement.style.width = '100%';

        // Ensure proper item sizing
        const gridItems = gridElement.querySelectorAll('ytd-rich-item-renderer');
        gridItems.forEach(item => {
          item.style.width = '100%';
          item.style.maxWidth = 'none';
        });
      } else {
        console.log('YouTube Grid Control: Could not find #contents element');
      }

      // Force layout recalculation
      container.style.display = 'none';
      container.offsetHeight; // Trigger reflow
      container.style.display = '';
    });

    // Also handle rich shelf renderers (like Shorts)
    const shelfContainers = document.querySelectorAll('ytd-rich-shelf-renderer');
    shelfContainers.forEach(container => {
      const items = container.querySelectorAll('ytd-rich-item-renderer');
      items.forEach(item => {
        item.setAttribute('items-per-row', Math.min(this.settings.columns, 6)); // Limit shelf items to 6 max
      });
    });
  }

  getSpacingValue(spacing) {
    switch (spacing) {
      case 'compact': return 8;
      case 'normal': return 16;
      case 'comfortable': return 24;
      default: return 16;
    }
  }
}

// Initialize the controller
const gridController = new YouTubeGridController();