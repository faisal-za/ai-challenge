import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { mastra } from "@/mastra";
import Chats from "./chats";
import { SidebarProvider, Sidebar, SidebarContent, SidebarInset, SidebarHeader } from "@/components/ui/sidebar";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "مبكر - Diabetes Risk Assessment",
  description: "AI-powered diabetes risk assessment and clinical decision support system",
};

const agent = mastra.getAgent("RiskAssessmentAgent");

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

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <Image
                className="mx-auto"
                src={"/logo.png"}
                width={100}
                height={50}
                alt=""
              />
            </SidebarHeader>
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

export const dynamic = "force-dynamic";
export const revalidate = 0;