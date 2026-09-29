// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Painel from './Painel';

// Mock controlável: start() não dispara nada; o teste simula onresult/onerror/onend
// com as falas que quiser, como o navegador faria.
class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = [];
  lang = '';
  onresult: (event: any) => void = () => {};
  onerror: () => void = () => {};
  onend: () => void = () => {};
  start = vi.fn(() => {});

  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }
}

// Os dois botões de microfone são os únicos com o ícone lucide-mic
const micButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('button')).filter((b) =>
    b.querySelector('svg.lucide-mic')
  );

const ditar = (
  container: HTMLElement,
  mic: 0 | 1,
  transcript: string,
  evento: 'onresult' | 'onerror' | 'onend' = 'onresult'
) => {
  const antes = FakeSpeechRecognition.instances.length;
  fireEvent.click(micButtons(container)[mic]);
  const instancia = FakeSpeechRecognition.instances[antes];
  act(() => {
    if (evento === 'onresult') {
      instancia.onresult({ results: [[{ transcript }]] });
    } else {
      instancia[evento]();
    }
  });
  return instancia;
};

describe('Painel Screen - Cobertura Total', () => {
  beforeEach(() => {
    (window as any).SpeechRecognition = FakeSpeechRecognition;
    (window as any).webkitSpeechRecognition = FakeSpeechRecognition;
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  it('renderiza os cards de resumo com os valores informados', () => {
    render(<Painel setActiveTab={vi.fn()} vendasHoje={100} />);

    expect(screen.getByText('R$ 100,00')).toBeInTheDocument(); // Vendas Hoje
    // A Receber, A Pagar e Saldo aparecem nos cards do resumo E nos blocos de contas
    expect(screen.getAllByText('R$ 0,00')).toHaveLength(5);
    expect(screen.getByText('Nenhuma maquininha conectada')).toBeInTheDocument();
  });

  it('dita valores para A Receber e A Pagar (com e sem números)', () => {
    const { container } = render(<Painel setActiveTab={vi.fn()} />);

    // A Receber: extrai o primeiro número da fala
    ditar(container, 0, 'Receber da Padaria R$ 100,50');
    expect(
      screen.getByDisplayValue('Receber da Padaria R$ 100,50')
    ).toBeInTheDocument();

    // A Pagar
    ditar(container, 1, 'Pagar energia R$ 150');
    expect(screen.getByDisplayValue('Pagar energia R$ 150')).toBeInTheDocument();

    // Falas sem números: criam o item mas não alteram os totais
    ditar(container, 0, 'sem números aqui');
    ditar(container, 1, 'anotação sem valor');
    expect(
      screen.getByDisplayValue('anotação sem valor')
    ).toBeInTheDocument();

    // Cada total aparece 2x (card do resumo + bloco de contas)
    expect(screen.getAllByText('R$ 100,50')).toHaveLength(2); // A Receber
    expect(screen.getAllByText('R$ 150,00')).toHaveLength(2); // A Pagar
    expect(screen.getAllByText('R$ -49,50')).toHaveLength(1); // Saldo previsto (só no resumo)

    // onerror e onend encerram a escuta sem efeitos colaterais
    ditar(container, 0, '', 'onerror');
    ditar(container, 1, '', 'onend');
  });

  it('permite editar e remover itens, recalculando os totais', () => {
    const { container } = render(<Painel setActiveTab={vi.fn()} />);

    ditar(container, 0, 'Receber da Padaria R$ 100,50');
    ditar(container, 1, 'Pagar energia R$ 150');

    // Edita A Receber com número: 100,50 -> 200
    fireEvent.change(screen.getByDisplayValue('Receber da Padaria R$ 100,50'), {
      target: { value: 'Receber 200' },
    });
    expect(screen.getAllByText('R$ 200,00')).toHaveLength(2);

    // Edita A Receber sem número: total vai a zero (fallback do reduce)
    fireEvent.change(screen.getByDisplayValue('Receber 200'), {
      target: { value: 'ajuste sem valor' },
    });
    // 0,00: A Receber (resumo + contas) e Vendas Hoje (A Pagar segue em 150,00)
    expect(screen.getAllByText('R$ 0,00')).toHaveLength(3);

    // Edita A Pagar com número: 150 -> 80,50
    fireEvent.change(screen.getByDisplayValue('Pagar energia R$ 150'), {
      target: { value: 'Pagar água 80,50' },
    });
    expect(screen.getAllByText('R$ 80,50')).toHaveLength(2);

    // Edita A Pagar sem número: total vai a zero
    fireEvent.change(screen.getByDisplayValue('Pagar água 80,50'), {
      target: { value: 'água sem valor' },
    });
    // 0,00: A Receber ×2, A Pagar ×2, Saldo e Vendas Hoje
    expect(screen.getAllByText('R$ 0,00')).toHaveLength(6);

    // Novos itens via voz em ambas as listas
    ditar(container, 0, 'Cliente X R$ 50');
    // A Receber ×2 + Saldo previsto (50 - 0)
    expect(screen.getAllByText('R$ 50,00')).toHaveLength(3);
    ditar(container, 1, 'Mercado R$ 20');
    expect(screen.getAllByText('R$ 20,00')).toHaveLength(2);

    // ✕: [Cliente X, ajuste sem valor, Mercado, água sem valor]
    const cancelar = () => screen.getAllByTitle('Apagar este item');

    // Remove o item SEM número de A Receber (subtração ignorada)
    fireEvent.click(cancelar()[1]);
    expect(screen.getAllByText('R$ 50,00')).toHaveLength(2);

    // Remove o item COM número de A Receber (subtrai 50)
    fireEvent.click(cancelar()[0]);
    expect(
      screen.getByText(/Diga ex: "Receber da Padaria/)
    ).toBeInTheDocument();
    // 0,00: A Receber ×2 e Vendas Hoje (A Pagar segue em 20,00)
    expect(screen.getAllByText('R$ 0,00')).toHaveLength(3);

    // Remove o item COM número de A Pagar (subtrai 20)
    fireEvent.click(cancelar()[0]);
    expect(screen.getAllByText('R$ 0,00')).toHaveLength(6);

    // Remove o item SEM número de A Pagar (subtração ignorada)
    fireEvent.click(cancelar()[0]);
    expect(screen.getAllByText('R$ 0,00')).toHaveLength(6);
    expect(screen.getByText(/Diga ex: "Pagar energia/)).toBeInTheDocument();
  });

  it('navega para Open Finance pelo banner', () => {
    const setActiveTab = vi.fn();
    render(<Painel setActiveTab={setActiveTab} />);

    fireEvent.click(screen.getByRole('button', { name: /conectar maquininhas/i }));

    expect(setActiveTab).toHaveBeenCalledWith('OpenFinance');
  });

  it('valida fallback quando o navegador não suporta voz', () => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    const { container } = render(<Painel setActiveTab={vi.fn()} />);

    const mics = Array.from(container.querySelectorAll('button')).filter(
      (b) => b.querySelector('svg.lucide-mic')
    );
    expect(mics).toHaveLength(2);

    fireEvent.click(mics[0]);

    expect(window.alert).toHaveBeenCalledWith(
      'Navegador sem suporte a reconhecimento de voz.'
    );
  });
});
