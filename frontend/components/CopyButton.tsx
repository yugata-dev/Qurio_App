"use client";

import { useEffect, useRef, useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  text: string | number;
  label?: string;
  className?: string;
}

function CopyButton({
  text,
  label = "Salin kode",
  className,
}: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }
    },
    [],
  );

  async function handleCopy() {
    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current);
    }

    try {
      await navigator.clipboard.writeText(String(text));
      setStatus("copied");
    } catch {
      setStatus("error");
    }

    resetTimer.current = window.setTimeout(() => {
      setStatus("idle");
      resetTimer.current = null;
    }, 3000);
  }

  const buttonLabel =
    status === "copied"
      ? `${label} disalin`
      : status === "error"
        ? `Gagal menyalin ${label}`
        : `Salin ${label}`;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className={className}
      aria-label={buttonLabel}
      title={buttonLabel}
      onClick={handleCopy}
    >
      {status === "copied" ? (
        <IconCheck className="size-3 text-emerald-600" />
      ) : (
        <IconCopy className="size-3 text-muted-foreground" />
      )}
    </Button>
  );
}

export { CopyButton };
