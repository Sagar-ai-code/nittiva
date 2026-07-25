export interface FieldType {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: "AI" | "All" | "Custom";
  description?: string;
}

export const FIELD_TYPES: FieldType[] = [
  // AI fields
  {
    id: "summary",
    name: "Summary",
    icon: "📄",
    color: "#8b5cf6",
    category: "AI",
  },
  {
    id: "custom-text",
    name: "Custom Text",
    icon: "📄",
    color: "#8b5cf6",
    category: "AI",
  },
  {
    id: "custom-dropdown",
    name: "Custom Dropdown",
    icon: "📄",
    color: "#8b5cf6",
    category: "AI",
  },

  // All fields
  {
    id: "dropdown",
    name: "Dropdown",
    icon: "📋",
    color: "#10b981",
    category: "All",
  },
  { id: "text", name: "Text", icon: "T", color: "#3b82f6", category: "All" },
  { id: "date", name: "Date", icon: "📅", color: "#8b5a3c", category: "All" },
  {
    id: "text-area",
    name: "Text area (Long Text)",
    icon: "📄",
    color: "#3b82f6",
    category: "All",
  },
  {
    id: "number",
    name: "Number",
    icon: "#",
    color: "#10b981",
    category: "All",
  },
  {
    id: "labels",
    name: "Labels",
    icon: "🏷️",
    color: "#10b981",
    category: "All",
  },
  {
    id: "checkbox",
    name: "Checkbox",
    icon: "☑️",
    color: "#ec4899",
    category: "All",
  },
  { id: "money", name: "Money", icon: "$", color: "#10b981", category: "All" },
  {
    id: "website",
    name: "Website",
    icon: "🌐",
    color: "#dc2626",
    category: "All",
  },
  {
    id: "formula",
    name: "Formula",
    icon: "ƒ",
    color: "#10b981",
    category: "All",
  },
  {
    id: "progress-updates",
    name: "Progress Updates",
    icon: "📄",
    color: "#8b5cf6",
    category: "All",
  },
  { id: "files", name: "Files", icon: "📎", color: "#7c2d12", category: "All" },
  {
    id: "relationship",
    name: "Relationship",
    icon: "🔗",
    color: "#3b82f6",
    category: "All",
  },
  {
    id: "people",
    name: "People",
    icon: "👥",
    color: "#dc2626",
    category: "All",
  },
  {
    id: "progress-auto",
    name: "Progress (Auto)",
    icon: "📊",
    color: "#a16207",
    category: "All",
  },
  { id: "email", name: "Email", icon: "✉️", color: "#dc2626", category: "All" },
  { id: "phone", name: "Phone", icon: "📞", color: "#dc2626", category: "All" },
  {
    id: "categorize",
    name: "Categorize",
    icon: "📄",
    color: "#8b5cf6",
    category: "All",
  },
  {
    id: "translation",
    name: "Translation",
    icon: "📄",
    color: "#8b5cf6",
    category: "All",
  },
  {
    id: "sentiment",
    name: "Sentiment",
    icon: "📄",
    color: "#8b5cf6",
    category: "All",
  },
  { id: "tasks", name: "Tasks", icon: "✅", color: "#3b82f6", category: "All" },
  {
    id: "location",
    name: "Location",
    icon: "📍",
    color: "#dc2626",
    category: "All",
  },
  {
    id: "progress-manual",
    name: "Progress (Manual)",
    icon: "📊",
    color: "#a16207",
    category: "All",
  },
  {
    id: "rating",
    name: "Rating",
    icon: "⭐",
    color: "#a16207",
    category: "All",
  },
  {
    id: "voting",
    name: "Voting",
    icon: "📊",
    color: "#8b5cf6",
    category: "All",
  },
  {
    id: "signature",
    name: "Signature",
    icon: "✍️",
    color: "#10b981",
    category: "All",
  },
  {
    id: "rollup",
    name: "Rollup",
    icon: "📈",
    color: "#3b82f6",
    category: "All",
  },
  {
    id: "action-items",
    name: "Action Items",
    icon: "📄",
    color: "#8b5cf6",
    category: "All",
  },
  {
    id: "tshirt-size",
    name: "T-shirt Size",
    icon: "📄",
    color: "#8b5cf6",
    category: "All",
  },
];

export interface CustomField {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  options?: string[];
  defaultValue?: any;
  width?: number;
}

export interface TaskWithCustomFields {
  id: number;
  name: string;
  assigneeId?: string; // Keep for backward compatibility
  assigneeIds?: string[]; // New field for multiple assignees
  dueDate?: string;
  startDate?: string;
  priority: "high" | "medium" | "low";
  progress: number;
  status: "to-do" | "in-progress" | "completed";
  description?: string;
  timeEstimate?: string;
  trackTime?: boolean;
  tags?: string[];
  relationships?: string;
  customFields?: { [fieldId: string]: any };
}
