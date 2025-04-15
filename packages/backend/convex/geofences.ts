import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Create a new geofence for a worksite
 */
export const create = mutation({
  args: {
    worksiteId: v.id("worksites"),
    type: v.string(), // "polygon", "circle", etc.
    // For polygons
    coordinates: v.optional(v.array(v.array(v.number()))),
    // For circles
    center: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    radius: v.optional(v.number()),
    // Basic info
    name: v.string(),
    description: v.optional(v.string()),
    // Style options
    strokeColor: v.optional(v.string()),
    strokeWidth: v.optional(v.number()),
    fillColor: v.optional(v.string()),
  },
  returns: v.id("geofences"),
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

    // Get worksite details
    const worksite = await ctx.db.get(args.worksiteId);
    if (!worksite) {
      throw new Error("Worksite not found");
    }

    // Check if user is an admin of this worksite
    const membership = await ctx.db
      .query("userWorksites")
      .withIndex("by_user_and_worksite", (q) => 
        q.eq("userId", user._id).eq("worksiteId", args.worksiteId)
      )
      .unique();

    if (!membership || membership.role !== "admin") {
      throw new Error("Insufficient permissions");
    }

    // Validate the shape data based on type
    if (args.type === "polygon") {
      if (!args.coordinates || args.coordinates.length < 3) {
        throw new Error("Polygon geofence must have at least 3 points");
      }
    } else if (args.type === "circle") {
      if (!args.center || !args.radius) {
        throw new Error("Circle geofence requires center and radius");
      }
      if (args.radius <= 0) {
        throw new Error("Radius must be greater than 0");
      }
    } else {
      throw new Error(`Unsupported geofence type: ${args.type}`);
    }

    // Create the geofence
    const geofenceId = await ctx.db.insert("geofences", {
      worksiteId: args.worksiteId,
      type: args.type,
      coordinates: args.coordinates || [],
      center: args.center,
      radius: args.radius,
      name: args.name,
      description: args.description,
      strokeColor: args.strokeColor,
      strokeWidth: args.strokeWidth,
      fillColor: args.fillColor,
      isActive: true,
    });

    return geofenceId;
  },
});

/**
 * List all geofences for a worksite
 */
