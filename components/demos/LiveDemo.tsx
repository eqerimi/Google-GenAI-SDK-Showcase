import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Activity, Volume2, AlertCircle, Loader2, Info, Bot, Zap } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { createBlob, decode, decodeAudioData } from '../../services/audioUtils';

const LiveDemo: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0); 
  const [lightState, setLightState] = useState({ brightness: 100, color: 'blue' }); // Visualizer state
  
  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Ref for the live session cleanup
  const sessionRef = useRef<any>(null); 

  // Tool Definition
  const controlLightTool: FunctionDeclaration = {
    name: 'controlLight',
    parameters: {
      type: Type.OBJECT,
      description: 'Set the brightness and color of the interactive visualizer.',
      properties: {
        brightness: {
          type: Type.NUMBER,
          description: 'Light level from 0 to 100. Zero is off and 100 is full brightness.',
        },
        color: {
          type: Type.STRING,
          description: 'Color of the light such as `blue`, `red`, `green`, `purple`, `warm`, `cool`.',
        },
      },
      required: ['brightness', 'color'],
    },
  };

  const cleanupAudio = useCallback(() => {
    // Stop all playing sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();

    // Close microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Disconnect script processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Close AudioContexts
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    
    // Close the session if active
    if (sessionRef.current) {
       try { sessionRef.current.close(); } catch(e) {}
       sessionRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    nextStartTimeRef.current = 0;
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    return () => cleanupAudio();
  }, [cleanupAudio]);

  const startSession = async () => {
    if (isConnecting || isConnected) return;
    
    setError(null);
    setIsConnecting(true);

    try {
      // 1. Setup Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      // 2. Get Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Connect to GenAI Live API
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Define callbacks
      const callbacks = {
        onopen: async () => {
          console.log("Live Session Connected");
          setIsConnected(true);
          setIsConnecting(false);
          
          // Start Audio Streaming
          const source = inputCtx.createMediaStreamSource(stream);
          sourceRef.current = source;
          
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Visualizer update
            let sum = 0;
            for(let i=0; i<inputData.length; i+=100) sum += Math.abs(inputData[i]);
            setAudioLevel(Math.min(100, (sum / (inputData.length/100)) * 500));

            const pcmBlob = createBlob(inputData);
            
            // Send Data
            // @ts-ignore - sessionPromise is defined in scope
            sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
            });
          };

          source.connect(processor);
          processor.connect(inputCtx.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
            // 1. Handle Tool Calls (Voice Commands)
            if (message.toolCall) {
                console.log("Tool call received", message.toolCall);
                const functionCalls = message.toolCall.functionCalls;
                const functionResponses = [];

                if (functionCalls?.length) {
                    for(const call of functionCalls) {
                        if (call.name === 'controlLight') {
                            const { brightness, color } = call.args as any;
                            // Update Visual State
                            setLightState({ 
                                brightness: Number(brightness), 
                                color: String(color) 
                            });
                            
                            functionResponses.push({
                                id: call.id,
                                name: call.name,
                                response: { result: `Visualizer set to ${color} at ${brightness}%` }
                            });
                        }
                    }
                }

                // Send Tool Response back to model
                if (functionResponses.length > 0) {
                     // @ts-ignore
                     sessionPromise.then((session) => {
                        session.sendToolResponse({ functionResponses });
                     });
                }
            }

            // 2. Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                if (!audioContextRef.current) return;
                
                try {
                    const ctx = audioContextRef.current;
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                    
                    const audioBuffer = await decodeAudioData(
                        decode(base64Audio),
                        ctx,
                        24000,
                        1
                    );
                    
                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputNode);
                    
                    source.addEventListener('ended', () => {
                        sourcesRef.current.delete(source);
                    });
                    
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(source);
                    
                } catch (err) {
                    console.error("Audio Decode Error", err);
                }
            }

            if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
        },
        onclose: () => {
            console.log("Live Session Closed");
            cleanupAudio();
        },
        onerror: (err: any) => {
            console.error("Live Session Error", err);
            setError("Connection error. Check your API key and permissions.");
            cleanupAudio();
        }
      };

      const sessionPromise = ai.live.connect({ 
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          tools: [{ functionDeclarations: [controlLightTool] }],
          systemInstruction: 'You are a helpful assistant. You have access to a "controlLight" tool that changes the color and brightness of the user\'s screen visualizer. If the user asks to change color or brightness, USE THE TOOL. Be concise.',
        },
        callbacks 
      });

      sessionRef.current = await sessionPromise;

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to start live session");
      cleanupAudio();
    }
  };

  // Helper for dynamic colors
  const getGlowColor = (color: string) => {
    const map: Record<string, string> = {
      'warm': '#fcd34d',
      'cool': '#e0f2fe',
      'blue': '#3b82f6',
      'red': '#ef4444',
      'green': '#22c55e',
      'purple': '#a855f7',
      'white': '#ffffff'
    };
    return map[color.toLowerCase()] || '#3b82f6';
  };

  const currentColor = getGlowColor(lightState.color);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden transition-colors duration-1000"
         style={{ background: isConnected ? `radial-gradient(circle at center, ${currentColor}15 0%, #0b0b12 70%)` : '' }}
    >
        <div className="z-10 text-center space-y-12 max-w-lg w-full">
            <div className="space-y-4 relative z-50">
                <h2 className="text-4xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
                  Live Voice & Tools
                  <div className="group relative">
                      <button className="p-1 text-gray-500 hover:text-blue-400 transition-colors rounded-full">
                          <Info size={24} />
                      </button>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-96 bg-deep-950 border border-white/10 rounded-xl p-5 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top translate-y-2 group-hover:translate-y-0 text-left z-50">
                          <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-base border-b border-white/10 pb-2">
                              <Bot size={18} className="text-blue-400"/> Technical Implementation
                          </h3>
                          <ul className="space-y-4 text-sm text-gray-300">
                              <li className="flex gap-3">
                                  <span className="text-blue-500 font-bold mt-1">•</span>
                                  <span>
                                  <strong className="text-white">Function Calling:</strong> Configured <code>tools: [controlLight]</code>. The model triggers this tool via <code>message.toolCall</code> based on voice input.
                                  </span>
                              </li>
                              <li className="flex gap-3">
                                  <span className="text-blue-500 font-bold mt-1">•</span>
                                  <span>
                                  <strong className="text-white">Bidirectional:</strong> Streams user audio in and plays model audio out while handling tool logic in parallel.
                                  </span>
                              </li>
                          </ul>
                      </div>
                  </div>
                </h2>
                <p className="text-gray-400 text-lg">
                    Speak to control the UI. <br/>
                    <span className="text-sm opacity-75">"Turn the light red" • "Set brightness to 20%"</span>
                </p>
            </div>

            {/* Visualizer Ring */}
            <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
                {/* Outer Ripple */}
                {isConnected && (
                    <div 
                        className="absolute inset-0 rounded-full opacity-30"
                        style={{ 
                            border: `2px solid ${currentColor}`,
                            transform: `scale(${1 + audioLevel/50})`, 
                            transition: 'transform 0.05s ease-out, border-color 0.5s' 
                        }}
                    />
                )}
                {/* Main Circle */}
                <div 
                    className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl`}
                    style={{
                        backgroundColor: isConnected ? currentColor : '#1e1e2e',
                        boxShadow: isConnected 
                            ? `0 0 ${lightState.brightness * 0.5 + 20}px ${currentColor}80` 
                            : 'none',
                        border: isConnected ? 'none' : '2px dashed #374151'
                    }}
                >
                    {isConnecting ? (
                        <Loader2 size={64} className="text-white/50 animate-spin" />
                    ) : isConnected ? (
                        <Zap size={64} className="text-white animate-pulse" fill="currentColor" />
                    ) : (
                        <MicOff size={64} className="text-gray-600" />
                    )}
                </div>
                
                {/* Status Indicator */}
                <div className={`absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full`}>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                        isConnected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-gray-800/50 border-gray-700 text-gray-500'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : isConnecting ? 'bg-blue-500 animate-bounce' : 'bg-gray-500'}`} />
                        <span className="text-sm font-medium">
                        {isConnecting ? 'Connecting...' : isConnected ? 'Live & Listening' : 'Ready to Connect'}
                        </span>
                    </div>
                    {isConnected && (
                        <div className="text-xs text-gray-500 font-mono">
                            Color: {lightState.color} | Brightness: {lightState.brightness}%
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-4 pt-4">
                {!isConnected && !isConnecting ? (
                    <button
                        onClick={startSession}
                        className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        <Mic size={24} className="text-blue-600" />
                        Start Voice Control
                    </button>
                ) : (
                    <button
                        onClick={cleanupAudio}
                        disabled={isConnecting}
                        className={`px-8 py-4 rounded-full font-bold text-lg transition-colors flex items-center gap-3 ${
                          isConnecting 
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20'
                        }`}
                    >
                        <MicOff size={24} />
                        End Session
                    </button>
                )}
                
                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 px-4 py-2 rounded-lg border border-red-900/50 animate-fade-in">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </div>
        </div>

        <div className="absolute bottom-6 right-6 text-xs text-gray-600 flex items-center gap-2">
            <Volume2 size={12} />
            <span>PCM16 24kHz Output / 16kHz Input</span>
        </div>
    </div>
  );
};

export default LiveDemo;