import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { mastra } from "@/mastra";
import Chats from "./chats";
import { SidebarProvider, Sidebar, SidebarContent, SidebarInset } from "@/components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ICD-11 Diagnostic System",
  description: "Clinical decision support powered by WHO ICD-11 classification",
};

const agent = mastra.getAgent("ICDDiagnosticAgent");

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch threads at layout level
  const memory = await agent.getMemory();
  const threads = await memory?.getThreadsByResourceId({
    resourceId: "demo"
  });

  // Create initial thread if none exist
  if (threads?.length === 0) {
    await memory?.createThread({
      resourceId: "demo",
      title: "New Patient Case"
    });
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <Sidebar>
            <SidebarContent>
              <Chats threads={threads} />
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            {children}
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