export const listByWorksite = query({
  args: {
    worksiteId: v.id("worksites"),
  },
  returns: v.array(
    v.object({
      _id: v.id("geofences"),
      type: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      coordinates: v.array(v.array(v.number())),
      center: v.optional(v.object({
        latitude: v.number(),
        longitude: v.number(),
      })),
      radius: v.optional(v.number()),
      strokeColor: v.optional(v.string()),
      strokeWidth: v.optional(v.number()),
      fillColor: v.optional(v.string()),
      isActive: v.boolean(),
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

    // Check if user has access to the worksite
    const worksite = await ctx.db.get(args.worksiteId);
    if (!worksite) {
      return [];
    }

    // Check if user is a member of the tenant
    const tenantMembership = await ctx.db
      .query("userTenants")
      .withIndex("by_user_and_tenant", (q) => 
        q.eq("userId", user._id).eq("tenantId", worksite.tenantId)
      )
      .unique();

    if (!tenantMembership) {
      return [];
    }

    // Get all geofences for this worksite
    const geofences = await ctx.db
      .query("geofences")
      .withIndex("by_worksite", (q) => q.eq("worksiteId", args.worksiteId))
      .collect();

    return geofences.map((geofence) => ({
      _id: geofence._id,
      type: geofence.type || "polygon", // Default to polygon for backward compatibility
      name: geofence.name,
      description: geofence.description,
      coordinates: geofence.coordinates,
      center: geofence.center,
      radius: geofence.radius,
      strokeColor: geofence.strokeColor,
      strokeWidth: geofence.strokeWidth,
      fillColor: geofence.fillColor,
      isActive: geofence.isActive,
    }));
  },
});

/**
 * Check if a point is inside a polygon (Ray Casting algorithm)
 */
function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const x = point[0];
  const y = point[1];
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    
    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Record a check-in at the current location
 */
export const checkIn = mutation({
  args: {
    worksiteId: v.id("worksites"),
    coordinates: v.array(v.number()),
    type: v.string(),
  },
  returns: v.object({
    isWithinGeofence: v.boolean(),
    geofenceName: v.optional(v.string()),
    checkInId: v.id("checkIns"),
  }),
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

    // Check if user has access to the worksite
    const worksite = await ctx.db.get(args.worksiteId);
    if (!worksite) {
      throw new Error("Worksite not found");
    }

    // Get all active geofences for this worksite
    const geofences = await ctx.db
      .query("geofences")
      .withIndex("by_worksite", (q) => q.eq("worksiteId", args.worksiteId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Check if the point is within any geofence
    let isWithinGeofence = false;
    let matchedGeofence = null;

    for (const geofence of geofences) {
      if (isPointInPolygon([args.coordinates[0], args.coordinates[1]], geofence.coordinates)) {
        isWithinGeofence = true;
        matchedGeofence = geofence;
        break;
      }
    }

    // Record the check-in
    const checkInId = await ctx.db.insert("checkIns", {
      userId: user._id,
      worksiteId: args.worksiteId,
      geofenceId: matchedGeofence?._id ?? geofences[0]?._id ?? null as any, // Use a default if none matched
      timestamp: Date.now(),
      coordinates: args.coordinates,
      type: args.type,
      isWithinGeofence,
    });

    return {
      isWithinGeofence,
      geofenceName: matchedGeofence?.name,
      checkInId,
    };
  },
});

/**
 * Get check-in history for a user and worksite
 */
export const getCheckInHistory = query({
  args: {
    worksiteId: v.id("worksites"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("checkIns"),
      timestamp: v.number(),
      coordinates: v.array(v.number()),
      type: v.string(),
      isWithinGeofence: v.boolean(),
      geofenceName: v.optional(v.string()),
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

    // Get user check-ins for this worksite
    const checkIns = await ctx.db
      .query("checkIns")
      .withIndex("by_user_and_time", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("worksiteId"), args.worksiteId))
      .order("desc")
      .take(args.limit ?? 50);

    // Fetch geofence names
    const geofenceIds = [...new Set(checkIns.map(checkIn => checkIn.geofenceId))];
    const geofenceMap = new Map();

    for (const geofenceId of geofenceIds) {
      const geofence = await ctx.db.get(geofenceId);
      if (geofence) {
        geofenceMap.set(geofenceId.toString(), geofence.name);
      }
    }

    return checkIns.map(checkIn => ({
      _id: checkIn._id,
      timestamp: checkIn.timestamp,
      coordinates: checkIn.coordinates,
      type: checkIn.type,
      isWithinGeofence: checkIn.isWithinGeofence,
      geofenceName: geofenceMap.get(checkIn.geofenceId.toString()),
    }));
  },
});

/**
 * Get check-in data for all users in a worksite (admin only)
 */
export const getWorksiteCheckIns = query({
  args: {
    worksiteId: v.id("worksites"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("checkIns"),
      userId: v.id("users"),
      userName: v.string(),
      timestamp: v.number(),
      type: v.string(),
      isWithinGeofence: v.boolean(),
      geofenceName: v.optional(v.string()),
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

    // Check if user is an admin of this worksite
    const membership = await ctx.db
      .query("userWorksites")
      .withIndex("by_user_and_worksite", (q) => 
        q.eq("userId", user._id).eq("worksiteId", args.worksiteId)
      )
      .unique();

    if (!membership || (membership.role !== "admin" && membership.role !== "supervisor")) {
      return [];
    }

    // Get all check-ins for this worksite
    const checkIns = await ctx.db
      .query("checkIns")
      .withIndex("by_worksite_and_time", (q) => q.eq("worksiteId", args.worksiteId))
      .order("desc")
      .take(args.limit ?? 50);

    // Fetch geofence names
    const geofenceIds = [...new Set(checkIns.map(checkIn => checkIn.geofenceId))];
    const geofenceMap = new Map();

    for (const geofenceId of geofenceIds) {
      const geofence = await ctx.db.get(geofenceId);
      if (geofence) {
        geofenceMap.set(geofenceId.toString(), geofence.name);
      }
    }

    // Fetch user names
    const userIds = [...new Set(checkIns.map(checkIn => checkIn.userId))];
    const userMap = new Map();

    for (const userId of userIds) {
      const userRecord = await ctx.db.get(userId);
      if (userRecord) {
        userMap.set(userId.toString(), userRecord.name);
      }
    }

    return checkIns.map(checkIn => ({
      _id: checkIn._id,
      userId: checkIn.userId,
      userName: userMap.get(checkIn.userId.toString()) || "Unknown User",
      timestamp: checkIn.timestamp,
      type: checkIn.type,
      isWithinGeofence: checkIn.isWithinGeofence,
      geofenceName: geofenceMap.get(checkIn.geofenceId.toString()),
    }));
  },
}); 