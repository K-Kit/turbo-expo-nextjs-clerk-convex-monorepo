"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../../../packages/backend/convex/_generated/api";
import { useTenantId } from "@/hooks/useTenantId";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Id } from "@/../../../packages/backend/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  ClipboardList,
  CalendarClock,
  CheckCircle2,
  PauseCircle,
  XCircle,
  HardHat,
  Clock,
  AlertTriangle,
  Building,
  User,
  Tag,
  Search,
  FileSpreadsheet,
  Wrench,
  Hammer,
  Tags,
  MapPin,
  Users,
  Briefcase,
  TruckIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Status badges with appropriate colors
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "open":
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
        >
          <Clock className="w-3 h-3" />
          Open
        </Badge>
      );
    case "in_progress":
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          <HardHat className="w-3 h-3" />
          In Progress
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </Badge>
      );
    case "on_hold":
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 bg-orange-50 text-orange-700 border-orange-200"
        >
          <PauseCircle className="w-3 h-3" />
          On Hold
        </Badge>
      );
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="w-3 h-3" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Priority badges with appropriate colors
const PriorityBadge = ({ priority }: { priority: string }) => {
  switch (priority) {
    case "low":
      return (
        <Badge
          variant="outline"
          className="bg-slate-50 text-slate-700 border-slate-200"
        >
          Low
        </Badge>
      );
    case "medium":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          Medium
        </Badge>
      );
    case "high":
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
        >
          High
        </Badge>
      );
    case "critical":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          Critical
        </Badge>
      );
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

// Type badges with appropriate icons
const TypeBadge = ({ type }: { type: string }) => {
  let Icon;
  switch (type) {
    case "maintenance":
      Icon = Wrench;
      break;
    case "inspection":
      Icon = Search;
      break;
    case "repair":
      Icon = Hammer;
      break;
    case "installation":
      Icon = FileSpreadsheet;
      break;
    default:
      Icon = Tags;
  }

  return (
    <Badge
      variant="outline"
      className="flex items-center gap-1 bg-gray-50 text-gray-700 border-gray-200"
    >
      <Icon className="w-3 h-3" />
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
};

// Task status badges
const TaskStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-700 border-gray-200"
        >
          Pending
        </Badge>
      );
    case "in_progress":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          In Progress
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

interface WorkOrderTaskFormProps {
  workOrderId: Id<"workOrders">;
  onTaskAdded: () => void;
}

