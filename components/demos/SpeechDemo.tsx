import React, { useState, useRef } from 'react';
import { AudioLines, Play, Loader2, MessageSquareText, Info, Bot } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { decode, decodeAudioData } from '../../services/audioUtils';

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

const SpeechDemo: React.FC = () => {
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog. Generative AI is transforming how we interact with technology.");
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const handleGenerate = async () => {
    if (!text || isLoading) return;

    setIsLoading(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (base64Audio) {
        playAudio(base64Audio);
      }

    } catch (error) {
      console.error("TTS Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (base64String: string) => {
    try {
      // Initialize AudioContext if needed
      if (!audioContextRef.current) {
         const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
         audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (browser policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = await decodeAudioData(
        decode(base64String),
        ctx,
        24000, 
        1
      );

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => setIsPlaying(false);
      
      setIsPlaying(true);
      source.start();

    } catch (e) {
      console.error("Playback error", e);
      setIsPlaying(false);
    }
  };

  return (
    <div className="h-full max-w-2xl mx-auto p-4 flex flex-col justify-center gap-8">
      <div className="text-center space-y-2 relative z-50">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
          Text to Speech
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
                        <strong className="text-white">Audio Modality:</strong> Uses <code>config.responseModalities: [Modality.AUDIO]</code> to request audio generation.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>
                        <strong className="text-white">Configuration:</strong> Customizes output voice using <code>speechConfig.voiceConfig.prebuiltVoiceConfig</code>.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>
                        <strong className="text-white">Decoding:</strong> Decodes raw PCM audio output manually via the Web Audio API for playback.
                        </span>
                    </li>
                </ul>
            </div>
          </div>
        </h2>
        <p className="text-gray-400">
          Generate high-quality speech with <code className="text-blue-400">gemini-2.5-flash-preview-tts</code>
        </p>
      </div>

      <div className="bg-deep-800 rounded-2xl border border-white/10 p-6 space-y-6 shadow-xl">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Voice Selection</label>
          <div className="flex flex-wrap gap-2">
            {VOICES.map((voice) => (
              <button
                key={voice}
                onClick={() => setSelectedVoice(voice)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedVoice === voice
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                    : 'bg-deep-900 text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                {voice}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
           <label className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
             <MessageSquareText size={14} />
             Text Input
           </label>
           <textarea
             value={text}
             onChange={(e) => setText(e.target.value)}
             className="w-full h-32 bg-deep-900 border border-white/10 rounded-xl p-4 text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50 resize-none leading-relaxed"
             placeholder="Enter text to speak..."
           />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || isPlaying}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" /> Generating...
            </>
          ) : isPlaying ? (
            <>
              <AudioLines className="animate-pulse" /> Playing...
            </>
          ) : (
            <>
              <Play fill="currentColor" /> Generate Speech
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SpeechDemo;