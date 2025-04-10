/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as geofences from "../geofences.js";
import type * as notes from "../notes.js";
import type * as openai from "../openai.js";
import type * as seed from "../seed.js";
import type * as tenants from "../tenants.js";
import type * as users from "../users.js";
import type * as utils_auth from "../utils/auth.js";
import type * as utils from "../utils.js";
import type * as worksites from "../worksites.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  geofences: typeof geofences;
  notes: typeof notes;
  openai: typeof openai;
  seed: typeof seed;
  tenants: typeof tenants;
  users: typeof users;
  "utils/auth": typeof utils_auth;
  utils: typeof utils;
  worksites: typeof worksites;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
