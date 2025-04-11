import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { checkUserInTenant } from "./utils";

/**
 * Get all assets for a tenant
 */
export const getAssets = query({
  args: {
    tenantId: v.id("tenants"),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId, type, status } = args;
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, tenantId);
    
    let assetQuery = ctx.db
      .query("assets")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId));
    
    if (type) {
      assetQuery = assetQuery.filter((q) => q.eq(q.field("type"), type));
    }
    
    if (status) {
      assetQuery = assetQuery.filter((q) => q.eq(q.field("status"), status));
    }
    
    return assetQuery.collect();
  },
});

/**
 * Get a single asset by ID
 */
export const getAsset = query({
  args: {
    id: v.id("assets"),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (!asset) {
      throw new Error("Asset not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, asset.tenantId);
    
    return asset;
  },
});

/**
 * Get asset history
 */
export const getAssetHistory = query({
  args: {
    assetId: v.id("assets"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { assetId, limit = 100 } = args;
    
    const asset = await ctx.db.get(assetId);
    if (!asset) {
      throw new Error("Asset not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, asset.tenantId);
    
    return ctx.db
      .query("assetHistory")
      .withIndex("by_asset_time", (q) => q.eq("assetId", assetId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Create a new asset
 */
export const createAsset = mutation({
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
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { tenantId, name, description, location, type, status, assignedTo } = args;
    
    // Check if user is in tenant
    const user = await checkUserInTenant(ctx, tenantId);
    
    const now = Date.now();
    
    const assetId = await ctx.db.insert("assets", {
      name,
      description,
      location,
      type,
      status,
      tenantId,
      assignedTo,
      lastUpdated: now,
      createdBy: user.userId,
      createdAt: now,
      updatedAt: now,
    });
    
    // Record initial history entry
    await ctx.db.insert("assetHistory", {
      assetId,
      location,
      status,
      timestamp: now,
      updatedBy: user.userId,
    });
    
    return assetId;
  },
});

/**
 * Update an existing asset
 */
export const updateAsset = mutation({
  args: {
    id: v.id("assets"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
    type: v.optional(v.string()),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    const asset = await ctx.db.get(id);
    if (!asset) {
      throw new Error("Asset not found");
    }
    
    // Check if user is in tenant
    const user = await checkUserInTenant(ctx, asset.tenantId);
    
    const now = Date.now();
    
    // Update the asset
    await ctx.db.patch(id, {
      ...updates,
      lastUpdated: now,
      updatedAt: now,
    });
    
    // Add history entry if location or status changed
    if (updates.location || updates.status) {
      await ctx.db.insert("assetHistory", {
        assetId: id,
        location: updates.location || asset.location,
        status: updates.status || asset.status,
        timestamp: now,
        updatedBy: user.userId,
      });
    }
    
    return id;
  },
});

/**
 * Delete an asset
 */
export const deleteAsset = mutation({
  args: {
    id: v.id("assets"),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.id);
    if (!asset) {
      throw new Error("Asset not found");
    }
    
    // Check if user is in tenant
    await checkUserInTenant(ctx, asset.tenantId);
    
    // Get all history entries
    const history = await ctx.db
      .query("assetHistory")
      .withIndex("by_asset", (q) => q.eq("assetId", args.id))
      .collect();
    
    // Delete all history entries
    for (const entry of history) {
      await ctx.db.delete(entry._id);
    }
    
    // Delete the asset
    return ctx.db.delete(args.id);
  },
}); 