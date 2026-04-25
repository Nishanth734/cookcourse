import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "CourseCook - AI-Powered Career Preparation Platform",
  description: "Your complete career preparation ecosystem. Learn, practice, and get placed with AI-powered roadmaps, curated resources, coding practice, mock interviews, and ATS-optimized resumes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
