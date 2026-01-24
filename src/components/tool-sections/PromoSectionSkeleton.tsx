import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface FeatureSkeletonProps {
  count?: number;
}

export function FeatureSkeleton({ count = 6 }: FeatureSkeletonProps) {
  return (
    <div className="w-full">
      <Skeleton className="h-8 w-48 mx-auto mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[...Array(count)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-5 md:p-6 rounded-xl bg-card border border-border/50"
          >
            <Skeleton className="w-12 h-12 rounded-xl mb-4" />
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6 mt-1" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface SubjectSkeletonProps {
  count?: number;
}

export function SubjectSkeleton({ count = 12 }: SubjectSkeletonProps) {
  return (
    <div className="w-full">
      <Skeleton className="h-8 w-56 mx-auto mb-8" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
        {[...Array(count)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className="flex flex-col items-center justify-center p-3 md:p-4 rounded-xl bg-card border border-border/50"
          >
            <Skeleton className="w-8 h-8 rounded-full mb-2" />
            <Skeleton className="h-3 w-16" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface TrendingSkeletonProps {
  count?: number;
}

export function TrendingSkeleton({ count = 8 }: TrendingSkeletonProps) {
  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <Skeleton className="h-6 w-32 mx-auto mb-4" />
        <Skeleton className="h-8 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {[...Array(count)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-xl border border-border/50 bg-card p-4"
          >
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface WhyUseSkeletonProps {
  className?: string;
}

export function WhyUseSkeleton({ className }: WhyUseSkeletonProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="space-y-3 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
          <div className="flex flex-col items-center md:items-end">
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-5 h-5 rounded" />
              ))}
            </div>
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecentSkeletonProps {
  count?: number;
}

export function RecentSkeleton({ count = 3 }: RecentSkeletonProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(count)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl bg-card border border-border/50"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
