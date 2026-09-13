import React, { useState } from 'react';
import { auth } from '../services/firebaseConfig';
import { saveUserRecord } from '../services/firestoreService';

export function FechamentoDiario() {
  const [saldoInicial, setSaldoInicial] = useState('');
  const [entradasDinheiro, setEntradasDinheiro] = useState('');
  const [saidas, setSaidas] = useState('');

  const numSaldoInicial = parseFloat(saldoInicial.replace(',', '.')) || 0;
  const numEntradas = parseFloat(entradasDinheiro.replace(',', '.')) || 0;
  const numSaidas = parseFloat(saidas.replace(',', '.')) || 0;

  const saldoFinalEsperado = numSaldoInicial + numEntradas - numSaidas;

  const novoFechamento = {
    data: new Date().toISOString(),
    saldoInicial: numSaldoInicial,
    entradasDinheiro: numEntradas,
    saidas: numSaidas,
    saldoFinalEsperado
  };

  const handleFinalizar = async () => {
    try {
      await saveUserRecord(auth.currentUser?.uid || '', 'fechamentos', novoFechamento);
      
      const salvos = JSON.parse(localStorage.getItem('copiloto_fechamentos') || '[]');
      localStorage.setItem('copiloto_fechamentos', JSON.stringify([novoFechamento, ...salvos]));
      
      alert('Fechamento finalizado, salvo no Firestore e enviado para a Central do Contador!');
    } catch (error) {
      console.error('Erro ao salvar no Firestore:', error);
      alert('Erro ao salvar no Firestore. Salvando localmente...');
      
      const existingFechamentos = JSON.parse(localStorage.getItem('copiloto_fechamentos') || '[]');
      localStorage.setItem(
        'copiloto_fechamentos',
        JSON.stringify([...existingFechamentos, novoFechamento])
      );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-[#111c32] border border-slate-800 p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-amber-400">📄</span> Fechamento Diário
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Conferência física, validação de maquininhas e encerramento de caixa.
          </p>
        </div>
      </div>

      <div className="bg-[#111c32] border border-slate-800 p-6 rounded-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Saldo Inicial</label>
            <input
              type="text"
              placeholder="0,00"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Entradas em Dinheiro</label>
            <input
              type="text"
              placeholder="0,00"
              value={entradasDinheiro}
              onChange={(e) => setEntradasDinheiro(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Saídas</label>
            <input
              type="text"
              placeholder="0,00"
              value={saidas}
              onChange={(e) => setSaidas(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
            />
          </div>
        </div>

        <div className="text-white text-lg font-semibold pt-4">
          Saldo Final Esperado: R$ {saldoFinalEsperado.toFixed(2).replace('.', ',')}
        </div>

        <button
          onClick={handleFinalizar}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded transition-colors"
        >
          Finalizar Fechamento
        </button>
      </div>
    </div>
  );
}