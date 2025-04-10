"use client";
import { useStoreUserEffect } from "@/hooks/use-store-user";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStoreUserEffect();
  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }
  return <div>{children}</div>;
}
