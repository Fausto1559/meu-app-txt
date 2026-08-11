interface HeaderProps {
  onOpenUpgrade?: () => void;
  // mantenha outras propriedades que o Header já recebia aqui
}

export default function Header({ onOpenUpgrade }: HeaderProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-col md:flex-row items-center gap-2">
      
      {/* Texto do Plano Atual */}
      <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] sm:text-xs text-emerald-400">
        Plano Atual: <span className="font-bold">FREEMIUM / ESSENCIAL (R$ 0,00)</span>
      </div>

      {/* Botão SEJA COPILOTO PRO */}
      <button
        onClick={onOpenUpgrade}
        className="w-full sm:w-auto bg-gradient-to-r from-[#C5A028] to-[#E5C158] text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-lg shadow-md hover:opacity-90 transition-all uppercase"
      >
        Seja Copiloto Pro
      </button>

    </div>
  );
}