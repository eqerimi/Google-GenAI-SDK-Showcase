import React, { useState } from 'react';
import { Settings2, Send, Lightbulb, Power, Loader2, Info, Bot, Terminal } from 'lucide-react';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";

interface LightState {
  isOn: boolean;
  brightness: number;
  color: string;
}

const FunctionCallingDemo: React.FC = () => {
  const [prompt, setPrompt] = useState('Turn on the lights and set them to blue at 80% brightness');
  const [response, setResponse] = useState('');
  const [lightState, setLightState] = useState<LightState>({
    isOn: false,
    brightness: 0,
    color: 'warm'
  });
  const [toolLogs, setToolLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Define the tool
  const controlLightTool: FunctionDeclaration = {
    name: 'controlLight',
    parameters: {
      type: Type.OBJECT,
      description: 'Set the brightness and color temperature of a room light.',
      properties: {
        brightness: {
          type: Type.NUMBER,
          description: 'Light level from 0 to 100. Zero is off and 100 is full brightness.',
        },
        colorTemperature: {
          type: Type.STRING,
          description: 'Color temperature or color of the light fixture such as `daylight`, `cool`, `warm`, `blue`, `red`.',
        },
      },
      required: ['brightness', 'colorTemperature'],
    },
  };

  const handleSend = async () => {
    if (!prompt || isLoading) return;

    setIsLoading(true);
    setResponse('');
    setToolLogs([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ functionDeclarations: [controlLightTool] }],
        },
      });

      // Handle Tool Calls
      const functionCalls = result.candidates?.[0]?.content?.parts?.[0]?.functionCall 
         ? [result.candidates[0].content.parts[0].functionCall] // Single call
         : result.functionCalls; // Helper getter if multiple

      if (functionCalls && functionCalls.length > 0) {
        const fc = functionCalls[0];
        setToolLogs(prev => [...prev, {
            type: 'request',
            name: fc.name,
            args: fc.args
        }]);

        if (fc.name === 'controlLight') {
          const newBrightness = fc.args['brightness'] as number;
          const newColor = fc.args['colorTemperature'] as string;
          
          // Execute "Function"
          setLightState({
            isOn: newBrightness > 0,
            brightness: newBrightness,
            color: newColor
          });

          setResponse(`Function executed: Changed light to ${newColor} at ${newBrightness}%`);
        }
      } else {
        setResponse(result.text || 'No function call triggered. Try a more direct command.');
      }

    } catch (error) {
      console.error("Function Call Error", error);
      setResponse("Error executing function call.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get CSS color from text
  const getLightColor = (color: string) => {
    const map: Record<string, string> = {
      'warm': '#fcd34d',
      'cool': '#e0f2fe',
      'daylight': '#ffffff',
      'blue': '#3b82f6',
      'red': '#ef4444',
      'green': '#22c55e',
      'purple': '#a855f7'
    };
    return map[color.toLowerCase()] || '#ffffff';
  };

  return (
    <div className="h-full max-w-5xl mx-auto p-4 flex flex-col gap-6">
      <div className="text-center space-y-2 relative z-50">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
          Function Calling
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
                        <strong className="text-white">Tool Definition:</strong> Defined <code>FunctionDeclaration</code> with typed schema (brightness: NUMBER, color: STRING).
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>
                        <strong className="text-white">Execution:</strong> Parsed <code>result.functionCalls</code> to extract arguments and update client-side state (React state).
                        </span>
                    </li>
                </ul>
            </div>
          </div>
        </h2>
        <p className="text-gray-400">
          Control interactive elements using <code className="text-blue-400">tools</code> and <code className="text-blue-400">functionDeclarations</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* Interaction Column */}
        <div className="flex flex-col gap-4">
           <div className="bg-deep-800 rounded-2xl border border-white/10 p-5 flex flex-col gap-4 flex-1">
             <div className="flex-1 overflow-y-auto space-y-4 min-h-[200px]">
               {toolLogs.map((log, i) => (
                 <div key={i} className="bg-black/30 rounded-lg p-3 font-mono text-xs border border-white/5">
                   <div className="flex items-center gap-2 text-green-400 mb-2 border-b border-white/5 pb-1">
                     <Terminal size={12} />
                     <span>TOOL CALL DETECTED</span>
                   </div>
                   <div className="text-blue-300">Function: {log.name}</div>
                   <div className="text-gray-400 mt-1">
                     Args: {JSON.stringify(log.args, null, 2)}
                   </div>
                 </div>
               ))}
               {!isLoading && toolLogs.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                   <Terminal size={48} className="mb-4" />
                   <p>Send a command to trigger a function</p>
                 </div>
               )}
             </div>

             <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Command</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 bg-deep-900 border border-white/10 rounded-xl px-4 text-white focus:ring-1 focus:ring-blue-500"
                    placeholder="E.g., Make it bright red..."
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !prompt}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
             </div>
           </div>
        </div>

        {/* Visualization Column */}
        <div className="bg-deep-800/50 rounded-2xl border border-white/5 p-8 flex flex-col items-center justify-center relative overflow-hidden">
           {/* Room Ambience */}
           <div 
             className="absolute inset-0 transition-colors duration-1000"
             style={{ 
               backgroundColor: lightState.isOn ? getLightColor(lightState.color) : 'transparent',
               opacity: lightState.isOn ? (lightState.brightness / 100) * 0.2 : 0
             }}
           />

           {/* Bulb Container */}
           <div className="relative z-10 flex flex-col items-center gap-8">
              <div 
                className={`w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all duration-700 shadow-2xl ${
                  lightState.isOn ? 'border-white/50' : 'border-gray-700 bg-deep-900'
                }`}
                style={{
                   backgroundColor: lightState.isOn ? getLightColor(lightState.color) : undefined,
                   boxShadow: lightState.isOn 
                     ? `0 0 ${lightState.brightness}px ${getLightColor(lightState.color)}` 
                     : 'none',
                   filter: lightState.isOn ? 'brightness(1.2)' : 'none'
                }}
              >
                <Lightbulb 
                  size={80} 
                  className={`transition-colors duration-300 ${lightState.isOn ? 'text-white' : 'text-gray-600'}`} 
                  fill={lightState.isOn ? "currentColor" : "none"}
                />
              </div>

              {/* State Display */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <div className="bg-deep-900/80 backdrop-blur border border-white/10 p-4 rounded-xl text-center">
                   <div className="text-gray-500 text-xs uppercase font-bold mb-1">Status</div>
                   <div className={`text-lg font-bold flex items-center justify-center gap-2 ${lightState.isOn ? 'text-green-400' : 'text-gray-400'}`}>
                     <Power size={16} />
                     {lightState.isOn ? 'ON' : 'OFF'}
                   </div>
                </div>
                <div className="bg-deep-900/80 backdrop-blur border border-white/10 p-4 rounded-xl text-center">
                   <div className="text-gray-500 text-xs uppercase font-bold mb-1">Brightness</div>
                   <div className="text-lg font-bold text-white">
                     {lightState.brightness}%
                   </div>
                </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default FunctionCallingDemo;