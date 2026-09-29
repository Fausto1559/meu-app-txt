// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CentralContador } from './CentralContador';

// Reconhecimento de voz falso: start() dispara onstart e guarda as instâncias
// para que o teste simule o resultado da fala (como o navegador faria).
class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = [];
  lang = '';
  interimResults = false;
  maxAlternatives = 1;
  onstart: () => void = () => {};
  onresult: (event: any) => void = () => {};
  onerror: () => void = () => {};
  onend: () => void = () => {};
  start = vi.fn(function (this: FakeSpeechRecognition) {
    this.onstart();
  });

  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }
}

const seedFechamentos = () => {
  localStorage.setItem(
    'copiloto_fechamentos',
    JSON.stringify([
      {
        data: '2026-09-20T10:00:00.000Z',
        entradasDinheiro: '1.500,00',
        pixValue: '200,00',
        debitoValue: '100,00',
        credito3xValue: '300,00',
        credito12xValue: '1.200,00',
        boletosValue: '50,00',
        saidasValue: '75,00',
        saldoFinalEsperado: 3275,
      },
      // Registro mínimo: exercita os fallbacks '0,00' da tabela e o parseNum
      // com campos ausentes
      { data: '2026-09-21T09:00:00.000Z' },
      // Registro corrompido: valor não numérico cai no '|| 0' do parseNum
      // e do parseNumTable (coluna Cartões)
      { data: '2026-09-22T08:00:00.000Z', debitoValue: 'corrompido' },
    ])
  );
};

