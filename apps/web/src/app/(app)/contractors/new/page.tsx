"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { useTenantId } from "@/hooks/useTenantId";
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
import { Building, Save, X, Tag, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function NewContractorPage() {
  const { toast } = useToast();
  const router = useRouter();
  const tenantId = useTenantId();
  const createContractor = useMutation(api.contractors.createContractor);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    status: "active",
    specialtyInput: "",
    specialties: [] as string[]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    
    if (!tenantId) {
      toast({
        title: "Error",
        description: "No tenant selected",
        variant: "destructive"
      });
      return;
    }
    
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
      
      await createContractor({
        tenantId,
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
        description: "Contractor created successfully",
      });
      
      router.push("/contractors");
    } catch (error) {
      console.error("Failed to create contractor:", error);
      toast({
        title: "Error",
        description: "Failed to create contractor",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!tenantId) {
    return <div className="p-4">Select a tenant to add a contractor</div>;
  }
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Add New Contractor</h1>
        <Link href="/contractors">
          <Button variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Contractor Information</CardTitle>
            <CardDescription>
              Enter the details of the contractor organization
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
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter contractor address"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Specialties</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="specialtyInput"
                  name="specialtyInput"
                  value={formData.specialtyInput}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter a specialty"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={handleAddSpecialty}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              {formData.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                      <Tag className="h-3 w-3" />
                      {specialty}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSpecialty(index)}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-3">
            <Link href="/contractors">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-500 text-white">
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-r-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Contractor
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 