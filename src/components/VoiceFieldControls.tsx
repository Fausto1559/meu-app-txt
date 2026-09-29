import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Radio, Volume2, X } from 'lucide-react';
import {
  FinancialRecord,
  PaymentMethod,
  ReportPeriod,
  TransactionType,
} from '../types/finance';
import {
  FIELD_LABELS,
  formatBRL,
  parsePortugueseVoiceCommand,
  PERIOD_LABELS,
} from '../utils/financeUtils';

/**
 * Starts browser speech recognition (pt-BR) for any field or input.
 * Calls onTranscript(text) when speech is recognized, or opens an inline voice prompt fallback if mic is blocked.
 */
export function startBrowserVoiceCapture(
  onTranscript: (text: string) => void,
  onStatusChange?: (listening: boolean, error?: string) => void
): () => void {
  const SpeechRecognitionAPI =
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    onStatusChange?.(
      false,
      'Reconhecimento nativo indisponível neste navegador. Use o campo rápido de voz.'
    );
    return () => {};
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognitionAPI as any)();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    onStatusChange?.(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        onTranscript(transcript);
      }
      onStatusChange?.(false);
    };

    recognition.onerror = () => {
      onStatusChange?.(
        false,
        'Permissão de microfone bloqueada ou sem áudio detectado.'
      );
    };

    recognition.onend = () => {
      onStatusChange?.(false);
    };

    recognition.start();
    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  } catch {
    onStatusChange?.(false, 'Erro ao iniciar microfone.');
    return () => {};
  }
}

interface FieldVoiceAndClearBarProps {
  field: TransactionType;
  period: ReportPeriod;
  currentValue: number;
  todayISO: string;
  onAddRecord: (record: Omit<FinancialRecord, 'id'>) => void;
  onClearFieldValue: (field: TransactionType, period: ReportPeriod) => void;
  compact?: boolean;
}

/**
 * Reusable Microphone + "X" (Apagar/Excluir Valor) control embedded directly in each financial field
 * (Vendas, A Receber, A Pagar) and each period (Diário, Semanal, Mensal).
 */
export const FieldVoiceAndClearBar: React.FC<FieldVoiceAndClearBarProps> = ({
  field,
  period,
  currentValue,
  todayISO,
  onAddRecord,
  onClearFieldValue,
  compact = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [showQuickVoiceInput, setShowQuickVoiceInput] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const stopRef = useRef<(() => void) | null>(null);

  const handleMicClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isListening) {
      stopRef.current?.();
      setIsListening(false);
      return;
    }

    stopRef.current = startBrowserVoiceCapture(
      (transcript) => {
        const parsed = parsePortugueseVoiceCommand(transcript, field, todayISO);
        onAddRecord({ ...parsed, type: field });
        setShowQuickVoiceInput(false);
        setVoiceText('');
      },
      (listening, err) => {
        setIsListening(listening);
        if (err) {
          setShowQuickVoiceInput(true);
        }
      }
    );
  };

  const handleClearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClearFieldValue(field, period);
  };

  const handleManualVoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!voiceText.trim()) return;
    const parsed = parsePortugueseVoiceCommand(voiceText, field, todayISO);
    onAddRecord({ ...parsed, type: field });
    setVoiceText('');
    setShowQuickVoiceInput(false);
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className="inline-flex flex-col items-end gap-1.5">
      <div className="inline-flex items-center gap-1.5">
        {/* MICROFONE DO CAMPO */}
        <button
          type="button"
          onClick={handleMicClick}
          title={`Falar valor para ${FIELD_LABELS[field]} (${PERIOD_LABELS[period]})`}
          className={`inline-flex items-center justify-center gap-1 rounded-lg border transition-colors cursor-pointer ${
            compact ? 'p-1.5 text-[11px]' : 'px-2.5 py-1.5 text-xs font-semibold'
          } ${
            isListening
              ? 'bg-rose-500/25 border-rose-400 text-rose-200 animate-pulse'
              : 'bg-[#17233d] hover:bg-[#1f2f52] border-[#293d66] text-amber-300 hover:text-amber-200'
          }`}
        >
          {isListening ? (
            <MicOff className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          ) : (
            <Mic className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          )}
          {!compact && <span>{isListening ? 'Ouvindo...' : 'Voz'}</span>}
        </button>

        {/* BOTÃO "X" PARA APAGAR / EXCLUIR O VALOR DO CAMPO */}
        <button
          type="button"
          onClick={handleClearClick}
          disabled={currentValue <= 0}
          title={`Apagar / Excluir valor de ${FIELD_LABELS[field]} (${PERIOD_LABELS[period]})`}
          className={`inline-flex items-center justify-center rounded-lg border transition-colors ${
            compact ? 'p-1.5 text-[11px]' : 'px-2 py-1.5 text-xs font-bold'
          } ${
            currentValue > 0
              ? 'bg-rose-500/15 hover:bg-rose-500/30 border-rose-500/40 text-rose-300 hover:text-white cursor-pointer'
              : 'bg-[#0b1120]/60 border-[#1e2d4a] text-slate-600 cursor-not-allowed'
          }`}
        >
          <X className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        </button>
      </div>

      {showQuickVoiceInput && (
        <form
          onSubmit={handleManualVoiceSubmit}
          className="flex items-center gap-1 bg-[#0b1120] border border-amber-500/50 rounded-lg p-1 shadow-lg z-20"
        >
          <input
            type="text"
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            placeholder={`Ex: ${FIELD_LABELS[field]} 350 reais`}
            className="bg-transparent text-[11px] text-white px-2 py-1 w-36 focus:outline-none"
            autoFocus
          />
          {voiceText && (
            <button
              type="button"
              onClick={() => setVoiceText('')}
              title="Limpar texto"
              className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="submit"
            className="px-2 py-1 bg-amber-500 text-slate-950 text-[10px] font-bold rounded cursor-pointer"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => setShowQuickVoiceInput(false)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </form>
      )}
    </div>
  );
};

