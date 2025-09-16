// Popup script for YouTube Grid Control

document.addEventListener('DOMContentLoaded', function() {
  const columnsSelect = document.getElementById('columns');
  const spacingSelect = document.getElementById('spacing');
  const applyButton = document.getElementById('apply');
  const optionsButton = document.getElementById('options');
  const statusDiv = document.getElementById('status');

  // Load current settings
  loadSettings();

  // Apply settings
  applyButton.addEventListener('click', applySettings);

  // Open options page
  optionsButton.addEventListener('click', openOptions);

  function loadSettings() {
    chrome.storage.sync.get(['columns', 'spacing'], function(result) {
      columnsSelect.value = result.columns || '3';
      spacingSelect.value = result.spacing || 'normal';
    });
  }

  function applySettings() {
    const columns = columnsSelect.value;
    const spacing = spacingSelect.value;

    // Save to storage
    chrome.storage.sync.set({
      columns: columns,
      spacing: spacing
    }, function() {
      showStatus('Settings saved!', 'success');

      // Send message to content script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com')) {
          // Check if content script is available before sending message
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'applySettings',
            columns: columns,
            spacing: spacing
          }, function(response) {
            if (chrome.runtime.lastError) {
              console.log('Content script not available, settings will apply on page reload');
              showStatus('Settings saved! Refresh YouTube page to apply.', 'info');
            } else if (response && response.success) {
              showStatus('Applied successfully!', 'success');
            } else {
              showStatus('Applied! Changes may take a moment.', 'success');
            }
          });
        } else {
          showStatus('Please navigate to YouTube first', 'error');
        }
      });
    });
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';

    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 2000);
  }
});