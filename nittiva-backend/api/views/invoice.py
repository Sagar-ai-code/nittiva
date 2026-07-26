"""
Invoice views.

Includes a `/pdf/` action that returns a real PDF (using reportlab).
"""
from decimal import Decimal
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Invoice
from ..serializers import InvoiceSerializer
from ..utils.tenant import get_current_tenant_id


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for invoice CRUD. Auto-scopes to the current tenant."""

    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        qs = Invoice.objects.filter(tenant_id=tenant_id)
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        client_id = self.request.query_params.get("client")
        if client_id:
            qs = qs.filter(client_id=client_id)
        return qs.order_by("-issue_date", "-created_at")

    def perform_create(self, serializer):
        tenant_id = get_current_tenant_id(self.request)
        if not tenant_id:
            raise ValidationError("Tenant not found.")
        serializer.save(tenant_id=tenant_id)

    @action(detail=True, methods=["post"], url_path="mark_paid")
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = "paid"
        invoice.paid_at = timezone.now()
        invoice.save(update_fields=["status", "paid_at", "updated_at"])
        return Response(self.get_serializer(invoice).data)

    @action(detail=True, methods=["post"], url_path="mark_sent")
    def mark_sent(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == "draft":
            invoice.status = "sent"
            invoice.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(invoice).data)

    @action(detail=True, methods=["get"], url_path="pdf")
    def pdf(self, request, pk=None):
        """Render the invoice as a PDF and return as application/pdf."""
        invoice = self.get_object()
        pdf_bytes = _render_invoice_pdf(invoice)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{invoice.invoice_number}.pdf"'
        return response


def _render_invoice_pdf(invoice: Invoice) -> bytes:
    """Render an Invoice to PDF bytes using reportlab.

    We import reportlab lazily so the module can be imported even if reportlab
    isn't installed (e.g. in a partial dev environment).
    """
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import LETTER
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        )
    except ImportError:
        # Fallback: return a plain-text "PDF" placeholder so the endpoint doesn't 500
        body = (
            f"Invoice {invoice.invoice_number}\n"
            f"Status: {invoice.status}\n"
            f"Issue: {invoice.issue_date}  Due: {invoice.due_date}\n"
            f"Total: {invoice.total} {invoice.currency}\n\n"
            "(Install reportlab to enable real PDF rendering)\n"
        )
        return body.encode("utf-8")

    buffer_bytes = __import__("io").BytesIO()
    doc = SimpleDocTemplate(
        buffer_bytes, pagesize=LETTER,
        leftMargin=0.6 * inch, rightMargin=0.6 * inch,
        topMargin=0.6 * inch, bottomMargin=0.6 * inch,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", parent=styles["Heading1"], spaceAfter=8)
    h2 = ParagraphStyle("h2", parent=styles["Heading3"], spaceBefore=10, spaceAfter=4)
    body = styles["BodyText"]

    story = []
    # Header
    story.append(Paragraph(f"Invoice {invoice.invoice_number}", title_style))
    story.append(Paragraph(
        f"Status: <b>{invoice.status.upper()}</b>  ·  "
        f"Issued: {invoice.issue_date}  ·  "
        f"Due: {invoice.due_date}",
        body,
    ))
    story.append(Spacer(1, 0.15 * inch))

    # Client block
    if invoice.client:
        client_name = getattr(invoice.client, "name", "") or ""
        client_email = getattr(invoice.client, "email", "") or ""
        client_addr = getattr(invoice.client, "address", "") or ""
        story.append(Paragraph("Bill to", h2))
        story.append(Paragraph(f"<b>{client_name}</b>", body))
        if client_email:
            story.append(Paragraph(client_email, body))
        if client_addr:
            story.append(Paragraph(client_addr.replace("\n", "<br/>"), body))
    elif invoice.project:
        story.append(Paragraph("Project", h2))
        story.append(Paragraph(str(invoice.project), body))

    story.append(Spacer(1, 0.2 * inch))

    # Line items table
    line_data = [["#", "Description", "Qty", "Unit price", "Line total"]]
    for i, li in enumerate(invoice.line_items.all(), start=1):
        line_data.append([
            str(i),
            li.description,
            str(li.quantity),
            f"{li.unit_price} {invoice.currency}",
            f"{li.line_total} {invoice.currency}",
        ])
    if len(line_data) == 1:
        line_data.append(["", "(no line items)", "", "", ""])

    table = Table(line_data, colWidths=[0.4 * inch, 3.4 * inch, 0.7 * inch, 1.2 * inch, 1.2 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2a2a2a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cccccc")),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.2 * inch))

    # Totals
    totals_data = [
        ["Subtotal", f"{invoice.subtotal} {invoice.currency}"],
        [f"Tax ({invoice.tax_rate}%)", f"{invoice.tax_amount} {invoice.currency}"],
        ["Discount", f"-{invoice.discount} {invoice.currency}"],
        ["Total", f"<b>{invoice.total} {invoice.currency}</b>"],
    ]
    totals_table = Table(totals_data, colWidths=[4.0 * inch, 2.0 * inch], hAlign="RIGHT")
    totals_table.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.HexColor("#333333")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ]))
    story.append(totals_table)

    if invoice.notes:
        story.append(Spacer(1, 0.2 * inch))
        story.append(Paragraph("Notes", h2))
        story.append(Paragraph(invoice.notes.replace("\n", "<br/>"), body))

    doc.build(story)
    return buffer_bytes.getvalue()
