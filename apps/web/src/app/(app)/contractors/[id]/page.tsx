"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { Id } from '@/../../../packages/backend/convex/_generated/dataModel';
import { useTenantId } from "@/hooks/useTenantId";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { 
  Building, 
  Edit, 
  Trash2, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Tag, 
  Users, 
  Plus, 
  Calendar,
  Briefcase,
  CheckCircle2,
  XCircle,
  MoreVertical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Status badges with appropriate colors
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "active":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3" />
          Active
        </Badge>
      );
    case "inactive":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-gray-50 text-gray-700 border-gray-200">
          <XCircle className="w-3 h-3" />
          Inactive
        </Badge>
      );
    case "suspended":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
          <XCircle className="w-3 h-3" />
          Suspended
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">{status}</Badge>
      );
  }
};

// Star Rating component
const StarRating = ({ rating, setRating, editable = false }: { 
  rating: number, 
  setRating?: (rating: number) => void,
  editable?: boolean 
}) => {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => {
        const ratingValue = i + 1;
        
        return (
          <Star 
            key={i}
            className={`w-5 h-5 ${
              ratingValue <= (hover || rating)
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-gray-300'
            } ${editable ? 'cursor-pointer' : ''}`}
            onClick={() => editable && setRating && setRating(ratingValue)}
            onMouseEnter={() => editable && setHover(ratingValue)}
            onMouseLeave={() => editable && setHover(0)}
          />
        );
      })}
    </div>
  );
};

