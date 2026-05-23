export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RecognitionResult {
  userId: string | null;
  name: string | null;
  similarity: number;
  box: BoundingBox;
  recognized: boolean;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected";
export type AppScreen = "home" | "register" | "recognize";
export type RegisterStatus = "idle" | "capturing" | "success" | "error";
