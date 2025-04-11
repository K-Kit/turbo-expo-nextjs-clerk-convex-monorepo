"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { Id } from "@/../../../packages/backend/convex/_generated/dataModel";
import { useTenantId } from "@/hooks/useTenantId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  CalendarIcon, 
  MapPin, 
  Tag,
  ClipboardList,
  ArrowLeft
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const TagInput = ({ tags, onChange }: TagInputProps) => {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      onChange(newTags);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a tag..."
          className="flex-1"
        />
        <Button type="button" onClick={addTag} variant="outline">Add</Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag, index) => (
          <Badge 
            key={index} 
            variant="secondary"
            className="flex items-center gap-1"
          >
            {tag}
            <button 
              type="button" 
              onClick={() => removeTag(tag)}
              className="ml-1 text-xs hover:text-red-500"
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

interface LocationInputProps {
  location: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number } | null) => void;
}

const LocationInput = ({ location, onChange }: LocationInputProps) => {
  const [lat, setLat] = useState(location?.lat.toString() || "");
  const [lng, setLng] = useState(location?.lng.toString() || "");

  const handleLatChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLat(e.target.value);
    updateLocation(e.target.value, lng);
  };

  const handleLngChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLng(e.target.value);
    updateLocation(lat, e.target.value);
  };

  const updateLocation = (latValue: string, lngValue: string) => {
    if (latValue && lngValue) {
      const latNum = parseFloat(latValue);
      const lngNum = parseFloat(lngValue);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        onChange({ lat: latNum, lng: lngNum });
        return;
      }
    }
    // If either value is invalid, set location to null
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            value={lat}
            onChange={handleLatChange}
            placeholder="Enter latitude"
          />
        </div>
        <div>
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            value={lng}
            onChange={handleLngChange}
            placeholder="Enter longitude"
          />
        </div>
      </div>
      {location && (
        <div className="text-xs text-gray-500 flex items-center">
          <MapPin className="h-3 w-3 mr-1" />
          Location set: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default function NewWorkOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const tenantId = useTenantId();
  const createWorkOrder = useMutation(api.workorders.createWorkOrder);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("medium");
  const [type, setType] = useState("maintenance");
  const [projectId, setProjectId] = useState<Id<"projects"> | null>(null);
  const [assetId, setAssetId] = useState<Id<"assets"> | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [assignedTeam, setAssignedTeam] = useState<Id<"users"> | null>(null);
  const [assignedTo, setAssignedTo] = useState<Id<"users"> | null>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [estimatedHours, setEstimatedHours] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Get projects in the tenant for the project dropdown
  const projects = useQuery(
    api.projects.getProjects, 
    tenantId ? { tenantId } : "skip"
  );
  
  // Get assets in the tenant for the asset dropdown
  const assets = useQuery(
    api.assets.getAssets, 
    tenantId ? { tenantId } : "skip"
  );
  
  // Get users in the tenant for the assignee dropdown
  const users = useQuery(
    api.users.listByTenant, 
    tenantId ? { tenantId } : "skip"
  );
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!tenantId) {
      setError("No tenant selected");
      return;
    }
    
    if (!title) {
      setError("Title is required");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      await createWorkOrder({
        tenantId,
        title,
        description: description || undefined,
        status,
        priority,
        type,
        projectId: projectId || undefined,
        assetId: assetId || undefined,
        location: location || undefined,
        assignedTeam: assignedTeam || undefined,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate ? dueDate.getTime() : undefined,
        startDate: startDate ? startDate.getTime() : undefined,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      
      toast({
        title: "Work Order Created",
        description: "Your work order has been created successfully",
      });
      
      // Redirect to work orders list
      router.push("/workorders");
    } catch (err: unknown) {
      console.error("Failed to create work order:", err);
      setError(err instanceof Error ? err.message : "Failed to create work order");
      toast({
        title: "Error",
        description: "Failed to create work order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!tenantId) {
    return <div className="p-4">Select a tenant to create a work order</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/workorders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Work Orders
        </Button>
      </div>
      
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Create New Work Order</h1>
      </div>
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Work Order Details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column - Basic information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Work Order Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="type">Work Order Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="installation">Installation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <TagInput tags={tags} onChange={setTags} />
                </div>
              </div>
              
              {/* Right column - Assignments and dates */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project">Related Project</Label>
                  <Select 
                    value={projectId ? projectId : ""} 
                    onValueChange={(value) => setProjectId(value ? value as Id<"projects"> : null)}
                  >
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Select project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="asset">Related Asset</Label>
                  <Select 
                    value={assetId ? assetId : ""} 
                    onValueChange={(value) => setAssetId(value ? value as Id<"assets"> : null)}
                  >
                    <SelectTrigger id="asset">
                      <SelectValue placeholder="Select asset (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {assets?.map((asset) => (
                        <SelectItem key={asset._id} value={asset._id}>
                          {asset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select 
                    value={assignedTo ? assignedTo : ""} 
                    onValueChange={(value) => setAssignedTo(value ? value as Id<"users"> : null)}
                  >
                    <SelectTrigger id="assignedTo">
                      <SelectValue placeholder="Select assignee (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dueDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          disabled={(date) => startDate ? date < startDate : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    step="0.1"
                    min="0"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    placeholder="Estimated hours to complete"
                  />
                </div>
                
                <div>
                  <Label>Location</Label>
                  <LocationInput location={location} onChange={setLocation} />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/workorders")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Work Order"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 