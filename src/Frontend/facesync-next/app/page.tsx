"use client";

import { CameraView } from "@/components/CameraView";
import { HomeScreen } from "@/components/HomeScreen";
import { NameModal } from "@/components/NameModal";
import type { AppScreen } from "@/types/face";
import { useState } from "react";

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
