import * as signalR from "@microsoft/signalr";

export function useWebSocket() {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl("https://localhost:7026/hubs/facesync")
    .withAutomaticReconnect()
    .build();

  return connection;
}
