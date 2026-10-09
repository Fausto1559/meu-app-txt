import React, { useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  Crown,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface OrganicGrowthHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (
    tab:
      | 'painel'
      | 'calculadora'
      | 'fechamento'
      | 'contador'
      | 'openfinance'
      | 'webhooks'
      | 'perfil'
  ) => void;
}

const ORGANIC_TEMPLATES = [
  {
    id: 'maquininha',
    badge: 'Isca #1 · Comércio Local & Lojistas',
    title: 'Calculadora Anti-Prejuízo de Maquininha (2x a 12x)',
    target: 'Grupos de Comércio Local, Feira do Rolo, Lojistas e Prestadores da Região',
    text: `Pessoal que vende na maquininha (Stone, Ton, PagBank, Mercado Pago, Cielo, InfinitePay) aqui na região: liberei uma Calculadora Gratuita que mostra exatamente quanto cobrar do cliente no Débito, 1x ou Parcelado de 2x a 12x para não perder 1 centavo de lucro na taxa da maquininha! Dá até para falar o valor pelo microfone no celular. Testem grátis: https://copilotofinanc.app.br`,
  },
  {
    id: 'mei_pme',
    badge: 'Isca #2 · MEI, Pequenas e Médias Empresas',
    title: 'Termômetro de Limite Fiscal MEI (R$ 81 mil) e Simples (R$ 360 mil)',
    target: 'Grupos de Empreendedores, MEI, Associações Comerciais e Grupos Regionais',
    text: `Quem é MEI ou Pequena Empresa (Simples Nacional) aqui da região: coloquei no ar um Termômetro Fiscal gratuito que soma suas vendas e avisa quanto falta para atingir o limite de R$ 81 mil (MEI) ou R$ 360 mil (ME) antes de ser desenquadrado de surpresa. Abre direto no celular sem precisar baixar nada: https://copilotofinanc.app.br`,
  },
  {
    id: 'voz',
    badge: 'Isca #3 · Autônomos, Oficinas e Correria do Dia a Dia',
    title: 'Controle de Caixa por Comando de Voz (Sem Planilha)',
    target: 'Grupos de Prestadores de Serviço, Instaladores, Oficinas, Lanchonetes e Salões',
    text: `Para quem trabalha na correria e não tem tempo de mexer em planilha: criei o Copiloto Financeiro onde você aperta o microfone e fala "Vendi 350 reais no Pix" ou "Pagar fornecedor 200 reais" e ele já fecha o relatório Diário, Semanal e Mensal sozinho. Tem 30 dias grátis liberados: https://copilotofinanc.app.br`,
  },
  {
    id: 'contadores',
    badge: 'Isca #4 · Parceria com Escritórios de Contabilidade',
    title: 'Convite para Contadores da Cidade e Região (Escala em Lote)',
    target: 'WhatsApp de Contadores e Escritórios Contábeis da Região',
    text: `Olá! Desenvolvi o Copiloto Financeiro (https://copilotofinanc.app.br) com uma Central do Contador exclusiva: seus clientes MEI, ME e EPP lançam Vendas, A Receber e A Pagar por voz no celular, acompanham o Termômetro de Desenquadramento Fiscal (R$ 81 mil / R$ 360 mil / R$ 4,8 milhões) e exportam o lote contábil em .CSV pronto para o seu escritório em 1 clique. Posso liberar acesso gratuito para seus clientes testarem?`,
  },
];

