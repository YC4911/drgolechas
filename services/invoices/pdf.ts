import PDFDocument from "pdfkit";
import type { OrderAddressSnapshot, OrderItemRecord } from "@/models/order";

export interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  issuedAt: Date;
  store: {
    name: string;
    legalName: string;
    gstin: string;
    address: string;
    email: string;
    phone: string;
  };
  customer: OrderAddressSnapshot & { email: string };
  items: OrderItemRecord[];
  subtotal: number;
  discount: number;
  tax: number;
  pricesIncludeGst: boolean;
  shipping: number;
  total: number;
  paymentMethod: string;
}

const amount = (value: number) =>
  `INR ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function printable(value: string): string {
  return value.replace(/[^\x20-\x7e]/g, "?");
}

export function generateInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document
      .fontSize(23)
      .fillColor("#083847")
      .text(printable(invoice.store.name));
    document
      .moveDown(0.4)
      .fontSize(9)
      .fillColor("#425554")
      .text(printable(invoice.store.legalName || invoice.store.name));
    if (invoice.store.address) document.text(printable(invoice.store.address));
    if (invoice.store.email || invoice.store.phone) {
      document.text(
        printable(
          [invoice.store.email, invoice.store.phone]
            .filter(Boolean)
            .join(" | "),
        ),
      );
    }
    if (invoice.store.gstin) {
      document.text(`GSTIN: ${printable(invoice.store.gstin)}`);
    }

    document
      .moveDown(1.5)
      .fontSize(19)
      .fillColor("#083847")
      .text("TAX INVOICE");
    document
      .moveDown(0.4)
      .fontSize(10)
      .fillColor("#18343a")
      .text(`Invoice number: ${printable(invoice.invoiceNumber)}`)
      .text(`Order number: ${printable(invoice.orderNumber)}`)
      .text(`Invoice date: ${invoice.issuedAt.toLocaleDateString("en-IN")}`)
      .text(`Payment method: ${printable(invoice.paymentMethod)}`);

    document.moveDown(1).fontSize(12).fillColor("#083847").text("Bill to");
    document
      .moveDown(0.3)
      .fontSize(10)
      .fillColor("#18343a")
      .text(printable(invoice.customer.name))
      .text(printable(invoice.customer.email))
      .text(printable(invoice.customer.phone))
      .text(
        printable(
          [
            invoice.customer.line1,
            invoice.customer.line2,
            invoice.customer.landmark,
            invoice.customer.city,
            invoice.customer.state,
            invoice.customer.postalCode,
            invoice.customer.country,
          ]
            .filter(Boolean)
            .join(", "),
        ),
        { width: 500 },
      );

    document.moveDown(1.2).fontSize(12).fillColor("#083847").text("Items");
    document.moveDown(0.4);
    for (const item of invoice.items) {
      const productDiscount =
        Math.max(0, item.mrp - item.unitPrice) * item.quantity;
      document
        .fontSize(10)
        .fillColor("#18343a")
        .text(
          printable(
            `${item.name}${item.variant ? ` - ${item.variant}` : ""} (SKU: ${item.sku})`,
          ),
          { width: 500 },
        )
        .fontSize(9)
        .fillColor("#425554")
        .text(
          `Qty ${item.quantity} | MRP ${amount(item.mrp)} | Unit price ${amount(item.unitPrice)} | Line total ${amount(item.total)}`,
          { width: 500 },
        );
      if (productDiscount > 0) {
        document.text(`Product discount: ${amount(productDiscount)}`);
      }
      document.moveDown(0.6);
    }

    const mrpSubtotal = invoice.items.reduce(
      (sum, item) => sum + item.mrp * item.quantity,
      0,
    );
    document.moveDown(0.4);
    const totals = [
      ["MRP subtotal", amount(mrpSubtotal)],
      [
        "Product discounts",
        `-${amount(Math.max(0, mrpSubtotal - invoice.subtotal))}`,
      ],
      ["Coupon discount", `-${amount(invoice.discount)}`],
      ["Subtotal after product discounts", amount(invoice.subtotal)],
      [
        invoice.pricesIncludeGst ? "GST (included in subtotal)" : "GST",
        amount(invoice.tax),
      ],
      ["Shipping", amount(invoice.shipping)],
    ];
    for (const [label, value] of totals) {
      document
        .fontSize(10)
        .fillColor("#18343a")
        .text(label, { continued: true, width: 340 })
        .text(value, { align: "right" });
    }
    document
      .moveDown(0.5)
      .fontSize(13)
      .fillColor("#083847")
      .text("Total", { continued: true, width: 340 })
      .text(amount(invoice.total), { align: "right" });
    document
      .moveDown(2)
      .fontSize(9)
      .fillColor("#68787a")
      .text("This invoice is generated electronically by Dr. Golechas.");
    document.end();
  });
}
