import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Send,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Save,
  X,
  MoreVertical,
  User,
  Mail,
  Phone,
  MapPin,
  Printer,
  Settings,
  Clock,
  Upload,
  Image as ImageIcon,
  PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

interface OrganizationDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
}

interface InvoiceHeaders {
  item: string;
  quantity: string;
  unit: string;
  rate: string;
  amount: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  shipToAddress: string;
  issueDate: string;
  dueDate: string;
  paymentTerms: string;
  poNumber: string;
  status: "draft" | "sent" | "paid" | "overdue";
  items: InvoiceItem[];
  headers: InvoiceHeaders;
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  shipping: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes: string;
  terms: string;
  currency: string;
}

const defaultHeaders: InvoiceHeaders = {
  item: "Item",
  quantity: "Quantity",
  unit: "Unit",
  rate: "Rate",
  amount: "Amount",
};

const unitOptions = [
  "pcs",
  "pieces",
  "units",
  "items",
  "hrs",
  "hours",
  "days",
  "weeks",
  "months",
  "kg",
  "lbs",
  "grams",
  "tons",
  "m",
  "ft",
  "cm",
  "inches",
  "yards",
  "liters",
  "gallons",
  "ml",
  "cups",
  "sqft",
  "sqm",
  "acres",
  "sessions",
  "meetings",
  "calls",
  "licenses",
  "subscriptions",
  "users",
];

const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "INV-001",
    clientName: "Acme Corp",
    clientEmail: "billing@acme.com",
    clientAddress: "123 Business St, Suite 100\nNew York, NY 10001",
    shipToAddress: "123 Business St, Suite 100\nNew York, NY 10001",
    issueDate: "2024-01-15",
    dueDate: "2024-02-15",
    paymentTerms: "Net 30",
    poNumber: "PO-12345",
    status: "sent",
    items: [
      {
        id: "1",
        description: "Web Development",
        quantity: 40,
        unit: "hrs",
        rate: 150,
        amount: 6000,
      },
      {
        id: "2",
        description: "UI/UX Design",
        quantity: 20,
        unit: "hrs",
        rate: 120,
        amount: 2400,
      },
    ],
    headers: defaultHeaders,
    subtotal: 8400,
    tax: 840,
    taxRate: 10,
    discount: 0,
    shipping: 0,
    total: 9240,
    amountPaid: 0,
    balanceDue: 9240,
    notes: "Thank you for your business!",
    terms:
      "Payment is due within 30 days of invoice date. Late fees may apply.",
    currency: "USD",
  },
];

