import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Send, Loader2, X, Info, Bot } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const VisionDemo: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage || !prompt || isLoading) return;

    setIsLoading(true);
    setResponse('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Extract base64 data from Data URL
      const base64Data = selectedImage.split(',')[1];
      const mimeType = selectedImage.split(';')[0].split(':')[1];

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      };

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            imagePart,
            { text: prompt }
          ]
        },
      });

      setResponse(result.text || 'No response text generated.');
    } catch (error) {
      console.error("Vision Error", error);
      setResponse("Error generating analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-2 max-w-4xl mx-auto">
      <div className="text-center space-y-2 mb-4 relative z-50">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
          Multimodal Vision
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
                           <strong className="text-white">Multimodal Input:</strong> Uses <code>generateContent</code> with a <code>parts</code> array containing both text and the image as inline Base64 data.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>
                           <strong className="text-white">Model:</strong> Powered by <code>gemini-2.5-flash</code>, which is optimized for high-speed, cost-effective multimodal reasoning.
                        </span>
                    </li>
                </ul>
            </div>
          </div>
        </h2>
        <p className="text-gray-400">Analyze images with context using <code className="text-blue-400">gemini-2.5-flash</code></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-0">
        
        {/* Input Column */}
        <div className="flex flex-col gap-4">
          {/* Image Uploader */}
          <div 
            className={`flex-1 min-h-[300px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all group ${
              selectedImage ? 'border-blue-500/50 bg-deep-800' : 'border-gray-700 bg-deep-800/50 hover:bg-deep-800 hover:border-gray-500'
            }`}
            onClick={() => !selectedImage && fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Preview" className="w-full h-full object-contain p-4" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                  className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500/80 rounded-full text-white backdrop-blur transition-colors"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <div className="text-center p-6 cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="text-blue-400" size={32} />
                </div>
                <p className="text-lg font-medium text-gray-300">Upload an Image</p>
                <p className="text-sm text-gray-500 mt-2">Click to browse</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          {/* Prompt Input */}
          <div className="bg-deep-800 rounded-2xl p-4 border border-white/5 flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask something about this image..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500"
            />
            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || !prompt || isLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </div>

        {/* Output Column */}
        <div className="bg-deep-800/50 rounded-2xl border border-white/5 p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4 text-gray-400 uppercase text-xs font-semibold tracking-wider">
            <ImageIcon size={14} />
            <span>Model Analysis</span>
          </div>
          
          {response ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{response}</p>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600">
              <p className="text-center italic">
                Analysis results will appear here...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisionDemo;