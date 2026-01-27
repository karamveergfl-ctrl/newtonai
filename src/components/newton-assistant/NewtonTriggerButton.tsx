import { memo } from "react";
import { motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import newtonChatAvatar from "@/assets/newton-chat-avatar.png";

interface NewtonTriggerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnread?: boolean;
}

export const NewtonTriggerButton = memo(function NewtonTriggerButton({
  isOpen,
  onClick,
  hasUnread = false,
}: NewtonTriggerButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center",
        "w-14 h-14 rounded-full",
        "bg-gradient-to-br from-primary to-primary/80",
        "shadow-lg shadow-primary/25",
        "hover:shadow-xl hover:shadow-primary/30",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
        "transition-all duration-200"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {/* Pulsing glow effect when closed */}
      {!isOpen && (
        <>
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: "0 0 20px 8px hsl(var(--primary) / 0.4)",
            }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Inner pulse */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </>
      )}

      {/* Button content */}
      <motion.div
        key={isOpen ? "close" : "open"}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 90, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-primary-foreground" />
        ) : (
          <div className="w-11 h-11 rounded-full overflow-hidden">
            <img
              src={newtonChatAvatar}
              alt="Newton AI"
              className="w-full h-full object-cover scale-150"
            />
          </div>
        )}
      </motion.div>

      {/* Unread indicator */}
      {hasUnread && !isOpen && (
        <motion.span
          className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full border-2 border-background"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}

      {/* Tooltip */}
      {!isOpen && (
        <motion.div
          className="absolute right-full mr-3 px-3 py-1.5 bg-popover text-popover-foreground text-sm rounded-lg shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100"
          initial={false}
        >
          <span className="flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            Ask Newton
          </span>
        </motion.div>
      )}
    </motion.button>
  );
});
