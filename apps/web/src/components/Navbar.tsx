"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Map, 
  TruckIcon, 
  AlertTriangle, 
  FileWarning, 
  Home, 
  Users, 
  Building, 
  Mail,
  Briefcase,
  ClipboardList,
  HardHat
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Map", href: "/map", icon: Map },
  { name: "Points of Interest", href: "/pois", icon: AlertTriangle },
  { name: "Assets", href: "/assets", icon: TruckIcon },
  { name: "Projects", href: "/projects", icon: Briefcase },
  { name: "Work Orders", href: "/workorders", icon: ClipboardList },
  { name: "Contractors", href: "/contractors", icon: HardHat },
  { name: "Incidents", href: "/incidents", icon: FileWarning },
  { name: "Worksites", href: "/worksites", icon: Building },
  { name: "Tenants", href: "/tenants", icon: Users },
  { name: "Invites", href: "/invite", icon: Mail },
];

export function Navbar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("px-2 py-1 flex flex-col space-y-1", className)}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive 
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
            )}
          >
            <Icon className="mr-3 h-5 w-5" aria-hidden="true" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavbar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center justify-between px-2 py-1", className)}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center p-1 text-xs",
              isActive 
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground transition-colors"
            )}
            title={item.name}
          >
            <Icon className="h-6 w-6 mb-1" aria-hidden="true" />
            <span className="sr-only">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
} 