interface VoiceInputFieldProps {
  label?: string;
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  numericOnly?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * Input field with built-in Microphone (voice dictation) AND "X" button to clear/erase the field value at any time.
 */
export const VoiceClearInput: React.FC<VoiceInputFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  numericOnly = false,
  required = false,
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const handleVoiceDictation = () => {
    if (isListening) {
      stopRef.current?.();
      setIsListening(false);
      return;
    }

    stopRef.current = startBrowserVoiceCapture(
      (transcript) => {
        if (numericOnly || type === 'number') {
          const match = transcript.match(/(\d+(?:[.,]\d{1,2})?)/);
          if (match) {
            onChange(match[1].replace(',', '.'));
          }
        } else {
          onChange(transcript);
        }
      },
      (listening) => {
        setIsListening(listening);
      }
    );
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type={type}
          step={type === 'number' ? '0.01' : undefined}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0b1120] border border-[#1e2d4a] rounded-lg pl-3 pr-16 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono-num"
        />
        <div className="absolute right-1.5 flex items-center gap-1">
          {/* "X" BUTTON TO CLEAR THE INPUT VALUE */}
          {value !== '' && (
            <button
              type="button"
              onClick={() => onChange('')}
              title="Apagar / Excluir valor deste campo"
              className="p-1 rounded-md text-rose-400 hover:text-white hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {/* MICROPHONE BUTTON FOR THIS INPUT FIELD */}
          <button
            type="button"
            onClick={handleVoiceDictation}
            title="Preencher este campo por voz"
            className={`p-1 rounded-md transition-colors cursor-pointer ${
              isListening
                ? 'bg-rose-500/30 text-rose-300 animate-pulse'
                : 'text-amber-400 hover:text-amber-300 hover:bg-[#17233d]'
            }`}
          >
            {isListening ? (
              <MicOff className="w-3.5 h-3.5" />
            ) : (
              <Mic className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- GEMINI 3.8 LIVE REAL-TIME VOICE CONVERSATION COPILOT --- */
function float32ToPcm16Base64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface LiveVoiceCopilotWidgetProps {
  todayISO: string;
  onAddRecord: (record: Omit<FinancialRecord, 'id'>) => void;
  onClearFieldValue: (
    field: TransactionType | 'todos',
    period: ReportPeriod | 'todos'
  ) => void;
}

export const LiveVoiceCopilotWidget: React.FC<LiveVoiceCopilotWidgetProps> = ({
  todayISO,
  onAddRecord,
  onClearFieldValue,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [statusText, setStatusText] = useState<string>(
    'Converse em tempo real para lançar ou apagar valores em Vendas, A Receber e A Pagar'
  );
  const [lastTranscript, setLastTranscript] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Keep latest callbacks in refs to avoid stale closures in WebSocket/Audio callbacks
  const onAddRecordRef = useRef(onAddRecord);
  const onClearFieldRef = useRef(onClearFieldValue);
  useEffect(() => {
    onAddRecordRef.current = onAddRecord;
    onClearFieldRef.current = onClearFieldValue;
  }, [onAddRecord, onClearFieldValue]);

  const stopLiveSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    nextStartTimeRef.current = 0;
    setIsConnected(false);
    setStatusText('Sessão de voz encerrada.');
  };

  const playPcm24kChunk = (base64Pcm: string) => {
    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;

    const binary = atob(base64Pcm);
    const len = binary.length;
    const int16 = new Int16Array(len / 2);
    const view = new DataView(new ArrayBuffer(len));
    for (let i = 0; i < len; i++) {
      view.setUint8(i, binary.charCodeAt(i));
    }
    for (let i = 0; i < int16.length; i++) {
      int16[i] = view.getInt16(i * 2, true);
    }

    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startTime = Math.max(now, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
  };

  const startLiveSession = async () => {
    try {
      setStatusText('Conectando ao Copiloto de Voz em Tempo Real (Gemini Live)...');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const base64 = float32ToPcm16Base64(e.inputBuffer.getChannelData(0));
          wsRef.current.send(JSON.stringify({ audio: base64 }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ready') {
            setIsConnected(true);
            setStatusText(
              'Conectado! Fale por exemplo: "Lança uma venda de 300 reais" ou "Apaga o valor de A Pagar".'
            );
          } else if (msg.type === 'audio' && msg.audio) {
            playPcm24kChunk(msg.audio);
          } else if (msg.type === 'input_transcription' && msg.text) {
            setLastTranscript(`Você: "${msg.text}"`);
          } else if (msg.type === 'output_transcription' && msg.text) {
            setLastTranscript(`Copiloto: "${msg.text}"`);
          } else if (msg.type === 'interrupted') {
            if (outputAudioCtxRef.current) {
              nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
            }
          } else if (msg.type === 'tool_call') {
            if (msg.name === 'adicionarLancamentoFinanceiro' && msg.args) {
              const rawType = String(msg.args.type || 'vendas').toLowerCase();
              const validType: TransactionType =
                rawType === 'receber'
                  ? 'receber'
                  : rawType === 'pagar'
                  ? 'pagar'
                  : 'vendas';
              const gross = Number(msg.args.grossAmount) || 100;
              const pm = (msg.args.paymentMethod || 'pix') as PaymentMethod;
              const now = new Date();
              const time = `${String(now.getHours()).padStart(2, '0')}:${String(
                now.getMinutes()
              ).padStart(2, '0')}`;

              onAddRecordRef.current({
                type: validType,
                title: String(msg.args.title || `Lançamento por Voz (${FIELD_LABELS[validType]})`),
                entityName: 'Comando de Voz Gemini Live',
                grossAmount: gross,
                feeAmount: 0,
                netAmount: gross,
                date: todayISO,
                time,
                paymentMethod: pm,
                status: validType === 'vendas' ? 'confirmado' : 'pendente',
                subcategory: 'Comando de Voz',
              });
              setStatusText(
                `Lançado por voz em ${FIELD_LABELS[validType]}: ${formatBRL(gross)}`
              );
            } else if (msg.name === 'limparCampoFinanceiro' && msg.args) {
              const f = (msg.args.field || 'vendas') as TransactionType | 'todos';
              const p = (msg.args.period || 'diario') as ReportPeriod | 'todos';
              onClearFieldRef.current(f, p);
              setStatusText(`Valor do campo ${f} apagado por comando de voz!`);
            }
          } else if (msg.type === 'error') {
            setStatusText(
              `Modo Voz Local ativo (${msg.message || 'Use os microfones de cada campo'}).`
            );
            stopLiveSession();
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        setStatusText('Use os microfones individuais de cada campo para ditado direto.');
        stopLiveSession();
      };
    } catch {
      setStatusText(
        'Microfone não autorizado para stream contínuo. Use os botões de microfone em cada campo.'
      );
      stopLiveSession();
    }
  };

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  return (
    <div className="bg-[#111a2e] border border-amber-500/30 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isConnected
              ? 'bg-rose-500/20 border border-rose-400 text-rose-300 animate-pulse'
              : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
          }`}
        >
          {isConnected ? <Volume2 className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <span>Assistente de Voz em Tempo Real (Gemini Live)</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-amber-400 font-normal">
              Cada campo abaixo também possui seu próprio Microfone e botão "X"
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate">
            {lastTranscript || statusText}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={isConnected ? stopLiveSession : startLiveSession}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer self-start sm:self-auto ${
          isConnected
            ? 'bg-rose-500 text-white hover:bg-rose-600'
            : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
        }`}
      >
        {isConnected ? (
          <>
            <MicOff className="w-4 h-4" />
            Encerrar Conversa Live
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Conversar por Voz (Live)
          </>
        )}
      </button>
    </div>
  );
};
