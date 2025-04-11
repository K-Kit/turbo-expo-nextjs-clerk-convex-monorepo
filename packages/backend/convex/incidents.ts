import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper function to get the current user or throw an error
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

// Helper function to verify tenant access
async function verifyTenantAccess(
  ctx: QueryCtx | MutationCtx, 
  userId: Id<"users">, 
  tenantId: Id<"tenants">
) {
  const membership = await ctx.db
    .query("userTenants")
    .withIndex("by_user_and_tenant", (q) =>
      q.eq("userId", userId).eq("tenantId", tenantId),
    )
    .unique();

  if (!membership) {
    throw new Error("Not authorized to access this tenant");
  }

  return membership;
}

// Helper function to verify worksite access
async function verifyWorksiteAccess(
  ctx: QueryCtx | MutationCtx, 
  userId: Id<"users">, 
  worksiteId: Id<"worksites">
) {
  if (!worksiteId) return null;

  const worksite = await ctx.db.get(worksiteId);
  if (!worksite) {
    throw new Error("Worksite not found");
  }

  // First check tenant access
  await verifyTenantAccess(ctx, userId, worksite.tenantId);

  // Then check if user has specific worksite access (optional)
  const worksiteMembership = await ctx.db
    .query("userWorksites")
    .withIndex("by_user_and_worksite", (q) =>
      q.eq("userId", userId).eq("worksiteId", worksiteId),
    )
    .unique();

  return { worksite, membership: worksiteMembership };
}

// Function to create a new incident
export const reportIncident = mutation({
  args: {
    tenantId: v.id("tenants"),
    worksiteId: v.optional(v.id("worksites")),
    title: v.string(),
    description: v.string(),
    incidentType: v.string(),
    severity: v.string(),
    location: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    address: v.optional(v.string()),
    occuredAt: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    
    // Verify tenant access
    await verifyTenantAccess(ctx, user._id, args.tenantId);
    
    // Verify worksite access if provided
    if (args.worksiteId) {
      await verifyWorksiteAccess(ctx, user._id, args.worksiteId);
    }
    
    // Create incident
    const incidentId = await ctx.db.insert("incidents", {
      tenantId: args.tenantId,
      worksiteId: args.worksiteId,
      reportedById: user._id,
      title: args.title,
      description: args.description,
      incidentType: args.incidentType,
      status: "reported", // Initial status
      severity: args.severity,
      location: args.location,
      address: args.address,
      reportedAt: Date.now(),
      occuredAt: args.occuredAt,
      tags: args.tags,
      images: args.images,
    });
    
    return incidentId;
  },
});

