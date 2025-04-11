import { Id } from "@packages/backend/convex/_generated/dataModel";
import { atom, useAtom, useAtomValue } from "jotai";
import { api } from "@/../../../packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";

export const currentTenantIdAtom = atom<Id<"tenants"> | null>(null);
export const currentWorksiteIdAtom = atom<Id<"worksites"> | null>(null);

export const mapCenterAtom = atom<{ lat: number; lng: number } | null>({
  lat: 37.774929,
  lng: -122.419416,
});
export const mapZoomAtom = atom<number>(12);

export const mapViewSettingsAtom = atom<{
  showPOIs: boolean;
  showAssets: boolean;
  showIncidents: boolean;
  showWorksite: boolean;
}>({
  showPOIs: true,
  showAssets: true,
  showIncidents: true,
  showWorksite: true,
});

export const useWorksites = (forceTenantId?: Id<"tenants">) => {
  const _tenantId = useAtomValue(currentTenantIdAtom);
  const tenantId = forceTenantId || _tenantId;
  const worksites = useQuery(
    api.worksites.listByTenant,
    tenantId ? { tenantId } : "skip",
  );
  return worksites || [];
};
export const useWorksiteId = () => {
  const [worksiteId, setWorksiteId] = useAtom(currentWorksiteIdAtom);
  return { worksiteId, setWorksiteId };
};

export const useWorksite = () => {
  const { worksiteId } = useWorksiteId();
  const worksite = useQuery(
    api.worksites.get,
    worksiteId ? { worksiteId } : "skip",
  );
  return worksite;
};
