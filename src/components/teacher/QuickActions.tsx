import { motion } from "framer-motion";
import { Plus, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionsProps {
  onCreateClass: () => void;
}

export function QuickActions({ onCreateClass }: QuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Create a Class",
      description: "Set up a new classroom",
      icon: Plus,
      onClick: onCreateClass,
      gradient: "from-primary/10 to-secondary/10",
      iconBg: "bg-primary/15 text-primary",
    },
    {
      label: "Join as Student",
      description: "Preview a class experience",
      icon: UserPlus,
      onClick: () => navigate("/join-class"),
      gradient: "from-secondary/10 to-accent/10",
      iconBg: "bg-secondary/15 text-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {actions.map((action, i) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className={`flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-gradient-to-br ${action.gradient} text-left transition-all duration-200 hover:border-primary/30 hover:shadow-[var(--shadow-glow)]`}
        >
          <div className={`p-2.5 rounded-xl ${action.iconBg}`}>
            <action.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{action.label}</p>
            <p className="text-xs text-muted-foreground">{action.description}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
