import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { requestApi } from "@/utils/api";
import { validatePermit } from "@/utils/validation";

import Loading from "@/components/Loading";
import Permit from "@/components/Permit";
import {
  PackageIcon,
  CubeIcon,
  ClipboardTextIcon,
  CalendarBlankIcon,
} from "@phosphor-icons/react";
import dayjs from "dayjs";

type FinishedGood = {
  id: string;
  workOrderId: string;
  workOrderNoSurat: string;
  productId: string;
  productName: string;
  quantity: number;
  notes: string | null;
  producedAt: string;
  deleted: string | null;
  created_at: string;
  updated_at: string;
};

type ProductSummary = {
  productId: string;
  productName: string;
  totalQuantity: number;
  orderCount: number;
};

function FinishedGoodsIndexPage() {
  // PAGE LOAD
  //   const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subTitle, setSubtitle] = useState("");
  //   const [indexUrl, setIndexUrl] = useState("");
  const [permit, setPermit] = useState(false);
  //   const [isEditable, setIsEditable] = useState(false);
  //   const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        const pageData = await validatePermit(
          "fb8c36e66e1247d597632ee9d98efc4b"
        );

        if (pageData && pageData.success && pageData.data.permit.permission) {
          setTitle(pageData.data.page.name);
          setSubtitle(pageData.data.page.description);
          //   setIndexUrl(pageData.data.page.url);
          setPermit(pageData.data.permit.permission);
          //   setIsEditable(pageData.data.permit.isEditable);
          //   setIsAdmin(pageData.data.permit.isAdmin);
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

  // STATE MANAGEMENT
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchFinishedGoods = async () => {
    setLoadingData(true);
    try {
      const response = await requestApi.get(
        "/transactions/finished-goods/list"
      );
      if (response && response.data.success) {
        setFinishedGoods(response.data.data.finishedGoods || []);
      } else {
        toast.error("Failed to fetch finished goods");
      }
    } catch (error) {
      console.error("Failed to fetch finished goods:", error);
      toast.error("Failed to fetch finished goods");
    } finally {
      setLoadingData(false);
    }
  };
  // FETCH DATA END

  // EFFECTS
  useEffect(() => {
    if (permit) {
      fetchFinishedGoods();
    }
  }, [permit]);
  // EFFECTS END

  // HELPERS
  // Summary per product
  const productSummary: ProductSummary[] = finishedGoods.reduce((acc, fg) => {
    const existing = acc.find((p) => p.productId === fg.productId);
    if (existing) {
      existing.totalQuantity += fg.quantity;
      existing.orderCount += 1;
    } else {
      acc.push({
        productId: fg.productId,
        productName: fg.productName,
        totalQuantity: fg.quantity,
        orderCount: 1,
      });
    }
    return acc;
  }, [] as ProductSummary[]);

  // Summary per product per order (grouped by work order)
  const orderGrouped = finishedGoods.reduce((acc, fg) => {
    const existing = acc.find((o) => o.workOrderId === fg.workOrderId);
    if (existing) {
      existing.items.push({
        productId: fg.productId,
        productName: fg.productName,
        quantity: fg.quantity,
        producedAt: fg.created_at,
      });
    } else {
      acc.push({
        workOrderId: fg.workOrderId,
        workOrderNoSurat: fg.workOrderNoSurat,
        items: [
          {
            productId: fg.productId,
            productName: fg.productName,
            quantity: fg.quantity,
            producedAt: fg.created_at,
          },
        ],
      });
    }
    return acc;
  }, [] as { workOrderId: string; workOrderNoSurat: string; items: { productId: string; productName: string; quantity: number; producedAt: string }[] }[]);

  // Total counts
  const totalProducts = productSummary.length;
  const totalQuantity = productSummary.reduce(
    (sum, p) => sum + p.totalQuantity,
    0
  );
  const totalOrders = [...new Set(finishedGoods.map((fg) => fg.workOrderId))]
    .length;
  // HELPERS END

  // PAGE LOAD RENDER
  if (loading) {
    return <Loading />;
  }

  if (!permit) {
    return <Permit />;
  }
  // PAGE LOAD RENDER END

  return (
    <div className="pt-6 px-4 md:px-8 pb-14 min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="text-gray-500 grid grid-cols-1 gap-2 md:flex md:justify-between md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">{title}</h1>
          <p>{subTitle}</p>
        </div>
      </div>

      {loadingData ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Products */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-100 rounded-xl">
                  <CubeIcon weight="duotone" className="w-8 h-8 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {totalProducts}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Quantity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <PackageIcon
                    weight="duotone"
                    className="w-8 h-8 text-emerald-600"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Quantity</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {totalQuantity.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <ClipboardTextIcon
                    weight="duotone"
                    className="w-8 h-8 text-amber-600"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {totalOrders}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CubeIcon weight="duotone" className="w-5 h-5 text-sky-600" />
              Summary per Product
            </h3>

            {productSummary.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <PackageIcon
                  weight="duotone"
                  className="w-12 h-12 mx-auto mb-3 text-gray-300"
                />
                <p>No finished goods found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                        Product Name
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                        Total Quantity
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">
                        Order Count
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {productSummary.map((product) => (
                      <tr
                        key={product.productId}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">
                            {product.productName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-emerald-100 text-emerald-700">
                            {product.totalQuantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-sky-100 text-sky-700">
                            {product.orderCount} order
                            {product.orderCount > 1 ? "s" : ""}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail per Order */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardTextIcon
                weight="duotone"
                className="w-5 h-5 text-amber-600"
              />
              Detail per Order
            </h3>

            {orderGrouped.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center py-10 text-gray-500">
                <PackageIcon
                  weight="duotone"
                  className="w-12 h-12 mx-auto mb-3 text-gray-300"
                />
                <p>No finished goods found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orderGrouped.map((order) => (
                  <div
                    key={order.workOrderId}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <ClipboardTextIcon
                            weight="duotone"
                            className="w-5 h-5 text-amber-600"
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">
                            Work Order
                          </p>
                          <p className="font-semibold text-sky-600">
                            {order.workOrderNoSurat}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-sky-100 text-sky-700">
                        {order.items.length} item
                        {order.items.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Card Body - Products List */}
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div
                          key={`${order.workOrderId}-${item.productId}-${idx}`}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {item.productName}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <CalendarBlankIcon
                                weight="duotone"
                                className="w-3.5 h-3.5"
                              />
                              {dayjs(item.producedAt).format("DD MMM YYYY")}
                            </p>
                          </div>
                          <span className="inline-flex px-3 py-1 text-sm font-bold rounded-full bg-emerald-100 text-emerald-700 ml-3">
                            {item.quantity.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Card Footer - Total */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Total Quantity
                      </span>
                      <span className="text-lg font-bold text-gray-600">
                        {order.items
                          .reduce((sum, item) => sum + item.quantity, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FinishedGoodsIndexPage;
