import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { EyeIcon } from "@phosphor-icons/react";
import dayjs from "dayjs";

type WorkOrderItem = {
  productName: string;
  quantity: number;
};

type WorkOrder = {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  plannedDeliveryDate?: string | null;
  status?: string;
  items: WorkOrderItem[];
};

function DeliveryOrderPage() {
  // PAGE LOAD
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subTitle, setSubtitle] = useState("");
  const [indexUrl, setIndexUrl] = useState("");
  const [permit, setPermit] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

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

  useDocumentTitle(title || "Delivery Orders");

  // STATE MANAGEMENT
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchWorkOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await requestApi.get(
        "/transactions/delivery-orders/list"
      );
      if (response && response.data.success) {
        const mappedOrders: WorkOrder[] =
          response.data.data.deliveryOrders?.map((order: any) => ({
            id: order.id,
            orderCode: order.noSurat || order.orderCode || "-",
            customerName: order.recipientName || "Unknown Customer",
            customerEmail:
              order.recipientPhone || order.order.email || "Unknown User",
            plannedDeliveryDate:
              order.planned_delivery_date || order.plannedDeliveryDate || null,
            status: order.status || "pending",
            items:
              order.items?.map((item: any) => ({
                productName: item.productName || "Unnamed Product",
                quantity: item.quantity ?? 0,
              })) || [],
          })) || [];

        setWorkOrders(mappedOrders);
      } else {
        toast.error("Failed to fetch delivery order data");
      }
    } catch (error) {
      console.error("Failed to fetch delivery order data:", error);
      toast.error("Failed to fetch delivery order data");
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
  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<
      string,
      { label: string; bg: string; text: string }
    > = {
      Pending: {
        label: "Pending",
        bg: "bg-gray-100",
        text: "text-gray-700",
      },
      Shipped: {
        label: "Shipped",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
      },
      Delivered: {
        label: "Delivered",
        bg: "bg-emerald-100",
        text: "text-emerald-700",
      },
      Cancelled: {
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

  const status: Record<string, string> = {
    pending: "Pending",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
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
              Belum ada Delivery Order
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Pesanan yang sudah dikonfirmasi akan tampil di sini. Gunakan
              halaman Orders untuk membuat Delivery Order baru.
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
                      Delivery Order
                    </p>
                    <h2 className="text-2xl font-semibold text-gray-900 mt-1">
                      {order.orderCode}
                    </h2>
                  </div>
                  {getStatusBadge(
                    order.status ? status[order.status] : undefined
                  )}
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
                        Telp / Email
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {order.customerEmail || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.26em] text-gray-400">
                        Planned Delivery Date
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {order.plannedDeliveryDate
                          ? dayjs(order.plannedDeliveryDate).format(
                              "DD MMMM YYYY"
                            )
                          : "-"}
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
                    className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-full transition-all duration-200"
                    onClick={() => handleViewWorkOrder(order.id)}
                  >
                    <EyeIcon weight="duotone" className="w-4 h-4" />
                    Detail & Download
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

export default DeliveryOrderPage;
