"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvitePage() {
  const router = useRouter();

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-100px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invitation Required</CardTitle>
          <CardDescription>
            You need a valid invitation code to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please use the invite link that was sent to you or contact your administrator
            for a new invitation.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 