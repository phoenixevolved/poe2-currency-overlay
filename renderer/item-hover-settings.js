/**
 * Item Hover Tooltip Settings
 * Wires up the UI controls in the General settings tab
 */

'use strict';

const ITEM_HOVER_CONFIG_KEY = 'itemHoverConfig';

const DEFAULT_ITEM_HOVER_CONFIG = {
  enabled: true,
  hotkey: 'alt',
  position: 'top-right',
  iconSize: 24,
  fontSize: 12,
  textColor: '#f0d9a8',
  opacity: 85
};

/**
 * Initialize item hover tooltip settings UI
 */
async function initItemHoverSettings() {
  // Load saved config or use defaults
  let config = DEFAULT_ITEM_HOVER_CONFIG;
  try {
    const saved = await window.api.getItemHoverConfig?.();
    if (saved) config = { ...DEFAULT_ITEM_HOVER_CONFIG, ...saved };
  } catch (e) {
    console.warn('Could not load item hover config:', e);
  }
  
  // Get UI elements
  const enabledCheckbox = document.getElementById('item-hover-enabled');
  const hotkeySelect = document.getElementById('item-hover-hotkey');
  const positionSelect = document.getElementById('item-hover-position');
  const iconSizeSlider = document.getElementById('item-hover-icon-size-slider');
  const fontSizeSlider = document.getElementById('item-hover-font-size-slider');
  const colorPicker = document.getElementById('item-hover-text-color');
  const opacitySlider = document.getElementById('item-hover-opacity-slider');
  
  if (!enabledCheckbox) return; // Settings not loaded yet
  
  // Set initial values
  enabledCheckbox.checked = config.enabled;
  hotkeySelect.value = config.hotkey;
  positionSelect.value = config.position;
  colorPicker.value = config.textColor;
  
  // Icon size slider
  window.makeSlider(iconSizeSlider, {
    min: 16, max: 48, step: 2, value: config.iconSize,
    onInput: (v) => {
      document.getElementById('item-hover-icon-size-value').textContent = v + 'px';
    },
    onChange: (v) => {
      config.iconSize = v;
      saveItemHoverConfig(config);
    }
  });
  
  // Font size slider
  window.makeSlider(fontSizeSlider, {
    min: 10, max: 20, step: 1, value: config.fontSize,
    onInput: (v) => {
      document.getElementById('item-hover-font-size-value').textContent = v + 'px';
    },
    onChange: (v) => {
      config.fontSize = v;
      saveItemHoverConfig(config);
    }
  });
  
  // Opacity slider
  window.makeSlider(opacitySlider, {
    min: 10, max: 100, step: 5, value: config.opacity,
    onInput: (v) => {
      document.getElementById('item-hover-opacity-value').textContent = v + '%';
    },
    onChange: (v) => {
      config.opacity = v;
      saveItemHoverConfig(config);
    }
  });
  
  // Event listeners
  enabledCheckbox.addEventListener('change', () => {
    config.enabled = enabledCheckbox.checked;
    saveItemHoverConfig(config);
  });
  
  hotkeySelect.addEventListener('change', () => {
    config.hotkey = hotkeySelect.value;
    saveItemHoverConfig(config);
  });
  
  positionSelect.addEventListener('change', () => {
    config.position = positionSelect.value;
    saveItemHoverConfig(config);
  });
  
  colorPicker.addEventListener('change', () => {
    config.textColor = colorPicker.value;
    saveItemHoverConfig(config);
  });
}

/**
 * Save config to localStorage and notify the tooltip module
 */
function saveItemHoverConfig(config) {
  try {
    localStorage.setItem(ITEM_HOVER_CONFIG_KEY, JSON.stringify(config));
    
    // Update the tooltip module if it's loaded
    if (window.ItemHoverTooltip) {
      window.ItemHoverTooltip.updateConfig(config);
    }
    
    // Persist to main process if API available
    window.api.setItemHoverConfig?.(config).catch(() => {});
  } catch (e) {
    console.warn('Could not save item hover config:', e);
  }
}

/**
 * Load config from storage
 */
function loadItemHoverConfig() {
  try {
    const saved = localStorage.getItem(ITEM_HOVER_CONFIG_KEY);
    if (saved) {
      return { ...DEFAULT_ITEM_HOVER_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Could not load item hover config from localStorage:', e);
  }
  return { ...DEFAULT_ITEM_HOVER_CONFIG };
}

// Export for use
window.ItemHoverSettings = {
  init: initItemHoverSettings,
  save: saveItemHoverConfig,
  load: loadItemHoverConfig
};

// Auto-initialize when settings panel is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initItemHoverSettings, 100);
  });
} else {
  setTimeout(initItemHoverSettings, 100);
}
