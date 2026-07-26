/**
 * Item Hover Value Tooltip
 * Shows currency icon + value when hovering items while holding a hotkey (default: ALT)
 * Integrates with existing catalog data to estimate item values
 */

'use strict';

// Module state
let tooltipConfig = {
  enabled: true,
  hotkey: 'alt',           // 'alt', 'ctrl', 'shift', 'super'
  position: 'top-right',   // 'top-right', 'bottom-right', 'top-left', 'bottom-left'
  iconSize: 24,            // pixels
  fontSize: 12,            // pixels
  textColor: '#f0d9a8',    // hex color
  opacity: 85              // 10-100%
};

let isHotkeyDown = false;
let tooltipElement = null;
let lastMousePos = { x: 0, y: 0 };

// Currency hierarchy (lower index = lower value tier)
const CURRENCY_TIERS = [
  'exalted',
  'chaos',
  'divine',
  'annul'
  // Can be extended with more currencies
];

/**
 * Filter outliers from a list of prices using the median method
 * Keeps prices within 3x of the median (ignores extreme listings)
 */
function filterOutliers(prices) {
  if (!Array.isArray(prices) || prices.length === 0) return [];
  
  const sorted = [...prices].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // Keep prices within 3x of median (removes price fixers)
  return sorted.filter(p => p >= median / 3 && p <= median * 3);
}

/**
 * Get the median price from a list
 */
function getMedianPrice(prices) {
  const filtered = filterOutliers(prices);
  if (filtered.length === 0) return null;
  return filtered[Math.floor(filtered.length / 2)];
}

/**
 * Estimate an item's value in exalts based on price check data
 * Returns { currencyId, quantity, currencyText, icon }
 */
function estimateItemValue(itemData, catalog) {
  if (!itemData || !catalog) return null;
  
  // If the item has a direct price in exalts
  let valueInExalts = null;
  
  // Try to get price from similar items or item's own price
  if (itemData.price && itemData.price > 0) {
    valueInExalts = itemData.price;
  }
  
  if (!valueInExalts || valueInExalts <= 0) return null;
  
  // Find the best currency denomination (largest whole number)
  for (const currencyId of CURRENCY_TIERS.reverse()) {
    const currencyData = catalog[currencyId];
    if (!currencyData || currencyData.price <= 0) continue;
    
    const quantity = Math.round(valueInExalts / currencyData.price);
    
    if (quantity >= 1) {
      return {
        currencyId,
        quantity,
        currencyText: currencyData.text || currencyId,
        icon: currencyData.icon || ''
      };
    }
  }
  
  // Fallback to exalts
  return {
    currencyId: 'exalted',
    quantity: Math.round(valueInExalts),
    currencyText: catalog['exalted'] ? catalog['exalted'].text : 'Exalted',
    icon: catalog['exalted'] ? catalog['exalted'].icon : ''
  };
}

/**
 * Create or update the tooltip element
 */
function updateTooltip(valueInfo) {
  if (!tooltipElement) {
    tooltipElement = document.createElement('div');
    tooltipElement.id = 'item-hover-tooltip';
    document.body.appendChild(tooltipElement);
  }
  
  if (!valueInfo) {
    tooltipElement.style.display = 'none';
    return;
  }
  
  // Build tooltip HTML
  let html = '<div class="iht-content">';
  
  if (valueInfo.icon) {
    html += `<img src="${valueInfo.icon}" class="iht-icon" alt="${valueInfo.currencyText}">`;
  }
  
  html += `<span class="iht-value">${valueInfo.quantity}</span>`;
  html += '</div>';
  
  tooltipElement.innerHTML = html;
  tooltipElement.style.display = 'block';
  
  // Position based on config
  positionTooltip();
}

/**
 * Position the tooltip based on configured position and mouse
 */
function positionTooltip() {
  if (!tooltipElement || !tooltipElement.offsetParent) return;
  
  const offset = 10; // pixels from cursor
  let x = lastMousePos.x;
  let y = lastMousePos.y;
  
  const width = tooltipElement.offsetWidth;
  const height = tooltipElement.offsetHeight;
  
  switch (tooltipConfig.position) {
    case 'top-right':
      x += offset;
      y -= height + offset;
      break;
    case 'bottom-right':
      x += offset;
      y += offset;
      break;
    case 'top-left':
      x -= width + offset;
      y -= height + offset;
      break;
    case 'bottom-left':
      x -= width + offset;
      y += offset;
      break;
  }
  
  // Keep tooltip on screen
  x = Math.max(0, Math.min(x, window.innerWidth - width));
  y = Math.max(0, Math.min(y, window.innerHeight - height));
  
  tooltipElement.style.left = x + 'px';
  tooltipElement.style.top = y + 'px';
}

/**
 * Check if the configured hotkey is currently pressed
 */
function isConfiguredKeyDown() {
  return isHotkeyDown;
}

/**
 * Initialize event listeners
 */
function initializeListeners() {
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'alt' || key === 'altgraph') {
      if (tooltipConfig.hotkey === 'alt') isHotkeyDown = true;
    } else if (key === 'control') {
      if (tooltipConfig.hotkey === 'ctrl') isHotkeyDown = true;
    } else if (key === 'shift') {
      if (tooltipConfig.hotkey === 'shift') isHotkeyDown = true;
    }
  });
  
  document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'alt' || key === 'altgraph') {
      if (tooltipConfig.hotkey === 'alt') isHotkeyDown = false;
    } else if (key === 'control') {
      if (tooltipConfig.hotkey === 'ctrl') isHotkeyDown = false;
    } else if (key === 'shift') {
      if (tooltipConfig.hotkey === 'shift') isHotkeyDown = false;
    }
    hideTooltip();
  });
  
  document.addEventListener('mousemove', (e) => {
    lastMousePos = { x: e.clientX, y: e.clientY };
    if (tooltipElement && tooltipElement.style.display !== 'none') {
      positionTooltip();
    }
  });
}

/**
 * Hide the tooltip
 */
function hideTooltip() {
  if (tooltipElement) {
    tooltipElement.style.display = 'none';
  }
}

/**
 * Update configuration from settings
 */
function updateConfig(newConfig) {
  if (!newConfig) return;
  Object.assign(tooltipConfig, newConfig);
  applyStyles();
}

/**
 * Apply current config to CSS
 */
function applyStyles() {
  if (!tooltipElement) return;
  
  tooltipElement.style.setProperty('--iht-icon-size', tooltipConfig.iconSize + 'px');
  tooltipElement.style.setProperty('--iht-font-size', tooltipConfig.fontSize + 'px');
  tooltipElement.style.setProperty('--iht-text-color', tooltipConfig.textColor);
  tooltipElement.style.setProperty('--iht-opacity', tooltipConfig.opacity + '%');
}

/**
 * Check if tooltip should be shown for current context
 */
function shouldShowTooltip() {
  return tooltipConfig.enabled && isConfiguredKeyDown();
}

/**
 * Initialize the module
 */
function init() {
  initializeListeners();
  applyStyles();
}

// Export public API
window.ItemHoverTooltip = {
  init,
  updateConfig,
  estimateItemValue,
  hideTooltip,
  updateTooltip,
  shouldShowTooltip,
  getConfig: () => ({ ...tooltipConfig })
};

// Auto-init if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
