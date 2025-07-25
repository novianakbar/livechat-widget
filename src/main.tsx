import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import type { WidgetConfig } from './types/chat'

// Extend window interface
declare global {
  interface Window {
    initLivechatOSSWidget?: () => void;
    LivechatOSSConfig?: Partial<WidgetConfig>;
    LiveChatWidget?: typeof LiveChatWidget;
  }
}

// Widget class for programmatic usage
class LiveChatWidget {
  private container: HTMLElement | null = null;
  private root: Root | null = null;
  private config: Partial<WidgetConfig>;

  constructor(config: Partial<WidgetConfig> = {}) {
    this.config = config;
    // Set global config for the React component
    window.LivechatOSSConfig = config;
  }

  mount(selector: string | HTMLElement) {
    let container: HTMLElement | null;

    if (typeof selector === 'string') {
      container = document.querySelector(selector);
      if (!container) {
        throw new Error(`Element with selector "${selector}" not found`);
      }
    } else {
      container = selector;
    }

    this.container = container;

    // Clear any existing content
    container.innerHTML = '';

    // Add widget styles to container
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      pointer-events: none;
    `;

    // Override position if specified in config
    if (this.config.position) {
      const positions = this.config.position.split('-');
      container.style.top = positions.includes('top') ? '20px' : 'auto';
      container.style.bottom = positions.includes('bottom') ? '20px' : 'auto';
      container.style.left = positions.includes('left') ? '20px' : 'auto';
      container.style.right = positions.includes('right') ? '20px' : 'auto';
    }

    // Render the widget
    this.root = createRoot(container);
    this.root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }

  unmount() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }

  updateConfig(newConfig: Partial<WidgetConfig>) {
    this.config = { ...this.config, ...newConfig };
    window.LivechatOSSConfig = this.config;

    // Re-render if mounted
    if (this.container && this.root) {
      this.root.render(
        <StrictMode>
          <App />
        </StrictMode>
      );
    }
  }
}

// Function to initialize the widget automatically
function initLivechatOSSWidget() {
  // Check if widget is already initialized
  if (document.getElementById('livechat-oss-widget-root')) {
    console.warn('Livechat OSS Widget already initialized');
    return;
  }

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'livechat-oss-widget-root';
  widgetContainer.className = 'livechat-oss-widget-root';

  // Add positioning styles
  widgetContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    pointer-events: none;
  `;

  document.body.appendChild(widgetContainer);

  // Render the widget
  const root = createRoot(widgetContainer);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  console.log('Livechat OSS Widget initialized successfully');
}

// Auto-initialize if script tag is present
if (typeof window !== 'undefined') {
  // Set default configuration if not provided
  if (!window.LivechatOSSConfig) {
    window.LivechatOSSConfig = {};
  }

  // Expose the widget class globally
  window.LiveChatWidget = LiveChatWidget;

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLivechatOSSWidget);
  } else {
    // Small delay to ensure other scripts have loaded
    setTimeout(initLivechatOSSWidget, 100);
  }

  // Expose initialization function globally
  window.initLivechatOSSWidget = initLivechatOSSWidget;
}

// Export for module usage
export { LiveChatWidget };
export default LiveChatWidget;
