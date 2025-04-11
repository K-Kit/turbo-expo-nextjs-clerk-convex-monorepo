import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/clerk-expo";

type Tenant = {
  _id: string;
  name: string;
  logoUrl?: string;
  role: string;
};

type TenantContextType = {
  currentTenantId: string | null;
  setCurrentTenantId: (id: string | null) => void;
  tenants: Tenant[];
  isLoading: boolean;
};

const TenantContext = createContext<TenantContextType>({
  currentTenantId: null,
  setCurrentTenantId: () => {},
  tenants: [],
  isLoading: true,
});

export const useTenant = () => useContext(TenantContext);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider = ({ children }: TenantProviderProps) => {
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const { isSignedIn } = useAuth();

  const tenants = useQuery(api.tenants.list, isSignedIn ? {} : "skip") || [];

  const isLoading = tenants === undefined;

  useEffect(() => {
    // Set the first tenant as default if not already set
    if (tenants && tenants.length > 0 && !currentTenantId) {
      setCurrentTenantId(tenants[0]._id);
    }
  }, [tenants, currentTenantId]);

  return (
    <TenantContext.Provider
      value={{
        currentTenantId,
        setCurrentTenantId,
        tenants,
        isLoading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};
