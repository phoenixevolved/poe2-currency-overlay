# Item Hover Value Tooltip - Integration Guide

## Overview

This feature adds a small, non-intrusive tooltip that appears when hovering over in-game items while holding a configurable hotkey (default: ALT). The tooltip displays the item's estimated value as a currency icon + whole number.

## Files Added

### Core Module
- **`renderer/item-hover-tooltip.js`** - Main tooltip logic
  - Currency value estimation
  - Outlier filtering for prices
  - Tooltip rendering and positioning
  - Keyboard/mouse event handling

### Styling
- **`renderer/item-hover-tooltip.css`** - Minimal, non-intrusive styling
  - Tooltip appearance (blurred background, border, shadow)
  - Icon and text styling
  - CSS variables for runtime customization

### Settings
- **`renderer/item-hover-settings.html`** - Settings UI controls
- **`renderer/item-hover-settings.js`** - Settings logic and persistence

## Integration Steps

### 1. Include Scripts in `renderer/index.html`

Add these to the `<head>` or before closing `</body>`:

```html
<!-- Item hover tooltip -->
<link rel="stylesheet" href="item-hover-tooltip.css">
<script src="item-hover-tooltip.js"></script>
<script src="item-hover-settings.js"></script>
```

### 2. Add Settings Card to Settings Panel

In `renderer/index.html`, find the General settings section and add:

```html
<div id="sec-general" class="set-card sec-on">
  <!-- existing settings -->
  
  <!-- Item Hover Tooltip Settings (add this) -->
  <div id="item-hover-settings-card">
    <!-- Contents from renderer/item-hover-settings.html -->
  </div>
</div>
```

Or use a build script to inject the HTML from `item-hover-settings.html`.

### 3. Update Main Process (Optional but Recommended)

In `main.js`, add these API handlers:

```javascript
// Get item hover config
ipc.handle('get-item-hover-config', async () => {
  const configPath = path.join(app.getPath('userData'), 'item-hover-config.json');
  try {
    const data = await fs.promises.readFile(configPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
});

// Save item hover config
ipc.handle('set-item-hover-config', async (event, config) => {
  const configPath = path.join(app.getPath('userData'), 'item-hover-config.json');
  try {
    await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (e) {
    console.error('Failed to save item hover config:', e);
    return false;
  }
});
```

Add to preload.js:

```javascript
contextBridge.exposeInMainWorld('api', {
  // ... existing API methods
  
  getItemHoverConfig: () => ipcRenderer.invoke('get-item-hover-config'),
  setItemHoverConfig: (config) => ipcRenderer.invoke('set-item-hover-config', config)
});
```

### 4. Wire Up Settings Initialization

In `renderer/renderer.js`, in the `initSettings()` function, add:

```javascript
async function initSettings() {
  // ... existing code ...
  
  // Initialize item hover tooltip settings
  if (window.ItemHoverSettings) {
    await window.ItemHoverSettings.init();
  }
}
```

## How It Works

### Hotkey Detection
1. User hovers mouse over an in-game item
2. User holds the configured hotkey (Alt, Ctrl, Shift, or Super)
3. The tooltip detects the key press and displays the value

### Value Estimation
1. Takes price data from the app's existing price-check system
2. Filters out outlier listings (price fixers, errors)
3. Selects the **best currency denomination** to show whole numbers:
   - If worth 2.5 Divine → shows as "25 Chaos" (or appropriate currency)
   - No decimals ever shown
   - Uses currency hierarchy: Exalted < Chaos < Divine (configurable)

### Display
- Small tooltip (24px icon, 12px text by default)
- Positioned at item corner (configurable: top-right, bottom-right, top-left, bottom-left)
- Non-intrusive (semi-transparent, small size, no separate window)
- Follows mouse cursor
- Hides immediately when hotkey is released

## Configuration Options

All available in Settings > General:

| Option | Default | Range | Purpose |
|--------|---------|-------|----------|
| Enable | true | - | Toggle the feature on/off |
| Hotkey | Alt | Alt/Ctrl/Shift/Super | Which key activates tooltip |
| Position | Top-right | 4 corners | Where tooltip appears |
| Icon Size | 24px | 16-48px | Currency icon size |
| Font Size | 12px | 10-20px | Value number size |
| Text Color | #f0d9a8 | Any hex | Text color |
| Opacity | 85% | 10-100% | Transparency level |

## Currency Hierarchy

Currently supports (in `item-hover-tooltip.js`):
- `exalted`
- `chaos`
- `divine`
- `annul`

To add more currencies, extend the `CURRENCY_TIERS` array and ensure they exist in the `catalog`.

## Data Flow

```
In-game item hover
    ↓
Mouse event + Hotkey check
    ↓
Fetch item price from catalog
    ↓
Filter outliers (3x median rule)
    ↓
Select best currency denomination
    ↓
Render tooltip with icon + number
    ↓
Position based on config
    ↓
Follow mouse / Hide on key release
```

## Performance Considerations

- **Lightweight**: Minimal event listeners (keydown, keyup, mousemove)
- **Non-blocking**: Tooltip rendering doesn't interfere with game
- **Cached**: Currency data loaded once from existing catalog
- **Efficient**: Only calculates on demand (when hotkey held)

## Browser Compatibility

- Works in Electron (Windows/Linux/macOS)
- Requires:
  - `pointer-events: none` support
  - `position: fixed`
  - CSS custom properties (--variables)
  - ES6+ JavaScript

## Future Enhancements

- [ ] Keyboard shortcut customization (any key combo)
- [ ] Multiple currency display (e.g., "25 Chaos / 2.5 Divine")
- [ ] Price history sparkline on tooltip
- [ ] Right-click context menu integration
- [ ] Sound effect on tooltip appearance (optional)
- [ ] Tooltip animation/fade-in effect

## Troubleshooting

### Tooltip not appearing
1. Check Settings > General > "Show value tooltip..." is enabled
2. Verify the hotkey matches your keyboard layout
3. Ensure price check data is loaded (`catalog` not empty)

### Wrong currency denomination shown
1. Verify currency prices are up-to-date (refresh prices)
2. Check if item has valid price data
3. Adjust currency hierarchy in `CURRENCY_TIERS` if needed

### Tooltip positioning off
1. Try different position in settings
2. Check if game window is windowed/windowed-fullscreen (overlay requirement)
3. Adjust icon/font size if tooltip is clipping

## Testing Checklist

- [ ] Settings panel loads without errors
- [ ] All sliders work (icon size, font size, opacity)
- [ ] Color picker updates tooltip color
- [ ] Hotkey selector changes activation key
- [ ] Position dropdown changes tooltip corner
- [ ] Enable/disable toggle works
- [ ] Tooltip appears when hovering with hotkey held
- [ ] Tooltip hides when key is released
- [ ] Tooltip follows mouse cursor
- [ ] Settings persist after app restart
- [ ] Works with items in stash/inventory
- [ ] No performance impact on price check tab
- [ ] Outlier filtering works (extreme listings ignored)
