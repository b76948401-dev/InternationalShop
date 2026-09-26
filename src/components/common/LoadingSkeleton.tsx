import React from 'react';

export function ProductSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs flex flex-col animate-pulse"
        >
          <div className="w-full aspect-square bg-neutral-200 rounded-xl mb-4" />
          <div className="h-3 w-1/3 bg-neutral-200 rounded-full mb-2" />
          <div className="h-4 w-5/6 bg-neutral-200 rounded-full mb-2" />
          <div className="h-4 w-3/5 bg-neutral-200 rounded-full mb-4" />
          <div className="mt-auto pt-3 border-t border-neutral-100 flex items-center justify-between">
            <div className="h-5 w-24 bg-neutral-200 rounded-md" />
            <div className="h-8 w-20 bg-neutral-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="w-full aspect-4/3 bg-neutral-200 rounded-2xl" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-neutral-200 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="h-4 w-28 bg-neutral-200 rounded-full" />
          <div className="h-8 w-full bg-neutral-200 rounded-lg" />
          <div className="h-6 w-1/3 bg-neutral-200 rounded-md" />
          <div className="h-10 w-44 bg-neutral-200 rounded-lg" />
          <div className="h-28 w-full bg-neutral-200 rounded-xl" />
          <div className="h-12 w-full bg-neutral-200 rounded-xl mt-4" />
        </div>
      </div>
    </div>
  );
}
