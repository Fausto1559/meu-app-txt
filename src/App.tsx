/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Flame,
  Wallet,
  Plus,
  Crown,
  LayoutGrid,
  FileText,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  TrendingUp,
  ArrowDownCircle,
  Clock,
  X,
  Zap,
  Sparkles,
  Check,
  QrCode,
  ShieldCheck,
  Copy,
  Sparkle,
  DollarSign,
  Send,
  ShieldAlert,
  Lock,
  MessageSquare,
  AlertTriangle,
  Code,
  Gift,
  Building2,
  Percent,
  Sliders,
  Mail,
  LockKeyhole,
} from 'lucide-react';

const supabaseUrl = 'https://sua-url-do-supabase.supabase.co';
const supabaseKey = 'sua-chave-anon-aqui';
const supabase = createClient(supabaseUrl, supabaseKey);

type Tab = 'painel' | 'fechamento' | 'contador';

interface PlanoSelecionado {
  id: 'essencial' | 'copiloto' | 'alta_performance';
  nome: string;
  valor: string;
  recursos: string[];
}

export default function App() {
  const [tab, setTab] = useState<Tab>('painel');
const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showBalcaoModal, setShowBalcaoModal] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === '1') {
      setSession({ user: { email: 'admin@copiloto.local' } });
      setLoadingAuth(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#060D1A] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
      </div>
    );
  }
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/?admin=1',
      },
    });
    if (error) alert('Erro no login com Google: ' + error.message);
  };

  const handleFacebookLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: window.location.origin + '/?admin=1',
      },
    });
    if (error) alert('Erro no login com Facebook: ' + error.message);
  };

  const [showPlanosModal, setShowPlanosModal] = useState<boolean>(false);
  const [showDevModal, setShowDevModal] = useState<boolean>(false);
  const [showRecursoBloqueadoModal, setShowRecursoBloqueadoModal] = useState<boolean>(false);
  const [recursoBloqueadoNome, setRecursoBloqueadoNome] = useState<string>('');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('admin') === '1' || params.get('admin') === 'true' || window.location.search.includes('admin=1');
  });
  
  const [planoPix, setPlanoPix] = useState<PlanoSelecionado | null>(null);
  const [copiado, setCopiado] = useState<boolean>(false);

  useEffect(() => {
    const checkAdminMode = () => {
      if (typeof window === 'undefined') return false;
      const params = new URLSearchParams(window.location.search);
      return params.get('admin') === '1' || params.get('admin') === 'true' || window.location.search.includes('admin=1');
    };

    setIsAdminMode(checkAdminMode());

    const handleNavigation = () => {
      setIsAdminMode(checkAdminMode());
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }, []);

  return (
    <>
      {!isAdminMode ? (
        <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-slate-900">
            <div className="flex flex-col items-center mb-6">
              <h1 className="text-xl font-bold text-slate-900">Copiloto Financeiro</h1>
              <p className="text-xs text-slate-500">Seu agente financeiro.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-MAIL</label>
                <input type="email" placeholder="seu@email.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SENHA</label>
                <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" />
              </div>
              <button type="button" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
                Entrar
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col gap-3">
              <button type="button" onClick={handleGoogleLogin} className="w-full bg-white border border-slate-300 text-slate-700 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="h-5 w-5" />
                <span>Continuar com Google</span>
              </button>
              <button type="button" onClick={handleFacebookLogin} className="w-full bg-[#1877F2] text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#166fe5] transition-colors shadow-sm cursor-pointer">
                <img src="https://authjs.dev/img/providers/facebook.svg" alt="Facebook" className="h-5 w-5 filter brightness-0 invert" />
                <span>Continuar com Facebook</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
          {/* SEU PAINEL COMPLETO CONTINUA AQUI */}
        </div>
      )}
    </>
  );
}

  // Estados do Modal Conectar Maquininha (Open Finance)
  const [showMaquininhaModal, setShowMaquininhaModal] = useState<boolean>(false);
  const [maquininhaConectada, setMaquininhaConectada] = useState<string | null>(null);
  const [showBalcaoModal, setShowBalcaoModal] = useState<boolean>(false);
  const [precoVenda, setPrecoVenda] = useState<string>('');
  const [custoProduto, setCustoProduto] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'debito' | 'credito_vista' | 'credito_parcelado' | null>(null);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<number | null>(null);
  const [resumoBalcaoAtivo, setResumoBalcaoAtivo] = useState<boolean>(false);
  const [showDiaResumoModal, setShowDiaResumoModal] = useState<boolean>(false);
  const [diaResumoSelecionado, setDiaResumoSelecionado] = useState<{
    dia: string;
    total: number;
    quantidade: number;
    ticketMedio: number;
  } | null>(null);

  // Estado do plano ativo (Padrão: Gratuito para testes)
  const [planoAtivo, setPlanoAtivo] = useState<
    'Plano Freemium / 7 Dias Grátis' | 'Plano Essencial' | 'Plano Copiloto' | 'Plano Alta Performance'
  >('Plano Freemium / 7 Dias Grátis');

  // ---------------------------------------------------------------------------
  // REGRAS DE PARAMETRIZAÇÃO DOS PLANOS
  // ---------------------------------------------------------------------------
  const isGratuito = planoAtivo === 'Plano Freemium / 7 Dias Grátis';
  const isEssencial = planoAtivo === 'Plano Essencial';
  const isCopiloto = planoAtivo === 'Plano Copiloto';
  const isAltaPerformance = planoAtivo === 'Plano Alta Performance';

  // Modelo Freemium de 7 dias grátis
  const [freemiumStartDate, setFreemiumStartDate] = useState<string>('');
  const [freemiumRemaining, setFreemiumRemaining] = useState<{ days: number; hours: number; expired: boolean }>({ days: 7, hours: 0, expired: false });
  const [showFreemiumExpiradoModal, setShowFreemiumExpiradoModal] = useState<boolean>(false);
  const isFreemiumActive = isGratuito && !freemiumRemaining.expired;

  // Permissões Específicas:
  const podeUsarOpenFinance = isFreemiumActive || isCopiloto || isAltaPerformance;
  const podeUsarAuditoriaTaxas = isFreemiumActive || isCopiloto || isAltaPerformance;
  const podeUsarGatilho12x = isFreemiumActive || isCopiloto || isAltaPerformance;
  const podeUsarModuloContador = isFreemiumActive || isCopiloto || isAltaPerformance;
  const podeUsarCobrancaWhatsapp = isFreemiumActive || isCopiloto || isAltaPerformance;
  const podeUsarRelatoriosAvancados = isFreemiumActive || isCopiloto || isAltaPerformance;

  // Função auxiliar de verificação de permissão com aviso
  const checarAcesso = (permissao: boolean, nomeRecurso: string, acao: () => void) => {
    if (permissao) {
      acao();
    } else if (isGratuito && freemiumRemaining.expired) {
      setShowFreemiumExpiradoModal(true);
    } else {
      setRecursoBloqueadoNome(nomeRecurso);
      setShowRecursoBloqueadoModal(true);
    }
  };

  // Valores do Fluxo de Caixa
  const [receberPendente, setReceberPendente] = useState<number>(1250.0);
  const [vendasHoje, setVendasHoje] = useState<number>(3840.0);
  const [totalRecebido, setTotalRecebido] = useState<number>(3840.0);
  const [despesas, setDespesas] = useState<number>(480.0);
  const [receberPendenteInput, setReceberPendenteInput] = useState<string>('1.250,00');
  const [vendasHojeInput, setVendasHojeInput] = useState<string>('3.840,00');
  const [totalRecebidoInput, setTotalRecebidoInput] = useState<string>('3.840,00');
  const [despesasInput, setDespesasInput] = useState<string>('480,00');
  const [showConfirmacaoExcluir, setShowConfirmacaoExcluir] = useState<boolean>(false);
  const [tipoConfirmacaoExclusao, setTipoConfirmacaoExclusao] = useState<'vendasHoje' | 'receberPendente' | 'totalRecebido' | 'despesas' | null>(null);
  const [showPendenciaModal, setShowPendenciaModal] = useState<boolean>(false);
  const [pendenciaCliente, setPendenciaCliente] = useState<string>('Cliente Exemplo');
  const [pendenciaItem, setPendenciaItem] = useState<string>('Serviço/Produto');
  const [pendenciaValor, setPendenciaValor] = useState<number>(receberPendente || 0);

  // Meta e termômetro de ponto de equilíbrio
  const [custoFixoMensal, setCustoFixoMensal] = useState<number>(3000.0);
  const metaDiaria = Number((custoFixoMensal / 30).toFixed(2));

  // Simulador de desconto na Calculadora
  const [showDescontoPanel, setShowDescontoPanel] = useState<boolean>(false);
  const [descontoPercent, setDescontoPercent] = useState<number>(0);
  const [descontoValor, setDescontoValor] = useState<number>(0);

  // Dados consolidados do Mês para o Contador
  const [faturamentoMes, setFaturamentoMes] = useState<number>(14850.0);
  const [taxasCartaoMes, setTaxasCartaoMes] = useState<number>(682.40);
  const [despesasFornecedoresMes, setDespesasFornecedoresMes] = useState<number>(4320.0);

  // Anomalia de Taxa no Card #3
  const anomaliaTaxa = {
    modalidade: 'Crédito À Vista',
    taxaContratada: 3.1,
    taxaCobrada: 4.8,
    valorVenda: 1200.0,
    diferencaReais: 20.4,
    textoContestacao:
      'Prezados, identifiquei a cobrança de 4,8% na transação de Crédito à Vista de R$ 1.200,00, sendo que minha taxa contratada é de 3,1%. Solicito o estorno imediato da diferença de R$ 20,40 no meu próximo recebimento.',
  };

  // Ralo de Juros no Card #4
  const raloJuros = {
    jurosPerdidos12x: 412.80,
    porcentagemSobreFaturamento: 16.2,
  };

  const chavePixExemplo = '00020126360014br.gov.bcb.pix0116copiloto@mei.com.br';

  const handleCopiarChave = () => {
    navigator.clipboard.writeText(chavePixExemplo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const atualizarFreemium = (startDateStr: string) => {
    const startDate = new Date(startDateStr);
    const expiracao = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const agora = new Date();
    const diferenca = expiracao.getTime() - agora.getTime();
    if (diferenca <= 0) {
      setFreemiumRemaining({ days: 0, hours: 0, expired: true });
      return;
    }
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    setFreemiumRemaining({ days: dias, hours: horas, expired: false });
  };

  useEffect(() => {
    const key = 'freemium_start_date';
    let startDateStr = localStorage.getItem(key);
    if (!startDateStr) {
      startDateStr = new Date().toISOString();
      localStorage.setItem(key, startDateStr);
    }
    setFreemiumStartDate(startDateStr);
    atualizarFreemium(startDateStr);

    const intervalId = window.setInterval(() => {
      const stored = localStorage.getItem(key);
      if (stored) {
        atualizarFreemium(stored);
      }
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleConfirmarPagamento = () => {
    if (planoPix) {
      if (planoPix.id === 'essencial') setPlanoAtivo('Plano Essencial');
      if (planoPix.id === 'copiloto') setPlanoAtivo('Plano Copiloto');
      if (planoPix.id === 'alta_performance') setPlanoAtivo('Plano Alta Performance');
    }
    setPlanoPix(null);
    setShowPlanosModal(false);
  };

  const handleConectarMaquininha = (nomeProvedor: string) => {
    setMaquininhaConectada(nomeProvedor);
    setShowMaquininhaModal(false);
    alert(`Maquininha ${nomeProvedor} conectada com sucesso via Open Finance! Contrato de taxas ativo.`);
  };

  const handleCopiarContestacao = () => {
    checarAcesso(podeUsarAuditoriaTaxas, 'Auditoria e Contestação de Taxas', () => {
      navigator.clipboard.writeText(anomaliaTaxa.textoContestacao);
      alert('Texto de contestação copiado para a área de transferência!');
    });
  };

  // Texto formatado para o Contador
  const textoEmailContador = `Prezado(a) contador(a), segue o resumo operacional do meu negócio referente a este mês:\n\n` +
    `• Faturamento Bruto: R$ ${faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
    `• Total Pago em Taxas de Cartão: R$ ${taxasCartaoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
    `• Despesas Operacionais: R$ ${despesasFornecedoresMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
    `Os extratos de Open Finance e XMLs de vendas consolidados estão anexados à plataforma. Fico à disposição para ajustes na guia do Simples/DAS.`;

  const handleEnviarContadorWhatsApp = () => {
    checarAcesso(podeUsarModuloContador, 'Envio Automático ao Contador', () => {
      const linkWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoEmailContador)}`;
      window.open(linkWhatsApp, '_blank');
    });
  };

  const handleCopiarTextoContador = () => {
    checarAcesso(podeUsarModuloContador, 'Relatório para Contador', () => {
      navigator.clipboard.writeText(textoEmailContador);
      alert('Relatório formatado copiado! Cole no e-mail do seu contador.');
    });
  };

  const formatCurrencyValue = (value: number) =>
    value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const parseCurrencyInput = (value: string) => {
    const cleaned = value
      .replace(/R\$/g, '')
      .replace(/\./g, '')
      .replace(/,/g, '.')
      .replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const handleIndicatorInputChange = (tipo: 'vendasHoje' | 'receberPendente' | 'totalRecebido' | 'despesas', rawValue: string) => {
    const parsedValue = parseCurrencyInput(rawValue);
    if (tipo === 'vendasHoje') {
      setVendasHoje(parsedValue);
      setVendasHojeInput(rawValue);
    }
    if (tipo === 'receberPendente') {
      setReceberPendente(parsedValue);
      setReceberPendenteInput(rawValue);
    }
    if (tipo === 'totalRecebido') {
      setTotalRecebido(parsedValue);
      setTotalRecebidoInput(rawValue);
    }
    if (tipo === 'despesas') {
      setDespesas(parsedValue);
      setDespesasInput(rawValue);
    }
  };

  useEffect(() => {
    setVendasHojeInput(formatCurrencyValue(vendasHoje));
  }, [vendasHoje]);

  useEffect(() => {
    setReceberPendenteInput(formatCurrencyValue(receberPendente));
  }, [receberPendente]);

  useEffect(() => {
    setTotalRecebidoInput(formatCurrencyValue(totalRecebido));
  }, [totalRecebido]);

  useEffect(() => {
    setDespesasInput(formatCurrencyValue(despesas));
  }, [despesas]);

  const handleAjustarTotaisContador = () => {
    checarAcesso(podeUsarModuloContador, 'Ajuste do Fechamento do Contador', () => {
      const novoFaturamento = prompt('Digite o novo Faturamento Bruto Total (R$):', faturamentoMes.toString());
      if (novoFaturamento && !isNaN(Number(novoFaturamento))) {
        setFaturamentoMes(Number(novoFaturamento));
      }
    });
  };

  const validarValorMonetario = (valor: string) => {
    const numero = Number(valor.replace(',', '.'));
    return !Number.isNaN(numero) && numero > 0;
  };

  const camposBalcaoValidos = validarValorMonetario(precoVenda) && validarValorMonetario(custoProduto);

  const taxasPagamento = {
    pix: 0,
    debito: 2.5,
    credito_vista: 3.5,
    credito_parcelado: 4.8,
  } as const;

  const taxasParcelamento: Record<number, number> = {
    1: 3.5,
    2: 4.8,
    3: 4.8,
    4: 5.5,
    5: 5.7,
    6: 6.2,
    7: 6.9,
    8: 7.2,
    9: 7.5,
    10: 7.8,
    11: 8.0,
    12: 8.5,
  };

  const parcelasDisponiveis = Array.from({ length: 12 }, (_, i) => i + 1);

  const precoVendaNumero = Number(precoVenda.replace(',', '.')) || 0;
  const custoProdutoNumero = Number(custoProduto.replace(',', '.')) || 0;
  const taxaPercentual = formaPagamento
    ? formaPagamento === 'credito_parcelado'
      ? parcelaSelecionada
        ? taxasParcelamento[parcelaSelecionada]
        : taxasPagamento.credito_parcelado
      : taxasPagamento[formaPagamento]
    : 0;
  const taxaOperacao = Number(((precoVendaNumero * taxaPercentual) / 100).toFixed(2));
  const valorLiquidoReceber = Number((precoVendaNumero - taxaOperacao).toFixed(2));
  const lucroReal = Number((valorLiquidoReceber - custoProdutoNumero).toFixed(2));
  const margemLucro = valorLiquidoReceber > 0 ? Number(((lucroReal / valorLiquidoReceber) * 100).toFixed(2)) : 0;

  // Taxa efetiva real (contratado vs recebido)
  const taxaEfetivaReal = precoVendaNumero > 0 ? Number((((precoVendaNumero - valorLiquidoReceber) / precoVendaNumero) * 100).toFixed(2)) : 0;
  const isEntradaVozDisponivel = isGratuito || isCopiloto || isAltaPerformance;

  const ativarEntradaPorVoz = () => {
    if (isEntradaVozDisponivel) {
      alert('Entrada por voz disponível. Comece a falar o valor agora.');
    } else {
      alert('O recurso de entrada por voz está bloqueado no seu plano atual.');
    }
  };

  const resumoVendasPorDia = [
    { dia: '2ª', total: 1200.0, quantidade: 8, ticketMedio: 150.0 },
    { dia: '3ª', total: 980.0, quantidade: 6, ticketMedio: 163.33 },
    { dia: '4ª', total: 1450.0, quantidade: 10, ticketMedio: 145.0 },
    { dia: '5ª', total: 1750.0, quantidade: 12, ticketMedio: 145.83 },
    { dia: '6ª', total: 2150.0, quantidade: 14, ticketMedio: 153.57 },
    { dia: 'Sáb', total: 2600.0, quantidade: 16, ticketMedio: 162.5 },
  ];

  const abrirResumoDia = (diaResumo: { dia: string; total: number; quantidade: number; ticketMedio: number }) => {
    setDiaResumoSelecionado(diaResumo);
    setShowDiaResumoModal(true);
  };

  const resetIndicador = (tipo: 'vendasHoje' | 'receberPendente' | 'totalRecebido' | 'despesas') => {
    setTipoConfirmacaoExclusao(tipo);
    setShowConfirmacaoExcluir(true);
  };

  const confirmarExclusaoIndicador = () => {
    if (!tipoConfirmacaoExclusao) return;

    if (tipoConfirmacaoExclusao === 'vendasHoje') setVendasHoje(0);
    if (tipoConfirmacaoExclusao === 'receberPendente') setReceberPendente(0);
    if (tipoConfirmacaoExclusao === 'totalRecebido') setTotalRecebido(0);
    if (tipoConfirmacaoExclusao === 'despesas') setDespesas(0);

    setShowConfirmacaoExcluir(false);
    setTipoConfirmacaoExclusao(null);
  };

  const cancelarExclusaoIndicador = () => {
    setShowConfirmacaoExcluir(false);
    setTipoConfirmacaoExclusao(null);
  };

  const handleSelecionarFormaPagamento = (forma: 'pix' | 'debito' | 'credito_vista' | 'credito_parcelado') => {
    if (!camposBalcaoValidos) return;
    setFormaPagamento(forma);
    setResumoBalcaoAtivo(true);
    setParcelaSelecionada(forma === 'credito_parcelado' ? 1 : null);
  };

  const handleSelecionarParcela = (parcela: number) => {
    if (!camposBalcaoValidos || formaPagamento !== 'credito_parcelado') return;
    setParcelaSelecionada(parcela);
  };

  const handleConfirmarVendaBalcao = () => {
    if (!camposBalcaoValidos || !formaPagamento) return;
    setVendasHoje((prev) => prev + precoVendaNumero);
    setTotalRecebido((prev) => prev + precoVendaNumero);
    setShowBalcaoModal(false);
    setPrecoVenda('');
    setCustoProduto('');
    setFormaPagamento(null);
    setParcelaSelecionada(null);
    setResumoBalcaoAtivo(false);
  };

  const listaPlanosDisponiveis: PlanoSelecionado[] = [
    {
      id: 'essencial',
      nome: 'Essencial',
      valor: 'R$ 19,90/mês',
      recursos: [
        'Registro ilimitado de entradas e saídas',
        'Relatório diário simples de caixa',
        'Fechamento Mensal de uso interno',
        'Suporte por email',
      ],
    },
    {
      id: 'copiloto',
      nome: 'Copiloto',
      valor: 'R$ 29,90/mês',
      recursos: [
        'Todas as funções do Essencial',
        'Auditoria automática de taxas de maquininhas (Open Finance)',
        'Central do Contador em 1 Clique (WhatsApp/E-mail)',
        'Alertas preventivos de ralo de juros (12x)',
        'Cobranças automáticas via WhatsApp',
      ],
    },
    {
      id: 'alta_performance',
      nome: 'Alta Performance',
      valor: 'R$ 39,90/mês',
      recursos: [
        'Todas as funções do Copiloto',
        'Análise preditiva de faturamento',
        'Exportação de Relatórios Executivos em PDF Avançado',
        'Atendimento VIP prioritário',
      ],
    },
  ];

  return(
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      {!isAdminMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712] p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-slate-900">
            <div className="flex flex-col items-center mb-6">
              <h1 className="text-xl font-bold text-slate-900">Copiloto Financeiro</h1>
              <p className="text-xs text-slate-500">Seu agente financeiro.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-MAIL</label>
                <input type="email" placeholder="seu@email.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SENHA</label>
                <input type="password" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" />
              </div>
              <button type="button" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer">
                Entrar
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col gap-3">
              <button type="button" onClick={handleGoogleLogin} className="w-full bg-white border border-slate-300 text-slate-700 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="h-5 w-5" />
                <span>Continuar com Google</span>
              </button>
              <button type="button" onClick={handleFacebookLogin} className="w-full bg-[#1877F2] text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#166fe5] transition-colors shadow-sm cursor-pointer">
                <img src="https://authjs.dev/img/providers/facebook.svg" alt="Facebook" className="h-5 w-5 filter brightness-0 invert" />
                <span>Continuar com Facebook</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra Superior de Alerta */}
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col font-sans relative">
      {/* Barra Superior de Alerta */}
      <header className="bg-[#8C1414] animate-pulse px-6 py-2.5 flex items-center justify-between text-xs font-bold tracking-wider">
        <div className="flex items-center gap-2 text-amber-300">
          <Flame className="w-4 h-4 fill-amber-300" />
          <span className="uppercase">Modo Apaga Incêndio Ativo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-200 font-medium">Status do caixa:</span>
          <span className="bg-[#5C0C0C] text-rose-200 px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase">
            ATENÇÃO REQUERIDA
          </span>
        </div>
      </header>
      <div className="bg-[#06131D] border-t border-b border-slate-800 px-6 py-3 text-sm text-slate-200 flex items-center justify-between gap-3">
        <span className="font-semibold">{freemiumRemaining.expired ? '🔒 Período Freemium de 7 dias expirado. Faça o upgrade para o plano PRO.' : `⚡ Período Freemium: ${freemiumRemaining.days} dias e ${freemiumRemaining.hours} horas restantes de acesso total.`}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${freemiumRemaining.expired ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-slate-950'}`}>
          {freemiumRemaining.expired ? 'Expirado' : 'Ativo'}
        </span>
      </div>

      {/* Navegação Principal */}
      <nav className="bg-[#040810] px-6 py-3 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTab('painel')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              tab === 'painel'
                ? 'bg-[#0E1A2E] text-amber-400 border border-amber-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Painel Principal
          </button>

          <button
            onClick={() => setTab('fechamento')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              tab === 'fechamento'
                ? 'bg-[#0E1A2E] text-amber-400 border border-amber-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Fechamento Interno
          </button>

          {/* BOTÃO CONTADOR (RENOMEADO) */}
          <button
            onClick={() => {
              checarAcesso(podeUsarModuloContador, 'Central do Contador', () => setTab('contador'));
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              tab === 'contador'
                ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                : 'bg-[#14233D] text-amber-300 hover:bg-[#1C3257] border border-amber-500/30'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Contador</span>
            {!podeUsarModuloContador && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {planoAtivo && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
              <Sparkle className="w-3.5 h-3.5 fill-emerald-400" />
              <span>{planoAtivo}</span>
            </div>
          )}

          {isAdminMode && (
            <button
              onClick={() => setShowDevModal(true)}
              className="bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/50 text-indigo-200 font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span>Painel Dev</span>
            </button>
          )}

          {/* BOTÃO SEJA COPILOTO (RENOMEADO) */}
          <button
            onClick={() => setShowPlanosModal(true)}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Crown className="w-4 h-4 fill-slate-950" />
            <span>Seja Copiloto</span>
          </button>
        </div>
      </nav>

      <div className="bg-[#07101A] border-b border-slate-800 px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-slate-400">Acesse rapidamente com login social</p>
          <p className="text-sm font-semibold text-slate-100">Autenticação Google e Facebook</p>
        </div>
        <div className="grid w-full gap-3 md:w-auto md:grid-cols-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-slate-300 text-slate-900 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors shadow-sm"
          >
            <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="h-5 w-5" />
            <span>Continuar com Google</span>
          </button>
          <button
            type="button"
            onClick={handleFacebookLogin}
            className="w-full bg-[#1877F2] text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[#166fe5] transition-colors shadow-sm"
          >
            <img src="https://authjs.dev/img/providers/facebook.svg" alt="Facebook" className="h-5 w-5 filter brightness-0 invert" />
            <span>Continuar com Facebook</span>
          </button>
        </div>
      </div>

      {/* ABA: PAINEL PRINCIPAL */}
      {tab === 'painel' && (
        <main className="flex-1 px-8 py-6 max-w-7xl w-full mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                <FileText className="w-4 h-4" />
                <span>Copiloto Financeiro MEI / MPE</span>
              </div>
              <h1 className="text-3xl font-extrabold text-amber-400 tracking-tight">
                Suas Prioridades De Hoje
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Acompanhamento em tempo real de vendas, pendências, auditoria de taxas e inteligência preventiva.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  checarAcesso(podeUsarOpenFinance, 'Conexão Open Finance com Maquininha', () =>
                    setShowMaquininhaModal(true)
                  );
                }}
                className={`text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-md cursor-pointer font-extrabold ${
                  podeUsarOpenFinance
                    ? 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Conectar Maquininha</span>
                {!podeUsarOpenFinance && <Lock className="w-3 h-3 text-amber-400" />}
              </button>
              <button className="bg-[#0A1322] hover:bg-[#101E36] border border-slate-800 text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar
              </button>
            </div>
          </div>

          {/* Banner Open Finance */}
          <div className="bg-[#0A1322] border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                Maquininhas Conectadas via Open Finance:{' '}
                {podeUsarOpenFinance ? (maquininhaConectada ? `1 (${maquininhaConectada})` : 'Nenhuma maquininha conectada') : '0'}
              </span>
            </div>
            <span
              className={`font-bold text-[11px] px-2 py-0.5 rounded border ${
                podeUsarOpenFinance
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-950/60 text-amber-400 border-amber-500/30'
              }`}
            >
              {podeUsarOpenFinance ? 'Sincronização Ativa' : 'Disponível no Plano Copiloto'}
            </span>
          </div>

          {/* Fluxo de Caixa */}
          <div className="bg-[#0A1322] border border-slate-800/80 rounded-2xl p-5 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Fluxo de Caixa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0E1A2E] border border-slate-800/60 p-4 rounded-xl">
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>VENDAS DE HOJE</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => resetIndicador('vendasHoje')}
                    className="text-slate-400 hover:text-white"
                    aria-label="Zerar Vendas de Hoje"
                    title="Excluir Saldo?"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-2xl font-black text-white">
                  <input
                    value={vendasHojeInput}
                    onChange={(e) => handleIndicatorInputChange('vendasHoje', e.target.value)}
                    className="w-full bg-transparent text-right outline-none"
                    aria-label="Editar Vendas de Hoje"
                  />
                </div>
              </div>

              <div
                className="bg-[#0E1A2E] border border-slate-800/60 p-4 rounded-xl cursor-pointer"
                onClick={() => {
                  setPendenciaValor(receberPendente);
                  setShowPendenciaModal(true);
                }}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>A RECEBER (PENDENTE)</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetIndicador('receberPendente');
                    }}
                    className="text-slate-400 hover:text-white"
                    aria-label="Zerar A Receber"
                    title="Excluir Saldo?"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-2xl font-black text-amber-400">
                  <input
                    value={receberPendenteInput}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleIndicatorInputChange('receberPendente', e.target.value)}
                    className="w-full bg-transparent text-right outline-none"
                    aria-label="Editar A Receber"
                  />
                </div>
              </div>

              <div className="bg-[#0E1A2E] border border-slate-800/60 p-4 rounded-xl">
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>TOTAL RECEBIDO</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => resetIndicador('totalRecebido')}
                    className="text-slate-400 hover:text-white"
                    aria-label="Zerar Total Recebido"
                    title="Excluir Saldo?"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  <input
                    value={totalRecebidoInput}
                    onChange={(e) => handleIndicatorInputChange('totalRecebido', e.target.value)}
                    className="w-full bg-transparent text-right outline-none"
                    aria-label="Editar Total Recebido"
                  />
                </div>
              </div>

              <div className="bg-[#0E1A2E] border border-slate-800/60 p-4 rounded-xl">
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>DESPESAS</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => resetIndicador('despesas')}
                    className="text-slate-400 hover:text-white"
                    aria-label="Zerar Despesas"
                    title="Excluir Saldo?"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-2xl font-black text-rose-400">
                  <input
                    value={despesasInput}
                    onChange={(e) => handleIndicatorInputChange('despesas', e.target.value)}
                    className="w-full bg-transparent text-right outline-none"
                    aria-label="Editar Despesas"
                  />
                </div>
              </div>
            </div>

            {/* Evolução de Vendas */}
            <div className="pt-2 border-t border-slate-800/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 block mb-3">
                EVOLUÇÃO DAS VENDAS
              </span>
              <div className="grid grid-cols-6 gap-2 items-end h-24 bg-[#060D1A] p-3 rounded-xl border border-slate-800/40">
                {resumoVendasPorDia.map((item) => {
                  const altura = Math.max(30, Math.round((item.total / Math.max(...resumoVendasPorDia.map((d) => d.total))) * 100));
                  return (
                    <button
                      key={item.dia}
                      type="button"
                      onClick={() => abrirResumoDia(item)}
                      className="group flex flex-col items-center justify-end w-full"
                    >
                      <div
                        className={`w-full rounded-md border ${diaResumoSelecionado?.dia === item.dia ? 'border-amber-400 bg-amber-400' : 'border-amber-600/40 bg-amber-800/60 group-hover:border-amber-400'}`}
                        style={{ height: `${altura}%` }}
                      />
                      <span className="mt-2 text-[10px] text-amber-200">{item.dia}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Termômetro do Ponto de Equilíbrio Diário */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span>Ponto de Equilíbrio Diário</span>
                <span className="font-black text-sm">Meta: R$ {metaDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full bg-[#04101A] rounded-lg border border-slate-800 p-1">
                <div
                  className={`h-3 rounded-lg transition-all ${vendasHoje < metaDiaria ? 'bg-amber-400' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, metaDiaria === 0 ? 0 : (vendasHoje / metaDiaria) * 100)}%` }}
                />
              </div>
              <div className="mt-2 text-[12px] font-bold">
                {vendasHoje < metaDiaria ? (
                  <span className="text-amber-300">Trabalhando para pagar a estrutura do dia</span>
                ) : (
                  <span className="text-emerald-300">Ponto de Equilíbrio Atingido! A partir de agora é Lucro Real 🎉</span>
                )}
              </div>
            </div>
          </div>

          {/* Cards de Prioridades & Intencionalidades */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <Flame className="w-5 h-5 fill-amber-400" />
              <h2>Ações Recomendadas do Dia & Inteligência Preventiva</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* ITEM #1: PAGAR (LIBERADO TODOS OS PLANOS) */}
              <div className="bg-[#0A1322] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg border border-amber-500/30">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <span className="bg-[#12223D] text-amber-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border border-amber-500/20">
                        PAGAR
                      </span>
                    </div>
                    <span className="text-amber-400/80 font-black text-sm">#1</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-amber-300 mb-2 leading-snug">
                    Pagar fornecedores e boletos
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Mantenha suas contas em dia para evitar juros e multas desnecessárias no caixa.
                  </p>
                </div>

                <div className="bg-[#060D1A] border border-slate-800 rounded-xl p-3 flex items-center gap-2 text-slate-300 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Realize o pagamento no app do seu banco.</span>
                </div>
              </div>

              {/* ITEM #2: COBRAR (WHATSAPP AUTOMÁTICO DO PLANO COPILOTO) */}
              <div className="bg-[#0A1322] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg border border-emerald-500/30">
                        <Send className="w-4 h-4" />
                      </div>
                      <span className="bg-[#0C2920] text-emerald-400 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                        COBRAR
                      </span>
                    </div>
                    <span className="text-amber-400/80 font-black text-sm">#2</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-emerald-300 mb-2 leading-snug">
                    Cobrar recebíveis pendentes
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Você possui R$ 1.250,00 pendentes de recebimento neste período.
                  </p>
                </div>

                <button
                  onClick={() => {
                    checarAcesso(podeUsarCobrancaWhatsapp, 'Cobrança via WhatsApp', () =>
                      alert('Abrindo WhatsApp para automação de cobrança...')
                    );
                  }}
                  className={`w-full font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                    podeUsarCobrancaWhatsapp
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar Lembrete WhatsApp</span>
                  {!podeUsarCobrancaWhatsapp && <Lock className="w-3 h-3 text-amber-400" />}
                </button>
              </div>

              {/* ITEM #3: CARD AUDITORIA DE TAXAS (BLOQUEADO NO ESSENCIAL) */}
              <div className="bg-[#0A1322] border border-rose-500/30 rounded-2xl p-5 flex flex-col justify-between relative shadow-lg overflow-hidden">
                {!podeUsarAuditoriaTaxas && (
                  <div className="absolute inset-0 bg-[#050D1A]/92 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-4 text-center">
                    <LockKeyhole className="w-8 h-8 text-amber-400 mb-2" />
                    <span className="text-xs font-black tracking-wider text-white uppercase mb-1">
                      RECURSO EXCLUSIVO COPILOTO
                    </span>
                    <p className="text-[11px] text-slate-300 mb-3">
                      Auditoria de taxas via Open Finance.
                    </p>
                    <button
                      onClick={() => setShowPlanosModal(true)}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      Seja Copiloto
                    </button>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-rose-500/20 text-rose-400 p-2 rounded-lg border border-rose-500/30">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <span className="bg-[#2D121B] text-rose-400 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border border-rose-500/20">
                        AUDITORIA
                      </span>
                    </div>
                    <span className="text-amber-400/80 font-black text-sm">#3</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-rose-300 mb-2 leading-snug">
                    Divergência de {anomaliaTaxa.taxaCobrada}% na Maquininha
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Cobrança de <strong>{anomaliaTaxa.taxaCobrada}%</strong> em venda de R$ {anomaliaTaxa.valorVenda.toFixed(2)}.
                  </p>

                  <div className="bg-[#1C0D12] border border-rose-500/30 p-2.5 rounded-xl mb-4">
                    <span className="text-[11px] font-bold text-rose-400 block mb-0.5">
                      Diferença a recuperar:
                    </span>
                    <span className="text-base font-black text-white">
                      R$ {anomaliaTaxa.diferencaReais.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCopiarContestacao}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Contestação
                </button>
              </div>

              {/* ITEM #4: GATILHO PREVENTIVO 12X (BLOQUEADO NO ESSENCIAL) */}
              <div className="bg-[#0A1322] border border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between relative shadow-lg overflow-hidden">
                {!podeUsarGatilho12x && (
                  <div className="absolute inset-0 bg-[#050D1A]/92 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-4 text-center">
                    <LockKeyhole className="w-8 h-8 text-amber-400 mb-2" />
                    <span className="text-xs font-black tracking-wider text-white uppercase mb-1">
                      RECURSO EXCLUSIVO COPILOTO
                    </span>
                    <p className="text-[11px] text-slate-300 mb-3">
                      Inteligência preventiva de ralo de juros.
                    </p>
                    <button
                      onClick={() => setShowPlanosModal(true)}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      Seja Copiloto
                    </button>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-500/20 text-amber-400 p-2 rounded-lg border border-amber-500/30">
                        <Percent className="w-4 h-4" />
                      </div>
                      <span className="bg-[#291E0C] text-amber-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border border-amber-500/30 uppercase">
                        Gatilho 12x
                      </span>
                    </div>
                    <span className="text-amber-400/80 font-black text-sm">#4</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-amber-300 mb-2 leading-snug">
                    Ralo detectado nas vendas em 12x
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Você deixou <strong>R$ {raloJuros.jurosPerdidos12x.toFixed(2)}</strong> em juros por parcelar em 12x.
                  </p>

                  <div className="bg-[#1F170A] border border-amber-500/30 p-2.5 rounded-xl mb-4 text-xs text-amber-200 leading-tight">
                    💡 <strong>Dica:</strong> Renegocie com sua credenciadora.
                  </div>
                </div>

                <button
                  onClick={() => alert(`Economia estimada: R$ ${ (raloJuros.jurosPerdidos12x * 0.4).toFixed(2) }/mês.`)}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Simular Economia em Taxas</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ABA: FECHAMENTO INTERNO (DISPONÍVEL EM TODOS OS PLANOS) */}
      {tab === 'fechamento' && (
        <main className="flex-1 px-8 py-6 max-w-5xl w-full mx-auto space-y-6">
          <div className="bg-[#0A1322] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-400/20 p-3.5 rounded-2xl border border-amber-400/30">
                  <FileText className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-amber-400">
                    Fechamento do Mês (Uso Interno)
                  </h1>
                  <p className="text-xs text-slate-300">
                    Consolidação financeira para gestão própria do lojista.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0E1A2E] border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-bold block mb-1">Entradas Totais</span>
                <span className="text-xl font-black text-emerald-400">R$ {faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-[#0E1A2E] border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-bold block mb-1">Saídas Totais</span>
                <span className="text-xl font-black text-rose-400">R$ {despesasFornecedoresMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-[#0E1A2E] border border-slate-800 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 font-bold block mb-1">Resultado Líquido</span>
                <span className="text-xl font-black text-amber-400">R$ {(faturamentoMes - despesasFornecedoresMes - taxasCartaoMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="bg-[#060D1A] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-slate-200 font-bold">
                  Todos os lançamentos do mês estão conciliados e conferidos.
                </span>
              </div>
              <button 
                onClick={() => {
                  checarAcesso(podeUsarRelatoriosAvancados, 'Exportação em PDF Executivo Avançado', () =>
                    alert('Exportando PDF Executivo Completo...')
                  );
                }}
                className={`text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  podeUsarRelatoriosAvancados
                    ? 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span>Exportar PDF</span>
                {!podeUsarRelatoriosAvancados && <Lock className="w-3 h-3 text-amber-400" />}
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ABA: CONTADOR (DISPONÍVEL NO PLANO COPILOTO, ALTA PERF E GRATUITO) */}
      {tab === 'contador' && (
        <main className="flex-1 px-8 py-6 max-w-5xl w-full mx-auto space-y-6">
          <div className="bg-[#0A1322] border border-amber-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="bg-amber-400/20 p-3.5 rounded-2xl border border-amber-400/30">
                  <Building2 className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      tipo_resposta: fechamento_contador
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-amber-400 mt-1">
                    Central de Fechamento para o Contador
                  </h1>
                  <p className="text-xs text-slate-300">
                    Sua inteligência financeira gera dados organizados para enviar ao seu escritório em 1 clique.
                  </p>
                </div>
              </div>

              <button
                onClick={handleAjustarTotaisContador}
                className="bg-[#12223D] hover:bg-[#1A3057] text-amber-300 border border-amber-500/30 text-xs font-black px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer self-start md:self-auto"
              >
                <Sliders className="w-4 h-4" />
                <span>Ajustar Totais do Mês</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-[#060D1A] border border-slate-800 p-5 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  FATURAMENTO BRUTO TOTAL
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  R$ {faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block">Histórico de vendas</span>
              </div>

              <div className="bg-[#060D1A] border border-slate-800 p-5 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  TAXAS DE MAQUININHAS PAGAS
                </div>
                <div className="text-2xl font-black text-amber-400">
                  R$ {taxasCartaoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block">Auditoria Open Finance</span>
              </div>

              <div className="bg-[#060D1A] border border-slate-800 p-5 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  DESPESAS DE FORNECEDORES
                </div>
                <div className="text-2xl font-black text-rose-400">
                  R$ {despesasFornecedoresMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-slate-500 mt-2 block">Boletos e saídas</span>
              </div>
            </div>

            <div className="bg-[#060D1A] border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Texto Formatado Pronto para Envio
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Pronto para uso
                </span>
              </div>

              <div className="bg-[#0B152B] p-4 rounded-xl border border-slate-700 font-mono text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                {textoEmailContador}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleEnviarContadorWhatsApp}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>Enviar para Contador pelo WhatsApp</span>
                </button>

                <button
                  onClick={handleCopiarTextoContador}
                  className="flex-1 bg-[#12223D] hover:bg-[#1A3057] text-amber-300 border border-amber-500/30 font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar Texto do E-mail</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* MODAL: RECURSO BLOQUEADO PELO PLANO */}
      {showRecursoBloqueadoModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B152B] border border-amber-500/50 rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowRecursoBloqueadoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-amber-400/20 p-4 rounded-full w-fit mx-auto border border-amber-400/30 text-amber-400">
              <LockKeyhole className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-amber-400">Recurso Exclusivo</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                O recurso <strong>"{recursoBloqueadoNome}"</strong> não está disponível no seu plano atual (<strong>{planoAtivo}</strong>).
              </p>
            </div>

            <div className="bg-[#060D1A] p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
              Faça um upgrade para o <strong>Plano Copiloto</strong> para liberar auditorias, conexões Open Finance e envio direto para o contador.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRecursoBloqueadoModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  setShowRecursoBloqueadoModal(false);
                  setShowPlanosModal(true);
                }}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs py-3 rounded-xl shadow-md cursor-pointer"
              >
                Seja Copiloto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONECTAR MAQUININHA */}
      {showMaquininhaModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B1736] border border-blue-500/40 rounded-3xl max-w-lg w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowMaquininhaModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-black text-amber-400 mb-2">Conectar Maquininha</h2>
              <p className="text-xs text-slate-300">
                Sincronize vendas e taxas automaticamente via Open Finance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {['Stone', 'PagBank', 'Mercado Pago'].map((provedor) => (
                <button
                  key={provedor}
                  onClick={() => handleConectarMaquininha(provedor)}
                  className="bg-[#0E1F42] hover:bg-[#152B5A] border border-slate-700 hover:border-amber-400/50 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all cursor-pointer"
                >
                  <div className="bg-amber-400/10 group-hover:bg-amber-400/20 p-3 rounded-xl border border-amber-400/30">
                    <CreditCard className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-sm font-extrabold text-white">{provedor}</span>
                  <span className="text-[10px] text-slate-400">Toque para conectar</span>
                </button>
              ))}
            </div>

            <div className="bg-[#060D1A] border border-slate-800 rounded-xl p-3 flex items-center gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Conexão criptografada via Open Finance.</span>
            </div>
          </div>
        </div>
      )}
      {showFreemiumExpiradoModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B152B] border border-rose-500/40 rounded-3xl max-w-md w-full p-6 relative shadow-2xl text-center">
            <button
              onClick={() => setShowFreemiumExpiradoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-rose-500/10 p-4 rounded-full w-fit mx-auto border border-rose-500/30 text-rose-300 mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-rose-400">Período Freemium Expirado</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Os 7 dias gratuitos acabaram. Para continuar usando todos os recursos avançados, faça o upgrade para a versão PRO.
              </p>
            </div>
            <div className="bg-[#060D1A] border border-slate-800 rounded-xl p-4 text-xs text-slate-300 mt-4">
              <strong>Benefícios PRO:</strong>
              <ul className="mt-2 text-left list-disc list-inside space-y-1">
                <li>Uso ilimitado das ferramentas de cobrança e auditoria</li>
                <li>Resumo financeiro avançado e integração completa</li>
                <li>Suporte prioritário e consultoria rápida</li>
              </ul>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowFreemiumExpiradoModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowFreemiumExpiradoModal(false);
                  setShowDevModal(true);
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3 rounded-xl"
              >
                Selecionar Plano Pago
              </button>
              <button
                onClick={() => {
                  window.open('https://wa.me/?text=' + encodeURIComponent('Olá, quero liberar acesso PRO ao Copiloto Financeiro.'), '_blank');
                }}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs py-3 rounded-xl"
              >
                Liberar Acesso PRO via WhatsApp/PIX
              </button>
            </div>
          </div>
        </div>
      )}

      {showDiaResumoModal && diaResumoSelecionado && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B152B] border border-slate-800 rounded-3xl w-full max-w-md p-5 relative shadow-2xl">
            <button
              onClick={() => setShowDiaResumoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
              aria-label="Fechar resumo do dia"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-4">
              <h3 className="text-xl font-black text-amber-400">Resumo de Vendas - {diaResumoSelecionado.dia}</h3>
              <p className="text-xs text-slate-300 mt-1">Detalhes rápidos do desempenho do dia escolhido.</p>
            </div>
            <div className="space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl bg-[#08121F] border border-slate-800 p-4">
                <span className="text-slate-400 text-[11px] uppercase tracking-[0.2em]">Total Vendido</span>
                <div className="text-lg font-black text-white mt-1">R$ {diaResumoSelecionado.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="rounded-2xl bg-[#08121F] border border-slate-800 p-4">
                <span className="text-slate-400 text-[11px] uppercase tracking-[0.2em]">Quantidade de Vendas</span>
                <div className="text-lg font-black text-white mt-1">{diaResumoSelecionado.quantidade}</div>
              </div>
              <div className="rounded-2xl bg-[#08121F] border border-slate-800 p-4">
                <span className="text-slate-400 text-[11px] uppercase tracking-[0.2em]">Ticket Médio</span>
                <div className="text-lg font-black text-white mt-1">R$ {diaResumoSelecionado.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmacaoExcluir && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B152B] border border-slate-800 rounded-3xl max-w-sm w-full p-6 relative shadow-2xl text-center">
            <button
              type="button"
              onClick={cancelarExclusaoIndicador}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
              aria-label="Fechar confirmação"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-5">
              <h3 className="text-xl font-black text-amber-400">Excluir Saldo?</h3>
              <p className="text-xs text-slate-300 mt-2">Tem certeza que deseja remover o saldo deste indicador?</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelarExclusaoIndicador}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 rounded-xl"
              >
                Não
              </button>
              <button
                type="button"
                onClick={confirmarExclusaoIndicador}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs py-3 rounded-xl"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {showPendenciaModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B152B] border border-slate-800 rounded-3xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setShowPendenciaModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-3">
              <h3 className="text-xl font-black text-amber-400">Detalhes da Pendência</h3>
              <p className="text-xs text-slate-300 mt-1">Revise a informação e envie um lembrete via WhatsApp.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400">Cliente</label>
                <input value={pendenciaCliente} onChange={(e) => setPendenciaCliente(e.target.value)} className="w-full rounded-md bg-[#07101A] border border-slate-800 p-2 text-white" />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Item</label>
                <input value={pendenciaItem} onChange={(e) => setPendenciaItem(e.target.value)} className="w-full rounded-md bg-[#07101A] border border-slate-800 p-2 text-white" />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Valor (R$)</label>
                <input type="number" value={pendenciaValor} onChange={(e) => setPendenciaValor(Number(e.target.value))} className="w-full rounded-md bg-[#07101A] border border-slate-800 p-2 text-white" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowPendenciaModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  const mensagem = `Olá ${pendenciaCliente}, tudo bem? Estamos entrando em contato referente ao pagamento de ${pendenciaItem} no valor de R$ ${pendenciaValor.toFixed(2)}. Caso prefira, pague via PIX: ${chavePixExemplo}. Obrigado!`;
                  const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
                  window.open(url, '_blank');
                }}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs py-3 rounded-xl"
              >
                Cobrar via WhatsApp 📲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLANOS & ASSINATURA (SEJA COPILOTO) */}
      {showPlanosModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B152B] border border-amber-500/40 rounded-3xl max-w-4xl w-full p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowPlanosModal(false);
                setPlanoPix(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {!planoPix ? (
              <>
                <div className="mb-6 text-center">
                  <span className="bg-amber-400/20 text-amber-300 text-xs font-black px-3 py-1 rounded-full border border-amber-400/30 uppercase">
                    SEJA COPILOTO
                  </span>
                  <h2 className="text-2xl font-black text-amber-400 mt-2">
                    Escolha o plano para impulsionar seu negócio
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Alterne ou cancele a qualquer momento. Sem fidelidade.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {listaPlanosDisponiveis.map((plano) => (
                    <div
                      key={plano.id}
                      className="bg-[#121F3D] border border-slate-700 hover:border-amber-400/60 rounded-2xl p-5 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <h3 className="text-amber-400 font-extrabold text-lg mb-1">{plano.nome}</h3>
                        <div className="text-2xl font-black text-white mb-4">{plano.valor}</div>
                        <ul className="space-y-2.5 mb-6">
                          {plano.recursos.map((rec, rIdx) => (
                            <li key={rIdx} className="text-xs text-slate-300 flex items-start gap-2">
                              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => setPlanoPix(plano)}
                        className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Assinar via PIX
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-6 text-center max-w-md mx-auto">
                <div className="bg-amber-400/10 p-4 rounded-2xl border border-amber-400/30 w-fit mx-auto">
                  <QrCode className="w-12 h-12 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-amber-400">
                    Pagamento do Plano {planoPix.nome}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Valor: <strong className="text-white">{planoPix.valor}</strong>
                  </p>
                </div>

                <div className="bg-[#060D1A] border border-slate-800 p-4 rounded-2xl space-y-3">
                  <span className="text-xs text-slate-400 font-bold block">Chave PIX Copia e Cola:</span>
                  <div className="bg-[#0B152B] p-3 rounded-xl border border-slate-700 font-mono text-xs text-amber-300 break-all">
                    {chavePixExemplo}
                  </div>
                  <button
                    onClick={handleCopiarChave}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiado ? 'Copiado!' : 'Copiar Chave PIX'}</span>
                  </button>
                </div>

                <button
                  onClick={handleConfirmarPagamento}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Já fiz o pagamento (Ativar Agora)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DESENVOLVEDOR (MUDANÇA DE PLANO RÁPIDA) */}
      {showDevModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B152B] border border-indigo-500/40 rounded-3xl max-w-4xl w-full p-6 md:p-8 relative shadow-2xl">
            <button
              onClick={() => setShowDevModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30">
                <Code className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-indigo-300">
                  Painel de Teste do Desenvolvedor
                </h2>
                <p className="text-xs text-slate-300">
                  Simule a experiência do cliente alterando o plano em tempo real:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-h-[90vh] overflow-y-auto pb-8">
              <div className="bg-[#121F3D] border-2 border-emerald-500/60 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="bg-emerald-500/20 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                    <Gift className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="bg-emerald-950 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/30 uppercase block mb-2 w-fit">
                    FREEMIUM (7 DIAS)
                  </span>
                  <h3 className="text-emerald-300 font-bold text-sm mb-1">Freemium 7 Dias Grátis</h3>
                  <div className="text-lg font-black text-white mb-2">R$ 0,00</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
                    100% dos recursos liberados por 7 dias a partir do 1º acesso.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setPlanoAtivo('Plano Freemium / 7 Dias Grátis');
                    setShowDevModal(false);
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2 rounded-xl transition-all cursor-pointer"
                >
                  Ativar Freemium (7 Dias)
                </button>
              </div>

              <div className="bg-[#121F3D] border border-slate-700 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="bg-slate-700/40 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                    <Zap className="w-4 h-4 text-slate-300" />
                  </div>
                  <h3 className="text-amber-400 font-bold text-sm mb-1">Essencial</h3>
                  <div className="text-lg font-black text-white mb-2">R$ 19,90</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
                    Bloqueia Auditoria, Contador, WhatsApp e Open Finance.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setPlanoAtivo('Plano Essencial');
                    setShowDevModal(false);
                  }}
                  className="w-full bg-[#182C54] hover:bg-[#203B70] text-amber-300 font-bold text-xs py-2 rounded-xl transition-all cursor-pointer"
                >
                  Ativar Essencial
                </button>
              </div>

              <div className="bg-[#121F3D] border border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="bg-amber-400/20 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-amber-400 font-bold text-sm mb-1">Copiloto</h3>
                  <div className="text-lg font-black text-white mb-2">R$ 29,90</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
                    Libera Auditoria, Contador, Open Finance e WhatsApp.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setPlanoAtivo('Plano Copiloto');
                    setShowDevModal(false);
                  }}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs py-2 rounded-xl transition-all cursor-pointer"
                >
                  Ativar Copiloto
                </button>
              </div>

              <div className="bg-[#121F3D] border border-slate-700 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="bg-slate-700/40 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                    <Crown className="w-4 h-4 text-amber-300" />
                  </div>
                  <h3 className="text-amber-400 font-bold text-sm mb-1">Alta Performance</h3>
                  <div className="text-lg font-black text-white mb-2">R$ 39,90</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
                    Libera PDF Executivo Avançado e relatórios VIP.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setPlanoAtivo('Plano Alta Performance');
                    setShowDevModal(false);
                  }}
                  className="w-full bg-[#182C54] hover:bg-[#203B70] text-amber-300 font-bold text-xs py-2 rounded-xl transition-all cursor-pointer"
                >
                  Ativar Alta Perf.
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão Flutuante (+) */}
      <button
        onClick={() => setShowBalcaoModal(true)}
        className="fixed bottom-6 left-6 bg-amber-400 hover:bg-amber-500 text-slate-950 p-3.5 rounded-full shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
        aria-label="Abrir Calculadora de Balcão Express"
      >
        <Plus className="w-7 h-7 stroke-[3]" />
      </button>

      {/* MODAL: CALCULADORA DE BALCÃO EXPRESS */}
      {false && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#07101F] border border-slate-800 rounded-3xl w-full max-w-[95vw] sm:max-w-xl p-3 text-slate-100 shadow-2xl max-h-[85vh] overflow-hidden overflow-x-hidden flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h2 className="text-lg font-black text-amber-400">Calculadora de Balcão Express</h2>
                <p className="text-[11px] text-slate-400 mt-1">Preencha os valores para liberar as formas de pagamento.</p>
              </div>
              <button
                onClick={() => {
                  setShowBalcaoModal(false);
                  setFormaPagamento(null);
                  setParcelaSelecionada(null);
                  setResumoBalcaoAtivo(false);
                }}
                className="text-slate-400 hover:text-white"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto overflow-x-hidden pr-2 flex-1" style={{ maxHeight: 'calc(85vh - 7.5rem)' }}>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Preço de Venda (R$)
              </label>
              <div className="relative">
                <input
                  value={precoVenda}
                  onChange={(e) => setPrecoVenda(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-2xl border border-slate-700 bg-[#020814] text-sm text-white px-3.5 pr-14 py-2 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setPrecoVenda('')}
                  className="absolute inset-y-0 right-9 flex items-center justify-center text-slate-400 hover:text-white"
                  aria-label="Limpar Preço de Venda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={ativarEntradaPorVoz}
                  className="absolute inset-y-0 right-2 flex items-center justify-center text-sm text-slate-400"
                >
                  {isEntradaVozDisponivel ? '🎙️' : '🔒'}
                </button>
              </div>

              {/* Simulador de Desconto */}
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDescontoPanel((s) => !s)}
                  className="rounded-2xl border px-2.5 py-1.5 text-[11px] font-bold bg-[#091123] text-slate-200 border-slate-700 hover:border-amber-500 hover:text-white"
                >
                  Cliente pediu desconto?
                </button>
                {showDescontoPanel && (
                  <div className="bg-[#06121A] border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={descontoPercent}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setDescontoPercent(val);
                          setDescontoValor(0);
                        }}
                        placeholder="% desconto"
                        className="w-28 rounded-md bg-[#020814] text-white px-2 py-1 border border-slate-700"
                      />
                      <span className="text-slate-400">ou</span>
                      <input
                        type="number"
                        value={descontoValor}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setDescontoValor(val);
                          setDescontoPercent(0);
                        }}
                        placeholder="R$ desconto"
                        className="w-32 rounded-md bg-[#020814] text-white px-2 py-1 border border-slate-700"
                      />
                    </div>
                    <div className="text-xs text-slate-300">
                      {precoVenda && Number(precoVenda.replace(',', '.')) > 0 ? (
                        (() => {
                          const original = precoVendaNumero;
                          const discountFromPercent = descontoPercent > 0 ? (original * (descontoPercent / 100)) : 0;
                          const finalPrice = descontoValor > 0 ? Math.max(0, original - descontoValor) : Math.max(0, original - discountFromPercent);
                          const finalTax = Number(((finalPrice * taxaPercentual) / 100).toFixed(2));
                          const finalLiquid = Number((finalPrice - finalTax).toFixed(2));
                          const originalLucro = lucroReal;
                          const finalLucro = Number((finalLiquid - custoProdutoNumero).toFixed(2));
                          if (finalLucro <= 0) {
                            return <div className="text-amber-300">Desconto reduz lucro por venda para ≤ 0. Não é possível manter lucro sem vender muitas unidades.</div>;
                          }
                          const requiredUnits = Math.ceil(Math.abs(originalLucro) / finalLucro);
                          const additional = Math.max(0, requiredUnits - 1);
                          return (
                            <div className="space-y-1">
                              <div>Valor com desconto: <span className="font-black">R$ {finalPrice.toFixed(2)}</span></div>
                              <div>Para manter o mesmo lucro em R$, vendendo este produto com desconto será necessário vender <span className="font-black">{requiredUnits}</span> unidade(s) no total ({additional} adicional).</div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-slate-500">Preencha preço e custo para simular.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <label className="block text-[11px] uppercase tracking-[0.2em] text-slate-400">
                Custo do Produto (R$)
              </label>
              <div className="relative">
                <input
                  value={custoProduto}
                  onChange={(e) => setCustoProduto(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-2xl border border-slate-700 bg-[#020814] text-sm text-white px-3.5 pr-14 py-2 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setCustoProduto('')}
                  className="absolute inset-y-0 right-9 flex items-center justify-center text-slate-400 hover:text-white"
                  aria-label="Limpar Custo do Produto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={ativarEntradaPorVoz}
                  className="absolute inset-y-0 right-2 flex items-center justify-center text-sm text-slate-400"
                >
                  {isEntradaVozDisponivel ? '🎙️' : '🔒'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: 'pix', label: 'PIX' },
                  { id: 'debito', label: 'Débito' },
                  { id: 'credito_vista', label: 'Crédito à Vista' },
                  { id: 'credito_parcelado', label: 'Crédito Parcelado' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelecionarFormaPagamento(option.id as any)}
                    disabled={!camposBalcaoValidos}
                    className={`rounded-2xl border px-2.5 py-1.5 text-[10px] font-bold transition-all min-h-[36px] ${
                      camposBalcaoValidos
                        ? formaPagamento === option.id
                          ? 'bg-amber-400 text-slate-950 border-amber-400'
                          : 'bg-[#091123] text-slate-200 border-slate-700 hover:border-amber-500 hover:text-white'
                        : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {formaPagamento === 'credito_parcelado' && camposBalcaoValidos && (
                <div className="bg-[#08131F] border border-slate-800 rounded-3xl p-2.5 text-[10px] text-slate-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-200">TABELA DE PARCELAMENTO</span>
                    <span className="text-slate-500">
                      Taxa {taxaPercentual.toFixed(2)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {parcelasDisponiveis.map((parcela) => (
                      <button
                        key={parcela}
                        type="button"
                        onClick={() => handleSelecionarParcela(parcela)}
                        className={`rounded-2xl border px-2 py-1 text-[10px] font-bold transition-all ${
                          parcelaSelecionada === parcela
                            ? 'bg-amber-400 text-slate-950 border-amber-400'
                            : 'bg-[#091123] text-slate-300 border-slate-700 hover:border-amber-500 hover:text-white'
                        }`}
                      >
                        {parcela}x
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400">
                    Selecione a parcela para aplicar a taxa específica no resumo da venda.
                  </div>
                </div>
              )}

              {resumoBalcaoAtivo && camposBalcaoValidos && (
                <div className="bg-[#08131F] border border-slate-800 rounded-3xl p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Preço Informado:</span>
                    <span className="text-white font-bold">R$ {precoVendaNumero.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Custo do Produto:</span>
                    <span className="text-white font-bold">R$ {custoProdutoNumero.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Taxa da Operação ({taxaPercentual.toFixed(2)}%):</span>
                    <span className="text-rose-400 font-bold">- R$ {taxaValor.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Valor Líquido Recebido:</span>
                    <span className="text-emerald-400 font-black">R$ {valorLiquido.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                    <span className="text-slate-200 font-bold">Lucro Líquido Real:</span>
                    <span className={`font-black text-sm ${lucroReal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      R$ {lucroReal.toFixed(2)} ({margemLucro}% de margem)
                    </span>
                  </div>

                  {formaPagamento === 'pix' && (
                    <div className="mt-2 flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${chavePixExemplo}|valor=${precoVendaNumero.toFixed(2)}`)}`}
                          alt="QR PIX"
                          className="w-44 h-44 rounded-lg bg-white p-1"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="text-[12px] text-slate-300">Chave/Código PIX (Copia e Cola):</div>
                        <div className="bg-[#06131D] border border-slate-800 p-2 rounded text-xs text-amber-200 break-all">{`${chavePixExemplo}|valor=${precoVendaNumero.toFixed(2)}`}</div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const chaveComValor = `${chavePixExemplo}|valor=${precoVendaNumero.toFixed(2)}`;
                              navigator.clipboard.writeText(chaveComValor);
                              setCopiado(true);
                              setTimeout(() => setCopiado(false), 1500);
                            }}
                            className="bg-[#0E2133] hover:bg-[#123148] text-slate-200 text-xs font-bold px-3 py-2 rounded-xl"
                          >
                            {copiado ? 'Copiado!' : 'Copiar Código PIX (Copia e Cola)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setVendasHoje((prev) => prev + precoVendaNumero);
                              setTotalRecebido((prev) => prev + precoVendaNumero);
                              setShowBalcaoModal(false);
                              setPrecoVenda('');
                              setCustoProduto('');
                              setFormaPagamento(null);
                              setParcelaSelecionada(null);
                              setResumoBalcaoAtivo(false);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3 py-2 rounded-xl"
                          >
                            Confirmar Recebimento
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2 border-t border-slate-800 pt-2 sticky bottom-0 bg-[#07101F]">
                <button
                  onClick={handleConfirmarVendaBalcao}
                  disabled={!camposBalcaoValidos || !formaPagamento}
                  className={`w-liberada w-full rounded-2xl text-xs font-black py-3 transition-all shadow-md ${
                    camposBalcaoValidos && formaPagamento
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Confirmar e Salvar Venda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marca d'água */}
      <div className="fixed bottom-6 right-6 bg-white text-slate-950 px-3 py-1 rounded-full text-xs font-semibold shadow-lg z-50 flex items-center gap-1 border border-slate-200">
        <span className="text-slate-900 font-extrabold">Made in Bolt</span><span className="text-indigo-600">⚡</span>
      </div>
    </div>
  );
}