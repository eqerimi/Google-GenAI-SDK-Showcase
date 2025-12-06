import React, { useState, useEffect } from 'react';
import { FileJson, ChevronRight, Loader2, Utensils, Info, Bot } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from '../../types';
import { useDevConsole } from '../../contexts/DevContext';

const JSON_CODE = `const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt,
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          recipeName: { type: Type.STRING },
          ingredients: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          instructions: { type: Type.STRING }
        }
      }
    }
  }
});`;

const JsonDemo: React.FC = () => {
  const [topic, setTopic] = useState('Italian Pasta');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addLog, setCodeSnippet } = useDevConsole();

  useEffect(() => {
    setCodeSnippet(JSON_CODE);
  }, [setCodeSnippet]);

  const generateRecipes = async () => {
    if (!topic || isLoading) return;

    setIsLoading(true);
    setRecipes([]);

    const startTime = Date.now();
    const schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            recipeName: { type: Type.STRING },
            ingredients: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            instructions: { type: Type.STRING }
          },
          propertyOrdering: ["recipeName", "ingredients", "instructions"]
        }
    };

    addLog({
        type: 'request',
        title: 'generateContent (JSON)',
        data: {
            model: 'gemini-2.5-flash',
            prompt: `List 3 popular recipes for: ${topic}`,
            schema: schema
        }
    });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `List 3 popular recipes for: ${topic}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        setRecipes(data);
        addLog({
            type: 'response',
            title: 'JSON Received',
            latencyMs: Date.now() - startTime,
            data: data
        });
      }
    } catch (error: any) {
      console.error("JSON Gen Error", error);
      addLog({
          type: 'error',
          title: 'JSON Generation Failed',
          data: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full max-w-5xl mx-auto p-4 flex flex-col gap-8">
      <div className="text-center space-y-2 relative z-50">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
            Structured JSON
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
                            <strong className="text-white">Response Schema:</strong> Uses <code>config.responseSchema</code> with <code>Type.ARRAY</code> and <code>Type.OBJECT</code> to enforce strict type adherence.
                            </span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-blue-500 font-bold mt-1">•</span>
                            <span>
                            <strong className="text-white">MIME Type:</strong> Sets <code>responseMimeType</code> to <code>"application/json"</code> ensures the model returns parseable JSON.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </h2>
        <p className="text-gray-400">Generate strictly typed data using <code className="text-blue-400">responseSchema</code></p>
      </div>

      <div className="flex justify-center w-full">
        <div className="flex items-center gap-2 bg-deep-800 p-2 rounded-2xl border border-white/10 w-full max-w-md shadow-xl">
          <div className="pl-3 text-gray-400"><Utensils size={18} /></div>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a food topic (e.g., Cookies, Vegan)..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500"
          />
          <button
            onClick={generateRecipes}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Generate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pb-4">
        {recipes.length > 0 ? (
          recipes.map((recipe, idx) => (
            <div key={idx} className="bg-deep-800/50 border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                <FileJson size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-3">{recipe.recipeName}</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ingredients</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1.5">•</span>
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                   <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Instructions</h4>
                   <p className="text-sm text-gray-400 line-clamp-4 hover:line-clamp-none transition-all">
                     {recipe.instructions}
                   </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          !isLoading && (
            <div className="col-span-full flex flex-col items-center justify-center text-gray-600 h-64 border-2 border-dashed border-gray-800 rounded-2xl">
              <FileJson size={48} className="mb-4 opacity-50" />
              <p>Enter a topic and generate structured recipes.</p>
              <p className="text-xs text-blue-400 mt-2">Check the Dev Console for raw JSON response</p>
            </div>
          )
        )}
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-deep-800/30 border border-white/5 rounded-2xl p-6 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-white/5 mb-4" />
            <div className="h-6 bg-white/5 rounded w-3/4 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-white/5 rounded w-full" />
              <div className="h-4 bg-white/5 rounded w-5/6" />
              <div className="h-4 bg-white/5 rounded w-4/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JsonDemo;