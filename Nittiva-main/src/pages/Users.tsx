import React, { useState } from "react";
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
  Calendar,
  MoreHorizontal,
  Users as UsersIcon,
  Crown,
  Code,
  Palette,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUser } from "@/context/UserContext";

const getRoleIcon = (role: string) => {
  switch (role) {
    case "admin":
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case "manager":
      return <Briefcase className="w-4 h-4 text-blue-500" />;
    case "developer":
      return <Code className="w-4 h-4 text-green-500" />;
    case "designer":
      return <Palette className="w-4 h-4 text-purple-500" />;
    default:
      return <UserIcon className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "online":
      return "bg-green-500";
    case "away":
      return "bg-yellow-500";
    case "offline":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

export default function Users() {
  const { users, addUser, updateUser, deleteUser } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "developer" as const,
    status: "offline" as const,
    department: "",
    avatar: "",
    color: "#befca9",
    tasksAssigned: 0,
    tasksCompleted: 0,
    hoursWorked: 0,
  });

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      !roleFilter || roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      !statusFilter || statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = () => {
    if (newUser.name && newUser.email) {
      const avatar = newUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
      addUser({
        ...newUser,
        avatar: avatar,
      });
      setNewUser({
        name: "",
        email: "",
        role: "developer",
        status: "offline",
        department: "",
        avatar: "",
        color: "#befca9",
        tasksAssigned: 0,
        tasksCompleted: 0,
        hoursWorked: 0,
      });
      setShowAddDialog(false);
    }
  };

  const stats = {
    total: users.length,
    online: users.filter((u) => u.status === "online").length,
    admins: users.filter((u) => u.role === "admin").length,
    developers: users.filter((u) => u.role === "developer").length,
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
                placeholder="Search users..."
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
            <h1 className="text-2xl font-normal text-white mb-1">
              Team Members
            </h1>
            <p className="text-gray-400 text-sm">
              Manage your team and user permissions
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-black hover:bg-accent/80">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-dashboard-surface border-dashboard-border">
              <DialogHeader>
                <DialogTitle className="text-white">Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Name
                  </label>
                  <Input
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Role
                  </label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: any) =>
                      setNewUser({ ...newUser, role: value })
                    }
                  >
                    <SelectTrigger className="bg-dashboard-bg border-dashboard-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="designer">Designer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    Department
                  </label>
                  <Input
                    value={newUser.department}
                    onChange={(e) =>
                      setNewUser({ ...newUser, department: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white"
                    placeholder="Enter department"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddUser}
                    className="bg-accent text-black hover:bg-accent/80 flex-1"
                  >
                    Add User
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-card border border-dashboard-border rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <UsersIcon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-xl font-medium text-white">{stats.total}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-card border border-dashboard-border rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <div className="w-5 h-5 bg-green-500 rounded-full" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Online</p>
                <p className="text-xl font-medium text-white">{stats.online}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-card border border-dashboard-border rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Admins</p>
                <p className="text-xl font-medium text-white">{stats.admins}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="bg-card border border-dashboard-border rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Code className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Developers</p>
                <p className="text-xl font-medium text-white">
                  {stats.developers}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48 bg-dashboard-surface border-dashboard-border">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="developer">Developer</SelectItem>
              <SelectItem value="designer">Designer</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-dashboard-surface border-dashboard-border">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="away">Away</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-card border border-dashboard-border rounded-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dashboard-border bg-dashboard-surface">
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashboard-border">
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="hover:bg-dashboard-surface/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-black"
                            style={{ backgroundColor: user.color }}
                          >
                            {user.avatar}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-dashboard-bg`}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="text-sm text-gray-300 capitalize">
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(user.status)} text-white border-0 capitalize`}
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-300">
                        {user.tasksCompleted}/{user.tasksAssigned}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-300">
                        {user.hoursWorked}h
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-300">
                        {user.joinDate.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                          onClick={() => deleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
