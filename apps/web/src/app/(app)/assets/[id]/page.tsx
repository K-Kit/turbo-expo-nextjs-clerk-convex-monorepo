"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { Button } from "@/components/ui/button";
import { Truck, Wrench, Edit, Trash, ArrowLeft, User } from 'lucide-react';
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapView } from "@/components/map/MapView";

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Convert string ID to Convex ID
  const assetId = params.id;
  
  // Get asset details
  const asset = useQuery(api.assets.getAsset, { id: assetId });
  
  // Get asset history
  const history = useQuery(api.assets.getAssetHistory, { assetId, limit: 10 });
  
  // Get assigned user details if any
  const assignedUser = asset?.assignedTo 
    ? useQuery(api.users.getUser, { id: asset.assignedTo })
    : null;
  
  const deleteAsset = useMutation(api.assets.deleteAsset);
  
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this asset?")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteAsset({ id: assetId });
      router.push("/assets");
    } catch (err) {
      console.error("Failed to delete asset:", err);
      alert("Failed to delete asset");
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (!asset) {
    return <div className="p-4">Loading asset details...</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/assets")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assets
        </Button>
      </div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          {asset.type === "vehicle" ? (
            <Truck className="h-6 w-6 mr-3 text-blue-500" />
          ) : (
            <Wrench className="h-6 w-6 mr-3 text-amber-500" />
          )}
          <h1 className="text-3xl font-bold">{asset.name}</h1>
        </div>
        
        <div className="flex space-x-2">
          <Link href={`/assets/${assetId}/edit`}>
            <Button variant="outline" className="flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            className="flex items-center"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash className="h-4 w-4 mr-2" />
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {asset.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{asset.description}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <p className="mt-1 flex items-center">
                  {asset.type === "vehicle" ? (
                    <>
                      <Truck className="h-4 w-4 mr-2 text-blue-500" />
                      Vehicle
                    </>
                  ) : asset.type === "equipment" ? (
                    <>
                      <Wrench className="h-4 w-4 mr-2 text-amber-500" />
                      Equipment
                    </>
                  ) : (
                    asset.type
                  )}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    asset.status === "operational" ? "bg-green-100 text-green-800" : 
                    asset.status === "maintenance" ? "bg-amber-100 text-amber-800" : 
                    "bg-red-100 text-red-800"
                  }`}>
                    {asset.status}
                  </span>
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1">
                  Latitude: {asset.location.lat.toFixed(6)}, Longitude: {asset.location.lng.toFixed(6)}
                </p>
              </div>
              
              {assignedUser && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
                  <p className="mt-1 flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    {assignedUser.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Location Map */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Map</CardTitle>
              </CardHeader>
              <CardContent>
                <MapView 
                  showPOIs={false}
                  showAssets={true}
                  center={asset.location}
                  height={300}
                  zoom={15}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Asset History */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent>
                {history ? (
                  history.length > 0 ? (
                    <div className="space-y-4">
                      {history.map((entry) => (
                        <div key={entry._id} className="border-b pb-4 last:border-b-0">
                          <div className="flex justify-between">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              entry.status === "operational" ? "bg-green-100 text-green-800" : 
                              entry.status === "maintenance" ? "bg-amber-100 text-amber-800" : 
                              "bg-red-100 text-red-800"
                            }`}>
                              {entry.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDistanceToNow(entry.timestamp)} ago
                            </span>
                          </div>
                          <div className="mt-2 text-sm">
                            Location: {entry.location.lat.toFixed(6)}, {entry.location.lng.toFixed(6)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No history entries available</p>
                  )
                ) : (
                  <p className="text-gray-500">Loading history...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDistanceToNow(asset.createdAt)} ago
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDistanceToNow(asset.updatedAt)} ago
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Status Change</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDistanceToNow(asset.lastUpdated)} ago
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 