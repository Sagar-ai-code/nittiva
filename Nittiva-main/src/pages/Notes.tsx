import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Bell,
  Globe,
  User as UserIcon,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  MoreHorizontal,
  Pin,
  Archive,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

interface Note {
  id: number;
  title: string;
  content: string;
  task_id?: number;
  project_id?: number;
  is_pinned?: boolean;
  is_archived?: boolean;
  color?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

const noteColors = [
  { name: "Default", value: "#2a2a2a", border: "#404040" },
  { name: "Yellow", value: "#fff9c4", border: "#fbbf24" },
  { name: "Green", value: "#dcfce7", border: "#22c55e" },
  { name: "Blue", value: "#dbeafe", border: "#3b82f6" },
  { name: "Purple", value: "#f3e8ff", border: "#8b5cf6" },
  { name: "Pink", value: "#fce7f3", border: "#ec4899" },
  { name: "Orange", value: "#fed7aa", border: "#f97316" },
];

export default function Notes() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedColor, setSelectedColor] = useState(noteColors[0]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    color: noteColors[0].value,
    tags: [] as string[],
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchNotes();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotes();
      if (response.success && response.data) {
        setNotes(response.data);
      } else {
        toast.error(response.message || "Failed to load notes");
      }
    } catch (error) {
      toast.error("Failed to load notes");
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.title || !newNote.content) {
      toast.error("Title and content are required");
      return;
    }

    try {
      const response = await apiService.createNote(newNote);
      if (response.success) {
        toast.success("Note created successfully");
        fetchNotes();
        setNewNote({
          title: "",
          content: "",
          color: noteColors[0].value,
          tags: [],
        });
        setSelectedColor(noteColors[0]);
        setShowAddDialog(false);
      } else {
        toast.error(response.message || "Failed to create note");
      }
    } catch (error) {
      toast.error("Failed to create note");
      console.error("Error creating note:", error);
    }
  };

  const handleEditNote = async () => {
    if (!editingNote) return;

    try {
      const response = await apiService.updateNote(editingNote.id, editingNote);
      if (response.success) {
        toast.success("Note updated successfully");
        fetchNotes();
        setEditingNote(null);
      } else {
        toast.error(response.message || "Failed to update note");
      }
    } catch (error) {
      toast.error("Failed to update note");
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const response = await apiService.deleteNote(id);
      if (response.success) {
        toast.success("Note deleted successfully");
        fetchNotes();
      } else {
        toast.error(response.message || "Failed to delete note");
      }
    } catch (error) {
      toast.error("Failed to delete note");
      console.error("Error deleting note:", error);
    }
  };

  const handlePinNote = async (note: Note) => {
    try {
      const updatedNote = { ...note, is_pinned: !note.is_pinned };
      const response = await apiService.updateNote(note.id, updatedNote);
      if (response.success) {
        toast.success(note.is_pinned ? "Note unpinned" : "Note pinned");
        fetchNotes();
      } else {
        toast.error(response.message || "Failed to update note");
      }
    } catch (error) {
      toast.error("Failed to update note");
      console.error("Error updating note:", error);
    }
  };

  const filteredNotes = notes
    .filter(
      (note) =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      // Sort by pinned first, then by updated date
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

  const pinnedNotes = filteredNotes.filter((note) => note.is_pinned);
  const otherNotes = filteredNotes.filter((note) => !note.is_pinned);

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const getColorStyle = (color?: string) => {
    if (!color || color === noteColors[0].value) {
      return {
        backgroundColor: noteColors[0].value,
        borderColor: noteColors[0].border,
      };
    }
    const colorConfig = noteColors.find((c) => c.value === color);
    return {
      backgroundColor: colorConfig?.value || noteColors[0].value,
      borderColor: colorConfig?.border || noteColors[0].border,
    };
  };

  const stats = {
    total: notes.length,
    pinned: notes.filter((n) => n.is_pinned).length,
    archived: notes.filter((n) => n.is_archived).length,
    recent: notes.filter((n) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(n.created_at) > weekAgo;
    }).length,
  };

  return (
    <div className="h-full bg-dashboard-bg">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-dashboard-surface border-b border-dashboard-border px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dashboard-bg border-dashboard-border text-white placeholder:text-gray-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Globe className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-black" />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-normal text-white mb-1">Notes</h1>
            <p className="text-gray-400 text-sm">
              Capture your thoughts and ideas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="text-xs"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="text-xs"
              >
                List
              </Button>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-black hover:bg-accent/80">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-dashboard-surface border-dashboard-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Create New Note
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-400">Title *</Label>
                    <Input
                      value={newNote.title}
                      onChange={(e) =>
                        setNewNote({ ...newNote, title: e.target.value })
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white"
                      placeholder="Note title"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">Content *</Label>
                    <Textarea
                      value={newNote.content}
                      onChange={(e) =>
                        setNewNote({ ...newNote, content: e.target.value })
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white resize-none"
                      placeholder="Write your note content here..."
                      rows={8}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">Color</Label>
                    <div className="flex gap-2 mt-2">
                      {noteColors.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => {
                            setSelectedColor(color);
                            setNewNote({ ...newNote, color: color.value });
                          }}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            selectedColor.value === color.value
                              ? "ring-2 ring-accent ring-offset-2 ring-offset-dashboard-surface"
                              : "hover:scale-110"
                          }`}
                          style={{
                            backgroundColor: color.value,
                            borderColor: color.border,
                          }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddNote}
                      className="bg-accent text-black hover:bg-accent/80 flex-1"
                    >
                      Create Note
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                      className="border-dashboard-border text-gray-400 hover:text-white flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Notes",
              value: stats.total,
              color: "blue",
              icon: FileText,
            },
            {
              label: "Pinned",
              value: stats.pinned,
              color: "yellow",
              icon: Pin,
            },
            {
              label: "Recent",
              value: stats.recent,
              color: "green",
              icon: Calendar,
            },
            {
              label: "Archived",
              value: stats.archived,
              color: "gray",
              icon: Archive,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
              className="bg-card border border-dashboard-border rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${stat.color}-500/20 rounded-lg`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="text-xl font-medium text-white">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading notes...</div>
        ) : (
          <div className="space-y-6">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Pin className="w-5 h-5 text-yellow-500" />
                  Pinned Notes
                </h2>
                <div
                  className={`grid gap-4 ${
                    viewMode === "grid"
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "grid-cols-1"
                  }`}
                >
                  {pinnedNotes.map((note, index) => (
                    <NoteCard
                      key={`pinned-${note.id}`}
                      note={note}
                      index={index}
                      viewMode={viewMode}
                      onEdit={setEditingNote}
                      onDelete={handleDeleteNote}
                      onPin={handlePinNote}
                      getColorStyle={getColorStyle}
                      truncateContent={truncateContent}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Notes */}
            {otherNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <h2 className="text-lg font-medium text-white mb-4">
                    Other Notes
                  </h2>
                )}
                <div
                  className={`grid gap-4 ${
                    viewMode === "grid"
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "grid-cols-1"
                  }`}
                >
                  {otherNotes.map((note, index) => (
                    <NoteCard
                      key={`other-${note.id}`}
                      note={note}
                      index={index}
                      viewMode={viewMode}
                      onEdit={setEditingNote}
                      onDelete={handleDeleteNote}
                      onPin={handlePinNote}
                      getColorStyle={getColorStyle}
                      truncateContent={truncateContent}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredNotes.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                {searchTerm
                  ? "No notes found matching your search"
                  : "No notes yet. Create your first note!"}
              </div>
            )}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent className="bg-dashboard-surface border-dashboard-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Note</DialogTitle>
            </DialogHeader>
            {editingNote && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-400">Title *</Label>
                  <Input
                    value={editingNote.title}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, title: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Content *</Label>
                  <Textarea
                    value={editingNote.content}
                    onChange={(e) =>
                      setEditingNote({
                        ...editingNote,
                        content: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white resize-none"
                    rows={8}
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Color</Label>
                  <div className="flex gap-2 mt-2">
                    {noteColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() =>
                          setEditingNote({ ...editingNote, color: color.value })
                        }
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          editingNote.color === color.value
                            ? "ring-2 ring-accent ring-offset-2 ring-offset-dashboard-surface"
                            : "hover:scale-110"
                        }`}
                        style={{
                          backgroundColor: color.value,
                          borderColor: color.border,
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleEditNote}
                    className="bg-accent text-black hover:bg-accent/80 flex-1"
                  >
                    Update Note
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingNote(null)}
                    className="border-dashboard-border text-gray-400 hover:text-white flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Note Card Component
interface NoteCardProps {
  note: Note;
  index: number;
  viewMode: "grid" | "list";
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  onPin: (note: Note) => void;
  getColorStyle: (color?: string) => any;
  truncateContent: (content: string, maxLength?: number) => string;
}

function NoteCard({
  note,
  index,
  viewMode,
  onEdit,
  onDelete,
  onPin,
  getColorStyle,
  truncateContent,
}: NoteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`border-2 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer group ${
        viewMode === "list" ? "flex items-start gap-4" : ""
      }`}
      style={getColorStyle(note.color)}
      onClick={() => onEdit(note)}
    >
      <div className={`flex-1 ${viewMode === "list" ? "min-w-0" : ""}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className={`font-medium line-clamp-2 ${
              note.color && note.color !== noteColors[0].value
                ? "text-gray-800"
                : "text-white"
            }`}
          >
            {note.title}
            {note.is_pinned && (
              <Pin className="inline w-4 h-4 ml-1 text-yellow-600" />
            )}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-dashboard-surface border-dashboard-border"
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(note);
                }}
                className="text-gray-300 hover:text-white hover:bg-dashboard-bg"
              >
                <Pin className="w-4 h-4 mr-2" />
                {note.is_pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(note);
                }}
                className="text-gray-300 hover:text-white hover:bg-dashboard-bg"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p
          className={`text-sm line-clamp-4 mb-3 ${
            note.color && note.color !== noteColors[0].value
              ? "text-gray-700"
              : "text-gray-300"
          }`}
        >
          {truncateContent(note.content, viewMode === "list" ? 200 : 150)}
        </p>

        <div
          className={`text-xs ${
            note.color && note.color !== noteColors[0].value
              ? "text-gray-600"
              : "text-gray-400"
          }`}
        >
          {new Date(note.updated_at).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  );
}
