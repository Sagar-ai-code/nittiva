import React, { useState } from "react";
import {
  Check,
  X,
  Calendar,
  ExternalLink,
  Star,
  DollarSign,
  Hash,
  MapPin,
  Phone,
  Mail,
  FileText,
  Link,
  Users,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CustomField } from "@/types/fieldTypes";

interface FieldRendererProps {
  field: CustomField;
  value: any;
  isEditing: boolean;
  onValueChange: (value: any) => void;
  onStartEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function FieldRenderer({
  field,
  value,
  isEditing,
  onValueChange,
  onStartEdit,
  onSave,
  onCancel,
  className,
}: FieldRendererProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleSave = () => {
    onValueChange(localValue);
    onSave?.();
  };

  const handleCancel = () => {
    setLocalValue(value);
    onCancel?.();
  };

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "custom-text":
        return isEditing ? (
          <Input
            value={localValue || ""}
            onChange={(e) => setLocalValue(e.target.value)}
            className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8"
            placeholder={`Enter ${field.name.toLowerCase()}...`}
          />
        ) : (
          <span
            className="text-gray-300 text-sm cursor-pointer hover:text-white transition-colors truncate"
            onClick={onStartEdit}
          >
            {value || `Add ${field.name.toLowerCase()}`}
          </span>
        );

      case "text-area":
        return isEditing ? (
          <Textarea
            value={localValue || ""}
            onChange={(e) => setLocalValue(e.target.value)}
            className="bg-dashboard-bg border-dashboard-border text-white text-sm min-h-[60px]"
            placeholder={`Enter ${field.name.toLowerCase()}...`}
          />
        ) : (
          <div
            className="text-gray-300 text-sm cursor-pointer hover:text-white transition-colors line-clamp-2"
            onClick={onStartEdit}
          >
            {value || `Add ${field.name.toLowerCase()}`}
          </div>
        );

      case "number":
        return isEditing ? (
          <Input
            type="number"
            value={localValue || ""}
            onChange={(e) => setLocalValue(e.target.value)}
            className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8"
            placeholder="0"
          />
        ) : (
          <div className="flex items-center gap-1">
            <Hash className="w-3 h-3 text-gray-500" />
            <span
              className="text-gray-300 text-sm cursor-pointer hover:text-white transition-colors font-mono"
              onClick={onStartEdit}
            >
              {value || "0"}
            </span>
          </div>
        );

      case "money":
        return isEditing ? (
          <Input
            type="number"
            value={localValue || ""}
            onChange={(e) => setLocalValue(e.target.value)}
            className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8"
            placeholder="0.00"
          />
        ) : (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-green-500" />
            <span
              className="text-gray-300 text-sm cursor-pointer hover:text-white transition-colors font-mono"
              onClick={onStartEdit}
            >
              {value ? `$${value}` : "$0.00"}
            </span>
          </div>
        );

      case "date":
        return isEditing ? (
          <Input
            type="date"
            value={localValue || ""}
            onChange={(e) => setLocalValue(e.target.value)}
            className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8"
          />
        ) : (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-500" />
            <span
              className="text-gray-300 text-sm cursor-pointer hover:text-white transition-colors"
              onClick={onStartEdit}
            >
              {value ? new Date(value).toLocaleDateString() : "Set date"}
            </span>
          </div>
        );

      case "checkbox":
        return (
          <button
            onClick={() => onValueChange(!value)}
            className="flex items-center justify-center w-full h-8"
          >
            <div
              className={cn(
                "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                value
                  ? "bg-accent border-accent"
                  : "border-gray-500 hover:border-gray-400",
              )}
            >
              {value && <Check className="w-3 h-3 text-black" />}
            </div>
          </button>
        );

      case "dropdown":
      case "custom-dropdown":
      case "categorize":
        const options = field.options || ["Option 1", "Option 2", "Option 3"];
        return isEditing ? (
          <Select value={localValue || ""} onValueChange={setLocalValue}>
            <SelectTrigger className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8">
              <SelectValue placeholder="Select option..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span
            className="text-gray-300 text-sm cursor-pointer hover:text-white transition-colors truncate"
            onClick={onStartEdit}
          >
            {value || "Select option"}
          </span>
        );

      case "labels":
        return (
          <div className="flex flex-wrap gap-1">
            {value && Array.isArray(value) ? (
              value.map((label: string, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs border-accent/50 text-accent"
                >
                  {label}
                </Badge>
              ))
            ) : (
              <span
                className="text-gray-400 text-sm cursor-pointer hover:text-white transition-colors"
                onClick={onStartEdit}
              >
                Add labels
              </span>
            )}
          </div>
        );

      case "progress-manual":
      case "progress-auto":
        const progressValue = parseInt(value) || 0;
        return isEditing && field.type === "progress-manual" ? (
          <Input
            type="number"
            min="0"
            max="100"
            value={localValue || 0}
            onChange={(e) => setLocalValue(parseInt(e.target.value) || 0)}
            className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8"
          />
        ) : (
          <div className="flex items-center gap-2 w-full">
            <Progress value={progressValue} className="flex-1 h-2" />
            <span className="text-xs text-gray-400 w-8">{progressValue}%</span>
          </div>
        );

      case "rating":
        return (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onValueChange(star)}
                className="hover:scale-110 transition-transform"
              >
                <Star
                  className={cn(
                    "w-4 h-4 transition-colors",
                    star <= (value || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-500 hover:text-yellow-400",
                  )}
                />
              </button>
            ))}
          </div>
        );

      case "website":
        return isEditing ? (
          <Input
            type="url"
            value={localValue || ""}
            onChange={(e) => setLocalValue(e.target.value)}
            className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8"
            placeholder="https://..."
          />
        ) : (
          <div className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3 text-blue-400" />
            {value ? (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 text-sm hover:text-blue-300 transition-colors truncate"
              >
                {value}
              </a>
            ) : (
              <span
                className="text-gray-400 text-sm cursor-pointer hover:text-white transition-colors"
                onClick={onStartEdit}
              >
                Add website
              </span>
            )}
          </div>
        );

      case "email":
        return isEditing ? (
          <Input
            type="email"
            value={localValue || ""}
            onChange={(e) => setLocalValue(e.target.value)}
            className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8"
            placeholder="email@example.com"
          />
        ) : (
          <div className="flex items-center gap-1">
            <Mail className="w-3 h-3 text-blue-400" />
            {value ? (
              <a
                href={`mailto:${value}`}
                className="text-blue-400 text-sm hover:text-blue-300 transition-colors truncate"
              >
                {value}
              </a>
            ) : (
              <span
                className="text-gray-400 text-sm cursor-pointer hover:text-white transition-colors"
                onClick={onStartEdit}
              >
                Add email
              </span>
            )}
          </div>
        );

      case "phone":
        return isEditing ? (
          <Input
            type="tel"
            value={localValue || ""}
            onChange={(e) => setLocalValue(e.target.value)}
            className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8"
            placeholder="+1 (555) 123-4567"
          />
        ) : (
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-green-400" />
            {value ? (
              <a
                href={`tel:${value}`}
                className="text-green-400 text-sm hover:text-green-300 transition-colors truncate"
              >
                {value}
              </a>
            ) : (
              <span
                className="text-gray-400 text-sm cursor-pointer hover:text-white transition-colors"
                onClick={onStartEdit}
              >
                Add phone
              </span>
            )}
          </div>
        );

      case "location":
        return isEditing ? (
          <Input
            value={localValue || ""}
            onChange={(e) => setLocalValue(e.target.value)}
            className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8"
            placeholder="Enter location..."
          />
        ) : (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-400" />
            <span
              className="text-gray-300 text-sm cursor-pointer hover:text-white transition-colors truncate"
              onClick={onStartEdit}
            >
              {value || "Add location"}
            </span>
          </div>
        );

      case "tshirt-size":
        const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
        return isEditing ? (
          <Select value={localValue || ""} onValueChange={setLocalValue}>
            <SelectTrigger className="bg-dashboard-bg border-dashboard-border text-white text-sm h-8">
              <SelectValue placeholder="Select size..." />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge
            variant="outline"
            className="text-xs border-dashboard-border text-gray-300"
          >
            {value || "Select size"}
          </Badge>
        );

      case "files":
        return (
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-purple-400" />
            <span className="text-gray-400 text-sm">
              {value
                ? `${Array.isArray(value) ? value.length : 1} file(s)`
                : "Add files"}
            </span>
          </div>
        );

      case "people":
        return (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-blue-400" />
            <span className="text-gray-300 text-sm">
              {value || "Assign people"}
            </span>
          </div>
        );

      default:
        return (
          <span
            className="text-gray-400 text-sm cursor-pointer hover:text-white transition-colors"
            onClick={onStartEdit}
          >
            {value || field.name}
          </span>
        );
    }
  };

  return (
    <div className={cn("flex items-center w-full", className)}>
      <div className="flex-1 min-w-0">{renderField()}</div>

      {isEditing && field.type !== "checkbox" && field.type !== "rating" && (
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="h-7 w-7 p-0 text-accent hover:text-accent"
          >
            <Check className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
