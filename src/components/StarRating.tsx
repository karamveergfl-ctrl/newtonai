import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export const StarRating = ({
  rating,
  maxRating = 5,
  size = "md",
  animated = true,
}: StarRatingProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }).map((_, index) => {
        const isFilled = index < rating;
        
        if (animated) {
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.2,
                delay: index * 0.1,
                type: "spring",
                stiffness: 200,
              }}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-muted text-muted"
                }`}
              />
            </motion.div>
          );
        }

        return (
          <Star
            key={index}
            className={`${sizeClasses[size]} ${
              isFilled
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted"
            }`}
          />
        );
      })}
    </div>
  );
};

export default StarRating;