// Add Review Dialog Component
const AddReviewDialog = ({ 
  contractorId, 
  onReviewAdded 
}: { 
  contractorId: Id<"contractors">, 
  onReviewAdded: () => void 
}) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const addReview = useMutation(api.contractors.addContractorReview);
  const { toast } = useToast();
  
  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addReview({
        contractorId,
        rating,
        comment: comment || undefined
      });
      
      toast({
        title: "Review submitted",
        description: "Your review has been added successfully",
      });
      
      // Reset form and close dialog
      setRating(0);
      setComment("");
      setOpen(false);
      
      // Trigger refetch of contractor data
      onReviewAdded();
    } catch (error) {
      console.error("Failed to add review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-500 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Review</DialogTitle>
          <DialogDescription>
            Share your experience with this contractor
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rating" className="mb-1">Rating</Label>
            <div className="flex items-center">
              <StarRating rating={rating} setRating={setRating} editable={true} />
              <span className="ml-2 text-sm text-gray-500">
                {rating > 0 ? `${rating} out of 5 stars` : "Select a rating"}
              </span>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="comment">Comments (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience working with this contractor"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Profile Actions Component
const ProfileActions = ({ 
  profileId, 
  contractorId,
  onDelete 
}: { 
  profileId: Id<"contractorProfiles">, 
  contractorId: Id<"contractors">,
  onDelete: () => void 
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const deleteProfile = useMutation(api.contractors.deleteContractorProfile);
  const { toast } = useToast();
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProfile({ id: profileId });
      
      toast({
        title: "Success",
        description: "Profile deleted successfully",
      });
      
      onDelete();
    } catch (error) {
      console.error("Failed to delete profile:", error);
      toast({
        title: "Error",
        description: "Failed to delete profile",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Link href={`/contractors/${contractorId}/profiles/${profileId}/edit`}>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this profile. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default function ContractorDetailPage() {
  const params = useParams();
  const contractorId = params.id as Id<"contractors">;
  const tenantId = useTenantId();
  const [activeTab, setActiveTab] = useState("details");
  
  const contractor = useQuery(api.contractors.getContractor, { id: contractorId });
  const contractorProfiles = useQuery(api.contractors.getContractorProfiles, { contractorId });
  const contractorAssignments = useQuery(api.contractors.getContractorAssignments, { contractorId });
  
  // Refetch triggers
  const [profilesRefetchTrigger, setProfilesRefetchTrigger] = useState(0);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  
  const handleReviewAdded = () => setRefetchTrigger(prev => prev + 1);
  const handleProfileDeleted = () => setProfilesRefetchTrigger(prev => prev + 1);
  
  // Calculate average rating
  const averageRating = contractor?.reviews?.length 
    ? contractor.reviews.reduce((sum, review) => sum + review.rating, 0) / contractor.reviews.length
    : 0;
  
  if (!contractor) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 bg-blue-100">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {contractor.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{contractor.name}</h1>
            <StatusBadge status={contractor.status} />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/contractors/${contractorId}/edit`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="profiles">Profiles ({contractorProfiles?.length || 0})</TabsTrigger>
          <TabsTrigger value="assignments">Assignments ({contractorAssignments?.length || 0})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({contractor.reviews?.length || 0})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contractor Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contractor.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{contractor.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contractor.contactName && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Contact Person</h3>
                    <p className="mt-1 flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      {contractor.contactName}
                    </p>
                  </div>
                )}
                
                {contractor.contactEmail && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {contractor.contactEmail}
                    </p>
                  </div>
                )}
                
                {contractor.contactPhone && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="mt-1 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {contractor.contactPhone}
                    </p>
                  </div>
                )}
                
                {contractor.address && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <p className="mt-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {contractor.address}
                    </p>
                  </div>
                )}
              </div>
              
              {contractor.specialties && contractor.specialties.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Specialties</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {contractor.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p className="mt-1">
                    {formatDistanceToNow(new Date(contractor.createdAt), { addSuffix: true })}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="mt-1">
                    {formatDistanceToNow(new Date(contractor.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(averageRating) 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : i === Math.floor(averageRating) && averageRating % 1 >= 0.5 
                              ? 'text-yellow-500 fill-yellow-200' 
                              : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm font-medium">
                      {averageRating ? averageRating.toFixed(1) : "No ratings"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profiles" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Contractor Profiles</h2>
            <Link href={`/contractors/${contractorId}/profiles/new`}>
              <Button className="bg-blue-500 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Profile
              </Button>
            </Link>
          </div>
          
          {!contractorProfiles ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : contractorProfiles.length === 0 ? (
            <Card className="bg-gray-50">
              <CardContent className="p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No profiles found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding contractor personnel profiles.
                </p>
                <div className="mt-6">
                  <Link href={`/contractors/${contractorId}/profiles/new`}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contractorProfiles.map((profile) => (
                <Card key={profile._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {profile.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{profile.name}</h3>
                          {profile.role && (
                            <p className="text-sm text-gray-500">{profile.role}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <StatusBadge status={profile.status} />
                        <ProfileActions 
                          profileId={profile._id} 
                          contractorId={contractorId}
                          onDelete={handleProfileDeleted}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      {profile.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3.5 w-3.5 mr-1.5" />
                          {profile.email}
                        </div>
                      )}
                      
                      {profile.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5 mr-1.5" />
                          {profile.phone}
                        </div>
                      )}
                    </div>
                    
                    {profile.specialties && profile.specialties.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-xs font-medium text-gray-500">Specialties</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {profile.specialties.map((specialty, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {profile.certifications && profile.certifications.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-xs font-medium text-gray-500">Certifications</h4>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {profile.certifications.map((cert, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="assignments" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Work Assignments</h2>
          </div>
          
          {!contractorAssignments ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : contractorAssignments.length === 0 ? (
            <Card className="bg-gray-50">
              <CardContent className="p-8 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No assignments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This contractor hasn't been assigned to any work orders yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {contractorAssignments.map((assignment) => (
                <Card key={assignment._id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/workorders/${assignment.workOrderId}`}>
                          <h3 className="font-medium text-blue-600 hover:underline">
                            Work Order
                          </h3>
                        </Link>
                        <StatusBadge status={assignment.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        {assignment.startDate && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(assignment.startDate).toLocaleDateString()}
                          </Badge>
                        )}
                        
                        {assignment.endDate && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(assignment.endDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {assignment.notes && (
                      <p className="mt-2 text-sm text-gray-600">{assignment.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="reviews" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Reviews</h2>
              {contractor.reviews && contractor.reviews.length > 0 && (
                <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                  <StarRating rating={Math.round(averageRating)} />
                  <span className="ml-2 font-medium">
                    {averageRating.toFixed(1)} ({contractor.reviews.length} review{contractor.reviews.length !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
            </div>
            <AddReviewDialog contractorId={contractorId} onReviewAdded={handleReviewAdded} />
          </div>
          
          {!contractor.reviews || contractor.reviews.length === 0 ? (
            <Card className="bg-gray-50">
              <CardContent className="p-8 text-center">
                <Star className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No reviews yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Be the first to review this contractor.
                </p>
                <div className="mt-6">
                  <AddReviewDialog contractorId={contractorId} onReviewAdded={handleReviewAdded} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {contractor.reviews.map((review, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            U
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">User</h3>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    
                    {review.comment && (
                      <p className="mt-3 text-sm text-gray-700">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 