import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Create a new worksite for a tenant
 */
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    coordinates: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    radius: v.optional(v.number()),
  },
  returns: v.id("worksites"),
  handler: async (ctx, args) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is a member of this tenant
    const membership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", user._id).eq("tenantId", args.tenantId)
      )
      .unique();

    if (!membership) {
      throw new Error("Not a member of this tenant");
    }

    // Only admin or manager roles can create worksites
    if (membership.role !== "admin" && membership.role !== "manager") {
      throw new Error("Insufficient permissions");
    }

    // Create the worksite
    const worksiteId = await ctx.db.insert("worksites", {
      tenantId: args.tenantId,
      name: args.name,
      description: args.description,
      address: args.address,
      coordinates: args.coordinates,
      radius: args.radius,
    });

    // Add creator as worksite admin
    await ctx.db.insert("userWorksites", {
      userId: user._id,
      worksiteId,
      role: "admin",
      assignedAt: Date.now(),
    });

    return worksiteId;
  },
});

/**
 * List all worksites for a tenant
 */
export const listByTenant = query({
  args: {
    tenantId: v.id("tenants"),
  },
  returns: v.array(
    v.object({
      _id: v.id("worksites"),
      name: v.string(),
      description: v.optional(v.string()),
      address: v.optional(v.string()),
      userRole: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    // Check if user is a member of this tenant
    const tenantMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", user._id).eq("tenantId", args.tenantId)
      )
      .unique();

    if (!tenantMembership) {
      return [];
    }

    // Get all worksites for this tenant
    const worksites = await ctx.db
      .query("worksites")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    // Get user worksite memberships
    const userWorksiteMemberships = await ctx.db
      .query("userWorksites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Create a map of worksite IDs to roles
    const worksiteRoles = new Map(
      userWorksiteMemberships.map((membership) => [
        membership.worksiteId.toString(),
        membership.role,
      ])
    );

    // Add user role information to worksites
    return worksites.map((worksite) => ({
      _id: worksite._id,
      name: worksite.name,
      description: worksite.description,
      address: worksite.address,
      userRole: worksiteRoles.get(worksite._id.toString()) || undefined,
    }));
  },
});

/**
 * Get worksite details
 */
export const get = query({
  args: {
    worksiteId: v.id("worksites"),
  },
  returns: v.union(
    v.object({
      _id: v.id("worksites"),
      tenantId: v.id("tenants"),
      name: v.string(),
      description: v.optional(v.string()),
      address: v.optional(v.string()),
      coordinates: v.optional(v.object({
        latitude: v.number(),
        longitude: v.number(),
      })),
      radius: v.optional(v.number()),
      userRole: v.optional(v.string()),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    // Get worksite details
    const worksite = await ctx.db.get(args.worksiteId);
    if (!worksite) {
      return null;
    }

    // Check if user is a member of this tenant
    const tenantMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", user._id).eq("tenantId", worksite.tenantId)
      )
      .unique();

    if (!tenantMembership) {
      return null;
    }

    // Get user's worksite role if any
    const worksiteMembership = await ctx.db
      .query("userWorksites")
      .withIndex("by_user_and_worksite", (q) => 
        q.eq("userId", user._id).eq("worksiteId", args.worksiteId)
      )
      .unique();

    return {
      _id: worksite._id,
      tenantId: worksite.tenantId,
      name: worksite.name,
      description: worksite.description,
      address: worksite.address,
      userRole: worksiteMembership?.role,
      coordinates: worksite.coordinates,
      radius: worksite.radius,
      createdAt: worksite._creationTime,

    };
  },
});

/**
 * Add a user to a worksite
 */
export const addUserToWorksite = mutation({
  args: {
    userId: v.id("users"),
    worksiteId: v.id("worksites"),
    role: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Find current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Check if worksite exists
    const worksite = await ctx.db.get(args.worksiteId);
    if (!worksite) {
      throw new Error("Worksite not found");
    }

    // Check if current user has admin access to the tenant
    const tenantMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", currentUser._id).eq("tenantId", worksite.tenantId)
      )
      .unique();

    if (!tenantMembership) {
      throw new Error("Not authorized to access this tenant");
    }

    // Check if current user has admin or manager role for the tenant or worksite
    const hasAdminAccess = tenantMembership.role === "admin";
    
    if (!hasAdminAccess) {
      const worksiteMembership = await ctx.db
        .query("userWorksites")
        .withIndex("by_user_and_worksite", (q) => 
          q.eq("userId", currentUser._id).eq("worksiteId", args.worksiteId)
        )
        .unique();
      
      if (!worksiteMembership || worksiteMembership.role !== "manager") {
        throw new Error("Not authorized to add users to this worksite");
      }
    }

    // Check if user belongs to the tenant
    const userTenantMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", args.userId).eq("tenantId", worksite.tenantId)
      )
      .unique();

    if (!userTenantMembership) {
      throw new Error("User must be a member of the tenant first");
    }

    // Check if user is already assigned to this worksite
    const existingMembership = await ctx.db
      .query("userWorksites")
      .withIndex("by_user_and_worksite", (q) => 
        q.eq("userId", args.userId).eq("worksiteId", args.worksiteId)
      )
      .unique();

    if (existingMembership) {
      // Update role if different
      if (existingMembership.role !== args.role) {
        await ctx.db.patch(existingMembership._id, {
          role: args.role,
        });
      }
      return true;
    }

    // Add user to worksite with specified role
    await ctx.db.insert("userWorksites", {
      userId: args.userId,
      worksiteId: args.worksiteId,
      role: args.role,
      assignedAt: Date.now(),
    });

    return true;
  },
});

/**
 * Remove a user from a worksite
 */
export const removeUserFromWorksite = mutation({
  args: {
    userId: v.id("users"),
    worksiteId: v.id("worksites"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Find current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Check if worksite exists
    const worksite = await ctx.db.get(args.worksiteId);
    if (!worksite) {
      throw new Error("Worksite not found");
    }

    // Check if current user has admin access to the tenant
    const tenantMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", currentUser._id).eq("tenantId", worksite.tenantId)
      )
      .unique();

    if (!tenantMembership) {
      throw new Error("Not authorized to access this tenant");
    }

    // Check if current user has admin or manager role for the tenant or worksite
    const hasAdminAccess = tenantMembership.role === "admin";
    
    if (!hasAdminAccess) {
      const worksiteMembership = await ctx.db
        .query("userWorksites")
        .withIndex("by_user_and_worksite", (q) => 
          q.eq("userId", currentUser._id).eq("worksiteId", args.worksiteId)
        )
        .unique();
      
      if (!worksiteMembership || worksiteMembership.role !== "manager") {
        throw new Error("Not authorized to remove users from this worksite");
      }
    }

    // Ensure user isn't removing themselves
    if (args.userId === currentUser._id) {
      throw new Error("Cannot remove yourself from the worksite");
    }

    // Find the membership to remove
    const membershipToRemove = await ctx.db
      .query("userWorksites")
      .withIndex("by_user_and_worksite", (q) => 
        q.eq("userId", args.userId).eq("worksiteId", args.worksiteId)
      )
      .unique();

    if (!membershipToRemove) {
      return false; // User is not assigned to this worksite
    }

    // Remove user from worksite
    await ctx.db.delete(membershipToRemove._id);

    return true;
  },
});

/**
 * Update a user's role in a worksite
 */
export const updateUserWorksiteRole = mutation({
  args: {
    userId: v.id("users"),
    worksiteId: v.id("worksites"),
    role: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Find current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) {
      throw new Error("Current user not found");
    }

    // Check if worksite exists
    const worksite = await ctx.db.get(args.worksiteId);
    if (!worksite) {
      throw new Error("Worksite not found");
    }

    // Check if current user has admin access to the tenant
    const tenantMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", currentUser._id).eq("tenantId", worksite.tenantId)
      )
      .unique();

    if (!tenantMembership) {
      throw new Error("Not authorized to access this tenant");
    }

    // Check if current user has admin or manager role for the tenant or worksite
    const hasAdminAccess = tenantMembership.role === "admin";
    
    if (!hasAdminAccess) {
      const worksiteMembership = await ctx.db
        .query("userWorksites")
        .withIndex("by_user_and_worksite", (q) => 
          q.eq("userId", currentUser._id).eq("worksiteId", args.worksiteId)
        )
        .unique();
      
      if (!worksiteMembership || worksiteMembership.role !== "manager") {
        throw new Error("Not authorized to update user roles in this worksite");
      }
    }

    // Ensure user isn't updating their own role
    if (args.userId === currentUser._id) {
      throw new Error("Cannot update your own role");
    }

    // Find the membership to update
    const membershipToUpdate = await ctx.db
      .query("userWorksites")
      .withIndex("by_user_and_worksite", (q) => 
        q.eq("userId", args.userId).eq("worksiteId", args.worksiteId)
      )
      .unique();

    if (!membershipToUpdate) {
      throw new Error("User is not assigned to this worksite");
    }

    // Update role
    await ctx.db.patch(membershipToUpdate._id, {
      role: args.role,
    });

    return true;
  },
});

