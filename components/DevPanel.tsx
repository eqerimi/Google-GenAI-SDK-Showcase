import React, { useState } from 'react';
import { Terminal, Code, ChevronUp, ChevronDown, Trash2, X, Activity, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useDevConsole } from '../contexts/DevContext';

const DevPanel: React.FC = () => {
  const { logs, clearLogs, codeSnippet, isOpen, setIsOpen } = useDevConsole();
  const [activeTab, setActiveTab] = useState<'logs' | 'code'>('logs');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-deep-900 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-full shadow-lg hover:bg-deep-800 transition-all z-50 flex items-center gap-2 font-mono text-xs"
      >
        <Terminal size={14} />
        <span>Dev Console</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-1/2 min-h-[300px] bg-[#0d1117] border-t border-white/10 shadow-2xl z-50 flex flex-col transition-transform duration-300 font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-300 font-semibold">
            <Terminal size={16} className="text-blue-500" />
            Developer Console
          </div>
          <div className="flex bg-[#0d1117] rounded-lg p-0.5 border border-white/5">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${
                activeTab === 'logs' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Live Logs
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${
                activeTab === 'code' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Code Snippet
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'logs' && (
            <button onClick={clearLogs} className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5" title="Clear Logs">
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'logs' ? (
          <div className="h-full overflow-y-auto p-4 space-y-3">
            {logs.length === 0 && (
              <div className="text-gray-600 italic text-center mt-10">No logs yet. Interact with the demo to see API events.</div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="bg-[#161b22] rounded-lg border border-white/5 overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2 bg-white/5 border-b border-white/5">
                   <span className="text-gray-500 text-xs">{log.timestamp.toLocaleTimeString()}</span>
                   
                   {log.type === 'request' && <span className="text-purple-400 flex items-center gap-1"><ArrowUpRight size={12}/> Request</span>}
                   {log.type === 'response' && <span className="text-green-400 flex items-center gap-1"><ArrowDownLeft size={12}/> Response</span>}
                   {log.type === 'error' && <span className="text-red-400 flex items-center gap-1"><Activity size={12}/> Error</span>}
                   {log.type === 'info' && <span className="text-blue-400 flex items-center gap-1"><Activity size={12}/> Info</span>}
                   
                   <span className="font-semibold text-gray-300">{log.title}</span>
                   {log.latencyMs && <span className="ml-auto text-xs text-gray-500">{log.latencyMs}ms</span>}
                </div>
                {log.data && (
                  <div className="p-3 overflow-x-auto">
                    <pre className="text-xs text-gray-300 leading-relaxed">
                      {typeof log.data === 'object' 
                        ? JSON.stringify(log.data, null, 2) 
                        : String(log.data)
                      }
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4 bg-[#0d1117]">
            <pre className="text-xs text-gray-300 font-mono leading-relaxed">
              <code>{codeSnippet}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevPanel;