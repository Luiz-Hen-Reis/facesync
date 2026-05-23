export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedFace {
  recognized: boolean;
  name: string | null;
  similarity: number;
  box: BoundingBox;
}

export interface RecognitionResult {
  faces: DetectedFace[];
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected";
export type AppScreen = "home" | "register" | "recognize";
export type RegisterStatus = "idle" | "capturing" | "success" | "error";