export default function Invoice() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [logo, setLogo] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCurrencyEdit, setShowCurrencyEdit] = useState(false);
  const [showHeaderEdit, setShowHeaderEdit] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState("");
  const [organizationDetails, setOrganizationDetails] =
    useState<OrganizationDetails>({
      name: "Your Company Name",
      address: "123 Business Street\nCity, State 12345",
      phone: "(555) 123-4567",
      email: "info@yourcompany.com",
      website: "www.yourcompany.com",
      taxId: "TAX-123456789",
    });

  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    invoiceNumber: `INV-${String(Date.now()).slice(-3)}`,
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    shipToAddress: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    paymentTerms: "Net 30",
    poNumber: "",
    status: "draft",
    items: [
      {
        id: "1",
        description: "",
        quantity: 1,
        unit: "pcs",
        rate: 0,
        amount: 0,
      },
    ],
    headers: { ...defaultHeaders },
    subtotal: 0,
    tax: 0,
    taxRate: 10,
    discount: 0,
    shipping: 0,
    total: 0,
    amountPaid: 0,
    balanceDue: 0,
    notes: "",
    terms:
      "Payment is due within 30 days of invoice date. Late fees may apply.",
    currency: "USD",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusColors = {
    draft: "bg-gray-500",
    sent: "bg-blue-500",
    paid: "bg-green-500",
    overdue: "bg-red-500",
  };

  const statusLabels = {
    draft: "Draft",
    sent: "Sent",
    paid: "Paid",
    overdue: "Overdue",
  };

  const currencies = [
    { value: "USD", label: "USD ($)", symbol: "$" },
    { value: "EUR", label: "EUR (€)", symbol: "€" },
    { value: "GBP", label: "GBP (£)", symbol: "£" },
    { value: "CAD", label: "CAD ($)", symbol: "C$" },
    { value: "JPY", label: "JPY (¥)", symbol: "¥" },
    { value: "AUD", label: "AUD ($)", symbol: "A$" },
    { value: "INR", label: "INR (₹)", symbol: "₹" },
    { value: "CHF", label: "CHF", symbol: "CHF" },
  ];

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addInvoiceItem = () => {
    if (!newInvoice.items) return;
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unit: "pcs",
      rate: 0,
      amount: 0,
    };
    setNewInvoice((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const updateInvoiceItem = (
    id: string,
    field: keyof InvoiceItem,
    value: any,
  ) => {
    if (!newInvoice.items) return;
    setNewInvoice((prev) => ({
      ...prev,
      items: prev.items?.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "rate") {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const removeInvoiceItem = (id: string) => {
    if (!newInvoice.items || newInvoice.items.length <= 1) return;
    setNewInvoice((prev) => ({
      ...prev,
      items: prev.items?.filter((item) => item.id !== id),
    }));
  };

  const addCustomCurrency = () => {
    if (!editingCurrency.trim()) return;
    const newCurrency = {
      value: editingCurrency.toUpperCase(),
      label: `${editingCurrency.toUpperCase()}`,
      symbol: editingCurrency.toUpperCase(),
    };

    // Add to currencies array (in a real app, this would be persisted)
    setEditingCurrency("");
    setShowCurrencyEdit(false);

    // Set the new currency for the current invoice
    setNewInvoice((prev) => ({ ...prev, currency: newCurrency.value }));
  };

  const updateInvoiceHeaders = (field: keyof InvoiceHeaders, value: string) => {
    setNewInvoice((prev) => ({
      ...prev,
      headers: {
        ...prev.headers,
        [field]: value,
      } as InvoiceHeaders,
    }));
  };

  const calculateTotals = () => {
    if (!newInvoice.items) return;
    const subtotal = newInvoice.items.reduce(
      (sum, item) => sum + (item.amount || 0),
      0,
    );
    const discount = newInvoice.discount || 0;
    const shipping = newInvoice.shipping || 0;
    const taxableAmount = subtotal - discount + shipping;
    const tax = (taxableAmount * (newInvoice.taxRate || 0)) / 100;
    const total = taxableAmount + tax;
    const amountPaid = newInvoice.amountPaid || 0;
    const balanceDue = total - amountPaid;

    setNewInvoice((prev) => ({
      ...prev,
      subtotal,
      tax,
      total,
      balanceDue,
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [
    newInvoice.items,
    newInvoice.discount,
    newInvoice.shipping,
    newInvoice.taxRate,
    newInvoice.amountPaid,
  ]);

  const saveInvoice = () => {
    if (!newInvoice.clientName || !newInvoice.items?.length) return;

    const invoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: newInvoice.invoiceNumber || `INV-${Date.now()}`,
      clientName: newInvoice.clientName,
      clientEmail: newInvoice.clientEmail || "",
      clientAddress: newInvoice.clientAddress || "",
      shipToAddress: newInvoice.shipToAddress || newInvoice.clientAddress || "",
      issueDate: newInvoice.issueDate || new Date().toISOString().split("T")[0],
      dueDate: newInvoice.dueDate || "",
      paymentTerms: newInvoice.paymentTerms || "Net 30",
      poNumber: newInvoice.poNumber || "",
      status: (newInvoice.status as Invoice["status"]) || "draft",
      items: newInvoice.items,
      headers: newInvoice.headers || defaultHeaders,
      subtotal: newInvoice.subtotal || 0,
      tax: newInvoice.tax || 0,
      taxRate: newInvoice.taxRate || 10,
      discount: newInvoice.discount || 0,
      shipping: newInvoice.shipping || 0,
      total: newInvoice.total || 0,
      amountPaid: newInvoice.amountPaid || 0,
      balanceDue: newInvoice.balanceDue || 0,
      notes: newInvoice.notes || "",
      terms: newInvoice.terms || "",
      currency: newInvoice.currency || "USD",
    };

    setInvoices((prev) => [...prev, invoice]);
    setIsCreating(false);
    resetNewInvoice();
  };

  const resetNewInvoice = () => {
    setNewInvoice({
      invoiceNumber: `INV-${String(Date.now()).slice(-3)}`,
      clientName: "",
      clientEmail: "",
      clientAddress: "",
      shipToAddress: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      paymentTerms: "Net 30",
      poNumber: "",
      status: "draft",
      items: [
        {
          id: "1",
          description: "",
          quantity: 1,
          unit: "pcs",
          rate: 0,
          amount: 0,
        },
      ],
      headers: { ...defaultHeaders },
      subtotal: 0,
      tax: 0,
      taxRate: 10,
      discount: 0,
      shipping: 0,
      total: 0,
      amountPaid: 0,
      balanceDue: 0,
      notes: "",
      terms:
        "Payment is due within 30 days of invoice date. Late fees may apply.",
      currency: "USD",
    });
  };

  const downloadInvoicePDF = (invoice: Invoice) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const invoiceHTML = generateInvoiceHTML(invoice);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .invoice-container { max-width: 800px; margin: 0 auto; background: white; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
            .logo-section { display: flex; align-items: center; gap: 20px; }
            .logo { height: 60px; width: auto; max-width: 120px; object-fit: contain; }
            .logo-placeholder { height: 60px; width: 80px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 12px; }
            .company-info h3 { margin: 0 0 8px 0; font-size: 18px; color: #333; }
            .company-info div { margin: 2px 0; color: #666; font-size: 14px; }
            .invoice-title { text-align: right; }
            .invoice-title h1 { font-size: 36px; margin: 0; color: #333; font-weight: bold; }
            .invoice-details { font-size: 14px; color: #666; margin-top: 10px; }
            .invoice-details div { margin: 3px 0; }
            .bill-ship { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
            .section-title { font-weight: bold; margin-bottom: 10px; font-size: 16px; color: #333; }
            .client-name { font-weight: bold; margin-bottom: 5px; }
            .client-address { color: #666; white-space: pre-line; font-size: 14px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th { background: #333; color: white; padding: 12px; text-align: left; font-weight: bold; }
            .items-table td { padding: 12px; border-bottom: 1px solid #ddd; }
            .items-table tr:nth-child(even) { background: #f9f9f9; }
            .items-table .text-center { text-align: center; }
            .items-table .text-right { text-align: right; }
            .totals { margin-left: auto; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; padding: 4px 0; }
            .total-line { border-top: 2px solid #333; padding-top: 8px; font-weight: bold; font-size: 16px; }
            .discount { color: #28a745; }
            .notes-terms { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; }
            .notes-terms .section-title { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
            .notes-terms p { color: #666; font-size: 13px; line-height: 1.4; margin: 0; }
            @media print { 
              body { margin: 0; } 
              .invoice-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          ${invoiceHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const generateInvoiceHTML = (invoice: Invoice) => {
    return `
      <div class="invoice-container">
        <div class="header">
          <div class="logo-section">
            ${
              logo
                ? `<img src="${logo}" alt="Company Logo" class="logo" />`
                : '<div class="logo-placeholder">LOGO</div>'
            }
            <div class="company-info">
              <h3>${organizationDetails.name}</h3>
              <div style="white-space: pre-line;">${organizationDetails.address}</div>
              <div>${organizationDetails.phone} | ${organizationDetails.email}</div>
              ${organizationDetails.website ? `<div>${organizationDetails.website}</div>` : ""}
            </div>
          </div>
          <div class="invoice-title">
            <h1>INVOICE</h1>
            <div class="invoice-details">
              <div># ${invoice.invoiceNumber}</div>
              <div>Date: ${invoice.issueDate}</div>
              <div>Payment Terms: ${invoice.paymentTerms}</div>
              <div>Due Date: ${invoice.dueDate}</div>
              ${invoice.poNumber ? `<div>P.O. Number: ${invoice.poNumber}</div>` : ""}
            </div>
          </div>
        </div>

        <div class="bill-ship">
          <div>
            <div class="section-title">Bill To</div>
            <div class="client-name">${invoice.clientName}</div>
            <div class="client-address">${invoice.clientAddress}</div>
          </div>
          <div>
            <div class="section-title">Ship To</div>
            <div class="client-address">${invoice.shipToAddress || "(optional)"}</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>${invoice.headers?.item || "Item"}</th>
              <th class="text-center">${invoice.headers?.quantity || "Quantity"}</th>
              <th class="text-center">${invoice.headers?.unit || "Unit"}</th>
              <th class="text-center">${invoice.headers?.rate || "Rate"}</th>
              <th class="text-right">${invoice.headers?.amount || "Amount"}</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item) => `
              <tr>
                <td>${item.description}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-center">${item.unit}</td>
                <td class="text-center">${getCurrencySymbol(invoice.currency)}${item.rate.toFixed(2)}</td>
                <td class="text-right">${getCurrencySymbol(invoice.currency)}${item.amount.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>${getCurrencySymbol(invoice.currency)}${invoice.subtotal.toFixed(2)}</span>
          </div>
          ${
            invoice.discount > 0
              ? `
            <div class="totals-row discount">
              <span>Discount:</span>
              <span>-${getCurrencySymbol(invoice.currency)}${invoice.discount.toFixed(2)}</span>
            </div>
          `
              : ""
          }
          ${
            invoice.shipping > 0
              ? `
            <div class="totals-row">
              <span>Shipping:</span>
              <span>${getCurrencySymbol(invoice.currency)}${invoice.shipping.toFixed(2)}</span>
            </div>
          `
              : ""
          }
          <div class="totals-row">
            <span>Tax (${invoice.taxRate}%):</span>
            <span>${getCurrencySymbol(invoice.currency)}${invoice.tax.toFixed(2)}</span>
          </div>
          <div class="totals-row total-line">
            <span>Total:</span>
            <span>${getCurrencySymbol(invoice.currency)}${invoice.total.toFixed(2)}</span>
          </div>
          ${
            invoice.amountPaid > 0
              ? `
            <div class="totals-row">
              <span>Amount Paid:</span>
              <span>${getCurrencySymbol(invoice.currency)}${invoice.amountPaid.toFixed(2)}</span>
            </div>
            <div class="totals-row" style="font-weight: bold;">
              <span>Balance Due:</span>
              <span>${getCurrencySymbol(invoice.currency)}${invoice.balanceDue.toFixed(2)}</span>
            </div>
          `
              : ""
          }
        </div>

        <div class="notes-terms">
          <div>
            <div class="section-title">Notes</div>
            <p>${invoice.notes || "Notes - any relevant information not already covered"}</p>
          </div>
          <div>
            <div class="section-title">Terms</div>
            <p>${invoice.terms}</p>
          </div>
        </div>
      </div>
    `;
  };

  const getCurrencySymbol = (currency: string) => {
    const currencyData = currencies.find((c) => c.value === currency);
    return currencyData?.symbol || currency;
  };

  const totalRevenue = invoices.reduce(
    (sum, invoice) => sum + invoice.total,
    0,
  );
  const paidInvoices = invoices.filter((inv) => inv.status === "paid");
  const pendingAmount = invoices
    .filter((inv) => inv.status === "sent")
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-full flex flex-col bg-dashboard-bg"
    >
      {/* Header */}
      <div className="p-6 border-b border-dashboard-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Invoice Management
              </h1>
              <p className="text-gray-400">
                Create, manage, and track your invoices
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-dashboard-border text-gray-300"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              className="bg-accent text-black hover:bg-accent/90"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Invoices</p>
                <p className="text-white text-xl font-semibold">
                  {invoices.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-white text-xl font-semibold">
                  ${totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Pending Amount</p>
                <p className="text-white text-xl font-semibold">
                  ${pendingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dashboard-surface border border-dashboard-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Paid Invoices</p>
                <p className="text-white text-xl font-semibold">
                  {paidInvoices.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-dashboard-surface border-dashboard-border text-white"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-dashboard-surface border-dashboard-border text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoice List */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-dashboard-border hover:bg-dashboard-surface/50">
                <TableHead className="text-gray-400">Invoice #</TableHead>
                <TableHead className="text-gray-400">Client</TableHead>
                <TableHead className="text-gray-400">Issue Date</TableHead>
                <TableHead className="text-gray-400">Due Date</TableHead>
                <TableHead className="text-gray-400">Amount</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="border-dashboard-border hover:bg-dashboard-surface/30 cursor-pointer"
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <TableCell className="text-white font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-white font-medium">
                        {invoice.clientName}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {invoice.clientEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {invoice.issueDate}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {invoice.dueDate}
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {getCurrencySymbol(invoice.currency)}
                    {invoice.total.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-white capitalize",
                        statusColors[invoice.status],
                      )}
                    >
                      {statusLabels[invoice.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-gray-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(invoice);
                          setIsPreviewing(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-gray-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadInvoicePDF(invoice);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-gray-400 hover:text-white"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-gray-400 hover:text-white"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No invoices found
              </h3>
              <p className="text-gray-400 mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating your first invoice"}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <Button
                  onClick={() => setIsCreating(true)}
                  className="bg-accent text-black hover:bg-accent/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Organization Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md bg-dashboard-surface border-dashboard-border">
          <DialogHeader>
            <DialogTitle className="text-white">
              Organization Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Company Logo</Label>
              <div className="flex items-center gap-3">
                {logo ? (
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-16 w-16 object-contain border rounded bg-white p-1"
                  />
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed border-gray-400 rounded flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="space-y-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                    className="border-dashboard-border text-gray-300"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                  {logo && (
                    <Button
                      onClick={() => setLogo(null)}
                      variant="outline"
                      size="sm"
                      className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Company Name"
                value={organizationDetails.name}
                onChange={(e) =>
                  setOrganizationDetails((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="bg-dashboard-bg border-dashboard-border text-white"
              />
              <Textarea
                placeholder="Address"
                value={organizationDetails.address}
                onChange={(e) =>
                  setOrganizationDetails((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                className="bg-dashboard-bg border-dashboard-border text-white"
              />
              <Input
                placeholder="Phone"
                value={organizationDetails.phone}
                onChange={(e) =>
                  setOrganizationDetails((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                className="bg-dashboard-bg border-dashboard-border text-white"
              />
              <Input
                placeholder="Email"
                value={organizationDetails.email}
                onChange={(e) =>
                  setOrganizationDetails((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className="bg-dashboard-bg border-dashboard-border text-white"
              />
              <Input
                placeholder="Website"
                value={organizationDetails.website}
                onChange={(e) =>
                  setOrganizationDetails((prev) => ({
                    ...prev,
                    website: e.target.value,
                  }))
                }
                className="bg-dashboard-bg border-dashboard-border text-white"
              />
              <Input
                placeholder="Tax ID"
                value={organizationDetails.taxId}
                onChange={(e) =>
                  setOrganizationDetails((prev) => ({
                    ...prev,
                    taxId: e.target.value,
                  }))
                }
                className="bg-dashboard-bg border-dashboard-border text-white"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setShowSettings(false)}
                className="bg-accent text-black hover:bg-accent/90"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-dashboard-surface border-dashboard-border">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Invoice</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Invoice Details */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Invoice Number</Label>
                <Input
                  value={newInvoice.invoiceNumber || ""}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({
                      ...prev,
                      invoiceNumber: e.target.value,
                    }))
                  }
                  className="bg-dashboard-bg border-dashboard-border text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Currency</Label>
                <div className="flex gap-2">
                  <Select
                    value={newInvoice.currency || "USD"}
                    onValueChange={(value) =>
                      setNewInvoice((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger className="flex-1 bg-dashboard-bg border-dashboard-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Popover
                    open={showCurrencyEdit}
                    onOpenChange={setShowCurrencyEdit}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dashboard-border text-gray-300"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 bg-dashboard-surface border-dashboard-border">
                      <div className="space-y-3">
                        <h4 className="font-medium text-white">
                          Add Custom Currency
                        </h4>
                        <Input
                          placeholder="Currency Code (e.g., SGD, INR)"
                          value={editingCurrency}
                          onChange={(e) => setEditingCurrency(e.target.value)}
                          className="bg-dashboard-bg border-dashboard-border text-white"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={addCustomCurrency}
                            size="sm"
                            className="bg-accent text-black hover:bg-accent/90"
                          >
                            Add
                          </Button>
                          <Button
                            onClick={() => setShowCurrencyEdit(false)}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Status</Label>
                <Select
                  value={newInvoice.status || "draft"}
                  onValueChange={(value) =>
                    setNewInvoice((prev) => ({
                      ...prev,
                      status: value as Invoice["status"],
                    }))
                  }
                >
                  <SelectTrigger className="bg-dashboard-bg border-dashboard-border text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bill To / Ship To */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Bill To</h3>
                <Input
                  placeholder="Client Name"
                  value={newInvoice.clientName || ""}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({
                      ...prev,
                      clientName: e.target.value,
                    }))
                  }
                  className="bg-dashboard-bg border-dashboard-border text-white"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newInvoice.clientEmail || ""}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({
                      ...prev,
                      clientEmail: e.target.value,
                    }))
                  }
                  className="bg-dashboard-bg border-dashboard-border text-white"
                />
                <Textarea
                  placeholder="Client Address"
                  value={newInvoice.clientAddress || ""}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({
                      ...prev,
                      clientAddress: e.target.value,
                    }))
                  }
                  className="bg-dashboard-bg border-dashboard-border text-white"
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Ship To</h3>
                <Textarea
                  placeholder="Ship To Address (optional)"
                  value={newInvoice.shipToAddress || ""}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({
                      ...prev,
                      shipToAddress: e.target.value,
                    }))
                  }
                  className="bg-dashboard-bg border-dashboard-border text-white h-[120px]"
                />
              </div>
            </div>

            {/* Dates and Terms */}
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Issue Date</Label>
                <Input
                  type="date"
                  value={newInvoice.issueDate || ""}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({
                      ...prev,
                      issueDate: e.target.value,
                    }))
                  }
                  className="bg-dashboard-bg border-dashboard-border text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Payment Terms</Label>
                <Select
                  value={newInvoice.paymentTerms || "Net 30"}
                  onValueChange={(value) =>
                    setNewInvoice((prev) => ({ ...prev, paymentTerms: value }))
                  }
                >
                  <SelectTrigger className="bg-dashboard-bg border-dashboard-border text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Due on Receipt">
                      Due on Receipt
                    </SelectItem>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Due Date</Label>
                <Input
                  type="date"
                  value={newInvoice.dueDate || ""}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                  className="bg-dashboard-bg border-dashboard-border text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">P.O. Number</Label>
                <Input
                  placeholder="P.O. Number"
                  value={newInvoice.poNumber || ""}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({
                      ...prev,
                      poNumber: e.target.value,
                    }))
                  }
                  className="bg-dashboard-bg border-dashboard-border text-white"
                />
              </div>
            </div>

            {/* Customize Table Headers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">
                  Invoice Items
                </h3>
                <Popover open={showHeaderEdit} onOpenChange={setShowHeaderEdit}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-dashboard-border text-gray-300"
                    >
                      <PenTool className="w-4 h-4 mr-2" />
                      Customize Headers
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 bg-dashboard-surface border-dashboard-border">
                    <div className="space-y-4">
                      <h4 className="font-medium text-white">
                        Customize Table Headers
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-gray-400">
                            Item Column
                          </Label>
                          <Input
                            value={newInvoice.headers?.item || "Item"}
                            onChange={(e) =>
                              updateInvoiceHeaders("item", e.target.value)
                            }
                            className="bg-dashboard-bg border-dashboard-border text-white text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">
                            Quantity Column
                          </Label>
                          <Input
                            value={newInvoice.headers?.quantity || "Quantity"}
                            onChange={(e) =>
                              updateInvoiceHeaders("quantity", e.target.value)
                            }
                            className="bg-dashboard-bg border-dashboard-border text-white text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">
                            Unit Column
                          </Label>
                          <Input
                            value={newInvoice.headers?.unit || "Unit"}
                            onChange={(e) =>
                              updateInvoiceHeaders("unit", e.target.value)
                            }
                            className="bg-dashboard-bg border-dashboard-border text-white text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">
                            Rate Column
                          </Label>
                          <Input
                            value={newInvoice.headers?.rate || "Rate"}
                            onChange={(e) =>
                              updateInvoiceHeaders("rate", e.target.value)
                            }
                            className="bg-dashboard-bg border-dashboard-border text-white text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">
                            Amount Column
                          </Label>
                          <Input
                            value={newInvoice.headers?.amount || "Amount"}
                            onChange={(e) =>
                              updateInvoiceHeaders("amount", e.target.value)
                            }
                            className="bg-dashboard-bg border-dashboard-border text-white text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => setShowHeaderEdit(false)}
                          size="sm"
                          className="bg-accent text-black hover:bg-accent/90"
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-3">
                {/* Table Header Preview */}
                <div className="grid grid-cols-12 gap-3 p-3 bg-dashboard-bg border border-dashboard-border rounded-md">
                  <div className="col-span-4 text-sm text-gray-400 font-medium">
                    {newInvoice.headers?.item || "Item"}
                  </div>
                  <div className="col-span-2 text-sm text-gray-400 font-medium text-center">
                    {newInvoice.headers?.quantity || "Quantity"}
                  </div>
                  <div className="col-span-2 text-sm text-gray-400 font-medium text-center">
                    {newInvoice.headers?.unit || "Unit"}
                  </div>
                  <div className="col-span-2 text-sm text-gray-400 font-medium text-center">
                    {newInvoice.headers?.rate || "Rate"}
                  </div>
                  <div className="col-span-2 text-sm text-gray-400 font-medium text-right">
                    {newInvoice.headers?.amount || "Amount"}
                  </div>
                </div>

                {newInvoice.items?.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-3 p-3 bg-dashboard-bg border border-dashboard-border rounded-md"
                  >
                    <div className="col-span-4">
                      <Input
                        placeholder={`${newInvoice.headers?.item || "Item"} description...`}
                        value={item.description}
                        onChange={(e) =>
                          updateInvoiceItem(
                            item.id,
                            "description",
                            e.target.value,
                          )
                        }
                        className="bg-dashboard-surface border-dashboard-border text-white text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateInvoiceItem(
                            item.id,
                            "quantity",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="bg-dashboard-surface border-dashboard-border text-white text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={item.unit}
                        onValueChange={(value) =>
                          updateInvoiceItem(item.id, "unit", value)
                        }
                      >
                        <SelectTrigger className="bg-dashboard-surface border-dashboard-border text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={item.rate}
                        onChange={(e) =>
                          updateInvoiceItem(
                            item.id,
                            "rate",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="bg-dashboard-surface border-dashboard-border text-white text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        value={`${getCurrencySymbol(newInvoice.currency || "USD")}${item.amount.toFixed(2)}`}
                        readOnly
                        className="bg-dashboard-surface border-dashboard-border text-gray-400 text-sm"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {(newInvoice.items?.length || 0) > 1 && (
                        <Button
                          onClick={() => removeInvoiceItem(item.id)}
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  onClick={addInvoiceItem}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            {/* Totals and Additional Charges */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">
                  Additional Charges
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-gray-400">Tax Rate (%)</Label>
                    <Input
                      type="number"
                      value={newInvoice.taxRate || 0}
                      onChange={(e) =>
                        setNewInvoice((prev) => ({
                          ...prev,
                          taxRate: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">Discount</Label>
                    <Input
                      type="number"
                      value={newInvoice.discount || 0}
                      onChange={(e) =>
                        setNewInvoice((prev) => ({
                          ...prev,
                          discount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">Shipping</Label>
                    <Input
                      type="number"
                      value={newInvoice.shipping || 0}
                      onChange={(e) =>
                        setNewInvoice((prev) => ({
                          ...prev,
                          shipping: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400">Amount Paid</Label>
                    <Input
                      type="number"
                      value={newInvoice.amountPaid || 0}
                      onChange={(e) =>
                        setNewInvoice((prev) => ({
                          ...prev,
                          amountPaid: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="bg-dashboard-bg border-dashboard-border text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-dashboard-bg border border-dashboard-border rounded-md">
                <h3 className="text-lg font-medium text-white">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="text-white">
                      {getCurrencySymbol(newInvoice.currency || "USD")}
                      {(newInvoice.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  {(newInvoice.discount || 0) > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount:</span>
                      <span>
                        -{getCurrencySymbol(newInvoice.currency || "USD")}
                        {(newInvoice.discount || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {(newInvoice.shipping || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping:</span>
                      <span className="text-white">
                        {getCurrencySymbol(newInvoice.currency || "USD")}
                        {(newInvoice.shipping || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Tax ({newInvoice.taxRate || 0}%):
                    </span>
                    <span className="text-white">
                      {getCurrencySymbol(newInvoice.currency || "USD")}
                      {(newInvoice.tax || 0).toFixed(2)}
                    </span>
                  </div>
                  <Separator className="bg-dashboard-border" />
                  <div className="flex justify-between text-lg font-medium">
                    <span className="text-white">Total:</span>
                    <span className="text-accent">
                      {getCurrencySymbol(newInvoice.currency || "USD")}
                      {(newInvoice.total || 0).toFixed(2)}
                    </span>
                  </div>
                  {(newInvoice.amountPaid || 0) > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount Paid:</span>
                        <span className="text-white">
                          {getCurrencySymbol(newInvoice.currency || "USD")}
                          {(newInvoice.amountPaid || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-white">Balance Due:</span>
                        <span className="text-accent">
                          {getCurrencySymbol(newInvoice.currency || "USD")}
                          {(newInvoice.balanceDue || 0).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-400">Notes</Label>
                <Textarea
                  placeholder="Notes - any relevant information not already covered"
                  value={newInvoice.notes || ""}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="bg-dashboard-bg border-dashboard-border text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Terms</Label>
                <Textarea
                  placeholder="Terms and conditions - late fees, payment methods, delivery schedule"
                  value={newInvoice.terms || ""}
                  onChange={(e) =>
                    setNewInvoice((prev) => ({
                      ...prev,
                      terms: e.target.value,
                    }))
                  }
                  className="bg-dashboard-bg border-dashboard-border text-white"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button
                onClick={saveInvoice}
                className="bg-accent text-black hover:bg-accent/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
