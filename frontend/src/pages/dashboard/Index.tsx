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
  categories,
  orderData,
  deliveryData,
}: {
  categories: string[];
  orderData: number[];
  deliveryData: number[];
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const option = {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderColor: "#eee",
        borderWidth: 1,
        textStyle: { color: "#333" },
        axisPointer: { type: "shadow" },
      },
      legend: {
        data: ["Orders", "Deliveries"],
        bottom: 0,
        selectedMode: true,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "10%",
        top: "5%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        splitLine: {
          lineStyle: { type: "dashed", color: "#eee" },
        },
        axisLabel: { color: "#999" },
      },
      yAxis: {
        type: "category",
        data: categories,
        axisTick: { alignWithLabel: true },
        axisLine: { lineStyle: { color: "#eee" } },
        axisLabel: { color: "#666" },
        inverse: true, // Optional: to show latest month at top or bottom depending on preference, usually categories are top-to-bottom
      },
      series: [
        {
          name: "Orders",
          type: "bar",
          data: orderData,
          barGap: 0.1,
          barMaxWidth: 30,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#667eea" },
              { offset: 1, color: "#764ba2" },
            ]),
            borderRadius: [0, 4, 4, 0],
          },
        },
        {
          name: "Deliveries",
          type: "bar",
          data: deliveryData,
          barMaxWidth: 30,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#ff9a9e" },
              { offset: 1, color: "#fecfef" },
            ]),
            borderRadius: [0, 4, 4, 0],
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
  }, [categories, orderData, deliveryData]);

  return <div ref={chartRef} style={{ width: "100%", height: "350px" }} />;
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

  // Chart Data State
  const [monthlyData, setMonthlyData] = useState<{
    categories: string[];
    orders: number[];
    deliveries: number[];
  }>({
    categories: [],
    orders: [],
    deliveries: [],
  });

  // HELPER TO GENERATE LAST 3 MONTHS
  const getLast3Months = () => {
    const months = [];
    const today = new Date();
    for (let i = 2; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'long' }),
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
      });
    }
    return months;
  };

  // FETCH DATA
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [orderRes, deliveryRes] = await Promise.all([
        requestApi.get("/transactions/orders/list"),
        requestApi.get("/transactions/delivery-orders/list"),
      ]);

      const last3Months = getLast3Months();

      // Init counters
      const stats = last3Months.map(m => ({
        ...m,
        orderTotal: 0,
        deliveryTotal: 0
      }));

      // Process Orders
      if (orderRes && orderRes.data.success) {
        const orders = orderRes.data.data.orders;
        orders.forEach((order: any) => {
          const d = new Date(order.created_at || order.createdAt);
          const match = stats.find(s => s.monthIndex === d.getMonth() && s.year === d.getFullYear());
          if (match) {
            const qty = order.orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
            match.orderTotal += qty;
          }
        });
      }

      // Process Deliveries
      if (deliveryRes && deliveryRes.data.success) {
        const deliveries = deliveryRes.data.data.deliveryOrders;
        deliveries.forEach((delivery: any) => {
          const d = new Date(delivery.created_at || delivery.createdAt);
          const match = stats.find(s => s.monthIndex === d.getMonth() && s.year === d.getFullYear());
          if (match) {
            // Check structure, some APIs might use 'items' or 'deliveryItems', user code used 'items'
            const qty = (delivery.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
            match.deliveryTotal += qty;
          }
        });
      }

      setMonthlyData({
        categories: stats.map(s => s.name),
        orders: stats.map(s => s.orderTotal),
        deliveries: stats.map(s => s.deliveryTotal),
      });

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
              categories={monthlyData.categories}
              orderData={monthlyData.orders}
              deliveryData={monthlyData.deliveries}
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
