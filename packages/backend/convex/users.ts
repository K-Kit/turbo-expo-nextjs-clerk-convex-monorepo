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

/**
 * Add a user to a tenant
 */
export const addUserToTenant = mutation({
  args: {
    email: v.string(),
    role: v.string(),
    tenantId: v.id("tenants"),
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

    // Check if tenant exists
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Check if current user has admin access to this tenant
    const membership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", currentUser._id).eq("tenantId", args.tenantId)
      )
      .unique();

    if (!membership || membership.role !== "admin") {
      throw new Error("Not authorized to add users to this tenant");
    }

    // Find the user to add by email
    const userToAdd = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    // If user doesn't exist, throw error - they need to be invited instead
    if (!userToAdd) {
      throw new Error("User not found with this email address. Please use the invite feature instead.");
    }

    // Check if user is already a member of this tenant
    const existingMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", userToAdd._id).eq("tenantId", args.tenantId)
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

    // Check if there's a pending invite for this user and accept it automatically
    const pendingInvite = await ctx.db
      .query("pendingInvites")
      .withIndex("by_email_and_tenant", (q) => 
        q.eq("email", args.email).eq("tenantId", args.tenantId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    
    if (pendingInvite) {
      // Update the invite status to accepted
      await ctx.db.patch(pendingInvite._id, {
        status: "accepted"
      });
    }

    // Add user to tenant with specified role
    await ctx.db.insert("userTenants", {
      userId: userToAdd._id,
      tenantId: args.tenantId,
      role: args.role,
      joinedAt: Date.now(),
    });

    return true;
  },
});

/**
 * Invite a user to a tenant
 */
export const inviteUserToTenant = mutation({
  args: {
    email: v.string(),
    role: v.string(),
    tenantId: v.id("tenants"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
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

    // Check if tenant exists
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Check if current user has admin access to this tenant
    const membership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", currentUser._id).eq("tenantId", args.tenantId)
      )
      .unique();

    if (!membership || membership.role !== "admin") {
      throw new Error("Not authorized to invite users to this tenant");
    }

    // Check if a user with this email already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      // If user exists, try to add them directly to the tenant
      try {
        // Check if user is already a member of this tenant
        const existingMembership = await ctx.db
          .query("userTenants")
          .withIndex("by_user_and_tenant", (q) => 
            q.eq("userId", existingUser._id).eq("tenantId", args.tenantId)
          )
          .unique();

        if (existingMembership) {
          // User is already a member, update role if needed
          if (existingMembership.role !== args.role) {
            await ctx.db.patch(existingMembership._id, {
              role: args.role,
            });
          }
          return {
            success: true,
            message: "User is already a member of this organization. Role updated if changed.",
          };
        }

        // Add user to tenant with specified role
        await ctx.db.insert("userTenants", {
          userId: existingUser._id,
          tenantId: args.tenantId,
          role: args.role,
          joinedAt: Date.now(),
        });

        return {
          success: true,
          message: "User was already registered and has been added to the organization.",
        };
      } catch (err) {
        throw new Error(`Failed to add existing user: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Check if there's already a pending invite for this email
    const existingInvite = await ctx.db
      .query("pendingInvites")
      .withIndex("by_email_and_tenant", (q) => 
        q.eq("email", args.email).eq("tenantId", args.tenantId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingInvite) {
      // Update the existing invite if role is different
      if (existingInvite.role !== args.role) {
        await ctx.db.patch(existingInvite._id, {
          role: args.role,
          invitedBy: currentUser._id,
          invitedAt: Date.now(),
        });
      }
      return {
        success: true,
        message: "Invitation already exists and has been updated.",
      };
    }

    // Generate a random invite code
    const inviteCode = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);

    // Create the invitation
    await ctx.db.insert("pendingInvites", {
      email: args.email,
      tenantId: args.tenantId,
      role: args.role,
      status: "pending",
      inviteCode,
      invitedBy: currentUser._id,
      invitedAt: Date.now(),
      // Set expiration to 7 days from now
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    // In a real application, you would send an email here with the invite link
    
    return {
      success: true,
      message: "Invitation sent successfully.",
    };
  },
});

/**
 * Remove a user from a tenant
 */
export const removeUserFromTenant = mutation({
  args: {
    userId: v.id("users"),
    tenantId: v.id("tenants"),
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

    // Check if tenant exists
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Check if current user has admin access to this tenant
    const membership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", currentUser._id).eq("tenantId", args.tenantId)
      )
      .unique();

    if (!membership || membership.role !== "admin") {
      throw new Error("Not authorized to remove users from this tenant");
    }

    // Ensure user isn't removing themselves
    if (args.userId === currentUser._id) {
      throw new Error("Cannot remove yourself from the tenant");
    }

    // Find the membership to remove
    const membershipToRemove = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", args.userId).eq("tenantId", args.tenantId)
      )
      .unique();

    if (!membershipToRemove) {
      return false; // User is not a member of this tenant
    }

    // Remove the user from all worksites in this tenant
    const worksites = await ctx.db
      .query("worksites")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    for (const worksite of worksites) {
      const userWorksite = await ctx.db
        .query("userWorksites")
        .withIndex("by_user_and_worksite", (q) => 
          q.eq("userId", args.userId).eq("worksiteId", worksite._id)
        )
        .unique();

      if (userWorksite) {
        await ctx.db.delete(userWorksite._id);
      }
    }

    // Remove user from tenant
    await ctx.db.delete(membershipToRemove._id);

    return true;
  },
});

/**
 * Update a user's role in a tenant
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    tenantId: v.id("tenants"),
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

    // Check if tenant exists
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Check if current user has admin access to this tenant
    const membership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", currentUser._id).eq("tenantId", args.tenantId)
      )
      .unique();

    if (!membership || membership.role !== "admin") {
      throw new Error("Not authorized to update user roles in this tenant");
    }

    // Ensure user isn't updating their own role
    if (args.userId === currentUser._id) {
      throw new Error("Cannot update your own role");
    }

    // Find the membership to update
    const membershipToUpdate = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", args.userId).eq("tenantId", args.tenantId)
      )
      .unique();

    if (!membershipToUpdate) {
      throw new Error("User is not a member of this tenant");
    }

    // Update role
    await ctx.db.patch(membershipToUpdate._id, {
      role: args.role,
    });

    return true;
  },
});

/**
 * List pending invites for a tenant
 */
export const listPendingInvites = query({
  args: {
    tenantId: v.id("tenants"),
  },
  returns: v.array(
    v.object({
      _id: v.id("pendingInvites"),
      email: v.string(),
      role: v.string(),
      status: v.string(),
      invitedAt: v.number(),
      invitedBy: v.object({
        _id: v.id("users"),
        name: v.string(),
        email: v.string(),
      }),
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

    // Check if user has access to this tenant
    const tenantMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", currentUser._id).eq("tenantId", args.tenantId)
      )
      .unique();

    if (!tenantMembership) {
      return [];
    }

    // Get all pending invites for this tenant
    const pendingInvites = await ctx.db
      .query("pendingInvites")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Get inviter details for each invite
    const invitesWithDetails = await Promise.all(
      pendingInvites.map(async (invite) => {
        const inviter = await ctx.db.get(invite.invitedBy);
        if (!inviter) {
          // Should never happen, but just in case
          return null;
        }

        return {
          _id: invite._id,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          invitedAt: invite.invitedAt,
          invitedBy: {
            _id: inviter._id,
            name: inviter.name,
            email: inviter.email,
          },
        };
      })
    );

    // Filter out any null entries (just in case)
    return invitesWithDetails.filter((invite): invite is NonNullable<typeof invite> => 
      invite !== null
    );
  },
});

/**
 * Cancel a pending invite
 */
export const cancelInvite = mutation({
  args: {
    inviteId: v.id("pendingInvites"),
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

    // Get the invite
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invitation not found");
    }

    // Check if current user has admin access to this tenant
    const membership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", currentUser._id).eq("tenantId", invite.tenantId as Id<"tenants">)
      )
      .unique();

    if (!membership || membership.role !== "admin") {
      throw new Error("Not authorized to cancel invitations for this tenant");
    }

    // Update invite status to canceled
    await ctx.db.patch(args.inviteId, {
      status: "canceled",
    });

    return true;
  },
}); 