// Function to list incidents by tenant with filtering options
export const listIncidentsByTenant = query({
  args: {
    tenantId: v.id("tenants"),
    status: v.optional(v.string()),
    incidentType: v.optional(v.string()),
    severity: v.optional(v.string()),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    
    // Verify tenant access
    await verifyTenantAccess(ctx, user._id, args.tenantId);
    
    // Start with query by tenant
    let incidentsQuery = ctx.db
      .query("incidents")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId));
    
    // Apply filters if provided
    if (args.status) {
      incidentsQuery = ctx.db
        .query("incidents")
        .withIndex("by_status", (q) => 
          q.eq("tenantId", args.tenantId).eq("status", args.status)
        );
    }
    
    if (args.incidentType) {
      incidentsQuery = ctx.db
        .query("incidents")
        .withIndex("by_type", (q) => 
          q.eq("tenantId", args.tenantId).eq("incidentType", args.incidentType)
        );
    }
    
    if (args.severity) {
      incidentsQuery = ctx.db
        .query("incidents")
        .withIndex("by_severity", (q) => 
          q.eq("tenantId", args.tenantId).eq("severity", args.severity)
        );
    }
    
    // Order by reported date (most recent first)
    incidentsQuery = incidentsQuery.order("desc");
    
    // Apply date range filtering in memory
    let incidents = await incidentsQuery.collect();
    
    if (args.fromDate) {
      incidents = incidents.filter(
        (incident) => incident.reportedAt >= args.fromDate
      );
    }
    
    if (args.toDate) {
      incidents = incidents.filter(
        (incident) => incident.reportedAt <= args.toDate
      );
    }
    
    // Apply limit
    const limit = args.limit || 50; // Default to 50
    incidents = incidents.slice(0, limit);
    
    // Enhance incidents with reporter and assignee details
    const enhancedIncidents = await Promise.all(
      incidents.map(async (incident) => {
        // Get reporter details
        const reporter = await ctx.db.get(incident.reportedById);
        
        // Get assignee details if assigned
        let assignee = null;
        if (incident.assignedToId) {
          assignee = await ctx.db.get(incident.assignedToId);
        }
        
        // Get worksite details if available
        let worksite = null;
        if (incident.worksiteId) {
          worksite = await ctx.db.get(incident.worksiteId);
        }
        
        return {
          ...incident,
          reporter: reporter ? {
            _id: reporter._id,
            name: reporter.name,
            profilePicture: reporter.profilePicture,
          } : null,
          assignee: assignee ? {
            _id: assignee._id,
            name: assignee.name,
            profilePicture: assignee.profilePicture,
          } : null,
          worksite: worksite ? {
            _id: worksite._id,
            name: worksite.name,
          } : null,
        };
      })
    );
    
    return enhancedIncidents;
  },
});

// Function to list incidents by worksite
export const listIncidentsByWorksite = query({
  args: {
    worksiteId: v.id("worksites"),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    
    // Get worksite details to get tenantId
    const worksite = await ctx.db.get(args.worksiteId);
    if (!worksite) {
      throw new Error("Worksite not found");
    }
    
    // Verify tenant access
    await verifyTenantAccess(ctx, user._id, worksite.tenantId);
    
    // Query incidents by worksite
    const incidentsQuery = ctx.db
      .query("incidents")
      .withIndex("by_worksite", (q) => q.eq("worksiteId", args.worksiteId));
    
    // Apply status filter if provided
    let incidents = await incidentsQuery.collect();
    
    if (args.status) {
      incidents = incidents.filter(
        (incident) => incident.status === args.status
      );
    }
    
    // Order by reported date (most recent first)
    incidents.sort((a, b) => b.reportedAt - a.reportedAt);
    
    // Apply limit
    const limit = args.limit || 50; // Default to 50
    incidents = incidents.slice(0, limit);
    
    // Enhance incidents with reporter and assignee details
    const enhancedIncidents = await Promise.all(
      incidents.map(async (incident) => {
        // Get reporter details
        const reporter = await ctx.db.get(incident.reportedById);
        
        // Get assignee details if assigned
        let assignee = null;
        if (incident.assignedToId) {
          assignee = await ctx.db.get(incident.assignedToId);
        }
        
        return {
          ...incident,
          reporter: reporter ? {
            _id: reporter._id,
            name: reporter.name,
            profilePicture: reporter.profilePicture,
          } : null,
          assignee: assignee ? {
            _id: assignee._id,
            name: assignee.name,
            profilePicture: assignee.profilePicture,
          } : null,
        };
      })
    );
    
    return enhancedIncidents;
  },
});

// Function to get incident details by ID
export const getIncidentById = query({
  args: {
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    
    // Get incident
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) {
      throw new Error("Incident not found");
    }
    
    // Verify tenant access
    await verifyTenantAccess(ctx, user._id, incident.tenantId);
    
    // Get reporter details
    const reporter = await ctx.db.get(incident.reportedById);
    
    // Get assignee details if assigned
    let assignee = null;
    if (incident.assignedToId) {
      assignee = await ctx.db.get(incident.assignedToId);
    }
    
    // Get worksite details if available
    let worksite = null;
    if (incident.worksiteId) {
      worksite = await ctx.db.get(incident.worksiteId);
    }
    
    return {
      ...incident,
      reporter: reporter ? {
        _id: reporter._id,
        name: reporter.name,
        profilePicture: reporter.profilePicture,
      } : null,
      assignee: assignee ? {
        _id: assignee._id,
        name: assignee.name,
        profilePicture: assignee.profilePicture,
      } : null,
      worksite: worksite ? {
        _id: worksite._id,
        name: worksite.name,
        address: worksite.address,
      } : null,
    };
  },
});

