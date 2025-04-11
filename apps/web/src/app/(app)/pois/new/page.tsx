"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { useTenantId } from "@/hooks/useTenantId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface Coordinates {
  lat: number;
  lng: number;
}

// Simple coordinate picker component
// In a full implementation, this would be a map
const CoordinatePicker = ({ 
  value, 
  onChange 
}: { 
  value: Coordinates; 
  onChange: (value: Coordinates) => void 
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="lat">Latitude</Label>
        <Input 
          id="lat"
          type="number" 
          step="0.000001"
          value={value.lat} 
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ ...value, lat: parseFloat(e.target.value) })}
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
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ ...value, lng: parseFloat(e.target.value) })}
          placeholder="Longitude"
        />
      </div>
    </div>
  );
};

export default function NewPOIPage() {
  const router = useRouter();
  const tenantId = useTenantId();
  const createPOI = useMutation(api.pois.createPOI);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("hazard");
  const [status, setStatus] = useState("active");
  const [location, setLocation] = useState<Coordinates>({ lat: 0, lng: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      await createPOI({
        tenantId,
        name,
        description: description || undefined,
        location,
        type,
        status,
      });
      
      // Redirect to POIs list
      router.push("/pois");
    } catch (err: unknown) {
      console.error("Failed to create POI:", err);
      setError(err instanceof Error ? err.message : "Failed to create POI");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!tenantId) {
    return <div className="p-4">Select a tenant to create a point of interest</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Point of Interest</h1>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>POI Details</CardTitle>
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
                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="POI Name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Describe this point of interest"
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
                    <SelectItem value="hazard" className="flex items-center">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        Hazard
                      </div>
                    </SelectItem>
                    <SelectItem value="safety_equipment" className="flex items-center">
                      <div className="flex items-center">
                        <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
                        Safety Equipment
                      </div>
                    </SelectItem>
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/pois")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create POI"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 