import React, { useState, useRef } from 'react';
import { Mic, Square, Upload, FileAudio, Loader2, Info, Bot, Trash2, FileText } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const TranscriptionDemo: React.FC = () => {
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const base64 = reader.result.split(',')[1];
            setAudioBase64(base64);
            setMimeType('audio/webm');
          }
        };

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscription('');
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) { // 20MB limit for demo
        alert("File too large. Please upload a file smaller than 20MB.");
        return;
      }

      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setTranscription('');

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          setAudioBase64(base64);
          setMimeType(file.type || 'audio/mp3');
        }
      };
    }
  };

  const clearAudio = () => {
    setAudioBase64(null);
    setAudioUrl(null);
    setTranscription('');
    setMimeType('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTranscribe = async () => {
    if (!audioBase64 || isLoading) return;

    setIsLoading(true);
    setTranscription('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: audioBase64
              }
            },
            { text: "Please provide a highly accurate, verbatim transcription of this audio." }
          ]
        },
      });

      setTranscription(response.text || 'No transcription generated.');

    } catch (error: any) {
      console.error("Transcription Error", error);
      setTranscription(`Error: ${error.message || 'Failed to transcribe audio.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full max-w-4xl mx-auto p-4 flex flex-col gap-6">
      <div className="text-center space-y-2 relative z-50">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
          Speech to Text
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
                        <strong className="text-white">Multimodal Input:</strong> Passes audio as <code>inlineData</code> (base64) along with a text prompt to <code>generateContent</code>.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-blue-500 font-bold mt-1">•</span>
                        <span>
                        <strong className="text-white">Model:</strong> Uses <code>gemini-2.5-flash</code> which natively understands audio features without separate ASR steps.
                        </span>
                    </li>
                </ul>
            </div>
          </div>
        </h2>
        <p className="text-gray-400">
          Transcribe recordings or audio files using <code className="text-blue-400">gemini-2.5-flash</code>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* Input Column */}
        <div className="flex flex-col gap-6">
          {/* Audio Source Card */}
          <div className="bg-deep-800 rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center gap-6 min-h-[300px]">
             
             {!audioUrl ? (
                <>
                  <div className="flex flex-col items-center gap-4 w-full">
                    <button 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                        isRecording 
                        ? 'bg-red-500 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
                        : 'bg-deep-900 border-2 border-dashed border-gray-600 hover:border-blue-500 hover:bg-deep-900/50'
                      }`}
                    >
                      {isRecording ? <Square size={32} fill="white" className="text-white" /> : <Mic size={32} className="text-gray-400" />}
                    </button>
                    <p className="text-gray-400 text-sm font-medium">
                      {isRecording ? "Recording... Click to stop" : "Click mic to record"}
                    </p>
                  </div>

                  <div className="w-full flex items-center gap-4">
                    <div className="h-px bg-white/10 flex-1" />
                    <span className="text-xs text-gray-500 uppercase">OR</span>
                    <div className="h-px bg-white/10 flex-1" />
                  </div>

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors border border-white/5 hover:border-white/20"
                  >
                    <Upload size={18} />
                    <span>Upload Audio File</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="audio/*" 
                    onChange={handleFileUpload} 
                  />
                </>
             ) : (
                <div className="w-full flex flex-col items-center gap-6 animate-fade-in">
                   <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
                      <FileAudio size={40} className="text-white" />
                   </div>
                   
                   <div className="w-full">
                     <audio src={audioUrl} controls className="w-full" />
                   </div>

                   <div className="flex gap-3 w-full">
                      <button 
                         onClick={handleTranscribe}
                         disabled={isLoading}
                         className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                         {isLoading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                         {isLoading ? 'Transcribing...' : 'Transcribe'}
                      </button>
                      <button 
                         onClick={clearAudio}
                         className="px-4 bg-deep-900 hover:bg-red-500/20 hover:text-red-400 text-gray-400 border border-white/10 rounded-xl transition-colors"
                      >
                         <Trash2 size={20} />
                      </button>
                   </div>
                </div>
             )}
          </div>
          
          <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl">
             <div className="flex items-start gap-3">
                <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-blue-200/80">
                   <strong>Pro Tip:</strong> Gemini 2.5 Flash can distinguish multiple speakers and even detect emotions or background sounds if prompted.
                </p>
             </div>
          </div>
        </div>

        {/* Output Column */}
        <div className="bg-deep-800/50 border border-white/5 rounded-2xl p-6 overflow-y-auto flex flex-col relative">
           <div className="flex items-center gap-2 mb-4 text-gray-400 uppercase text-xs font-semibold tracking-wider sticky top-0 bg-transparent backdrop-blur-sm z-10 pb-2 border-b border-white/5 w-full">
             <FileText size={14} />
             <span>Transcription Output</span>
           </div>

           {transcription ? (
             <div className="prose prose-invert prose-lg max-w-none">
               <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{transcription}</p>
             </div>
           ) : isLoading ? (
             <div className="flex-1 flex flex-col items-center justify-center space-y-4">
               <div className="w-full max-w-xs space-y-3">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-1/3 animate-[shimmer_1.5s_infinite]" />
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden w-2/3 mx-auto">
                     <div className="h-full bg-blue-500 w-1/2 animate-[shimmer_1.5s_infinite_0.2s]" />
                  </div>
               </div>
               <p className="text-gray-500 text-sm animate-pulse">Listening and transcribing...</p>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-600 opacity-60">
               <FileText size={48} className="mb-4" />
               <p className="text-center">Upload or record audio<br/>to see transcription here</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default TranscriptionDemo;