"use client";

import { useState, FormEvent, ChangeEvent, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { useTenantId } from "@/hooks/useTenantId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Tag } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Id } from '@/../../../packages/backend/convex/_generated/dataModel';

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
    if (e.key === 'Enter') {
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

export default function EditProjectPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { toast } = useToast();
  const tenantId = useTenantId();
  
  // Convex expects this as an Id<"projects">, so we cast it
  // In runtime it's just a string, so this is safe
  const projectId = params.id as unknown as Id<"projects">;
  
  // Get the project details to populate the form
  const project = useQuery(api.projects.getProject, { id: projectId });
  const updateProject = useMutation(api.projects.updateProject);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planned");
  const [priority, setPriority] = useState("medium");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [budget, setBudget] = useState<string>("");
  const [managerId, setManagerId] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [worksiteId, setWorksiteId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Get worksites in the tenant for the worksite dropdown
  const worksites = useQuery(
    api.worksites.listByTenant, 
    tenantId ? { tenantId } : "skip"
  );
  
  // Get users in the tenant for the manager dropdown
  const users = useQuery(
    api.users.listByTenant, 
    tenantId ? { tenantId } : "skip"
  );
  
  // Populate form with project data when loaded
  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setStatus(project.status);
      setPriority(project.priority);
      
      if (project.startDate) {
        setStartDate(new Date(project.startDate));
      }
      
      if (project.endDate) {
        setEndDate(new Date(project.endDate));
      }
      
      if (project.budget !== undefined) {
        setBudget(project.budget.toString());
      }
      
      if (project.managerId) {
        setManagerId(project.managerId as string);
      }
      
      if (project.teamMembers && project.teamMembers.length > 0) {
        setTeamMembers(project.teamMembers as string[]);
      }
      
      if (project.tags && project.tags.length > 0) {
        setTags(project.tags);
      }
      
      if (project.worksiteId) {
        setWorksiteId(project.worksiteId as string);
      }
    }
  }, [project]);
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!tenantId) {
      setError("No tenant selected");
      return;
    }
    
    if (!name) {
      setError("Name is required");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      await updateProject({
        id: projectId,
        name,
        description: description || undefined,
        worksiteId: worksiteId ? worksiteId as any : undefined,
        status,
        priority,
        startDate: startDate ? startDate.getTime() : undefined,
        endDate: endDate ? endDate.getTime() : undefined,
        budget: budget ? parseFloat(budget) : undefined,
        managerId: managerId ? managerId as any : undefined,
        teamMembers: teamMembers.length > 0 ? teamMembers as any[] : undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      
      toast({
        title: "Project updated",
        description: "Your project has been updated successfully",
      });
      
      // Redirect to project details page
      router.push(`/projects/${params.id}`);
    } catch (err: unknown) {
      console.error("Failed to update project:", err);
      setError(err instanceof Error ? err.message : "Failed to update project");
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!tenantId) {
    return <div className="p-4">Select a tenant to edit this project</div>;
  }
  
  if (!project) {
    return <div className="p-4">Loading project details...</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${params.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Button>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Edit Project</h1>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            
            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Project Name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Project Description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate ? date < startDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  type="number"
                  value={budget}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setBudget(e.target.value)}
                  placeholder="Project Budget"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <Label htmlFor="worksite">Worksite</Label>
                <Select value={worksiteId} onValueChange={setWorksiteId}>
                  <SelectTrigger id="worksite">
                    <SelectValue placeholder="Select worksite (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {worksites?.map((worksite) => (
                      <SelectItem key={worksite._id} value={worksite._id}>
                        {worksite.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="manager">Project Manager</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger id="manager">
                  <SelectValue placeholder="Select project manager (optional)" />
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
            
            <div>
              <Label htmlFor="tags">Tags</Label>
              <TagInput tags={tags} onChange={setTags} />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/projects/${params.id}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 