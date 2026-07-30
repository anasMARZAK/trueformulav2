import React from 'react';

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-5 border border-[#EAF2ED] shadow-sm animate-pulse space-y-4">
      <div className="w-full h-56 bg-gray-200 rounded-2xl" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="h-9 bg-gray-200 rounded-xl w-1/3" />
      </div>
    </div>
  );
}
