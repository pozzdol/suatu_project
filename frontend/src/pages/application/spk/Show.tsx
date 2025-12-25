import { useState, useEffect, useRef } from "react";
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

type WorkOrderItem = {
  productName: string;
  quantity: number;
  unit?: string;
  remark?: string;
};

type DeliveryOrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit?: string | null;
};

type DeliveryOrder = {
  id: string;
  orderCode: string;
  plannedDeliveryDate?: string | null;
  status: string;
  items: DeliveryOrderItem[];
  shippedAt?: string | null;
  createdAt: string;
};

type WorkOrderDetail = {
  id: string;
  noSurat: string;
  orderName: string;
  orderPo: string;
  status: string;
  confirmedAt?: string | null;
  createdAt?: string | null;
  items: WorkOrderItem[];
  finishing?: string;
  thickness?: string;
  project?: string;
  note?: string;
  deliveryOrders?: DeliveryOrder[];
};

function SPKShowPage() {
  // PAGE LOAD
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subTitle, setSubtitle] = useState("");
  const [indexUrl, setIndexUrl] = useState("");
  const [permit, setPermit] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isEditable, setIsEditable] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAdmin, setIsAdmin] = useState(false);
  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "excel" | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        const pageData = await validatePermit(
          "5e3d9b8f13ed4d9fb5ffd9cf597fecc7"
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

  useDocumentTitle(title || "Work Order Detail");

  // FETCH DATA
  const fetchWorkOrderDetail = async () => {
    if (!id) return;
    setLoadingDetail(true);
    try {
      const response = await requestApi.get(
        `/transactions/work-orders/edit/${id}`
      );
      if (response && response.data.success) {
        const order = response.data.data.workOrder;
        const mappedOrder: WorkOrderDetail = {
          id: order.id,
          noSurat: order.noSurat || order.no_surat || "-",
          orderName: order.orderName || order.order_name || "Unknown",
          orderPo: order.orderPo || order.order_po || "-",
          status: order.status || "pending",
          project: order.project || "-",
          finishing: order.finishing || "HDG",
          thickness: order.thickness || "1,5MM",
          note: order.note || "-",
          confirmedAt: order.updated_at || order.confirmedAt || null,
          createdAt: order.created_at || order.createdAt || null,
          items:
            order.orderItems?.map((item: any) => ({
              productName: item.productName || "Unnamed Product",
              quantity: item.quantity ?? 0,
              remark: item.remark,
              unit: item.unit || "PCS",
            })) || [],
          deliveryOrders:
            order.deliveryOrders?.map((delivery: any) => ({
              id: delivery.id,
              orderCode: delivery.orderCode,
              plannedDeliveryDate: delivery.plannedDeliveryDate,
              status: delivery.status,
              items:
                delivery.items?.map((item: any) => ({
                  id: item.id,
                  productId: item.productId,
                  productName: item.productName,
                  quantity: item.quantity,
                  unit: item.unit,
                })) || [],
              shippedAt: delivery.shippedAt,
              createdAt: delivery.createdAt,
            })) || [],
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
        month: "short",
        year: "2-digit",
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
      toast.error("Work order ID not found");
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await requestApi.put(
        `/transactions/work-orders/status/${id}`,
        { status: "in_progress" }
      );

      if (response && response.data.success) {
        toast.success("Status updated to On Progress");
        // Update local state
        setWorkOrder((prev) =>
          prev ? { ...prev, status: "in_progress" } : null
        );
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

  // --- FUNGSI REVERT STATUS KE PENDING ---
  const handleRevertStatus = async () => {
    if (!isEditable) {
      toast.error("You don't have permission to update status");
      return;
    }

    if (!id) {
      toast.error("Work order ID not found");
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await requestApi.put(
        `/transactions/work-orders/status/${id}`,
        { status: "pending" }
      );

      if (response && response.data.success) {
        toast.success("Status reverted to Pending");
        // Update local state
        setWorkOrder((prev) => (prev ? { ...prev, status: "pending" } : null));
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

  // const status: Record<string, string> = {
  //   pending: "Pending",
  //   in_progress: "On Progress",
  //   completed: "Completed",
  //   cancelled: "Cancelled",
  // };

  // --- FUNGSI DOWNLOAD PDF DENGAN JSPDF-AUTOTABLE ---
  const handleDownload = async (format: "pdf" | "excel") => {
    if (!id) {
      toast.error("Work order ID not found");
      return;
    }

    setDownloading(format);
    try {
      if (format === "pdf") {
        if (!workOrder) return;

        // 1. Setup PDF (Custom Size: 11" x 9.5")
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "in",
          format: [11, 9.5],
        });

        // 2. Define Data
        const bodyData: any[] = [];

        // --- HEADER ROWS ---
        // Row 1: Title
        bodyData.push([
          {
            content: `FILE SPK DAN PENGIRIMAN NO : ${workOrder.noSurat}`,
            colSpan: 11,
            styles: {
              halign: "left",
              fontSize: 14,
              fontStyle: "bold",
              fillColor: [255, 255, 255],
            },
          },
        ]);

        // Row 2: Header Info 1
        bodyData.push([
          {
            content: "TGL :",
            colSpan: 2,
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: formatDateSimple(workOrder.createdAt),
            colSpan: 1,
            styles: { halign: "left" },
          },
          {
            content: "Project",
            colSpan: 2,
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: workOrder.project,
            colSpan: 4,
            styles: { halign: "left" },
          },
          {
            content: "PPN",
            colSpan: 2,
            rowSpan: 3,
            styles: {
              halign: "center",
              valign: "middle",
              fontSize: 16,
              fontStyle: "bold",
            },
          },
        ]);

        // Row 3: Header Info 2
        bodyData.push([
          {
            content: "CUST :",
            colSpan: 2,
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: workOrder.orderName.toUpperCase(),
            colSpan: 1,
            styles: { halign: "left" },
          },
          {
            content: "Finishing",
            colSpan: 2,
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: workOrder.finishing,
            colSpan: 4,
            styles: { halign: "left" },
          },
        ]);

        // Row 4: Header Info 3
        bodyData.push([
          {
            content: "No. PO :",
            colSpan: 2,
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: workOrder.orderPo || "-",
            colSpan: 1,
            styles: { halign: "left" },
          },
          {
            content: "Tebal",
            colSpan: 2,
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: workOrder.thickness,
            colSpan: 4,
            styles: { halign: "left" },
          },
        ]);

        // Row 5: Table Header
        bodyData.push([
          {
            content: "No",
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: [243, 244, 246],
            },
          },
          {
            content: "Uraian",
            colSpan: 2,
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: [243, 244, 246],
            },
          },
          {
            content: "Jumlah",
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: [243, 244, 246],
            },
          },
          {
            content: "Kirim",
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: [243, 244, 246],
            },
          },
          {
            content: "Kirim",
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: [243, 244, 246],
            },
          },
          {
            content: "Kirim",
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: [243, 244, 246],
            },
          },
          {
            content: "Kirim",
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: [243, 244, 246],
            },
          },
          {
            content: "Kirim",
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: [243, 244, 246],
            },
          },
          {
            content: "Kirim",
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: [243, 244, 246],
            },
          },
          {
            content: "KETERANGAN",
            styles: {
              halign: "center",
              fontStyle: "bold",
              fillColor: [243, 244, 246],
            },
          },
        ]);

        // --- ITEMS ROWS ---
        const items = workOrder.items.length > 0 ? workOrder.items : [];
        const rowsToFill = 15;

        for (let i = 0; i < Math.max(items.length, rowsToFill); i++) {
          const item = items[i];
          if (item) {
            const deliveryQuantities =
              workOrder.deliveryOrders?.map((delivery) => {
                const deliveryItem = delivery.items.find(
                  (dItem) => dItem.productName === item.productName
                );
                return deliveryItem?.quantity || 0;
              }) || [];

            bodyData.push([
              { content: (i + 1).toString(), styles: { halign: "center" } },
              {
                content: item.productName,
                colSpan: 2,
                styles: { halign: "left" },
              },
              {
                content: `${item.quantity} ${item.unit || "PCS"}`,
                styles: { halign: "center" },
              },
              {
                content: deliveryQuantities[0]
                  ? deliveryQuantities[0].toString()
                  : "",
                styles: { halign: "center" },
              },
              {
                content: deliveryQuantities[1]
                  ? deliveryQuantities[1].toString()
                  : "",
                styles: { halign: "center" },
              },
              {
                content: deliveryQuantities[2]
                  ? deliveryQuantities[2].toString()
                  : "",
                styles: { halign: "center" },
              },
              {
                content: deliveryQuantities[3]
                  ? deliveryQuantities[3].toString()
                  : "",
                styles: { halign: "center" },
              },
              {
                content: deliveryQuantities[4]
                  ? deliveryQuantities[4].toString()
                  : "",
                styles: { halign: "center" },
              },
              {
                content: deliveryQuantities[5]
                  ? deliveryQuantities[5].toString()
                  : "",
                styles: { halign: "center" },
              },
              { content: item.remark || "-", styles: { halign: "center" } },
            ]);
          } else {
            // Empty row
            bodyData.push([
              { content: "", styles: { minCellHeight: 0.25 } },
              { content: "", colSpan: 2 },
              { content: "" },
              { content: "" },
              { content: "" },
              { content: "" },
              { content: "" },
              { content: "" },
              { content: "" },
              { content: "" },
            ]);
          }
        }

        // --- FOOTER ROWS ---
        // Footer Row 1 (Headers)
        bodyData.push([
          {
            content: "NOTE",
            rowSpan: 2,
            styles: {
              halign: "center",
              valign: "middle",
              fontStyle: "bold",
              fontSize: 8,
              textColor: [255, 255, 255], // Hide default text so we can draw it manually
            },
          },
          {
            content: workOrder.note || "-",
            colSpan: 5,
            rowSpan: 2,
            styles: { halign: "left", valign: "top" },
          },
          {
            content: "Adm",
            colSpan: 2,
            styles: { halign: "center", fontStyle: "bold", valign: "middle" },
          },
          {
            content: "Check By",
            colSpan: 2,
            styles: { halign: "center", fontStyle: "bold", valign: "middle" },
          },
          {
            content: "PPIC",
            styles: { halign: "center", fontStyle: "bold", valign: "middle" },
          },
        ]);

        // Footer Row 2 (Signature Boxes)
        bodyData.push([
          // Note & Content are rowspanned
          {
            content: "",
            colSpan: 2,
            styles: { minCellHeight: 1.0 }, // ~2.5cm height
          },
          {
            content: "",
            colSpan: 2,
            styles: { minCellHeight: 1.0 },
          },
          {
            content: "",
            styles: { minCellHeight: 1.0 },
          },
        ]);

        // 3. Generate AutoTable
        autoTable(pdf, {
          body: bodyData,
          startY: 0.5,
          margin: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 },
          theme: "grid",
          styles: {
            font: "times",
            fontSize: 9,
            lineColor: [0, 0, 0],
            lineWidth: 0.01, // Thin borders
            cellPadding: 0.05,
            textColor: [0, 0, 0],
            valign: "middle",
          },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: "bold",
          },
          columnStyles: {
            0: { cellWidth: 0.4 }, // No
            1: { cellWidth: 0.5 }, // Uraian part 1
            2: { cellWidth: 3.8 }, // Uraian part 2 (Adjusted to fill width)
            3: { cellWidth: 0.8 }, // Jumlah
            4: { cellWidth: 0.5 }, // Kirim 1
            5: { cellWidth: 0.5 }, // Kirim 2
            6: { cellWidth: 0.5 }, // Kirim 3
            7: { cellWidth: 0.5 }, // Kirim 4
            8: { cellWidth: 0.5 }, // Kirim 5
            9: { cellWidth: 0.5 }, // Kirim 6
            10: { cellWidth: 1.5 }, // Keterangan
          },
          didDrawCell: (data) => {
            // Rotate "NOTE" text
            if (
              data.section === "body" &&
              data.cell.raw &&
              (data.cell.raw as any).content === "NOTE"
            ) {
              const doc = data.doc;
              const { x, y, width, height } = data.cell;
              doc.saveGraphicsState();
              doc.setTextColor(0, 0, 0);
              doc.setFont("times", "bold");
              doc.setFontSize(14);
              doc.text("NOTE", x + width + 0.15, y + height - 0.4, {
                angle: 90,
                align: "center",
                baseline: "middle",
              });
              doc.restoreGraphicsState();
            }
          },
        });

        pdf.save(`SPK-${workOrder?.noSurat || id}.pdf`);
        toast.success("PDF downloaded successfully");
      } else if (format === "excel") {
        if (!workOrder) return;

        // 1. Setup Data Array (Array of Arrays)
        const ws_data: any[][] = [];

        // Row 1: Title (Merged A1:K1)
        ws_data.push([`FILE SPK DAN PENGIRIMAN NO : ${workOrder.noSurat}`]);

        // Row 2: Header Info 1
        ws_data.push([
          "TGL :",
          "",
          formatDateSimple(workOrder.createdAt),
          "Project",
          "",
          workOrder.project,
          "",
          "",
          "",
          "PPN",
          "",
        ]);

        // Row 3: Header Info 2
        ws_data.push([
          "CUST :",
          "",
          workOrder.orderName.toUpperCase(),
          "Finishing",
          "",
          workOrder.finishing,
          "",
          "",
          "",
          "",
          "",
        ]);

        // Row 4: Header Info 3
        ws_data.push([
          "No. PO :",
          "",
          workOrder.orderPo || "-",
          "Tebal",
          "",
          workOrder.thickness,
          "",
          "",
          "",
          "",
          "",
        ]);

        // Row 5: Table Header
        ws_data.push([
          "No",
          "Uraian",
          "",
          "Jumlah",
          "Kirim",
          "Kirim",
          "Kirim",
          "Kirim",
          "Kirim",
          "Kirim",
          "KETERANGAN",
        ]);

        // --- DEFINISI MERGE CELLS ---
        const merges: XLSX.Range[] = [
          // Title Merge (A1:K1)
          { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },

          // Header Info Merges
          { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // TGL label
          { s: { r: 1, c: 3 }, e: { r: 1, c: 4 } }, // Project label
          { s: { r: 1, c: 5 }, e: { r: 1, c: 8 } }, // Project value
          { s: { r: 1, c: 9 }, e: { r: 3, c: 10 } }, // PPN

          { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }, // CUST label
          { s: { r: 2, c: 3 }, e: { r: 2, c: 4 } }, // Finishing label
          { s: { r: 2, c: 5 }, e: { r: 2, c: 8 } }, // Finishing value

          { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }, // No PO label
          { s: { r: 3, c: 3 }, e: { r: 3, c: 4 } }, // Tebal label
          { s: { r: 3, c: 5 }, e: { r: 3, c: 8 } }, // Tebal value

          // Table Header Merges
          { s: { r: 4, c: 1 }, e: { r: 4, c: 2 } }, // Uraian header
        ];

        // --- DATA ROWS ---
        let currentRow = 5;

        workOrder.items.forEach((item, index) => {
          const deliveryQuantities =
            workOrder.deliveryOrders?.map((delivery) => {
              const deliveryItem = delivery.items.find(
                (dItem) => dItem.productName === item.productName
              );
              return deliveryItem?.quantity || 0;
            }) || [];

          const row = [
            index + 1,
            item.productName,
            "",
            `${item.quantity} ${item.unit || "PCS"}`,
            deliveryQuantities[0] || "",
            deliveryQuantities[1] || "",
            deliveryQuantities[2] || "",
            deliveryQuantities[3] || "",
            deliveryQuantities[4] || "",
            deliveryQuantities[5] || "",
            item.remark || "-",
          ];
          ws_data.push(row);

          merges.push({
            s: { r: currentRow, c: 1 },
            e: { r: currentRow, c: 2 },
          });
          currentRow++;
        });

        // --- EMPTY ROWS ---
        const emptyRowsCount = Math.max(0, 15 - workOrder.items.length);
        for (let i = 0; i < emptyRowsCount; i++) {
          ws_data.push(["", "", "", "", "", "", "", "", "", "", ""]);
          merges.push({
            s: { r: currentRow, c: 1 },
            e: { r: currentRow, c: 2 },
          });
          currentRow++;
        }

        // --- FOOTER ---
        const noteStartRow = currentRow;
        ws_data.push([
          "NOTE",
          workOrder.note || "-",
          "",
          "",
          "",
          "",
          "Adm",
          "",
          "Check By",
          "",
          "PPIC",
        ]);
        ws_data.push(["", "", "", "", "", "", "", "", "", "", ""]);
        ws_data.push(["", "", "", "", "", "", "", "", "", "", ""]);
        ws_data.push(["", "", "", "", "", "", "", "", "", "", ""]);

        const noteEndRow = currentRow + 3;

        // Footer Merges
        merges.push({
          s: { r: noteStartRow, c: 0 },
          e: { r: noteEndRow, c: 0 },
        }); // NOTE vertical
        merges.push({
          s: { r: noteStartRow, c: 1 },
          e: { r: noteEndRow, c: 5 },
        }); // Note content

        merges.push({
          s: { r: noteStartRow, c: 6 },
          e: { r: noteStartRow, c: 7 },
        }); // Adm Header
        merges.push({
          s: { r: noteStartRow, c: 8 },
          e: { r: noteStartRow, c: 9 },
        }); // Check By Header

        merges.push({
          s: { r: noteStartRow + 1, c: 6 },
          e: { r: noteEndRow, c: 7 },
        }); // Adm Box
        merges.push({
          s: { r: noteStartRow + 1, c: 8 },
          e: { r: noteEndRow, c: 9 },
        }); // Check By Box
        merges.push({
          s: { r: noteStartRow + 1, c: 10 },
          e: { r: noteEndRow, c: 10 },
        }); // PPIC Box

        // 2. Create Sheet
        const ws = XLSX.utils.aoa_to_sheet(ws_data);

        // 3. Apply Merges
        ws["!merges"] = merges;

        // 4. Apply Column Widths
        ws["!cols"] = [
          { wch: 5 }, // No
          { wch: 10 }, // Kode
          { wch: 30 }, // Uraian
          { wch: 10 }, // Jumlah
          { wch: 5 }, // Kirim 1
          { wch: 5 }, // Kirim 2
          { wch: 5 }, // Kirim 3
          { wch: 5 }, // Kirim 4
          { wch: 5 }, // Kirim 5
          { wch: 5 }, // Kirim 6
          { wch: 20 }, // Keterangan
        ];

        // 5. Apply Styles
        const borderStyle = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };

        const centerStyle = {
          alignment: { horizontal: "center", vertical: "center" },
          font: { name: "Times New Roman", sz: 11 },
          border: borderStyle,
        };

        const leftStyle = {
          alignment: { horizontal: "left", vertical: "center" },
          font: { name: "Times New Roman", sz: 11 },
          border: borderStyle,
        };

        const titleStyle = {
          font: { name: "Times New Roman", sz: 14, bold: true },
          alignment: { horizontal: "left", vertical: "center" },
          border: borderStyle,
        };

        const headerLabelStyle = {
          font: { name: "Times New Roman", sz: 11, bold: true },
          alignment: { horizontal: "left", vertical: "center" },
          border: borderStyle,
        };

        const headerValueStyle = {
          font: { name: "Times New Roman", sz: 11 },
          alignment: { horizontal: "left", vertical: "center" },
          border: borderStyle,
        };

        const ppnStyle = {
          font: { name: "Times New Roman", sz: 16, bold: true },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderStyle,
        };

        const tableHeaderStyle = {
          font: { name: "Times New Roman", sz: 11, bold: true },
          alignment: { horizontal: "center", vertical: "center" },
          border: borderStyle,
          fill: { fgColor: { rgb: "F3F4F6" } }, // Light gray bg
        };

        // Apply styles to cells
        for (const key in ws) {
          if (key[0] === "!") continue;
          const cell = ws[key];
          const col = key.replace(/[0-9]/g, "");
          const row = parseInt(key.replace(/[^0-9]/g, ""));

          // Default style
          cell.s = centerStyle;

          // Title (Row 1)
          if (row === 1) {
            cell.s = titleStyle;
          }
          // Header Info (Row 2-4)
          else if (row >= 2 && row <= 4) {
            // PPN Cell
            if (col === "J" || col === "K") {
              cell.s = ppnStyle;
            }
            // Labels
            else if (
              (row === 2 && (col === "A" || col === "D")) ||
              (row === 3 && (col === "A" || col === "D")) ||
              (row === 4 && (col === "A" || col === "D"))
            ) {
              cell.s = headerLabelStyle;
            }
            // Values
            else {
              cell.s = headerValueStyle;
            }
          }
          // Table Header (Row 5)
          else if (row === 5) {
            cell.s = tableHeaderStyle;
          }
          // Data Rows
          else if (row > 5 && row < noteStartRow + 1) {
            if (col === "B" || col === "C") {
              cell.s = leftStyle; // Uraian left align
            } else {
              cell.s = centerStyle;
            }
          }
          // Footer
          else if (row >= noteStartRow + 1) {
            // Note Vertical
            if (col === "A") {
              cell.s = {
                ...centerStyle,
                alignment: {
                  horizontal: "center",
                  vertical: "center",
                  textRotation: 90,
                },
                font: { name: "Times New Roman", sz: 10, bold: true },
              };
            }
            // Note Content
            else if (col >= "B" && col <= "F") {
              cell.s = {
                ...leftStyle,
                alignment: {
                  horizontal: "left",
                  vertical: "top",
                  wrapText: true,
                },
              };
            }
            // Signatures
            else {
              if (row === noteStartRow + 1) {
                cell.s = {
                  ...centerStyle,
                  font: { ...centerStyle.font, bold: true },
                };
              } else {
                cell.s = centerStyle;
              }
            }
          }
        }

        // 6. Create Workbook and Save
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SPK");
        XLSX.writeFile(wb, `SPK-${workOrder.noSurat || id}.xlsx`);
        toast.success("Excel downloaded successfully");
      }
    } catch (error) {
      console.error("Failed to download work order:", error);
      toast.error("Failed to download work order");
    } finally {
      setDownloading(null);
    }
  };

  // PAGE LOAD RENDER
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
            Back to Work Orders
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER UTAMA ---
  return (
    <div className="pt-6 px-4 md:px-8 pb-14 min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Tombol Back */}
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

      {/* Container Kertas */}
      <div
        ref={printRef}
        className="bg-white w-[1056px] mx-auto h-[912px] p-8 shadow-md print:shadow-none print:p-0"
      >
        <table
          className="w-full border-collapse border border-black text-xs table-fixed h-full"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          {/* Definisi Lebar Kolom agar layout fix */}
          <colgroup>
            <col className="w-10" />
            <col className="w-[50px]" />
            <col className="w-[300px]" />
            <col className="w-20" />
            <col className="w-[45px]" />
            <col className="w-[45px]" />
            <col className="w-[45px]" />
            <col className="w-[45px]" />
            <col className="w-[45px]" />
            <col className="w-[45px]" />
            <col className="w-[150px]" />
          </colgroup>

          <thead>
            {/* Baris 1: Judul Besar */}
            <tr className="h-10">
              <th
                className="text-left px-2 font-bold text-lg border border-black uppercase"
                colSpan={11}
              >
                FILE SPK DAN PENGIRIMAN NO : {workOrder.noSurat}
              </th>
            </tr>

            {/* Bagian Header Informasi (TGL, Proyek, PPN) */}
            {/* Menggunakan teknik colspan untuk membagi layout atas menjadi 3 blok visual */}

            {/* Baris 2 Header */}
            <tr className="h-8">
              {/* Blok Kiri (Label) */}
              <th
                className="text-left px-2 font-bold border border-black align-middle"
                colSpan={2}
              >
                TGL :
              </th>
              {/* Blok Kiri (Isi) - Mengambil sisa ruang Uraian */}
              <th className="text-left px-2 font-normal border border-black align-middle">
                {formatDateSimple(workOrder.createdAt)}
              </th>

              {/* Blok Tengah (Label & Isi) - Mengambil ruang Jumlah + sebagian Kirim */}
              <th
                className="text-left px-2 font-bold border border-black align-middle"
                colSpan={2}
              >
                Project
              </th>
              <th
                className="text-left px-2 font-normal border border-black align-middle"
                colSpan={4}
              >
                {workOrder.project}
              </th>

              {/* Blok Kanan (PPN) - Merged Cell Besar */}
              <th
                className="text-center font-bold text-xl border border-black align-middle"
                colSpan={2}
                rowSpan={3}
              >
                PPN
              </th>
            </tr>

            {/* Baris 3 Header */}
            <tr className="h-8">
              <th
                className="text-left px-2 font-bold border border-black align-middle"
                colSpan={2}
              >
                CUST :
              </th>
              <th className="text-left px-2 font-normal border border-black align-middle">
                {workOrder.orderName.toUpperCase()}
              </th>

              <th
                className="text-left px-2 font-bold border border-black align-middle"
                colSpan={2}
              >
                Finishing
              </th>
              <th
                className="text-left px-2 font-normal border border-black align-middle"
                colSpan={4}
              >
                {workOrder.finishing}
              </th>
            </tr>

            {/* Baris 4 Header */}
            <tr className="h-8">
              <th
                className="text-left px-2 font-bold border border-black align-middle"
                colSpan={2}
              >
                No. PO :
              </th>
              <th className="text-left px-2 font-normal border border-black align-middle">
                {workOrder.orderPo || "-"}
              </th>
              <th
                className="text-left px-2 font-bold  border border-black align-middle"
                colSpan={2}
              >
                Tebal
              </th>
              <th
                className="text-left px-2 font-normal border border-black align-middle"
                colSpan={4}
              >
                {workOrder.thickness}
              </th>
            </tr>

            {/* Baris Judul Kolom Tabel Utama */}
            <tr className="h-8 bg-gray-50">
              <th className="border border-black font-bold text-center">No</th>
              <th
                className="border border-black font-bold text-center"
                colSpan={2}
              >
                Uraian
              </th>
              <th className="border border-black font-bold text-center">
                Jumlah
              </th>
              <th className="border border-black font-bold text-center">
                Kirim
              </th>
              <th className="border border-black font-bold text-center">
                Kirim
              </th>
              <th className="border border-black font-bold text-center">
                Kirim
              </th>
              <th className="border border-black font-bold text-center">
                Kirim
              </th>
              <th className="border border-black font-bold text-center">
                Kirim
              </th>
              <th className="border border-black font-bold text-center">
                Kirim
              </th>
              <th className="border border-black font-bold text-center">
                KETERANGAN
              </th>
            </tr>
          </thead>

          <tbody>
            {workOrder.items.length > 0 ? (
              workOrder.items.map((item, index) => {
                // Find delivery quantities for this product
                const deliveryQuantities =
                  workOrder.deliveryOrders?.map((delivery) => {
                    const deliveryItem = delivery.items.find(
                      (dItem) => dItem.productName === item.productName
                    );
                    return deliveryItem?.quantity || 0;
                  }) || [];

                return (
                  <tr key={index} className="h-8">
                    {/* Kolom No */}
                    <td className="border border-black text-center align-middle px-1">
                      {index + 1}
                    </td>
                    {/* Kolom Uraian */}
                    <td
                      className="border border-black text-left align-middle px-2"
                      colSpan={2}
                    >
                      {item.productName}
                    </td>
                    {/* Kolom Jumlah */}
                    <td className="border border-black text-center align-middle">
                      {item.quantity} {item.unit || "PCS"}
                    </td>
                    {/* 6 Kolom Kirim */}
                    {[...Array(6)].map((_, i) => (
                      <td
                        key={i}
                        className="border border-black text-center align-middle"
                      >
                        {deliveryQuantities[i] ? deliveryQuantities[i] : ""}
                      </td>
                    ))}
                    {/* Kolom Keterangan */}
                    <td className="border border-black text-center align-middle">
                      {item.remark || "-"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={10}
                  className="border border-black p-4 text-center italic"
                >
                  No items available
                </td>
              </tr>
            )}

            {/* Baris Kosong Tambahan */}
            {[...Array(Math.max(0, 15 - workOrder.items.length))].map(
              (_, idx) => (
                <tr key={`empty-${idx}`} className="h-8">
                  <td className="border border-black"></td>
                  <td className="border border-black" colSpan={2}></td>
                  <td className="border border-black"></td>
                  {[...Array(6)].map((_, i) => (
                    <td key={i} className="border border-black"></td>
                  ))}
                  <td className="border border-black"></td>
                </tr>
              )
            )}
          </tbody>

          <tfoot>
            <tr>
              {/* Bagian NOTE Vertical */}
              <td
                className="border border-black bg-white text-center align-middle p-0 w-10"
                rowSpan={2}
              >
                <div className="transform -rotate-90 font-bold tracking-widest text-xs whitespace-nowrap">
                  NOTE
                </div>
              </td>
              {/* Isi Note */}
              <td
                className="border border-black align-top p-2"
                colSpan={5}
                rowSpan={2}
              >
                {workOrder.note || "-"}
              </td>
              {/* Header Tanda Tangan */}
              <td
                className="border border-black text-center font-bold h-8 align-middle"
                colSpan={2}
              >
                Adm
              </td>
              <td
                className="border border-black text-center font-bold h-8 align-middle"
                colSpan={2}
              >
                Check By
              </td>
              <td className="border border-black text-center font-bold h-8 align-middle">
                PPIC
              </td>
            </tr>
            <tr>
              {/* Kotak Tanda Tangan Kosong */}
              <td className="border border-black h-24" colSpan={2}></td>
              <td className="border border-black h-24" colSpan={2}></td>
              <td className="border border-black h-24"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-3 mt-6 print:hidden max-w-[1000px] mx-auto">
        {/* Left: Status Update Button */}
        <div className="flex gap-3">
          {workOrder.status !== "completed" && isEditable && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-sm font-medium rounded-lg text-white hover:bg-amber-600 transition-all duration-200 disabled:opacity-50"
              onClick={handleUpdateStatus}
              disabled={
                updatingStatus ||
                downloading !== null ||
                workOrder.status !== "pending"
              }
            >
              {updatingStatus ? (
                <CircleNotchIcon className="animate-spin w-4 h-4" />
              ) : (
                <PlayIcon weight="duotone" className="w-4 h-4" />
              )}
              {updatingStatus ? "Updating..." : `Set On Progress`}
            </button>
          )}
          {(workOrder.status === "in_progress" ||
            workOrder.status === "on progress") &&
            isEditable &&
            isAdmin && (
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-500 text-sm font-medium rounded-lg text-white hover:bg-gray-600 transition-all duration-200 disabled:opacity-50"
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
        </div>

        {/* Right: Download Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-sm font-medium rounded-lg border text-gray-700 cursor-pointer border-green-300 hover:text-green-600 transition-all duration-200 disabled:opacity-50"
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
            {downloading === "excel" ? "Downloading..." : "Download Excel"}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-sm font-medium rounded-lg border text-gray-700 cursor-pointer border-red-300 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
            onClick={() => handleDownload("pdf")}
            disabled={downloading !== null}
          >
            {downloading === "pdf" ? (
              <CircleNotchIcon className="animate-spin w-4 h-4" />
            ) : (
              <FilePdfIcon weight="duotone" className="w-4 h-4 text-rose-500" />
            )}
            {downloading === "pdf" ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SPKShowPage;
