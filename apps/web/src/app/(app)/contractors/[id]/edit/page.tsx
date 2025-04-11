"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { Id } from '@/../../../packages/backend/convex/_generated/dataModel';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Building, Save, X, Tag, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function EditContractorPage({ params }: { params: { id: string } }) {
  const contractorId = params.id as Id<"contractors">;
  const router = useRouter();
  const { toast } = useToast();
  
  const contractor = useQuery(api.contractors.getContractor, { id: contractorId });
  const updateContractor = useMutation(api.contractors.updateContractor);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    status: "active",
    specialtyInput: "",
    specialties: [] as string[],
    tags: [] as string[]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load contractor data into form when available
  useEffect(() => {
    if (contractor) {
      setFormData({
        name: contractor.name || "",
        description: contractor.description || "",
        contactName: contractor.contactName || "",
        contactEmail: contractor.contactEmail || "",
        contactPhone: contractor.contactPhone || "",
        address: contractor.address || "",
        status: contractor.status || "active",
        specialtyInput: "",
        specialties: contractor.specialties || [],
        tags: contractor.tags || []
      });
    }
  }, [contractor]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value }));
  };
  
  const handleAddSpecialty = () => {
    if (formData.specialtyInput.trim()) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, prev.specialtyInput.trim()],
        specialtyInput: ""
      }));
    }
  };
  
  const handleRemoveSpecialty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSpecialty();
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Contractor name is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await updateContractor({
        id: contractorId,
        name: formData.name,
        description: formData.description || undefined,
        contactName: formData.contactName || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        address: formData.address || undefined,
        specialties: formData.specialties.length > 0 ? formData.specialties : undefined,
        status: formData.status
      });
      
      toast({
        title: "Success",
        description: "Contractor updated successfully",
      });
      
      router.push(`/contractors/${contractorId}`);
    } catch (error) {
      console.error("Failed to update contractor:", error);
      toast({
        title: "Error",
        description: "Failed to update contractor",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!contractor) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href={`/contractors/${contractorId}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Contractor</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Contractor Information</CardTitle>
            <CardDescription>
              Update the details of the contractor organization
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Contractor Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter contractor name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter contractor description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Person</Label>
                <Input
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="Enter contact person name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="Enter contact email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="Enter contact phone"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter contractor address"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Specialties</Label>
              <div className="flex gap-2">
                <Input
                  name="specialtyInput"
                  value={formData.specialtyInput}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a specialty"
                />
                <Button
                  type="button"
                  onClick={handleAddSpecialty}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 pl-2">
                      {specialty}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialty(index)}
                        className="ml-1 rounded-full hover:bg-gray-200 p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Link href={`/contractors/${contractorId}`}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 