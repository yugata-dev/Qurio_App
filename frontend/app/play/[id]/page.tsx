"use client";

import { AccessForm } from "@/components/AccessForm";
import QuizView from "@/components/QuizView";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PlayPage() {
  // Mengambil parameter [id] langsung dari URL sebagai string
  const params = useParams();
  const sessionId = (params?.id as string) || "";

  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const participantId = localStorage.getItem("participant_id");
    if (participantId) {
      queueMicrotask(() => {
        setHasJoined(true);
      });
    }
  }, []);

  // Belum join -> Tampilkan Form
  if (!hasJoined) {
    return (
      <AccessForm sessionId={sessionId} onSuccess={() => setHasJoined(true)} />
    );
  }

  // Sudah join -> Tampilkan Soal
  return <QuizView sessionId={sessionId} />;
}
