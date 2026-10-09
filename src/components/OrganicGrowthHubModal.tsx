import React, { useEffect, useRef, useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  Crown,
  Download,
  Play,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Video,
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

const PROMO_VIDEO_SHARE_URL = 'https://copilotofinanc.app.br/?video=15s';
const MAIN_FACEBOOK_CAPTION = `Para quem trabalha na correria e não tem tempo de mexer em planilha: criei o Copiloto Financeiro onde você aperta o microfone e fala "Vendi 350 reais no Pix" ou "Pagar fornecedor 200 reais" e ele já fecha o relatório Diário, Semanal e Mensal sozinho. Tem 30 dias grátis liberados: https://copilotofinanc.app.br`;

const ORGANIC_TEMPLATES = [
  {
    id: 'voz',
    badge: '🔥 Vídeo 15s + Legenda Principal · Autônomos, Comércio e Correria',
    title: 'Controle de Caixa por Comando de Voz (Sem Planilha) + Vídeo 15s',
    target: 'Feed/Reels do Facebook, Grupos Locais, Oficinas, Lojistas e Prestadores',
    text: MAIN_FACEBOOK_CAPTION,
  },
  {
    id: 'maquininha',
    badge: 'Isca #2 · Comércio Local & Lojistas',
    title: 'Calculadora Anti-Prejuízo de Maquininha (2x a 12x)',
    target: 'Grupos de Comércio Local, Feira do Rolo, Lojistas e Prestadores da Região',
    text: `Pessoal que vende na maquininha (Stone, Ton, PagBank, Mercado Pago, Cielo, InfinitePay) aqui na região: liberei uma Calculadora Gratuita que mostra exatamente quanto cobrar do cliente no Débito, 1x ou Parcelado de 2x a 12x para não perder 1 centavo de lucro na taxa da maquininha! Dá até para falar o valor pelo microfone no celular. Testem grátis: https://copilotofinanc.app.br`,
  },
  {
    id: 'mei_pme',
    badge: 'Isca #3 · MEI, Pequenas e Médias Empresas',
    title: 'Termômetro de Limite Fiscal MEI (R$ 81 mil) e Simples (R$ 360 mil)',
    target: 'Grupos de Empreendedores, MEI, Associações Comerciais e Grupos Regionais',
    text: `Quem é MEI ou Pequena Empresa (Simples Nacional) aqui da região: coloquei no ar um Termômetro Fiscal gratuito que soma suas vendas e avisa quanto falta para atingir o limite de R$ 81 mil (MEI) ou R$ 360 mil (ME) antes de ser desenquadrado de surpresa. Abre direto no celular sem precisar baixar nada: https://copilotofinanc.app.br`,
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
  const [videoTimeSec, setVideoTimeSec] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [isRecordingWebm, setIsRecordingWebm] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !isPlayingVideo) return;
    const startMs = performance.now() - videoTimeSec * 1000;
    let rafId = 0;

    const tick = (now: number) => {
      const elapsedSec = ((now - startMs) / 1000) % 15;
      setVideoTimeSec(elapsedSec);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, isPlayingVideo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const t = videoTimeSec;

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#090f1d');
    grad.addColorStop(0.5, '#111e38');
    grad.addColorStop(1, '#08101f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(36, 24, 340, 36, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px Inter, system-ui, sans-serif';
    ctx.fillText('🔥 COPILOTOFINANC.APP.BR · 15s DEMO', 54, 47);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(36, h - 22, w - 72, 8);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(36, h - 22, ((w - 72) * Math.min(t, 15)) / 15, 8);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${t.toFixed(1)}s / 15.0s`, w - 135, 47);

    if (t < 3) {
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'extrabold 32px Inter, system-ui, sans-serif';
      ctx.fillText('Trabalha na correria e não tem', 42, 115);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('tempo de mexer em planilha?', 42, 155);

      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(42, 185, w - 84, 150, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillText('🎙️ Aperte o Microfone e Fale:', 68, 230);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Inter, system-ui, sans-serif';
      ctx.fillText('"Vendi 350 reais no Pix"', 68, 272);

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.fillText('"Pagar fornecedor 200 reais"', 68, 310);
    } else if (t < 6) {
      ctx.fillStyle = '#34d399';
      ctx.font = 'extrabold 30px Inter, system-ui, sans-serif';
      ctx.fillText('Relatório Diário, Semanal e Mensal', 42, 110);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillText('O sistema calcula Vendas, A Receber e A Pagar sozinho:', 42, 145);

      const cards = [
        { label: 'VENDAS (PIX/CARTÃO)', val: '+ R$ 350,00', color: '#10b981' },
        { label: 'CONTAS A PAGAR', val: '- R$ 200,00', color: '#f43f5e' },
        { label: 'LUCRO LÍQUIDO NA HORA', val: '+ R$ 150,00', color: '#fbbf24' },
      ];
      cards.forEach((c, idx) => {
        const x = 42 + idx * 245;
        ctx.fillStyle = '#111a2e';
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, 175, 230, 155, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 13px Inter, system-ui, sans-serif';
        ctx.fillText(c.label, x + 16, 220);

        ctx.fillStyle = c.color;
        ctx.font = 'extrabold 26px Inter, system-ui, sans-serif';
        ctx.fillText(c.val, x + 16, 275);
      });
    } else if (t < 9) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'extrabold 30px Inter, system-ui, sans-serif';
      ctx.fillText('Calculadora Anti-Prejuízo (2x a 12x)', 42, 110);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 20px Inter, system-ui, sans-serif';
      ctx.fillText('Descubra quanto cobrar no Débito, 1x ou Parcelado 2x a 12x:', 42, 145);

      ctx.fillStyle = '#111a2e';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(42, 175, w - 84, 155, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillText('💳 Venda de R$ 1.000 em 6x sem perder lucro:', 66, 220);
      ctx.fillStyle = '#34d399';
      ctx.font = 'extrabold 26px Inter, system-ui, sans-serif';
      ctx.fillText('Cobre R$ 1.119,69 (6x de R$ 186,62) → Receba R$ 1.000 limpos!', 66, 268);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.fillText('Compatível com Ton, Stone, Mercado Pago, PagBank, Cielo e InfinitePay', 66, 308);
    } else if (t < 12) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'extrabold 30px Inter, system-ui, sans-serif';
      ctx.fillText('Termômetro Fiscal MEI, ME e EPP', 42, 110);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 20px Inter, system-ui, sans-serif';
      ctx.fillText('Alerta antes de estourar o teto + Lote CSV p/ seu Contador:', 42, 145);

      ctx.fillStyle = '#111a2e';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(42, 175, w - 84, 155, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 21px Inter, system-ui, sans-serif';
      ctx.fillText('🛡️ Limite MEI: R$ 81.000/ano  |  Simples ME: R$ 360.000/ano', 66, 222);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(66, 245, w - 132, 22);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(66, 245, (w - 132) * 0.62, 22);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 18px Inter, system-ui, sans-serif';
      ctx.fillText('📊 Exportação Contábil em 1 Clique para o Escritório', 66, 305);
    } else {
      ctx.fillStyle = '#10b981';
      ctx.font = 'extrabold 34px Inter, system-ui, sans-serif';
      ctx.fillText('🎁 30 DIAS GRÁTIS LIBERADOS!', 42, 115);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.fillText('Sem planilha, direto no celular ou computador:', 42, 158);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(42, 190, w - 84, 120, 20);
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.font = 'extrabold 34px Inter, system-ui, sans-serif';
      ctx.fillText('👉 copilotofinanc.app.br', 145, 255);
      ctx.font = 'bold 18px Inter, system-ui, sans-serif';
      ctx.fillText('Acesse agora e fale pelo microfone em 3 segundos!', 155, 290);
    }
  }, [videoTimeSec]);

  if (!isOpen) return null;

  const customizeText = (raw: string) =>
    cityName.trim()
      ? raw
          .replace('aqui na região', `aqui em ${cityName.trim()}`)
          .replace('aqui da região', `aqui de ${cityName.trim()}`)
      : raw;

  const buildFacebookPayloadWithVideoLink = (rawText: string) => {
    const base = customizeText(rawText);
    return `${base}\n\n🎬 Assista ao Vídeo de 15s: ${PROMO_VIDEO_SHARE_URL}`;
  };

  const handleCopyText = (id: string, text: string) => {
    const finalMsg = buildFacebookPayloadWithVideoLink(text);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(finalMsg);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadVideo15s = () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === 'undefined') return;
    setIsRecordingWebm(true);
    setVideoTimeSec(0);
    setIsPlayingVideo(true);

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
    });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'copiloto-financeiro-15s.webm';
      a.click();
      URL.revokeObjectURL(url);
      setIsRecordingWebm(false);
    };
    recorder.start();
    setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop();
    }, 15000);
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

        {/* SECTION 0: 15-SECOND ANIMATED PROMO VIDEO + 1-CLICK COPY FOR FACEBOOK */}
        <div className="bg-gradient-to-br from-[#0b1120] via-[#131f3a] to-[#0b1120] border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                <Video className="w-3.5 h-3.5" />
                Vídeo Animado Oficial de 15 Segundos · Pronto para Facebook, Reels e WhatsApp
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-1">
                Principais Funcionalidades do copilotofinanc.app.br em 15s
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlayingVideo((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg bg-[#162238] hover:bg-[#1f304d] border border-[#2a3f66] text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>{isPlayingVideo ? 'Pausar' : 'Reproduzir'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setVideoTimeSec(0);
                  setIsPlayingVideo(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#162238] hover:bg-[#1f304d] border border-[#2a3f66] text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                <span>Reiniciar 15s</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-[#1e2d4a] bg-[#070b14] shadow-inner">
            <canvas
              ref={canvasRef}
              width={820}
              height={370}
              className="w-full h-auto block"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#0b1120] border border-[#1e2d4a] space-y-2">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
              📋 Legenda + Link do Vídeo que serão copiados ao clicar em &ldquo;Copiar p/ Face&rdquo;:
            </div>
            <p className="text-xs text-slate-200 leading-relaxed select-all">
              {MAIN_FACEBOOK_CAPTION}
              <br />
              <span className="text-sky-400 font-semibold">
                🎬 Assista ao Vídeo de 15s: {PROMO_VIDEO_SHARE_URL}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleCopyText('main_video_face', MAIN_FACEBOOK_CAPTION)}
              className="flex-1 min-w-[220px] py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2 shadow-lg"
            >
              {copiedId === 'main_video_face' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>✅ Link do Vídeo + Legenda Copiados p/ Facebook!</span>
                </>
              ) : (
                <span>📋 Copiar p/ Face (Link do Vídeo + Legenda)</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadVideo15s}
              disabled={isRecordingWebm}
              className="py-2.5 px-4 rounded-xl bg-[#162238] hover:bg-[#1f304d] border border-[#2a3f66] text-slate-200 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>
                {isRecordingWebm
                  ? 'Gravando 15s (aguarde)...'
                  : '🎥 Baixar Arquivo de Vídeo (15s)'}
              </span>
            </button>
          </div>
        </div>

        {/* SECTION 1: HIGH-CONVERSION LANDING PAGE SHOWCASE */}
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

        {/* SECTION 2: LOCAL & REGIONAL ORGANIC WHATSAPP / FACEBOOK SCRIPTS */}
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