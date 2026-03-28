import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Loader2, Check } from 'lucide-react';
import { parseVoiceTranscript, isGeminiConfigured } from '../lib/gemini';
import type { VoiceParsedEntry } from '../lib/gemini';
import type { MealType } from '../types';
import { MEAL_LABELS } from '../types';

interface VoiceLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onEntriesParsed: (entries: VoiceParsedEntry[]) => void;
}

export function VoiceLogger({ isOpen, onClose, onEntriesParsed }: VoiceLoggerProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<VoiceParsedEntry[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isOpen) {
      setTranscript('');
      setResults([]);
      setError('');
      setProcessing(false);
      setListening(false);
      setSelectedIndices(new Set());
    }
  }, [isOpen]);

  const startListening = () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(final || interim);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (event: any) => {
      setListening(false);
      if (event.error !== 'no-speech') {
        setError(`Speech error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setError('');
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const processTranscript = async () => {
    if (!transcript.trim()) return;
    if (!isGeminiConfigured()) {
      setError('Gemini API key not configured.');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const entries = await parseVoiceTranscript(transcript);
      if (entries.length === 0) {
        setError('Could not parse any foods from the transcript. Try being more specific.');
        setProcessing(false);
        return;
      }
      setResults(entries);
      setSelectedIndices(new Set(entries.map((_, i) => i)));
    } catch (err: any) {
      setError(err.message || 'Failed to parse transcript');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = () => {
    const selected = results.filter((_, i) => selectedIndices.has(i));
    onEntriesParsed(selected);
    onClose();
  };

  const toggleEntry = (i: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 glass" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />

      <div
        className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Mic size={18} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Voice Logger</span>
          </div>
          <button onClick={onClose}><X size={20} style={{ color: 'var(--text-secondary)' }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {results.length === 0 ? (
            <>
              {/* Mic button */}
              <div className="flex flex-col items-center py-8">
                <button
                  onClick={listening ? stopListening : startListening}
                  className="w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{
                    background: listening ? 'var(--danger)' : 'var(--accent)',
                    boxShadow: listening ? '0 0 0 8px rgba(239,68,68,0.15)' : '0 0 0 8px rgba(22,163,74,0.15)',
                    animation: listening ? 'pulse-ring 1.5s ease-in-out infinite' : 'none',
                  }}
                >
                  {listening ? <MicOff size={36} color="white" /> : <Mic size={36} color="white" />}
                </button>
                <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
                  {listening ? 'Listening... tap to stop' : 'Tap to start speaking'}
                </p>
              </div>

              {/* Transcript */}
              {transcript && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl" style={{ background: 'var(--surface-raised)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>You said:</p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>"{transcript}"</p>
                  </div>

                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="w-full p-3 rounded-xl text-sm outline-none resize-none"
                    style={{
                      background: 'var(--surface-overlay)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                    rows={2}
                    placeholder="Edit transcript if needed..."
                  />

                  <button
                    onClick={processTranscript}
                    disabled={processing}
                    className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: 'var(--accent)', color: 'white' }}
                  >
                    {processing ? (
                      <><Loader2 size={16} className="animate-spin" /> Parsing foods...</>
                    ) : (
                      'Parse with AI'
                    )}
                  </button>
                </div>
              )}

              {!transcript && !listening && (
                <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                  Say something like "I had two eggs, toast with peanut butter, and a glass of milk for breakfast"
                </p>
              )}
            </>
          ) : (
            <>
              {/* Parsed results */}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Parsed from: "{transcript}"
              </p>

              {results.map((entry, i) => (
                <button
                  key={i}
                  onClick={() => toggleEntry(i)}
                  className="w-full text-left p-3 rounded-xl transition-all"
                  style={{
                    background: selectedIndices.has(i) ? 'var(--accent-soft)' : 'var(--surface-raised)',
                    border: `1px solid ${selectedIndices.has(i) ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center"
                        style={{
                          background: selectedIndices.has(i) ? 'var(--accent)' : 'var(--surface-overlay)',
                          border: selectedIndices.has(i) ? 'none' : '1px solid var(--border)',
                        }}
                      >
                        {selectedIndices.has(i) && <Check size={12} color="white" />}
                      </div>
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {entry.name}
                        </span>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {entry.amount} - {MEAL_LABELS[entry.meal_type]}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {entry.macros.calories}
                      </div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        P{entry.macros.protein} C{entry.macros.carbs} F{entry.macros.fat}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              <button
                onClick={handleConfirm}
                disabled={selectedIndices.size === 0}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Log {selectedIndices.size} item{selectedIndices.size !== 1 ? 's' : ''}
              </button>

              <button
                onClick={() => { setResults([]); setSelectedIndices(new Set()); }}
                className="w-full py-2 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                Try again
              </button>
            </>
          )}

          {error && <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