export const OrganicGrowthHubModal: React.FC<OrganicGrowthHubModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string>('Valparaíso e Região');

  if (!isOpen) return null;

  const customizeText = (raw: string) =>
    cityName.trim()
      ? raw
          .replace('aqui na região', `aqui em ${cityName.trim()}`)
          .replace('aqui da região', `aqui de ${cityName.trim()}`)
      : raw;

  const handleCopyText = (id: string, text: string) => {
    const finalMsg = customizeText(text);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(finalMsg);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#111a2e] border border-amber-500/40 rounded-2xl max-w-4xl w-full p-4 sm:p-6 space-y-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-[#1e2d4a] pb-4 sticky top-0 bg-[#111a2e] z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              <Sparkles className="w-3 h-3" />
              Landing Page & Máquina de Divulgação Orgânica (Custo R$ 0,00)
            </span>
            <h2 className="text-lg sm:text-2xl font-extrabold text-white mt-1">
              Copiloto Financeiro · Tudo para MEI, Pequenas e Médias Empresas
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Apresente os benefícios do <strong>copilotofinanc.app.br</strong> ou dispare nos grupos locais e regionais do WhatsApp e Facebook em 1 clique.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Vitrine e Divulgação"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold cursor-pointer shrink-0"
          >
            <span>✕ Fechar</span>
          </button>
        </div>

        <div className="bg-gradient-to-br from-[#0b1120] via-[#101c35] to-[#0b1120] border border-[#1e2d4a] rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-amber-400 flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Por que todo Comerciante, MEI e PME precisa do Copiloto Financeiro?
              </h3>
              <p className="text-xs text-slate-300">
                Clique em qualquer ferramenta abaixo para demonstrar ao vivo para um cliente ou parceiro:
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold self-start md:self-auto">
              ✅ 30 Dias Grátis · Sem Cartão
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#111a2e] border border-amber-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-1">
                  <span>1. Calculadora 2x a 12x</span>
                  <Calculator className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-300">
                  Mostra a taxa exata da maquininha (Débito, 1x e 2x a 12x) e quanto cobrar para não perder lucro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onNavigateTab('calculadora');
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Abrir Calculadora 2x-12x
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111a2e] border border-sky-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-sky-300 mb-1">
                  <span>2. Termômetro MEI & PME</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-300">
                  Alerta quanto falta para desenquadrar no MEI (R$ 81 mil), Pequena Empresa (R$ 360 mil) e Média/EPP (R$ 4,8 mi).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onNavigateTab('contador');
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Abrir Termômetro Fiscal
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111a2e] border border-emerald-500/30 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-1">
                  <span>3. Caixa por Voz + DRE</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-300">
                  Lance Vendas, A Receber e A Pagar falando no microfone e feche o caixa Diário, Semanal e Mensal na hora.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onNavigateTab('painel');
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Testar Lançamento por Voz
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                Kit de Divulgação Orgânica para Grupos da Cidade e Região
              </h3>
              <p className="text-xs text-slate-400">
                Personalize o nome da sua cidade/região e envie nos grupos de WhatsApp ou copie para o Facebook/Instagram:
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300 whitespace-nowrap">
                Cidade / Região:
              </label>
              <input
                type="text"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                placeholder="Ex: Valparaíso, Araçatuba, Dracena..."
                className="bg-[#0b1120] border border-[#1e2d4a] rounded-lg px-3 py-1.5 text-xs text-white w-48"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ORGANIC_TEMPLATES.map((tpl) => {
              const message = customizeText(tpl.text);
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
              const isCopied = copiedId === tpl.id;

              return (
                <div
                  key={tpl.id}
                  className="bg-[#0b1120] border border-[#1e2d4a] rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <span className="inline-block px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                      {tpl.badge}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      {tpl.title}
                    </h4>
                    <p className="text-[11px] text-sky-300">
                      🎯 Onde postar: {tpl.target}
                    </p>
                    <div className="p-2.5 rounded-lg bg-[#111a2e] border border-[#1e2d4a] text-xs text-slate-200 leading-relaxed">
                      {message}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center transition-colors cursor-pointer"
                    >
                      📲 Enviar em Grupo de WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyText(tpl.id, tpl.text)}
                      className="py-2 px-3 rounded-lg bg-[#162238] hover:bg-[#1f304d] border border-[#2a3f66] text-slate-200 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Copiado!</span>
                        </>
                      ) : (
                        <span>📋 Copiar p/ Facebook</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};