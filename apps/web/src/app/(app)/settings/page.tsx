"use client";

import { WorksiteTenantSwitcher } from "@/components/WorksiteTenantSwitcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="mb-4"
        >
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your tenant and worksite preferences
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tenant & Worksite Selection</CardTitle>
            <CardDescription>
              Select which tenant and worksite you're currently working with
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WorksiteTenantSwitcher />
          </CardContent>
        </Card>

        <Separator />

        <div className="text-center text-sm text-muted-foreground">
          <p>WorkSafeMaps v1.0.0</p>
          <p>© 2023 WorkSafeMaps. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
} 