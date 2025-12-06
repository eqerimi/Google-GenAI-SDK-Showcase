import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, Loader2, Info, Bot, Download, Monitor } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];

const ImageGenDemo: React.FC = () => {
  const [prompt, setPrompt] = useState('A futuristic city with flying cars, neon lights, cyberpunk style');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt || isLoading) return;

    setIsLoading(true);
    setGeneratedImage(null);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          }
        },
      });

      // Iterate through parts to find the image
      const parts = response.candidates?.[0]?.content?.parts;
      let foundImage = false;

      if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';
                setGeneratedImage(`data:${mimeType};base64,${base64Data}`);
                foundImage = true;
                break;
            }
        }
      }

      if (!foundImage) {
          setError("The model did not return an image. It might have refused the prompt.");
      }

    } catch (err: any) {
      console.error("Image Gen Error", err);
      setError(err.message || "Failed to generate image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
      if (generatedImage) {
          const link = document.createElement('a');
          link.href = generatedImage;
          link.download = `gemini-gen-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  return (
    <div className="h-full max-w-5xl mx-auto p-4 flex flex-col gap-6">
      <div className="text-center space-y-2 relative z-50">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
          Image Generation
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
                        <strong className="text-white">Model:</strong> Uses <code>gemini-2.5-flash-image</code> (Nano Banana) for efficient image generation.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>
                        <strong className="text-white">Configuration:</strong> Sets <code>config.imageConfig.aspectRatio</code> to control dimensions.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>
                        <strong className="text-white">Parsing:</strong> Iterates through response content <code>parts</code> to find <code>inlineData</code> containing the base64 image string.
                        </span>
                    </li>
                </ul>
            </div>
          </div>
        </h2>
        <p className="text-gray-400">
          Create images from text using <code className="text-blue-400">gemini-2.5-flash-image</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-0">
         {/* Controls Column */}
         <div className="md:col-span-1 flex flex-col gap-4">
            <div className="bg-deep-800 rounded-2xl border border-white/10 p-5 space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Prompt</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-32 bg-deep-900 border border-white/10 rounded-xl p-3 text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50 resize-none leading-relaxed"
                        placeholder="Describe the image you want to generate..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Monitor size={14}/> Aspect Ratio
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {ASPECT_RATIOS.map((ratio) => (
                            <button
                                key={ratio}
                                onClick={() => setAspectRatio(ratio)}
                                className={`px-2 py-2 rounded-lg text-sm font-medium transition-all border ${
                                aspectRatio === ratio
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'bg-deep-900 border-white/5 text-gray-400 hover:bg-white/5'
                                }`}
                            >
                                {ratio}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {isLoading ? 'Generating...' : 'Generate Image'}
                </button>
                
                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-xl text-red-300 text-sm">
                        {error}
                    </div>
                )}
            </div>
         </div>

         {/* Preview Column */}
         <div className="md:col-span-2 bg-deep-800/50 rounded-2xl border border-white/5 p-6 flex items-center justify-center relative overflow-hidden group">
            {!generatedImage && !isLoading && (
                <div className="text-center text-gray-500 opacity-60">
                    <ImageIcon size={64} className="mx-auto mb-4" />
                    <p>Enter a prompt and click generate</p>
                </div>
            )}
            
            {isLoading && (
                <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                         <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                         <Sparkles className="absolute inset-0 m-auto text-blue-400 animate-pulse" size={32} />
                    </div>
                    <p className="text-gray-300 animate-pulse">Dreaming up your image...</p>
                </div>
            )}

            {generatedImage && (
                <div className="relative w-full h-full flex items-center justify-center">
                    <img 
                        src={generatedImage} 
                        alt="Generated" 
                        className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
                    />
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={handleDownload}
                            className="bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-lg backdrop-blur flex items-center gap-2 font-medium"
                         >
                             <Download size={16} /> Download
                         </button>
                    </div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ImageGenDemo;