import React, { useRef, useState } from 'react';
import { Mic, MicOff, Radio, Volume2, X } from 'lucide-react';
import {
  FinancialRecord,
  ReportPeriod,
  TransactionType,
} from '../types/finance';
import {
  FIELD_LABELS,
  formatBRL,
  parsePortugueseVoiceCommand,
  PERIOD_LABELS,
} from '../utils/financeUtils';

export function startBrowserVoiceCapture(
  onTranscript: (text: string) => void,
  onStatusChange?: (listening: boolean, error?: string) => void
): () => void {
  const win = window as unknown as Record<string, unknown>;
  const SpeechRecognitionAPI =
    win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    onStatusChange?.(
      false,
      'Reconhecimento nativo indisponível neste navegador. Use o campo rápido de voz.'
    );
    return () => {};
  }

  try {
    const recognition = new (SpeechRecognitionAPI as any)();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    onStatusChange?.(true);

    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript || '';
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
        // ignore stop errors
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
    <div
      onClick={(e) => e.stopPropagation()}
      className="inline-flex flex-col items-end gap-1.5"
    >
      <div className="inline-flex items-center gap-1.5">
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
            title="Fechar campo de voz"
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
  const stopRef = useRef<(() => void) | null>(null);

  const stopLiveSession = () => {
    stopRef.current?.();
    stopRef.current = null;
    setIsConnected(false);
    setStatusText('Sessão de voz encerrada.');
  };

  const handleVoiceCommand = (transcript: string) => {
    const lower = transcript.toLowerCase();
    if (
      lower.includes('apaga') ||
      lower.includes('limpa') ||
      lower.includes('zera') ||
      lower.includes('exclu')
    ) {
      const targetField: TransactionType | 'todos' = lower.includes('pagar')
        ? 'pagar'
        : lower.includes('receber')
        ? 'receber'
        : lower.includes('venda')
        ? 'vendas'
        : 'todos';
      onClearFieldValue(targetField, 'diario');
      setStatusText(`Valor de ${targetField} apagado por comando de voz!`);
      return;
    }

    const defaultField: TransactionType = lower.includes('pagar')
      ? 'pagar'
      : lower.includes('receber')
      ? 'receber'
      : 'vendas';
    const parsed = parsePortugueseVoiceCommand(
      transcript,
      defaultField,
      todayISO
    );
    onAddRecord(parsed);
    setStatusText(
      `Lançado por voz em ${FIELD_LABELS[parsed.type]}: ${formatBRL(parsed.grossAmount)}`
    );
  };

  const startLiveSession = () => {
    stopRef.current = startBrowserVoiceCapture(
      (transcript) => {
        handleVoiceCommand(transcript);
      },
      (listening, err) => {
        setIsConnected(listening);
        if (err) {
          setStatusText(err);
        } else if (listening) {
          setStatusText(
            'Ouvindo! Fale por exemplo: "Venda de 300 reais" ou "Apagar Contas a Pagar".'
          );
        }
      }
    );
  };

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
          {isConnected ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <Radio className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <span>Assistente de Voz em Tempo Real (Gemini Live)</span>
            <span aria-hidden="true" className="text-slate-500">
              ·
            </span>
            <span className="text-amber-400 font-normal">
              Cada campo abaixo também possui seu próprio Microfone e botão "X"
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate">{statusText}</p>
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
