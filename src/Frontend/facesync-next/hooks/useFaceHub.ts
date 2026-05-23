"use client";

import { useEffect, useRef, useState } from "react";
import { HubConnection } from "@microsoft/signalr";
import {
  BoundingBox,
  ConnectionStatus,
  RecognitionResult,
  RegisterStatus,
} from "@/types/face";

interface UseFaceHubOptions {
  connection: HubConnection | null;
  mode: "register" | "recognize";
  userName?: string;
  captureFrame: () => Promise<string | null>;
  clearOverlay: () => void;
  drawBoundingBox: (
    box: BoundingBox | null,
    label: string,
    recognized: boolean,
    similarity: number,
  ) => void;
  stopCameraStream: () => void;
}

export function useFaceHub({
  connection,
  mode,
  userName,
  captureFrame,
  clearOverlay,
  drawBoundingBox,
  stopCameraStream,
}: UseFaceHubOptions) {
  const connectionRef = useRef(connection);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const registeringRef = useRef(false);
  const registerStatusRef = useRef<RegisterStatus>("idle");

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [registerStatus, setRegisterStatus] = useState<RegisterStatus>("idle");
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);

  useEffect(() => {
    connectionRef.current = connection;
  }, [connection]);

  function updateRegisterStatus(status: RegisterStatus) {
    registerStatusRef.current = status;
    setRegisterStatus(status);
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

  function stopFrameLoop() {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
  }

  function retryRegister() {
    registeringRef.current = false;
    updateRegisterStatus("idle");
    startFrameLoop();
  }

  useEffect(() => {
    if (!connection) return;

    connection.onreconnecting(() => setConnectionStatus("connecting"));
    connection.onreconnected(() => setConnectionStatus("connected"));
    connection.onclose(() => setConnectionStatus("disconnected"));

    connection.on("RecognitionResult", (data: RecognitionResult | null) => {
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

      if (
        mode === "register" &&
        !registeringRef.current &&
        registerStatusRef.current === "idle"
      ) {
        registeringRef.current = true;
        stopFrameLoop();
        updateRegisterStatus("capturing");

        setTimeout(() => {
          captureFrame().then((frame) => {
            if (!frame) return;
            connectionRef.current
              ?.invoke("RegisterFace", { name: userName, frame })
              .catch(() => {
                registeringRef.current = false;
                updateRegisterStatus("error");
                setRegisterMessage("Erro ao registrar. Tente novamente.");
              });
          });
        }, 1500);
      }
    });

    connection.on("FaceRegistered", (message: string) => {
      stopFrameLoop();
      stopCameraStream();
      clearOverlay();
      updateRegisterStatus("success");
      setRegisterMessage(message);
    });

    connection.on("Error", (errors: string[]) => {
      stopFrameLoop();
      registeringRef.current = false;
      updateRegisterStatus("error");
      setRegisterMessage(errors.join(" "));
    });

    setConnectionStatus("connecting");
    connection
      .start()
      .then(() => setConnectionStatus("connected"))
      .catch(() => setConnectionStatus("disconnected"));

    return () => {
      connection.off("RecognitionResult");
      connection.off("FaceRegistered");
      connection.off("Error");
    };
  }, [
    connection,
    mode,
    userName,
    captureFrame,
    clearOverlay,
    drawBoundingBox,
    stopCameraStream,
  ]);

  return {
    connectionStatus,
    result,
    registerStatus,
    registerMessage,
    startFrameLoop,
    stopFrameLoop,
    retryRegister,
  };
}
