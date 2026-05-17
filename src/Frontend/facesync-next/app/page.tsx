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
  boundingBox: BoundingBox;
  recognized: boolean;
}

type ConnectionStatus = "disconnected" | "connecting" | "connected";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [recognizedName, setRecognizedName] = useState<string | null>(null);

  const [recognizing, setRecognizing] = useState(false);

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");

  const [result, setResult] = useState<RecognitionResult | null>(null);

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;

      await videoRef.current.play();
    }
  }

  const drawBoundingBox = useCallback(
    (
      box: BoundingBox,
      label: string,
      recognized: boolean,
      similarity: number,
    ) => {
      const canvas = overlayCanvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = recognized ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 4;

      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.fillStyle = recognized ? "#22c55e" : "#ef4444";

      ctx.font = "16px sans-serif";

      ctx.fillText(
        `${label} ${Math.round(similarity * 100)}%`,
        box.x,
        box.y - 10,
      );
    },
    [],
  );

  async function startRecognition() {
    setRecognizing(true);

    await startCamera();
  }

  function stopRecognition() {
    setRecognizing(false);

    setRecognizedName(null);

    setResult(null);

    const stream = videoRef.current?.srcObject as MediaStream;

    stream?.getTracks().forEach((track) => track.stop());

    const canvas = overlayCanvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");

      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  useEffect(() => {
    const connection = useWebSocket();

    async function connect() {
      try {
        setConnectionStatus("connecting");

        await connection.start();

        console.log("SignalR conectado");

        setConnectionStatus("connected");

        connection.on("RecognitionResult", (data: RecognitionResult) => {
          console.log(data);

          setResult(data);

          setRecognizedName(data.name);

          drawBoundingBox(
            data.boundingBox,
            data.name ?? "Desconhecido",
            data.recognized,
            data.similarity,
          );
        });
      } catch (err) {
        console.error(err);

        setConnectionStatus("disconnected");
      }
    }

    connect();

    return () => {
      connection.stop();
    };
  }, [drawBoundingBox]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">FaceSync</h1>

        <p className="text-sm text-zinc-400 mt-2">Status: {connectionStatus}</p>
      </div>

      <div className="relative">
        <video
          ref={videoRef}
          className="w-[700px] rounded-xl border border-zinc-800"
          autoPlay
          muted
          playsInline
        />

        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {result && (
        <div className="text-center">
          <p className="text-2xl font-semibold text-green-400">
            {recognizedName ?? "Desconhecido"}
          </p>

          <p className="text-zinc-400">
            Similaridade: {(result.similarity * 100).toFixed(1)}%
          </p>
        </div>
      )}

      <div className="flex gap-4">
        {!recognizing ? (
          <button
            onClick={startRecognition}
            className="bg-green-500 text-black px-6 py-3 rounded-lg font-semibold"
          >
            Iniciar reconhecimento
          </button>
        ) : (
          <button
            onClick={stopRecognition}
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Parar
          </button>
        )}

        <button className="bg-zinc-800 px-6 py-3 rounded-lg">
          Registrar usuário
        </button>
      </div>
    </main>
  );
}
