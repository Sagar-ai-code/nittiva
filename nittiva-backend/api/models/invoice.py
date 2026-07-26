"""
Invoice models.

Invoice = billing document for a client, with line items and computed totals.
"""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings


class Invoice(models.Model):
    """A billable invoice for a client, optionally tied to a project."""

    STATUS = [
        ("draft", "Draft"),
        ("sent", "Sent"),
        ("paid", "Paid"),
        ("overdue", "Overdue"),
        ("cancelled", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant_id = models.UUIDField(null=True, blank=True, db_index=True)

    invoice_number = models.CharField(max_length=50, unique=True)

    # Relationships
    client = models.ForeignKey(
        "api.Client",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="invoices",
    )
    project = models.ForeignKey(
        "api.Project",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="invoices",
    )
    issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="issued_invoices",
    )

    # Dates
    issue_date = models.DateField()
    due_date = models.DateField()

    # Money
    currency = models.CharField(max_length=3, default="USD")
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))  # percent
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    # State
    status = models.CharField(max_length=20, choices=STATUS, default="draft")
    notes = models.TextField(blank=True, default="")
    paid_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "invoices"
        indexes = [
            models.Index(fields=["tenant_id", "status"]),
            models.Index(fields=["tenant_id", "-issue_date"]),
        ]
        ordering = ["-issue_date", "-created_at"]

    def __str__(self):
        return f"{self.invoice_number} ({self.status})"

    def recalc_totals(self, save: bool = True):
        """Recompute subtotal/tax/total from current line items."""
        line_totals = [li.line_total for li in self.line_items.all()]
        self.subtotal = sum(line_totals, Decimal("0.00"))
        self.tax_amount = (self.subtotal * self.tax_rate / Decimal("100")).quantize(Decimal("0.01"))
        self.total = self.subtotal + self.tax_amount - self.discount
        if save:
            self.save(update_fields=["subtotal", "tax_amount", "total", "updated_at"])


class InvoiceLineItem(models.Model):
    """A single billable line on an invoice."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="line_items")
    description = models.CharField(max_length=500)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("1.00"))
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    position = models.IntegerField(default=0)

    class Meta:
        db_table = "invoice_line_items"
        ordering = ["position", "id"]

    def save(self, *args, **kwargs):
        self.line_total = (self.quantity * self.unit_price).quantize(Decimal("0.01"))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} x{self.quantity} = {self.line_total}"
