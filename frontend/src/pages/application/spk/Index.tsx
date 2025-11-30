import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { Eye, FilePdf, FileXls } from "@phosphor-icons/react";

type WorkOrderItem = {
  productName: string;
  quantity: number;
};

type WorkOrder = {
  id: string;
  orderCode: string;
  customerName: string;
  requestedBy: string;
  confirmedAt?: string | null;
  status?: string;
  items: WorkOrderItem[];
};

function SPKIndexPage() {
  // PAGE LOAD
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subTitle, setSubtitle] = useState("");
  const [indexUrl, setIndexUrl] = useState("");
  const [permit, setPermit] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

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

  // -- PAGE LOAD END --

  useDocumentTitle(title || "Work Orders");

  // STATE MANAGEMENT
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchWorkOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await requestApi.get("/transactions/orders/list");
      if (response && response.data.success) {
        const mappedOrders: WorkOrder[] =
          response.data.data.orders?.map((order: any) => ({
            id: order.id,
            orderCode: order.id || "-",
            customerName: order.name || "Unknown Customer",
            requestedBy: order.email || "Unknown User",
            confirmedAt: order.updated_at || null,
            status: order.status || "pending",
            items:
              order.orderItems?.map((item: any) => ({
                productName: item.productName || "Unnamed Product",
                quantity: item.quantity ?? 0,
              })) || [],
          })) || [];

        setWorkOrders(mappedOrders);
      } else {
        toast.error("Failed to fetch work order data");
      }
    } catch (error) {
      console.error("Failed to fetch work order data:", error);
      toast.error("Failed to fetch work order data");
    } finally {
      setLoadingOrders(false);
    }
  };
  // FETCH DATA END

  // EFFECTS
  useEffect(() => {
    if (permit) {
      fetchWorkOrders();
    }
  }, [permit]);
  // EFFECTS END

  //  HELPERS
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      return new Intl.DateTimeFormat("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateString));
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<
      string,
      { label: string; bg: string; text: string }
    > = {
      draft: {
        label: "Draft",
        bg: "bg-gray-100",
        text: "text-gray-700",
      },
      pending: {
        label: "Pending",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
      },
      processing: {
        label: "Processing",
        bg: "bg-blue-100",
        text: "text-blue-700",
      },
      confirmed: {
        label: "Confirmed",
        bg: "bg-green-100",
        text: "text-green-700",
      },
      completed: {
        label: "Completed",
        bg: "bg-emerald-100",
        text: "text-emerald-700",
      },
      cancelled: {
        label: "Cancelled",
        bg: "bg-red-100",
        text: "text-red-700",
      },
    };

    const config = status ? statusConfig[status] : undefined;

    if (!config) {
      return (
        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
          {status || "Unknown"}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };
  // HELPERS END

  // FUNCTIONS
  const handleViewWorkOrder = (id: string) => {
    navigate(`${indexUrl}/${id}`);
  };

  const handleDownload = (id: string, format: "pdf" | "excel") => {
    if (!isEditable && !isAdmin) {
      toast.error("You don't have permission to download work orders");
      return;
    }

    const routeSuffix = format === "pdf" ? "download-pdf" : "download-excel";
    const url = `/transactions/work-orders/${id}/${routeSuffix}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  // FUNCTIONS END

  // TABLE
  // TABLE END

  // PAGE LOAD RENDER
  if (loading) {
    return <Loading />;
  }

  if (!permit) {
    return <Permit />;
  }
  // PAGE LOAD RENDER END

  return (
    <div className="pt-6 px-8 pb-14 min-h-[calc(100vh-64px)] md:py-6">
      <div className="text-gray-500 grid grid-cols-1 gap-2 md:flex md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p>{subTitle}</p>
        </div>
      </div>

      <div className="mt-4 space-y-6">
        {loadingOrders ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
                <div className="flex gap-3">
                  <div className="h-9 bg-gray-200 rounded w-24" />
                  <div className="h-9 bg-gray-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : workOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
            <p className="text-lg font-medium text-gray-700">
              Belum ada Work Order
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Pesanan yang sudah dikonfirmasi akan tampil di sini. Gunakan
              halaman Orders untuk membuat Work Order baru.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {workOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">
                      Work Order
                    </p>
                    <h2 className="text-2xl font-semibold text-gray-900 mt-1">
                      {order.orderCode}
                    </h2>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.26em] text-gray-400">
                      Customer
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {order.customerName}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.26em] text-gray-400">
                        Email
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {order.requestedBy || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.26em] text-gray-400">
                        Confirmed At
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {formatDate(order.confirmedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-[11px] uppercase tracking-[0.26em] text-gray-400">
                    Ordered Items
                  </p>
                  {order.items.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {order.items.map((item, index) => (
                        <li
                          key={`${order.id}-item-${index}`}
                          className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2"
                        >
                          <span className="text-sm font-medium text-gray-800">
                            {item.productName}
                          </span>
                          <span className="text-xs font-semibold text-gray-500">
                            × {item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-gray-500 italic">
                      Belum ada rincian barang.
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-full transition-all duration-200"
                    onClick={() => handleViewWorkOrder(order.id)}
                  >
                    <Eye weight="duotone" className="w-4 h-4" />
                    Lihat Work Order
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-sm font-medium rounded-full border border-gray-200 text-gray-700 hover:border-sky-200 hover:text-sky-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleDownload(order.id, "pdf")}
                    disabled={!isEditable && !isAdmin}
                    title={
                      !isEditable && !isAdmin
                        ? "Anda tidak memiliki izin untuk mengunduh"
                        : undefined
                    }
                  >
                    <FilePdf weight="duotone" className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-sm font-medium rounded-full border border-gray-200 text-gray-700 hover:border-emerald-200 hover:text-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleDownload(order.id, "excel")}
                    disabled={!isEditable && !isAdmin}
                    title={
                      !isEditable && !isAdmin
                        ? "Anda tidak memiliki izin untuk mengunduh"
                        : undefined
                    }
                  >
                    <FileXls weight="duotone" className="w-4 h-4" />
                    Excel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SPKIndexPage;
