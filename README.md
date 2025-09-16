# Aura Extension - YouTube Grid Control

A Chrome extension that allows you to customize the grid layout on YouTube's homepage.

## Features

- Change the number of columns in the video grid (1-20 columns)
- Adjust grid spacing (Compact, Normal, Comfortable)
- Real-time updates without page refresh
- Persistent settings saved in browser storage
- Improved template with proper spacing and image sizing

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `AuraExtension` folder
5. The extension should now be installed

## Usage

1. Navigate to [YouTube](https://www.youtube.com)
2. Click the extension icon in the toolbar
3. Select your preferred number of columns and spacing
4. Click "Apply" to see changes immediately
5. For more options, click "Options" to open the full settings page

## Files Structure

- `manifest.json` - Extension manifest
- `content.js` - Main content script that modifies YouTube's grid
- `styles.css` - Custom CSS for grid modifications
- `popup.html` - Quick access popup interface
- `popup.js` - Popup functionality
- `options.html` - Full settings page
- `options.js` - Options page functionality
- `icon16.png`, `icon48.png`, `icon128.png` - Extension icons (you need to create these)

## Creating Icons

You need to create three icon files:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

You can use any image editor or online tools to create these. The icons should represent grid or layout control.

## Improved Template

The `improved_template.html` file contains a clean, modern YouTube grid layout with:

- Proper spacing and image sizing
- Responsive design for different screen sizes
- Interactive controls to test different column layouts
- Better typography and visual hierarchy
- Hover effects and smooth transitions
- Support for up to 20 columns

You can open this file in a browser to see how the grid looks with different configurations and use it as a reference for styling.

The extension injects a content script into YouTube pages that:
1. Monitors the DOM for grid containers
2. Modifies the `items-per-row` attribute on grid items
3. Adjusts CSS variables for spacing
4. Responds to user settings changes in real-time

## Permissions

- `activeTab` - To access the current YouTube tab
- `storage` - To save user preferences

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## Troubleshooting

If the extension doesn't work:
1. Make sure you're on youtube.com
2. Try refreshing the page after changing settings
3. Check that the extension is enabled in chrome://extensions/
4. Open Developer Tools and check for any console errors

## Development

To modify the extension:
1. Make changes to the files
2. Go to chrome://extensions/
3. Click "Reload" on the extension
4. Test on YouTube

## License

This project is open source. Feel free to modify and distribute.