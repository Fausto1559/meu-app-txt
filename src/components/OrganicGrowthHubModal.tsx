import React from 'react';
import { Video } from 'lucide-react';

interface OrganicGrowthHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminMode?: boolean;
  videoOnlyMode?: boolean;
  onNavigateTab?: (
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

export const OrganicGrowthHubModal: React.FC<OrganicGrowthHubModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#111a2e] border border-amber-500/40 rounded-2xl max-w-3xl w-full p-4 sm:p-5 space-y-3 shadow-2xl my-auto">
        <div className="flex items-center justify-between gap-3 border-b border-[#1e2d4a] pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Video className="w-4 h-4" />
              Apresentação &amp; Demonstração (15s)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Vídeo de Demonstração"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold cursor-pointer shrink-0"
          >
            <span>✕ Fechar</span>
          </button>
        </div>

        <div className="rounded-xl overflow-hidden border-2 border-amber-500/40 bg-[#070b14] shadow-2xl">
          <video
            src="/copiloto-financeiro-15s.mp4"
            controls
            autoPlay
            playsInline
            className="w-full h-auto block"
          >
            Seu navegador não suporta a reprodução de vídeo.
          </video>
        </div>
      </div>
    </div>
  );
};
