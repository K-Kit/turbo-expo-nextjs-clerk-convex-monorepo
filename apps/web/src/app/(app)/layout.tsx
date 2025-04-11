"use client";
import { useStoreUserEffect } from "@/hooks/use-store-user";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStoreUserEffect();
  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }
  return <div className="flex flex-col h-screen overflow-x-hidden w-full">{children}</div>;
}
