"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { useTenantId } from "@/hooks/useTenantId";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck, Plus } from 'lucide-react';
import Link from "next/link";

export default function POIsPage() {
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const tenantId = useTenantId();
  
  const pois = useQuery(
    api.pois.getPOIs, 
    tenantId ? {
      tenantId,
      type: filterType || undefined,
      status: filterStatus || undefined,
    } : "skip"
  );
  
  if (!tenantId) {
    return <div className="p-4">Select a tenant to view POIs</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Points of Interest</h1>
        <Link href="/pois/new">
          <Button className="bg-blue-500 text-white p-2 rounded-md flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add POI
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <Button 
            className={`p-2 rounded-md ${filterType === null ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterType(null)}
          >
            All Types
          </Button>
          <Button 
            className={`p-2 rounded-md flex items-center ${filterType === "hazard" ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterType("hazard")}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Hazards
          </Button>
          <Button 
            className={`p-2 rounded-md flex items-center ${filterType === "safety_equipment" ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterType("safety_equipment")}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Safety Equipment
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            className={`p-2 rounded-md ${filterStatus === null ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterStatus(null)}
          >
            All Status
          </Button>
          <Button 
            className={`p-2 rounded-md ${filterStatus === "active" ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterStatus("active")}
          >
            Active
          </Button>
          <Button 
            className={`p-2 rounded-md ${filterStatus === "inactive" ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterStatus("inactive")}
          >
            Inactive
          </Button>
        </div>
      </div>
      
      {pois ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pois.length > 0 ? (
            pois.map((poi) => (
              <div key={poi._id} className="border rounded-md p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold flex items-center">
                    {poi.type === "hazard" ? (
                      <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 mr-2 text-green-500" />
                    )}
                    {poi.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    poi.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {poi.status}
                  </span>
                </div>
                
                {poi.description && (
                  <p className="text-sm text-gray-600 mt-2">{poi.description}</p>
                )}
                
                <div className="mt-4 text-xs text-gray-500">
                  Location: {poi.location.lat.toFixed(6)}, {poi.location.lng.toFixed(6)}
                </div>
                
                <div className="mt-4 flex justify-end gap-2">
                  <Link href={`/pois/${poi._id}`}>
                    <Button className="bg-gray-200 text-gray-800 p-2 rounded-md text-xs">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center p-8 border rounded-md bg-gray-50">
              <p>No points of interest found. Try adjusting your filters or add a new POI.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-8">Loading points of interest...</div>
      )}
    </div>
  );
} 