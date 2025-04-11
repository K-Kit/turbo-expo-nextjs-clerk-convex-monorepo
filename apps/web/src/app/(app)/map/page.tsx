"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapView } from "@/components/map/MapView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ShieldCheck, Truck, Wrench } from 'lucide-react';

export default function MapPage() {
  const router = useRouter();
  const [showPOIs, setShowPOIs] = useState(true);
  const [showAssets, setShowAssets] = useState(true);
  
  // POI filters
  const [showHazards, setShowHazards] = useState(true);
  const [showSafetyEquipment, setShowSafetyEquipment] = useState(true);
  
  // Asset filters
  const [showVehicles, setShowVehicles] = useState(true);
  const [showEquipment, setShowEquipment] = useState(true);
  
  // Status filters
  const [showActive, setShowActive] = useState(true);
  const [showInactive, setShowInactive] = useState(true);
  const [showOperational, setShowOperational] = useState(true);
  const [showMaintenance, setShowMaintenance] = useState(true);
  
  // Handle clicking on an item in the map
  const handleItemClick = (item) => {
    if (item.type === "hazard" || item.type === "safety_equipment") {
      router.push(`/pois/${item._id}`);
    } else if (item.type === "vehicle" || item.type === "equipment") {
      router.push(`/assets/${item._id}`);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Interactive Map</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* POI Filters */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="show-pois" 
                    checked={showPOIs}
                    onCheckedChange={setShowPOIs}
                  />
                  <Label htmlFor="show-pois" className="font-medium">
                    Points of Interest
                  </Label>
                </div>
                
                {showPOIs && (
                  <div className="space-y-2 ml-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-hazards" 
                        checked={showHazards}
                        onCheckedChange={setShowHazards}
                      />
                      <Label htmlFor="show-hazards" className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        Hazards
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-safety-equipment" 
                        checked={showSafetyEquipment}
                        onCheckedChange={setShowSafetyEquipment}
                      />
                      <Label htmlFor="show-safety-equipment" className="flex items-center">
                        <ShieldCheck className="h-4 w-4 mr-2 text-green-500" />
                        Safety Equipment
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-active-pois" 
                        checked={showActive}
                        onCheckedChange={setShowActive}
                      />
                      <Label htmlFor="show-active-pois">Active</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-inactive-pois" 
                        checked={showInactive}
                        onCheckedChange={setShowInactive}
                      />
                      <Label htmlFor="show-inactive-pois">Inactive</Label>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Asset Filters */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="show-assets" 
                    checked={showAssets}
                    onCheckedChange={setShowAssets}
                  />
                  <Label htmlFor="show-assets" className="font-medium">
                    Assets
                  </Label>
                </div>
                
                {showAssets && (
                  <div className="space-y-2 ml-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-vehicles" 
                        checked={showVehicles}
                        onCheckedChange={setShowVehicles}
                      />
                      <Label htmlFor="show-vehicles" className="flex items-center">
                        <Truck className="h-4 w-4 mr-2 text-blue-500" />
                        Vehicles
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-equipment" 
                        checked={showEquipment}
                        onCheckedChange={setShowEquipment}
                      />
                      <Label htmlFor="show-equipment" className="flex items-center">
                        <Wrench className="h-4 w-4 mr-2 text-amber-500" />
                        Equipment
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-operational-assets" 
                        checked={showOperational}
                        onCheckedChange={setShowOperational}
                      />
                      <Label htmlFor="show-operational-assets">Operational</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-maintenance-assets" 
                        checked={showMaintenance}
                        onCheckedChange={setShowMaintenance}
                      />
                      <Label htmlFor="show-maintenance-assets">Maintenance</Label>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setShowPOIs(true);
                    setShowAssets(true);
                    setShowHazards(true);
                    setShowSafetyEquipment(true);
                    setShowVehicles(true);
                    setShowEquipment(true);
                    setShowActive(true);
                    setShowInactive(true);
                    setShowOperational(true);
                    setShowMaintenance(true);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <MapView 
            showPOIs={showPOIs} 
            showAssets={showAssets}
            poiFilter={{
              type: showHazards && showSafetyEquipment ? undefined :
                   showHazards ? "hazard" :
                   showSafetyEquipment ? "safety_equipment" : undefined,
              status: showActive && showInactive ? undefined :
                    showActive ? "active" :
                    showInactive ? "inactive" : undefined,
            }}
            assetFilter={{
              type: showVehicles && showEquipment ? undefined :
                   showVehicles ? "vehicle" :
                   showEquipment ? "equipment" : undefined,
              status: showOperational && showMaintenance ? undefined :
                    showOperational ? "operational" :
                    showMaintenance ? "maintenance" : undefined,
            }}
            height={700}
            onItemClick={handleItemClick}
          />
        </div>
      </div>
    </div>
  );
} 