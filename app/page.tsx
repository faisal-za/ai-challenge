import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { FileTextIcon, MessageSquareIcon } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  return (
    <div className="flex flex-col h-full">
      {/* Header with sidebar trigger */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 sticky top-0 z-10">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <div>
          <h2 className="text-lg font-semibold">مبكر</h2>
          <p className="text-xs text-muted-foreground">AI-powered Diabetes Risk Assessment</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-center min-h-full">
          <div className="max-w-2xl w-full mx-auto p-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Welcome to مبكر</h1>
              <p className="text-lg text-muted-foreground">
                AI-powered diabetes risk assessment system
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/case"
                className="group relative overflow-hidden rounded-lg border bg-card p-8 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="rounded-full bg-primary/10 p-4 group-hover:bg-primary/20 transition-colors">
                    <FileTextIcon className="size-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">New Patient Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter patient information to evaluate diabetes risk level
                  </p>
                </div>
              </Link>

              <div className="group relative overflow-hidden rounded-lg border bg-card p-8 opacity-75">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="rounded-full bg-muted p-4">
                    <MessageSquareIcon className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">View Assessments</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a patient assessment from the sidebar to view risk analysis results
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
