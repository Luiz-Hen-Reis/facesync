"use client";

import { useState } from "react";

interface NameModalProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function NameModal({ onConfirm, onCancel }: NameModalProps) {
  const [name, setName] = useState("");

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl">
        <h2 className="text-xl font-semibold text-white mb-1">
          Qual é o seu nome?
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          Ele será associado ao seu rosto no sistema.
        </p>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Ex: Maria Silva"
          className="w-full bg-zinc-800 border border-zinc-600 text-white placeholder-zinc-500 rounded-lg px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-zinc-600 text-zinc-300 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-1 bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-indigo-500 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
