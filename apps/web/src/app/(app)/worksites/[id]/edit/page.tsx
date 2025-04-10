"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import Header from "@/components/Header";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Id } from "@packages/backend/convex/_generated/dataModel";

interface Worksite {
  _id: Id<"worksites">;
  name: string;
  tenantId: Id<"tenants">;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number;
}

export default function EditWorksite() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const worksite = useQuery(api.worksites.get, { 
    worksiteId: id as Id<"worksites"> 
  }) as Worksite | null | undefined;
  
  const updateWorksite = useMutation(api.worksites.update);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    radius: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with worksite data when it loads
  useEffect(() => {
    if (worksite) {
      setFormData({
        name: worksite.name,
        address: worksite.address,
        latitude: worksite.coordinates.latitude.toString(),
        longitude: worksite.coordinates.longitude.toString(),
        radius: worksite.radius.toString(),
      });
    }
  }, [worksite]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error("Name is required");
      }
      if (!formData.address.trim()) {
        throw new Error("Address is required");
      }
      
      const latitude = parseFloat(formData.latitude);
      const longitude = parseFloat(formData.longitude);
      const radius = parseInt(formData.radius);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error("Invalid coordinates");
      }
      
      if (isNaN(radius) || radius <= 0) {
        throw new Error("Radius must be a positive number");
      }

      // Update worksite
      await updateWorksite({
        worksiteId: id as Id<"worksites">,
        name: formData.name,
        address: formData.address,
        coordinates: {
          latitude,
          longitude,
        },
        radius,
      });

      // Redirect to worksite details on success
      router.push(`/worksites/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update worksite");
      setIsSubmitting(false);
    }
  };

  if (worksite === undefined) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex justify-center items-center">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-slate-200 h-10 w-10"></div>
            <div className="flex-1 space-y-6 py-1">
              <div className="h-2 bg-slate-200 rounded"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                  <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                </div>
                <div className="h-2 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (worksite === null) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6">
            <Link 
              href="/worksites" 
              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to worksites
            </Link>
          </div>
          
          <div className="bg-white shadow sm:rounded-lg p-6 text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Worksite not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The worksite you're trying to edit doesn't exist or you don't have access to it.
            </p>
            <div className="mt-6">
              <Link
                href="/worksites"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Go back to worksites
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link 
            href={`/worksites/${id}`} 
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to worksite details
          </Link>
        </div>
        
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Edit Worksite
            </h2>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                    Worksite Name*
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">
                    Address*
                  </label>
                  <div className="mt-2">
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="latitude" className="block text-sm font-medium leading-6 text-gray-900">
                      Latitude*
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="latitude"
                        id="latitude"
                        required
                        value={formData.latitude}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="longitude" className="block text-sm font-medium leading-6 text-gray-900">
                      Longitude*
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="longitude"
                        id="longitude"
                        required
                        value={formData.longitude}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="radius" className="block text-sm font-medium leading-6 text-gray-900">
                    Geofence Radius (meters)*
                  </label>
                  <div className="mt-2">
                    <input
                      type="number"
                      name="radius"
                      id="radius"
                      required
                      min="1"
                      value={formData.radius}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Define the circular geofence around the worksite coordinates.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <Link
                    href={`/worksites/${id}`}
                    className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
} 