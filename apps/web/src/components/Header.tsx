"use client";

import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Logo from "./common/Logo";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { UserNav } from "./common/UserNav";
import { usePathname } from "next/navigation";

type NavigationItem = {
  name: string;
  href: string;
  current: boolean;
};

const publicNavigation: NavigationItem[] = [
  { name: "Features", href: "#features", current: true },
  { name: "Pricing", href: "#pricing", current: false },
  { name: "About", href: "#about", current: false },
];

const privateNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", current: true },
  { name: "Tenants", href: "/tenants", current: false },
  { name: "Worksites", href: "/worksites", current: false },
];

export default function Header() {
  const { user } = useUser();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const navigation = user ? privateNavigation : publicNavigation;

  return (
    <Disclosure as="nav" className="bg-white shadow-sm">
      {({ open }) => (
        <>
          <div className="flex items-center h-16 sm:h-20">
            <div className="container px-2 sm:px-4 mx-auto">
              <div className="relative flex h-16 items-center justify-between">
                <div className="flex sm:hidden flex-shrink-0 items-center">
                  <Logo isMobile={true} />
                </div>
                <div className="sm:flex hidden flex-shrink-0 items-center">
                  <Link href="/" className="flex items-center space-x-2">
                    <Logo />
                  </Link>
                </div>

                <div className="flex flex-1 items-center justify-center">
                  <div className="hidden sm:ml-6 sm:block">
                    <ul className="flex space-x-8">
                      {navigation.map((item) => {
                        const isActive =
                          pathname === item.href ||
                          (item.href !== "/" && pathname.startsWith(item.href));

                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className={`text-center text-base font-medium px-3 py-2 rounded-md ${
                                isActive
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                              aria-current={isActive ? "page" : undefined}
                            >
                              {item.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {user ? (
                  <div className="hidden sm:flex absolute inset-y-0 right-0 gap-6 items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                    <Link href="/profile">
                      <button
                        type="button"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2 text-sm font-medium"
                      >
                        Profile
                      </button>
                    </Link>
                    <UserNav
                      image={user?.imageUrl}
                      name={user?.fullName!}
                      email={user?.primaryEmailAddress?.emailAddress!}
                    />
                  </div>
                ) : (
                  <div className="hidden sm:flex absolute inset-y-0 right-0 gap-4 items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                    <Link
                      href="/sign-in"
                      className="text-gray-700 hover:text-gray-900 font-medium"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/sign-up"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2 text-sm font-medium"
                    >
                      Get Started
                    </Link>
                  </div>
                )}

                <div className="block sm:hidden">
                  {/* Mobile menu button*/}
                  <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Disclosure.Button
                    key={item.name}
                    as={Link}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? "bg-indigo-100 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.name}
                  </Disclosure.Button>
                );
              })}

              {user ? (
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="flex items-center px-3">
                    <div className="flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.imageUrl}
                        alt="Profile"
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">
                        {user.fullName}
                      </div>
                      <div className="text-sm font-medium text-gray-500">
                        {user.primaryEmailAddress?.emailAddress}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 px-2">
                    <Disclosure.Button
                      as={Link}
                      href="/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      Your Profile
                    </Disclosure.Button>
                    <Disclosure.Button
                      as="button"
                      onClick={() => (window.location.href = "/sign-out")}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      Sign out
                    </Disclosure.Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href="/sign-in"
                    className="px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 block"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="bg-indigo-600 text-white px-3 py-2 rounded-md text-base font-medium block text-center"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
