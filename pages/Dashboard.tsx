// src/pages/Dashboard/Dashboard.tsx
import { useState } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import type { FirefightPayload, MaquininhaConnection, Sale } from '@/types/firefight';
import EmergencyHeader from '@/components/dashboard/EmergencyHeader';
import DashboardNav from '@/components/dashboard/DashboardNav';
import CashFlowCards from '@/components/dashboard/CashFlowCards';
import PrioritiesList from '@/components/dashboard/PrioritiesList';

interface DashboardProps {
  data: FirefightPayload | null;
  loading: boolean;
  connections: MaquininhaConnection[];
  sales: Sale[];
  onRefresh: () => void;
  onOpenMaquininha: () => void;
  onOpenCalculator: () => void;
  onOpenPlans: () => void;
  onOpenPix: () => void;
  showToast: (msg: string) => void;
}

export default function Dashboard({
  data,
  loading,
  connections,
  sales,
  onRefresh,
  onOpenMaquininha,
  onOpenCalculator,
  onOpenPlans,
  onOpenPix,
  showToast,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'painel' | 'fechamento'>('painel');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24">
      {/* 1. Header do Modo Apaga Incêndio (Barra Vermelha Piscando) */}
      <EmergencyHeader statusCaixa={data?.status_caixa_semana ?? 'VERMELHO'} />

      {/* 2. Barra de Navegação e Atalhos Superiores */}
      <div className="max-w-7xl w-full mx-auto px-4 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <DashboardNav activeTab={activeTab} onChangeTab={setActiveTab} onOpenPlans={onOpenPlans} />
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={onOpenMaquininha}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
          >
            Conectar Maquininha ({connections.length})
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 transition-all"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Conteúdo Principal do Painel */}
      <main className="max-w-7xl w-full mx-auto px-4 mt-6 flex-1 flex flex-col gap-6">
        {activeTab === 'painel' ? (
          <>
            {/* Bloco de Prioridades / Apaga Incêndio */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Suas prioridades de hoje</h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Selecionamos as ações mais urgentes para colocar dinheiro na caixa e evitar prejuízos.
                  </p>
                </div>
              </div>
              <PrioritiesList priorities={data?.priorities ?? []} showToast={showToast} onOpenPix={onOpenPix} />
            </div>

            {/* Painel de Fluxo de Caixa */}
            <CashFlowCards sales={sales} />
          </>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Fechamento do Mês</h2>
            <p className="text-slate-400">Módulo de DRE e apuração de resultados em consolidação.</p>
          </div>
        )}
      </main>

      {/* 4. Botão da Calculadora reposicionado para o Canto Inferior Direito */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onOpenCalculator}
          className="w-14 h-14 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 border-2 border-slate-950"
          title="Calculadora Rápida / Simulação"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>
      </div>
    </div>
  );
}