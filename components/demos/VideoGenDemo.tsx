import React, { useState, useEffect } from 'react';
import { Video, Sparkles, Loader2, Info, Bot, Download, Lock, Key } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const LOADING_MESSAGES = [
  "Dreaming up scenes...",
  "Directing the actors...",
  "Rendering frames...",
  "Polishing pixels...",
  "Adding movie magic...",
  "Finalizing render..."
];

const VideoGenDemo: React.FC = () => {
  const [prompt, setPrompt] = useState('A cyberpunk cat running through a neon city at night, 4k, detailed texture');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [keyCheckLoading, setKeyCheckLoading] = useState(true);

  // Check for API Key on mount
  useEffect(() => {
    checkApiKey();
  }, []);

  // Cycle loading messages
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const checkApiKey = async () => {
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        // Fallback for dev environments without the wrapper
        setHasApiKey(!!process.env.API_KEY); 
      }
    } catch (e) {
      console.error("Key check failed", e);
    } finally {
      setKeyCheckLoading(false);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
       await window.aistudio.openSelectKey();
       // Assume success to handle race condition
       setHasApiKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt || isLoading) return;

    // Create fresh instance to ensure key is up to date
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    setIsLoading(true);
    setVideoUrl(null);
    setLoadingMsgIndex(0);

    try {
      // 1. Start Operation
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
      });

      // 2. Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      // 3. Fetch Video
      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (videoUri) {
          // Append API key to fetch request
          const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
      }

    } catch (error: any) {
      console.error("Video Gen Error", error);
      // Handle "Requested entity was not found" -> Reset Key
      if (error.message?.includes("Requested entity was not found")) {
         setHasApiKey(false);
         alert("Please re-select your API key.");
      } else {
         alert("Video generation failed: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (keyCheckLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="h-full max-w-5xl mx-auto p-4 flex flex-col gap-6">
      <div className="text-center space-y-2 relative z-50">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
          Video Generation
          <div className="group relative">
            <button className="p-1 text-gray-500 hover:text-blue-400 transition-colors rounded-full">
                <Info size={20} />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-96 bg-deep-950 border border-white/10 rounded-xl p-5 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top translate-y-2 group-hover:translate-y-0 text-left z-50">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-base border-b border-white/10 pb-2">
                    <Bot size={18} className="text-blue-400"/> Technical Implementation
                </h3>
                <ul className="space-y-4 text-sm text-gray-300">
                    <li className="flex gap-3">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>
                        <strong className="text-white">Model:</strong> Powered by <code>veo-3.1-fast-generate-preview</code> for high-quality video synthesis.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>
                        <strong className="text-white">Operations:</strong> Uses asynchronous polling with <code>ai.operations.getVideosOperation</code> to wait for render completion.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>
                        <strong className="text-white">Billing:</strong> Requires a paid API key. Integration checks via <code>window.aistudio</code> helper.
                        </span>
                    </li>
                </ul>
            </div>
          </div>
        </h2>
        <p className="text-gray-400">
          Create videos from text using <code className="text-blue-400">veo-3.1-fast-generate-preview</code>
        </p>
      </div>

      {!hasApiKey ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-deep-800/30 rounded-2xl border border-dashed border-gray-700">
           <div className="bg-blue-500/10 p-4 rounded-full mb-4">
              <Lock size={48} className="text-blue-400" />
           </div>
           <h3 className="text-2xl font-bold text-white mb-2">Paid API Key Required</h3>
           <p className="text-gray-400 text-center max-w-md mb-8">
             Video generation with Veo requires a billed Google Cloud Project. Please select or create a paid API key to continue.
           </p>
           <button 
             onClick={handleSelectKey}
             className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
           >
             <Key size={18} /> Select API Key
           </button>
           <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="mt-4 text-sm text-blue-400 hover:underline">
             Learn more about billing
           </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-0">
          {/* Controls */}
          <div className="md:col-span-1 flex flex-col gap-4">
              <div className="bg-deep-800 rounded-2xl border border-white/10 p-5 space-y-5 h-full">
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Prompt</label>
                      <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="w-full h-48 bg-deep-900 border border-white/10 rounded-xl p-3 text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50 resize-none leading-relaxed"
                          placeholder="Describe the video scene..."
                      />
                  </div>
                  <button
                      onClick={handleGenerate}
                      disabled={isLoading || !prompt}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                      {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
                      {isLoading ? 'Generating...' : 'Generate Video'}
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Note: Generation can take 1-2 minutes.
                  </p>
              </div>
          </div>

          {/* Preview */}
          <div className="md:col-span-2 bg-deep-800/50 rounded-2xl border border-white/5 p-6 flex items-center justify-center relative overflow-hidden">
              {isLoading && (
                 <div className="flex flex-col items-center justify-center z-10">
                    <div className="relative w-24 h-24 mb-6">
                        <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <Sparkles className="absolute inset-0 m-auto text-blue-400 animate-pulse" size={32} />
                    </div>
                    <p className="text-xl font-medium text-white animate-pulse mb-2">
                      {LOADING_MESSAGES[loadingMsgIndex]}
                    </p>
                    <p className="text-sm text-gray-500">Please wait, this might take a moment.</p>
                 </div>
              )}

              {videoUrl ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center group">
                   <video 
                     src={videoUrl} 
                     controls 
                     autoPlay 
                     loop 
                     className="max-w-full max-h-full rounded-lg shadow-2xl"
                   />
                   <a 
                     href={videoUrl} 
                     download="veo-generation.mp4"
                     className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur flex items-center gap-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Download size={16} /> Save Video
                   </a>
                </div>
              ) : !isLoading && (
                 <div className="text-center text-gray-500 opacity-60">
                    <Video size={64} className="mx-auto mb-4" />
                    <p>Ready to generate video</p>
                 </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGenDemo;