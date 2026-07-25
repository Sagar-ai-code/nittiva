import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Users,
  Calendar,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  Star,
  Play,
  ChevronDown,
  Sparkles,
  Clock,
  Globe,
  Smartphone,
  Target,
  TrendingUp,
  MessageSquare,
  FileText,
  Briefcase,
  Award,
  CheckCircle,
  ChevronRight,
  Quote,
  StickyNote,
  ListTodo,
  Plane,
  BellRing,
  Building,
  Video,
  Database,
  Settings,
  Workflow,
  Brain,
  Search,
  Filter,
  Edit3,
  Layers,
  Timer,
  UserCheck,
  GitBranch,
  Palette,
  Upload,
  Eye,
  Archive,
  Pin,
  Flag,
  Send,
  Shield as ShieldIcon,
  Lock,
  Repeat,
  Download,
  Clipboard,
  Mail,
  Phone,
  Map,
  Calendar as CalendarIcon,
  Heart,
  TrendingDown,
  Activity,
  PieChart,
  BarChart,
  LineChart,
  Headphones,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const pricingPlans = [
    {
      name: "Starter",
      price: "FREE",
      period: "forever",
      description: "Perfect for startups and small teams exploring NITTIVA",
      features: [
        "Up to 10 team members",
        "5 active projects",
        "Core task management",
        "Basic collaboration tools",
        "5GB secure storage",
        "Community support",
        "Essential reporting",
        "Mobile & web access",
        "Basic automation",
        "Email notifications",
        "File sharing",
        "Standard integrations",
      ],
      highlighted: false,
      buttonText: "Start Free",
      buttonVariant: "outline" as const,
      badgeText: "No Credit Card",
      badgeColor: "bg-green-500",
    },
    {
      name: "Professional",
      price: "$19",
      period: "per user/month",
      description: "Comprehensive solution for growing businesses",
      features: [
        "Everything in Starter, plus:",
        "Unlimited team members",
        "Unlimited projects",
        "Advanced workflow automation",
        "AI-powered insights",
        "Custom fields & templates",
        "Advanced analytics suite",
        "Priority support",
        "50GB storage per user",
        "Advanced integrations",
        "Project dependencies",
        "Role-based permissions",
        "Client portal access",
        "Custom branding",
        "Meeting management",
        "Knowledge base",
        "Leave management",
        "Time tracking",
      ],
      highlighted: true,
      buttonText: "Start 30-Day Trial",
      buttonVariant: "default" as const,
      badgeText: "Most Popular",
      badgeColor: "bg-green-500",
    },
    {
      name: "Business",
      price: "$39",
      period: "per user/month",
      description: "Enterprise-ready features for scaling organizations",
      features: [
        "Everything in Professional, plus:",
        "Advanced security controls",
        "SSO & SAML integration",
        "Custom workflow engine",
        "Predictive analytics",
        "Advanced reporting suite",
        "API & webhook access",
        "200GB storage per user",
        "Phone & chat support",
        "Custom integrations",
        "Portfolio management",
        "Resource optimization",
        "Financial management",
        "Compliance tools",
        "Advanced notifications",
        "Custom dashboards",
        "White-label options",
      ],
      highlighted: false,
      buttonText: "Start 30-Day Trial",
      buttonVariant: "outline" as const,
      badgeText: "Best Value",
      badgeColor: "bg-blue-500",
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "Tailored NITTIVA solutions for large enterprises",
      features: [
        "Everything in Business, plus:",
        "Unlimited storage",
        "Dedicated success manager",
        "Custom implementation",
        "Advanced compliance (SOC 2, HIPAA)",
        "Custom development",
        "Private cloud deployment",
        "Advanced analytics & BI",
        "24/7 enterprise support",
        "Custom SLA agreements",
        "Multi-tenant architecture",
        "Disaster recovery",
        "Audit trails",
        "Custom training programs",
        "Global deployment",
        "Regulatory compliance",
      ],
      highlighted: false,
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      badgeText: "Enterprise",
      badgeColor: "bg-purple-500",
    },
  ];

  const coreFeatures = [
    {
      icon: CheckCircle,
      title: "Advanced Task Management",
      description:
        "Streamline workflows with NITTIVA's intelligent task management system",
      features: [
        "Smart Kanban boards",
        "Automated workflows",
        "AI-powered priorities",
        "Smart notifications",
      ],
    },
    {
      icon: Users,
      title: "Enterprise Collaboration",
      description:
        "Connect teams globally with NITTIVA's advanced collaboration suite",
      features: [
        "Unified communications",
        "Secure file sharing",
        "Virtual workspaces",
        "Real-time activity tracking",
      ],
    },
    {
      icon: Calendar,
      title: "Integrated Meeting Suite",
      description:
        "Transform meeting productivity with NITTIVA's comprehensive meeting management",
      features: [
        "Smart scheduling",
        "HD video conferencing",
        "AI meeting summaries",
        "Action item tracking",
      ],
    },
    {
      icon: Briefcase,
      title: "Client Success Platform",
      description:
        "Elevate client relationships with NITTIVA's CRM capabilities",
      features: [
        "360° client view",
        "Automated billing",
        "Relationship insights",
        "Success metrics",
      ],
    },
    {
      icon: StickyNote,
      title: "Knowledge Management",
      description:
        "Centralize organizational knowledge with NITTIVA's documentation system",
      features: [
        "AI-powered search",
        "Smart templates",
        "Version control",
        "Knowledge base",
      ],
    },
    {
      icon: BarChart3,
      title: "Business Intelligence",
      description:
        "Make data-driven decisions with NITTIVA's advanced analytics",
      features: [
        "Predictive dashboards",
        "Real-time insights",
        "Custom reporting",
        "Performance forecasting",
      ],
    },
  ];

  const advancedFeatures = [
    {
      icon: Timer,
      title: "Intelligent Time Tracking",
      description:
        "NITTIVA's AI-powered time tracking provides accurate project insights and productivity analytics",
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: ListTodo,
      title: "Smart Task Automation",
      description:
        "Automate routine tasks and focus on strategic work with NITTIVA's intelligent workflows",
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: Plane,
      title: "HR Management Suite",
      description:
        "Comprehensive leave management, attendance tracking, and employee lifecycle management",
      color: "from-purple-500 to-violet-600",
    },
    {
      icon: BellRing,
      title: "Contextual Notifications",
      description:
        "AI-driven notifications that deliver the right information at the perfect moment",
      color: "from-orange-500 to-red-600",
    },
    {
      icon: Building,
      title: "Multi-Tenant Architecture",
      description:
        "Scale across departments, locations, and business units with enterprise-grade workspace management",
      color: "from-teal-500 to-cyan-600",
    },
    {
      icon: Shield,
      title: "Zero-Trust Security",
      description:
        "Bank-level security with SOC 2 compliance, encryption, and granular access controls",
      color: "from-red-500 to-pink-600",
    },
  ];

  const integrations = [
    "Microsoft 365",
    "Google Workspace",
    "Salesforce CRM",
    "ServiceNow",
    "SAP ERP",
    "Oracle Cloud",
    "Microsoft Teams",
    "Slack Enterprise",
    "Zoom Enterprise",
    "Jira Enterprise",
    "Confluence",
    "GitHub Enterprise",
    "GitLab Enterprise",
    "Azure DevOps",
    "AWS Services",
    "Microsoft Azure",
    "Google Cloud",
    "Tableau",
    "Power BI",
    "QuickBooks",
    "NetSuite",
    "HubSpot Enterprise",
    "Workday",
    "OKTA SSO",
    "Active Directory",
    "DocuSign",
    "Adobe Creative Cloud",
    "Dropbox Business",
    "Box Enterprise",
    "Custom APIs",
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Chief Operations Officer",
      company: "Global Healthcare Solutions",
      content:
        "NITTIVA transformed our organization's efficiency. We've seen a 60% improvement in project delivery times and enhanced collaboration across 15 countries.",
      rating: 5,
      avatar: "👩‍💼",
    },
    {
      name: "Marcus Rodriguez",
      role: "VP of Engineering",
      company: "InnovateTech Corp",
      content:
        "NITTIVA's AI-powered insights and seamless integrations have revolutionized our development lifecycle. It's not just a tool—it's our competitive advantage.",
      rating: 5,
      avatar: "👨‍💻",
    },
    {
      name: "Emily Johnson",
      role: "Chief Executive Officer",
      company: "Future Dynamics Ltd",
      content:
        "Since implementing NITTIVA, we've scaled from 50 to 500 employees while maintaining operational excellence. The platform grows with us.",
      rating: 5,
      avatar: "👩‍🚀",
    },
  ];

  const faqs = [
    {
      question: "How can I get started with NITTIVA?",
      answer:
        "Getting started is simple! Sign up for our free Starter plan to explore NITTIVA with up to 10 team members. For full enterprise features, start a 30-day free trial of our Professional or Business plans. Our onboarding team will guide you through setup and migration.",
    },
    {
      question: "How does NITTIVA's pricing work for growing teams?",
      answer:
        "NITTIVA uses flexible, prorated billing. Add team members anytime and pay only for the remaining billing period. Remove members and receive automatic credits. Scale up or down without penalties, and enjoy volume discounts for large teams.",
    },
    {
      question: "Can NITTIVA integrate with our existing enterprise systems?",
      answer:
        "Absolutely! NITTIVA offers 200+ enterprise integrations including Salesforce, SAP, Microsoft 365, Google Workspace, and custom APIs. Our Professional Services team provides white-glove migration support from any platform including legacy systems.",
    },
    {
      question: "How secure is NITTIVA for enterprise data?",
      answer:
        "NITTIVA exceeds enterprise security standards with SOC 2 Type II compliance, end-to-end encryption, zero-trust architecture, and regular penetration testing. We support GDPR, HIPAA, and other regulatory requirements with audit trails and data residency options.",
    },
    {
      question: "What kind of support does NITTIVA provide?",
      answer:
        "NITTIVA provides tiered support: Community support for Starter, Priority email/chat for Professional, Phone support for Business, and 24/7 dedicated support with SLA guarantees for Enterprise. All plans include our comprehensive knowledge base and training resources.",
    },
    {
      question: "Can NITTIVA be customized for our organization?",
      answer:
        "Yes! Professional plans include custom branding and workflows. Business plans add white-label options and custom integrations. Enterprise plans offer complete customization including private cloud deployment, custom development, and dedicated instance management.",
    },
  ];

  return (
    <div className="min-h-screen bg-black overflow-auto">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-3">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F9904588c60fb490e85274cacb675da8b%2F3b2338ca45e44b4c92f4630003d43891?format=webp&width=800"
                  alt="NITTIVA"
                  className="h-8 w-auto hover:opacity-80 transition-opacity"
                />
              </Link>
              <div className="hidden lg:flex items-center space-x-6">
                <a
                  href="#features"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-gray-300 hover:text-green-400 font-medium transition-colors cursor-pointer"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("pricing")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-gray-300 hover:text-green-400 font-medium transition-colors cursor-pointer"
                >
                  Pricing
                </a>
                <a
                  href="#integrations"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("integrations")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-gray-300 hover:text-green-400 font-medium transition-colors cursor-pointer"
                >
                  Integrations
                </a>
                <a
                  href="#testimonials"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("testimonials")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-gray-300 hover:text-green-400 font-medium transition-colors cursor-pointer"
                >
                  Reviews
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin/login" className="mr-2">
                <Button
                  variant="outline"
                  className="bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Login
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-green-600 hover:bg-green-700 text-white px-6">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-blue-500/10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2">
              ✨ NITTIVA - Complete Business Management Platform
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
              Streamline Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                Business Operations
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              NITTIVA empowers businesses with comprehensive project management,
              team collaboration, client relations, and operational excellence
              in one unified, intelligent platform designed for modern
              enterprises.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-4 text-lg"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col items-center space-y-4 text-gray-400 text-sm">
              <div className="flex items-center space-x-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span>4.9/5 from 10,000+ reviews</span>
              </div>
              <div>
                ✅ Free forever plan • No credit card required • 14-day Pro
                trial
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Features Section */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
              Core Features
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Comprehensive project management tools designed for modern teams
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gray-800/50 border-gray-700 hover:border-green-500/50 transition-all duration-300 h-full backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-black" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.features.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex items-center text-sm text-gray-300"
                        >
                          <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
              Advanced Features
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Powerful tools for growing teams
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Advanced features to scale your business and streamline operations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advancedFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300 h-full backdrop-blur-sm group">
                  <CardContent className="p-6">
                    <div
                      className={`w-full h-24 bg-gradient-to-br ${feature.color} rounded-lg mb-6 flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              See it in action
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Beautiful, intuitive interface designed for productivity
            </p>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="relative max-w-6xl mx-auto"
          >
            <div className="relative rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-2xl">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>

              {/* Simulated Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Stats Cards */}
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-2xl font-bold text-green-400">
                      24
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">Active Projects</div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-2xl font-bold text-blue-400">
                      142
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">Tasks Completed</div>
                </div>

                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-2xl font-bold text-purple-400">
                      18
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">Team Members</div>
                </div>

                <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Timer className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-2xl font-bold text-orange-400">
                      285h
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">Time Tracked</div>
                </div>
              </div>

              {/* Task List Preview */}
              <div className="mt-6 bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-white font-medium mb-4">Recent Tasks</h3>
                <div className="space-y-3">
                  {[
                    {
                      title: "Design new landing page",
                      status: "In Progress",
                      priority: "High",
                    },
                    {
                      title: "Review client requirements",
                      status: "Completed",
                      priority: "Medium",
                    },
                    {
                      title: "Team meeting preparation",
                      status: "Pending",
                      priority: "Low",
                    },
                  ].map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-600/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            task.status === "Completed"
                              ? "bg-green-400"
                              : task.status === "In Progress"
                                ? "bg-blue-400"
                                : "bg-gray-400"
                          }`}
                        ></div>
                        <span className="text-gray-300">{task.title}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={`text-xs ${
                            task.priority === "High"
                              ? "bg-red-500/20 text-red-400"
                              : task.priority === "Medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {task.priority}
                        </Badge>
                        <Badge
                          className={`text-xs ${
                            task.status === "Completed"
                              ? "bg-green-500/20 text-green-400"
                              : task.status === "In Progress"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
              Simple Pricing
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Plans that grow with your team
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  className={`relative h-full backdrop-blur-sm transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-green-500/10 border-green-500 shadow-lg shadow-green-500/20 scale-105"
                      : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
                  }`}
                >
                  {plan.badgeText && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge
                        className={`${plan.badgeColor} text-white px-3 py-1`}
                      >
                        {plan.badgeText}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-white">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-white">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="text-gray-400 text-sm ml-1">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 mb-6 text-sm">
                      {plan.description}
                    </p>
                    <Button
                      variant={plan.buttonVariant}
                      className={`w-full mb-6 ${
                        plan.highlighted
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : plan.buttonVariant === "outline"
                            ? "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                            : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                      }`}
                    >
                      {plan.buttonText}
                    </Button>
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <Check className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section
        id="integrations"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
              Integrations
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Connect your favorite tools
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Seamlessly integrate with the tools your team already uses and
              loves
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12">
            {integrations.map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                viewport={{ once: true }}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center hover:border-green-500/50 transition-all duration-200 hover:bg-gray-700/50"
              >
                <div className="w-8 h-8 bg-gray-600 rounded mx-auto mb-2"></div>
                <div className="text-sm font-medium text-gray-300">
                  {integration}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              className="border-green-500/50 text-green-400 hover:bg-green-500/10"
            >
              View All Integrations
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">
              Testimonials
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Loved by teams worldwide
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              See what our customers say about their experience with TaskManager
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gray-800/50 border-gray-700 h-full backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-6 italic text-lg leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-2xl mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {testimonial.role}, {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  10,000+
                </div>
                <div className="text-gray-400 text-sm">Happy Customers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  99.9%
                </div>
                <div className="text-gray-400 text-sm">Uptime SLA</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  4.9/5
                </div>
                <div className="text-gray-400 text-sm">Customer Rating</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400 mb-2">
                  24/7
                </div>
                <div className="text-gray-400 text-sm">Support Available</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-gray-500/20 text-gray-400 border-gray-500/30">
              FAQ
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
              Frequently asked questions
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to know about TaskManager
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-0">
                    <button
                      onClick={() =>
                        setOpenFaq(openFaq === index ? null : index)
                      }
                      className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-700/50 transition-colors"
                    >
                      <span className="font-semibold text-white pr-4">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transform transition-transform ${
                          openFaq === index ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-6">
                        <p className="text-gray-400 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              Ready to transform your business?
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Join industry leaders who have revolutionized their operations
              with NITTIVA's comprehensive business management platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
              >
                Contact Sales
              </Button>
            </div>
            <p className="text-green-100 text-sm mt-4">
              ✅ 14-day free trial • No credit card required • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center space-x-3 mb-4">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F9904588c60fb490e85274cacb675da8b%2F3b2338ca45e44b4c92f4630003d43891?format=webp&width=800"
                  alt="NITTIVA"
                  className="h-8 w-auto hover:opacity-80 transition-opacity"
                />
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed">
                NITTIVA empowers businesses with comprehensive management
                solutions. Transform your operations, enhance collaboration, and
                drive growth with our unified platform.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Integrations
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Solutions</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Project Management
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Team Collaboration
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Client Management
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Enterprise
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Templates
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Webinars
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-green-400 transition-colors"
                  >
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 NITTIVA. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-green-400 text-sm transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-green-400 text-sm transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-green-400 text-sm transition-colors"
              >
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
