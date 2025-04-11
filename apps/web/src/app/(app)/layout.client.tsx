"use client";
import { Navbar, MobileNavbar } from "@/components/Navbar";
import { WorksiteTenantSwitcher } from "@/components/WorksiteTenantSwitcher";
import { Separator } from "@/components/ui/separator";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar navigation - hidden on mobile */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 border-r bg-background">
          <div className="h-16 flex items-center px-6 border-b">
            <h1 className="text-lg font-semibold">WorkSafeMaps</h1>
          </div>

          {/* Tenant and Worksite Switcher */}
          <div className="pt-4">
            <WorksiteTenantSwitcher />
            <Separator className="my-4" />
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto pb-4">
            <Navbar />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none pb-12 py-8">
          {children}
        </main>

        {/* Mobile navigation - fixed at bottom, only visible on mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-10">
          <MobileNavbar />
        </div>
      </div>
    </div>
  );
}
