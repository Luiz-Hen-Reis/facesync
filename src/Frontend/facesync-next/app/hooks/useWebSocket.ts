import * as signalR from "@microsoft/signalr";
import { useEffect, useState } from "react";

export function useWebSocket() {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(
    null,
  );

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7026/hubs/facesync")
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    return () => {
      newConnection.stop();
    };
  }, []);

  return connection;
}
