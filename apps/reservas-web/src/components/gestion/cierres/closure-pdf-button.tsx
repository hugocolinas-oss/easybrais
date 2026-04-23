"use client";

import { useState } from "react";
import type { CashClosureRow } from "@/lib/gestion/closure-queries";
import { getClosureBookings } from "@/app/gestion/(dashboard)/cierres/actions";

interface Props {
  closure: CashClosureRow;
}

function fmtDate(iso: string): string {
  if (!iso || iso.length < 10) return iso ?? "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function eur(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

export function ClosurePdfButton({ closure }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
    const [{ jsPDF }, autoTableMod, bookingsRes] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
      getClosureBookings(closure.closure_date),
    ]);
    const autoTable = autoTableMod.default;
    const bookings = "rows" in bookingsRes ? bookingsRes.rows : [];

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    const brandGreen: [number, number, number] = [30, 80, 50];
    const gold: [number, number, number] = [180, 140, 40];

    doc.setFillColor(...brandGreen);
    doc.rect(0, 0, pageW, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Easy Brais", 15, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Cierre contable diario", 15, 22);

    doc.setFillColor(...gold);
    doc.roundedRect(pageW - 55, 8, 45, 16, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(fmtDate(closure.closure_date), pageW - 32.5, 18, { align: "center" });

    let y = 44;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMEN DEL DÍA", 15, y);
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      margin: { left: 15, right: 15 },
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60, textColor: [100, 100, 100] },
        1: { halign: "right", fontStyle: "bold", textColor: [30, 30, 30] },
      },
      body: [
        ["Total reservas", String(closure.total_bookings)],
        ["Total mochilas", String(closure.total_bags)],
        ["Cancelaciones", String(closure.cancellations_count)],
      ],
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("DESGLOSE ECONÓMICO", 15, y);
    y += 2;
    doc.line(15, y, pageW - 15, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      margin: { left: 15, right: 15 },
      theme: "striped",
      headStyles: { fillColor: brandGreen, textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { halign: "right", fontStyle: "bold" },
      },
      head: [["Concepto", "Importe"]],
      body: [
        ["Importe bruto", eur(closure.gross_amount)],
        ["Descuentos por volumen", closure.discounts_amount > 0 ? `−${eur(closure.discounts_amount)}` : "—"],
        ["Suplementos sobrepeso", closure.extras_amount > 0 ? `+${eur(closure.extras_amount)}` : "—"],
        ["Pendiente de cobro", closure.pending_collection_amount > 0 ? eur(closure.pending_collection_amount) : "Todo cobrado"],
      ],
      foot: [["IMPORTE NETO", eur(closure.net_amount)]],
      footStyles: {
        fillColor: [240, 248, 240],
        textColor: brandGreen,
        fontStyle: "bold",
        fontSize: 12,
      },
    });

    if (bookings.length > 0) {
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("DETALLE POR RESERVA", 15, y);
      y += 2;
      doc.line(15, y, pageW - 15, y);
      y += 8;

      const payLabel: Record<string, string> = { paid: "Pagado", pending: "Pendiente", refunded: "Reembolsado" };

      autoTable(doc, {
        startY: y,
        margin: { left: 15, right: 15 },
        theme: "striped",
        headStyles: { fillColor: brandGreen, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 30 },
          4: { halign: "right" },
          5: { halign: "center" },
        },
        head: [["Código", "Cliente", "Ruta", "Mochilas", "Importe", "Pago"]],
        body: bookings.map((b) => [
          b.booking_code,
          b.customer_name,
          b.route,
          String(b.bags_count),
          eur(b.total_amount),
          payLabel[b.payment_status] ?? b.payment_status,
        ]),
      });
    }

    const footY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generado el ${new Date(closure.generated_at).toLocaleString("es-ES")} — Easy Brais`,
      pageW / 2,
      footY,
      { align: "center" },
    );

    doc.save(`cierre-${closure.closure_date}.pdf`);
    } catch (err) {
      console.error("[ClosurePdf] Error al generar PDF:", err);
      alert("Error al generar el PDF. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
      title="Descargar PDF"
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )}
    </button>
  );
}
