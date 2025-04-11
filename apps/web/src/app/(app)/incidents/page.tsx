"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import {
  AlertTriangle,
  Filter,
  Plus,
  Search,
  ChevronRight,
  Clock,
  ChevronDown,
  Tag,
} from "lucide-react";
import Link from "next/link";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Type definitions
interface Incident {
  _id: Id<"incidents">;
  _creationTime: number;
  title: string;
  description: string;
  status: string;
  severity: string;
  incidentType: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  reportedAt: number;
  occuredAt?: number;
  resolvedAt?: number;
  reporter: {
    _id: Id<"users">;
    name: string;
    profilePicture?: string;
  };
  assignee?: {
    _id: Id<"users">;
    name: string;
    profilePicture?: string;
  };
  worksite?: {
    _id: Id<"worksites">;
    name: string;
  };
  tags?: string[];
}

// Helper functions for formatting
function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}

function getSeverityColor(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "reported":
      return "bg-blue-100 text-blue-800";
    case "investigating":
      return "bg-purple-100 text-purple-800";
    case "in_progress":
      return "bg-amber-100 text-amber-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getIncidentTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case "injury":
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case "near_miss":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case "hazard":
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case "property_damage":
      return <AlertTriangle className="h-5 w-5 text-blue-500" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-gray-500" />;
  }
}

export default function IncidentsPage() {
  const router = useRouter();

  // State for active tenant
  const [activeTenantId, setActiveTenantId] = useState<Id<"tenants"> | null>(
    null,
  );

  // States for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  // Get list of tenants the user belongs to
  const tenants = useQuery(api.tenants.list);

  // Set the first tenant as active if not already set
  useEffect(() => {
    if (tenants && tenants.length > 0 && !activeTenantId) {
      setActiveTenantId(tenants[0]._id);
    }
  }, [tenants, activeTenantId]);

  // Get incidents for the active tenant with filters
  const incidents = useQuery(
    api.incidents.listIncidentsByTenant,
    activeTenantId
      ? {
          tenantId: activeTenantId,
          status: statusFilter || undefined,
          incidentType: typeFilter || undefined,
          severity: severityFilter || undefined,
        }
      : "skip",
  ) as Incident[] | undefined;

  // Get incident statistics for the active tenant
  const stats = useQuery(
    api.incidents.getIncidentStatsByTenant,
    activeTenantId ? { tenantId: activeTenantId } : "skip",
  );

  // Filter incidents by search query
  const filteredIncidents = incidents
    ? incidents.filter(
        (incident) =>
          incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          incident.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          incident.reporter.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (incident.address &&
            incident.address.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : [];

  // Reference for incident types and statuses for dropdown filters
  const incidentTypes = [
    { value: "injury", label: "Injury" },
    { value: "near_miss", label: "Near Miss" },
    { value: "hazard", label: "Hazard" },
    { value: "property_damage", label: "Property Damage" },
    { value: "other", label: "Other" },
  ];

  const incidentStatuses = [
    { value: "reported", label: "Reported" },
    { value: "investigating", label: "Investigating" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  const incidentSeverities = [
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Incidents</h1>
          <p className="text-gray-600">Manage and track safety incidents</p>
        </div>

        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/incidents/new">
            <Plus className="mr-2 h-4 w-4" />
            Report Incident
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Incidents
                  </p>
                  <p className="text-2xl font-bold">{stats.totalCount}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Open Incidents
                  </p>
                  <p className="text-2xl font-bold">
                    {(stats.statusCounts?.reported || 0) +
                      (stats.statusCounts?.investigating || 0) +
                      (stats.statusCounts?.in_progress || 0)}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-amber-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Resolved</p>
                  <p className="text-2xl font-bold">{stats.resolvedCount}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Critical Issues
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.severityCounts?.critical || 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tenant selector and filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        {/* Tenant Selector */}
        <div className="w-full md:w-auto">
          <Select
            value={activeTenantId?.toString() || ""}
            onValueChange={(value) => setActiveTenantId(value as Id<"tenants">)}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Select Organization" />
            </SelectTrigger>
            <SelectContent defaultValue={tenants?.[0]?._id}>
              {tenants?.map((tenant) => (
                <SelectItem key={tenant._id} value={tenant._id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search incidents..."
              className="pl-9 w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <Select onValueChange={(value) => setStatusFilter(value || null)}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent defaultValue="all">
              <SelectItem value="all">All Statuses</SelectItem>
              {incidentStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select
            value={typeFilter || ""}
            onValueChange={(value) => setTypeFilter(value || null)}
          >
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent defaultValue="all">
              <SelectItem value="all">All Types</SelectItem>
              {incidentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Severity Filter */}
          <Select
            value={severityFilter || ""}
            onValueChange={(value) => setSeverityFilter(value || null)}
          >
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent defaultValue="all">
              <SelectItem value="all">All Severities</SelectItem>
              {incidentSeverities.map((severity) => (
                <SelectItem key={severity.value} value={severity.value}>
                  {severity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {incidents === undefined ? (
          // Loading state
          <div className="p-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="mb-4 border-b pb-4 last:border-b-0 last:pb-0"
              >
                <Skeleton className="h-6 w-64 mb-2" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            ))}
          </div>
        ) : filteredIncidents.length === 0 ? (
          // Empty state
          <div className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No incidents found
            </h3>
            <p className="text-gray-500 mb-4">
              {activeTenantId
                ? "No incidents match your current filters."
                : "Please select an organization to view incidents."}
            </p>
            {activeTenantId && (
              <Button asChild>
                <Link href="/incidents/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Report New Incident
                </Link>
              </Button>
            )}
          </div>
        ) : (
          // Incidents list
          <div className="divide-y divide-gray-200">
            {filteredIncidents.map((incident) => (
              <div
                key={incident._id}
                className="p-4 hover:bg-gray-50 transition-colors"
                onClick={() => router.push(`/incidents/${incident._id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">
                      {getIncidentTypeIcon(incident.incidentType)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {incident.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status.replace("_", " ")}
                        </Badge>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        {incident.worksite && (
                          <Badge variant="outline">
                            {incident.worksite.name}
                          </Badge>
                        )}
                        {incident.tags?.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="flex items-center"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                        {incident.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>Reported by {incident.reporter.name}</span>
                        <span>•</span>
                        <span>{formatDate(incident.reportedAt)}</span>
                        {incident.assignee && (
                          <>
                            <span>•</span>
                            <span>Assigned to {incident.assignee.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
