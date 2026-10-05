import type { Metadata } from "next";
import { LegalPlaceholder } from "@/components/LegalPlaceholder";

export const metadata: Metadata = {
  title: "Syarat Penggunaan | Qurio",
  description: "Halaman syarat penggunaan Qurio.",
};

export default function TermsPage() {
  return <LegalPlaceholder title="Syarat penggunaan" />;
}
