import { Skeleton } from "@/components/ui/skeleton";

/**
 * Placeholder shown while categories are being fetched, mirroring the
 * real grid's responsive column counts so there's no layout jump once
 * the actual categories arrive.
 */
export default function CategoryGridSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8"
      aria-hidden="true"
    >
      {Array.from({ length: 15 }, (_, index) => (
        <Skeleton key={index} className="h-[44px] rounded-lg" />
      ))}
    </div>
  );
}
