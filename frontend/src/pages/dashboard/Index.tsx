import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { validatePermit } from "@/utils/validation";
import toast from "react-hot-toast";
import { logout } from "@/utils/auth";
import {
  SignOutIcon,
  ChartLineUpIcon,
  PackageIcon,
  UsersIcon,
  ClipboardTextIcon,
  ArrowRightIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import requestApi from "@/utils/api";
import * as echarts from "echarts";
import Permit from "@/components/Permit";
import Loading from "@/components/Loading";

// BarChart Component (moved outside main component)
const BarChart = ({
  orderQuantity,
  deliveryQuantity,
}: {
  orderQuantity: number;
  deliveryQuantity: number;
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // Warna gradient asli Anda
    const originalGradient = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
      { offset: 0, color: "#667eea" },
      { offset: 1, color: "#764ba2" },
    ]);

    const option = {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderColor: "#eee",
        borderWidth: 1,
        textStyle: {
          color: "#333",
        },
        axisPointer: {
          type: "none", // Menghilangkan shadow pointer default agar lebih bersih
        },
        formatter: (params: any) => {
          // Format tooltip dengan ribuan separator
          const val = params[0].value;
          return `${params[0].marker} <b>${
            params[0].name
          }</b>: ${val.toLocaleString()}`;
        },
      },
      grid: {
        left: "3%",
        right: "10%", // Memberi ruang lebih untuk label
        bottom: "3%",
        top: "5%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        boundaryGap: [0, 0.01],
        // Membuat garis grid putus-putus dan tipis
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            color: "#e0e0e0",
          },
        },
        // Menghilangkan label angka di bawah jika ingin sangat minimalis (opsional, saat ini saya biarkan ada tapi warnanya soft)
        axisLabel: {
          color: "#999",
        },
      },
      yAxis: {
        type: "category",
        data: ["Total Order Quantity", "Total Delivery Quantity"],
        // Agar urutan dari atas ke bawah (opsional, tergantung selera)
        inverse: true,
        // Menghilangkan garis vertikal sumbu Y
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 13,
          fontWeight: 600,
          color: "#555",
          margin: 15,
        },
      },
      series: [
        {
          type: "bar",
          data: [orderQuantity, deliveryQuantity],
          barWidth: 80, // Mengatur ketebalan batang agar pas

          // Menampilkan background abu-abu tipis di belakang bar (Modern Look)
          showBackground: true,
          backgroundStyle: {
            color: "rgba(180, 180, 180, 0.1)",
            borderRadius: [0, 15, 15, 0],
          },

          itemStyle: {
            color: originalGradient,
            // Membuat sudut membulat (hanya sisi kanan)
            borderRadius: [0, 15, 15, 0],
            // Menambahkan bayangan halus sewarna dengan gradient
            shadowBlur: 10,
            shadowColor: "rgba(118, 75, 162, 0.3)",
            shadowOffsetY: 5,
          },

          label: {
            show: true,
            position: "right", // Posisi angka di sebelah kanan bar
            distance: 10,
            fontSize: 14,
            fontWeight: "bold",
            color: "#764ba2", // Menggunakan warna ungu tua dari gradient untuk teks
            formatter: (params: any) => {
              // Menambahkan koma untuk ribuan (contoh: 1,200)
              return params.value.toLocaleString();
            },
          },
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [orderQuantity, deliveryQuantity]);

  return <div ref={chartRef} style={{ width: "100%", height: "300px" }} />;
};

