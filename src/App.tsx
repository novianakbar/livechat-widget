import { ChatWidget } from './components/ChatWidget';
import type { WidgetConfig } from './types/chat';

// Global configuration that can be set by the embedding website
declare global {
  interface Window {
    LivechatOSSConfig?: Partial<WidgetConfig>;
  }
}

function App() {
  return (
    <div className="livechat-oss-widget">
      <ChatWidget config={window.LivechatOSSConfig} />
    </div>
  );
}

export default App;
