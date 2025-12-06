import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatDemo from './components/demos/ChatDemo';
import VisionDemo from './components/demos/VisionDemo';
import JsonDemo from './components/demos/JsonDemo';
import LiveDemo from './components/demos/LiveDemo';
import SearchDemo from './components/demos/SearchDemo';
import SpeechDemo from './components/demos/SpeechDemo';
import ImageGenDemo from './components/demos/ImageGenDemo';
import FunctionCallingDemo from './components/demos/FunctionCallingDemo';
import VideoGenDemo from './components/demos/VideoGenDemo';
import TranscriptionDemo from './components/demos/TranscriptionDemo';
import DevPanel from './components/DevPanel';
import { DevProvider } from './contexts/DevContext';
import { DemoType } from './types';

const AppContent: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<DemoType>(DemoType.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeDemo) {
      case DemoType.CHAT: return <ChatDemo />;
      case DemoType.VISION: return <VisionDemo />;
      case DemoType.IMAGE_GEN: return <ImageGenDemo />;
      case DemoType.VIDEO_GEN: return <VideoGenDemo />;
      case DemoType.JSON: return <JsonDemo />;
      case DemoType.FUNCTION_CALLING: return <FunctionCallingDemo />;
      case DemoType.LIVE: return <LiveDemo />;
      case DemoType.SEARCH: return <SearchDemo />;
      case DemoType.SPEECH: return <SpeechDemo />;
      case DemoType.TRANSCRIPTION: return <TranscriptionDemo />;
      default: return <ChatDemo />;
    }
  };

  return (
    <div className="flex h-screen bg-deep-950 text-gray-100 font-sans selection:bg-blue-500/30">
      <Sidebar 
        activeDemo={activeDemo} 
        onSelectDemo={setActiveDemo} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-white/10 bg-deep-900">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <span className="ml-3 font-semibold text-lg">Gemini Showcase</span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-6 overflow-hidden relative pb-16">
          <div className="h-full w-full max-w-7xl mx-auto animate-fade-in relative z-10">
            {renderContent()}
          </div>
        </div>
        
        {/* Dev Console Panel */}
        <DevPanel />
      </main>
      
      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[128px] pointer-events-none translate-x-1/2 -translate-y-1/2 z-0" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[128px] pointer-events-none -translate-x-1/2 translate-y-1/2 z-0" />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DevProvider>
      <AppContent />
    </DevProvider>
  );
};

export default App;