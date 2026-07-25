import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Search,
  Phone,
  Video,
  UserPlus,
  Hash,
  Users,
  Settings,
  Star,
  Archive,
  Plus,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: number;
  sender: {
    id: number;
    name: string;
    avatar?: string;
    status: "online" | "away" | "busy" | "offline";
  };
  content: string;
  timestamp: Date;
  type: "text" | "file" | "image";
  edited?: boolean;
}

interface ChatChannel {
  id: number;
  name: string;
  type: "direct" | "channel";
  participants: number;
  lastMessage?: Message;
  unreadCount: number;
  isOnline?: boolean;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  status: "online" | "away" | "busy" | "offline";
  avatar?: string;
}

export default function Chat() {
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(
    null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  const [channels] = useState<ChatChannel[]>([
    {
      id: 1,
      name: "general",
      type: "channel",
      participants: 12,
      unreadCount: 3,
      lastMessage: {
        id: 1,
        sender: { id: 2, name: "Sarah Johnson", status: "online" },
        content: "Great work on the project everyone!",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        type: "text",
      },
    },
    {
      id: 2,
      name: "development",
      type: "channel",
      participants: 8,
      unreadCount: 0,
      lastMessage: {
        id: 2,
        sender: { id: 3, name: "Mike Chen", status: "online" },
        content: "Code review is ready for the new feature",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        type: "text",
      },
    },
    {
      id: 3,
      name: "Sarah Johnson",
      type: "direct",
      participants: 2,
      unreadCount: 1,
      isOnline: true,
      lastMessage: {
        id: 3,
        sender: { id: 2, name: "Sarah Johnson", status: "online" },
        content: "Can we schedule a quick call?",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        type: "text",
      },
    },
    {
      id: 4,
      name: "Mike Chen",
      type: "direct",
      participants: 2,
      unreadCount: 0,
      isOnline: true,
      lastMessage: {
        id: 4,
        sender: {
          id: 1,
          name: user?.first_name + " " + user?.last_name || "You",
          status: "online",
        },
        content: "Thanks for the code review!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        type: "text",
      },
    },
  ]);

  const [teamMembers] = useState<TeamMember[]>([
    {
      id: 1,
      name: user?.first_name + " " + user?.last_name || "You",
      role: "Product Manager",
      status: "online",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      role: "UX Designer",
      status: "online",
      avatar: "/api/placeholder/32/32",
    },
    {
      id: 3,
      name: "Mike Chen",
      role: "Senior Developer",
      status: "online",
      avatar: "/api/placeholder/32/32",
    },
    {
      id: 4,
      name: "Emma Wilson",
      role: "Marketing Lead",
      status: "away",
      avatar: "/api/placeholder/32/32",
    },
    {
      id: 5,
      name: "David Kim",
      role: "QA Engineer",
      status: "busy",
      avatar: "/api/placeholder/32/32",
    },
    {
      id: 6,
      name: "Lisa Garcia",
      role: "Project Manager",
      status: "offline",
      avatar: "/api/placeholder/32/32",
    },
  ]);

  // Initialize with a channel selected
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0]);
    }
  }, [channels, selectedChannel]);

  // Load messages for selected channel
  useEffect(() => {
    if (selectedChannel) {
      // Mock messages for demonstration
      const mockMessages: Message[] = [
        {
          id: 1,
          sender: { id: 2, name: "Sarah Johnson", status: "online" },
          content:
            "Hey everyone! Hope you're all having a great day. I wanted to share some updates from the design team.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          type: "text",
        },
        {
          id: 2,
          sender: { id: 3, name: "Mike Chen", status: "online" },
          content:
            "Thanks Sarah! Looking forward to the updates. The development team has been making good progress on the new features.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
          type: "text",
        },
        {
          id: 3,
          sender: {
            id: 1,
            name: user?.first_name + " " + user?.last_name || "You",
            status: "online",
          },
          content:
            "That's great to hear! Let's make sure we stay on track for the upcoming milestone.",
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          type: "text",
        },
        {
          id: 4,
          sender: { id: 2, name: "Sarah Johnson", status: "online" },
          content:
            "Absolutely! I'll have the mockups ready by tomorrow morning.",
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          type: "text",
        },
      ];
      setMessages(mockMessages);
    }
  }, [selectedChannel, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChannel) return;

    const message: Message = {
      id: Date.now(),
      sender: {
        id: user?.id || 1,
        name: user?.first_name + " " + user?.last_name || "You",
        status: "online",
      },
      content: newMessage.trim(),
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex h-screen bg-dashboard-bg text-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-dashboard-border bg-dashboard-surface flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dashboard-border">
          <h1 className="text-xl font-semibold mb-3">Team Chat</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-dashboard-bg border-dashboard-border"
            />
          </div>
        </div>

        {/* Channel/Chat List */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="chats" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
              <TabsTrigger value="chats">Chats</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>

            <TabsContent value="chats" className="mt-4">
              <div className="px-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-400">
                    CHANNELS
                  </h3>
                  <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {filteredChannels
                  .filter((c) => c.type === "channel")
                  .map((channel) => (
                    <motion.div
                      key={channel.id}
                      whileHover={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                      }}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer mb-1 ${
                        selectedChannel?.id === channel.id ? "bg-accent/20" : ""
                      }`}
                      onClick={() => setSelectedChannel(channel)}
                    >
                      <div className="w-8 h-8 bg-dashboard-border rounded-lg flex items-center justify-center">
                        <Hash className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{channel.name}</span>
                          {channel.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {channel.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {channel.lastMessage && (
                          <p className="text-sm text-gray-400 truncate">
                            {channel.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}

                <div className="flex items-center justify-between mb-3 mt-6">
                  <h3 className="text-sm font-medium text-gray-400">
                    DIRECT MESSAGES
                  </h3>
                  <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>

                {filteredChannels
                  .filter((c) => c.type === "direct")
                  .map((channel) => (
                    <motion.div
                      key={channel.id}
                      whileHover={{
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                      }}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer mb-1 ${
                        selectedChannel?.id === channel.id ? "bg-accent/20" : ""
                      }`}
                      onClick={() => setSelectedChannel(channel)}
                    >
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-dashboard-border text-xs">
                            {getInitials(channel.name)}
                          </AvatarFallback>
                        </Avatar>
                        {channel.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-dashboard-surface rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{channel.name}</span>
                          {channel.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {channel.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {channel.lastMessage && (
                          <p className="text-sm text-gray-400 truncate">
                            {channel.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="team" className="mt-4">
              <div className="px-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">
                  TEAM MEMBERS
                </h3>
                {teamMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    whileHover={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer mb-1"
                    onClick={() => {
                      // Find or create direct message channel
                      const existingChannel = channels.find(
                        (c) => c.type === "direct" && c.name === member.name,
                      );
                      if (existingChannel) {
                        setSelectedChannel(existingChannel);
                      }
                    }}
                  >
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-dashboard-border text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-dashboard-surface rounded-full ${getStatusColor(member.status)}`}
                      ></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-gray-400">{member.role}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-dashboard-border bg-dashboard-surface">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedChannel.type === "channel" ? (
                    <div className="w-8 h-8 bg-dashboard-border rounded-lg flex items-center justify-center">
                      <Hash className="w-4 h-4" />
                    </div>
                  ) : (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-dashboard-border text-xs">
                        {getInitials(selectedChannel.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <h2 className="font-semibold">{selectedChannel.name}</h2>
                    <p className="text-sm text-gray-400">
                      {selectedChannel.type === "channel"
                        ? `${selectedChannel.participants} members`
                        : selectedChannel.isOnline
                          ? "Online"
                          : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Star className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Users className="w-4 h-4 mr-2" />
                        View Members
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive Chat
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-dashboard-border text-xs">
                      {getInitials(message.sender.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{message.sender.name}</span>
                      <span className="text-xs text-gray-400">
                        {formatTime(message.timestamp)}
                      </span>
                      {message.edited && (
                        <span className="text-xs text-gray-500">(edited)</span>
                      )}
                    </div>
                    <div className="text-gray-200 whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-dashboard-border bg-dashboard-surface">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Textarea
                    placeholder={`Message ${selectedChannel.name}...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="min-h-[44px] max-h-32 bg-dashboard-bg border-dashboard-border resize-none pr-20"
                    rows={1}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="h-11 px-4 bg-accent hover:bg-accent/80"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-dashboard-border rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Welcome to Team Chat</h3>
              <p className="text-gray-400">
                Select a conversation to start chatting with your team
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
