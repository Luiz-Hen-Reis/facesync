"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "./hooks/useWebSocket";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RecognitionResult {
  userId: string | null;
  name: string | null;
  similarity: number;
  box: BoundingBox;
  recognized: boolean;
}

type ConnectionStatus = "disconnected" | "connecting" | "connected";
type AppScreen = "home" | "register" | "recognize";
type RegisterStatus = "idle" | "capturing" | "success" | "error";

function NameModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
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

function CameraView({
  mode,
  userName,
  onBack,
}: {
  mode: "register" | "recognize";
  userName?: string;
  onBack: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const registeringRef = useRef(false);

  const connection = useWebSocket();
  const connectionRef = useRef(connection);

  useEffect(() => {
    connectionRef.current = connection;
  }, [connection]);

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [registerStatus, setRegisterStatus] = useState<RegisterStatus>("idle");
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const clearOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const drawBoundingBox = useCallback(
    (
      box: BoundingBox | null,
      label: string,
      recognized: boolean,
      similarity: number,
    ) => {
      const canvas = overlayCanvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dw = video.clientWidth;
      const dh = video.clientHeight;
      canvas.width = dw;
      canvas.height = dh;
      ctx.clearRect(0, 0, dw, dh);
      if (!box || (box.width === 0 && box.height === 0)) return;
      const sx = dw / video.videoWidth;
      const sy = dh / video.videoHeight;
      const x = box.x * sx;
      const y = box.y * sy;
      const w = box.width * sx;
      const h = box.height * sy;
      ctx.strokeStyle = recognized ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = recognized ? "#22c55e" : "#ef4444";
      ctx.font = "14px sans-serif";
      if (label) ctx.fillText(label, x, y - 10);
    },
    [],
  );

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }

  async function captureFrame() {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  }

  function startFrameLoop() {
    frameIntervalRef.current = setInterval(async () => {
      const frame = await captureFrame();
      if (!frame) return;
      try {
        const conn = connectionRef.current;
        if (conn && conn.state === "Connected") {
          conn.invoke("SendFrame", frame);
          if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
          clearTimeoutRef.current = setTimeout(() => {
            clearOverlay();
            setResult(null);
          }, 600);
        }
      } catch (error) {
        console.error("Erro ao enviar frame:", error);
      }
    }, 350);
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((t) => t.stop());
    const canvas = overlayCanvasRef.current;
    if (canvas) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    setCameraActive(false);
    setResult(null);
  }

  function handleBack() {
    stopCamera();
    onBack();
  }

  useEffect(() => {
    startCamera().then(() => startFrameLoop());
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!connection) return;

    async function connect() {
      try {
        setConnectionStatus("connecting");
        await connection!.start();
        setConnectionStatus("connected");

        connection!.on(
          "RecognitionResult",
          (data: RecognitionResult | null) => {
            if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
            if (!data) {
              clearOverlay();
              setResult(null);
              return;
            }
            setResult(data);
            drawBoundingBox(
              data.box,
              mode === "register" ? "" : (data.name ?? "Desconhecido"),
              data.recognized,
              data.similarity,
            );
            if (mode === "register" && !registeringRef.current) {
              registeringRef.current = true;
              if (frameIntervalRef.current)
                clearInterval(frameIntervalRef.current);
              if (clearTimeoutRef.current)
                clearTimeout(clearTimeoutRef.current);
              setRegisterStatus("capturing");
              setTimeout(() => {
                captureFrame().then((frame) => {
                  if (!frame) return;
                  connectionRef.current
                    ?.invoke("RegisterFace", { name: userName, frame })
                    .catch(() => {
                      registeringRef.current = false;
                      setRegisterStatus("error");
                      setRegisterMessage("Erro ao registrar. Tente novamente.");
                    });
                });
              }, 1500);
            }
          },
        );

        connection!.on("FaceRegistered", (message: string) => {
          if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
          if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
          const stream = videoRef.current?.srcObject as MediaStream;
          stream?.getTracks().forEach((t) => t.stop());
          clearOverlay();
          setRegisterStatus("success");
          setRegisterMessage(message);
        });
      } catch {
        setConnectionStatus("disconnected");
      }
    }

    connect();
  }, [connection, drawBoundingBox, clearOverlay]);

  const isRegister = mode === "register";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-2xl flex items-center justify-between">
        <button
          onClick={handleBack}
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
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === "connected"
                ? "bg-green-400"
                : connectionStatus === "connecting"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-zinc-600"
            }`}
          />
          <span className="text-xs text-zinc-500">{connectionStatus}</span>
        </div>
      </div>

      <div className="relative w-full max-w-2xl">
        <video
          ref={videoRef}
          className="w-full rounded-2xl border border-zinc-800"
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        <canvas ref={captureCanvasRef} className="hidden" />

        <div
          className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isRegister
              ? "bg-indigo-600/80 text-indigo-100"
              : "bg-emerald-600/80 text-emerald-100"
          } backdrop-blur-sm`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isRegister ? "bg-indigo-200" : "bg-emerald-200 animate-pulse"
            }`}
          />
          {isRegister ? "Registro" : "Reconhecimento"}
        </div>
      </div>

      {isRegister ? (
        <div className="h-14 flex flex-col items-center justify-center gap-2">
          {registerStatus === "idle" && (
            <p className="text-sm text-zinc-400 text-center">
              Posicione seu rosto na câmera — o registro ocorre automaticamente.
            </p>
          )}
          {registerStatus === "capturing" && (
            <p className="text-sm text-zinc-400 text-center animate-pulse">
              Registrando...
            </p>
          )}
          {registerStatus === "success" && (
            <>
              <p className="text-sm text-green-400 text-center">
                {registerMessage}
              </p>
              <button
                onClick={handleBack}
                className="bg-zinc-800 border border-zinc-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors"
              >
                Voltar ao início
              </button>
            </>
          )}
          {registerStatus === "error" && (
            <>
              <p className="text-sm text-red-400 text-center">
                {registerMessage}
              </p>
              <button
                onClick={() => {
                  registeringRef.current = false;
                  setRegisterStatus("idle");
                  startFrameLoop();
                }}
                className="bg-zinc-800 border border-zinc-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors"
              >
                Tentar novamente
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="h-14 flex flex-col items-center justify-center">
          {result && (
            <>
              <p
                className={`text-2xl font-semibold ${
                  result.recognized ? "text-green-400" : "text-red-400"
                }`}
              >
                {result.name ?? "Desconhecido"}
              </p>
              <p className="text-sm text-zinc-400 mt-1">
                Similaridade: {(result.similarity * 100).toFixed(1)}%
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function HomeScreen({ onSelect }: { onSelect: (mode: AppScreen) => void }) {
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
        <button
          onClick={() => onSelect("register")}
          className="group flex-1 flex flex-col items-start gap-3 bg-zinc-900 border border-zinc-700 hover:border-indigo-500 rounded-2xl p-6 text-left transition-all duration-200 hover:bg-zinc-800"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-600/30 transition-colors">
            <svg
              className="w-5 h-5 text-indigo-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
              />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-base">Registrar</p>
            <p className="text-zinc-400 text-sm mt-0.5 leading-snug">
              Cadastre seu rosto para ser reconhecido pelo sistema.
            </p>
          </div>
          <div className="mt-auto flex items-center gap-1 text-indigo-400 text-xs font-medium">
            Começar
            <svg
              className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>

        <button
          onClick={() => onSelect("recognize")}
          className="group flex-1 flex flex-col items-start gap-3 bg-zinc-900 border border-zinc-700 hover:border-emerald-500 rounded-2xl p-6 text-left transition-all duration-200 hover:bg-zinc-800"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-600/30 transition-colors">
            <svg
              className="w-5 h-5 text-emerald-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-base">Reconhecer</p>
            <p className="text-zinc-400 text-sm mt-0.5 leading-snug">
              Identifique rostos em tempo real via câmera.
            </p>
          </div>
          <div className="mt-auto flex items-center gap-1 text-emerald-400 text-xs font-medium">
            Iniciar câmera
            <svg
              className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [showNameModal, setShowNameModal] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  function handleSelect(mode: AppScreen) {
    if (mode === "register") {
      setShowNameModal(true);
    } else {
      setScreen("recognize");
    }
  }

  function handleNameConfirm(name: string) {
    setUserName(name);
    setShowNameModal(false);
    setScreen("register");
  }

  function handleBack() {
    setScreen("home");
    setUserName(null);
  }

  if (screen === "home") {
    return (
      <>
        <HomeScreen onSelect={handleSelect} />
        {showNameModal && (
          <NameModal
            onConfirm={handleNameConfirm}
            onCancel={() => setShowNameModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <CameraView
      mode={screen as "register" | "recognize"}
      userName={userName ?? undefined}
      onBack={handleBack}
    />
  );
}
