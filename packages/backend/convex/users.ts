import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Register or retrieve a user by Clerk ID
 */
export const getOrCreate = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    profilePicture: v.optional(v.string()),
  },
  returns: v.object({
    userId: v.id("users"),
    isNewUser: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update user info if needed
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        profilePicture: args.profilePicture,
      });

      return {
        userId: existingUser._id,
        isNewUser: false,
      };
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      clerkId: args.clerkId,
      profilePicture: args.profilePicture,
    });

    return {
      userId,
      isNewUser: true,
    };
  },
});

/**
 * Get the current user
 */
export const me = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      profilePicture: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
    };
  },
});

/**
 * Get user by ID
 */
export const get = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      profilePicture: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
    };
  },
});

/**
 * Search users by name or email
 */
export const search = query({
  args: {
    query: v.string(),
    tenantId: v.optional(v.id("tenants")),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      profilePicture: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    // Get the current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Find current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) {
      return [];
    }

    // If tenantId is provided, only search users within that tenant
    if (args.tenantId) {
      const tenantId = args.tenantId;
      
      // Check if current user belongs to the tenant
      const tenantMembership = await ctx.db
        .query("userTenants")
        .withIndex("by_user_and_tenant", (q) => 
          q.eq("userId", currentUser._id).eq("tenantId", tenantId)
        )
        .unique();

      if (!tenantMembership) {
        return [];
      }

      // Get all users in the tenant
      const tenantUsers = await ctx.db
        .query("userTenants")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect();

      const userIds = tenantUsers.map(tu => tu.userId);
      
      // Fetch user details
      const users = await Promise.all(
        userIds.map(async (userId) => {
          const user = await ctx.db.get(userId);
          return user;
        })
      );
      
      // Filter users by search query
      const searchTerm = args.query.toLowerCase();
      const filteredUsers = users
        .filter(user => 
          user && 
          (user.name.toLowerCase().includes(searchTerm) || 
           user.email.toLowerCase().includes(searchTerm))
        )
        .slice(0, args.limit ?? 10);
      
      return filteredUsers.map(user => ({
        _id: user!._id,
        name: user!.name,
        email: user!.email,
        profilePicture: user!.profilePicture,
      }));
    }
    
    // Generic search across all users (not implemented efficiently - should add a search index)
    // In a real implementation, you'd want a better way to search users
    const allUsers = await ctx.db.query("users").collect();
    
    const searchTerm = args.query.toLowerCase();
    const filteredUsers = allUsers
      .filter(user => 
        user.name.toLowerCase().includes(searchTerm) || 
        user.email.toLowerCase().includes(searchTerm)
      )
      .slice(0, args.limit ?? 10);
    
    return filteredUsers.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
    }));
  },
});

/**
 * List users within a tenant
 */
export const listByTenant = query({
  args: {
    tenantId: v.id("tenants"),
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

    // Find current user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) {
      return [];
    }

    // Check if current user belongs to the tenant
    const currentUserMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", currentUser._id).eq("tenantId", args.tenantId)
      )
      .unique();

    if (!currentUserMembership) {
      return [];
    }

    // Get all users in the tenant
    const tenantUsers = await ctx.db
      .query("userTenants")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    // Fetch user details
    const users = await Promise.all(
      tenantUsers.map(async (tenantUser) => {
        const user = await ctx.db.get(tenantUser.userId);
        if (!user) return null;
        
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          role: tenantUser.role,
        };
      })
    );

    // Filter out null entries
    return users.filter((user): user is NonNullable<typeof user> => user !== null);
  },
}); 