import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "green" | "purple" | "orange" | "blue";
  delay?: number;
  isTime?: boolean;
}

const colorClasses = {
  green: "bg-accent",
  purple: "bg-accent",
  orange: "bg-accent",
  blue: "bg-accent",
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  delay = 0,
  isTime = false,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="stats-card group cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-normal text-gray-400 mb-1">{title}</p>
          <p
            className={`text-2xl font-normal text-white ${isTime ? "font-mono text-lg" : ""}`}
          >
            {value}
          </p>
        </div>
        <div
          className={`p-3 rounded-lg ${colorClasses[color]} group-hover:scale-105 transition-transform duration-200`}
        >
          <Icon className="w-6 h-6 text-black" />
        </div>
      </div>
    </motion.div>
  );
}
