import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../../../packages/backend/convex/_generated/api';
import { Id } from '@/../../../packages/backend/convex/_generated/dataModel';

export function useTenantId(): Id<"tenants"> | null {
  // In a real app, this would be stored in a context or state management
  // For simplicity, we'll assume there's one tenant per user for now
  // and we'll get the first tenant from the user's tenant list
  
  const [tenantId, setTenantId] = useState<Id<"tenants"> | null>(null);
  
  // Get user's tenants
  const userTenants = useQuery(api.tenants.list);
  
  useEffect(() => {
    if (userTenants && userTenants.length > 0) {
      setTenantId(userTenants[0]._id);
    }
  }, [userTenants]);
  
  return tenantId;
} 