function DashboardIndexPage() {
  // PAGE LOAD
  const navigate = useNavigate();
  const [permit, setPermit] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      try {
        const pageData = await validatePermit(
          "9e2ad4d2d55a4faab5a082386def0bee"
        );

        if (pageData && pageData.success && pageData.data.permit.permission) {
          setPermit(pageData.data.permit.permission);
        } else {
          setPermit(false);
          toast.error("You don't have permission to access this page");
        }
      } catch (error) {
        setPermit(false);
        console.error("Failed to validate permissions, ", error);
        toast.error("Failed to validate permissions");
      }
    };

    initializePage();
  }, []);

  // -- PAGE LOAD END --

  // STATE MANAGEMENT
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<any[]>([]);
  const [deliveryData, setDeliveryData] = useState<any[]>([]);
  // STATE MANAGEMENT END

  // FETCH DATA
  const fetchOrderData = async () => {
    setIsLoading(true);
    try {
      const res = await requestApi.get("/transactions/orders/list");
      if (res && res.data.success) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const filteredOrders = res.data.data.orders.filter((order: any) => {
          const orderDate = new Date(order.created_at || order.createdAt);
          const orderYear = orderDate.getFullYear();
          const orderMonth = orderDate.getMonth();
          return orderYear === currentYear && orderMonth === currentMonth;
        });

        const ordersWithQuantity = filteredOrders.map((order: any) => ({
          ...order,
          totalQuantity: order.orderItems.reduce(
            (sum: number, item: any) => sum + item.quantity,
            0
          ),
          itemCount: order.orderItems.length,
        }));
        setOrderData(ordersWithQuantity);
      } else {
        toast.error("Failed to fetch order data");
      }
    } catch (error) {
      toast.error("Failed to fetch order data");
      console.error("Failed to fetch order data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeliveryData = async () => {
    setIsLoading(true);
    try {
      const res = await requestApi.get("/transactions/delivery-orders/list");
      if (res && res.data.success) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const filteredDeliveries = res.data.data.deliveryOrders.filter(
          (order: any) => {
            const orderDate = new Date(order.created_at || order.createdAt);
            const orderYear = orderDate.getFullYear();
            const orderMonth = orderDate.getMonth();
            return orderYear === currentYear && orderMonth === currentMonth;
          }
        );

        const deliveryOrdersWithStats = filteredDeliveries.map(
          (order: any) => ({
            ...order,
            // totalQuantity sudah ada dari API, tapi bisa dihitung juga:
            calculatedQuantity: order.items.reduce(
              (sum: number, item: any) => sum + item.quantity,
              0
            ),
          })
        );
        setDeliveryData(deliveryOrdersWithStats);
      } else {
        toast.error("Failed to fetch delivery data");
      }
    } catch (error) {
      toast.error("Failed to fetch delivery data");
      console.error("Failed to fetch delivery data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // FETCH DATA END

  // USE EFFECTS
  useEffect(() => {
    fetchOrderData();
    fetchDeliveryData();
  }, []);
  // USE EFFECTS END

  // HELPERS
  const getCurrentDate = () => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());
  };

  // HELPERS END

  // FUNCTIONS
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully signed out!");
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  // FUNCTIONS END

  // Quick Actions Data
  const quickActions = [
    {
      title: "Work Orders",
      description: "Manage production workflows",
      icon: ClipboardTextIcon,
      path: "/spk",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      title: "Products",
      description: "View product catalog",
      icon: PackageIcon,
      path: "/product",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: "Users",
      description: "Manage team members",
      icon: UsersIcon,
      path: "/general-setup/user-management",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      title: "Delivery Order",
      description: "View insights & reports",
      icon: ChartLineUpIcon,
      path: "/warehouse/delivery-order",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  if (isLoading) {
    return <Loading />;
  }

  if (!permit) {
    return <Permit />;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-linear-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Blur Elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000" />
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-500" />

        <div className="relative px-6 py-12 md:px-12 md:py-16">
          {/* Greeting Section */}
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-gray-600 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200/50 shadow-sm">
              <SparkleIcon weight="fill" className="w-4 h-4 text-amber-500" />
              <span>{getCurrentDate()}</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight mb-4">
              PT ANUGERAH HUTAMA MANDIRI PERKASA
            </h1>

            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Welcome to your workspace. Everything you need to manage your
              business, all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="px-6 md:px-12 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Quick Actions
              </h2>
              <p className="text-gray-500 mt-1">
                Jump right into what matters most
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className="group relative bg-white rounded-2xl p-6 text-left border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-linear-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <action.icon weight="fill" className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500">{action.description}</p>

                {/* Arrow */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-6 md:px-12 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Monthly Overview
                </h2>
                <p className="text-gray-500 mt-1">
                  Summary of orders and deliveries for the current month
                </p>
              </div>
            </div>
            <BarChart
              orderQuantity={orderData.reduce(
                (sum, order) => sum + order.totalQuantity,
                0
              )}
              deliveryQuantity={deliveryData.reduce(
                (sum, delivery) => sum + delivery.totalQuantity,
                0
              )}
            />
            <span className="text-sm text-gray-500">
              *Data{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="px-6 md:px-12 pb-12">
        <div className="max-w-5xl mx-auto flex justify-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center border border-rose-300 gap-2 px-6 py-3 text-sm font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-100 cursor-pointer rounded-full transition-all duration-200"
          >
            <SignOutIcon weight="bold" className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardIndexPage;
