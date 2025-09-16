// Content script for YouTube Grid Control Extension

class YouTubeGridController {
  constructor() {
    this.settings = {
      columns: 5,
      spacing: 'normal',
      removeShorts: false
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
        this.settings.removeShorts = request.removeShorts || false;

        // Save to storage
        chrome.storage.sync.set({
          columns: this.settings.columns,
          spacing: this.settings.spacing,
          removeShorts: this.settings.removeShorts
        });

        // Apply changes immediately
        this.applyGridChanges();

        sendResponse({success: true});
      }
    });
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['columns', 'spacing', 'removeShorts'], (result) => {
        this.settings.columns = result.columns || 5;
        this.settings.spacing = result.spacing || 'normal';
        this.settings.removeShorts = result.removeShorts || false;
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
              // Also check for Shorts sections on DOM changes
              this.removeShortsSection();
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

    // Apply spacing class to body for CSS targeting
    document.body.classList.remove('spacing-compact', 'spacing-normal', 'spacing-comfortable', 'spacing-continuous');
    document.body.classList.add(`spacing-${this.settings.spacing}`);

    const gridContainers = document.querySelectorAll('ytd-rich-grid-renderer');
    console.log('YouTube Grid Control: Found grid containers', gridContainers.length);

    gridContainers.forEach((container, index) => {
      console.log(`YouTube Grid Control: Processing container ${index}`);

      // Update items-per-row attribute
      const items = container.querySelectorAll('ytd-rich-item-renderer');
      items.forEach(item => {
        item.setAttribute('items-per-row', this.settings.columns);
      });

      // Remove items that don't have items-per-row attribute
      const allItems = container.querySelectorAll('ytd-rich-item-renderer');
      allItems.forEach(item => {
        if (!item.hasAttribute('items-per-row')) {
          console.log('YouTube Grid Control: Removing item without items-per-row attribute');
          item.remove();
        }
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

        // For continuous spacing, ensure no gaps
        if (this.settings.spacing === 'continuous') {
          gridElement.style.gap = '0px';
        }

        // Ensure proper item sizing
        const gridItems = gridElement.querySelectorAll('ytd-rich-item-renderer');
        gridItems.forEach(item => {
          item.style.width = '100%';
          item.style.maxWidth = 'none';
          // Remove margins for continuous layout
          if (this.settings.spacing === 'continuous') {
            item.style.margin = '0px';
            item.style.padding = '0px';
          }
        });
      } else {
        console.log('YouTube Grid Control: Could not find #contents element');
      }

      // Remove the display manipulation that causes scrolling issues
      // container.style.display = 'none';
      // container.offsetHeight; // Trigger reflow
      // container.style.display = '';
    });

    // Handle Shorts removal
    this.removeShortsSection();

    // Remove any ytd-rich-item-renderer elements that don't have items-per-row attribute
    this.removeItemsWithoutAttribute();

    // Also handle rich shelf renderers (like Shorts)
    const shelfContainers = document.querySelectorAll('ytd-rich-shelf-renderer');
    shelfContainers.forEach(container => {
      const items = container.querySelectorAll('ytd-rich-item-renderer');
      items.forEach(item => {
        item.setAttribute('items-per-row', Math.min(this.settings.columns, 6)); // Limit shelf items to 6 max
      });
    });
  }

  removeShortsSection() {
    // Only remove Shorts if the setting is enabled
    if (!this.settings.removeShorts) {
      return;
    }

    console.log('YouTube Grid Control: Checking for Shorts sections to remove');

    // Find all rich shelf renderers
    const shelfRenderers = document.querySelectorAll('ytd-rich-shelf-renderer');

    shelfRenderers.forEach(shelf => {
      // Check if this is a Shorts shelf by looking for the Shorts icon or title
      const titleElement = shelf.querySelector('#title');
      const hasShortsIcon = shelf.querySelector('path[d*="m19.45,3.88c1.12,1.82.48,4.15-1.42,5.22"]');

      if (titleElement && titleElement.textContent.trim() === 'Shorts') {
        console.log('YouTube Grid Control: Found Shorts section, removing it');
        shelf.style.display = 'none';
        shelf.remove(); // Completely remove from DOM
      } else if (hasShortsIcon) {
        console.log('YouTube Grid Control: Found Shorts section by icon, removing it');
        shelf.style.display = 'none';
        shelf.remove(); // Completely remove from DOM
      }
    });

    // Also check for any rich-section-renderer containing Shorts
    const sectionRenderers = document.querySelectorAll('ytd-rich-section-renderer');
    sectionRenderers.forEach(section => {
      const shelf = section.querySelector('ytd-rich-shelf-renderer');
      if (shelf) {
        const titleElement = shelf.querySelector('#title');
        const hasShortsIcon = shelf.querySelector('path[d*="m19.45,3.88c1.12,1.82.48,4.15-1.42,5.22"]');

        if ((titleElement && titleElement.textContent.trim() === 'Shorts') || hasShortsIcon) {
          console.log('YouTube Grid Control: Found Shorts section in rich-section-renderer, removing it');
          section.style.display = 'none';
          section.remove(); // Completely remove from DOM
        }
      }
    });
  }

  getSpacingValue(spacing) {
    switch (spacing) {
      case 'compact':
        return 8;
      case 'normal':
        return 16;
      case 'comfortable':
        return 24;
      case 'continuous':
        return 0;
      default:
        return 16; // Default to normal spacing
    }
  }

  removeItemsWithoutAttribute() {
    console.log('YouTube Grid Control: Removing items and sections without items-per-row attribute');

    // Find all ytd-rich-item-renderer elements in the document
    const allItems = document.querySelectorAll('ytd-rich-item-renderer');
    let removedItemsCount = 0;

    allItems.forEach(item => {
      if (!item.hasAttribute('items-per-row')) {
        console.log('YouTube Grid Control: Removing item without items-per-row attribute');
        item.remove();
        removedItemsCount++;
      }
    });

    // Find all ytd-rich-section-renderer elements in the document
    const allSections = document.querySelectorAll('ytd-rich-section-renderer');
    let removedSectionsCount = 0;

    allSections.forEach(section => {
      if (!section.hasAttribute('items-per-row')) {
        console.log('YouTube Grid Control: Removing section without items-per-row attribute');
        section.remove();
        removedSectionsCount++;
      }
    });

    if (removedItemsCount > 0 || removedSectionsCount > 0) {
      console.log(`YouTube Grid Control: Removed ${removedItemsCount} items and ${removedSectionsCount} sections without items-per-row attribute`);
    }
  }
}

// Initialize the controller
const gridController = new YouTubeGridController();