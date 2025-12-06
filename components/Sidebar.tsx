import React from 'react';
import { MessageSquare, Eye, FileJson, Mic, Menu, X, Globe, AudioLines, Image as ImageIcon, Settings2, Video, FileAudio } from 'lucide-react';
import { DemoType } from '../types';

interface SidebarProps {
  activeDemo: DemoType;
  onSelectDemo: (demo: DemoType) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeDemo, onSelectDemo, isOpen, setIsOpen }) => {
  const menuItems = [
    { type: DemoType.CHAT, label: 'Chat & Streaming', icon: <MessageSquare size={20} /> },
    { type: DemoType.VISION, label: 'Multimodal Vision', icon: <Eye size={20} /> },
    { type: DemoType.VIDEO_GEN, label: 'Video Generation', icon: <Video size={20} /> },
    { type: DemoType.IMAGE_GEN, label: 'Image Generation', icon: <ImageIcon size={20} /> },
    { type: DemoType.SPEECH, label: 'Text to Speech', icon: <AudioLines size={20} /> },
    { type: DemoType.TRANSCRIPTION, label: 'Speech to Text', icon: <FileAudio size={20} /> },
    { type: DemoType.FUNCTION_CALLING, label: 'Function Calling', icon: <Settings2 size={20} /> },
    { type: DemoType.JSON, label: 'Structured JSON', icon: <FileJson size={20} /> },
    { type: DemoType.SEARCH, label: 'Search Grounding', icon: <Globe size={20} /> },
    { type: DemoType.LIVE, label: 'Live Realtime API', icon: <Mic size={20} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-black/50 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-deep-900 border-r border-white/10 transform transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:block`}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              GenAI SDK
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                onSelectDemo(item.type);
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeDemo === item.type
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-white/10">
          <div className="text-xs text-gray-500">
            Running on Google GenAI SDK
            <br />
            v0.1.0 (Beta)
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;