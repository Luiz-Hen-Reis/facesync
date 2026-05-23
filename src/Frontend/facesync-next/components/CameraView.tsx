"use client";

import { useEffect } from "react";

import {
  ConnectionStatus,
  RecognitionResult,
  RegisterStatus,
} from "../types/face";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useCamera } from "@/hooks/useCamera";
import { useFaceHub } from "@/hooks/useFaceHub";

interface CameraViewProps {
  mode: "register" | "recognize";
  userName?: string;
  onBack: () => void;
}

export function CameraView({ mode, userName, onBack }: CameraViewProps) {
  const connection = useWebSocket();
  const camera = useCamera();

  const {
    connectionStatus,
    result,
    registerStatus,
    registerMessage,
    startFrameLoop,
    stopFrameLoop,
    retryRegister,
  } = useFaceHub({
    connection,
    mode,
    userName,
    captureFrame: camera.captureFrame,
    clearOverlay: camera.clearOverlay,
    drawBoundingBox: camera.drawBoundingBox,
    stopCameraStream: camera.stopStream,
  });

  useEffect(() => {
    camera.start().then(() => startFrameLoop());
    return () => {
      camera.stopStream();
      stopFrameLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleBack() {
    camera.stopStream();
    stopFrameLoop();
    onBack();
  }

  const isRegister = mode === "register";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-6">
      <CameraHeader
        isRegister={isRegister}
        userName={userName}
        connectionStatus={connectionStatus}
        onBack={handleBack}
      />

      <div className="relative w-full max-w-2xl">
        <video
          ref={camera.videoRef}
          className="w-full rounded-2xl border border-zinc-800"
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={camera.overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        <canvas ref={camera.captureCanvasRef} className="hidden" />
        <ModeBadge isRegister={isRegister} />
      </div>

      {isRegister ? (
        <RegisterStatusPanel
          status={registerStatus}
          message={registerMessage}
          onBack={handleBack}
          onRetry={retryRegister}
        />
      ) : (
        <RecognitionResultPanel result={result} />
      )}
    </div>
  );
}

interface CameraHeaderProps {
  isRegister: boolean;
  userName?: string;
  connectionStatus: ConnectionStatus;
  onBack: () => void;
}

function CameraHeader({
  isRegister,
  userName,
  connectionStatus,
  onBack,
}: CameraHeaderProps) {
  const statusColor = {
    connected: "bg-green-400",
    connecting: "bg-yellow-400 animate-pulse",
    disconnected: "bg-zinc-600",
  }[connectionStatus];

  return (
    <div className="w-full max-w-2xl flex items-center justify-between">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Voltar
      </button>
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-tight">FaceSync</h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          {isRegister ? `Registrando: ${userName}` : "Reconhecimento facial"}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${statusColor}`} />
        <span className="text-xs text-zinc-500">{connectionStatus}</span>
      </div>
    </div>
  );
}

function ModeBadge({ isRegister }: { isRegister: boolean }) {
  return (
    <div
      className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
        isRegister
          ? "bg-indigo-600/80 text-indigo-100"
          : "bg-emerald-600/80 text-emerald-100"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isRegister ? "bg-indigo-200" : "bg-emerald-200 animate-pulse"
        }`}
      />
      {isRegister ? "Registro" : "Reconhecimento"}
    </div>
  );
}

interface RegisterStatusPanelProps {
  status: RegisterStatus;
  message: string | null;
  onBack: () => void;
  onRetry: () => void;
}

function RegisterStatusPanel({
  status,
  message,
  onBack,
  onRetry,
}: RegisterStatusPanelProps) {
  return (
    <div className="h-14 flex flex-col items-center justify-center gap-2">
      {status === "idle" && (
        <p className="text-sm text-zinc-400 text-center">
          Posicione seu rosto na câmera — o registro ocorre automaticamente.
        </p>
      )}
      {status === "capturing" && (
        <p className="text-sm text-zinc-400 text-center animate-pulse">
          Registrando...
        </p>
      )}
      {status === "success" && (
        <>
          <p className="text-sm text-green-400 text-center">{message}</p>
          <button
            onClick={onBack}
            className="bg-zinc-800 border border-zinc-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Voltar ao início
          </button>
        </>
      )}
      {status === "error" && (
        <>
          <p className="text-sm text-red-400 text-center">{message}</p>
          <button
            onClick={onRetry}
            className="bg-zinc-800 border border-zinc-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Tentar novamente
          </button>
        </>
      )}
    </div>
  );
}

function RecognitionResultPanel({
  result,
}: {
  result: RecognitionResult | null;
}) {
  return (
    <div className="h-14 flex flex-col items-center justify-center">
      {result && (
        <>
          <p
            className={`text-2xl font-semibold ${result.recognized ? "text-green-400" : "text-red-400"}`}
          >
            {result.name ?? "Desconhecido"}
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            Similaridade: {(result.similarity * 100).toFixed(1)}%
          </p>
        </>
      )}
    </div>
  );
}
