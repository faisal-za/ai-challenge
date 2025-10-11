import PatientIntakeForm from "../form";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function NewPatientCase() {
  return (
    <div className="flex flex-col h-full">
      {/* Header with sidebar trigger */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 sticky top-0 z-10">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        <div>
          <h2 className="text-lg font-semibold">New Patient Case</h2>
          <p className="text-xs text-muted-foreground">Enter patient information for diagnostic analysis</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <PatientIntakeForm />
        </div>
      </div>
    </div>
  );
}
