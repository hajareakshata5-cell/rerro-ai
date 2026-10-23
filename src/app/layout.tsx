import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RERRO — Autonomous Field Intelligence & Emergency Dispatch Grid",
  description:
    "Beyond chatbots: Multimodal low-latency emergency dispatch and triage orchestrator powered by Gemini 3.8 Flash.",
  openGraph: {
    title: "RERRO — Emergency Dispatch Grid",
    description:
      "Autonomous crisis triage engine with multimodal visual & regional voice ingestion.",
    url: "https://rerro-ai.vercel.app",
    siteName: "RERRO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
