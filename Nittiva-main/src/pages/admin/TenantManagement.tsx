import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Building2,
  Users,
  FolderKanban,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface Tenant {
  id: string;
  company_id: string;
  subdomain?: string;
  name: string;
  email?: string;
  is_active: boolean;
  is_trial: boolean;
  domain?: string;
  user_count?: number;
  project_count?: number;
  created_at: string;
  updated_at: string;
}

export default function TenantManagement() {
  const { user, refreshUser } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    company_id: "",
    subdomain: "",
    name: "",
    email: "",
    is_active: true,
    is_trial: false,
    // Initial admin user fields
    create_admin: false,
    admin_email: "",
    admin_password: "",
    admin_first_name: "",
    admin_last_name: "",
  });

  // Check if user is superuser - check both user object and refresh from API
  const [isSuperUser, setIsSuperUser] = useState(false);
  const [checking, setChecking] = useState(true);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTenants();
      if (response.success) {
        setTenants(Array.isArray(response.data) ? response.data : []);
      } else {
        toast.error(response.message || "Failed to load tenants");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSuperUser = async () => {
      setChecking(true);
      try {
        // Always fetch fresh user data from API to ensure we have is_superuser
        const response = await apiService.getProfile();

        console.log("RESPONSE HERE", response)
        if (response.success && response.data) {
          const userData = response.data as any;
          // Check both is_superuser and is_staff (staff can also manage tenants)
          const userIsSuper = userData?.is_superuser || userData?.is_staff || false;
          
          console.log("User profile data:", userData);
          console.log("Is Superuser:", userData?.is_superuser);
          console.log("Is Staff:", userData?.is_staff);
          
          // Update stored user with fresh data
          localStorage.setItem("user", JSON.stringify(userData));
          
          setIsSuperUser(userIsSuper);
          
          if (userIsSuper) {
            loadTenants();
          } else {
            console.error("User is not superuser or staff:", userData);
            toast.error("Access denied. Superuser privileges required.");
          }
        } else {
          console.error("Failed to get profile:", response);
          toast.error("Failed to load user profile. Please check if backend is running.");
        }
      } catch (error) {
        console.error("Error checking superuser status:", error);
        toast.error("Failed to verify permissions. Is the backend server running?");
      } finally {
        setChecking(false);
      }
    };
    
    checkSuperUser();
  }, []);

        const handleCreate = async () => {
          try {
            if (!formData.company_id || !formData.name) {
              toast.error("Company ID and name are required");
              return;
            }
            
            // Validate admin user fields if create_admin is checked
            if (formData.create_admin) {
              if (!formData.admin_email || !formData.admin_password) {
                toast.error("Admin email and password are required when creating initial admin user");
                return;
              }
            }
    
            const tenantData: any = {
              company_id: formData.company_id.toUpperCase().trim(),
              subdomain: formData.subdomain ? formData.subdomain.toLowerCase().trim() : undefined,
              name: formData.name.trim(),
              email: formData.email || undefined,
              is_active: formData.is_active,
              is_trial: formData.is_trial,
            };
            
            // Add admin user fields if create_admin is checked
            if (formData.create_admin) {
              tenantData.admin_email = formData.admin_email.trim();
              tenantData.admin_password = formData.admin_password;
              tenantData.admin_first_name = formData.admin_first_name.trim() || undefined;
              tenantData.admin_last_name = formData.admin_last_name.trim() || undefined;
            }
    
            const response = await apiService.createTenant(tenantData);

      if (response.success) {
        toast.success(`Tenant "${formData.name}" created successfully`);
        setIsCreateDialogOpen(false);
        resetForm();
        loadTenants();
      } else {
        toast.error(response.message || "Failed to create tenant");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create tenant");
    }
  };

  const handleUpdate = async () => {
    if (!editingTenant) return;

    try {
          const response = await apiService.updateTenant(editingTenant.id, {
            company_id: formData.company_id.toUpperCase().trim(),
            subdomain: formData.subdomain ? formData.subdomain.toLowerCase().trim() : undefined,
            name: formData.name.trim(),
            email: formData.email || undefined,
            is_active: formData.is_active,
            is_trial: formData.is_trial,
          });

      if (response.success) {
        toast.success(`Tenant "${formData.name}" updated successfully`);
        setIsEditDialogOpen(false);
        setEditingTenant(null);
        resetForm();
        loadTenants();
      } else {
        toast.error(response.message || "Failed to update tenant");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update tenant");
    }
  };

  const handleDelete = async (tenant: Tenant) => {
    if (!confirm(`Are you sure you want to delete tenant "${tenant.name}"?`)) {
      return;
    }

    try {
      const response = await apiService.deleteTenant(tenant.id);
      if (response.success) {
        toast.success(`Tenant "${tenant.name}" deleted successfully`);
        loadTenants();
      } else {
        toast.error(response.message || "Failed to delete tenant");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tenant");
    }
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      const response = tenant.is_active
        ? await apiService.deactivateTenant(tenant.id)
        : await apiService.activateTenant(tenant.id);

      if (response.success) {
        toast.success(
          `Tenant "${tenant.name}" ${tenant.is_active ? "deactivated" : "activated"}`
        );
        loadTenants();
      } else {
        toast.error(response.message || "Failed to update tenant status");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update tenant status");
    }
  };

  const openEditDialog = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      company_id: tenant.company_id || "",
      subdomain: tenant.subdomain || "",
      name: tenant.name,
      email: tenant.email || "",
      is_active: tenant.is_active,
      is_trial: tenant.is_trial,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      company_id: "",
      subdomain: "",
      name: "",
      email: "",
      is_active: true,
      is_trial: false,
      create_admin: false,
      admin_email: "",
      admin_password: "",
      admin_first_name: "",
      admin_last_name: "",
    });
  };

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.company_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (checking) {
    return (
      <div className="h-full bg-dashboard-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isSuperUser) {
    return (
      <div className="h-full bg-dashboard-bg flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-normal text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-4">
            You need superuser privileges to access tenant management.
          </p>
          <Button
            onClick={async () => {
              // Force refresh user profile
              try {
                const response = await apiService.getProfile();
                if (response.success && response.data) {
                  localStorage.setItem("user", JSON.stringify(response.data));
                  // Update auth context
                  await refreshUser();
                  // Reload page to refresh state
                  window.location.reload();
                } else {
                  toast.error("Failed to refresh profile. Please try logging out and back in.");
                }
              } catch (error) {
                toast.error("Error refreshing profile. Please try logging out and back in.");
              }
            }}
            className="bg-accent text-black hover:bg-accent/80 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-dashboard-bg p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-3xl font-normal text-white mb-2 flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              Tenant Management
            </h1>
          <p className="text-gray-400">Manage all tenants in the system</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
          className="bg-accent text-black hover:bg-accent/80 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Tenant
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tenants by name, subdomain, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-dashboard-surface border-dashboard-border text-white"
          />
        </div>
      </motion.div>

      {/* Tenants Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-dashboard-surface border border-dashboard-border rounded-lg overflow-hidden"
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-gray-400">Loading tenants...</p>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchQuery ? "No tenants found matching your search" : "No tenants yet"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-dashboard-border">
                <TableHead className="text-gray-300">Company ID</TableHead>
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-gray-300">Subdomain</TableHead>
                <TableHead className="text-gray-300">Email</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Stats</TableHead>
                <TableHead className="text-gray-300">Created</TableHead>
                <TableHead className="text-gray-300 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow
                  key={tenant.id}
                  className="border-dashboard-border hover:bg-dashboard-bg/50"
                >
                  <TableCell className="text-white font-mono text-sm font-bold">
                    {tenant.company_id}
                  </TableCell>
                  <TableCell className="text-white font-medium">{tenant.name}</TableCell>
                  <TableCell className="text-gray-400 font-mono text-sm">
                    {tenant.subdomain || "—"}
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {tenant.email || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={tenant.is_active ? "default" : "secondary"}
                        className={
                          tenant.is_active
                            ? "bg-green-500/20 text-green-400 border-green-500/50"
                            : "bg-gray-500/20 text-gray-400 border-gray-500/50"
                        }
                      >
                        {tenant.is_active ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {tenant.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {tenant.is_trial && (
                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                          Trial
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {tenant.user_count || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <FolderKanban className="w-4 h-4" />
                        {tenant.project_count || 0}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(tenant)}
                        className="text-gray-400 hover:text-white"
                        title={tenant.is_active ? "Deactivate" : "Activate"}
                      >
                        {tenant.is_active ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(tenant)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tenant)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-dashboard-surface border-dashboard-border text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Tenant</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new tenant organization. Users can register under this tenant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subdomain" className="text-gray-300">
                Subdomain *
              </Label>
              <Input
                id="subdomain"
                placeholder="acme"
                value={formData.subdomain}
                onChange={(e) =>
                  setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })
                }
                className="bg-dashboard-bg border-dashboard-border text-white mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Will be accessible at: {formData.subdomain || "subdomain"}.nittiva.com
              </p>
            </div>
            <div>
              <Label htmlFor="name" className="text-gray-300">
                Company Name *
              </Label>
              <Input
                id="name"
                placeholder="Acme Corporation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-dashboard-bg border-dashboard-border text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-300">
                Contact Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@acme.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-dashboard-bg border-dashboard-border text-white mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active" className="text-gray-300 cursor-pointer">
                  Active
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_trial"
                  checked={formData.is_trial}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_trial: checked })
                  }
                />
                <Label htmlFor="is_trial" className="text-gray-300 cursor-pointer">
                  Trial
                </Label>
              </div>
            </div>
            
            {/* Initial Admin User Section */}
            <div className="pt-4 border-t border-dashboard-border">
              <div className="flex items-center gap-2 mb-4">
                <Switch
                  id="create_admin"
                  checked={formData.create_admin}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, create_admin: checked })
                  }
                />
                <Label htmlFor="create_admin" className="text-gray-300 cursor-pointer">
                  Create Initial Admin User
                </Label>
              </div>
              
              {formData.create_admin && (
                <div className="space-y-4 pl-6 border-l-2 border-accent/30">
                  <p className="text-xs text-gray-400 mb-2">
                    Create the first admin user for this tenant. They can log in immediately using the Company ID.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin_first_name" className="text-gray-300">
                        First Name
                      </Label>
                      <Input
                        id="admin_first_name"
                        placeholder="John"
                        value={formData.admin_first_name}
                        onChange={(e) =>
                          setFormData({ ...formData, admin_first_name: e.target.value })
                        }
                        className="bg-dashboard-bg border-dashboard-border text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin_last_name" className="text-gray-300">
                        Last Name
                      </Label>
                      <Input
                        id="admin_last_name"
                        placeholder="Doe"
                        value={formData.admin_last_name}
                        onChange={(e) =>
                          setFormData({ ...formData, admin_last_name: e.target.value })
                        }
                        className="bg-dashboard-bg border-dashboard-border text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_email" className="text-gray-300">
                      Admin Email *
                    </Label>
                    <Input
                      id="admin_email"
                      type="email"
                      placeholder="admin@company.com"
                      value={formData.admin_email}
                      onChange={(e) =>
                        setFormData({ ...formData, admin_email: e.target.value })
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_password" className="text-gray-300">
                      Admin Password *
                    </Label>
                    <Input
                      id="admin_password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={formData.admin_password}
                      onChange={(e) =>
                        setFormData({ ...formData, admin_password: e.target.value })
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white"
                    />
                    <p className="text-xs text-gray-500">
                      Share this password securely with the admin user
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-dashboard-border text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-accent text-black hover:bg-accent/80"
              >
                Create Tenant
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-dashboard-surface border-dashboard-border text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update tenant information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-company_id" className="text-gray-300">
                Company ID *
              </Label>
              <Input
                id="edit-company_id"
                value={formData.company_id}
                onChange={(e) =>
                  setFormData({ ...formData, company_id: e.target.value.toUpperCase() })
                }
                className="bg-dashboard-bg border-dashboard-border text-white mt-1 uppercase"
                style={{ textTransform: "uppercase" }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier for this tenant. Users need this to register/login.
              </p>
            </div>
            <div>
              <Label htmlFor="edit-subdomain" className="text-gray-300">
                Subdomain (Optional)
              </Label>
              <Input
                id="edit-subdomain"
                value={formData.subdomain}
                onChange={(e) =>
                  setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })
                }
                className="bg-dashboard-bg border-dashboard-border text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-name" className="text-gray-300">
                Company Name *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-dashboard-bg border-dashboard-border text-white mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-email" className="text-gray-300">
                Contact Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-dashboard-bg border-dashboard-border text-white mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="edit-is_active" className="text-gray-300 cursor-pointer">
                  Active
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-is_trial"
                  checked={formData.is_trial}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_trial: checked })
                  }
                />
                <Label htmlFor="edit-is_trial" className="text-gray-300 cursor-pointer">
                  Trial
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingTenant(null);
                }}
                className="border-dashboard-border text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                className="bg-accent text-black hover:bg-accent/80"
              >
                Update Tenant
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
