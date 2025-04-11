"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import Link from "next/link";
import { ArrowLeft, MapPin, AlertTriangle, Calendar } from "lucide-react";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Form Validation
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form Schema
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }).max(100),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  incidentType: z.string().min(1, { message: "Incident type is required" }),
  severity: z.string().min(1, { message: "Severity is required" }),
  status: z.string().min(1, { message: "Status is required" }),
  assignedToId: z.string().optional(),
  actionTaken: z.string().optional(),
  preventativeMeasures: z.string().optional(),
  tags: z.array(z.string()).optional(),
  address: z.string().optional(),
});

export default function EditIncidentPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as Id<"incidents">;
  
  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Get incident details
  const incident = useQuery(api.incidents.getIncidentById, { incidentId });
  
  // Get tenant members for assignee selection
  const tenantMembers = useQuery(
    api.users.listByTenant,
    incident ? { tenantId: incident.tenantId } : "skip"
  );
  
  // Setup the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      incidentType: "",
      severity: "",
      status: "",
      assignedToId: "",
      actionTaken: "",
      preventativeMeasures: "",
      tags: [],
      address: "",
    },
  });
  
  // Mutation to update an incident
  const updateIncident = useMutation(api.incidents.updateIncident);
  
  // Load incident data into form when available
  useEffect(() => {
    if (incident) {
      form.reset({
        title: incident.title,
        description: incident.description,
        incidentType: incident.incidentType,
        severity: incident.severity,
        status: incident.status,
        assignedToId: incident.assignedToId || "",
        actionTaken: incident.actionTaken || "",
        preventativeMeasures: incident.preventativeMeasures || "",
        tags: incident.tags || [],
        address: incident.address || "",
      });
      
      setLocation(incident.location);
    }
  }, [incident, form]);
  
  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      // Prepare the update data
      const updateData: {
        incidentId: Id<"incidents">;
        description?: string;
        status?: string;
        assignedToId?: Id<"users">;
        actionTaken?: string;
        preventativeMeasures?: string;
        severity?: string;
        tags?: string[];
      } = {
        incidentId,
        description: values.description,
        status: values.status,
        severity: values.severity,
        actionTaken: values.actionTaken,
        preventativeMeasures: values.preventativeMeasures,
        tags: values.tags,
      };
      
      // Only include assignedToId if a valid value is provided
      if (values.assignedToId && values.assignedToId !== "") {
        updateData.assignedToId = values.assignedToId as Id<"users">;
      }
      
      // Call the mutation to update the incident
      await updateIncident(updateData);
      
      // Show success message
      toast.success("Incident updated successfully");
      
      // Redirect to incident details page
      router.push(`/incidents/${incidentId}`);
    } catch (error) {
      console.error("Error updating incident:", error);
      toast.error("Failed to update incident");
      setIsSubmitting(false);
    }
  }
  
  // Reference data for dropdowns
  const incidentTypes = [
    { value: 'injury', label: 'Injury' },
    { value: 'near_miss', label: 'Near Miss' },
    { value: 'hazard', label: 'Hazard' },
    { value: 'property_damage', label: 'Property Damage' },
    { value: 'other', label: 'Other' },
  ];
  
  const incidentSeverities = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];
  
  const incidentStatuses = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];
  
  // Loading state
  if (!incident) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-2">
            <Link href="/incidents" className="flex items-center text-gray-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Incidents
            </Link>
          </Button>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-40 mb-2" />
            <Skeleton className="h-5 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-2">
          <Link href={`/incidents/${incidentId}`} className="flex items-center text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Incident Details
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Incident</h1>
        <p className="text-gray-500">Update the details of the incident</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Incident Information</CardTitle>
          <CardDescription>
            Edit incident details and make updates to its status and assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="incidentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {incidentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {incidentSeverities.map((severity) => (
                            <SelectItem key={severity.value} value={severity.value}>
                              {severity.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {incidentStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select assignee" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {tenantMembers?.map((member) => (
                            <SelectItem key={member._id} value={member._id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={5}
                        placeholder="Detailed description of the incident"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="actionTaken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actions Taken</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={4}
                        placeholder="Describe actions taken to address this incident"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="preventativeMeasures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prevention Plan</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={4}
                        placeholder="Describe measures to prevent similar incidents in the future"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {location && (
                <div>
                  <FormLabel>Location</FormLabel>
                  <div className="mt-2 p-4 bg-gray-100 rounded-md">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <p className="text-sm text-gray-600">
                        Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Address of the incident location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/incidents/${incidentId}`)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 