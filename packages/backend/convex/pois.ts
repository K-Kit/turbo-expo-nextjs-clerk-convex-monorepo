import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { checkUserInTenant } from "./utils";

/**
 * Get all POIs for a tenant
 */
export const getPOIs = query({
  args: {
    tenantId: v.id("tenants"),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, type, status } = args;
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, tenantId);
    
    let poiQuery = ctx.db
      .query("pois")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId));
    
    if (type) {
      poiQuery = poiQuery.filter((q) => q.eq(q.field("type"), type));
    }
    
    if (status) {
      poiQuery = poiQuery.filter((q) => q.eq(q.field("status"), status));
    }
    
    return poiQuery.collect();
  },
});

/**
 * Get a single POI by ID
 */
export const getPOI = query({
  args: {
    id: v.id("pois"),
  },
  handler: async (ctx, args) => {
    const poi = await ctx.db.get(args.id);
    if (!poi) {
      throw new Error("POI not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, poi.tenantId);
    
    return poi;
  },
});

/**
 * Create a new POI
 */
export const createPOI = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    type: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const { tenantId, name, description, location, type, status } = args;
    
    // Check if user is in tenant
    const user = await checkUserInTenant(ctx, tenantId);
    
    const now = Date.now();
    
    return ctx.db.insert("pois", {
      name,
      description,
      location,
      type,
      status,
      tenantId,
      createdBy: user.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing POI
 */
export const updatePOI = mutation({
  args: {
    id: v.id("pois"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const poi = await ctx.db.get(id);
    if (!poi) {
      throw new Error("POI not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, poi.tenantId);
    
    return ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a POI
 */
export const deletePOI = mutation({
  args: {
    id: v.id("pois"),
  },
  handler: async (ctx, args) => {
    const poi = await ctx.db.get(args.id);
    if (!poi) {
      throw new Error("POI not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, poi.tenantId);
    
    return ctx.db.delete(args.id);
  },
}); 