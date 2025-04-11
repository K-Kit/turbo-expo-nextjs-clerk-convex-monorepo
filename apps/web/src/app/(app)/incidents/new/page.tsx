"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Form Validation
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { MapView } from "@/components/map/MapView";

// Form Schema
const formSchema = z.object({
  tenantId: z.string().min(1, { message: "Organization is required" }),
  worksiteId: z.string().optional(),
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(100),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  incidentType: z.string().min(1, { message: "Incident type is required" }),
  severity: z.string().min(1, { message: "Severity is required" }),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  address: z.string().optional(),
  occuredAt: z.string().optional(), // Date string that will be converted to timestamp
  tags: z.array(z.string()).optional(),
});

export default function NewIncidentPage() {
  const router = useRouter();

  // State for map location (simulated for now)
  const [location, setLocation] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
  });

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get list of tenants the user belongs to
  const tenants = useQuery(api.tenants.list);

  // Setup the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      incidentType: "",
      severity: "",
      location: location,
      tags: [],
    },
  });

  // Get selected tenant ID from form
  const selectedTenantId = form.watch("tenantId");

  // Get worksites for selected tenant
  const worksites = useQuery(
    api.worksites.listByTenant,
    selectedTenantId ? { tenantId: selectedTenantId as Id<"tenants"> } : "skip",
  );

  // Update location in form when it changes
  useEffect(() => {
    form.setValue("location", location);
  }, [location, form]);

  // Set the first tenant as default when data loads
  useEffect(() => {
    if (tenants && tenants.length > 0 && !form.getValues("tenantId")) {
      form.setValue("tenantId", tenants[0]._id);
    }
  }, [tenants, form]);

  // Mutation to create an incident
  const reportIncident = useMutation(api.incidents.reportIncident);

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      // Transform any values as needed
      const occuredAt = values.occuredAt
        ? new Date(values.occuredAt).getTime()
        : undefined;

      // Call the mutation to create the incident
      const incidentId = await reportIncident({
        tenantId: values.tenantId as Id<"tenants">,
        worksiteId: values.worksiteId
          ? (values.worksiteId as Id<"worksites">)
          : undefined,
        title: values.title,
        description: values.description,
        incidentType: values.incidentType,
        severity: values.severity,
        location: values.location,
        address: values.address,
        occuredAt,
        tags: values.tags,
      });

      // Show success message
      toast.success("Incident reported successfully");

      // Redirect to incident details page
      router.push(`/incidents/${incidentId}`);
    } catch (error) {
      console.error("Error reporting incident:", error);
      toast.error("Failed to report incident");
      setIsSubmitting(false);
    }
  }

  // Reference data for dropdowns
  const incidentTypes = [
    { value: "injury", label: "Injury" },
    { value: "near_miss", label: "Near Miss" },
    { value: "hazard", label: "Hazard" },
    { value: "property_damage", label: "Property Damage" },
    { value: "other", label: "Other" },
  ];

  const incidentSeverities = [
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  // Simulate getting current location
  const getCurrentLocation = () => {
    // In a real app, you'd use the Geolocation API
    // navigator.geolocation.getCurrentPosition(...)

    // For now, just generate a slight variation of the current location
    const newLocation = {
      latitude: location.latitude + (Math.random() * 0.01 - 0.005),
      longitude: location.longitude + (Math.random() * 0.01 - 0.005),
    };

    setLocation(newLocation);
    form.setValue("location", newLocation);
    toast.success("Location updated");
  };

  // Handle address update
  const handleAddressChange = (address: string) => {
    form.setValue("address", address);

    // In a real app, you'd geocode this address to get coordinates
    // For now, just simulate a location change
    if (address) {
      const newLocation = {
        latitude: 37.7749 + (Math.random() * 0.02 - 0.01),
        longitude: -122.4194 + (Math.random() * 0.02 - 0.01),
      };
      setLocation(newLocation);
      form.setValue("location", newLocation);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-2">
          <Link href="/incidents" className="flex items-center text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Incidents
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Report New Incident</h1>
        <p className="text-gray-600">Document safety incidents and hazards</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
          <CardDescription>
            Provide detailed information about the incident or hazard
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organization Selection */}
                <FormField
                  control={form.control}
                  name="tenantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Organization" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenants?.map((tenant) => (
                            <SelectItem key={tenant._id} value={tenant._id}>
                              {tenant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Worksite Selection */}
                <FormField
                  control={form.control}
                  name="worksiteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Worksite (Optional)</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!selectedTenantId || isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Worksite" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {worksites?.map((worksite) => (
                            <SelectItem key={worksite._id} value={worksite._id}>
                              {worksite.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        If applicable, select the worksite where this incident
                        occurred
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Incident Basic Details */}
              <div>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief title describing the incident"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Incident Type */}
                <FormField
                  control={form.control}
                  name="incidentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Type" />
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

                {/* Severity */}
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {incidentSeverities.map((severity) => (
                            <SelectItem
                              key={severity.value}
                              value={severity.value}
                            >
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

              {/* Incident Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a detailed description of the incident"
                        rows={5}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Include what happened, any injuries, damage, or potential
                      hazards
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Incident Date/Time */}
                <FormField
                  control={form.control}
                  name="occuredAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>When did it occur?</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Input
                            type="datetime-local"
                            placeholder="Select date and time"
                            className="pl-10"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Leave blank if reporting in real-time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags (simplified for now) */}
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter tags separated by commas"
                          disabled={isSubmitting}
                          onChange={(e) => {
                            const tags = e.target.value
                              .split(",")
                              .map((tag) => tag.trim());
                            field.onChange(tags.filter(Boolean));
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Add keywords to help categorize this incident
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                  Location Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Address or location description"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleAddressChange(e.target.value);
                            }}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Coordinates (Read-only display) */}
                  <div>
                    <FormLabel>Coordinates</FormLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        value={`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
                        readOnly
                        disabled
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getCurrentLocation}
                        disabled={isSubmitting}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Get Location
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Map placeholder - would be a real map in production */}
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <MapView />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/incidents")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Submitting..." : "Report Incident"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
