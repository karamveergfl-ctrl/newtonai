import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LevelUpModalProps {
  isOpen: boolean;
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ isOpen, level, onClose }: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="bg-gradient-to-br from-card via-card to-primary/10 border border-primary/30 rounded-2xl p-8 shadow-2xl max-w-sm mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated trophy icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", damping: 10 }}
              className="relative mx-auto w-20 h-20 mb-4"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              {/* Sparkles around the trophy */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <Sparkles className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 text-yellow-400" />
                <Star className="absolute top-1/2 -right-2 -translate-y-1/2 w-3 h-3 text-orange-400" fill="currentColor" />
                <Sparkles className="absolute -bottom-1 left-1/4 w-3 h-3 text-yellow-300" />
                <Star className="absolute top-1/4 -left-1 w-3 h-3 text-amber-400" fill="currentColor" />
              </motion.div>
            </motion.div>

            {/* Level up text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-500 bg-clip-text text-transparent mb-2">
                Level Up!
              </h2>
              <p className="text-muted-foreground mb-4">
                Congratulations! You've reached
              </p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", damping: 8 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold text-xl mb-6"
              >
                <Trophy className="w-5 h-5" />
                Level {level}
              </motion.div>
            </motion.div>

            {/* Close button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
