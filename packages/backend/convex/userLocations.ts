import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Record a user's location
 */
export const recordLocation = mutation({
  args: {
    tenantId: v.id("tenants"),
    coordinates: v.object({
      latitude: v.number(),
      longitude: v.number(),
      accuracy: v.optional(v.number()),
      altitude: v.optional(v.number()),
      speed: v.optional(v.number()),
      heading: v.optional(v.number()),
    }),
    isTracking: v.boolean(),
    deviceInfo: v.optional(v.string()),
    batteryLevel: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const timestamp = Date.now();

    // Record the location
    return await ctx.db.insert("userLocations", {
      userId,
      tenantId: args.tenantId,
      timestamp,
      coordinates: args.coordinates,
      isTracking: args.isTracking,
      deviceInfo: args.deviceInfo,
      batteryLevel: args.batteryLevel,
    });
  },
});

/**
 * Toggle a user's tracking status
 */
export const toggleTracking = mutation({
  args: {
    tenantId: v.id("tenants"),
    isTracking: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const timestamp = Date.now();

    // Record the tracking status change
    return await ctx.db.insert("userLocations", {
      userId,
      tenantId: args.tenantId,
      timestamp,
      coordinates: {
        latitude: 0,
        longitude: 0,
      },
      isTracking: args.isTracking,
    });
  },
});

/**
 * Get a user's tracking status
 */
export const getTrackingStatus = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;

    // Get the latest location entry for this user/tenant
    const locations = await ctx.db
      .query("userLocations")
      .withIndex("by_user_tenant", (q) => q.eq("userId", userId).eq("tenantId", args.tenantId))
      .order("desc")
      .take(1);

    if (locations.length === 0) {
      return { isTracking: false };
    }

    return { isTracking: locations[0].isTracking };
  },
});

/**
 * Get a user's location history for a time period
 */
export const getUserTrack = query({
  args: {
    userId: v.string(),
    tenantId: v.id("tenants"),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the location history for this user in the time range
    const locations = await ctx.db
      .query("userLocations")
      .withIndex("by_user_timestamp", (q) => 
        q.eq("userId", args.userId)
          .gte("timestamp", args.startTime)
          .lte("timestamp", args.endTime)
      )
      .filter((q) => q.eq(q.field("tenantId"), args.tenantId))
      .filter((q) => q.eq(q.field("isTracking"), true))
      .collect();

    return locations;
  },
});

/**
 * Get all user locations for a tenant at the current time
 */
export const getCurrentUserLocations = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get all tenant members
    const tenantUsers = await ctx.db
      .query("userTenants")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    
    const userIds = tenantUsers.map(tu => tu.userId);
    
    // Get the latest location for each user who is currently tracking
    const latestLocations = [];
    
    for (const userId of userIds) {
      const locations = await ctx.db
        .query("userLocations")
        .withIndex("by_user_tenant", (q) => q.eq("userId", userId).eq("tenantId", args.tenantId))
        .order("desc")
        .take(1);
      
      if (locations.length > 0 && locations[0].isTracking) {
        // Get user info
        const user = await ctx.db.get(userId);
        if (user) {
          latestLocations.push({
            ...locations[0],
            user: {
              name: user.name,
              email: user.email,
              profileImageUrl: user.profilePicture,
            },
          });
        }
      }
    }
    
    return latestLocations;
  },
}); 