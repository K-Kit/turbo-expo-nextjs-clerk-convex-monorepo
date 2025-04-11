"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { useTenantId } from "@/hooks/useTenantId";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, AlertCircle, Plus, Clock } from 'lucide-react';
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function ContractorsPage() {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const tenantId = useTenantId();
  
  const contractors = useQuery(
    api.contractors.getContractors, 
    tenantId ? {
      tenantId,
      status: filterStatus || undefined,
    } : "skip"
  );
  
  if (!tenantId) {
    return <div className="p-4">Select a tenant to view contractors</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contractors</h1>
        <Link href="/contractors/new">
          <Button className="bg-blue-500 text-white p-2 rounded-md flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Contractor
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <div className="flex gap-2">
          <Button 
            className={`p-2 rounded-md ${filterStatus === null ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterStatus(null)}
          >
            All Status
          </Button>
          <Button 
            className={`p-2 rounded-md flex items-center ${filterStatus === "active" ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterStatus("active")}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Active
          </Button>
          <Button 
            className={`p-2 rounded-md flex items-center ${filterStatus === "pending" ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterStatus("pending")}
          >
            <Clock className="h-4 w-4 mr-2" />
            Pending
          </Button>
          <Button 
            className={`p-2 rounded-md flex items-center ${filterStatus === "inactive" ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterStatus("inactive")}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Inactive
          </Button>
        </div>
      </div>
      
      {contractors ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractors.length > 0 ? (
            contractors.map((contractor) => (
              <div key={contractor._id} className="border rounded-md p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-500" />
                    {contractor.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    contractor.status === "active" ? "bg-green-100 text-green-800" : 
                    contractor.status === "pending" ? "bg-amber-100 text-amber-800" : 
                    "bg-red-100 text-red-800"
                  }`}>
                    {contractor.status}
                  </span>
                </div>
                
                {contractor.description && (
                  <p className="text-sm text-gray-600 mt-2">{contractor.description}</p>
                )}
                
                {contractor.contactName && (
                  <div className="mt-3 text-sm">
                    <span className="font-medium">Contact:</span> {contractor.contactName}
                  </div>
                )}
                
                {contractor.specialties && contractor.specialties.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm font-medium">Specialties:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {contractor.specialties.map((specialty, index) => (
                        <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 text-xs text-gray-400">
                  Last updated: {formatDistanceToNow(contractor.updatedAt)} ago
                </div>
                
                <div className="mt-4 flex justify-end gap-2">
                  <Link href={`/contractors/${contractor._id}`}>
                    <Button className="bg-gray-200 text-gray-800 p-2 rounded-md text-xs">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center p-8 border rounded-md bg-gray-50">
              <p>No contractors found. Try adjusting your filters or add a new contractor.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-8">Loading contractors...</div>
      )}
    </div>
  );
} 