// Function to update incident status and assignee
export const updateIncident = mutation({
  args: {
    incidentId: v.id("incidents"),
    status: v.optional(v.string()),
    assignedToId: v.optional(v.id("users")),
    actionTaken: v.optional(v.string()),
    preventativeMeasures: v.optional(v.string()),
    description: v.optional(v.string()),
    severity: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    
    // Get incident
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) {
      throw new Error("Incident not found");
    }
    
    // Verify tenant access (and check for admin permission in a real app)
    await verifyTenantAccess(ctx, user._id, incident.tenantId);
    
    // Prepare update object
    const updateData = {};
    
    // Only include fields that are provided
    if (args.status !== undefined) {
      updateData.status = args.status;
      
      // If status is changing to "resolved", add resolved timestamp
      if (args.status === "resolved" && incident.status !== "resolved") {
        updateData.resolvedAt = Date.now();
      }
    }
    
    if (args.assignedToId !== undefined) {
      updateData.assignedToId = args.assignedToId;
    }
    
    if (args.actionTaken !== undefined) {
      updateData.actionTaken = args.actionTaken;
    }
    
    if (args.preventativeMeasures !== undefined) {
      updateData.preventativeMeasures = args.preventativeMeasures;
    }
    
    if (args.description !== undefined) {
      updateData.description = args.description;
    }
    
    if (args.severity !== undefined) {
      updateData.severity = args.severity;
    }
    
    if (args.tags !== undefined) {
      updateData.tags = args.tags;
    }
    
    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      await ctx.db.patch(args.incidentId, updateData);
    }
    
    return args.incidentId;
  },
});

// Function to get incident statistics
export const getIncidentStatsByTenant = query({
  args: {
    tenantId: v.id("tenants"),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    
    // Verify tenant access
    await verifyTenantAccess(ctx, user._id, args.tenantId);
    
    // Get all incidents for tenant
    let incidents = await ctx.db
      .query("incidents")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    
    // Apply date filters if provided
    if (args.fromDate) {
      incidents = incidents.filter(
        (incident) => incident.reportedAt >= args.fromDate
      );
    }
    
    if (args.toDate) {
      incidents = incidents.filter(
        (incident) => incident.reportedAt <= args.toDate
      );
    }
    
    // Calculate statistics
    const totalCount = incidents.length;
    
    // Count by status
    const statusCounts = incidents.reduce((counts, incident) => {
      counts[incident.status] = (counts[incident.status] || 0) + 1;
      return counts;
    }, {});
    
    // Count by type
    const typeCounts = incidents.reduce((counts, incident) => {
      counts[incident.incidentType] = (counts[incident.incidentType] || 0) + 1;
      return counts;
    }, {});
    
    // Count by severity
    const severityCounts = incidents.reduce((counts, incident) => {
      counts[incident.severity] = (counts[incident.severity] || 0) + 1;
      return counts;
    }, {});
    
    // Calculate resolution time statistics (for resolved incidents)
    const resolvedIncidents = incidents.filter(
      (incident) => incident.resolvedAt
    );
    
    const resolutionTimes = resolvedIncidents.map(
      (incident) => incident.resolvedAt - incident.reportedAt
    );
    
    const averageResolutionTime = resolutionTimes.length
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
      : 0;
    
    return {
      totalCount,
      statusCounts,
      typeCounts,
      severityCounts,
      resolvedCount: resolvedIncidents.length,
      averageResolutionTime,
    };
  },
}); 