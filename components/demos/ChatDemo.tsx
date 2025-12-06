import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Info } from 'lucide-react';
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { ChatMessage } from '../../types';
import { useDevConsole } from '../../contexts/DevContext';

const CHAT_CODE = `// Initialize Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Create Chat Session
const chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction: 'You are a helpful assistant.',
  },
});

// Stream Message
const result = await chat.sendMessageStream({ 
  message: userText 
});

for await (const chunk of result) {
  const text = chunk.text;
  console.log(text);
}`;

const ChatDemo: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  
  const { addLog, setCodeSnippet } = useDevConsole();

  // Set the code snippet when this component mounts
  useEffect(() => {
    setCodeSnippet(CHAT_CODE);
  }, [setCodeSnippet]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initChat = () => {
    if (!chatSessionRef.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are a helpful, technically savvy assistant. Be concise and precise.',
        },
      });
      addLog({
        type: 'info',
        title: 'Chat Session Initialized',
        data: { model: 'gemini-2.5-flash', systemInstruction: '...' }
      });
    }
    return chatSessionRef.current;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: inputValue,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const startTime = Date.now();
    addLog({
      type: 'request',
      title: 'sendMessageStream',
      data: { message: userMsg.text }
    });

    try {
      const chat = initChat();
      
      const modelMsgId = Date.now() + 1;
      setMessages(prev => [...prev, {
        role: 'model',
        text: '',
        timestamp: modelMsgId,
      }]);

      const result = await chat.sendMessageStream({ message: userMsg.text });

      let fullText = '';
      let chunkCount = 0;
      
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text || '';
        fullText += textChunk;
        chunkCount++;
        
        setMessages(prev => prev.map(msg => 
          msg.timestamp === modelMsgId 
            ? { ...msg, text: fullText }
            : msg
        ));
      }

      addLog({
        type: 'response',
        title: 'Stream Complete',
        latencyMs: Date.now() - startTime,
        data: { 
          chunksReceived: chunkCount,
          totalLength: fullText.length,
          preview: fullText.substring(0, 100) + '...'
        }
      });

    } catch (error: any) {
      console.error('Chat Error:', error);
      addLog({
        type: 'error',
        title: 'API Error',
        data: error.message
      });
      setMessages(prev => [...prev, {
        role: 'model',
        text: 'Sorry, I encountered an error communicating with the API.',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-deep-900 rounded-2xl overflow-hidden border border-white/5 relative">
      <div className="absolute top-0 left-0 right-0 p-4 bg-deep-800/80 backdrop-blur border-b border-white/5 z-10 flex justify-between items-center">
         <div>
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <Bot className="text-blue-400" />
             Interactive Chat
           </h2>
           <p className="text-sm text-gray-400 mt-1">
             Powered by <code className="text-blue-300 bg-blue-900/30 px-1 rounded">gemini-2.5-flash</code> with streaming enabled.
           </p>
         </div>

         {/* Tooltip for Implementation Details */}
         <div className="group relative z-50">
            <button className="p-2 text-gray-500 hover:text-blue-400 transition-colors rounded-full hover:bg-white/5">
                <Info size={20} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-96 bg-deep-950 border border-white/10 rounded-xl p-5 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right translate-y-2 group-hover:translate-y-0">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-base border-b border-white/10 pb-2">
                    <Bot size={18} className="text-blue-400"/> Technical Implementation
                </h3>
                <ul className="space-y-4 text-sm text-gray-300">
                    <li className="flex gap-3">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>
                           <strong className="text-white">Session Management:</strong> Uses <code>ai.chats.create()</code> to maintain conversation history context automatically on the client.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>
                           <strong className="text-white">Streaming:</strong> Implements <code>sendMessageStream()</code> which returns an async iterable. The UI updates in real-time as <code>GenerateContentResponse</code> chunks arrive.
                        </span>
                    </li>
                    <li className="flex gap-3">
                         <span className="text-blue-500 font-bold mt-1">•</span>
                         <span>
                            <strong className="text-white">Model:</strong> Configured with <code>gemini-2.5-flash</code> for low-latency, high-throughput chat interactions.
                         </span>
                     </li>
                </ul>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-24 pb-4 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
            <Bot size={64} className="mb-4" />
            <p>Start a conversation...</p>
            <p className="text-sm mt-2 text-blue-400">Open the Dev Console below to see live logs!</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={msg.timestamp}
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-indigo-600' : 'bg-blue-600'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
              msg.role === 'user' 
                ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/20' 
                : 'bg-deep-800 text-gray-200 border border-white/10'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-center gap-2 text-gray-500 ml-12">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-deep-800 border-t border-white/5">
        <div className="flex items-end gap-2 bg-deep-950 rounded-xl border border-white/10 focus-within:border-blue-500/50 transition-colors p-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-200 placeholder-gray-500 resize-none min-h-[44px] max-h-32 py-2 px-2"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDemo;