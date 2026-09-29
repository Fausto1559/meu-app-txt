import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ModuloFinanceiro from './ModuloFinanceiro';
import { supabase } from '../supabaseClient';

// Mock do Supabase
vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ error: null })
  }
}));

// Mock do window.alert para evitar erro do JSDOM
const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

describe('ModuloFinanceiro.jsx - Cobertura Total (100%)', () => {
  // Configuração de datas dinâmicas para passar pelos filtros exatos do componente
  const dataHojeObj = new Date();
  const hojeStr = dataHojeObj.toISOString().split('T')[0];

  const dataSemanaObj = new Date();
  dataSemanaObj.setDate(dataSemanaObj.getDate() + 3);
  const semanaStr = dataSemanaObj.toISOString().split('T')[0];

  const dataForaObj = new Date();
  dataForaObj.setMonth(dataForaObj.getMonth() + 2);
  const foraDoMesStr = dataForaObj.toISOString().split('T')[0];

  const mockTransacoes = [
    { 
      id: 1, tipo: 'venda', subcategoria: 'venda_direta', 
      entidade_nome: 'Cliente Hoje', valor: 150, data_vencimento: hojeStr, status: 'recebido' 
    },
    { 
      id: 2, tipo: 'receber', subcategoria: 'fiado_cliente', 
      entidade_nome: 'Cliente Semana', valor: 50, data_vencimento: semanaStr, status: 'a_vencer' 
    },
    { 
      id: 3, tipo: 'pagar', subcategoria: 'fornecedor_prazo', 
      entidade_nome: 'Fornecedor Futuro', valor: 200, data_vencimento: foraDoMesStr, status: 'pendente' 
    },
    { 
      id: 4, tipo: 'venda', subcategoria: null, // Testa o fallback de subcategoria null
      entidade_nome: 'Venda Sem Sub', valor: 10, data_emissao: hojeStr, status: 'pago' 
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    supabase.from().order.mockResolvedValue({ data: mockTransacoes, error: null });
  });

  afterEach(() => {
    mockAlert.mockClear();
  });

  it('1. Deve renderizar e carregar as transações iniciais (Filtro: Dia)', async () => {
    render(<ModuloFinanceiro userEmail="teste@copiloto.com" />);
    
    // Aguarda o carregamento e verifica renderização do item de hoje
    await waitFor(() => {
      expect(screen.getByText('Cliente Hoje')).toBeInTheDocument();
    });
    
    // Item do mês futuro não deve aparecer no filtro diário
    expect(screen.queryByText('Fornecedor Futuro')).not.toBeInTheDocument();
  });

  it('2. Deve alternar entre os filtros de período (Semana e Mês)', async () => {
    render(<ModuloFinanceiro />);
    await waitFor(() => expect(screen.getByText('Cliente Hoje')).toBeInTheDocument());

    // Clica em "Esta Semana"
    fireEvent.click(screen.getByText('Esta Semana'));
    expect(screen.getByText('Cliente Semana')).toBeInTheDocument();

    // Clica em "Este Mês"
    fireEvent.click(screen.getByText('Este Mês'));
    expect(screen.getByText('Cliente Hoje')).toBeInTheDocument();
    
    // Verifica cobertura de estado vazio na tabela mockando array vazio
    supabase.from().order.mockResolvedValueOnce({ data: [], error: null });
    render(<ModuloFinanceiro />);
    await waitFor(() => {
      expect(screen.getByText('Nenhum registro encontrado para este período.')).toBeInTheDocument();
    });
  });

  it('3. Deve validar bloqueio de envio com campos vazios (Campos obrigatórios)', async () => {
    render(<ModuloFinanceiro />);

    // Aguarda o carregamento inicial (setTransacoes/setLoading) dentro do act
    await waitFor(() => {
      expect(screen.getByText('Cliente Hoje')).toBeInTheDocument();
    });

    const btnSalvar = screen.getByText('Salvar Lançamento');
    
    fireEvent.click(btnSalvar); // Tenta salvar sem preencher Valor e Nome
    expect(mockAlert).toHaveBeenCalledWith('Preencha os campos obrigatórios!');
  });

  it('4. Deve interagir com formulário e salvar uma nova Venda Direta com sucesso', async () => {
    render(<ModuloFinanceiro />);
    
    // Altera o tipo para Venda
    const selectTipo = screen.getByLabelText(/Tipo de Operação/i);
    fireEvent.change(selectTipo, { target: { value: 'venda' } });

    // Preenche dados
    fireEvent.change(screen.getByLabelText(/Nome do Cliente/i), { target: { value: 'João Silva' } });
    fireEvent.change(screen.getByLabelText(/Valor/i), { target: { value: '100.50' } });
    fireEvent.change(screen.getByLabelText(/Data de Vencimento/i), { target: { value: hojeStr } });
    fireEvent.change(screen.getByLabelText(/Descrição/i), { target: { value: 'Toldo' } });

    // Envia form
    fireEvent.click(screen.getByText('Salvar Lançamento'));

    await waitFor(() => {
      expect(supabase.from().insert).toHaveBeenCalledWith([{
        user_email: 'usuario@copiloto.com', // Fallback de email
        tipo: 'venda',
        subcategoria: 'venda_direta',
        entidade_nome: 'João Silva',
        descricao: 'Toldo',
        valor: 100.5,
        data_vencimento: hojeStr,
        forma_pagamento: 'PIX',
        status: 'recebido'
      }]);
      expect(mockAlert).toHaveBeenCalledWith('Lançamento registrado com sucesso!');
    });
  });

  it('5. Deve alterar campos do formulário para Contas a Pagar e testar subcategorias', async () => {
    render(<ModuloFinanceiro userEmail="admin@copiloto.com" />);
    
    const selectTipo = screen.getByLabelText(/Tipo de Operação/i);
    
    // Muda para "A Pagar" -> deve revelar seleção de Categoria da Despesa
    fireEvent.change(selectTipo, { target: { value: 'pagar' } });
    const selectCat = await screen.findByLabelText(/Categoria da Despesa/i);
    
    // Altera subcategoria
    fireEvent.change(selectCat, { target: { value: 'despesa_fixa' } });
    
    // Preenche para salvar uma despesa
    fireEvent.change(screen.getByLabelText(/Nome do Fornecedor/i), { target: { value: 'Energisa' } });
    fireEvent.change(screen.getByLabelText(/Valor/i), { target: { value: '250' } });

    fireEvent.click(screen.getByText('Salvar Lançamento'));

    await waitFor(() => {
      expect(supabase.from().insert).toHaveBeenCalledWith([expect.objectContaining({
        tipo: 'pagar',
        subcategoria: 'despesa_fixa',
        entidade_nome: 'Energisa',
        status: 'a_vencer'
      })]);
    });

    // Cobre a ramificação 'receber' no onChange
    fireEvent.change(selectTipo, { target: { value: 'receber' } });
    expect(screen.queryByLabelText(/Categoria da Despesa/i)).not.toBeInTheDocument();
  });

  it('6. Deve tratar erro de inserção vindo do Supabase', async () => {
    // Configura o mock do insert para forçar um erro
    supabase.from().insert.mockResolvedValueOnce({ error: { message: 'Erro interno DB' } });
    
    render(<ModuloFinanceiro />);
    
    fireEvent.change(screen.getByLabelText(/Nome do Cliente/i), { target: { value: 'Erro Teste' } });
    fireEvent.change(screen.getByLabelText(/Valor/i), { target: { value: '50' } });
    
    fireEvent.click(screen.getByText('Salvar Lançamento'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Erro ao salvar: Erro interno DB');
    });
  });

  it('7. Cobre fallback de API vazia (error data do select)', async () => {
    // Força erro no select para cobrir `if (!error && data)` falso
    supabase.from().order.mockResolvedValueOnce({ data: null, error: { message: 'Failed' } });
    render(<ModuloFinanceiro />);
    
    // A tabela deve renderizar o aviso de vazio por não ter carregado nada
    await waitFor(() => {
      expect(screen.getByText('Nenhum registro encontrado para este período.')).toBeInTheDocument();
    });
  });

  it('8. Soma os totais com lançamentos a pagar e fiado no dia', async () => {
    supabase.from().order.mockResolvedValue({
      data: [
        { id: 5, tipo: 'pagar', subcategoria: 'fornecedor_prazo', entidade_nome: 'Fornecedor Hoje', valor: 300, data_vencimento: hojeStr, status: 'pendente' },
        { id: 6, tipo: 'receber', subcategoria: 'fiado_cliente', entidade_nome: 'Fiado Hoje', valor: 80, data_vencimento: hojeStr, status: 'a_vencer' },
      ],
      error: null,
    });

    const { container, unmount } = render(<ModuloFinanceiro />);

    await waitFor(() => {
      expect(screen.getByText('Fornecedor Hoje')).toBeInTheDocument();
    });
    expect(screen.getByText('Fiado Hoje')).toBeInTheDocument();

    // Dispara o onChange do campo de data de vencimento
    const campoData = container.querySelector('#data-vencimento');
    fireEvent.change(campoData, { target: { value: '2026-10-01' } });
    expect(campoData.value).toBe('2026-10-01');

    unmount();

    // Mesmo mês, ano diferente: o filtro "Este Mês" precisa excluir
    supabase.from().order.mockResolvedValue({
      data: [
        { id: 7, tipo: 'venda', subcategoria: 'venda_direta', entidade_nome: 'Venda Ano Passado', valor: 999, data_vencimento: '2025-09-10', status: 'recebido' },
      ],
      error: null,
    });

    render(<ModuloFinanceiro />);
    fireEvent.click(screen.getByText('Este Mês'));

    await waitFor(() => {
      expect(
        screen.getByText('Nenhum registro encontrado para este período.')
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Venda Ano Passado')).not.toBeInTheDocument();
  });
});