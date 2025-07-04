/**
 * Custom layout for contract creation - bypasses the citizen dashboard layout
 * Removes any background layout as requested
 */

'use client';

export default function ContractCreationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen">
      {children}
    </div>
  );
}
