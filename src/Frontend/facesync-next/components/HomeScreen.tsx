"use client";

import { AppScreen } from "@/types/face";

interface HomeScreenProps {
  onSelect: (mode: AppScreen) => void;
}

export function HomeScreen({ onSelect }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-5">
          <svg
            className="w-8 h-8 text-indigo-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">FaceSync</h1>
        <p className="text-zinc-400 mt-2 text-sm">
          Reconhecimento facial em tempo real
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
        <ModeCard
          onClick={() => onSelect("register")}
          title="Registrar"
          description="Cadastre seu rosto para ser reconhecido pelo sistema."
          cta="Começar"
          accentColor="indigo"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
            />
          }
        />
        <ModeCard
          onClick={() => onSelect("recognize")}
          title="Reconhecer"
          description="Identifique rostos em tempo real via câmera."
          cta="Iniciar câmera"
          accentColor="emerald"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          }
        />
      </div>
    </div>
  );
}

interface ModeCardProps {
  onClick: () => void;
  title: string;
  description: string;
  cta: string;
  accentColor: "indigo" | "emerald";
  icon: React.ReactNode;
}

function ModeCard({
  onClick,
  title,
  description,
  cta,
  accentColor,
  icon,
}: ModeCardProps) {
  const colors = {
    indigo: {
      border: "hover:border-indigo-500",
      iconBg:
        "bg-indigo-600/20 border-indigo-500/30 group-hover:bg-indigo-600/30",
      iconColor: "text-indigo-400",
      cta: "text-indigo-400",
    },
    emerald: {
      border: "hover:border-emerald-500",
      iconBg:
        "bg-emerald-600/20 border-emerald-500/30 group-hover:bg-emerald-600/30",
      iconColor: "text-emerald-400",
      cta: "text-emerald-400",
    },
  }[accentColor];

  return (
    <button
      onClick={onClick}
      className={`group flex-1 flex flex-col items-start gap-3 bg-zinc-900 border border-zinc-700 ${colors.border} rounded-2xl p-6 text-left transition-all duration-200 hover:bg-zinc-800`}
    >
      <div
        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${colors.iconBg}`}
      >
        <svg
          className={`w-5 h-5 ${colors.iconColor}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          {icon}
        </svg>
      </div>
      <div>
        <p className="text-white font-semibold text-base">{title}</p>
        <p className="text-zinc-400 text-sm mt-0.5 leading-snug">
          {description}
        </p>
      </div>
      <div
        className={`mt-auto flex items-center gap-1 text-xs font-medium ${colors.cta}`}
      >
        {cta}
        <svg
          className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
