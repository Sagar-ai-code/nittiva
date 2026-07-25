import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Bell,
  Globe,
  User as UserIcon,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  MoreHorizontal,
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
import { mockDataService, type MockClient } from "@/lib/mockData";
import { toast } from "sonner";

type Client = MockClient;

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "active" as const,
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      // Simulate async call for consistent UX
      await new Promise((resolve) => setTimeout(resolve, 300));
      const clients = mockDataService.getClients();
      setClients(clients);
    } catch (error) {
      toast.error("Failed to load clients");
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email) {
      toast.error("Name and email are required");
      return;
    }

    try {
      // Simulate async call
      await new Promise((resolve) => setTimeout(resolve, 300));
      mockDataService.createClient(newClient);
      toast.success("Client added successfully");
      fetchClients();
      setNewClient({
        name: "",
        company: "",
        email: "",
        phone: "",
        status: "active",
      });
      setShowAddDialog(false);
    } catch (error) {
      toast.error("Failed to add client");
      console.error("Error adding client:", error);
    }
  };

  const handleEditClient = async () => {
    if (!editingClient) return;

    try {
      // Simulate async call
      await new Promise((resolve) => setTimeout(resolve, 300));
      mockDataService.updateClient(editingClient.id, editingClient);
      toast.success("Client updated successfully");
      fetchClients();
      setEditingClient(null);
    } catch (error) {
      toast.error("Failed to update client");
      console.error("Error updating client:", error);
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      // Simulate async call
      await new Promise((resolve) => setTimeout(resolve, 300));
      mockDataService.deleteClient(id);
      toast.success("Client deleted successfully");
      fetchClients();
    } catch (error) {
      toast.error("Failed to delete client");
      console.error("Error deleting client:", error);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "inactive":
        return "bg-gray-500/20 text-gray-400";
      case "potential":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    potential: clients.filter((c) => c.status === "potential").length,
    inactive: clients.filter((c) => c.status === "inactive").length,
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
                placeholder="Search clients..."
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
            <h1 className="text-2xl font-normal text-white mb-1">Clients</h1>
            <p className="text-gray-400 text-sm">
              Manage your client relationships
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-black hover:bg-accent/80">
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-dashboard-surface border-dashboard-border max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Client</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-400">Name *</Label>
                  <Input
                    value={newClient.name}
                    onChange={(e) =>
                      setNewClient({ ...newClient, name: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Company</Label>
                  <Input
                    value={newClient.company}
                    onChange={(e) =>
                      setNewClient({ ...newClient, company: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Email *</Label>
                  <Input
                    type="email"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient({ ...newClient, email: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Phone</Label>
                  <Input
                    value={newClient.phone}
                    onChange={(e) =>
                      setNewClient({ ...newClient, phone: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Address</Label>
                  <Textarea
                    value={newClient.address}
                    onChange={(e) =>
                      setNewClient({ ...newClient, address: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white resize-none"
                    placeholder="Full address"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddClient}
                    className="bg-accent text-black hover:bg-accent/80 flex-1"
                  >
                    Add Client
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
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Clients", value: stats.total, color: "blue" },
            { label: "Active", value: stats.active, color: "green" },
            { label: "Potential", value: stats.potential, color: "yellow" },
            { label: "Inactive", value: stats.inactive, color: "gray" },
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
                  <Building className={`w-5 h-5 text-${stat.color}-500`} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  <p className="text-xl font-medium text-white">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Clients Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-card border border-dashboard-border rounded-lg overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              Loading clients...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dashboard-border bg-dashboard-surface">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Projects
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashboard-border">
                  {filteredClients.map((client, index) => (
                    <motion.tr
                      key={client.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="hover:bg-dashboard-surface/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                            <Building className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {client.name}
                            </div>
                            {client.company && (
                              <div className="text-xs text-gray-400">
                                {client.company}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          className={`${getStatusColor(client.status)} border-0 capitalize`}
                        >
                          {client.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-300">
                          {client.projects_count || 0}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-300">
                          {new Date(client.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-dashboard-surface border-dashboard-border"
                          >
                            <DropdownMenuItem
                              onClick={() => setEditingClient(client)}
                              className="text-gray-300 hover:text-white hover:bg-dashboard-bg"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClient(client.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Edit Dialog */}
        <Dialog
          open={!!editingClient}
          onOpenChange={() => setEditingClient(null)}
        >
          <DialogContent className="bg-dashboard-surface border-dashboard-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Client</DialogTitle>
            </DialogHeader>
            {editingClient && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-400">Name *</Label>
                  <Input
                    value={editingClient.name}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        name: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Company</Label>
                  <Input
                    value={editingClient.company}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        company: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Email *</Label>
                  <Input
                    type="email"
                    value={editingClient.email}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        email: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Phone</Label>
                  <Input
                    value={editingClient.phone}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        phone: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-400">Address</Label>
                  <Textarea
                    value={editingClient.address}
                    onChange={(e) =>
                      setEditingClient({
                        ...editingClient,
                        address: e.target.value,
                      })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleEditClient}
                    className="bg-accent text-black hover:bg-accent/80 flex-1"
                  >
                    Update Client
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingClient(null)}
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