/**
 * List users for a worksite
 */
export const listWorksiteUsers = query({
  args: {
    worksiteId: v.id("worksites"),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      profilePicture: v.optional(v.string()),
      role: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    // Check if worksite exists
    const worksite = await ctx.db.get(args.worksiteId);
    if (!worksite) {
      return [];
    }

    // Check if user has access to the tenant
    const tenantMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", user._id).eq("tenantId", worksite.tenantId)
      )
      .unique();

    if (!tenantMembership) {
      return [];
    }

    // Get all users assigned to this worksite
    const userWorksites = await ctx.db
      .query("userWorksites")
      .withIndex("by_worksite", (q) => q.eq("worksiteId", args.worksiteId))
      .collect();

    // Fetch user details
    const users = await Promise.all(
      userWorksites.map(async (userWorksite) => {
        const userData = await ctx.db.get(userWorksite.userId);
        if (!userData) return null;
        
        return {
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          profilePicture: userData.profilePicture,
          role: userWorksite.role,
        };
      })
    );

    // Filter out null entries
    return users.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});

/**
 * List all worksites for the current user across all tenants
 */
export const listForUser = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("worksites"),
      name: v.string(),
      address: v.optional(v.string()),
      tenantId: v.id("tenants"),
      tenantName: v.string(),
      coordinates: v.object({
        latitude: v.number(),
        longitude: v.number(),
      }),
      radius: v.number(),
    })
  ),
  handler: async (ctx) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    // Get all tenants the user belongs to
    const userTenants = await ctx.db
      .query("userTenants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Create a map of tenant IDs to tenant names for easy lookup
    const tenantIds = userTenants.map((ut) => ut.tenantId);
    const tenants = await Promise.all(
      tenantIds.map((id) => ctx.db.get(id))
    );
    const tenantMap = new Map();
    tenants.forEach((tenant) => {
      if (tenant) {
        tenantMap.set(tenant._id.toString(), tenant.name);
      }
    });

    // Get all worksites for these tenants
    const allWorksites = [];
    for (const tenantId of tenantIds) {
      const worksites = await ctx.db
        .query("worksites")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect();
      
      // Add tenant name to each worksite
      const enrichedWorksites = worksites.map((worksite) => ({
        _id: worksite._id,
        name: worksite.name,
        address: worksite.address,
        tenantId: worksite.tenantId,
        tenantName: tenantMap.get(worksite.tenantId.toString()) || "Unknown",
        coordinates: worksite.coordinates || { latitude: 0, longitude: 0 },
        radius: worksite.radius || 100,
      }));
      
      allWorksites.push(...enrichedWorksites);
    }

    return allWorksites;
  },
});

