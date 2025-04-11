"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { useTenantId } from "@/hooks/useTenantId";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Id } from '@/../../../packages/backend/convex/_generated/dataModel';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDistanceToNow, format } from "date-fns";
import { 
  CalendarClock, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  PauseCircle, 
  XCircle, 
  AlertTriangle, 
  Calendar,
  User,
  MapPin,
  Tag,
  Banknote,
  Edit,
  Trash2,
  ArrowLeft,
  Plus
} from 'lucide-react';
import Link from "next/link";

// Status badges with appropriate colors
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "planned":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="w-3 h-3" />
          Planned
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
          <CalendarClock className="w-3 h-3" />
          In Progress
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </Badge>
      );
    case "on_hold":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-orange-50 text-orange-700 border-orange-200">
          <PauseCircle className="w-3 h-3" />
          On Hold
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3" />
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">{status}</Badge>
      );
  }
};

// Priority badges with appropriate colors
const PriorityBadge = ({ priority }: { priority: string }) => {
  switch (priority) {
    case "low":
      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
          Low
        </Badge>
      );
    case "medium":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Medium
        </Badge>
      );
    case "high":
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          High
        </Badge>
      );
    case "critical":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Critical
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">{priority}</Badge>
      );
  }
};

// Task status badge component
const TaskStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "todo":
      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
          To Do
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          In Progress
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Completed
        </Badge>
      );
    case "blocked":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Blocked
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">{status}</Badge>
      );
  }
};

export default function ProjectDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { toast } = useToast();
  const tenantId = useTenantId();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Convex expects this as an Id<"projects">, so we cast it
  // In runtime it's just a string, so this is safe
  const projectId = params.id as unknown as Id<"projects">;
  
  // Get project details
  const project = useQuery(api.projects.getProject, { id: projectId });
  
  // Get project tasks
  const tasks = useQuery(api.projects.getProjectTasks, { projectId });
  
  // Get worksite details if available
  const worksite = useQuery(
    api.worksites.getWorksite, 
    project?.worksiteId ? { id: project.worksiteId } : "skip"
  );
  
  // Get manager details if available
  const manager = useQuery(
    api.users.getUser, 
    project?.managerId ? { id: project.managerId } : "skip"
  );
  
  // Mutation to delete project
  const deleteProject = useMutation(api.projects.deleteProject);
  
  const handleDeleteProject = async () => {
    try {
      await deleteProject({ id: projectId });
      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted",
      });
      router.push("/projects");
    } catch (err) {
      console.error("Failed to delete project:", err);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };
  
  if (!tenantId) {
    return <div className="p-4">Select a tenant to view this project</div>;
  }
  
  if (!project) {
    return <div className="p-4">Loading project details...</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center">
          <Briefcase className="h-6 w-6 mr-3 text-blue-500" />
          <h1 className="text-2xl font-bold">{project.name}</h1>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/projects/${params.id}/edit`}>
            <Button variant="outline" size="sm" className="flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center text-red-500 border-red-200 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Project</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this project? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteProject}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex items-center gap-3 mb-6">
        <StatusBadge status={project.status} />
        <PriorityBadge priority={project.priority} />
        {project.tags && project.tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="bg-gray-100">
            {tag}
          </Badge>
        ))}
      </div>
      
      <Tabs defaultValue="details" className="mb-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                    <p className="text-sm">{project.description}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <div><StatusBadge status={project.status} /></div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                  <div><PriorityBadge priority={project.priority} /></div>
                </div>
                
                {(project.startDate || project.endDate) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Timeline</h3>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {project.startDate && (
                        <span>
                          {format(project.startDate, "MMM d, yyyy")}
                        </span>
                      )}
                      {project.startDate && project.endDate && (
                        <span className="mx-2">to</span>
                      )}
                      {project.endDate && (
                        <span>
                          {format(project.endDate, "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {project.budget !== undefined && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Budget</h3>
                    <div className="flex items-center text-sm">
                      <Banknote className="h-4 w-4 mr-2 text-gray-400" />
                      ${project.budget.toFixed(2)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {worksite && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Associated Worksite</h3>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <Link href={`/worksites/${project.worksiteId}`} className="text-blue-500 hover:underline">
                        {worksite.name}
                      </Link>
                    </div>
                  </div>
                )}
                
                {manager && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Project Manager</h3>
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {manager.name}
                    </div>
                  </div>
                )}
                
                {project.tags && project.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-100">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                  <p className="text-sm">{format(project.createdAt, "PPP")}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                  <p className="text-sm">{formatDistanceToNow(project.updatedAt)} ago</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Project Tasks</h2>
            <Link href={`/projects/${params.id}/tasks/new`}>
              <Button size="sm" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </Link>
          </div>
          
          {tasks ? (
            tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Card key={task._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium">{task.name}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                        </div>
                        <TaskStatusBadge status={task.status} />
                      </div>
                      
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                        {task.assignedTo && (
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            Assigned to: {task.assignedTo}
                          </div>
                        )}
                        
                        {task.dueDate && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due: {format(task.dueDate, "MMM d, yyyy")}
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Created: {formatDistanceToNow(task.createdAt)} ago
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border rounded-md bg-gray-50">
                <p className="text-gray-500 mb-2">No tasks found for this project.</p>
                <p className="text-sm text-gray-400">
                  Get started by adding your first task.
                </p>
              </div>
            )
          ) : (
            <div className="text-center p-8">
              <p>Loading tasks...</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 