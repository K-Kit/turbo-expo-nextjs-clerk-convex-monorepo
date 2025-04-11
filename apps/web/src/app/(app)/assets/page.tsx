"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { useTenantId } from "@/hooks/useTenantId";
import { Button } from "@/components/ui/button";
import { Truck, Wrench, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function AssetsPage() {
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const tenantId = useTenantId();
  
  const assets = useQuery(
    api.assets.getAssets, 
    tenantId ? {
      tenantId,
      type: filterType || undefined,
      status: filterStatus || undefined,
    } : "skip"
  );
  
  if (!tenantId) {
    return <div className="p-4">Select a tenant to view assets</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assets</h1>
        <Link href="/assets/new">
          <Button className="bg-blue-500 text-white p-2 rounded-md flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
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
            className={`p-2 rounded-md flex items-center ${filterType === "vehicle" ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterType("vehicle")}
          >
            <Truck className="h-4 w-4 mr-2" />
            Vehicles
          </Button>
          <Button 
            className={`p-2 rounded-md flex items-center ${filterType === "equipment" ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterType("equipment")}
          >
            <Wrench className="h-4 w-4 mr-2" />
            Equipment
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
            className={`p-2 rounded-md flex items-center ${filterStatus === "operational" ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterStatus("operational")}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Operational
          </Button>
          <Button 
            className={`p-2 rounded-md flex items-center ${filterStatus === "maintenance" ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilterStatus("maintenance")}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Maintenance
          </Button>
        </div>
      </div>
      
      {assets ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.length > 0 ? (
            assets.map((asset) => (
              <div key={asset._id} className="border rounded-md p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold flex items-center">
                    {asset.type === "vehicle" ? (
                      <Truck className="h-5 w-5 mr-2 text-blue-500" />
                    ) : (
                      <Wrench className="h-5 w-5 mr-2 text-amber-500" />
                    )}
                    {asset.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    asset.status === "operational" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {asset.status}
                  </span>
                </div>
                
                {asset.description && (
                  <p className="text-sm text-gray-600 mt-2">{asset.description}</p>
                )}
                
                <div className="mt-4 text-xs text-gray-500">
                  Location: {asset.location.lat.toFixed(6)}, {asset.location.lng.toFixed(6)}
                </div>
                
                <div className="mt-1 text-xs text-gray-400">
                  Last updated: {formatDistanceToNow(asset.lastUpdated)} ago
                </div>
                
                <div className="mt-4 flex justify-end gap-2">
                  <Link href={`/assets/${asset._id}`}>
                    <Button className="bg-gray-200 text-gray-800 p-2 rounded-md text-xs">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center p-8 border rounded-md bg-gray-50">
              <p>No assets found. Try adjusting your filters or add a new asset.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-8">Loading assets...</div>
      )}
    </div>
  );
} 