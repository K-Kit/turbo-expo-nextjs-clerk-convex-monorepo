"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Building, 
  Tag,
  CheckCircle2,
  XCircle,
  Edit,
  AlertTriangle
} from "lucide-react";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MapView } from "@/components/map/MapView";

// Define types for incident and tenant member
interface Incident {
  _id: Id<"incidents">;
  _creationTime: number;
  title: string;
  description: string;
  incidentType: string;
  severity: string;
  status: string;
  location: { latitude: number; longitude: number };
  address?: string;
  tenantId: Id<"tenants">;
  worksiteId?: Id<"worksites">;
  reportedById: Id<"users">;
  assignedToId?: Id<"users">;
  reportedAt: number;
  occuredAt?: number;
  resolvedAt?: number;
  actionTaken?: string;
  preventativeMeasures?: string;
  tags?: string[];
  tenant?: { name: string };
  worksite?: { name: string };
  reporter?: { name: string; profilePicture?: string };
  assignee?: { name: string; profilePicture?: string };
}

interface TenantMember {
  _id: Id<"users">;
  name: string;
  profilePicture?: string;
}

export default function IncidentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as Id<"incidents">;
  
  // State for incident update
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState<Id<"users"> | undefined>();
  const [actionTaken, setActionTaken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use type assertion to access the API functions
  const getIncidentById = api.incidents?.getIncidentById as any;
  const updateIncidentMutation = api.incidents?.updateIncident as any;
  const listByTenant = api.users?.listByTenant as any;
  
  // Fetch incident details
  const incident = useQuery(getIncidentById, { incidentId });
  
  // Fetch tenant members for assignee selection
  const tenantMembers = useQuery(
    listByTenant,
    incident ? { tenantId: incident.tenantId } : "skip"
  );
  
  // Update incident mutation
  const updateIncident = useMutation(updateIncidentMutation);
  
  // Format dates
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800 border-red-300";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-300";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  
  // Get incident type icon
  const getIncidentTypeIcon = (type: string) => {
    switch (type) {
      case "injury":
        return <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />;
      case "near_miss":
        return <XCircle className="h-5 w-5 mr-2 text-orange-500" />;
      case "hazard":
        return <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />;
      case "property_damage":
        return <Building className="h-5 w-5 mr-2 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 mr-2 text-gray-500" />;
    }
  };
  
  // Get incident type label
  const getIncidentTypeLabel = (type: string) => {
    switch (type) {
      case "injury":
        return "Injury";
      case "near_miss":
        return "Near Miss";
      case "hazard":
        return "Hazard";
      case "property_damage":
        return "Property Damage";
      default:
        return "Other";
    }
  };
  
  // Handle update incident
  const handleUpdateIncident = async () => {
    if (!newStatus && !newAssigneeId && !actionTaken) {
      toast.error("No changes to save");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const updateData: {
        incidentId: Id<"incidents">;
        status?: string;
        assignedToId?: Id<"users">;
        actionTaken?: string;
      } = {
        incidentId,
      };
      
      if (newStatus) {
        updateData.status = newStatus;
      }
      
      if (newAssigneeId) {
        updateData.assignedToId = newAssigneeId;
      }
      
      if (actionTaken) {
        updateData.actionTaken = actionTaken;
      }
      
      await updateIncident(updateData);
      
      toast.success("Incident updated successfully");
      setUpdateDialogOpen(false);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error updating incident:", error);
      toast.error("Failed to update incident");
      setIsSubmitting(false);
    }
  };
  
  // When incident data loads, set default values for the form
  useEffect(() => {
    if (incident) {
      setNewStatus(incident.status || "");
      setNewAssigneeId(incident.assignedToId);
      setActionTaken(incident.actionTaken || "");
    }
  }, [incident]);
  
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-40 mb-2" />
                <Skeleton className="h-5 w-64" />
              </CardHeader>
              <CardContent className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="mb-6">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-2">
          <Link href="/incidents" className="flex items-center text-gray-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Incidents
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{incident.title}</h1>
            <div className="flex items-center mt-2">
              <div className="flex items-center mr-4">
                {getIncidentTypeIcon(incident.incidentType)}
                <span className="text-gray-600">
                  {getIncidentTypeLabel(incident.incidentType)}
                </span>
              </div>
              <Badge className={getSeverityColor(incident.severity)}>
                {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)} Severity
              </Badge>
              <Badge className={`ml-2 ${getStatusColor(incident.status)}`}>
                {incident.status === "in_progress" 
                  ? "In Progress" 
                  : incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
              </Badge>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/incidents/${incidentId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
              <DialogTrigger>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Incident
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Incident</DialogTitle>
                  <DialogDescription>
                    Change the status, assignee or add details of action taken
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="status" className="text-sm font-medium">
                      Status
                    </label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="assignee" className="text-sm font-medium">
                      Assign To
                    </label>
                    <Select 
                      value={newAssigneeId?.toString() || ""} 
                      onValueChange={(value) => setNewAssigneeId(value ? value as Id<"users"> : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {tenantMembers?.map((member: TenantMember) => (
                          <SelectItem key={member._id} value={member._id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="actions" className="text-sm font-medium">
                      Actions Taken
                    </label>
                    <Textarea
                      placeholder="Describe actions taken to address this incident"
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setUpdateDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateIncident}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{incident.description}</p>
            </CardContent>
          </Card>
          
          {incident.actionTaken && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Actions Taken</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{incident.actionTaken}</p>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              {incident.address && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                  <p>{incident.address}</p>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Coordinates</h3>
                <p>
                  {incident.location.latitude.toFixed(6)}, {incident.location.longitude.toFixed(6)}
                </p>
              </div>
              
              {/* Map placeholder - would be a real map in production */}
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              
              <MapView
                zoom={15}
              />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Organization
                </h3>
                <p>{incident.tenant?.name}</p>
              </div>
              
              {incident.worksite && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Worksite
                  </h3>
                  <p>{incident.worksite?.name}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Reported
                </h3>
                <p>{formatDate(incident._creationTime)}</p>
              </div>
              
              {incident.occuredAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Occurred
                  </h3>
                  <p>{formatDate(incident.occuredAt)}</p>
                </div>
              )}
              
              {incident.resolvedAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Resolved
                  </h3>
                  <p>{formatDate(incident.resolvedAt)}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Reported By
                </h3>
                <p>
                  {incident.reporter?.name}
                </p>
              </div>
              
              {incident.assignedToId && incident.assignee && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Assigned To
                  </h3>
                  <p>
                    {incident.assignee.name}
                  </p>
                </div>
              )}
              
              {incident.tags && incident.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {incident.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Prevention Measures Card (Placeholder for future extension) */}
          <Card>
            <CardHeader>
              <CardTitle>Prevention Measures</CardTitle>
            </CardHeader>
            <CardContent>
              {incident.preventativeMeasures ? (
                <div>
                  <p className="whitespace-pre-wrap">{incident.preventativeMeasures}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  No prevention measures have been added yet.
                </p>
              )}
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={() => router.push(`/incidents/${incidentId}/edit`)}
              >
                {incident.preventativeMeasures ? "Edit Prevention Plan" : "Add Prevention Plan"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 