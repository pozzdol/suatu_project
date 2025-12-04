import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";

import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import {
  ArrowCircleLeftIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  ClockIcon,
  PackageIcon,
  TrashIcon,
  UserIcon,
  CheckIcon,
  ArrowCounterClockwiseIcon,
} from "@phosphor-icons/react";
import dayjs from "dayjs";

type WorkOrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit?: string;
  status: "in_process" | "finished";
};

type WorkOrderDetail = {
  id: string;
  orderId: string;
  noSurat: string;
  orderName: string;
  orderEmail: string;
  status: string;
  statusOrder: string;
  confirmedAt?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  items: WorkOrderItem[];
  finishing?: string;
  thickness?: string;
  project?: string;
};

function DetailSpkPage() {
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
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [deliveryOrder, setDeliveryOrder] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  useDocumentTitle(title ? `${title} - Detail` : "SPK Detail");

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
          orderId: order.orderId || order.order_id || "",
          noSurat: order.noSurat || order.no_surat || "-",
          orderName: order.orderName || order.order_name || "Unknown",
          orderEmail:
            order.orderEmail || order.order_email || "unknown@email.com",
          status: order.status || "pending",
          statusOrder: order.status_order || order.status || "pending",
          confirmedAt: order.updated_at || order.confirmedAt || null,
          createdAt: order.created_at || order.createdAt || null,
          updatedAt: order.updated_at || null,
          items:
            order.orderItems?.map((item: any, index: number) => ({
              id: item.id || `item-${index}`,
              productId: item.productId || item.product_id || "",
              productName: item.productName || "Unnamed Product",
              quantity: item.quantity ?? 0,
              unit: item.unit || "PCS",
              status: item.status || "in_process",
            })) || [],
          finishing: order.finishing || "HDG",
          thickness: order.thickness || "1,5MM",
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

  const fetchCheck = async () => {
    if (!id) return;
    try {
      const response = await requestApi.get(
        `transactions/finished-goods/work-order/${id}`
      );
      if (response && response.data.success) {
        const data = response.data.data.finishedGoods;
        setFinishedGoods(Array.isArray(data) ? data : []);
      } else {
        setFinishedGoods([]);
      }
    } catch (error) {
      console.error("Failed to fetch finished goods check:", error);
      setFinishedGoods([]);
    }
  };

  const fetchDeliveryOrder = async () => {
    if (!id) return;
    try {
      const response = await requestApi.get(
        `/transactions/delivery-orders/order/${workOrder?.orderId}`
      );
      if (response && response.data.success) {
        setDeliveryOrder(response.data.data.deliveryOrder || null);
      } else {
        setDeliveryOrder(null);
      }
    } catch (error) {
      console.error("Failed to fetch delivery order:", error);
      setDeliveryOrder(null);
    }
  };

  console.log("Finished Goods:", finishedGoods);

  // EFFECTS
  useEffect(() => {
    if (permit && id) {
      fetchWorkOrderDetail();
      fetchCheck();
      fetchDeliveryOrder();
    }
  }, [permit, id]);

  // HELPERS
  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<
      string,
      { label: string; bg: string; text: string }
    > = {
      pending: {
        label: "Pending",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
      },
      in_progress: {
        label: "On Progress",
        bg: "bg-blue-100",
        text: "text-blue-700",
      },
      completed: {
        label: "Completed",
        bg: "bg-emerald-100",
        text: "text-emerald-700",
      },
      cancelled: { label: "Cancelled", bg: "bg-red-100", text: "text-red-700" },
    };

    const config = status ? statusConfig[status] : undefined;
    if (!config) {
      return (
        <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-slate-100 text-slate-700">
          {status || "Unknown"}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getItemStatusBadge = (status: "in_process" | "finished") => {
    if (status === "finished") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircleIcon weight="fill" className="w-3.5 h-3.5" />
          Finished
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
        <ClockIcon weight="fill" className="w-3.5 h-3.5" />
        In Process
      </span>
    );
  };

  const handleBack = () => {
    navigate(indexUrl);
  };

  // FUNCTIONS
  const handleUpdateItemStatus = async (itemId: string, productId: string) => {
    if (!isEditable) {
      toast.error("You don't have permission to update item status");
      return;
    }

    setUpdatingItemId(itemId);
    try {
      const item = workOrder?.items.find((i) => i.id === itemId);
      if (!item) {
        toast.error("Product not found");
        setUpdatingItemId(null);
        return;
      }

      const payload = {
        workOrderId: id,
        productId: productId || itemId,
        quantity: item.quantity,
        producedAt: dayjs(workOrder?.createdAt || new Date()).format(
          "YYYY-MM-DD"
        ),
      };

      //   console.log("Payload for updating item status:", JSON.stringify(payload));

      const response = await requestApi.post(
        `/transactions/finished-goods`,
        payload
      );

      if (response && response.data.success) {
        toast.success("Product marked as finished and added to finished goods");
        // Update local state
        setWorkOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((item) =>
              item.id === itemId ? { ...item, status: "finished" } : item
            ),
          };
        });

        fetchCheck();
      } else {
        toast.error(response?.data?.message || "Failed to update item status");
      }
    } catch (error: any) {
      console.error("Failed to update item status:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update item status"
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  // FUNCTION: DELETE FINISHED GOODS
  const handleDeleteFinishedGoods = async (productId: string) => {
    if (!isEditable && !isAdmin) {
      toast.error("You don't have permission to delete finished goods");
      return;
    }

    const finishedGood = finishedGoods.find((fg) => fg.productId === productId);
    if (!finishedGood) {
      toast.error("Finished good not found");
      return;
    }

    setDeletingItemId(productId);
    try {
      const response = await requestApi.delete(
        `/transactions/finished-goods/${finishedGood.id}`
      );

      if (response && response.data.success) {
        toast.success("Finished good removed successfully");
        // Update local state - remove from finishedGoods
        setFinishedGoods((prev) =>
          prev.filter((fg) => fg.productId !== productId)
        );
        // Update item status back to in_process
        setWorkOrder((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map((item) =>
              item.productId === productId
                ? { ...item, status: "in_process" }
                : item
            ),
          };
        });
      } else {
        toast.error(
          response?.data?.message || "Failed to delete finished good"
        );
      }
    } catch (error: any) {
      console.error("Failed to delete finished good:", error);
      toast.error(
        error?.response?.data?.message || "Failed to delete finished good"
      );
    } finally {
      setDeletingItemId(null);
    }
  };

  // FUNCTION: UPDATE WORK ORDER STATUS TO COMPLETED
  const handleMarkComplete = async () => {
    if (!isEditable && !isAdmin) {
      toast.error("You don't have permission to update status");
      return;
    }

    if (!id) {
      toast.error("Work order ID not found");
      return;
    }

    setUpdatingStatus(true);
    try {
      // 1. Update work order status to completed
      const response = await requestApi.put(
        `/transactions/work-orders/status/${id}`,
        { status: "completed" }
      );

      if (response && response.data.success) {
        // 2. Create delivery order
        try {
          const deliveryOrderPayload = {
            orderId: workOrder?.orderId || id,
            description: `Delivery order for Work Order ${
              workOrder?.noSurat || id
            }`,
            status: "pending",
            shippedAt: null,
          };

          const deliveryResponse = await requestApi.post(
            `/transactions/delivery-orders`,
            deliveryOrderPayload
          );

          if (deliveryResponse && deliveryResponse.data.success) {
            setDeliveryOrder(deliveryResponse.data.data.deliveryOrder || null);
            toast.success(
              "Work order marked as completed and delivery order created"
            );
          } else {
            toast.success("Work order marked as completed");
            toast.error("Failed to create delivery order");
          }
        } catch (deliveryError: any) {
          console.error("Failed to create delivery order:", deliveryError);
          toast.success("Work order marked as completed");
          toast.error(
            deliveryError?.response?.data?.message ||
              "Failed to create delivery order"
          );
        }

        setWorkOrder((prev) =>
          prev
            ? { ...prev, status: "completed", statusOrder: "completed" }
            : null
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

  // FUNCTION: REVERT WORK ORDER STATUS TO IN_PROGRESS
  const handleRevertToInProgress = async () => {
    if (!isEditable && !isAdmin) {
      toast.error("You don't have permission to update status");
      return;
    }

    if (!id) {
      toast.error("Work order ID not found");
      return;
    }

    setUpdatingStatus(true);
    try {
      // 1. Update work order status to in_progress
      const response = await requestApi.put(
        `/transactions/work-orders/status/${id}`,
        { status: "in_progress" }
      );

      if (response && response.data.success) {
        // 2. Delete delivery order if exists
        if (deliveryOrder && deliveryOrder.id) {
          try {
            const deleteResponse = await requestApi.delete(
              `/transactions/delivery-orders/${deliveryOrder.id}`
            );

            if (deleteResponse && deleteResponse.data.success) {
              setDeliveryOrder(null);
              toast.success(
                "Work order reverted to In Progress and delivery order deleted"
              );
            } else {
              toast.success("Work order reverted to In Progress");
              toast.error("Failed to delete delivery order");
            }
          } catch (deleteError: any) {
            console.error("Failed to delete delivery order:", deleteError);
            toast.success("Work order reverted to In Progress");
            toast.error(
              deleteError?.response?.data?.message ||
                "Failed to delete delivery order"
            );
          }
        } else {
          toast.success("Work order reverted to In Progress");
        }

        setWorkOrder((prev) =>
          prev
            ? { ...prev, status: "in_progress", statusOrder: "in_progress" }
            : null
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

  const finishedCount = workOrder
    ? workOrder.items.filter((item) =>
        finishedGoods.some((fg) => fg.productId === item.productId)
      ).length
    : 0;
  const totalItems = workOrder?.items.length ?? 0;
  const progressPercentage =
    totalItems > 0 ? Math.round((finishedCount / totalItems) * 100) : 0;

  return (
    <div className="pt-6 px-4 md:px-8 pb-14 min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Header */}
      <div className="text-gray-500 mb-2 grid grid-cols-1 gap-2 md:flex md:justify-between md:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">
            {title} - Detail
          </h1>
          <p>{subTitle}</p>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex items-center space-x-2 mb-6">
        <button
          className="flex items-center text-sky-600 font-medium cursor-pointer hover:text-sky-700 transition duration-200 ease-in-out"
          onClick={handleBack}
        >
          <ArrowCircleLeftIcon weight="duotone" className="w-5 h-5 mr-2" /> Back
        </button>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Work Order Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
                Work Order
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {workOrder.noSurat}
              </h2>
            </div>
            {getStatusBadge(workOrder.status)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Customer */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-sky-50 rounded-lg">
                <UserIcon weight="duotone" className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400">
                  Customer
                </p>
                <p className="font-semibold text-gray-900">
                  {workOrder.orderName}
                </p>
                <p className="text-sm text-gray-500">{workOrder.orderEmail}</p>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <CalendarBlankIcon
                  weight="duotone"
                  className="w-5 h-5 text-indigo-600"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400">
                  Created At
                </p>
                <p className="font-medium text-gray-900">
                  {dayjs(workOrder.createdAt).format("DD MMMM YYYY - hh:mm")}
                </p>
              </div>
            </div>
          </div>
        </div>
        {workOrder.statusOrder === "in_progress" && (
          <>
            {/* Progress Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Production Progress
                </h3>
                <span className="text-sm font-medium text-gray-500">
                  {finishedCount} / {totalItems} items completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-linear-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-right text-sm font-semibold text-emerald-600 mt-2">
                {progressPercentage}%
              </p>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Products
              </h3>

              {workOrder.items.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <PackageIcon
                    weight="duotone"
                    className="w-12 h-12 mx-auto mb-3 text-gray-300"
                  />
                  <p>No products found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workOrder.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        item.status === "finished"
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Product Info */}
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                              item.status === "finished"
                                ? "bg-emerald-200 text-emerald-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {item.productName}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Quantity:{" "}
                              <span className="font-medium">
                                {item.quantity} {item.unit}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:ml-auto">
                          <div className="flex items-center gap-2">
                            {getItemStatusBadge(item.status)}
                            {finishedGoods.some(
                              (fg) => fg.productId === item.productId
                            ) && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-sky-100 text-sky-700">
                                In Finished Goods
                              </span>
                            )}
                          </div>

                          {isEditable && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-200 disabled:opacity-50"
                                onClick={() =>
                                  handleUpdateItemStatus(
                                    item.id,
                                    item.productId
                                  )
                                }
                                disabled={
                                  item.status !== "in_process" ||
                                  updatingItemId === item.id ||
                                  finishedGoods.some(
                                    (fg) => fg.productId === item.productId
                                  )
                                }
                              >
                                {updatingItemId === item.id ? (
                                  <CircleNotchIcon className="animate-spin w-3.5 h-3.5" />
                                ) : (
                                  <CheckCircleIcon
                                    weight="bold"
                                    className="w-3.5 h-3.5"
                                  />
                                )}
                                Mark Finished
                              </button>
                              {finishedGoods.some(
                                (fg) => fg.productId === item.productId
                              ) &&
                                isAdmin && (
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-all duration-200 disabled:opacity-50"
                                    onClick={() =>
                                      handleDeleteFinishedGoods(item.productId)
                                    }
                                    disabled={deletingItemId === item.productId}
                                  >
                                    {deletingItemId === item.productId ? (
                                      <CircleNotchIcon className="animate-spin w-3.5 h-3.5" />
                                    ) : (
                                      <TrashIcon
                                        weight="bold"
                                        className="w-3.5 h-3.5"
                                      />
                                    )}
                                    Back to In Process
                                  </button>
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {workOrder.statusOrder === "pending" && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-400 p-6 text-center">
            <p className="text-gray-500 italic">
              This order is still pending. Change it in the SPK page.
            </p>
          </div>
        )}

        {workOrder.statusOrder === "completed" && (
          <div className="bg-emerald-50 rounded-2xl shadow-sm border-2 border-emerald-200 p-6 text-center">
            <CheckCircleIcon
              weight="duotone"
              className="w-12 h-12 mx-auto mb-3 text-emerald-500"
            />
            <p className="text-emerald-700 font-semibold text-lg">
              Work Order Completed
            </p>
            <p className="text-emerald-600 text-sm mt-1">
              All items have been processed and this work order is now complete.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {(isEditable || isAdmin) && (
          <div className="flex justify-end gap-3">
            {workOrder.statusOrder === "in_progress" &&
              progressPercentage === 100 && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-sm font-medium rounded-lg text-white hover:bg-emerald-600 transition-all duration-200 disabled:opacity-50"
                  onClick={handleMarkComplete}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? (
                    <CircleNotchIcon className="animate-spin w-4 h-4" />
                  ) : (
                    <CheckIcon weight="bold" className="w-4 h-4" />
                  )}
                  {updatingStatus ? "Updating..." : "Mark as Complete"}
                </button>
              )}
            {workOrder.statusOrder === "completed" && isAdmin && (
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-sm font-medium rounded-lg text-white hover:bg-amber-600 transition-all duration-200 disabled:opacity-50"
                onClick={handleRevertToInProgress}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <CircleNotchIcon className="animate-spin w-4 h-4" />
                ) : (
                  <ArrowCounterClockwiseIcon
                    weight="bold"
                    className="w-4 h-4"
                  />
                )}
                {updatingStatus ? "Updating..." : "Revert to In Progress"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DetailSpkPage;
