"use client";

import { useCallback, useRef } from "react";
import { type DetectedFace } from "@/types/face";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }

  const stopStream = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((t) => t.stop());
  }, []);

  const captureFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  }, []);

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

  const drawFaces = useCallback((faces: DetectedFace[]) => {
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

    const sx = dw / video.videoWidth;
    const sy = dh / video.videoHeight;

    for (const face of faces) {
      const { box, recognized, name, similarity } = face;
      const x = box.x * sx;
      const y = box.y * sy;
      const w = box.width * sx;
      const h = box.height * sy;

      ctx.strokeStyle = recognized ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = recognized ? "#22c55e" : "#ef4444";
      ctx.font = "14px sans-serif";

      if (name) {
        const label = `${name} ${Math.round(similarity * 100)}%`;
        ctx.fillText(label, x, y - 10);
      }
    }
  }, []);

  return {
    videoRef,
    overlayCanvasRef,
    captureCanvasRef,
    start,
    stopStream,
    captureFrame,
    clearOverlay,
    drawFaces,
  };
}
