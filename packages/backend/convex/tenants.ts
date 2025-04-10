import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Create a new tenant
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
  },
  returns: v.id("tenants"),
  handler: async (ctx, args) => {
    // Create the tenant
    const tenantId = await ctx.db.insert("tenants", {
      name: args.name,
      description: args.description,
      logoUrl: args.logoUrl,
    });

    // Get the current user (using Clerk authentication context)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Find or create the user
    const userIdResult = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    let userId;
    if (!userIdResult) {
      userId = await ctx.db.insert("users", {
        name: identity.name || "",
        email: identity.email || "",
        clerkId: identity.subject,
        profilePicture: identity.pictureUrl,
      });
    } else {
      userId = userIdResult._id;
    }

    // Add the creator as admin of the tenant
    await ctx.db.insert("userTenants", {
      userId,
      tenantId,
      role: "admin",
      joinedAt: Date.now(),
    });

    return tenantId;
  },
});

/**
 * List all tenants for the current user
 */
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("tenants"),
      name: v.string(),
      description: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      role: v.string(),
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

    // Get all tenant memberships for this user
    const userTenants = await ctx.db
      .query("userTenants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Fetch the tenant details
    const tenants = await Promise.all(
      userTenants.map(async (userTenant) => {
        const tenant = await ctx.db.get(userTenant.tenantId);
        if (!tenant) return null;
        
        return {
          _id: tenant._id,
          name: tenant.name,
          description: tenant.description,
          logoUrl: tenant.logoUrl,
          role: userTenant.role,
        };
      })
    );

    // Filter out null entries (tenants that might have been deleted)
    return tenants.filter((tenant): tenant is NonNullable<typeof tenant> => tenant !== null);
  },
});

/**
 * Join a tenant (requires an invite code, which is not yet implemented)
 */
export const joinTenant = mutation({
  args: {
    tenantId: v.id("tenants"),
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

    // Check if tenant exists
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", user._id).eq("tenantId", args.tenantId)
      )
      .unique();

    if (existingMembership) {
      // Already a member
      return false;
    }

    // Add user to tenant with "member" role
    await ctx.db.insert("userTenants", {
      userId: user._id,
      tenantId: args.tenantId,
      role: "member",
      joinedAt: Date.now(),
    });

    return true;
  },
});

/**
 * Get tenant details
 */
export const get = query({
  args: {
    tenantId: v.id("tenants"),
  },
  returns: v.union(
    v.object({
      _id: v.id("tenants"),
      name: v.string(),
      description: v.optional(v.string()),
      logoUrl: v.optional(v.string()),
      userRole: v.string(),
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

    // Check if user is a member of this tenant
    const membership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", user._id).eq("tenantId", args.tenantId)
      )
      .unique();

    if (!membership) {
      return null;
    }

    // Get tenant details
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      return null;
    }

    return {
      _id: tenant._id,
      name: tenant.name,
      description: tenant.description,
      logoUrl: tenant.logoUrl,
      userRole: membership.role,
    };
  },
});

/**
 * Remove a tenant and its associations
 */
export const removeTenant = mutation({
  args: {
    id: v.id("tenants"),
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

    // Check if the tenant exists
    const tenant = await ctx.db.get(args.id);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Check if user has admin role for this tenant
    const membership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", user._id).eq("tenantId", args.id)
      )
      .unique();

    if (!membership || membership.role !== "admin") {
      throw new Error("Not authorized to delete this tenant");
    }

    // Delete worksites associated with this tenant
    const worksites = await ctx.db
      .query("worksites")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.id))
      .collect();

    for (const worksite of worksites) {
      // Delete geofences associated with this worksite
      const geofences = await ctx.db
        .query("geofences")
        .withIndex("by_worksite", (q) => q.eq("worksiteId", worksite._id))
        .collect();

      for (const geofence of geofences) {
        await ctx.db.delete(geofence._id);
      }

      // Delete user-worksite relationships
      const userWorksites = await ctx.db
        .query("userWorksites")
        .withIndex("by_worksite", (q) => q.eq("worksiteId", worksite._id))
        .collect();

      for (const userWorksite of userWorksites) {
        await ctx.db.delete(userWorksite._id);
      }

      // Delete the worksite
      await ctx.db.delete(worksite._id);
    }

    // Delete user-tenant relationships
    const userTenants = await ctx.db
      .query("userTenants")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.id))
      .collect();

    for (const userTenant of userTenants) {
      await ctx.db.delete(userTenant._id);
    }

    // Delete the tenant
    await ctx.db.delete(args.id);

    return true;
  },
}); 