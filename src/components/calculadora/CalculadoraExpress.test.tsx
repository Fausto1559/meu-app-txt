// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CalculadoraExpress from './CalculadoraExpress';

// Reconhecimento de voz falso: o teste controla o que a "fala" retorna
class FakeSpeechRecognition {
  static instances: FakeSpeechRecognition[] = [];
  lang = '';
  onresult: (event: any) => void = () => {};
  start = vi.fn(() => {});

  constructor() {
    FakeSpeechRecognition.instances.push(this);
  }
}

const micButtons = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('button')).filter((b) =>
    b.querySelector('svg.lucide-mic')
  );

const renderAberta = (props = {}) =>
  render(<CalculadoraExpress isOpen onClose={vi.fn()} {...props} />);

describe('CalculadoraExpress - Cobertura Total de Cálculos', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.removeItem('copiloto_taxas_personalizadas');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete (window as any).webkitSpeechRecognition;
  });

  it('não renderiza nada quando está fechada', () => {
    const { container } = render(
      <CalculadoraExpress isOpen={false} onClose={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('alerta quando o navegador não suporta voz', () => {
    const { container } = renderAberta();

    const mics = micButtons(container);
    expect(mics).toHaveLength(2);

    fireEvent.click(mics[0]);
    fireEvent.click(mics[1]); // microfone do custo

    expect(window.alert).toHaveBeenCalledWith(
      'Reconhecimento de voz não suportado neste navegador.'
    );
    expect(window.alert).toHaveBeenCalledTimes(2);
  });

  it('preenche o preço pela voz limpando tudo que não é número', () => {
    (window as any).webkitSpeechRecognition = FakeSpeechRecognition;
    const { container } = renderAberta();

    fireEvent.click(micButtons(container)[0]);
    act(() => {
      FakeSpeechRecognition.instances[0].onresult({
        results: [[{ transcript: '1000,50' }]],
      });
    });

    expect(screen.getByDisplayValue('1000.50')).toBeInTheDocument();
  });

  it('calcula taxa, valor líquido, lucro e margem para cada forma de pagamento', () => {
    renderAberta();

    const [campoPreco, campoCusto] = screen.getAllByPlaceholderText('0,00');
    fireEvent.change(campoPreco, { target: { value: '1000,50' } });
    fireEvent.change(campoCusto, { target: { value: '200' } });

    // Clica no Pix explicitamente (é o padrão, mas o botão precisa ser exercido)
    fireEvent.click(screen.getByRole('button', { name: /^pix/i }));

    // Pix: 1000,50 * 0,99% = 9,90
    expect(screen.getByText('- R$ 9.90')).toBeInTheDocument();
    expect(screen.getByText('R$ 990.60')).toBeInTheDocument();
    expect(screen.getByText(/R\$ 790\.60 \(79\.0%\)/)).toBeInTheDocument();

    // Débito: 1,99%
    fireEvent.click(screen.getByRole('button', { name: /débito/i }));
    expect(screen.getByText('- R$ 19.91')).toBeInTheDocument();

    // Crédito à vista: 3,49%
    fireEvent.click(screen.getByRole('button', { name: /créd\. à vista/i }));
    expect(screen.getByText('- R$ 34.92')).toBeInTheDocument();

    // Parcelado 3x: abre o seletor de parcelas e usa a taxa da 2x (5,29%)
    fireEvent.click(
      screen.getByRole('button', { name: /parcelado \(até 3x\)/i })
    );
    expect(
      screen.getByText(/Selecione o número de parcelas/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^2x/ }));
    expect(screen.getByText('- R$ 52.93')).toBeInTheDocument();

    // Parcelado 12x: 12 parcelas disponíveis; seleciona a 5x (7,99%)
    fireEvent.click(
      screen.getByRole('button', { name: /parcelado \(até 12x\)/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /^5x/ }));
    expect(screen.getByText('- R$ 79.94')).toBeInTheDocument();
  });

  it('ajusta as taxas personalizadas, persiste no localStorage e fecha os ajustes', () => {
    renderAberta();

    fireEvent.click(screen.getByTitle('Configurar Taxas'));
    expect(screen.getByText('Ajustar Taxas (%)')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('0.99'), {
      target: { value: '2.5' },
    });
    fireEvent.change(screen.getByDisplayValue('1.99'), {
      target: { value: '2.2' },
    });
    fireEvent.change(screen.getByDisplayValue('3.49'), {
      target: { value: '3.8' },
    });
    fireEvent.change(screen.getByDisplayValue('4.49'), {
      target: { value: '5.5' },
    });

    const salvas = JSON.parse(
      localStorage.getItem('copiloto_taxas_personalizadas')!
    );
    expect(salvas.pix).toBe(2.5);
    expect(salvas.debito).toBe(2.2);
    expect(salvas.credito_vista).toBe(3.8);
    expect(salvas.parc_1).toBe(5.5);

    // Valor não numérico no campo de taxa cai no '|| 0'
    fireEvent.change(screen.getByDisplayValue('2.5'), { target: { value: '' } });
    fireEvent.change(screen.getByDisplayValue('2.2'), { target: { value: '' } });
    fireEvent.change(screen.getByDisplayValue('3.8'), { target: { value: '' } });
    fireEvent.change(screen.getByDisplayValue('5.5'), { target: { value: '' } });
    expect(
      JSON.parse(localStorage.getItem('copiloto_taxas_personalizadas')!)
    ).toMatchObject({ pix: 0, debito: 0, credito_vista: 0, parc_1: 0 });

    fireEvent.click(screen.getByRole('button', { name: /fechar ajustes/i }));
    expect(screen.queryByText('Ajustar Taxas (%)')).not.toBeInTheDocument();
  });

  it('usa 0% quando as taxas não estão salvas no localStorage', () => {
    localStorage.setItem(
      'copiloto_taxas_personalizadas',
      JSON.stringify({})
    );
    renderAberta();

    const [campoPreco] = screen.getAllByPlaceholderText('0,00');
    fireEvent.change(campoPreco, { target: { value: '1000' } });

    // Pix sem taxa salva -> 0%
    expect(screen.getByText('- R$ 0.00')).toBeInTheDocument();

    // Débito e Crédito também sem taxa salva -> 0%
    fireEvent.click(screen.getByRole('button', { name: /débito/i }));
    expect(screen.getByText('- R$ 0.00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /créd\. à vista/i }));
    expect(screen.getByText('- R$ 0.00')).toBeInTheDocument();

    // Parcelado sem taxa salva -> 0%
    fireEvent.click(
      screen.getByRole('button', { name: /parcelado \(até 3x\)/i })
    );
    expect(screen.getByText('- R$ 0.00')).toBeInTheDocument();
  });

  it('usa as taxas padrão quando o localStorage está corrompido', () => {
    localStorage.setItem('copiloto_taxas_personalizadas', '{inválido');

    renderAberta();

    expect(screen.getByText('0.99%')).toBeInTheDocument(); // Pix padrão
  });

  it('salva a venda com os dados calculados e fecha o modal', () => {
    const onSaveSale = vi.fn();
    const onClose = vi.fn();
    renderAberta({ onSaveSale, onClose });

    const [campoPreco, campoCusto] = screen.getAllByPlaceholderText('0,00');
    fireEvent.change(campoPreco, { target: { value: '500' } });
    fireEvent.change(campoCusto, { target: { value: '100' } });

    fireEvent.click(
      screen.getByRole('button', { name: /confirmar e salvar venda/i })
    );

    expect(onSaveSale).toHaveBeenCalledWith(
      expect.objectContaining({
        precoVenda: 500,
        custoProduto: 100,
        formaPagamento: 'pix',
        parcelas: 1,
        taxaPercent: 0.99,
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fecha o modal sem salvar quando o preço está vazio', () => {
    const onSaveSale = vi.fn();
    const onClose = vi.fn();
    renderAberta({ onSaveSale, onClose });

    fireEvent.click(
      screen.getByRole('button', { name: /confirmar e salvar venda/i })
    );

    expect(onSaveSale).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('permite fechar pelo botão ✕ do cabeçalho', () => {
    const onClose = vi.fn();
    const { container } = renderAberta({ onClose });

    const fechar = Array.from(container.querySelectorAll('button')).find(
      (b) => b.querySelector('svg.lucide-x')
    );
    fireEvent.click(fechar!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
