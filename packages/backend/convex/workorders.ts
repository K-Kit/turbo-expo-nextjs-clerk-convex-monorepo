import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { checkUserInTenant } from "./utils";

// Generate a unique work order number
const generateWorkOrderNumber = async (ctx: any) => {
  const date = new Date();
  const year = date.getFullYear();
  
  // Count existing work orders for this year to generate a sequential number
  const existingCount = await ctx.db
    .query("workOrders")
    .filter((q) => q.gte(q.field("createdAt"), new Date(`${year}-01-01`).getTime()))
    .collect();
  
  const sequence = (existingCount.length + 1).toString().padStart(4, '0');
  return `WO-${year}-${sequence}`;
};

/**
 * Get all work orders for a tenant with optional filtering
 */
export const getWorkOrders = query({
  args: {
    tenantId: v.id("tenants"),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
    priority: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    assetId: v.optional(v.id("assets")),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Check if user is in tenant
    await checkUserInTenant(ctx, args.tenantId);
    
    // Start with tenant index
    let workOrdersQuery = ctx.db
      .query("workOrders")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId));
    
    // Apply additional filters based on provided args
    if (args.status) {
      workOrdersQuery = ctx.db
        .query("workOrders")
        .withIndex("by_tenant_status", (q) => 
          q.eq("tenantId", args.tenantId).eq("status", args.status)
        );
    }
    
    if (args.type) {
      workOrdersQuery = ctx.db
        .query("workOrders")
        .withIndex("by_tenant_type", (q) => 
          q.eq("tenantId", args.tenantId).eq("type", args.type)
        );
    }
    
    if (args.priority) {
      workOrdersQuery = ctx.db
        .query("workOrders")
        .withIndex("by_tenant_priority", (q) => 
          q.eq("tenantId", args.tenantId).eq("priority", args.priority)
        );
    }
    
    if (args.projectId) {
      workOrdersQuery = ctx.db
        .query("workOrders")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId));
    }
    
    if (args.assetId) {
      workOrdersQuery = ctx.db
        .query("workOrders")
        .withIndex("by_asset", (q) => q.eq("assetId", args.assetId));
    }
    
    if (args.assignedTo) {
      workOrdersQuery = ctx.db
        .query("workOrders")
        .withIndex("by_assigned_to", (q) => q.eq("assignedTo", args.assignedTo));
    }
    
    return workOrdersQuery.order("desc").collect();
  },
});

/**
 * Get a single work order by ID
 */
