"use client";

import { AccessForm } from "@/components/AccessForm";
import QuizView from "@/components/QuizView";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type JoinState = "checking" | "joined" | "needs-join";

// participant_id di localStorage hanya valid kalau milik sesi di URL ini.
// AccessForm menyimpan seluruh response join di key "participant".
const isParticipantOfSession = (sessionId: string): boolean => {
  try {
    const participantId = localStorage.getItem("participant_id");
    const raw = localStorage.getItem("participant");
    if (!participantId || !raw) return false;
    const stored = JSON.parse(raw) as { data?: { id?: string; session_id?: string } };
    return stored.data?.session_id === sessionId && stored.data?.id === participantId;
  } catch {
    return false;
  }
};

export default function PlayPage() {
  const params = useParams();
  const sessionId = (params?.id as string) || "";

  // "checking" mencegah AccessForm sempat berkedip sebelum localStorage dibaca
  const [joinState, setJoinState] = useState<JoinState>("checking");

  useEffect(() => {
    queueMicrotask(() => {
      setJoinState(isParticipantOfSession(sessionId) ? "joined" : "needs-join");
    });
  }, [sessionId]);

  if (joinState === "checking") return null;

  if (joinState === "needs-join") {
    return (
      <AccessForm
        sessionId={sessionId}
        // cek ulang: kode akses yang diketik bisa milik sesi lain
        onSuccess={() =>
          setJoinState(isParticipantOfSession(sessionId) ? "joined" : "needs-join")
        }
      />
    );
  }

  return (
    <QuizView
      sessionId={sessionId}
      onInvalidParticipant={() => setJoinState("needs-join")}
    />
  );
}