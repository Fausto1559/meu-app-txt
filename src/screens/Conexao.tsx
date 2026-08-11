// src/screens/Conexao.tsx
import type { Plan, ConnectedMachine } from '@/types';
import { Cpu, CheckCircle, Trash2, Plus } from 'lucide-react';

interface ConexaoProps {
  plan: Plan;
  connectedMachines: ConnectedMachine[];
  onConnect: (machine: ConnectedMachine) => void;
  onDisconnect: (id: string) => void;
  onDisconnectAll: () => void;
}

export default function Conexao({
  plan,
  connectedMachines,
  onConnect,
  onDisconnect,
  onDisconnectAll,
}: ConexaoProps) {
  const availableMachines = [
    { id: 'm-1', name: 'Stone / Ton' },
    { id: 'm-2', name: 'Cielo' },
    { id: 'm-3', name: 'Redecard' },
    { id: 'm-4', name: 'PagSeguro / PagBank' },
    { id: 'm-5', name: 'Getnet' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#C5A028]/20 border border-[#C5A028]/40 p-2.5 rounded-xl text-[#E5C158]">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Conexão de Maquininhas</h2>
            <p className="text-xs text-slate-400">Integre suas operadoras para captura automática de vendas.</p>
          </div>
        </div>

        {plan === 'gratis' ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-300">
            A conexão de maquininhas está disponível nos planos Copiloto e Copiloto Pro. Alterne o plano no cabeçalho para testar.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-200">Maquininhas Disponíveis</h3>
              {connectedMachines.length > 0 && (
                <button
                  onClick={onDisconnectAll}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Desconectar Todas
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableMachines.map((machine) => {
                const isConnected = connectedMachines.some((m) => m.id === machine.id);
                return (
                  <div
                    key={machine.id}
                    className="flex items-center justify-between bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl text-xs"
                  >
                    <span className="font-medium text-slate-200">{machine.name}</span>
                    {isConnected ? (
                      <button
                        onClick={() => onDisconnect(machine.id)}
                        className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Conectado
                      </button>
                    ) : (
                      <button
                        onClick={() => onConnect(machine)}
                        className="bg-[#C5A028]/20 hover:bg-[#C5A028]/30 text-[#E5C158] border border-[#C5A028]/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Conectar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
