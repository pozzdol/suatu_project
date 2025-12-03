import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import * as XLSX from "xlsx";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import {
  ArrowCircleLeftIcon,
  FilePdf,
  FileXls,
  CircleNotchIcon,
  PlayIcon,
} from "@phosphor-icons/react";

type WorkOrderItem = {
  productName: string;
  quantity: number;
  unit?: string;
};

type WorkOrderDetail = {
  id: string;
  noSurat: string;
  orderName: string;
  orderEmail: string;
  status: string;
  confirmedAt?: string | null;
  createdAt?: string | null;
  items: WorkOrderItem[];
  finishing?: string;
  thickness?: string;
  project?: string;
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
  const printRef = useRef<HTMLDivElement>(null);

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
        `/transactions/work-orders/edit/${id}`
      );
      if (response && response.data.success) {
        const order = response.data.data.workOrder;
        const mappedOrder: WorkOrderDetail = {
          id: order.id,
          noSurat: order.noSurat || order.no_surat || "-",
          orderName: order.orderName || order.order_name || "Unknown",
          orderEmail:
            order.orderEmail || order.order_email || "unknown@email.com",
          status: order.status || "pending",
          confirmedAt: order.updated_at || order.confirmedAt || null,
          createdAt: order.created_at || order.createdAt || null,
          items:
            order.orderItems?.map((item: any) => ({
              productName: item.productName || "Unnamed Product",
              quantity: item.quantity ?? 0,
              unit: item.unit || "PCS",
            })) || [],
          finishing: "HDG",
          thickness: "1,5MM",
          project: order.project || "-",
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

  const statusMap: Record<string, string> = {
    pending: "Pending",
    in_progress: "On Progress",
    completed: "Completed",
    cancelled: "Cancelled",
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
        if (!printRef.current) throw new Error("Document element not found");

        const dataUrl = await toPng(printRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
          style: {
            margin: "0",
            maxWidth: "none",
            width: "1100px",
            boxShadow: "none",
            transform: "none",
          },
        });

        const pdf = new jsPDF({
          orientation: "landscape", // Sesuai bentuk tabel yang lebar
          unit: "mm",
          format: "a4",
        });

        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const marginX = 10;
        const marginY = 10;
        const availableWidth = pdfWidth - marginX * 2;
        const availableHeight = pdfHeight - marginY * 2;

        const scaleX = availableWidth / imgProps.width;
        const scaleY = availableHeight / imgProps.height;
        const scale = Math.min(scaleX, scaleY);

        const finalWidth = imgProps.width * scale;
        const finalHeight = imgProps.height * scale;
        const x = (pdfWidth - finalWidth) / 2;
        const y = 10; // Top margin

        pdf.addImage(dataUrl, "PNG", x, y, finalWidth, finalHeight);
        pdf.save(`SPB-${workOrder?.noSurat || id}.pdf`);
        toast.success("PDF downloaded successfully");
      } else {
        // --- LOGIKA EXCEL BARU SESUAI GAMBAR ---
        const wb = XLSX.utils.book_new();
        const rows: (string | null)[][] = [];

        // Header Kiri
        rows.push([
          "UD. BAROKAH MANDIRI",
          null,
          null,
          "SURAT PENGIRIMAN BARANG",
        ]);
        rows.push([
          "CABLE SUPPORT SYSTEM",
          null,
          null,
          `TGL SPB : ${formatDateSimple(workOrder?.createdAt)}`,
        ]);
        rows.push([
          "Specialist Product : Cable tray, Duct, Ladder",
          null,
          null,
          `NO SPB : ${workOrder?.noSurat || "-"}`,
        ]);
        rows.push([null, null, null, `PO NO : ${workOrder?.project || "-"}`]);
        rows.push([
          "Jl.Satria 1 Blok C No.646 RT.001 RW.012 Pejuang Jaya - Bekasi",
          null,
          null,
          `SHIP TO`,
        ]);
        rows.push([
          "Telp : 88980503/8876256 Fax : 88980503",
          null,
          null,
          `${workOrder?.orderName || "-"}`,
        ]);
        rows.push([null]); // Spacer

        // Table Header (4 Kolom Sesuai Gambar)
        rows.push(["NO", "KETERANGAN BARANG", "QTY", "UNIT"]);

        // Items
        const items = workOrder?.items || [];
        items.forEach((item, i) => {
          rows.push([
            (i + 1).toString(),
            item.productName,
            item.quantity.toString(),
            item.unit || "PCS",
          ]);
        });

        // Min Rows padding
        const minRows = 10;
        const remainingRows = minRows - items.length;
        for (let i = 0; i < remainingRows; i++) {
          rows.push(["", "", "", ""]);
        }

        // Footer Text
        rows.push([
          "PENERIMA",
          "Barang tsb diatas kami terima",
          "QC",
          "LOGISTIK",
        ]);
        rows.push([null, "dalam keadaan CUKUP dan BAIK", null, null]);
        rows.push([null, null, null, null]);
        rows.push([null]); // Space tanda tangan
        rows.push([null]);
        rows.push([null]);
        rows.push([
          "(                         )",
          null,
          "(                         )",
          "(                         )",
        ]);

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Styling Col Width
        ws["!cols"] = [
          { wch: 5 }, // No
          { wch: 50 }, // Keterangan
          { wch: 10 }, // Qty
          { wch: 10 }, // Unit
        ];

        // Merges (Header Kanan)
        // Note: ExcelJS/SheetJS simple implementation might verify coordinates
        // Simpelnya biarkan baris sesuai urutan push diatas.

        XLSX.utils.book_append_sheet(wb, ws, "SPB");
        XLSX.writeFile(wb, `SPB-${workOrder?.noSurat || id}.xlsx`);
        toast.success("Excel downloaded successfully");
      }
    } catch (error) {
      console.error("Failed to download:", error);
      toast.error("Failed to download document");
    } finally {
      setDownloading(null);
    }
  };

  // RENDER
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

      {/* --- KERTAS / AREA PRINT --- */}
      <div
        ref={printRef}
        className="max-w-[1000px] mx-auto bg-white p-8 shadow-md print:shadow-none print:p-0 text-black font-sans text-sm"
      >
        {/* HEADER KOP SURAT */}
        <div className="flex justify-between mb-1">
          {/* Sisi Kiri Header */}
          <div className="w-1/2 text-center">
            <h2 className="font-bold text-base tracking-wide">
              UD. BAROKAH MANDIRI
            </h2>
            <p className="text-sm font-medium">CABLE SUPPORT SYSTEM</p>
            <p className="text-xs">
              Specialist Product : Cable tray, Duct, Ladder
            </p>
          </div>

          {/* Sisi Kanan Header */}
          <div className="w-1/2">
            <h2 className="font-medium text-lg text-right mb-1 mr-4">
              SURAT PENGIRIMAN BARANG
            </h2>
            <div className="grid grid-cols-[80px_10px_1fr] text-xs">
              <div className="pl-4">TGL SPB</div>
              <div>:</div>
              <div>{formatDateSimple(workOrder.createdAt)}</div>

              <div className="pl-4">NO SPB</div>
              <div>:</div>
              <div>{workOrder.noSurat}</div>

              <div className="pl-4">PO NO</div>
              <div>:</div>
              <div>{workOrder.project || "-"}</div>

              <div className="pl-4 font-bold mt-1">SHIP TO</div>
              <div className="mt-1"></div>
              <div className="mt-1"></div>

              {/* Customer Name merged below SHIP TO */}
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
        <div className="w-full mb-6">
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

              {/* Baris Kosong untuk Padding agar tabel panjang */}
              {[...Array(Math.max(0, 10 - workOrder.items.length))].map(
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

        {/* FOOTER / TANDA TANGAN */}
        <div className="grid grid-cols-4 gap-4 text-center text-sm font-medium">
          {/* Kolom 1: Penerima */}
          <div className="col-span-1">
            <div className="mb-16">PENERIMA</div>
            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
            <div>
              (
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              )
            </div>
          </div>

          {/* Kolom 2: Statement (Tengah - Span 1 atau 2 sesuai layout) */}
          <div className="col-span-1 flex flex-col justify-start pt-8">
            <p className="text-xs">
              Barang tsb diatas kami terima dalam keadaan CUKUP dan BAIK
            </p>
          </div>

          {/* Kolom 3: QC */}
          <div className="col-span-1">
            <div className="mb-16">QC</div>
            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
            <div>
              (
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              )
            </div>
          </div>

          {/* Kolom 4: Logistik */}
          <div className="col-span-1">
            <div className="mb-16">LOGISTIK</div>
            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
            <div>
              (
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              )
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (Tidak berubah logika) */}
      <div className="flex justify-between gap-3 mt-6 print:hidden max-w-[1000px] mx-auto">
        <div className="flex gap-3">
          {workOrder.status !== "completed" && isEditable && (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-sm font-medium rounded-lg text-white hover:bg-amber-600 transition-all disabled:opacity-50"
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
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-600 transition-all disabled:opacity-50"
            onClick={() => handleDownload("pdf")}
            disabled={downloading !== null}
          >
            {downloading === "pdf" ? (
              <CircleNotchIcon className="animate-spin w-4 h-4" />
            ) : (
              <FilePdf weight="duotone" className="w-4 h-4" />
            )}
            Download PDF
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:border-emerald-300 hover:text-emerald-600 transition-all disabled:opacity-50"
            onClick={() => handleDownload("excel")}
            disabled={downloading !== null}
          >
            {downloading === "excel" ? (
              <CircleNotchIcon className="animate-spin w-4 h-4" />
            ) : (
              <FileXls weight="duotone" className="w-4 h-4" />
            )}
            Download Excel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeliveryOrderShowPage;
