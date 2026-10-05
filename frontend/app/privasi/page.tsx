import type { Metadata } from "next";
import { LegalPlaceholder } from "@/components/LegalPlaceholder";

export const metadata: Metadata = {
  title: "Privasi | Qurio",
  description: "Halaman informasi privasi Qurio.",
};

export default function PrivacyPage() {
  return <LegalPlaceholder title="Privasi" />;
}
