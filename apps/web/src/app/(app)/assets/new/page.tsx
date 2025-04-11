"use client";

import { useState } from "react";
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
import { Truck, Wrench } from 'lucide-react';

// Simple coordinate picker component
// In a full implementation, this would be a map
const CoordinatePicker = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="lat">Latitude</Label>
        <Input 
          id="lat"
          type="number" 
          step="0.000001"
          value={value.lat} 
          onChange={(e) => onChange({ ...value, lat: parseFloat(e.target.value) })}
          placeholder="Latitude"
        />
      </div>
      <div>
        <Label htmlFor="lng">Longitude</Label>
        <Input 
          id="lng"
          type="number" 
          step="0.000001"
          value={value.lng} 
          onChange={(e) => onChange({ ...value, lng: parseFloat(e.target.value) })}
          placeholder="Longitude"
        />
      </div>
    </div>
  );
};

export default function NewAssetPage() {
  const router = useRouter();
  const tenantId = useTenantId();
  const createAsset = useMutation(api.assets.createAsset);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("vehicle");
  const [status, setStatus] = useState("operational");
  const [location, setLocation] = useState({ lat: 0, lng: 0 });
  const [assignedTo, setAssignedTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Get users in the tenant for the assignee dropdown
  const users = useQuery(
    api.users.listByTenant, 
    tenantId ? { tenantId } : "skip"
  );
  
  const handleSubmit = async (e) => {
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
      await createAsset({
        tenantId,
        name,
        description: description || undefined,
        location,
        type,
        status,
        assignedTo: assignedTo || undefined,
      });
      
      // Redirect to assets list
      router.push("/assets");
    } catch (err) {
      console.error("Failed to create asset:", err);
      setError(err.message || "Failed to create asset");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!tenantId) {
    return <div className="p-4">Select a tenant to create an asset</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Asset</h1>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Asset Name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Asset Description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vehicle" className="flex items-center">
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-2 text-blue-500" />
                        Vehicle
                      </div>
                    </SelectItem>
                    <SelectItem value="equipment" className="flex items-center">
                      <div className="flex items-center">
                        <Wrench className="h-4 w-4 mr-2 text-amber-500" />
                        Equipment
                      </div>
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="out_of_service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Location</Label>
              <CoordinatePicker value={location} onChange={setLocation} />
              <p className="text-xs text-gray-500 mt-1">
                In a real application, this would be a map picker component
              </p>
            </div>
            
            <div>
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Select user (optional)" />
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
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/assets")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Asset"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 