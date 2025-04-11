"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { useTenantId } from "@/hooks/useTenantId";
import { Button } from "@/components/ui/button";
import { 
  CalendarClock,
  Briefcase,
  Plus,
  Clock,
  CheckCircle2,
  PauseCircle,
  XCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

export default function ProjectsPage() {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const tenantId = useTenantId();
  
  const projects = useQuery(
    api.projects.getProjects, 
    tenantId ? {
      tenantId,
      status: filterStatus || undefined,
    } : "skip"
  );
  
  if (!tenantId) {
    return <div className="p-4">Select a tenant to view projects</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link href="/projects/new">
          <Button className="bg-blue-500 text-white p-2 rounded-md flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div className="w-full sm:w-72">
            <Label htmlFor="statusFilter">Filter by Status</Label>
            <Select 
              value={filterStatus || ""} 
              onValueChange={(value) => setFilterStatus(value || null)}
            >
              <SelectTrigger id="statusFilter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {projects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.length > 0 ? (
            projects.map((project) => (
              <Link key={project._id} href={`/projects/${project._id}`}>
                <Card className="h-full border rounded-md p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Briefcase className="h-5 w-5 mr-2 text-blue-500" />
                      {project.name}
                    </h3>
                    <StatusBadge status={project.status} />
                  </div>
                  
                  {project.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <PriorityBadge priority={project.priority} />
                    
                    {project.tags && project.tags.length > 0 && (
                      project.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-100">
                          {tag}
                        </Badge>
                      ))
                    )}
                    
                    {project.tags && project.tags.length > 2 && (
                      <Badge variant="secondary" className="bg-gray-100">
                        +{project.tags.length - 2} more
                      </Badge>
                    )}
                  </div>
                  
                  {(project.startDate || project.endDate) && (
                    <div className="text-xs text-gray-500 flex items-center mb-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      {project.startDate && (
                        <span>
                          {format(project.startDate, "MMM d, yyyy")}
                        </span>
                      )}
                      {project.startDate && project.endDate && (
                        <span className="mx-1">to</span>
                      )}
                      {project.endDate && (
                        <span>
                          {format(project.endDate, "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Updated {formatDistanceToNow(project.updatedAt)} ago
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center p-8 border rounded-md bg-gray-50">
              <p className="text-gray-500 mb-2">No projects found.</p>
              <p className="text-sm text-gray-400">
                {filterStatus 
                  ? `Try selecting a different status filter or create a new project.` 
                  : `Get started by creating your first project.`}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-8">Loading projects...</div>
      )}
    </div>
  );
} 