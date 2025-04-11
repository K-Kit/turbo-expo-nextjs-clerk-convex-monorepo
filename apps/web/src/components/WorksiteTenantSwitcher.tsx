"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../../../packages/backend/convex/_generated/api";
import { currentTenantIdAtom, currentWorksiteIdAtom } from "@/lib/atoms";
import { useAtom } from "jotai";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Id } from "@/../../../packages/backend/convex/_generated/dataModel";

export function WorksiteTenantSwitcher() {
  const [tenantId, setTenantId] = useAtom(currentTenantIdAtom);
  const [worksiteId, setWorksiteId] = useAtom(currentWorksiteIdAtom);
  
  const [tenantOpen, setTenantOpen] = useState(false);
  const [worksiteOpen, setWorksiteOpen] = useState(false);
  
  // Get user's tenants
  const tenants = useQuery(api.tenants.list);
  
  // Get worksites for the current tenant
  const worksites = useQuery(
    api.worksites.listByTenant,
    tenantId ? { tenantId } : "skip"
  );
  
  // Get current tenant and worksite names
  const currentTenant = tenants?.find(t => t._id === tenantId);
  const currentWorksite = worksites?.find(w => w._id === worksiteId);
  
  // If we have tenants but no selected tenant, select the first one
  useEffect(() => {
    if (tenants && tenants.length > 0 && !tenantId) {
      setTenantId(tenants[0]._id);
    }
  }, [tenants, tenantId, setTenantId]);
  
  return (
    <div className="flex flex-col space-y-4 px-4 py-2">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none text-muted-foreground">
          Current Tenant
        </h4>
        <Popover open={tenantOpen} onOpenChange={setTenantOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={tenantOpen}
              className="w-full justify-between"
            >
              {currentTenant?.name || "Select tenant..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search tenant..." />
              <CommandEmpty>No tenant found.</CommandEmpty>
              <CommandGroup>
                {tenants?.map((tenant) => (
                  <CommandItem
                    key={tenant._id}
                    onSelect={() => {
                      setTenantId(tenant._id);
                      setWorksiteId(null); // Reset worksite when tenant changes
                      setTenantOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        tenantId === tenant._id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {tenant.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {tenantId && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium leading-none text-muted-foreground">
            Current Worksite
          </h4>
          <Popover open={worksiteOpen} onOpenChange={setWorksiteOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={worksiteOpen}
                className="w-full justify-between"
              >
                {currentWorksite?.name || "Select worksite..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search worksite..." />
                <CommandEmpty>No worksite found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setWorksiteId(null);
                      setWorksiteOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        worksiteId === null ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Worksites
                  </CommandItem>
                  {worksites?.map((worksite) => (
                    <CommandItem
                      key={worksite._id}
                      onSelect={() => {
                        setWorksiteId(worksite._id);
                        setWorksiteOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          worksiteId === worksite._id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {worksite.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
} 