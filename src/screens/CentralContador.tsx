import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, CreditCard, Truck, Copy, Send, Calendar, Trash2, Mic, MicOff } from 'lucide-react';

export function CentralContador() {
  const [fechamentos, setFechamentos] = useState<any[]>([]);
  
  const [faturamento, setFaturamento] = useState('0,00');
  const [taxas, setTaxas] = useState('0,00');
  const [despesas, setDespesas] = useState('0,00');

  const [ouvindoCampo, setOuvindoCampo] = useState<string | null>(null);

  useEffect(() => {
    const salvos = JSON.parse(localStorage.getItem('copiloto_fechamentos') || '[]');
    setFechamentos(salvos);

    const parseNum = (val: any) => {
      if (!val) return 0;
      return parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0;
    };

    const totalDinheiro = salvos.reduce((acc: number, f: any) => acc + parseNum(f.entradasDinheiro), 0);
    const totalPix = salvos.reduce((acc: number, f: any) => acc + parseNum(f.pixValue), 0);
    const totalDebito = salvos.reduce((acc: number, f: any) => acc + parseNum(f.debitoValue), 0);
    const totalCredito3x = salvos.reduce((acc: number, f: any) => acc + parseNum(f.credito3xValue), 0);
    const totalCredito12x = salvos.reduce((acc: number, f: any) => acc + parseNum(f.credito12xValue), 0);
    const totalBoletos = salvos.reduce((acc: number, f: any) => acc + parseNum(f.boletosValue), 0);
    const totalSaidas = salvos.reduce((acc: number, f: any) => acc + parseNum(f.saidasValue), 0);

    const calcFaturamento = totalDinheiro + totalPix + totalDebito + totalCredito3x + totalCredito12x + totalBoletos;
    const calcTaxas = (totalDebito * 0.0199) + (totalCredito3x * 0.0499) + (totalCredito12x * 0.1299);
    const calcDespesas = totalSaidas;

    setFaturamento(calcFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setTaxas(calcTaxas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setDespesas(calcDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, []);

  // Conversor preciso para voz e digitação
  const processarTextoParaMoeda = (texto: string) => {
    let lowerText = texto.toLowerCase().trim();
    let valorCalculado = 0;

    // Se o usuário falou "mil" (ex: dez mil, cem mil)
    if (lowerText.includes('mil')) {
      const partes = lowerText.split('mil');
      const numerosAntes = partes[0].replace(/\D/g, '');
      const multiplicador = numerosAntes ? Number(numerosAntes) : 1;
      valorCalculado = multiplicador * 1000;
      
      const numerosDepois = partes[1] ? partes[1].replace(/\D/g, '') : '';
      if (numerosDepois) {
        // Se após o mil houver centavos ou valor menor (ex: 500)
        valorCalculado += Number(numerosDepois);
      }
      return valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } 
    
    // Para valores normais sem a palavra mil (ex: 599,50 ou 150000 gerando dígitos)
    const digits = lowerText.replace(/\D/g, '');
    if (!digits) return '0,00';

    // Se a fala contém termos decimais ou é um valor comum, dividimos por 100 para respeitar os centavos (ex: 59950 vira 599,50)
    valorCalculado = Number(digits) / 100;

    return valorCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setter('0,00');
      return;
    }
    const val = Number(raw) / 100;
    setter(val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const ativarMicrofone = (campoNome: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz. Tente usar o Google Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setOuvindoCampo(campoNome);
    };

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      const valorFormatado = processarTextoParaMoeda(speechResult);
      setter(valorFormatado);
      setOuvindoCampo(null);
    };

    recognition.onerror = () => {
      setOuvindoCampo(null);
    };

    recognition.onend = () => {
      setOuvindoCampo(null);
    };

    recognition.start();
  };

  const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long' });
  const anoAtual = new Date().getFullYear();
  const mesFormatado = mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1);

  const mensagemContador = `Prezado(a) contador(a), segue o resumo operacional do meu negócio referente ao mês de ${mesFormatado} de ${anoAtual}. Faturamento Bruto: R$ ${faturamento}. Total Pago em Taxas de Cartão: R$ ${taxas}. Despesas Operacionais: R$ ${despesas}. Os extratos de Open Finance e XMLs de vendas consolidados estão anexados à plataforma. Fico à disposição para ajustes na guia do Simples.`;

  const handleCopiar = () => {
    navigator.clipboard.writeText(mensagemContador);
    alert('Mensagem copiada para a área de transferência!');
  };

  const handleWhatsApp = () => {
    const textoUrl = encodeURIComponent(mensagemContador);
    window.open(`https://wa.me/?text=${textoUrl}`, '_blank');
  };

  const limparHistorico = () => {
    if (confirm('Deseja realmente limpar todos os fechamentos salvos?')) {
      localStorage.removeItem('copiloto_fechamentos');
      setFechamentos([]);
      setFaturamento('0,00');
      setTaxas('0,00');
      setDespesas('0,00');
    }
  };

  const parseNumTable = (val: string) => {
    if (!val) return 0;
    return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* BLOCO 1: RESUMO MENSAL */}
      <div className="bg-[#1e293b] rounded-xl p-8 shadow-xl border border-slate-700/50">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-7 h-7 text-amber-400" />
            <h1 className="text-2xl font-bold text-white">Central do Contador</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Resumo operacional do mês para envio ao seu contador. Digite ou clique no microfone para ditar os valores.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Card 1: Faturamento */}
          <div className="bg-[#0f172a] border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold tracking-wider mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" /> FATURAMENTO BRUTO
              </div>
              {ouvindoCampo === 'faturamento' && (
                <span className="text-rose-400 animate-pulse text-[10px] uppercase font-bold">Ouvindo...</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-3xl font-black text-amber-400 border-b border-transparent focus-within:border-amber-400/50 pb-1 transition-colors">
              <span>R$</span>
              <input 
                type="text" 
                value={faturamento}
                onChange={(e) => handleManualChange(e, setFaturamento)}
                className="bg-transparent border-none outline-none w-full text-amber-400 p-0 m-0"
              />
              <button 
                onClick={() => ativarMicrofone('faturamento', setFaturamento)}
                className={`${ouvindoCampo === 'faturamento' ? 'text-rose-500 animate-bounce' : 'text-slate-500 hover:text-amber-400'} transition-colors cursor-pointer`} 
                title="Ditar valor por voz"
              >
                {ouvindoCampo === 'faturamento' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Card 2: Taxas */}
          <div className="bg-[#0f172a] border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold tracking-wider mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-pink-400" /> TAXAS DE CARTÃO
              </div>
              {ouvindoCampo === 'taxas' && (
                <span className="text-rose-400 animate-pulse text-[10px] uppercase font-bold">Ouvindo...</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-3xl font-black text-pink-400 border-b border-transparent focus-within:border-pink-400/50 pb-1 transition-colors">
              <span>R$</span>
              <input 
                type="text" 
                value={taxas}
                onChange={(e) => handleManualChange(e, setTaxas)}
                className="bg-transparent border-none outline-none w-full text-pink-400 p-0 m-0"
              />
              <button 
                onClick={() => ativarMicrofone('taxas', setTaxas)}
                className={`${ouvindoCampo === 'taxas' ? 'text-rose-500 animate-bounce' : 'text-slate-500 hover:text-pink-400'} transition-colors cursor-pointer`} 
                title="Ditar valor por voz"
              >
                {ouvindoCampo === 'taxas' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Card 3: Despesas */}
          <div className="bg-[#0f172a] border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold tracking-wider mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" /> DESPESAS OPERACIONAIS
              </div>
              {ouvindoCampo === 'despesas' && (
                <span className="text-rose-400 animate-pulse text-[10px] uppercase font-bold">Ouvindo...</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-3xl font-black text-emerald-400 border-b border-transparent focus-within:border-emerald-400/50 pb-1 transition-colors">
              <span>R$</span>
              <input 
                type="text" 
                value={despesas}
                onChange={(e) => handleManualChange(e, setDespesas)}
                className="bg-transparent border-none outline-none w-full text-emerald-400 p-0 m-0"
              />
              <button 
                onClick={() => ativarMicrofone('despesas', setDespesas)}
                className={`${ouvindoCampo === 'despesas' ? 'text-rose-500 animate-bounce' : 'text-slate-500 hover:text-emerald-400'} transition-colors cursor-pointer`} 
                title="Ditar valor por voz"
              >
                {ouvindoCampo === 'despesas' ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-amber-500 text-xs font-bold mb-3 uppercase tracking-wider">
            Mensagem pronta para o contador
          </h3>
          <div className="bg-[#0f172a] border border-slate-700/50 rounded-xl p-6 text-slate-300 text-sm leading-relaxed">
            {mensagemContador}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handleCopiar}
            className="flex-1 flex items-center justify-center gap-2 bg-transparent border border-slate-600 hover:bg-slate-800 text-slate-300 font-medium py-3.5 rounded-lg transition-colors cursor-pointer"
          >
            <Copy className="w-5 h-5" /> Copiar mensagem
          </button>
          
          <button
            onClick={handleWhatsApp}
            className="flex-[2] flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fad53] text-white font-bold py-3.5 rounded-lg transition-colors cursor-pointer shadow-lg shadow-green-900/20"
          >
            <Send className="w-5 h-5" /> Enviar por WhatsApp para o Contador
          </button>
        </div>
      </div>

      {/* BLOCO 2: TABELA DE HISTÓRICO */}
      <div className="bg-[#111c32] border border-slate-800 rounded-xl overflow-hidden p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" /> Histórico de Fechamentos Diários
          </h2>
          <button
            onClick={limparHistorico}
            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-800 font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-xs"
          >
            <Trash2 className="w-4 h-4" /> Limpar Histórico
          </button>
        </div>

        {fechamentos.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Nenhum fechamento diário finalizado ainda. Vá em "Fechamento Diário" e clique em "Finalizar Fechamento".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#0c1527] text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Dinheiro</th>
                  <th className="p-3">PIX</th>
                  <th className="p-3">Cartões</th>
                  <th className="p-3">Boletos</th>
                  <th className="p-3">Saídas</th>
                  <th className="p-3">Saldo Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {fechamentos.map((f, idx) => {
                  const cartoes = parseNumTable(f.debitoValue) + parseNumTable(f.credito3xValue) + parseNumTable(f.credito12xValue);
                  return (
                    <tr key={idx} className="hover:bg-[#16223f] transition-colors">
                      <td className="p-3 font-semibold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {f.data}
                      </td>
                      <td className="p-3 text-emerald-400">R$ {f.entradasDinheiro || '0,00'}</td>
                      <td className="p-3">R$ {f.pixValue || '0,00'}</td>
                      <td className="p-3">R$ {cartoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3">R$ {f.boletosValue || '0,00'}</td>
                      <td className="p-3 text-rose-400">R$ {f.saidasValue || '0,00'}</td>
                      <td className="p-3 font-bold text-amber-400">{f.saldoFinalEsperado}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}