import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { checkUserInTenant } from "./utils";

/**
 * Get all projects for a tenant
 */
export const getProjects = query({
  args: {
    tenantId: v.id("tenants"),
    status: v.optional(v.string()),
    worksiteId: v.optional(v.id("worksites")),
  },
  returns: v.array(
    v.object({
      _id: v.id("projects"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      tenantId: v.id("tenants"),
      worksiteId: v.optional(v.id("worksites")),
      status: v.string(),
      priority: v.string(),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      budget: v.optional(v.number()),
      managerId: v.optional(v.id("users")),
      teamMembers: v.optional(v.array(v.id("users"))),
      tags: v.optional(v.array(v.string())),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const { tenantId, status, worksiteId } = args;
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, tenantId);
    
    let projectsQuery = ctx.db
      .query("projects")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId));
    
    if (status) {
      projectsQuery = projectsQuery.withIndex("by_tenant_status", (q) => 
        q.eq("tenantId", tenantId).eq("status", status)
      );
    }
    
    if (worksiteId) {
      projectsQuery = projectsQuery.withIndex("by_worksite", (q) => 
        q.eq("worksiteId", worksiteId)
      );
    }
    
    return projectsQuery.collect();
  },
});

/**
 * Get a single project by ID
 */
export const getProject = query({
  args: {
    id: v.id("projects"),
  },
  returns: v.object({
    _id: v.id("projects"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    tenantId: v.id("tenants"),
    worksiteId: v.optional(v.id("worksites")),
    status: v.string(),
    priority: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    managerId: v.optional(v.id("users")),
    teamMembers: v.optional(v.array(v.id("users"))),
    tags: v.optional(v.array(v.string())),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, project.tenantId);
    
    return project;
  },
});

/**
 * Create a new project
 */
export const createProject = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    worksiteId: v.optional(v.id("worksites")),
    status: v.string(),
    priority: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    managerId: v.optional(v.id("users")),
    teamMembers: v.optional(v.array(v.id("users"))),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const { tenantId, name, description, worksiteId, status, priority, 
            startDate, endDate, budget, managerId, teamMembers, tags } = args;
    
    // Check if user is in tenant
    const user = await checkUserInTenant(ctx, tenantId);
    
    const now = Date.now();
    
    return ctx.db.insert("projects", {
      name,
      description,
      tenantId,
      worksiteId,
      status,
      priority,
      startDate,
      endDate,
      budget,
      managerId,
      teamMembers,
      tags,
      createdBy: user.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing project
 */
export const updateProject = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    worksiteId: v.optional(v.id("worksites")),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    managerId: v.optional(v.id("users")),
    teamMembers: v.optional(v.array(v.id("users"))),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const project = await ctx.db.get(id);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, project.tenantId);
    
    return ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a project
 */
export const deleteProject = mutation({
  args: {
    id: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, project.tenantId);
    
    // Delete all associated tasks
    const tasks = await ctx.db
      .query("projectTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
    
    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Get tasks for a project
 */
export const getProjectTasks = query({
  args: {
    projectId: v.id("projects"),
    status: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("projectTasks"),
      _creationTime: v.number(),
      projectId: v.id("projects"),
      name: v.string(),
      description: v.optional(v.string()),
      status: v.string(),
      assignedTo: v.optional(v.id("users")),
      dueDate: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const { projectId, status } = args;
    
    // Get the project to check tenant access
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, project.tenantId);
    
    let tasksQuery = ctx.db
      .query("projectTasks")
      .withIndex("by_project", (q) => q.eq("projectId", projectId));
    
    if (status) {
      tasksQuery = tasksQuery.withIndex("by_project_status", (q) => 
        q.eq("projectId", projectId).eq("status", status)
      );
    }
    
    return tasksQuery.collect();
  },
});

/**
 * Create a project task
 */
export const createProjectTask = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
  },
  returns: v.id("projectTasks"),
  handler: async (ctx, args) => {
    const { projectId, name, description, status, assignedTo, dueDate } = args;
    
    // Get the project to check tenant access
    const project = await ctx.db.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Check if user is in tenant
    const user = await checkUserInTenant(ctx, project.tenantId);
    
    const now = Date.now();
    
    return ctx.db.insert("projectTasks", {
      projectId,
      name,
      description,
      status,
      assignedTo,
      dueDate,
      completedAt: status === "completed" ? now : undefined,
      createdBy: user.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a project task
 */
export const updateProjectTask = mutation({
  args: {
    id: v.id("projectTasks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
  },
  returns: v.id("projectTasks"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const task = await ctx.db.get(id);
    if (!task) {
      throw new Error("Task not found");
    }
    
    // Get the project to check tenant access
    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, project.tenantId);
    
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
 * Delete a project task
 */
export const deleteProjectTask = mutation({
  args: {
    id: v.id("projectTasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    
    // Get the project to check tenant access
    const project = await ctx.db.get(task.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, project.tenantId);
    
    await ctx.db.delete(args.id);
    return null;
  },
});

/**
 * Get contractors assigned to a project
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
      .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId))
      .collect();
    
    // Get unique contractor IDs from assignments
    const contractorIds = [...new Set(assignments.map(a => a.contractorId))];
    
    // Fetch the contractor details
    const contractors = await Promise.all(
      contractorIds.map(id => ctx.db.get(id))
    );
    
    return contractors.filter(Boolean);
  },
}); 