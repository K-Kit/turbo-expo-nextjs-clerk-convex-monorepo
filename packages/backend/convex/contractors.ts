import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { checkUserInTenant } from "./utils";

/**
 * Get all contractors for a tenant with optional filtering
 */
export const getContractors = query({
  args: {
    tenantId: v.id("tenants"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is in tenant
    await checkUserInTenant(ctx, args.tenantId);
    
    // Start with tenant index
    let contractorsQuery = ctx.db
      .query("contractors")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId));
    
    // Apply status filter if provided
    if (args.status) {
      contractorsQuery = ctx.db
        .query("contractors")
        .withIndex("by_tenant_status", (q) => 
          q.eq("tenantId", args.tenantId).eq("status", args.status as string)
        );
    }
    
    return contractorsQuery.order("desc").collect();
  },
});

/**
 * Get a single contractor by ID
 */
export const getContractor = query({
  args: {
    id: v.id("contractors"),
  },
  handler: async (ctx, args) => {
    const contractor = await ctx.db.get(args.id);
    
    if (!contractor) {
      throw new Error("Contractor not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, contractor.tenantId);
    
    return contractor;
  },
});

/**
 * Create a new contractor organization
 */
export const createContractor = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    status: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { tenantId, name, status, ...rest } = args;
    
    // Check if user is in tenant
    const user = await checkUserInTenant(ctx, tenantId);
    
    const now = Date.now();
    
    // Create the contractor
    return ctx.db.insert("contractors", {
      tenantId,
      name,
      status,
      ...rest,
      createdBy: user.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing contractor
 */
export const updateContractor = mutation({
  args: {
    id: v.id("contractors"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const contractor = await ctx.db.get(id);
    if (!contractor) {
      throw new Error("Contractor not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, contractor.tenantId);
    
    // Update the contractor
    return ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a contractor
 */
export const deleteContractor = mutation({
  args: {
    id: v.id("contractors"),
  },
  handler: async (ctx, args) => {
    const contractor = await ctx.db.get(args.id);
    if (!contractor) {
      throw new Error("Contractor not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, contractor.tenantId);
    
    // Delete all contractor profiles associated with this contractor
    const contractorProfiles = await ctx.db
      .query("contractorProfiles")
      .withIndex("by_contractor", (q) => q.eq("contractorId", args.id))
      .collect();
    
    for (const profile of contractorProfiles) {
      await ctx.db.delete(profile._id);
    }
    
    // Delete all contractor assignments associated with this contractor
    const contractorAssignments = await ctx.db
      .query("contractorAssignments")
      .withIndex("by_contractor", (q) => q.eq("contractorId", args.id))
      .collect();
    
    for (const assignment of contractorAssignments) {
      await ctx.db.delete(assignment._id);
    }
    
    // Delete the contractor
    return ctx.db.delete(args.id);
  },
});

/**
 * Get all profiles for a contractor
 */
export const getContractorProfiles = query({
  args: {
    contractorId: v.id("contractors"),
  },
  handler: async (ctx, args) => {
    const contractor = await ctx.db.get(args.contractorId);
    if (!contractor) {
      throw new Error("Contractor not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, contractor.tenantId);
    
    return ctx.db
      .query("contractorProfiles")
      .withIndex("by_contractor", (q) => q.eq("contractorId", args.contractorId))
      .collect();
  },
});

/**
 * Create a new contractor profile
 */
export const createContractorProfile = mutation({
  args: {
    contractorId: v.id("contractors"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    certifications: v.optional(v.array(v.string())),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const { contractorId, name, status, ...rest } = args;
    
    const contractor = await ctx.db.get(contractorId);
    if (!contractor) {
      throw new Error("Contractor not found");
    }
    
    // Check if user is in tenant
    const user = await checkUserInTenant(ctx, contractor.tenantId);
    
    const now = Date.now();
    
    // Create the contractor profile
    return ctx.db.insert("contractorProfiles", {
      contractorId,
      name,
      status,
      ...rest,
      createdBy: user.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a contractor profile
 */
export const updateContractorProfile = mutation({
  args: {
    id: v.id("contractorProfiles"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    certifications: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const profile = await ctx.db.get(id);
    if (!profile) {
      throw new Error("Contractor profile not found");
    }
    
    const contractor = await ctx.db.get(profile.contractorId);
    if (!contractor) {
      throw new Error("Parent contractor not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, contractor.tenantId);
    
    // Update the contractor profile
    return ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a contractor profile
 */
export const deleteContractorProfile = mutation({
  args: {
    id: v.id("contractorProfiles"),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.id);
    if (!profile) {
      throw new Error("Contractor profile not found");
    }
    
    const contractor = await ctx.db.get(profile.contractorId);
    if (!contractor) {
      throw new Error("Parent contractor not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, contractor.tenantId);
    
    // Delete all assignments associated with this profile
    const contractorAssignments = await ctx.db
      .query("contractorAssignments")
      .withIndex("by_contractor_profile", (q) => q.eq("contractorProfileId", args.id))
      .collect();
    
    for (const assignment of contractorAssignments) {
      await ctx.db.delete(assignment._id);
    }
    
    // Delete the profile
    return ctx.db.delete(args.id);
  },
});

/**
 * Get all assignments for a work order
 */
export const getWorkOrderAssignments = query({
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
    
    return ctx.db
      .query("contractorAssignments")
      .withIndex("by_work_order", (q) => q.eq("workOrderId", args.workOrderId))
      .collect();
  },
});

/**
 * Get all assignments for a contractor
 */
export const getContractorAssignments = query({
  args: {
    contractorId: v.id("contractors"),
  },
  handler: async (ctx, args) => {
    const contractor = await ctx.db.get(args.contractorId);
    if (!contractor) {
      throw new Error("Contractor not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, contractor.tenantId);
    
    return ctx.db
      .query("contractorAssignments")
      .withIndex("by_contractor", (q) => q.eq("contractorId", args.contractorId))
      .collect();
  },
});

/**
 * Create a new contractor assignment to a work order
 */
export const assignContractorToWorkOrder = mutation({
  args: {
    contractorId: v.id("contractors"),
    contractorProfileId: v.optional(v.id("contractorProfiles")),
    workOrderId: v.id("workOrders"),
    projectId: v.optional(v.id("projects")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { contractorId, workOrderId, status, ...rest } = args;
    
    // Verify contractor exists
    const contractor = await ctx.db.get(contractorId);
    if (!contractor) {
      throw new Error("Contractor not found");
    }
    
    // Verify work order exists
    const workOrder = await ctx.db.get(workOrderId);
    if (!workOrder) {
      throw new Error("Work order not found");
    }
    
    // Check if the work order and contractor belong to the same tenant
    if (workOrder.tenantId !== contractor.tenantId) {
      throw new Error("Work order and contractor must belong to the same tenant");
    }
    
    // Check if user is in tenant
    const user = await checkUserInTenant(ctx, contractor.tenantId);
    
    // Verify contractor profile if provided
    if (args.contractorProfileId) {
      const profile = await ctx.db.get(args.contractorProfileId);
      if (!profile) {
        throw new Error("Contractor profile not found");
      }
      
      if (profile.contractorId !== contractorId) {
        throw new Error("Contractor profile does not belong to the specified contractor");
      }
    }
    
    // Verify project if provided
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throw new Error("Project not found");
      }
      
      if (project.tenantId !== contractor.tenantId) {
        throw new Error("Project must belong to the same tenant");
      }
    }
    
    const now = Date.now();
    
    // Create the assignment
    return ctx.db.insert("contractorAssignments", {
      contractorId,
      workOrderId,
      status,
      ...rest,
      createdBy: user.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a contractor assignment
 */
export const updateContractorAssignment = mutation({
  args: {
    id: v.id("contractorAssignments"),
    contractorProfileId: v.optional(v.id("contractorProfiles")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const assignment = await ctx.db.get(id);
    if (!assignment) {
      throw new Error("Contractor assignment not found");
    }
    
    const contractor = await ctx.db.get(assignment.contractorId);
    if (!contractor) {
      throw new Error("Contractor not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, contractor.tenantId);
    
    // Verify contractor profile if provided
    if (args.contractorProfileId) {
      const profile = await ctx.db.get(args.contractorProfileId);
      if (!profile) {
        throw new Error("Contractor profile not found");
      }
      
      if (profile.contractorId !== assignment.contractorId) {
        throw new Error("Contractor profile does not belong to the specified contractor");
      }
    }
    
    // Update the assignment
    return ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a contractor assignment
 */
export const deleteContractorAssignment = mutation({
  args: {
    id: v.id("contractorAssignments"),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.id);
    if (!assignment) {
      throw new Error("Contractor assignment not found");
    }
    
    const contractor = await ctx.db.get(assignment.contractorId);
    if (!contractor) {
      throw new Error("Contractor not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, contractor.tenantId);
    
    // Delete the assignment
    return ctx.db.delete(args.id);
  },
});

/**
 * Get all contractors assigned to a project
 */
export const getProjectContractors = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, project.tenantId);
    
    // Get all assignments for this project
    const assignments = await ctx.db
      .query("contractorAssignments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    // Get unique contractor IDs from assignments
    const contractorIds = [...new Set(assignments.map(a => a.contractorId))];
    
    // Fetch the contractor details
    const contractors = await Promise.all(
      contractorIds.map(id => ctx.db.get(id))
    );
    
    // Filter out any null values (in case a contractor was deleted)
    return contractors.filter(Boolean);
  },
});

/**
 * Add a review to a contractor
 */
export const addContractorReview = mutation({
  args: {
    contractorId: v.id("contractors"),
    rating: v.number(), // 1-5 rating
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { contractorId, rating, comment } = args;
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    
    const contractor = await ctx.db.get(contractorId);
    if (!contractor) {
      throw new Error("Contractor not found");
    }
    
    // Check if user is in tenant
    const user = await checkUserInTenant(ctx, contractor.tenantId);
    
    const now = Date.now();
    
    // Create the review object
    const review = {
      reviewerId: user.userId,
      rating,
      comment,
      createdAt: now,
    };
    
    // Add to existing reviews or create new array
    const existingReviews = contractor.reviews || [];
    const updatedReviews = [...existingReviews, review];
    
    // Update the contractor
    await ctx.db.patch(contractorId, {
      reviews: updatedReviews,
      updatedAt: now,
    });
    
    return review;
  },
});

/**
 * Update a contractor review
 */
export const updateContractorReview = mutation({
  args: {
    contractorId: v.id("contractors"),
    reviewIndex: v.number(),
    rating: v.optional(v.number()),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { contractorId, reviewIndex, rating, comment } = args;
    
    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }
    
    const contractor = await ctx.db.get(contractorId);
    if (!contractor) {
      throw new Error("Contractor not found");
    }
    
    // Check if user is in tenant
    const user = await checkUserInTenant(ctx, contractor.tenantId);
    
    // Check if reviews exist
    if (!contractor.reviews || !contractor.reviews[reviewIndex]) {
      throw new Error("Review not found");
    }
    
    // Check if user is the author of the review
    if (contractor.reviews[reviewIndex].reviewerId !== user.userId) {
      throw new Error("You can only update your own reviews");
    }
    
    // Create updated review
    const updatedReview = {
      ...contractor.reviews[reviewIndex],
      ...(rating !== undefined && { rating }),
      ...(comment !== undefined && { comment }),
    };
    
    // Update the reviews array
    const updatedReviews = [...contractor.reviews];
    updatedReviews[reviewIndex] = updatedReview;
    
    // Update the contractor
    await ctx.db.patch(contractorId, {
      reviews: updatedReviews,
      updatedAt: Date.now(),
    });
    
    return updatedReview;
  },
}); 