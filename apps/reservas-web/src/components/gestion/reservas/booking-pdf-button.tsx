"use client";

import { useState } from "react";
import type { BookingDetail } from "@/lib/gestion/booking-queries";

interface Props {
  booking: BookingDetail;
}

function fmtDate(iso: string): string {
  if (!iso || iso.length < 10) return iso ?? "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function eur(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  in_pickup: "En recogida",
  delivered: "Entregado",
  cancelled: "Cancelada",
  incident: "Incidencia",
  pending: "Pendiente",
  picked_up: "Recogido",
};

const PAY_LABELS: Record<string, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  partial: "Parcial",
  refunded: "Reembolsado",
};

export function BookingPdfButton({ booking }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const [{ jsPDF }, autoTableMod] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = autoTableMod.default;
      const logoResponse = await fetch("/brand-logo.png");
      if (!logoResponse.ok) {
        throw new Error("No se pudo cargar el logo");
      }
      const logoBlob = await logoResponse.blob();
      const logoDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("No se pudo cargar el logo"));
        reader.readAsDataURL(logoBlob);
      });

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const brandGreen: [number, number, number] = [30, 80, 50];
      const gold: [number, number, number] = [180, 140, 40];

      doc.setFillColor(...brandGreen);
      doc.rect(0, 0, pageW, 40, "F");
      doc.addImage(logoDataUrl, "PNG", 15, 8, 16, 16);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Easy Brais", 36, 16);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Comprobante de reserva", 36, 23);
      doc.setFontSize(9);
      doc.text("Transporte de mochilas no Camino Portugues", 36, 29);

      doc.setFillColor(...gold);
      doc.roundedRect(pageW - 68, 10, 58, 18, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(booking.booking_code, pageW - 39, 21, { align: "center" });

      let y = 52;
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("DATOS DEL CLIENTE", 15, y);
      y += 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(15, y, pageW - 15, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        margin: { left: 15, right: 15 },
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 50, textColor: [100, 100, 100] },
          1: { textColor: [30, 30, 30] },
        },
        body: [
          ["Nombre", booking.customer.full_name],
          ["Email", booking.customer.email ?? "—"],
          ["Teléfono", booking.customer.phone ?? "—"],
          ["Fecha servicio", fmtDate(booking.service_date)],
          ["Estado", STATUS_LABELS[booking.status] ?? booking.status],
          ["Pago", PAY_LABELS[booking.payment_status] ?? booking.payment_status],
        ],
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("TRAMOS", 15, y);
      y += 2;
      doc.line(15, y, pageW - 15, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        margin: { left: 15, right: 15 },
        theme: "striped",
        headStyles: { fillColor: brandGreen, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 22 },
          3: { halign: "center" },
          4: { halign: "right" },
          5: { halign: "right" },
        },
        head: [["Fecha", "Recogida", "Entrega", "Moch.", "Precio ud.", "Línea"]],
        body: booking.items.map((item) => [
          fmtDate(item.service_date),
          item.pickup_name,
          item.dropoff_name,
          String(item.bags_count),
          eur(item.unit_price),
          eur(item.line_total),
        ]),
      });

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("IMPORTES", 15, y);
      y += 2;
      doc.line(15, y, pageW - 15, y);
      y += 8;

      const amountRows: string[][] = [
        ["Subtotal", eur(booking.subtotal_amount)],
      ];
      if (booking.discount_amount > 0) {
        amountRows.push(["Descuento volumen", `−${eur(booking.discount_amount)}`]);
      }
      if (booking.extra_weight_amount > 0) {
        amountRows.push(["Suplemento sobrepeso", `+${eur(booking.extra_weight_amount)}`]);
      }

      autoTable(doc, {
        startY: y,
        margin: { left: 15, right: 15 },
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 100, textColor: [100, 100, 100] },
          1: { halign: "right", fontStyle: "bold", textColor: [30, 30, 30] },
        },
        body: amountRows,
        foot: [["TOTAL", eur(booking.total_amount)]],
        footStyles: {
          fillColor: [240, 248, 240],
          textColor: brandGreen,
          fontStyle: "bold",
          fontSize: 12,
        },
      });

      if (booking.notes_customer) {
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text("NOTAS DEL CLIENTE:", 15, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        const lines = doc.splitTextToSize(booking.notes_customer, pageW - 30);
        doc.text(lines, 15, y + 5);
      }

      const footY = doc.internal.pageSize.getHeight() - 15;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generado el ${new Date().toLocaleString("es-ES")} — Easy Brais — reservas.easybrais.es`,
        pageW / 2,
        footY,
        { align: "center" },
      );

      doc.save(`reserva-${booking.booking_code}.pdf`);
    } catch (err) {
      console.error("[BookingPdf] Error:", err);
      alert("Error al generar el PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )}
      Exportar PDF
    </button>
  );
}
