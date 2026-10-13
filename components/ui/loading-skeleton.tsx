type LoadingSkeletonProps = {
  className?: string;
};

export function LoadingSkeleton({ className = "" }: LoadingSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`bg-cream animate-pulse rounded-sm ${className}`}
    />
  );
}
