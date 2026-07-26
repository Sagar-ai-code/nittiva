"""
Invoice serializers.

Line items are nested writable. Totals (subtotal / tax_amount / total) are
recomputed on the server whenever line items change — clients should NOT
send them.
"""
from rest_framework import serializers
from ..models import Invoice, InvoiceLineItem


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)  # allow id on update

    class Meta:
        model = InvoiceLineItem
        fields = ["id", "description", "quantity", "unit_price", "line_total", "position"]
        read_only_fields = ["line_total"]


class InvoiceSerializer(serializers.ModelSerializer):
    line_items = InvoiceLineItemSerializer(many=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "client",
            "project",
            "issued_by",
            "issue_date",
            "due_date",
            "currency",
            "tax_rate",
            "discount",
            "subtotal",
            "tax_amount",
            "total",
            "status",
            "notes",
            "paid_at",
            "line_items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "issued_by", "subtotal", "tax_amount", "total",
            "paid_at", "created_at", "updated_at",
        ]

    def validate(self, attrs):
        issue = attrs.get("issue_date") or getattr(self.instance, "issue_date", None)
        due = attrs.get("due_date") or getattr(self.instance, "due_date", None)
        if issue and due and due < issue:
            raise serializers.ValidationError({"due_date": "due_date must be on or after issue_date."})
        return attrs

    def create(self, validated_data):
        line_items_data = validated_data.pop("line_items", [])
        request = self.context.get("request")
        tenant_id = getattr(request, "tenant_id", None)
        if not tenant_id:
            raise serializers.ValidationError({"tenant": "Tenant not found."})
        validated_data["tenant_id"] = tenant_id
        validated_data["issued_by"] = request.user
        invoice = Invoice.objects.create(**validated_data)
        for li in line_items_data:
            li.pop("id", None)
            InvoiceLineItem.objects.create(invoice=invoice, **li)
        invoice.recalc_totals(save=True)
        return invoice

    def update(self, instance, validated_data):
        line_items_data = validated_data.pop("line_items", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if line_items_data is not None:
            # Replace-all strategy: simple and correct.
            instance.line_items.all().delete()
            for pos, li in enumerate(line_items_data):
                li.pop("id", None)
                InvoiceLineItem.objects.create(invoice=instance, position=pos, **li)
        instance.recalc_totals(save=True)
        return instance
