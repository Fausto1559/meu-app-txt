import React, { useState, useEffect } from 'react';

interface TopNavProps {
  onOpenUpgrade?: () => void;
}

export default function TopNav({ onOpenUpgrade }: TopNavProps) {
  const [trialEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });

  const calculateTimeLeft = () => {
    const difference = +trialEndDate - +new Date();
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col-reverse sm:flex-col md:flex-row items-center gap-2">
      <div className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md relative bg-slate-800/90 text-white p-6 rounded-xl border border-slate-700 shadow-lg">
        Trial Gratuito: <strong className="text-amber-400">{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {String(timeLeft.seconds).padStart(2, '0')}s</strong>
      </div>

      <div className="relative flex flex-col justify-between rounded-xl p-6 pt-10 bg-slate-800 border border-slate-700 text-white shadow-md relative bg-slate-800/90 text-white p-6 rounded-xl border border-slate-700 shadow-lg">
        Plano Atual: <span className="font-bold">FREEMIUM / ESSENCIAL (R$ 0,00)</span>
      </div>

      <button
        onClick={onOpenUpgrade}
        className="w-full sm:w-auto bg-gradient-to-r from-[#C5A028] to-[#E5C158] text-slate-950 font-extrabold text-xs px-3.5 py-1.5 rounded-lg hover:opacity-90 transition-all"
      >
        Seja Copiloto Pro
      </button>
    </div>
  );
}