/**
 * Update a worksite
 */
export const update = mutation({
  args: {
    worksiteId: v.id("worksites"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    coordinates: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    radius: v.optional(v.number()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the worksite
    const worksite = await ctx.db.get(args.worksiteId);
    if (!worksite) {
      throw new Error("Worksite not found");
    }

    // Check if user has access to this tenant
    const tenantMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", user._id).eq("tenantId", worksite.tenantId)
      )
      .unique();

    if (!tenantMembership) {
      throw new Error("Not authorized to update this worksite");
    }

    // Only admins and managers can update worksites
    if (tenantMembership.role !== "admin" && tenantMembership.role !== "manager") {
      throw new Error("Insufficient permissions");
    }

    // Prepare updates
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.address !== undefined) updates.address = args.address;
    if (args.coordinates !== undefined) updates.coordinates = args.coordinates;
    if (args.radius !== undefined) updates.radius = args.radius;

    // Update the worksite
    await ctx.db.patch(args.worksiteId, updates);
    return true;
  },
});

/**
 * Delete a worksite and its associations
 */
export const deleteWorksite = mutation({
  args: {
    worksiteId: v.id("worksites"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the worksite
    const worksite = await ctx.db.get(args.worksiteId);
    if (!worksite) {
      throw new Error("Worksite not found");
    }

    // Check if user has access to this tenant
    const tenantMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", user._id).eq("tenantId", worksite.tenantId)
      )
      .unique();

    if (!tenantMembership) {
      throw new Error("Not authorized to delete this worksite");
    }

    // Only admins can delete worksites
    if (tenantMembership.role !== "admin") {
      throw new Error("Insufficient permissions");
    }

    // Delete geofences associated with this worksite
    const geofences = await ctx.db
      .query("geofences")
      .withIndex("by_worksite", (q) => q.eq("worksiteId", args.worksiteId))
      .collect();

    for (const geofence of geofences) {
      await ctx.db.delete(geofence._id);
    }

    // Delete user-worksite associations
    const userWorksites = await ctx.db
      .query("userWorksites")
      .withIndex("by_worksite", (q) => q.eq("worksiteId", args.worksiteId))
      .collect();

    for (const userWorksite of userWorksites) {
      await ctx.db.delete(userWorksite._id);
    }

    // Delete the worksite
    await ctx.db.delete(args.worksiteId);
    return true;
  },
}); 