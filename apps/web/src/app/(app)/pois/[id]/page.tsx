"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck, Edit, Trash, ArrowLeft } from 'lucide-react';
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapView } from "@/components/map/MapView";

export default function POIDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Convert string ID to Convex ID
  const poiId = params.id;
  
  // Get POI details
  const poi = useQuery(api.pois.getPOI, { id: poiId });
  const deletePOI = useMutation(api.pois.deletePOI);
  
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this POI?")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deletePOI({ id: poiId });
      toast({
        title: "POI deleted",
        description: "The POI has been successfully deleted",
      });
      router.push("/pois");
    } catch (err) {
      console.error("Failed to delete POI:", err);
      toast({
        title: "Error",
        description: "Failed to delete POI",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (!poi) {
    return <div className="p-4">Loading POI details...</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/pois")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Points of Interest
        </Button>
      </div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          {poi.type === "hazard" ? (
            <AlertTriangle className="h-6 w-6 mr-3 text-red-500" />
          ) : (
            <ShieldCheck className="h-6 w-6 mr-3 text-green-500" />
          )}
          <h1 className="text-3xl font-bold">{poi.name}</h1>
        </div>
        
        <div className="flex space-x-2">
          <Link href={`/pois/${poiId}/edit`}>
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
              {poi.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{poi.description}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <p className="mt-1 flex items-center">
                  {poi.type === "hazard" ? (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                      Hazard
                    </>
                  ) : poi.type === "safety_equipment" ? (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
                      Safety Equipment
                    </>
                  ) : (
                    poi.type
                  )}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    poi.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {poi.status}
                  </span>
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1">
                  Latitude: {poi.location.lat.toFixed(6)}, Longitude: {poi.location.lng.toFixed(6)}
                </p>
              </div>
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
                  showPOIs={true}
                  showAssets={false}
                  center={poi.location}
                  height={300}
                  zoom={15}
                />
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
                  {formatDistanceToNow(poi.createdAt)} ago
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDistanceToNow(poi.updatedAt)} ago
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 