describe('CentralContador - Cobertura Total de Relatórios', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'open').mockImplementation(() => null as any);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    localStorage.removeItem('copiloto_fechamentos');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  it('carrega os fechamentos salvos, calcula o resumo e monta a tabela', () => {
    seedFechamentos();
    render(<CentralContador />);

    // Totais: 1500 + 200 + 100 + 300 + 1200 + 50 = 3350
    expect(screen.getByDisplayValue('3.350,00')).toBeInTheDocument();
    // Taxas: 100*1,99% + 300*4,99% + 1200*12,99% = 172,84
    expect(screen.getByDisplayValue('172,84')).toBeInTheDocument();
    expect(screen.getByDisplayValue('75,00')).toBeInTheDocument();

    expect(
      screen.getByText(/Faturamento Bruto: R\$ 3\.350,00/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Taxas de Cartão: R\$ 172,84/)).toBeInTheDocument();

    // Tabela de histórico
    expect(screen.getByText('2026-09-20T10:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 1.600,00')).toBeInTheDocument(); // 100+300+1200
  });

  it('mostra o estado vazio quando não há fechamentos salvos', () => {
    render(<CentralContador />);

    expect(
      screen.getByText(/Nenhum fechamento diário finalizado ainda/)
    ).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('0,00')).toHaveLength(3);
  });

  it('formata a digitação manual como moeda nos três campos', () => {
    render(<CentralContador />);

    // Captura os três inputs (faturamento, taxas, despesas) na ordem do documento
    const campos = screen.getAllByDisplayValue('0,00');
    const digitar = (valor: string, indice: number) =>
      fireEvent.change(campos[indice], { target: { value: valor } });

    // Com dígitos: divide por 100 e formata como moeda
    digitar('12345', 0);
    digitar('2500', 1);
    digitar('999', 2);

    expect(screen.getByDisplayValue('123,45')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25,00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('9,99')).toBeInTheDocument();

    // Sem dígitos: volta para '0,00'
    digitar('abc', 0);
    digitar('abc', 1);
    digitar('abc', 2);
    expect(screen.getAllByDisplayValue('0,00')).toHaveLength(3);
  });

  it('alerta quando o navegador não suporta reconhecimento de voz', () => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    render(<CentralContador />);

    fireEvent.click(screen.getAllByTitle('Ditar valor por voz')[0]);

    expect(window.alert).toHaveBeenCalledWith(
      'Seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome.'
    );
  });

  it('dita valores por voz cobrindo "mil", valor simples e texto sem número', async () => {
    (window as any).SpeechRecognition = FakeSpeechRecognition;
    (window as any).webkitSpeechRecognition = FakeSpeechRecognition;

    render(<CentralContador />);

    const mics = screen.getAllByTitle('Ditar valor por voz');

    // Faturamento: "10 mil 500" -> 10 * 1000 + 500
    fireEvent.click(mics[0]);
    expect(screen.getByText('Ouvindo...')).toBeInTheDocument();
    await act(async () => {
      FakeSpeechRecognition.instances[0].onresult({
        results: [[{ transcript: '10 mil 500' }]],
      });
    });
    expect(screen.getByDisplayValue('10.500,00')).toBeInTheDocument();
    expect(screen.queryByText('Ouvindo...')).not.toBeInTheDocument();

    // Taxas: "cem mil" -> sem dígitos antes do "mil", multiplicador = 1
    fireEvent.click(mics[1]);
    await act(async () => {
      FakeSpeechRecognition.instances[1].onresult({
        results: [[{ transcript: 'cem mil' }]],
      });
    });
    expect(screen.getByDisplayValue('1.000,00')).toBeInTheDocument();

    // Despesas: "599,50" -> 59950 / 100
    fireEvent.click(mics[2]);
    await act(async () => {
      FakeSpeechRecognition.instances[2].onresult({
        results: [[{ transcript: '599,50' }]],
      });
    });
    expect(screen.getByDisplayValue('599,50')).toBeInTheDocument();

    // Texto sem nenhum dígito -> "0,00"
    await act(async () => {
      FakeSpeechRecognition.instances[2].onresult({
        results: [[{ transcript: 'nada de números aqui' }]],
      });
    });
    expect(screen.getByDisplayValue('0,00')).toBeInTheDocument();

    // onerror e onend encerram o estado "Ouvindo..."
    fireEvent.click(mics[0]);
    expect(screen.getByText('Ouvindo...')).toBeInTheDocument();
    await act(async () => {
      FakeSpeechRecognition.instances[3].onerror();
    });
    expect(screen.queryByText('Ouvindo...')).not.toBeInTheDocument();

    fireEvent.click(mics[0]);
    await act(async () => {
      FakeSpeechRecognition.instances[4].onend();
    });
    expect(screen.queryByText('Ouvindo...')).not.toBeInTheDocument();
  });

  it('copia a mensagem do contador e abre o WhatsApp', () => {
    seedFechamentos();
    render(<CentralContador />);

    fireEvent.click(screen.getByRole('button', { name: /copiar mensagem/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Faturamento Bruto: R$ 3.350,00')
    );
    expect(window.alert).toHaveBeenCalledWith(
      'Mensagem copiada para a área de transferência!'
    );

    fireEvent.click(
      screen.getByRole('button', { name: /enviar por whatsapp/i })
    );

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/?text='),
      '_blank'
    );
  });

  it('limpa o histórico quando confirmado e mantém quando cancelado', () => {
    seedFechamentos();
    render(<CentralContador />);

    fireEvent.click(screen.getByRole('button', { name: /limpar histórico/i }));

    expect(window.confirm).toHaveBeenCalledWith(
      'Deseja realmente limpar todos os fechamentos salvos?'
    );
    expect(localStorage.getItem('copiloto_fechamentos')).toBeNull();
    expect(screen.getAllByDisplayValue('0,00')).toHaveLength(3);
    expect(
      screen.getByText(/Nenhum fechamento diário finalizado ainda/)
    ).toBeInTheDocument();

    // Confirmação negativa: nada é apagado
    seedFechamentos();
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    fireEvent.click(screen.getByRole('button', { name: /limpar histórico/i }));

    expect(JSON.parse(localStorage.getItem('copiloto_fechamentos')!)).toHaveLength(3);
  });
});
