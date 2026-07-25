import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FIELD_TYPES, FieldType, CustomField } from "@/types/fieldTypes";

interface FieldCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateField: (field: CustomField) => void;
}

export function FieldCreator({
  isOpen,
  onClose,
  onCreateField,
}: FieldCreatorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "AI" | "All" | "Custom"
  >("all");
  const [fieldName, setFieldName] = useState("");
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);

  const filteredFields = FIELD_TYPES.filter((field) => {
    const matchesSearch = field.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || field.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const aiFields = filteredFields.filter((f) => f.category === "AI");
  const allFields = filteredFields.filter((f) => f.category === "All");

  const handleFieldSelect = (fieldType: FieldType) => {
    setSelectedFieldType(fieldType);
    setFieldName(fieldType.name);
    setIsCreating(true);
  };

  const handleCreateField = () => {
    if (!selectedFieldType || !fieldName.trim()) return;

    const newField: CustomField = {
      id: `${selectedFieldType.id}-${Date.now()}`,
      name: fieldName.trim(),
      type: selectedFieldType.id,
      width: 150,
    };

    onCreateField(newField);
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setFieldName("");
    setSelectedFieldType(null);
    setIsCreating(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-dashboard-surface border-dashboard-border max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="border-b border-dashboard-border pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              <span className="text-lg">Create field</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-1 h-auto text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full max-h-[60vh]">
          {!isCreating ? (
            <>
              {/* Search */}
              <div className="p-4 border-b border-dashboard-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search for new or existing fields"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-dashboard-bg border-accent text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="p-4 border-b border-dashboard-border">
                <div className="flex gap-2">
                  {["all", "AI", "All", "Custom"].map((category) => (
                    <Button
                      key={category}
                      variant={
                        selectedCategory === category ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedCategory(category as any)}
                      className={cn(
                        selectedCategory === category
                          ? "bg-accent text-black"
                          : "border-dashboard-border text-gray-400 hover:text-white",
                      )}
                    >
                      {category === "all" ? "All Categories" : category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Field List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {aiFields.length > 0 &&
                  (selectedCategory === "all" || selectedCategory === "AI") && (
                    <div>
                      <h3 className="text-white text-sm font-medium mb-3">
                        AI fields
                      </h3>
                      <div className="space-y-2">
                        {aiFields.map((field) => (
                          <FieldItem
                            key={field.id}
                            field={field}
                            onClick={() => handleFieldSelect(field)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {allFields.length > 0 &&
                  (selectedCategory === "all" ||
                    selectedCategory === "All") && (
                    <div>
                      <h3 className="text-white text-sm font-medium mb-3">
                        All
                      </h3>
                      <div className="space-y-2">
                        {allFields.map((field) => (
                          <FieldItem
                            key={field.id}
                            field={field}
                            onClick={() => handleFieldSelect(field)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {filteredFields.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">
                      No fields found matching your search.
                    </p>
                  </div>
                )}
              </div>

              {/* Add Existing Fields Button */}
              <div className="p-4 border-t border-dashboard-border">
                <Button
                  variant="outline"
                  className="w-full border-dashboard-border text-gray-400 hover:text-white"
                  disabled
                >
                  Add existing fields
                </Button>
              </div>
            </>
          ) : (
            // Field Creation Form
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                  className="p-1 h-auto text-gray-400 hover:text-white"
                >
                  ←
                </Button>
                <div>
                  <h3 className="text-white text-lg font-medium">
                    Create {selectedFieldType?.name} field
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Configure your new field
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium block mb-2">
                    Field Name
                  </label>
                  <Input
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    placeholder="Enter field name..."
                    className="bg-dashboard-bg border-dashboard-border text-white"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-dashboard-bg rounded-lg border border-dashboard-border">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-sm"
                    style={{
                      backgroundColor: selectedFieldType?.color + "20",
                      color: selectedFieldType?.color,
                    }}
                  >
                    {selectedFieldType?.icon}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {selectedFieldType?.name}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {selectedFieldType?.description ||
                        `A ${selectedFieldType?.name.toLowerCase()} field for storing data`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCreateField}
                  disabled={!fieldName.trim()}
                  className="flex-1 bg-accent text-black hover:bg-accent/80"
                >
                  Create Field
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  className="border-dashboard-border text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface FieldItemProps {
  field: FieldType;
  onClick: () => void;
}

function FieldItem({ field, onClick }: FieldItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dashboard-bg transition-colors group text-left"
    >
      <div
        className="w-8 h-8 rounded flex items-center justify-center text-sm flex-shrink-0"
        style={{ backgroundColor: field.color + "20", color: field.color }}
      >
        {field.icon}
      </div>
      <span className="text-white text-sm font-medium group-hover:text-accent transition-colors">
        {field.name}
      </span>
    </button>
  );
}
