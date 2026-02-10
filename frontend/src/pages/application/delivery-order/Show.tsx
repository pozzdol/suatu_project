import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx-js-style";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import {
  ArrowCircleLeftIcon,
  CircleNotchIcon,
  PlayIcon,
  FilePdfIcon,
  FileXlsIcon,
} from "@phosphor-icons/react";
import logoApp from "@/assets/logoApp.png";

type WorkOrderItem = {
  productName: string;
  quantity: number;
  unit?: string;
};

type WorkOrderDetail = {
  id: string;
  orderName: string;
  orderEmail: string;
  orderCode: string;
  status: string;
  confirmedAt?: string | null;
  createdAt?: string | null;
  items: WorkOrderItem[];
  finishing?: string;
  thickness?: string;
  project?: string;
  nopo?: string;
  createdAtSpb?: string | null;
};

function DeliveryOrderShowPage() {
  // PAGE LOAD
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subTitle, setSubtitle] = useState("");
  const [indexUrl, setIndexUrl] = useState("");
  const [permit, setPermit] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        const pageData = await validatePermit(
          "febc90cc433e4b53bfae95802c945270"
        );

        if (pageData && pageData.success && pageData.data.permit.permission) {
          setTitle(pageData.data.page.name);
          setSubtitle(pageData.data.page.description);
          setIndexUrl(pageData.data.page.url);
          setPermit(pageData.data.permit.permission);
          setIsEditable(pageData.data.permit.isEditable);
          setIsAdmin(pageData.data.permit.isAdmin);
        } else {
          setPermit(false);
          toast.error("You don't have permission to access this page");
        }
      } catch (error) {
        setPermit(false);
        toast.error("Failed to validate permissions");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  useDocumentTitle(title || "Surat Pengiriman Barang");

  // FETCH DATA
  const fetchWorkOrderDetail = async () => {
    if (!id) return;
    setLoadingDetail(true);
    try {
      const response = await requestApi.get(
        `/transactions/delivery-orders/edit/${id}`
      );
      if (response && response.data.success) {
        const order = response.data.data.deliveryOrder;
        const mappedOrder: WorkOrderDetail = {
          id: order.id,
          orderCode: order.orderCode || order.order_code || "-",
          orderName: order.recipientName || order.order_name || "Unknown",
          orderEmail:
            order.orderEmail || order.order_email || "unknown@email.com",
          status: order.status || "pending",
          confirmedAt: order.updated_at || order.confirmedAt || null,
          createdAt: order.created_at || order.createdAt || null,
          items:
            order.items?.map((item: any) => ({
              productName: item.productName || "Unnamed Product",
              quantity: item.quantity ?? 0,
              unit: item.unit || "PCS",
            })) || [],
          finishing: "HDG",
          thickness: "1,5MM",
          project: order.project || "-",
          nopo: order.order.nopo || "-",
          createdAtSpb: order.createdAtSpb || null,
        };

        setWorkOrder(mappedOrder);
      } else {
        toast.error("Failed to fetch work order detail");
        navigate(indexUrl);
      }
    } catch (error) {
      console.error("Failed to fetch work order detail:", error);
      toast.error("Failed to fetch work order detail");
      navigate(indexUrl);
    } finally {
      setLoadingDetail(false);
    }
  };

  // EFFECTS
  useEffect(() => {
    if (permit && id) {
      fetchWorkOrderDetail();
    }
  }, [permit, id]);

  // HELPERS
  const formatDateSimple = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(dateString));
    } catch (error) {
      return dateString;
    }
  };

  const handleBack = () => {
    navigate(indexUrl);
  };

  // --- FUNGSI UPDATE STATUS ---
  const handleUpdateStatus = async () => {
    if (!isEditable) {
      toast.error("You don't have permission to update status");
      return;
    }

    if (!id) {
      toast.error("Delivery order ID not found");
      return;
    }

    const currentStatus = workOrder?.status;
    let nextStatus = "";
    let successMessage = "";

    if (currentStatus === "pending") {
      nextStatus = "shipped";
      successMessage = "Status updated to Shipped";
    } else if (currentStatus === "shipped") {
      nextStatus = "delivered";
      successMessage = "Status updated to Delivered";
    } else {
      toast.error("Cannot update status from current state");
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await requestApi.put(
        `/transactions/delivery-orders/status/${id}`,
        { status: nextStatus }
      );

      if (response && response.data.success) {
        toast.success(successMessage);
        setWorkOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
      } else {
        toast.error(response?.data?.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRevertStatus = async () => {
    if (!isEditable) {
      toast.error("You don't have permission to update status");
      return;
    }

    if (!id) {
      toast.error("Delivery order ID not found");
      return;
    }

    const currentStatus = workOrder?.status;
    let prevStatus = "";
    let successMessage = "";

    if (currentStatus === "shipped") {
      prevStatus = "pending";
      successMessage = "Status reverted to Pending";
    } else if (currentStatus === "delivered") {
      prevStatus = "shipped";
      successMessage = "Status reverted to Shipped";
    } else {
      toast.error("Cannot revert status from current state");
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await requestApi.put(
        `/transactions/delivery-orders/status/${id}`,
        { status: prevStatus }
      );

      if (response && response.data.success) {
        toast.success(successMessage);
        setWorkOrder((prev) => (prev ? { ...prev, status: prevStatus } : null));
      } else {
        toast.error(response?.data?.message || "Failed to revert status");
      }
    } catch (error: any) {
      console.error("Failed to revert status:", error);
      toast.error(error?.response?.data?.message || "Failed to revert status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // --- FUNGSI LOAD GAMBAR UNTUK PDF ---
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  // --- FUNGSI DOWNLOAD ---
  const handleDownload = async (format: "pdf" | "excel") => {
    if (!id) {
      toast.error("Work order ID not found");
      return;
    }

    setDownloading(format);
    try {
      if (format === "pdf") {
        if (!workOrder) return;

        // Custom paper size: 5.5" x 9.5" (portrait)
        // Using mm units: 1 inch = 25.4 mm
        const pageWidthMm = 5.5 * 25.4;
        const pageHeightMm = 9.5 * 25.4;

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [pageWidthMm, pageHeightMm],
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        // Margins + scale so the layout stays "fit to page" on small paper
        const marginX = 7;
        const marginY = 7;
        const rightMargin = pageWidth - marginX;
        const centerX = pageWidth / 2;
        const usableWidth = pageWidth - marginX * 2;

        // Reference usable width ~ A4 with 15mm margins: 210 - 30 = 180mm
        // Scale down fonts/spacing proportionally for 5.5" width.
        const scale = Math.min(1, Math.max(0.6, usableWidth / 180));
        const s = (v: number) => v * scale;

        // 1. HEADER (LOGO + COMPANY INFO)
        // Posisi Awal
        const startX = marginX;
        const startY = marginY;
        let textX = startX;
        let logoBottomY = startY;

        // Load Logo Image
        try {
          const img = await loadImage(logoApp);
          // Render Logo (Ukuran disesuaikan, misal 20mm x 20mm proporsional)
          const imgWidth = s(16);
          const imgHeight = (img.height * imgWidth) / img.width;
          pdf.addImage(img, "PNG", startX + 4, startY + 3, imgWidth, imgHeight);

          logoBottomY = startY + imgHeight;

          // Geser teks ke kanan logo
          textX = startX + imgWidth + 5;
        } catch (e) {
          console.error("Failed to load logo", e);
          // Jika gagal load logo, text tetap di kiri
        }

        // Tulis Company Info (Sebelah Logo)
        let headerTextY = startY + 5;

        // Reserve space on the right for the document info so left header text won't collide.
        const reservedRightWidth = s(62);
        const leftTextMaxWidth = Math.max(
          s(40),
          usableWidth - reservedRightWidth - (textX - startX)
        );

        const drawWrappedLeft = (
          text: string,
          fontSize: number,
          fontStyle: "normal" | "bold",
          lineGap: number
        ) => {
          pdf.setFont("times", fontStyle);
          pdf.setFontSize(fontSize);
          const lines = pdf.splitTextToSize(text, leftTextMaxWidth) as string[];
          lines.forEach((ln, idx) => {
            pdf.text(ln, textX, headerTextY + idx * s(lineGap));
          });
          headerTextY += Math.max(1, lines.length) * s(lineGap);
        };

        drawWrappedLeft("PT ANUGERAH HUTAMA MANDIRI", s(11), "bold", 5.2);
        drawWrappedLeft("CABLE SUPPORT SYSTEM", s(9), "normal", 4.5);
        drawWrappedLeft(
          "Specialist Product : Cable tray, Duct, Ladder",
          s(8),
          "normal",
          4.2
        );

        // 2. HEADER KANAN (INFO DOKUMEN)
        let rightY = startY + 5;
        const lineH = s(4.2);
        const labelX = rightMargin - reservedRightWidth;
        const colonX = rightMargin - reservedRightWidth + s(5);
        const valueX = rightMargin;
        const valueMaxWidth = reservedRightWidth - s(12);

        pdf.setFont("times", "bold");
        pdf.setFontSize(s(10));
        pdf.text("SURAT PENGIRIMAN BARANG", rightMargin, rightY, {
          align: "right",
        });

        // Helper untuk baris key-value seperti grid HTML (label | : | value)
        const addRightKV = (
          label: string,
          value: string,
          opts?: {
            boldLabel?: boolean;
            boldValue?: boolean;
            valueWidth?: number;
          }
        ) => {
          const boldLabel = opts?.boldLabel ?? false;
          const boldValue = opts?.boldValue ?? false;
          const maxWidth = opts?.valueWidth ?? valueMaxWidth;

          rightY += lineH;

          pdf.setFont("times", boldLabel ? "bold" : "normal");
          pdf.setFontSize(s(8));
          pdf.text(label, labelX, rightY);
          pdf.setFont("times", "normal");
          pdf.text(":", colonX, rightY);

          const lines = pdf.splitTextToSize(value || "-", maxWidth) as string[];
          pdf.setFont("times", boldValue ? "bold" : "normal");
          lines.forEach((ln, idx) => {
            pdf.text(ln, valueX, rightY + idx * lineH, { align: "right" });
          });

          // advance Y by the wrapped lines
          rightY += Math.max(0, lines.length - 1) * lineH;
        };

        addRightKV("TGL SPB", formatDateSimple(workOrder.createdAtSpb) || "-");
        addRightKV("NO SPB", workOrder.orderCode);
        addRightKV("PO NO", workOrder.nopo || "-");

        // SHIP TO label + name on next line (match HTML)
        rightY += s(2);
        pdf.setFont("times", "bold");
        pdf.setFontSize(s(8));
        pdf.text("SHIP TO", labelX, rightY + lineH);
        rightY += lineH;
        const shipToLines = pdf.splitTextToSize(
          workOrder.orderName.toUpperCase(),
          valueMaxWidth + s(12)
        ) as string[];
        shipToLines.forEach((ln, idx) => {
          pdf.text(ln, valueX, rightY + lineH + idx * lineH, {
            align: "right",
          });
        });
        rightY += lineH + Math.max(0, shipToLines.length - 1) * lineH;

        // 3. ALAMAT (TENGAH, DOUBLE BORDER)
        const addressY = Math.max(headerTextY, rightY, logoBottomY) + s(6);

        // Garis Double Atas
        pdf.setLineWidth(Math.max(0.1, s(0.4)));
        pdf.line(startX, addressY, rightMargin, addressY); // Garis tebal
        pdf.setLineWidth(Math.max(0.1, s(0.18)));
        pdf.line(startX, addressY + s(0.8), rightMargin, addressY + s(0.8)); // Garis tipis (efek double)

        // Teks Alamat
        pdf.setFont("times", "normal");
        pdf.setFontSize(s(8));
        pdf.text(
          "Jl.Satria 1 Blok C No.646 RT.001 RW.012 Pejuang Jaya - Bekasi",
          centerX,
          addressY + s(5),
          { align: "center" }
        );
        pdf.text(
          "Telp : 88980503/8876256 Fax : 88980503",
          centerX,
          addressY + s(9),
          { align: "center" }
        );

        // Garis Double Bawah
        const bottomLineY = addressY + s(12);
        pdf.setLineWidth(Math.max(0.1, s(0.18)));
        pdf.line(startX, bottomLineY, rightMargin, bottomLineY);
        pdf.setLineWidth(Math.max(0.1, s(0.4)));
        pdf.line(
          startX,
          bottomLineY + s(0.8),
          rightMargin,
          bottomLineY + s(0.8)
        );

        // 4. TABEL BARANG
        // Prepare table data
        const tableData =
          workOrder.items.length > 0
            ? workOrder.items.map((item, index) => [
                (index + 1).toString(),
                item.productName,
                item.quantity.toString(),
                (item.unit || "BTG").toUpperCase(),
              ])
            : [["1", "No items available", "-", "-"]];

        // Fill empty rows to 15
        while (tableData.length < 15) {
          tableData.push(["", "", "", ""]);
        }

        autoTable(pdf, {
          startY: bottomLineY + s(6),
          head: [["NO", "KETERANGAN BARANG", "QTY", "UNIT"]],
          body: tableData,
          theme: "plain",
          styles: {
            font: "times",
            fontSize: s(7.5),
            cellPadding: s(1.4),
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            valign: "middle",
            overflow: "linebreak",
          },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            halign: "center",
            lineWidth: 0.1, // Border header
          },
          columnStyles: {
            0: { cellWidth: s(8), halign: "center" }, // No
            1: {
              cellWidth: Math.max(s(34), usableWidth - (s(8) + s(16) + s(16))),
              halign: "left",
            }, // Ket
            2: { cellWidth: s(16), halign: "center" }, // Qty
            3: { cellWidth: s(16), halign: "center" }, // Unit
          },
          margin: { left: marginX, right: marginX, bottom: s(28) },
        });

        // 5. FOOTER (TANDA TANGAN)
        let finalY = (pdf as any).lastAutoTable.finalY + s(6);

        // Jika footer terlalu dekat dengan bawah halaman, pindahkan ke halaman baru
        const bottomMargin = marginY;
        const estimatedFooterHeight = s(38);
        if (finalY + estimatedFooterHeight > pageHeight - bottomMargin) {
          pdf.addPage();
          finalY = marginY + s(6);
        }

        pdf.setFontSize(s(8.5));
        pdf.setFont("times", "bold");

        // Label Kolom (4 kolom: PENERIMA | TEXT | QC | LOGISTIK)
        const col1 = marginX + usableWidth * 0.125; // PENERIMA (25%)
        const col2 = marginX + usableWidth * 0.375; // TEXT (tengah)
        const col3 = marginX + usableWidth * 0.625; // QC (75%)
        const col4 = marginX + usableWidth * 0.875; // LOGISTIK (100%)

        pdf.text("PENERIMA", col1, finalY, { align: "center" });
        pdf.text("QC", col3, finalY, { align: "center" });
        pdf.text("LOGISTIK", col4, finalY, { align: "center" });

        // Garis bawah judul kolom (underline) - hanya untuk 3 kolom signature (PENERIMA, QC, LOGISTIK)
        pdf.setLineWidth(0.1);
        pdf.line(col1 - 12, finalY + 1, col1 + 12, finalY + 1);
        pdf.line(col3 - 12, finalY + 1, col3 + 12, finalY + 1);
        pdf.line(col4 - 12, finalY + 1, col4 + 12, finalY + 1);

        // Statement (tetap di tengah-tengah dengan spacing Y sama)
        pdf.setFont("times", "normal");
        pdf.setFontSize(5);
        pdf.text(
          "Barang tsb diatas kami terima" + "\ndalam keadaan CUKUP dan BAIK",
          col2,
          finalY + s(12),
          { align: "center" }
        );

        // Area Tanda Tangan (Titik-titik / Garis)
        const signY = finalY + s(24);

        // Fungsi helper untuk tanda tangan "( ... )"
        const drawSignLine = (x: number) => {
          pdf.text("(", x - s(16), signY);
          pdf.text(")", x + s(16), signY);
          // Garis titik-titik manual jika mau, atau biarkan kosong seperti HTML
          pdf.setLineDashPattern([1, 1], 0);
          pdf.line(x - s(12), signY, x + s(12), signY);
          pdf.setLineDashPattern([], 0); // Reset solid
        };

        drawSignLine(col1);
        drawSignLine(col3);
        drawSignLine(col4);

        pdf.save(`SPB-${workOrder.orderCode || id}.pdf`);
        toast.success("PDF downloaded successfully");
      } else if (format === "excel") {
        if (!workOrder) return;

        // --- EXCEL GENERATION (MATCHING HTML + PDF LAYOUT) ---
        // We use an 8-column grid (A..H) to better simulate the left header + right header layout,
        // and we merge cells to approximate the HTML structure.

        const colCount = 8;
        const makeRow = (cells: Array<string | number>) => {
          const row = Array.from({ length: colCount }, (_, idx) =>
            cells[idx] === undefined ? "" : cells[idx]
          );
          return row;
        };

        const ws_data: any[][] = [];

        // Row 1-3: Header (Logo placeholder column A, company info B-E, document title F-H)
        ws_data.push(
          makeRow([
            "",
            "PT ANUGERAH HUTAMA MANDIRI",
            "",
            "",
            "",
            "SURAT PENGIRIMAN BARANG",
            "",
            "",
          ])
        );
        ws_data.push(
          makeRow([
            "",
            "CABLE SUPPORT SYSTEM",
            "",
            "",
            "",
            "TGL SPB",
            ":",
            formatDateSimple(workOrder.createdAtSpb) || "-",
          ])
        );
        ws_data.push(
          makeRow([
            "",
            "Specialist Product : Cable tray, Duct, Ladder",
            "",
            "",
            "",
            "NO SPB",
            ":",
            workOrder.orderCode,
          ])
        );
        ws_data.push(
          makeRow(["", "", "", "", "", "PO NO", ":", workOrder.nopo || "-"])
        );
        ws_data.push(makeRow(["", "", "", "", "", "SHIP TO", ":", ""]));
        ws_data.push(
          makeRow([
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            workOrder.orderName.toUpperCase(),
          ])
        );

        // Spacer
        ws_data.push(makeRow(["", "", "", "", "", "", "", ""]));

        // Address bar (two centered lines with double border)
        ws_data.push(
          makeRow([
            "Jl.Satria 1 Blok C No.646 RT.001 RW.012 Pejuang Jaya - Bekasi",
          ])
        );
        ws_data.push(makeRow(["Telp : 88980503/8876256 Fax : 88980503"]));

        // Spacer
        ws_data.push(makeRow(["", "", "", "", "", "", "", ""]));

        // Table header (A, B-F merged as description, G, H)
        ws_data.push(
          makeRow(["NO", "KETERANGAN BARANG", "", "", "", "", "QTY", "UNIT"])
        );

        // Table body (always 15 rows)
        const items = workOrder.items.length > 0 ? workOrder.items : null;
        const bodyRows: Array<{
          no: string;
          desc: string;
          qty: string;
          unit: string;
        }> = [];

        if (!items) {
          bodyRows.push({
            no: "1",
            desc: "No items available",
            qty: "-",
            unit: "-",
          });
        } else {
          items.forEach((item, idx) => {
            bodyRows.push({
              no: String(idx + 1),
              desc: item.productName,
              qty: String(item.quantity),
              unit: (item.unit || "BTG").toUpperCase(),
            });
          });
        }

        while (bodyRows.length < 15) {
          bodyRows.push({ no: "", desc: "", qty: "", unit: "" });
        }

        bodyRows.forEach((r) => {
          ws_data.push(makeRow([r.no, r.desc, "", "", "", "", r.qty, r.unit]));
        });

        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // Column widths tuned to visually match the PDF proportions
        ws["!cols"] = [
          { wch: 6 }, // A (NO / Logo placeholder)
          { wch: 18 }, // B
          { wch: 18 }, // C
          { wch: 18 }, // D
          { wch: 18 }, // E
          { wch: 14 }, // F (labels / title)
          { wch: 3 }, // G (:)
          { wch: 24 }, // H (values)
        ];

        // Row heights (approximate HTML spacing)
        ws["!rows"] = ws_data.map(() => ({ hpt: 16 }));
        // Make header/title a bit taller
        if (ws["!rows"][0]) ws["!rows"][0] = { hpt: 22 };
        // Address lines a bit taller
        if (ws["!rows"][7]) ws["!rows"][7] = { hpt: 18 };
        if (ws["!rows"][8]) ws["!rows"][8] = { hpt: 18 };
        // Table rows taller
        for (let r = 10; r <= 25; r++) {
          if (ws["!rows"][r]) ws["!rows"][r] = { hpt: 20 };
        }
        // Footer spacing
        if (ws["!rows"][27]) ws["!rows"][27] = { hpt: 20 };
        if (ws["!rows"][28]) ws["!rows"][28] = { hpt: 28 };
        if (ws["!rows"][29]) ws["!rows"][29] = { hpt: 28 };

        const borderThin = {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        };

        const borderDoubleTop = {
          top: { style: "double", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        };

        const borderDoubleBottom = {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "double", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        };

        const fontBase = { name: "Times New Roman", sz: 10 };
        const fontSmall = { name: "Times New Roman", sz: 9 };
        const fontHeader = { name: "Times New Roman", sz: 14, bold: true };
        const fontTitle = { name: "Times New Roman", sz: 12, bold: true };
        const fontBold = { name: "Times New Roman", sz: 10, bold: true };

        const styleLeft = {
          font: fontBase,
          alignment: { horizontal: "left", vertical: "center" },
        };
        const styleRight = {
          font: fontBase,
          alignment: { horizontal: "right", vertical: "center" },
        };
        const styleCenter = {
          font: fontBase,
          alignment: { horizontal: "center", vertical: "center" },
        };

        const ensureCell = (r: number, c: number) => {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!ws[addr]) {
            ws[addr] = { t: "s", v: "" };
          }
          return ws[addr];
        };

        const setRangeStyle = (
          r1: number,
          c1: number,
          r2: number,
          c2: number,
          s: any
        ) => {
          for (let rr = r1; rr <= r2; rr++) {
            for (let cc = c1; cc <= c2; cc++) {
              const cell = ensureCell(rr, cc);
              cell.s = s;
            }
          }
        };

        // Merges
        const merges: XLSX.Range[] = [];
        // Logo placeholder
        merges.push({ s: { r: 0, c: 0 }, e: { r: 2, c: 0 } });
        // Left header text blocks
        merges.push({ s: { r: 0, c: 1 }, e: { r: 0, c: 4 } });
        merges.push({ s: { r: 1, c: 1 }, e: { r: 1, c: 4 } });
        merges.push({ s: { r: 2, c: 1 }, e: { r: 2, c: 4 } });
        // Title on the right
        merges.push({ s: { r: 0, c: 5 }, e: { r: 0, c: 7 } });
        // Customer name row (right side)
        merges.push({ s: { r: 5, c: 5 }, e: { r: 5, c: 7 } });
        // Address
        merges.push({ s: { r: 7, c: 0 }, e: { r: 7, c: 7 } });
        merges.push({ s: { r: 8, c: 0 }, e: { r: 8, c: 7 } });
        // Table header description merge (B-F)
        merges.push({ s: { r: 10, c: 1 }, e: { r: 10, c: 5 } });
        // Table body description merge (B-F) for 15 rows
        for (let rr = 11; rr <= 25; rr++) {
          merges.push({ s: { r: rr, c: 1 }, e: { r: rr, c: 5 } });
        }
        // Footer merges
        merges.push({ s: { r: 27, c: 0 }, e: { r: 27, c: 1 } }); // PENERIMA
        merges.push({ s: { r: 27, c: 2 }, e: { r: 27, c: 5 } }); // statement
        merges.push({ s: { r: 30, c: 0 }, e: { r: 30, c: 1 } }); // penerima sign

        ws["!merges"] = merges;

        // Base font everywhere for used area
        setRangeStyle(0, 0, ws_data.length - 1, colCount - 1, {
          font: fontBase,
          alignment: { horizontal: "left", vertical: "center" },
        });

        // Header styles
        setRangeStyle(0, 1, 0, 4, {
          font: fontHeader,
          alignment: { horizontal: "left", vertical: "center" },
        });
        setRangeStyle(1, 1, 1, 4, {
          font: { name: "Times New Roman", sz: 10 },
          alignment: { horizontal: "left", vertical: "center" },
        });
        setRangeStyle(2, 1, 2, 4, {
          font: { name: "Times New Roman", sz: 9 },
          alignment: { horizontal: "left", vertical: "center" },
        });
        // Title (right)
        setRangeStyle(0, 5, 0, 7, {
          font: fontTitle,
          alignment: { horizontal: "right", vertical: "center" },
        });

        // Right info table look
        // Labels (F), colons (G), values (H)
        setRangeStyle(1, 5, 4, 5, { ...styleLeft, font: fontSmall });
        setRangeStyle(1, 6, 4, 6, { ...styleCenter, font: fontSmall });
        setRangeStyle(1, 7, 4, 7, { ...styleLeft, font: fontSmall });
        // SHIP TO label row
        setRangeStyle(4, 5, 4, 6, { ...styleLeft, font: fontBold });
        // Customer name row (bold, right aligned)
        setRangeStyle(5, 5, 5, 7, { ...styleRight, font: fontBold });

        // Address bar: centered + double borders
        setRangeStyle(7, 0, 7, 7, {
          font: fontSmall,
          alignment: { horizontal: "center", vertical: "center" },
          border: borderDoubleTop,
        });
        setRangeStyle(8, 0, 8, 7, {
          font: fontSmall,
          alignment: { horizontal: "center", vertical: "center" },
          border: borderDoubleBottom,
        });

        // Table header
        setRangeStyle(10, 0, 10, 7, {
          font: fontBold,
          alignment: { horizontal: "center", vertical: "center" },
          border: borderThin,
        });
        // Table header left alignment for description merged cell
        setRangeStyle(10, 1, 10, 5, {
          font: fontBold,
          alignment: { horizontal: "left", vertical: "center" },
          border: borderThin,
        });

        // Table body (15 rows)
        // Borders everywhere; align B-F to left/top like HTML; others centered.
        for (let rr = 11; rr <= 25; rr++) {
          // NO (A)
          setRangeStyle(rr, 0, rr, 0, {
            font: fontBase,
            alignment: { horizontal: "center", vertical: "top" },
            border: borderThin,
          });
          // DESC (B-F)
          setRangeStyle(rr, 1, rr, 5, {
            font: fontBase,
            alignment: {
              horizontal: "left",
              vertical: "top",
              wrapText: true,
            },
            border: borderThin,
          });
          // QTY (G)
          setRangeStyle(rr, 6, rr, 6, {
            font: fontBase,
            alignment: { horizontal: "center", vertical: "top" },
            border: borderThin,
          });
          // UNIT (H)
          setRangeStyle(rr, 7, rr, 7, {
            font: fontBase,
            alignment: { horizontal: "center", vertical: "top" },
            border: borderThin,
          });
        }

        // Footer
        setRangeStyle(27, 0, 27, 1, {
          font: fontBold,
          alignment: { horizontal: "center", vertical: "center" },
        });
        setRangeStyle(27, 2, 27, 5, {
          font: { name: "Times New Roman", sz: 8 },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
        });
        setRangeStyle(27, 6, 27, 7, {
          font: fontBold,
          alignment: { horizontal: "center", vertical: "center" },
        });
        // Underline for signatures (row 29) using bottom borders
        setRangeStyle(29, 0, 29, 1, {
          font: fontBase,
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            bottom: { style: "thin", color: { rgb: "000000" } },
          },
        });
        setRangeStyle(29, 6, 29, 6, {
          font: fontBase,
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            bottom: { style: "thin", color: { rgb: "000000" } },
          },
        });
        setRangeStyle(29, 7, 29, 7, {
          font: fontBase,
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            bottom: { style: "thin", color: { rgb: "000000" } },
          },
        });
        // Parentheses row
        setRangeStyle(30, 0, 30, 7, {
          font: { name: "Times New Roman", sz: 10 },
          alignment: { horizontal: "center", vertical: "center" },
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SPB");
        XLSX.writeFile(wb, `SPB-${workOrder.orderCode || id}.xlsx`);
        toast.success("Excel downloaded successfully");
      }
    } catch (error) {
      console.error("Failed to download:", error);
      toast.error("Failed to download document");
    } finally {
      setDownloading(null);
    }
  };

  // RENDER (Sama seperti sebelumnya)
  if (loading) return <Loading />;
  if (!permit) return <Permit />;
  if (loadingDetail) return <Loading />;

  if (!workOrder) {
    return (
      <div className="pt-6 px-8 pb-14 min-h-[calc(100vh-64px)] md:py-6">
        <div className="text-center mt-10">
          <p className="text-lg text-gray-700">Work order not found</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 px-4 md:px-8 pb-14 min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Header Halaman Web */}
      <div className="text-gray-500 mb-2 grid grid-cols-1 gap-2 md:flex md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p>{subTitle}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 mb-6 print:hidden">
        <button
          className="flex items-center text-sky-600 font-medium cursor-pointer hover:text-sky-700 transition duration-200 ease-in-out"
          onClick={handleBack}
        >
          <ArrowCircleLeftIcon weight="duotone" className="w-5 h-5 mr-2" /> Back
        </button>
      </div>

      {/* --- DOCUMENT PREVIEW (HTML) --- */}
      <div
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
        className="w-[1000px] h-[1728px] mx-auto bg-white p-8 shadow-md print:shadow-none print:p-0 text-black font-sans text-sm"
      >
        {/* HEADER KOP SURAT */}
        <div className="flex justify-between mb-1">
          <div className="w-1/2 flex items-center gap-3">
            <div className="shrink-0">
              <img
                src={logoApp}
                alt="Company Logo"
                className="h-16 w-16 object-contain"
              />
            </div>
            <div className="text-left">
              <h2 className="font-bold text-base tracking-wide uppercase">
                pt anugerah hutama mandiri
              </h2>
              <p className="text-sm font-medium">CABLE SUPPORT SYSTEM</p>
              <p className="text-xs">
                Specialist Product : Cable tray, Duct, Ladder
              </p>
            </div>
          </div>

          <div className="w-1/2">
            <h2 className="font-medium text-lg text-right mb-1 mr-4">
              SURAT PENGIRIMAN BARANG
            </h2>
            <div className="grid grid-cols-[80px_10px_1fr] text-xs">
              <div className="pl-4">TGL SPB</div>
              <div>:</div>
              <div>{formatDateSimple(workOrder.createdAtSpb)}</div>

              <div className="pl-4">NO SPB</div>
              <div>:</div>
              <div>{workOrder.orderCode}</div>

              <div className="pl-4">PO NO</div>
              <div>:</div>
              <div>{workOrder.nopo || "-"}</div>

              <div className="pl-4 font-bold mt-1">SHIP TO</div>
              <div className="mt-1"></div>
              <div className="mt-1"></div>

              <div className="col-span-3 pl-4 font-bold text-sm uppercase">
                {workOrder.orderName}
              </div>
            </div>
          </div>
        </div>

        {/* ALAMAT (Double Border) */}
        <div className="border-t-4 border-double border-black border-b py-2 mb-4 text-center text-sm">
          <p>Jl.Satria 1 Blok C No.646 RT.001 RW.012 Pejuang Jaya - Bekasi</p>
          <p>Telp : 88980503/8876256 Fax : 88980503</p>
        </div>

        {/* TABEL BARANG */}
        <div className="w-full mb-8">
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-transparent text-center font-bold">
                <th className="border border-black p-1 w-12">NO</th>
                <th className="border border-black p-1 text-left pl-3">
                  KETERANGAN BARANG
                </th>
                <th className="border border-black p-1 w-24">QTY</th>
                <th className="border border-black p-1 w-24">UNIT</th>
              </tr>
            </thead>
            <tbody>
              {workOrder.items.length > 0 ? (
                workOrder.items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black text-center p-1 align-top h-8">
                      {index + 1}
                    </td>
                    <td className="border border-black p-1 pl-3 align-top">
                      {item.productName}
                    </td>
                    <td className="border border-black text-center p-1 align-top">
                      {item.quantity}
                    </td>
                    <td className="border border-black text-center p-1 align-top uppercase">
                      {item.unit || "BTG"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="border border-black p-4 text-center italic"
                  >
                    No items available
                  </td>
                </tr>
              )}

              {[...Array(Math.max(0, 15 - workOrder.items.length))].map(
                (_, idx) => (
                  <tr key={`empty-${idx}`}>
                    <td className="border border-black text-center p-1 h-8">
                      &nbsp;
                    </td>
                    <td className="border border-black p-1 pl-3">&nbsp;</td>
                    <td className="border border-black text-center p-1">
                      &nbsp;
                    </td>
                    <td className="border border-black text-center p-1">
                      &nbsp;
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="grid grid-cols-4 gap-4 text-center text-sm font-medium">
          <div className="col-span-1">
            <div className="mb-20">PENERIMA</div>
            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
            <div>
              (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
            </div>
          </div>
          <div className="col-span-1 flex flex-col justify-start pt-8">
            <p className="text-xs">
              Barang tsb diatas kami terima dalam keadaan CUKUP dan BAIK
            </p>
          </div>
          <div className="col-span-1">
            <div className="mb-20">QC</div>
            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
            <div>
              (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
            </div>
          </div>
          <div className="col-span-1">
            <div className="mb-20">LOGISTIK</div>
            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
            <div>
              (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-3 mt-6 print:hidden max-w-[1000px] mx-auto">
        <div className="flex gap-3">
          {workOrder.status === "pending" && isEditable && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-sm font-medium rounded-lg text-white hover:bg-amber-600 transition-all disabled:opacity-50"
              onClick={handleUpdateStatus}
              disabled={updatingStatus || downloading !== null}
            >
              {updatingStatus ? (
                <CircleNotchIcon className="animate-spin w-4 h-4" />
              ) : (
                <PlayIcon weight="duotone" className="w-4 h-4" />
              )}
              {updatingStatus ? "Updating..." : `Set to Shipped`}
            </button>
          )}
          {/* ...tombol lain (shipped/delivered) tetap sama... */}
          {workOrder.status === "shipped" && isEditable && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-sm font-medium rounded-lg text-white hover:bg-emerald-600 transition-all disabled:opacity-50"
              onClick={handleUpdateStatus}
              disabled={updatingStatus || downloading !== null}
            >
              {updatingStatus ? (
                <CircleNotchIcon className="animate-spin w-4 h-4" />
              ) : (
                <PlayIcon weight="duotone" className="w-4 h-4" />
              )}
              {updatingStatus ? "Updating..." : `Set to Delivered`}
            </button>
          )}

          {workOrder.status === "shipped" && isEditable && isAdmin && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-500 text-sm font-medium rounded-lg text-white hover:bg-gray-600 transition-all disabled:opacity-50"
              onClick={handleRevertStatus}
              disabled={updatingStatus || downloading !== null}
            >
              {updatingStatus ? (
                <CircleNotchIcon className="animate-spin w-4 h-4" />
              ) : (
                <ArrowCircleLeftIcon weight="duotone" className="w-4 h-4" />
              )}
              {updatingStatus ? "Updating..." : `Revert to Pending`}
            </button>
          )}

          {workOrder.status === "delivered" && isEditable && isAdmin && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-500 text-sm font-medium rounded-lg text-white hover:bg-gray-600 transition-all disabled:opacity-50"
              onClick={handleRevertStatus}
              disabled={updatingStatus || downloading !== null}
            >
              {updatingStatus ? (
                <CircleNotchIcon className="animate-spin w-4 h-4" />
              ) : (
                <ArrowCircleLeftIcon weight="duotone" className="w-4 h-4" />
              )}
              {updatingStatus ? "Updating..." : `Revert to Shipped`}
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-sm font-medium rounded-lg border text-gray-700 border-green-300 hover:text-green-600 transition-all disabled:opacity-50"
            onClick={() => handleDownload("excel")}
            disabled={downloading !== null}
          >
            {downloading === "excel" ? (
              <CircleNotchIcon className="animate-spin w-4 h-4" />
            ) : (
              <FileXlsIcon
                weight="duotone"
                className="w-4 h-4 text-green-500"
              />
            )}
            Download Excel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-sm font-medium rounded-lg border text-gray-700 border-red-300 hover:text-red-600 transition-all disabled:opacity-50"
            onClick={() => handleDownload("pdf")}
            disabled={downloading !== null}
          >
            {downloading === "pdf" ? (
              <CircleNotchIcon className="animate-spin w-4 h-4" />
            ) : (
              <FilePdfIcon weight="duotone" className="w-4 h-4 text-rose-500" />
            )}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeliveryOrderShowPage;
