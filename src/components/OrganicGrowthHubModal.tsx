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
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  PROMO_NARRATION_MP3_BASE64,
  PROMO_NARRATION_SCRIPT,
} from '../data/promoNarrationAudio';

interface OrganicGrowthHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminMode?: boolean;
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
const MAIN_FACEBOOK_CAPTION = `Para quem trabalha MUITO e não tem TEMPO de mexer em planilha: criei o “COPILOTO FINANCEIRO”, SUPER PRÁTICO, RÁPIDO e INTELIGENTE! Você aperta o microfone e fala "Vendi 350 reais no Pix" ou "Pagar fornecedor 200 reais"! Fecha Relatório Diário, Semanal e Mensal sozinho. Tem 30 DIAS GRÁTIS LIBERADOS!! https://copilotofinanc.app.br`;

const ORGANIC_TEMPLATES = [
  {
    id: 'voz',
    badge: '🔥 Vídeo 15s + Legenda Principal · Autônomos e Comércio',
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
  isAdminMode = false,
  onNavigateTab,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string>('Valparaíso e Região');
  const [videoTimeSec, setVideoTimeSec] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isRecordingWebm, setIsRecordingWebm] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startOrRestartWithNarration = (enableAudio = true) => {
    setVideoTimeSec(0);
    setIsPlayingVideo(true);
    setIsAudioEnabled(enableAudio);
    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.currentTime = 0;
      audioEl.muted = !enableAudio;
      if (enableAudio) {
        audioEl.play().catch(() => {
          // Browser autoplay policy fallback until user clicks
        });
      } else {
        audioEl.pause();
      }
    }
  };

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (!isOpen) {
      audioEl.pause();
      audioEl.currentTime = 0;
      return;
    }
    audioEl.muted = !isAudioEnabled;
    if (isPlayingVideo && isAudioEnabled && !isRecordingWebm) {
      audioEl.play().catch(() => {
        // Ignored if blocked before interaction
      });
    } else {
      audioEl.pause();
    }
  }, [isOpen, isPlayingVideo, isAudioEnabled, isRecordingWebm]);

  useEffect(() => {
    if (!isOpen || !isPlayingVideo) return;
    const startMs = performance.now() - videoTimeSec * 1000;
    let rafId = 0;

    const tick = (now: number) => {
      const audioEl = audioRef.current;
      if (
        audioEl &&
        isAudioEnabled &&
        !audioEl.paused &&
        !isRecordingWebm &&
        audioEl.currentTime > 0
      ) {
        if (audioEl.currentTime >= 14.95) {
          audioEl.currentTime = 0;
          audioEl.play().catch(() => {});
        }
        setVideoTimeSec(audioEl.currentTime % 15);
      } else {
        const elapsedSec = ((now - startMs) / 1000) % 15;
        setVideoTimeSec(elapsedSec);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, isPlayingVideo, isAudioEnabled, isRecordingWebm]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const t = videoTimeSec;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#090f1d');
    grad.addColorStop(0.5, '#111e38');
    grad.addColorStop(1, '#08101f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Top bar badge
    ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(36, 24, 520, 36, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.fillText('🔥 COPILOTOFINANC.APP.BR · SUPER PRÁTICO, RÁPIDO E INTELIGENTE', 52, 47);

    // Progress bar (0 to 15s)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(36, h - 22, w - 72, 8);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(36, h - 22, ((w - 72) * Math.min(t, 15)) / 15, 8);

    // Timer indicator
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`🎙️ ${t.toFixed(1)}s / 15.0s`, w - 155, 47);

    // 5 Dynamic Scenes synchronized with the exact narration timestamps
    if (t < 2.6) {
      // SCENE 1 (0s - 2.6s): "Para quem trabalha MUITO e não tem TEMPO de mexer em planilha:"
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.fillText('CENA 1/5 · ROTINA INTENSA E SEM PLANILHA', 42, 84);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'extrabold 32px Inter, system-ui, sans-serif';
      ctx.fillText('Para quem trabalha MUITO e', 42, 120);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('não tem TEMPO de mexer em planilha:', 42, 158);

      ctx.fillStyle = '#111a2e';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(42, 182, w - 84, 152, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 21px Inter, system-ui, sans-serif';
      ctx.fillText('⚡ Chega de perder horas digitando no Excel!', 66, 224);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'extrabold 25px Inter, system-ui, sans-serif';
      ctx.fillText('❌ Planilha Manual Travada  →  ✅ 0s no Celular', 66, 268);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px Inter, system-ui, sans-serif';
      ctx.fillText('Gestão Financeira Executiva Instantânea para o seu Negócio', 66, 308);
    } else if (t < 5.5) {
      // SCENE 2 (2.6s - 5.5s): "criei o “COPILOTO FINANCEIRO”, SUPER PRÁTICO, RÁPIDO e INTELIGENTE!"
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.fillText('CENA 2/5 · TECNOLOGIA DE PONTA INÉDITA', 42, 84);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'extrabold 31px Inter, system-ui, sans-serif';
      ctx.fillText('Criei o “COPILOTO FINANCEIRO”:', 42, 120);
      ctx.fillStyle = '#34d399';
      ctx.font = 'extrabold 29px Inter, system-ui, sans-serif';
      ctx.fillText('SUPER PRÁTICO, RÁPIDO e INTELIGENTE!', 42, 158);

      const pillars = [
        { title: '⚡ SUPER PRÁTICO', desc: 'Abre direto no celular ou PC sem instalar nada', color: '#fbbf24' },
        { title: '🚀 ULTRA RÁPIDO', desc: 'Lança qualquer venda ou conta em 3 segundos', color: '#10b981' },
        { title: '🧠 INTELIGENTE', desc: 'Separa Vendas, A Receber e A Pagar sozinho', color: '#38bdf8' },
      ];
      pillars.forEach((p, idx) => {
        const x = 42 + idx * 248;
        ctx.fillStyle = '#111a2e';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, 182, 236, 152, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = p.color;
        ctx.font = 'extrabold 19px Inter, system-ui, sans-serif';
        ctx.fillText(p.title, x + 16, 225);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 14px Inter, system-ui, sans-serif';
        ctx.fillText(p.desc.slice(0, 24), x + 16, 265);
        ctx.fillText(p.desc.slice(24), x + 16, 288);
      });
    } else if (t < 10.6) {
      // SCENE 3 (5.5s - 10.6s): "Você aperta o microfone e fala 'Vendi 350 reais no Pix' ou 'Pagar fornecedor 200 reais'!"
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.fillText('CENA 3/5 · COMANDO DE VOZ PELO MICROFONE', 42, 84);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'extrabold 31px Inter, system-ui, sans-serif';
      ctx.fillText('Você aperta o microfone e fala:', 42, 120);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillText('🎙️ Reconhecimento de Voz Financeiro Instantâneo:', 42, 155);

      ctx.fillStyle = '#111a2e';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(42, 178, w - 84, 156, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 19px Inter, system-ui, sans-serif';
      ctx.fillText('🔴 Microfone Ativo · Ouvindo sua voz na hora:', 66, 216);

      ctx.fillStyle = '#34d399';
      ctx.font = 'extrabold 26px Inter, system-ui, sans-serif';
      ctx.fillText('✅ "Vendi 350 reais no Pix"  (+ R$ 350,00)', 66, 262);

      ctx.fillStyle = '#f87171';
      ctx.font = 'extrabold 25px Inter, system-ui, sans-serif';
      ctx.fillText('📤 "Pagar fornecedor 200 reais"  (- R$ 200,00)', 66, 308);
    } else if (t < 13.0) {
      // SCENE 4 (10.6s - 13.0s): "Fecha Relatório Diário, Semanal e Mensal sozinho."
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.fillText('CENA 4/5 · FECHAMENTO AUTOMÁTICO SOZINHO', 42, 84);

      ctx.fillStyle = '#34d399';
      ctx.font = 'extrabold 31px Inter, system-ui, sans-serif';
      ctx.fillText('Fecha Relatório Diário, Semanal', 42, 120);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'extrabold 28px Inter, system-ui, sans-serif';
      ctx.fillText('e Mensal SOZINHO na hora!', 42, 156);

      const cards = [
        { label: 'RELATÓRIO DIÁRIO', val: '+ R$ 350 Pix', sub: '- R$ 200 Fornec.', color: '#38bdf8' },
        { label: 'RELATÓRIO SEMANAL', val: '100% Fechado', sub: 'Sem digitar nada', color: '#fbbf24' },
        { label: 'RELATÓRIO MENSAL', val: '+ R$ 150 Lucro', sub: 'DRE + Contador', color: '#10b981' },
      ];
      cards.forEach((c, idx) => {
        const x = 42 + idx * 248;
        ctx.fillStyle = '#111a2e';
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, 180, 236, 154, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 14px Inter, system-ui, sans-serif';
        ctx.fillText(c.label, x + 16, 218);

        ctx.fillStyle = c.color;
        ctx.font = 'extrabold 25px Inter, system-ui, sans-serif';
        ctx.fillText(c.val, x + 16, 262);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 15px Inter, system-ui, sans-serif';
        ctx.fillText(c.sub, x + 16, 302);
      });
    } else {
      // SCENE 5 (13.0s - 15.0s): "Tem 30 DIAS GRÁTIS LIBERADOS!!"
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.fillText('CENA 5/5 · ACESSO IMEDIATO LIBERADO', 42, 84);

      ctx.fillStyle = '#10b981';
      ctx.font = 'extrabold 34px Inter, system-ui, sans-serif';
      ctx.fillText('🎁 Tem 30 DIAS GRÁTIS LIBERADOS!!', 42, 124);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 21px Inter, system-ui, sans-serif';
      ctx.fillText('SUPER PRÁTICO, RÁPIDO e INTELIGENTE no celular ou PC:', 42, 160);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(42, 186, w - 84, 134, 20);
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.font = 'extrabold 34px Inter, system-ui, sans-serif';
      ctx.fillText('👉 copilotofinanc.app.br', 145, 246);
      ctx.font = 'bold 19px Inter, system-ui, sans-serif';
      ctx.fillText('Sem cartão de crédito · Comece em 1 clique!', 160, 290);
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

  const handleDownloadAudioMp3 = () => {
    const binary = atob(PROMO_NARRATION_MP3_BASE64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'copiloto-narracao-vanguarda-15s.mp3';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadVideo15s = async () => {
    // First try instant download of the pre-rendered HD .mp4 with studio narration
    try {
      const mp4Res = await fetch('/copiloto-financeiro-15s.mp4');
      if (
        mp4Res.ok &&
        (mp4Res.headers.get('content-type') || '').includes('video')
      ) {
        const mp4Blob = await mp4Res.blob();
        if (mp4Blob.size > 50000) {
          const url = URL.createObjectURL(mp4Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'copiloto-financeiro-15s-narrado.mp4';
          a.click();
          URL.revokeObjectURL(url);
          return;
        }
      }
    } catch {
      // Fallback to live canvas + AudioContext recording below
    }

    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === 'undefined') return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsRecordingWebm(true);
    setVideoTimeSec(0);
    setIsPlayingVideo(true);

    try {
      const canvasStream = canvas.captureStream(30);
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new AudioCtx();
      const binary = atob(PROMO_NARRATION_MP3_BASE64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decodedBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = decodedBuffer;

      const streamDest = audioCtx.createMediaStreamDestination();
      sourceNode.connect(streamDest);
      sourceNode.connect(audioCtx.destination);

      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...streamDest.stream.getAudioTracks(),
      ]);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'copiloto-financeiro-15s-narrado.webm';
        a.click();
        URL.revokeObjectURL(url);
        audioCtx.close().catch(() => {});
        setIsRecordingWebm(false);
      };

      setVideoTimeSec(0);
      sourceNode.start(0);
      recorder.start();

      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, 15000);
    } catch {
      // Fallback if AudioContext fails
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'copiloto-financeiro-15s-narrado.webm';
        a.click();
        URL.revokeObjectURL(url);
        setIsRecordingWebm(false);
      };
      recorder.start();
      setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, 15000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#111a2e] border border-amber-500/40 rounded-2xl max-w-4xl w-full p-4 sm:p-6 space-y-5 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
        <audio
          ref={audioRef}
          src={`data:audio/mp3;base64,${PROMO_NARRATION_MP3_BASE64}`}
          preload="auto"
          loop
        />
        {/* TOP HEADER WITH VISIBLE X BUTTON */}
        <div className="flex items-start justify-between gap-3 border-b border-[#1e2d4a] pb-4 sticky top-0 bg-[#111a2e] z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              <Sparkles className="w-3 h-3" />
              {isAdminMode
                ? 'Vitrine do Cliente + Máquina de Divulgação Orgânica (Admin)'
                : 'Apresentação Oficial & Demonstração em 15 Segundos'}
            </span>
            <h2 className="text-lg sm:text-2xl font-extrabold text-white mt-1">
              Copiloto Financeiro · SUPER PRÁTICO, RÁPIDO e INTELIGENTE!
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Assista à demonstração de 15 segundos com narração ou clique nas ferramentas abaixo para testar no seu negócio agora mesmo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Apresentação e Demonstração"
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
                Vídeo de Apresentação e Demonstração (15s com Locução Executiva)
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-1">
                Veja como o Copiloto Financeiro funciona na prática em 15 segundos
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => startOrRestartWithNarration(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>🔊 Ouvir do Início c/ Narração</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAudioEnabled((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg bg-[#162238] hover:bg-[#1f304d] border border-[#2a3f66] text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {isAudioEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Som: Ligado</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Som: Mudo</span>
                  </>
                )}
              </button>
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
                onClick={() => startOrRestartWithNarration(isAudioEnabled)}
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

          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-[11px] text-emerald-200 leading-snug">
              <strong className="text-emerald-400">🎙️ Locução Vanguarda Executiva (15s):</strong>{' '}
              {PROMO_NARRATION_SCRIPT}
            </div>
            <button
              type="button"
              onClick={handleDownloadAudioMp3}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold shrink-0 cursor-pointer"
            >
              🎵 Baixar Narração (.mp3)
            </button>
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
                  ? 'Gravando 15s c/ Narração...'
                  : '🎥 Baixar Vídeo 15s c/ Narração (.mp4)'}
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
              const fullShareText = buildFacebookPayloadWithVideoLink(tpl.text);
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullShareText)}`;
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
                    <div className="p-2.5 rounded-lg bg-[#111a2e] border border-[#1e2d4a] text-xs text-slate-200 leading-relaxed space-y-1.5">
                      <div>{message}</div>
                      <div className="text-sky-400 font-semibold pt-1 border-t border-[#1e2d4a]/80">
                        🎬 Assista ao Vídeo de 15s: {PROMO_VIDEO_SHARE_URL}
                      </div>
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
                      className="py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                          <span>✅ Link + Legenda Copiados!</span>
                        </>
                      ) : (
                        <span>📋 Copiar p/ Face (Link do Vídeo + Legenda)</span>
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
