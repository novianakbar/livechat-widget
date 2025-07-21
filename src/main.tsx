import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Extend window interface
declare global {
  interface Window {
    initLivechatOSSWidget?: () => void;
  }
}

// Function to initialize the widget
function initLivechatOSSWidget() {
  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'livechat-oss-widget-root';
  widgetContainer.className = 'livechat-oss-widget-root';
  document.body.appendChild(widgetContainer);

  // Render the widget
  const root = createRoot(widgetContainer);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Auto-initialize if script tag is present
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLivechatOSSWidget);
  } else {
    initLivechatOSSWidget();
  }
  
  // Expose initialization function globally
  window.initLivechatOSSWidget = initLivechatOSSWidget;
}
