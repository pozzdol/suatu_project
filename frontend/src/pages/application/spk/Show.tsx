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
          project: "-",
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

  const status: Record<string, string> = {
    pending: "Pending",
    in_progress: "On Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  // --- FUNGSI DOWNLOAD PDF YANG DIPERBAIKI ---
  const handleDownload = async (format: "pdf" | "excel") => {
    if (!id) {
      toast.error("Work order ID not found");
      return;
    }

    setDownloading(format);
    try {
      if (format === "pdf") {
        if (!printRef.current) {
          throw new Error("Document element not found");
        }

        // 1. Generate Image dengan Style Reset
        const dataUrl = await toPng(printRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
          style: {
            margin: "0",
            // padding: "16px",
            maxWidth: "none",
            width: "1100px",
            boxShadow: "none",
            transform: "none",
          },
        });

        // 2. Setup PDF (A4 Landscape)
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4",
        });

        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm

        // 3. Hitung Dimensi agar Fit penuh di halaman (dengan margin kecil)
        const marginX = 0; // Margin horizontal (mm)
        const marginY = 5; // Margin vertical (mm)
        const availableWidth = pdfWidth - marginX * 2;
        const availableHeight = pdfHeight - marginY * 2;

        // Scale agar fit dalam area yang tersedia
        const scaleX = availableWidth / imgProps.width;
        const scaleY = availableHeight / imgProps.height;
        const scale = Math.min(scaleX, scaleY);

        const finalWidth = imgProps.width * scale;
        const finalHeight = imgProps.height * scale;

        // 4. Posisi tengah
        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;

        pdf.addImage(dataUrl, "PNG", x, y, finalWidth, finalHeight);
        pdf.save(`SPK-${workOrder?.noSurat || id}.pdf`);
        toast.success("PDF downloaded successfully");
      } else {
        // --- LOGIKA EXCEL BARU (MIRIP LAYOUT PDF) ---

        // 1. Buat Workbook
        const wb = XLSX.utils.book_new();

        // 2. Siapkan Data Row-by-Row (Array of Arrays)
        // Kita butuh 11 Kolom: No(A), Uraian(B), Jumlah(C), Kirim(D-J [7 kolom]), Ket(K)
        const rows: (string | null)[][] = [];

        // Row 1: Judul Besar
        rows.push([
          `FILE SPK DAN PENGIRIMAN NO : ${workOrder?.noSurat || "-"}`,
        ]);

        // Row 2: TGL / Proyek / PPN (Header Kiri, Tengah, Kanan)
        rows.push([
          `TGL : ${formatDateSimple(workOrder?.createdAt)}`,
          null,
          null, // A-C
          `Proyek : ${workOrder?.project || "-"}`,
          null,
          null,
          null, // D-G
          "PPN",
          null,
          null,
          null, // H-K
        ]);

        // Row 3: CUST / Finishing / PPN (lanjutan merge)
        rows.push([
          `CUST : ${workOrder?.orderName?.toUpperCase() || "-"}`,
          null,
          null, // A-C
          `Finishing : ${workOrder?.finishing || "-"}`,
          null,
          null,
          null, // D-G
          null,
          null,
          null,
          null, // H-K (Merged dengan atas)
        ]);

        // Row 4: Selesai Produksi / Tebal / PPN
        rows.push([
          "Status : " + (workOrder?.status ? status[workOrder.status] : "-"),
          null,
          null, // A-C
          `Tebal : ${workOrder?.thickness || "-"}`,
          null,
          null,
          null, // D-G
          null,
          null,
          null,
          null, // H-K
        ]);

        // Row 5: Header Tabel
        const tableHeader = [
          "No",
          "Uraian",
          "Jumlah",
          "Kirim",
          "Kirim",
          "Kirim",
          "Kirim",
          "Kirim",
          "Kirim",
          "Kirim", // 7 Kolom Kirim
          "KETERANGAN",
        ];
        rows.push(tableHeader);

        // Row 6+: Isi Item
        const minRows = 15; // Minimal baris agar tabel terlihat panjang ke bawah
        const items = workOrder?.items || [];

        // Masukkan item
        items.forEach((item, i) => {
          rows.push([
            (i + 1).toString(),
            item.productName,
            `${item.quantity} ${item.unit || "PCS"}`,
            "",
            "",
            "",
            "",
            "",
            "",
            "", // 7 kolom kirim kosong
            "", // Keterangan
          ]);
        });

        // Tambahkan baris kosong untuk mengisi sisa halaman (Padding)
        const remainingRows = minRows - items.length;
        for (let i = 0; i < remainingRows; i++) {
          rows.push(["", "", "", "", "", "", "", "", "", "", ""]);
        }

        // Row Footer: Note & Signature
        // Baris Header Tanda Tangan
        rows.push([
          "NOTE",
          "",
          "",
          "",
          "",
          "",
          "", // Kolom Note (Merged A-G)
          "Adm", // H
          "Check By",
          null, // I-J
          "PPIC", // K
        ]);

        // Baris Isi Tanda Tangan (Space kosong vertikal)
        // Kita buat 3 baris kosong untuk tanda tangan
        for (let k = 0; k < 3; k++) {
          rows.push([
            "",
            "",
            "",
            "",
            "",
            "",
            "", // Note content area
            "", // Adm box
            "",
            "", // Check by box
            "", // PPIC box
          ]);
        }

        // 2. Buat Worksheet
        const ws = XLSX.utils.aoa_to_sheet(rows);

        // 3. Konfigurasi Lebar Kolom (WCH = Width Character)
        ws["!cols"] = [
          { wch: 5 }, // A: No
          { wch: 35 }, // B: Uraian (Lebar)
          { wch: 15 }, // C: Jumlah
          { wch: 6 },
          { wch: 6 },
          { wch: 6 },
          { wch: 6 },
          { wch: 6 },
          { wch: 6 },
          { wch: 6 }, // D-J: Kirim (Kecil)
          { wch: 20 }, // K: Keterangan
        ];

        // 4. Konfigurasi MERGE CELLS (Gabungan Sel)
        // Format: { s: {r: barisAwal, c: kolomAwal}, e: {r: barisAkhir, c: kolomAkhir} }
        // Ingat: Index dimulai dari 0 (A=0, Row1=0)

        ws["!merges"] = [
          // Row 1: Judul Utama (A1:K1)
          { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },

          // Row 2: Header Kiri (A2:C2), Tengah (D2:G2), Kanan (H2:K4 - PPN Besar)
          { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }, // TGL
          { s: { r: 1, c: 3 }, e: { r: 1, c: 6 } }, // Proyek
          { s: { r: 1, c: 7 }, e: { r: 3, c: 10 } }, // PPN BOX BESAR (Merge ke bawah sampai row 4)

          // Row 3: Header Kiri (A3:C3), Tengah (D3:G3)
          { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }, // CUST
          { s: { r: 2, c: 3 }, e: { r: 2, c: 6 } }, // Finishing

          // Row 4: Header Kiri (A4:C4), Tengah (D4:G4)
          { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }, // Selesai Produksi
          { s: { r: 3, c: 3 }, e: { r: 3, c: 6 } }, // Tebal

          // --- FOOTER ---
          // Row Start Footer = (Header 5 baris) + (Total Baris Item + Padding)
          // Header tabel ada di index 4. Item mulai index 5.
          // Total data rows = items.length + remainingRows (selalu minRows)
          // Start Footer Index = 5 + minRows

          // Merge Kolom NOTE (A sampai G, vertikal mencakup header ttd + body ttd)
          // Baris Footer Header = 5 + minRows
          // Baris Footer Body = 3 baris
          {
            s: { r: 5 + minRows, c: 0 },
            e: { r: 5 + minRows + 3, c: 6 }, // Merge kotak Note besar
          },

          // Merge Header "Check By" (I sampai J)
          {
            s: { r: 5 + minRows, c: 8 },
            e: { r: 5 + minRows, c: 9 },
          },
          // Merge Body "Check By" (I sampai J, ke bawah)
          {
            s: { r: 5 + minRows + 1, c: 8 },
            e: { r: 5 + minRows + 3, c: 9 },
          },
          // Merge Body "Adm" (ke bawah)
          {
            s: { r: 5 + minRows + 1, c: 7 },
            e: { r: 5 + minRows + 3, c: 7 },
          },
          // Merge Body "PPIC" (ke bawah)
          {
            s: { r: 5 + minRows + 1, c: 10 },
            e: { r: 5 + minRows + 3, c: 10 },
          },
        ];

        // 5. Generate File
        XLSX.utils.book_append_sheet(wb, ws, "SPK");
        XLSX.writeFile(wb, `SPK-${workOrder?.noSurat || id}.xlsx`);
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
        className="max-w-[1000px] mx-auto bg-white p-4 md:p-8 shadow-md print:shadow-none print:p-0 text-black font-sans text-sm"
      >
        {/* HEADER SECTION */}
        <div className="border-t border-l border-r border-black">
          {/* Baris 1: Judul SPK */}
          <div className="flex border-b border-black">
            <div className="grow p-2 font-bold text-base md:text-lg">
              FILE SPK DAN PENGIRIMAN NO : {workOrder.noSurat}
            </div>
          </div>

          {/* Baris 2: Detail Header */}
          <div className="flex">
            {/* Kolom Kiri */}
            <div className="w-1/2 border-r border-black">
              <div className="flex border-b border-black">
                <div className="w-24 p-1 pl-2 font-medium">TGL :</div>
                <div className="grow p-1 font-medium">
                  {formatDateSimple(workOrder.createdAt)}
                </div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-24 p-1 pl-2 font-medium">CUST :</div>
                <div className="grow p-1 font-bold">
                  {workOrder.orderName.toUpperCase()}
                </div>
              </div>
              <div className="flex">
                <div className="p-1 pl-2 font-medium">Status :</div>
                <div className="grow p-1">
                  {workOrder.status ? status[workOrder.status] : "-"}
                </div>
              </div>
            </div>

            {/* Kolom Tengah */}
            <div className="w-[30%] border-r border-black">
              <div className="flex border-b border-black">
                <div className="w-20 p-1 pl-2">Proyek</div>
                <div className="grow p-1">{workOrder.project}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-20 p-1 pl-2">Finishing</div>
                <div className="grow p-1 font-bold">{workOrder.finishing}</div>
              </div>
              <div className="flex">
                <div className="w-20 p-1 pl-2">Tebal</div>
                <div className="grow p-1 font-bold">{workOrder.thickness}</div>
              </div>
            </div>

            {/* Kolom Kanan (PPN) */}
            <div className="grow flex items-center justify-center font-bold text-xl md:text-2xl">
              PPN
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="w-full">
          <table className="w-full border-collapse border border-black text-xs md:text-sm">
            <thead>
              <tr className="text-center font-bold">
                <th className="border border-black p-1 w-10">No</th>
                <th className="border border-black p-1 text-left pl-2">
                  Uraian
                </th>
                <th className="border border-black p-1 w-24">Jumlah</th>
                {/* 7 Kolom Kirim */}
                {[...Array(7)].map((_, i) => (
                  <th key={i} className="border border-black p-1 w-12">
                    Kirim
                  </th>
                ))}
                <th className="border border-black p-1 w-32">KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              {/* Mapping Items */}
              {workOrder.items.length > 0 ? (
                workOrder.items.map((item, index) => (
                  <tr key={index} className="h-8">
                    <td className="border border-black text-center p-1">
                      {index + 1}
                    </td>
                    <td className="border border-black p-1 pl-2">
                      {item.productName}
                    </td>
                    <td className="border border-black text-center p-1">
                      {item.quantity} {item.unit || "PCS"}
                    </td>
                    {[...Array(7)].map((_, i) => (
                      <td key={i} className="border border-black"></td>
                    ))}
                    <td className="border border-black"></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={11}
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
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                    {[...Array(7)].map((_, i) => (
                      <td key={i} className="border border-black"></td>
                    ))}
                    <td className="border border-black"></td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER SECTION */}
        <div className="flex border-l border-r border-b border-black h-36">
          {/* Bagian Kiri: NOTE */}
          <div className="grow flex">
            {/* Teks "NOTE" Vertikal */}
            <div className="w-10 border-r border-black flex items-center justify-center bg-white">
              <span
                className="transform -rotate-90 font-bold tracking-widest text-gray-700 text-xs"
                style={{ whiteSpace: "nowrap" }}
              >
                NOTE
              </span>
            </div>
            {/* Area Kosong */}
            <div className="grow p-2"></div>
          </div>

          {/* Bagian Kanan: Tanda Tangan */}
          <div className="w-[40%] border-l border-black flex flex-col">
            {/* Header Tanda Tangan */}
            <div className="flex border-b border-black text-center font-bold bg-white h-8 items-center text-xs">
              <div className="flex-1 border-r border-black h-full flex items-center justify-center">
                Adm
              </div>
              <div className="flex-2 border-r border-black h-full flex items-center justify-center">
                Check By
              </div>
              <div className="flex-1 h-full flex items-center justify-center">
                PPIC
              </div>
            </div>
            {/* Body Tanda Tangan */}
            <div className="flex grow">
              <div className="flex-1 border-r border-black"></div>
              <div className="flex-2 border-r border-black"></div>
              <div className="flex-1"></div>
            </div>
          </div>
        </div>
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
            onClick={() => handleDownload("pdf")}
            disabled={downloading !== null}
          >
            {downloading === "pdf" ? (
              <CircleNotchIcon className="animate-spin w-4 h-4" />
            ) : (
              <FilePdf weight="duotone" className="w-4 h-4" />
            )}
            {downloading === "pdf" ? "Downloading..." : "Download PDF"}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:border-emerald-300 hover:text-emerald-600 transition-all duration-200 disabled:opacity-50"
            onClick={() => handleDownload("excel")}
            disabled={downloading !== null}
          >
            {downloading === "excel" ? (
              <CircleNotchIcon className="animate-spin w-4 h-4" />
            ) : (
              <FileXls weight="duotone" className="w-4 h-4" />
            )}
            {downloading === "excel" ? "Downloading..." : "Download Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SPKShowPage;
