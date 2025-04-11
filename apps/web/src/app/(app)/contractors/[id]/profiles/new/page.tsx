"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation } from "convex/react";
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
import { Users, X, Plus, ArrowLeft, Briefcase, Award } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function NewContractorProfilePage() {
  const params = useParams();
  const contractorId = params.id as Id<"contractors">;
  const router = useRouter();
  const { toast } = useToast();
  
  const createProfile = useMutation(api.contractors.createContractorProfile);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "active",
    specialtyInput: "",
    specialties: [] as string[],
    certificationInput: "",
    certifications: [] as string[]
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
  
  const handleAddCertification = () => {
    if (formData.certificationInput.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, prev.certificationInput.trim()],
        certificationInput: ""
      }));
    }
  };
  
  const handleRemoveCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };
  
  const handleKeyPress = (e: React.KeyboardEvent, type: 'specialty' | 'certification') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'specialty') {
        handleAddSpecialty();
      } else {
        handleAddCertification();
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Profile name is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await createProfile({
        contractorId,
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        role: formData.role || undefined,
        status: formData.status,
        specialties: formData.specialties.length > 0 ? formData.specialties : undefined,
        certifications: formData.certifications.length > 0 ? formData.certifications : undefined
      });
      
      toast({
        title: "Success",
        description: "Contractor profile created successfully",
      });
      
      router.push(`/contractors/${contractorId}`);
    } catch (error) {
      console.error("Failed to create contractor profile:", error);
      toast({
        title: "Error",
        description: "Failed to create contractor profile",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href={`/contractors/${contractorId}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Contractor
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Add New Profile</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Add a new person to this contractor organization
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter person's full name"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <Input
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="e.g. Project Manager, Foreman"
                  />
                </div>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Specialties</Label>
              <div className="flex gap-2">
                <Input
                  name="specialtyInput"
                  value={formData.specialtyInput}
                  onChange={handleChange}
                  onKeyPress={(e) => handleKeyPress(e, 'specialty')}
                  placeholder="Add a specialty (e.g. Welding, Electrical)"
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
            
            <div className="space-y-2">
              <Label>Certifications</Label>
              <div className="flex gap-2">
                <Input
                  name="certificationInput"
                  value={formData.certificationInput}
                  onChange={handleChange}
                  onKeyPress={(e) => handleKeyPress(e, 'certification')}
                  placeholder="Add a certification (e.g. OSHA 10, PMP)"
                />
                <Button
                  type="button"
                  onClick={handleAddCertification}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.certifications.map((certification, index) => (
                    <Badge key={index} variant="outline" className="gap-1 pl-2 bg-blue-50 text-blue-700 border-blue-200">
                      <Award className="h-3 w-3 mr-1" />
                      {certification}
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(index)}
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
              {isSubmitting ? "Saving..." : "Add Profile"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 