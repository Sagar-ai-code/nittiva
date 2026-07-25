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
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Filter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

interface LeaveRequest {
  id: number;
  user_id: number;
  user_name?: string;
  leave_type: "annual" | "sick" | "personal" | "maternity" | "emergency";
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approved_by?: number;
  approved_at?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export default function LeaveRequests() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(
    null,
  );
  const [newRequest, setNewRequest] = useState({
    leave_type: "annual" as const,
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchLeaveRequests();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLeaveRequests();
      if (response.success && response.data) {
        setLeaveRequests(response.data);
      } else {
        toast.error(response.message || "Failed to load leave requests");
      }
    } catch (error) {
      toast.error("Failed to load leave requests");
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleAddRequest = async () => {
    if (!newRequest.start_date || !newRequest.end_date || !newRequest.reason) {
      toast.error("All fields are required");
      return;
    }

    const days_count = calculateDays(
      newRequest.start_date,
      newRequest.end_date,
    );

    try {
      const response = await apiService.createLeaveRequest({
        ...newRequest,
        days_count,
      });
      if (response.success) {
        toast.success("Leave request submitted successfully");
        fetchLeaveRequests();
        setNewRequest({
          leave_type: "annual",
          start_date: "",
          end_date: "",
          reason: "",
        });
        setShowAddDialog(false);
      } else {
        toast.error(response.message || "Failed to submit leave request");
      }
    } catch (error) {
      toast.error("Failed to submit leave request");
      console.error("Error creating leave request:", error);
    }
  };

  const handleApproveRequest = async (id: number) => {
    try {
      const response = await apiService.updateLeaveRequest(id, {
        status: "approved",
      });
      if (response.success) {
        toast.success("Leave request approved");
        fetchLeaveRequests();
      } else {
        toast.error(response.message || "Failed to approve request");
      }
    } catch (error) {
      toast.error("Failed to approve request");
      console.error("Error approving request:", error);
    }
  };

  const handleRejectRequest = async (id: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      const response = await apiService.updateLeaveRequest(id, {
        status: "rejected",
        comments: reason,
      });
      if (response.success) {
        toast.success("Leave request rejected");
        fetchLeaveRequests();
      } else {
        toast.error(response.message || "Failed to reject request");
      }
    } catch (error) {
      toast.error("Failed to reject request");
      console.error("Error rejecting request:", error);
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (!confirm("Are you sure you want to delete this leave request?")) return;

    try {
      const response = await apiService.deleteLeaveRequest(id);
      if (response.success) {
        toast.success("Leave request deleted successfully");
        fetchLeaveRequests();
      } else {
        toast.error(response.message || "Failed to delete request");
      }
    } catch (error) {
      toast.error("Failed to delete request");
      console.error("Error deleting request:", error);
    }
  };

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesSearch =
      (request.user_name &&
        request.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || request.status === statusFilter;
    const matchesType =
      typeFilter === "all" || request.leave_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "approved":
        return "bg-green-500/20 text-green-400";
      case "rejected":
        return "bg-red-500/20 text-red-400";
      case "cancelled":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "annual":
        return "bg-blue-500/20 text-blue-400";
      case "sick":
        return "bg-red-500/20 text-red-400";
      case "personal":
        return "bg-purple-500/20 text-purple-400";
      case "maternity":
        return "bg-pink-500/20 text-pink-400";
      case "emergency":
        return "bg-orange-500/20 text-orange-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === "pending").length,
    approved: leaveRequests.filter((r) => r.status === "approved").length,
    rejected: leaveRequests.filter((r) => r.status === "rejected").length,
    this_month: leaveRequests.filter((r) => {
      const requestDate = new Date(r.start_date);
      const currentDate = new Date();
      return (
        requestDate.getMonth() === currentDate.getMonth() &&
        requestDate.getFullYear() === currentDate.getFullYear()
      );
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
                placeholder="Search leave requests..."
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
              Leave Requests
            </h1>
            <p className="text-gray-400 text-sm">
              Manage employee leave requests and approvals
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-accent text-black hover:bg-accent/80">
                <Plus className="w-4 h-4 mr-2" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-dashboard-surface border-dashboard-border max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Submit Leave Request
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-400">Leave Type</Label>
                  <Select
                    value={newRequest.leave_type}
                    onValueChange={(value: any) =>
                      setNewRequest({ ...newRequest, leave_type: value })
                    }
                  >
                    <SelectTrigger className="bg-dashboard-bg border-dashboard-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="personal">Personal Leave</SelectItem>
                      <SelectItem value="maternity">Maternity Leave</SelectItem>
                      <SelectItem value="emergency">Emergency Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-400">
                      Start Date *
                    </Label>
                    <Input
                      type="date"
                      value={newRequest.start_date}
                      onChange={(e) =>
                        setNewRequest({
                          ...newRequest,
                          start_date: e.target.value,
                        })
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">End Date *</Label>
                    <Input
                      type="date"
                      value={newRequest.end_date}
                      onChange={(e) =>
                        setNewRequest({
                          ...newRequest,
                          end_date: e.target.value,
                        })
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white"
                    />
                  </div>
                </div>
                {newRequest.start_date && newRequest.end_date && (
                  <div className="text-sm text-gray-400">
                    Duration:{" "}
                    {calculateDays(newRequest.start_date, newRequest.end_date)}{" "}
                    day(s)
                  </div>
                )}
                <div>
                  <Label className="text-sm text-gray-400">Reason *</Label>
                  <Textarea
                    value={newRequest.reason}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, reason: e.target.value })
                    }
                    className="bg-dashboard-bg border-dashboard-border text-white resize-none"
                    placeholder="Please provide a reason for your leave request"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddRequest}
                    className="bg-accent text-black hover:bg-accent/80 flex-1"
                  >
                    Submit Request
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: "Total Requests", value: stats.total, color: "blue" },
            { label: "Pending", value: stats.pending, color: "yellow" },
            { label: "Approved", value: stats.approved, color: "green" },
            { label: "Rejected", value: stats.rejected, color: "red" },
            { label: "This Month", value: stats.this_month, color: "purple" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
              className="bg-card border border-dashboard-border rounded-lg p-4"
            >
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-dashboard-surface border-dashboard-border">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48 bg-dashboard-surface border-dashboard-border">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="annual">Annual Leave</SelectItem>
              <SelectItem value="sick">Sick Leave</SelectItem>
              <SelectItem value="personal">Personal Leave</SelectItem>
              <SelectItem value="maternity">Maternity Leave</SelectItem>
              <SelectItem value="emergency">Emergency Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leave Requests Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-card border border-dashboard-border rounded-lg overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              Loading leave requests...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dashboard-border bg-dashboard-surface">
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Requested
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashboard-border">
                  {filteredRequests.map((request, index) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="hover:bg-dashboard-surface/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-black" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {request.user_name || `User ${request.user_id}`}
                            </div>
                            <div className="text-xs text-gray-400 max-w-xs truncate">
                              {request.reason}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge
                          className={`${getTypeColor(request.leave_type)} border-0 capitalize`}
                        >
                          {request.leave_type.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-300">
                            {new Date(request.start_date).toLocaleDateString()}{" "}
                            - {new Date(request.end_date).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-300">
                          {request.days_count}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <Badge
                            className={`${getStatusColor(request.status)} border-0 capitalize`}
                          >
                            {request.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-300">
                          {new Date(request.created_at).toLocaleDateString()}
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
                            {request.status === "pending" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleApproveRequest(request.id)
                                  }
                                  className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRejectRequest(request.id)
                                  }
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteRequest(request.id)}
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
      </div>
    </div>
  );
}
