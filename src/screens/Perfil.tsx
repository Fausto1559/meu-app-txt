import React, { useState } from 'react';
import { db, auth } from "../services/firebaseConfig";
import { deleteDoc, doc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";

export function Perfil({ onClose, userData }: any) {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // 1. Exportar Dados (Portabilidade LGPD)
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData || {}, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `meus-dados-copiloto-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 2. Exclusão Definitiva com Validação Por Digitação
  const handleDeleteAccount = async () => {
    if (confirmText.toUpperCase() !== 'EXCLUIR') {
      alert('Digite EXCLUIR para confirmar a remoção.');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, "users", user.uid));
        await deleteUser(user);
        alert("Sua conta e todos os seus dados foram excluídos com sucesso.");
      }
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      alert("Por segurança, faça login novamente antes de realizar a exclusão da conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl max-w-lg w-full border border-slate-800 shadow-2xl space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h2 className="text-xl font-bold">Perfil e Configurações</h2>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
        )}
      </div>

      {/* 1. Transparência & Portabilidade (LGPD) */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Seus Dados e Privacidade
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* BOTÃO EXPORTAR DADOS */}
          <button
            onClick={handleExportData}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-4 rounded-xl font-medium border border-slate-700 text-sm transition-all"
          >
            📥 Exportar Meus Dados
          </button>

          {/* LINK POLÍTICA DE PRIVACIDADE */}
          <a
            href="/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-4 rounded-xl font-medium border border-slate-700 text-sm text-center transition-all"
          >
            📄 Política de Privacidade
          </a>
        </div>
      </div>

      {/* 2. Zona de Perigo (Exclusão) */}
      <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-4 space-y-3">
        <h3 className="text-red-400 font-bold text-base">Zona de Perigo (Conformidade LGPD)</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Conforme a Lei Geral de Proteção de Dados, você tem o direito de apagar suas informações. Esta ação excluirá permanentemente seu usuário e todo o seu histórico financeiro do banco de dados.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all"
          >
            Excluir Minha Conta e Apagar Todos os Dados
          </button>
        ) : (
          <div className="space-y-2 pt-2 border-t border-red-900/60">
            <p className="text-xs text-red-300 font-semibold">
              Para confirmar, digite <span className="underline font-bold">EXCLUIR</span> abaixo:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite EXCLUIR"
              className="w-full bg-slate-950 border border-red-800 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs"
              >
                {loading ? "Excluindo..." : "Confirmar Exclusão Definitiva"}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); }}
                className="bg-slate-800 text-slate-300 py-2 px-3 rounded-lg text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default Perfil;