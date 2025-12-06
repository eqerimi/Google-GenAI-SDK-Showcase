import React, { useState } from 'react';
import { Search, Globe, ExternalLink, Loader2, Info, Bot } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

const SearchDemo: React.FC = () => {
  const [query, setQuery] = useState('Who won the Super Bowl in 2024?');
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query || isLoading) return;

    setIsLoading(true);
    setResponse('');
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setResponse(result.text || 'No text response generated.');
      
      // Extract grounding metadata
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
      if (chunks) {
        setSources(chunks.filter(c => c.web));
      }

    } catch (error) {
      console.error("Search Error", error);
      setResponse("An error occurred while searching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="h-full max-w-4xl mx-auto p-4 flex flex-col gap-6">
      <div className="text-center space-y-2 relative z-50">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
          Search Grounding
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
                        <strong className="text-white">Tool Use:</strong> Configured with <code>tools: [{'{'} googleSearch: {} {'}'}]</code> to enable real-time web retrieval.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>
                        <strong className="text-white">Grounding:</strong> Sources are extracted from <code>groundingMetadata.groundingChunks</code> in the response candidate.
                        </span>
                    </li>
                </ul>
            </div>
          </div>
        </h2>
        <p className="text-gray-400">
          Real-time information retrieval using <code className="text-blue-400">googleSearch</code> tool
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 bg-deep-800 rounded-xl border border-white/10 flex items-center px-4 focus-within:border-blue-500/50 transition-colors">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about current events..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 py-3 px-3"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!query || isLoading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Search'}
        </button>
      </div>

      <div className="flex-1 bg-deep-800/50 border border-white/5 rounded-2xl p-6 overflow-y-auto">
        {!response && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
            <Globe size={48} className="mb-4" />
            <p>Enter a query to search the web</p>
          </div>
        )}

        {isLoading && (
           <div className="space-y-4 animate-pulse">
             <div className="h-4 bg-white/5 rounded w-3/4" />
             <div className="h-4 bg-white/5 rounded w-full" />
             <div className="h-4 bg-white/5 rounded w-5/6" />
             <div className="mt-8 pt-4 border-t border-white/5">
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-white/5 rounded-full" />
                  <div className="h-8 w-32 bg-white/5 rounded-full" />
                </div>
             </div>
           </div>
        )}

        {response && (
          <div className="animate-fade-in">
            <div className="prose prose-invert max-w-none mb-8">
              <p className="text-gray-100 leading-relaxed text-lg">{response}</p>
            </div>

            {sources.length > 0 && (
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Info size={14} />
                  Sources
                </h3>
                <div className="flex flex-wrap gap-3">
                  {sources.map((source, idx) => (
                    source.web && (
                      <a
                        key={idx}
                        href={source.web.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-deep-900 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 px-3 py-2 rounded-lg text-sm text-blue-300 transition-all group"
                      >
                        <span className="truncate max-w-[200px]">{source.web.title}</span>
                        <ExternalLink size={12} className="opacity-50 group-hover:opacity-100" />
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchDemo;