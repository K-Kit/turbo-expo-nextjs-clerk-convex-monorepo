"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { useTenantId } from "@/hooks/useTenantId";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList,
  Plus,
  Clock,
  CheckCircle2,
  PauseCircle,
  XCircle,
  AlertTriangle,
  HardHat,
  Search,
  FileSpreadsheet,
  Wrench,
  Hammer,
  Tags,
  Users
} from 'lucide-react';
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Status badges with appropriate colors
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "open":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="w-3 h-3" />
          Open
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
          <HardHat className="w-3 h-3" />
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

// Type badges with appropriate icons
const TypeBadge = ({ type }: { type: string }) => {
  let Icon;
  switch (type) {
    case "maintenance":
      Icon = Wrench;
      break;
    case "inspection":
      Icon = Search;
      break;
    case "repair":
      Icon = Hammer;
      break;
    case "installation":
      Icon = FileSpreadsheet;
      break;
    default:
      Icon = Tags;
  }
  
  return (
    <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 text-gray-700 border-gray-200">
      <Icon className="w-3 h-3" />
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
};

export default function WorkOrdersPage() {
  const tenantId = useTenantId();
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  const workOrders = useQuery(
    api.workorders.getWorkOrders, 
    tenantId ? {
      tenantId,
      status: filterStatus || undefined,
      type: filterType || undefined,
      priority: filterPriority || undefined
    } : "skip"
  );
  
  // Filter work orders by search term (client-side filtering)
  const filteredWorkOrders = workOrders?.filter(workOrder => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      workOrder.number.toLowerCase().includes(searchLower) ||
      workOrder.title.toLowerCase().includes(searchLower) ||
      (workOrder.description && workOrder.description.toLowerCase().includes(searchLower))
    );
  });
  
  if (!tenantId) {
    return <div className="p-4">Select a tenant to view work orders</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Work Orders</h1>
        <Link href="/workorders/new">
          <Button className="bg-blue-500 text-white p-2 rounded-md flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Create Work Order
          </Button>
        </Link>
      </div>
      
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="w-full sm:w-auto flex-1">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="search"
                type="text"
                placeholder="Search by number, title or description"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-full sm:w-40">
            <Label htmlFor="statusFilter">Status</Label>
            <Select 
              value={filterStatus || ""} 
              onValueChange={(value) => setFilterStatus(value || null)}
            >
              <SelectTrigger id="statusFilter">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-40">
            <Label htmlFor="typeFilter">Type</Label>
            <Select 
              value={filterType || ""} 
              onValueChange={(value) => setFilterType(value || null)}
            >
              <SelectTrigger id="typeFilter">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="installation">Installation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-40">
            <Label htmlFor="priorityFilter">Priority</Label>
            <Select 
              value={filterPriority || ""} 
              onValueChange={(value) => setFilterPriority(value || null)}
            >
              <SelectTrigger id="priorityFilter">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {filteredWorkOrders ? (
        <div className="space-y-4">
          {filteredWorkOrders.length > 0 ? (
            filteredWorkOrders.map((workOrder) => (
              <Link key={workOrder._id} href={`/workorders/${workOrder._id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow duration-200 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="md:w-16 flex justify-center items-center">
                    <ClipboardList className="h-10 w-10 text-blue-500" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold">{workOrder.title}</h3>
                        <p className="text-sm text-gray-500">#{workOrder.number}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={workOrder.status} />
                        <PriorityBadge priority={workOrder.priority} />
                        <TypeBadge type={workOrder.type} />
                      </div>
                    </div>
                    
                    {workOrder.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{workOrder.description}</p>
                    )}
                    
                    <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-x-6 gap-y-2">
                      {workOrder.dueDate && (
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Due: {new Date(workOrder.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {workOrder.assignedTo && (
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          Assigned
                        </span>
                      )}
                      <span>
                        Created {formatDistanceToNow(workOrder.createdAt)} ago
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center p-8 border rounded-md bg-gray-50">
              <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 mb-2">No work orders found.</p>
              <p className="text-sm text-gray-400">
                {(filterStatus || filterType || filterPriority || searchTerm)
                  ? "Try changing your filters or search term."
                  : "Create your first work order to get started."}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-8">
          <p>Loading work orders...</p>
        </div>
      )}
    </div>
  );
} 