export const getWorkOrder = query({
  args: {
    id: v.id("workOrders"),
  },
  handler: async (ctx, args) => {
    const workOrder = await ctx.db.get(args.id);
    
    if (!workOrder) {
      throw new Error("Work order not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, workOrder.tenantId);
    
    return workOrder;
  },
});

/**
 * Create a new work order
 */
export const createWorkOrder = mutation({
  args: {
    tenantId: v.id("tenants"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    priority: v.string(),
    type: v.string(),
    projectId: v.optional(v.id("projects")),
    assetId: v.optional(v.id("assets")),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    assignedTeam: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { tenantId, title, description, status, priority, type, ...rest } = args;
    
    // Check if user is in tenant
    const user = await checkUserInTenant(ctx, tenantId);
    
    // Generate a unique work order number
    const workOrderNumber = await generateWorkOrderNumber(ctx);
    
    const now = Date.now();
    
    // Create the work order
    return ctx.db.insert("workOrders", {
      tenantId,
      number: workOrderNumber,
      title,
      description,
      status,
      priority,
      type,
      ...rest,
      createdBy: user.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing work order
 */
export const updateWorkOrder = mutation({
  args: {
    id: v.id("workOrders"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    type: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    assetId: v.optional(v.id("assets")),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    assignedTeam: v.optional(v.id("users")),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
    completedDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    cost: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const workOrder = await ctx.db.get(id);
    if (!workOrder) {
      throw new Error("Work order not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, workOrder.tenantId);
    
    // If status is changing to completed, set completedDate
    if (updates.status === "completed" && workOrder.status !== "completed") {
      updates.completedDate = Date.now();
    }
    
    return ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a work order
 */
export const deleteWorkOrder = mutation({
  args: {
    id: v.id("workOrders"),
  },
  handler: async (ctx, args) => {
    const workOrder = await ctx.db.get(args.id);
    if (!workOrder) {
      throw new Error("Work order not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, workOrder.tenantId);
    
    // Delete all associated tasks
    const tasks = await ctx.db
      .query("workOrderTasks")
      .withIndex("by_work_order", (q) => q.eq("workOrderId", args.id))
      .collect();
    
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
    
    // Delete all associated comments
    const comments = await ctx.db
      .query("workOrderComments")
      .withIndex("by_work_order", (q) => q.eq("workOrderId", args.id))
      .collect();
    
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }
    
    // Finally, delete the work order itself
    await ctx.db.delete(args.id);
    
    return null;
  },
});

/**
 * Get tasks for a work order
 */
export const getWorkOrderTasks = query({
  args: {
    workOrderId: v.id("workOrders"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { workOrderId, status } = args;
    
    // Get the work order to check tenant access
    const workOrder = await ctx.db.get(workOrderId);
    if (!workOrder) {
      throw new Error("Work order not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, workOrder.tenantId);
    
    let tasksQuery = ctx.db
      .query("workOrderTasks")
      .withIndex("by_work_order", (q) => q.eq("workOrderId", workOrderId));
    
    if (status) {
      tasksQuery = ctx.db
        .query("workOrderTasks")
        .withIndex("by_status", (q) => 
          q.eq("workOrderId", workOrderId).eq("status", status)
        );
    }
    
    return tasksQuery.collect();
  },
});

/**
 * Create a task for a work order
 */
export const createWorkOrderTask = mutation({
  args: {
    workOrderId: v.id("workOrders"),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    assignedTo: v.optional(v.id("users")),
    estimatedHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { workOrderId, name, description, status, assignedTo, estimatedHours } = args;
    
    // Get the work order to check tenant access
    const workOrder = await ctx.db.get(workOrderId);
    if (!workOrder) {
      throw new Error("Work order not found");
    }
    
    // Check if user is in tenant
    const user = await checkUserInTenant(ctx, workOrder.tenantId);
    
    const now = Date.now();
    
    // Create the task
    return ctx.db.insert("workOrderTasks", {
      workOrderId,
      name,
      description,
      status,
      assignedTo,
      estimatedHours,
      completedAt: status === "completed" ? now : undefined,
      createdBy: user.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a work order task
 */
export const updateWorkOrderTask = mutation({
  args: {
    id: v.id("workOrderTasks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const task = await ctx.db.get(id);
    if (!task) {
      throw new Error("Task not found");
    }
    
    // Get the work order to check tenant access
    const workOrder = await ctx.db.get(task.workOrderId);
    if (!workOrder) {
      throw new Error("Work order not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, workOrder.tenantId);
    
    const now = Date.now();
    
    // If status is being updated to completed, set completedAt
    const completedAt = updates.status === "completed" ? now : task.completedAt;
    
    return ctx.db.patch(id, {
      ...updates,
      completedAt,
      updatedAt: now,
    });
  },
});

/**
 * Delete a work order task
 */
export const deleteWorkOrderTask = mutation({
  args: {
    id: v.id("workOrderTasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    
    // Get the work order to check tenant access
    const workOrder = await ctx.db.get(task.workOrderId);
    if (!workOrder) {
      throw new Error("Work order not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, workOrder.tenantId);
    
    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Add a comment to a work order
 */
export const addWorkOrderComment = mutation({
  args: {
    workOrderId: v.id("workOrders"),
    text: v.string(),
    attachments: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const { workOrderId, text, attachments } = args;
    
    // Get the work order to check tenant access
    const workOrder = await ctx.db.get(workOrderId);
    if (!workOrder) {
      throw new Error("Work order not found");
    }
    
    // Check if user is in tenant
    const user = await checkUserInTenant(ctx, workOrder.tenantId);
    
    // Add the comment
    return ctx.db.insert("workOrderComments", {
      workOrderId,
      authorId: user.userId,
      text,
      attachments,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get comments for a work order
 */
export const getWorkOrderComments = query({
  args: {
    workOrderId: v.id("workOrders"),
  },
  handler: async (ctx, args) => {
    const { workOrderId } = args;
    
    // Get the work order to check tenant access
    const workOrder = await ctx.db.get(workOrderId);
    if (!workOrder) {
      throw new Error("Work order not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, workOrder.tenantId);
    
    // Get comments sorted by creation time
    return ctx.db
      .query("workOrderComments")
      .withIndex("by_work_order_time", (q) => q.eq("workOrderId", workOrderId))
      .order("asc")
      .collect();
  },
});

/**
 * Get contractors assigned to a work order
 */
export const getWorkOrderContractors = query({
  args: {
    workOrderId: v.id("workOrders"),
  },
  handler: async (ctx, args) => {
    const workOrder = await ctx.db.get(args.workOrderId);
    if (!workOrder) {
      throw new Error("Work order not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, workOrder.tenantId);
    
    // Get all assignments for this work order
    const assignments = await ctx.db
      .query("contractorAssignments")
      .withIndex("by_work_order", (q: any) => q.eq("workOrderId", args.workOrderId))
      .collect();
    
    // Get unique contractor IDs from assignments
    const contractorIds = [...new Set(assignments.map(a => a.contractorId))];
    
    // Fetch the contractor details
    const contractors = await Promise.all(
      contractorIds.map(id => ctx.db.get(id))
    );
    
    // Get the profile IDs and details for each assignment
    const profileDetails = await Promise.all(
      assignments
        .filter(a => a.contractorProfileId)
        .map(async a => {
          const profile = await ctx.db.get(a.contractorProfileId!);
          return {
            assignmentId: a._id,
            profile,
            startDate: a.startDate,
            endDate: a.endDate,
            status: a.status || "",
            notes: a.notes || "",
          };
        })
    );
    
    // Return both contractors and their profiles assigned to this work order
    return {
      contractors: contractors.filter(Boolean),
      assignedProfiles: profileDetails.filter(p => p.profile !== null),
    };
  },
}); 