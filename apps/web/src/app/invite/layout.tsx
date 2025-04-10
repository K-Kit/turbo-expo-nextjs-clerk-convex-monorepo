import React from 'react';

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </main>
  );
} 