const WorkOrderTaskForm = ({
  workOrderId,
  onTaskAdded,
}: WorkOrderTaskFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTask = useMutation(api.workorders.createWorkOrderTask);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast({
        title: "Error",
        description: "Task name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createTask({
        workOrderId,
        name,
        description: description || undefined,
        status,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      });

      // Reset form
      setName("");
      setDescription("");
      setStatus("pending");
      setEstimatedHours("");

      // Notify parent component
      onTaskAdded();

      toast({
        title: "Task Added",
        description: "The task was successfully added",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // @todo edit task button / page.  mark complete.  assign to user.

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Task</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="taskName">Task Name</Label>
            <Input
              id="taskName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
              required
            />
          </div>

          <div>
            <Label htmlFor="taskDescription">Description</Label>
            <Textarea
              id="taskDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taskStatus">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="taskStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.1"
                min="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="Estimated hours"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Task"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

interface CommentFormProps {
  workOrderId: Id<"workOrders">;
  onCommentAdded: () => void;
}

const CommentForm = ({ workOrderId, onCommentAdded }: CommentFormProps) => {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addComment = useMutation(api.workorders.addWorkOrderComment);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await addComment({
        workOrderId,
        text,
      });

      // Reset form
      setText("");

      // Notify parent component
      onCommentAdded();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a comment..."
        rows={2}
        className="mb-2"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !text.trim()}>
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  );
};

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tenantId = useTenantId();
  const workOrderId = params.id as Id<"workOrders">;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [updateTaskTrigger, setUpdateTaskTrigger] = useState(0);
  const [updateCommentsTrigger, setUpdateCommentsTrigger] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const workOrder = useQuery(api.workorders.getWorkOrder, { id: workOrderId });

  const project = useQuery(
    api.projects.getProject,
    workOrder?.projectId ? { id: workOrder.projectId } : "skip",
  );

  const asset = useQuery(
    api.assets.getAsset,
    workOrder?.assetId ? { id: workOrder.assetId } : "skip",
  );

  const assignedUser = useQuery(
    api.users.get,
    workOrder?.assignedTo ? { userId: workOrder.assignedTo } : "skip",
  );

  const tasks = useQuery(
    api.workorders.getWorkOrderTasks,
    workOrderId ? { workOrderId } : "skip",
  );

  const comments = useQuery(
    api.workorders.getWorkOrderComments,
    workOrderId ? { workOrderId } : "skip",
  );

  const deleteWorkOrder = useMutation(api.workorders.deleteWorkOrder);
  const updateWorkOrder = useMutation(api.workorders.updateWorkOrder);

  if (!workOrder || !tenantId) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading work order details...</p>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteWorkOrder({ id: workOrderId });
      toast({
        title: "Work Order Deleted",
        description: "The work order has been deleted successfully",
      });
      router.push("/workorders");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete work order",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === workOrder.status) return;

    setUpdatingStatus(true);

    try {
      await updateWorkOrder({
        id: workOrderId,
        status: newStatus,
      });

      toast({
        title: "Status Updated",
        description: `Status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const calculateProgress = () => {
    if (!tasks || tasks.length === 0) {
      return workOrder.status === "completed" ? 100 : 0;
    }

    const completedTasks = tasks.filter(
      (task) => task.status === "completed",
    ).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/workorders")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Work Orders
        </Button>

        <div className="flex space-x-2">
          <Link href={`/workorders/${workOrderId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6 items-start">
        <div className="flex items-center">
          <ClipboardList className="h-10 w-10 text-blue-500 mr-3" />
          <div>
            <h1 className="text-2xl font-bold">{workOrder.title}</h1>
            <p className="text-gray-500">#{workOrder.number}</p>
          </div>
        </div>

        <div className="flex-grow"></div>

        <div className="flex flex-wrap gap-2 mt-2 md:mt-0 items-center">
          {!updatingStatus ? (
            <Select value={workOrder.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-auto min-w-[150px]">
                <SelectValue>
                  <StatusBadge status={workOrder.status} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Open
                  </div>
                </SelectItem>
                <SelectItem value="in_progress">
                  <div className="flex items-center">
                    <HardHat className="w-4 h-4 mr-2" />
                    In Progress
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Completed
                  </div>
                </SelectItem>
                <SelectItem value="on_hold">
                  <div className="flex items-center">
                    <PauseCircle className="w-4 h-4 mr-2" />
                    On Hold
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelled
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              <span>Updating...</span>
            </div>
          )}

          <PriorityBadge priority={workOrder.priority} />
          <TypeBadge type={workOrder.type} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-800">
                      {progress}% Complete
                    </span>
                  </div>
                  {workOrder.completedDate && (
                    <div className="text-xs text-gray-500">
                      Completed {formatDistanceToNow(workOrder.completedDate)}{" "}
                      ago
                    </div>
                  )}
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${progress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                  ></div>
                </div>
              </div>

              <p className="text-gray-700">
                {workOrder.description || "No description provided."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workOrder.startDate && (
                <div className="flex items-start">
                  <CalendarClock className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Started</p>
                    <p className="text-sm text-gray-500">
                      {format(workOrder.startDate, "PPP")}
                    </p>
                  </div>
                </div>
              )}

              {workOrder.dueDate && (
                <div className="flex items-start">
                  <Clock className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-sm text-gray-500">
                      {format(workOrder.dueDate, "PPP")}
                    </p>
                  </div>
                </div>
              )}

              {workOrder.estimatedHours && (
                <div className="flex items-start">
                  <Clock className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Estimated Hours</p>
                    <p className="text-sm text-gray-500">
                      {workOrder.estimatedHours} hours
                    </p>
                  </div>
                </div>
              )}

              {project && (
                <div className="flex items-start">
                  <Briefcase className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Project</p>
                    <Link href={`/projects/${project._id}`}>
                      <p className="text-sm text-blue-500 hover:underline">
                        {project.name}
                      </p>
                    </Link>
                  </div>
                </div>
              )}

              {asset && (
                <div className="flex items-start">
                  <TruckIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Asset</p>
                    <Link href={`/assets/${asset._id}`}>
                      <p className="text-sm text-blue-500 hover:underline">
                        {asset.name}
                      </p>
                    </Link>
                  </div>
                </div>
              )}

              {assignedUser && (
                <div className="flex items-start">
                  <User className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Assigned To</p>
                    <p className="text-sm text-gray-500">{assignedUser.name}</p>
                  </div>
                </div>
              )}

              {workOrder.location && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-gray-500">
                      {workOrder.location.lat.toFixed(6)},{" "}
                      {workOrder.location.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}

              {workOrder.tags && workOrder.tags.length > 0 && (
                <div className="flex items-start">
                  <Tag className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Tags</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {workOrder.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <CalendarClock className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-gray-500">
                    {format(workOrder.createdAt, "PPP")}(
                    {formatDistanceToNow(workOrder.createdAt)} ago)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            <WorkOrderTaskForm
              workOrderId={workOrderId}
              onTaskAdded={() => setUpdateTaskTrigger((prev) => prev + 1)}
            />

            {tasks && tasks.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tasks</h3>
                {tasks.map((task) => (
                  <Card key={task._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{task.name}</h4>
                        <TaskStatusBadge status={task.status} />
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 mt-2">
                        {task.estimatedHours && (
                          <div className="text-xs text-gray-500">
                            Estimated: {task.estimatedHours} hours
                          </div>
                        )}

                        {task.actualHours && (
                          <div className="text-xs text-gray-500">
                            Actual: {task.actualHours} hours
                          </div>
                        )}

                        {task.completedAt && (
                          <div className="text-xs text-gray-500">
                            Completed: {format(task.completedAt, "PPP")}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-md">
                <p className="text-gray-500">No tasks added yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <div className="space-y-6">
            <CommentForm
              workOrderId={workOrderId}
              onCommentAdded={() =>
                setUpdateCommentsTrigger((prev) => prev + 1)
              }
            />

            {comments && comments.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Comments</h3>
                {comments.map((comment) => (
                  <Card key={comment._id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-gray-500" />
                        <span className="font-medium">{comment.authorId}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(comment.createdAt)} ago
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {comment.text}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-md">
                <p className="text-gray-500">No comments yet.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Work Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this work order? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
