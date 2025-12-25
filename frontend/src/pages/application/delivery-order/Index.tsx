import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";
import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import {
  EyeIcon,
  MagnifyingGlassIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
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

  // Pagination & Search State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 6;

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
            orderCode: order.orderCode || order.noSurat || "-",
            customerName:
              order.recipientName || order.order?.name || "Unknown Customer",
            customerEmail: order.order.nopo || order.order?.email || "-",
            plannedDeliveryDate:
              order.plannedDeliveryDate || order.planned_delivery_date || null,
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

  // Filter & Pagination Logic
  const filteredOrders = workOrders.filter((order) => {
    const query = searchQuery.toLowerCase();
    return (
      order.orderCode.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerEmail.toLowerCase().includes(query) ||
      (order.status && order.status.toLowerCase().includes(query)) ||
      order.items.some((item) => item.productName.toLowerCase().includes(query))
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        {/* Search Bar */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Search delivery orders, customers, PO, or items..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>

        {loadingOrders ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: itemsPerPage }).map((_, index) => (
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
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
            <p className="text-lg font-medium text-gray-700">
              {searchQuery
                ? "No matching delivery orders found"
                : "Belum ada Delivery Order"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Pesanan yang sudah dikonfirmasi akan tampil di sini. Gunakan halaman Orders untuk membuat Delivery Order baru."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {paginatedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow duration-200"
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
                          No. PO
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

                  <div className="mt-5 grow">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-gray-400">
                      Ordered Items
                    </p>
                    {order.items.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <li
                            key={`${order.id}-item-${index}`}
                            className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2"
                          >
                            <span className="text-sm font-medium text-gray-800 truncate max-w-[150px]">
                              {item.productName}
                            </span>
                            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap ml-2">
                              × {item.quantity}
                            </span>
                          </li>
                        ))}
                        {order.items.length > 3 && (
                          <li className="text-xs text-center text-gray-500 italic pt-1">
                            + {order.items.length - 3} more items
                          </li>
                        )}
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
                      className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-full transition-all duration-200 flex-1 justify-center"
                      onClick={() => handleViewWorkOrder(order.id)}
                    >
                      <EyeIcon weight="duotone" className="w-4 h-4" />
                      Detail & Download
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6 rounded-lg shadow-sm">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() =>
                      handlePageChange(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          currentPage * itemsPerPage,
                          filteredOrders.length
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {filteredOrders.length}
                      </span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() =>
                          handlePageChange(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <CaretLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      {/* Page Numbers */}
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNumber = idx + 1;
                        if (
                          totalPages > 7 &&
                          pageNumber !== 1 &&
                          pageNumber !== totalPages &&
                          Math.abs(currentPage - pageNumber) > 1
                        ) {
                          if (Math.abs(currentPage - pageNumber) === 2) {
                            return (
                              <span
                                key={pageNumber}
                                className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        }

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            aria-current={
                              currentPage === pageNumber ? "page" : undefined
                            }
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === pageNumber
                                ? "z-10 bg-indigo-600 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      <button
                        onClick={() =>
                          handlePageChange(
                            Math.min(totalPages, currentPage + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <CaretRightIcon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DeliveryOrderPage;
