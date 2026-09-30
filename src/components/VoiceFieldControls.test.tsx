import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startBrowserVoiceCapture,
  FieldVoiceAndClearBar,
  VoiceClearInput,
  LiveVoiceCopilotWidget,
} from './VoiceFieldControls';

describe('VoiceFieldControls - 100% Cobertura Total', () => {
  const win = window as unknown as Record<string, unknown>;
  let mockInstance: any;

  beforeEach(() => {
    mockInstance = {
      lang: '',
      interimResults: true,
      maxAlternatives: 0,
      onresult: null,
      onerror: null,
      onend: null,
      start: vi.fn(),
      stop: vi.fn(),
    };
    delete win.SpeechRecognition;
    delete win.webkitSpeechRecognition;
  });

  afterEach(() => {
    delete win.SpeechRecognition;
    delete win.webkitSpeechRecognition;
    vi.restoreAllMocks();
  });

  it('cobre 100% de startBrowserVoiceCapture', () => {
    const onTranscript = vi.fn();
    const onStatusChange = vi.fn();
    const stop1 = startBrowserVoiceCapture(onTranscript, onStatusChange);
    stop1();
    const stop2 = startBrowserVoiceCapture(onTranscript);
    stop2();

    win.SpeechRecognition = function () {
      throw new Error('Falha');
    };
    const stopErr = startBrowserVoiceCapture(onTranscript, onStatusChange);
    stopErr();

    delete win.SpeechRecognition;
    win.webkitSpeechRecognition = function () {
      return mockInstance;
    };
    const stopOk = startBrowserVoiceCapture(onTranscript, onStatusChange);
    mockInstance.onresult?.({ results: [[{ transcript: 'venda 250 reais' }]] });
    mockInstance.onresult?.({});
    mockInstance.onerror?.();
    mockInstance.onend?.();
    stopOk();
    mockInstance.stop.mockImplementationOnce(() => {
      throw new Error('erro stop');
    });
    stopOk();
    expect(onTranscript).toHaveBeenCalledWith('venda 250 reais');
  });

  it('cobre 100% de FieldVoiceAndClearBar (normal e compact)', () => {
    const onAddRecord = vi.fn();
    const onClearFieldValue = vi.fn();

    const { container, unmount } = render(
      <FieldVoiceAndClearBar
        field="vendas"
        period="diario"
        currentValue={500}
        todayISO="2026-09-29"
        onAddRecord={onAddRecord}
        onClearFieldValue={onClearFieldValue}
      />
    );

    fireEvent.click(container.firstElementChild!);
    fireEvent.click(screen.getByTitle(/Apagar \/ Excluir valor de Vendas/i));
    expect(onClearFieldValue).toHaveBeenCalledWith('vendas', 'diario');

    const micBtn = screen.getByTitle(/Falar valor para Vendas/i);
    fireEvent.click(micBtn);

    const input = screen.getByPlaceholderText(/Ex: Vendas 350 reais/i);
    const form = input.closest('form')!;
    fireEvent.submit(form);

    fireEvent.change(input, { target: { value: 'teste' } });
    fireEvent.click(screen.getByTitle('Limpar texto'));
    fireEvent.change(input, { target: { value: 'venda 350 reais' } });
    fireEvent.submit(form);
    expect(onAddRecord).toHaveBeenCalled();

    fireEvent.click(micBtn);
    fireEvent.click(screen.getByTitle('Fechar campo de voz'));
    unmount();

    win.SpeechRecognition = function () {
      return mockInstance;
    };
    render(
      <FieldVoiceAndClearBar
        field="pagar"
        period="mensal"
        currentValue={0}
        todayISO="2026-09-29"
        onAddRecord={onAddRecord}
        onClearFieldValue={onClearFieldValue}
        compact={true}
      />
    );
    const micCompact = screen.getByTitle(/Falar valor para A Pagar/i);
    fireEvent.click(micCompact);
    fireEvent.click(micCompact);
    fireEvent.click(micCompact);
    act(() => {
      mockInstance.onresult?.({ results: [[{ transcript: 'pagar 420 reais' }]] });
    });
  });

  it('cobre 100% de VoiceClearInput', () => {
    win.SpeechRecognition = function () {
      return mockInstance;
    };
    const onChange = vi.fn();
    const { rerender } = render(
      <VoiceClearInput
        label="Descrição"
        value="Inicial"
        onChange={onChange}
        placeholder="Digite"
      />
    );
    fireEvent.change(screen.getByPlaceholderText('Digite'), {
      target: { value: 'Novo' },
    });
    fireEvent.click(screen.getByTitle('Apagar / Excluir valor deste campo'));

    const micBtn = screen.getByTitle('Preencher este campo por voz');
    fireEvent.click(micBtn);
    fireEvent.click(micBtn);
    fireEvent.click(micBtn);
    act(() => {
      mockInstance.onresult?.({ results: [[{ transcript: 'Cliente' }]] });
    });

    rerender(
      <VoiceClearInput value="" onChange={onChange} type="number" numericOnly={true} />
    );
    const numMic = screen.getByTitle('Preencher este campo por voz');
    fireEvent.click(numMic);
    act(() => {
      mockInstance.onresult?.({ results: [[{ transcript: '199,90' }]] });
    });
    fireEvent.click(numMic);
    act(() => {
      mockInstance.onresult?.({ results: [[{ transcript: 'sem numero' }]] });
    });
  });

  it('cobre 100% de LiveVoiceCopilotWidget', () => {
    const onAddRecord = vi.fn();
    const onClearFieldValue = vi.fn();

    const { unmount } = render(
      <LiveVoiceCopilotWidget
        todayISO="2026-09-29"
        onAddRecord={onAddRecord}
        onClearFieldValue={onClearFieldValue}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Conversar por Voz/i }));
    unmount();

    win.SpeechRecognition = function () {
      return mockInstance;
    };
    render(
      <LiveVoiceCopilotWidget
        todayISO="2026-09-29"
        onAddRecord={onAddRecord}
        onClearFieldValue={onClearFieldValue}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Conversar por Voz/i }));
    fireEvent.click(screen.getByRole('button', { name: /Encerrar Conversa Live/i }));

    const frases = [
      'venda de 300 reais',
      'receber 450 reais',
      'pagar 180 reais',
      'apagar contas a pagar',
      'limpar contas a receber',
      'zerar vendas',
      'excluir tudo',
    ];
    for (const f of frases) {
      fireEvent.click(screen.getByRole('button', { name: /Conversar por Voz/i }));
      act(() => {
        mockInstance.onresult?.({ results: [[{ transcript: f }]] });
      });
    }
    expect(onAddRecord).toHaveBeenCalledTimes(3);
    expect(onClearFieldValue).toHaveBeenCalledTimes(4);
  });
});
