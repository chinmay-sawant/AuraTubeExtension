// Options page script for YouTube Grid Control

document.addEventListener('DOMContentLoaded', function() {
  const columnsSelect = document.getElementById('columns');
  const spacingSelect = document.getElementById('spacing');
  const saveButton = document.getElementById('save');
  const statusDiv = document.getElementById('status');

  // Load current settings
  loadSettings();

  // Save settings when button is clicked
  saveButton.addEventListener('click', saveSettings);

  function loadSettings() {
    chrome.storage.sync.get(['columns', 'spacing'], function(result) {
      columnsSelect.value = result.columns || '3';
      spacingSelect.value = result.spacing || 'normal';
    });
  }

  function saveSettings() {
    const columns = columnsSelect.value;
    const spacing = spacingSelect.value;

    chrome.storage.sync.set({
      columns: columns,
      spacing: spacing
    }, function() {
      showStatus('Settings saved successfully!', 'success');

      // Notify content scripts of the change
      chrome.tabs.query({url: '*://www.youtube.com/*'}, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsChanged',
            columns: columns,
            spacing: spacing
          });
        });
      });
    });
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';

    // Hide after 3 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});