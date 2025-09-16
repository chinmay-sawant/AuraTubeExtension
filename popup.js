// Popup script for YouTube Grid Control

document.addEventListener('DOMContentLoaded', function() {
  const columnsSelect = document.getElementById('columns');
  const spacingSelect = document.getElementById('spacing');
  const removeShortsCheckbox = document.getElementById('remove-shorts');
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
    chrome.storage.sync.get(['columns', 'spacing', 'removeShorts'], function(result) {
      columnsSelect.value = result.columns || '5';
      spacingSelect.value = result.spacing || 'normal';
      removeShortsCheckbox.checked = result.removeShorts || false;
    });
  }

  function applySettings() {
    const columns = columnsSelect.value;
    const spacing = spacingSelect.value;
    const removeShorts = removeShortsCheckbox.checked;

    // Save to storage
    chrome.storage.sync.set({
      columns: columns,
      spacing: spacing,
      removeShorts: removeShorts
    }, function() {
      showStatus('Settings saved!', 'success');

      // Send message to content script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com')) {
          // Check if content script is available before sending message
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'applySettings',
            columns: columns,
            spacing: spacing,
            removeShorts: removeShorts
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