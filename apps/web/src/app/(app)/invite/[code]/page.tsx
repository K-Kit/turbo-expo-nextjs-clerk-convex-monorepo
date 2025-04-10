"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const { isLoaded, isSignedIn } = useAuth();
  const inviteCode = typeof params.code === "string" ? params.code : "";
  
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const inviteDetails = useQuery(api.users.getInviteByCode, { inviteCode });
  const acceptInvite = useMutation(api.users.acceptInvite);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Store the invite code in localStorage to redirect back after sign-in
      localStorage.setItem("pendingInvite", inviteCode);
      router.push(`/sign-in?redirect=/invite/${inviteCode}`);
    }
  }, [isLoaded, isSignedIn, router, inviteCode]);

  // Handle invitation acceptance
  const handleAcceptInvite = async () => {
    if (!inviteDetails || isAccepting) return;
    
    setIsAccepting(true);
    setError(null);
    
    try {
      const result = await acceptInvite({ inviteCode });
      
      if (result.success) {
        setSuccess(result.message);
        
        // Redirect to the tenant page after successful acceptance
        if (result.tenantId) {
          setTimeout(() => {
            router.push(`/tenants/${result.tenantId}`);
          }, 2000);
        } else {
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      toast.error("Failed to accept invitation");
    } finally {
      setIsAccepting(false);
    }
  };

  // If still loading authentication, show loading state
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <Skeleton className="h-8 w-3/4 mx-auto" />
            </CardTitle>
            <CardDescription className="text-center">
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If not signed in, this should redirect (handled by useEffect)
  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Redirecting to Sign In</CardTitle>
            <CardDescription className="text-center">
              Please sign in to accept this invitation
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // If invite not found or loading
  if (inviteDetails === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <Skeleton className="h-8 w-3/4 mx-auto" />
            </CardTitle>
            <CardDescription className="text-center">
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If invite not found
  if (inviteDetails === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">
              This invitation is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                The invitation you're trying to access could not be found or is no longer valid.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Organization Invitation</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join {inviteDetails.tenant.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Invited by</p>
              <p className="font-medium">{inviteDetails.inviter.name}</p>
              <p className="text-sm text-gray-500">{inviteDetails.inviter.email}</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Your role will be</p>
              <p className="font-medium capitalize">{inviteDetails.role}</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-700">Success</AlertTitle>
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          {!success ? (
            <Button 
              onClick={handleAcceptInvite} 
              disabled={isAccepting}
              className="w-full"
            >
              {isAccepting ? "Accepting..." : "Accept Invitation"}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 