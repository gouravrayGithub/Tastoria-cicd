import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Select,
  Option,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Clock,
  ShoppingCart,
  User,
  Phone,
  MapPin,
  Calendar,
  Package,
} from "lucide-react";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [cafes, setCafes] = useState([]);
  const [cafeFilter, setCafeFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/orders`);
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setOrders((Array.isArray(data) ? data : data.orders || []).map(o => ({
          ...o,
          createdAt: o.createdAt ? new Date(o.createdAt) : null
        })));
      } catch (err) {
        console.error('fetchOrders', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchCafes = async () => {
      try {
        let r = await fetch(`${API_URL}/api/cafes`);
        if (!r.ok) r = await fetch(`${API_URL}/api/restaurants`);
        if (!r.ok) throw new Error("Failed to fetch cafes");
        const data = await r.json();
        const list = Array.isArray(data) ? data : data.cafes || data.restaurants || [];
        setCafes(list);
      } catch (err) {
        console.warn('fetchCafes', err);
        setCafes([]);
      }
    };

    fetchOrders();
    fetchCafes();
  }, []);

  const getCafeName = (order) => {
    const idCandidates = [
      order.restaurantId,
      order.cafeId,
      order.restaurant,
      order.cafe?._id,
      order.cafe
    ].filter(Boolean);
    for (const id of idCandidates) {
      const cafe = cafes.find(c => c._id?.toString() === id?.toString() || c.id?.toString() === id?.toString());
      if (cafe) return cafe.name;
    }
    return order.restaurant?.name || order.cafe?.name || "Unknown Cafe";
  };

  const mapFrontendStatusToBackend = (status) => {
    switch (status.toLowerCase()) {
      case "pending": return "Pending";
      case "preparing": return "Preparing";
      case "ready": return "Ready";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      default: return "Pending";
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const oldStatus = orders.find(o => o._id === orderId)?.status;
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));

      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: mapFrontendStatusToBackend(newStatus) }),
      });

      const updatedOrder = await res.json();
      if (!res.ok) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: oldStatus } : o));
        toast.error(updatedOrder.message || "Failed to update order status");
      } else {
        toast.success("Order status updated!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order status");
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending": return "amber";
      case "preparing": return "orange";
      case "ready": return "green";
      case "delivered": return "green";
      case "cancelled": return "red";
      default: return "gray";
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      (order.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.orderNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.phone || "").includes(searchTerm);

    const matchesStatus = statusFilter === "all" || (order.status === statusFilter);

    const matchesCafe = cafeFilter === "all" ||
      [order.restaurantId, order.cafeId, order.restaurant?._id, order.cafe?._id]
        .filter(Boolean)
        .some(id => id?.toString() === cafeFilter?.toString());

    return matchesSearch && matchesStatus && matchesCafe;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case "newest": return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest": return new Date(a.createdAt) - new Date(b.createdAt);
      case "total_high": return b.total - a.total;
      case "total_low": return a.total - b.total;
      default: return 0;
    }
  });

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const getTimeAgo = (date) => {
    const diffInMinutes = Math.floor((new Date() - date) / (1000 * 60));
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getOrderStats = () => {
    const totalOrders = orders.length;
    const activeOrders = orders.filter(o => ["Pending", "Preparing"].includes(o.status)).length;
    const completedToday = orders.filter(o =>
      o.status === "Delivered" &&
      new Date(o.createdAt).toDateString() === new Date().toDateString()
    ).length;
    const totalRevenue = orders.filter(o => o.status === "Delivered").reduce((sum, o) => sum + o.total, 0);

    return { totalOrders, activeOrders, completedToday, totalRevenue };
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d0b290] to-[#e5d5bf] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-xl font-medium text-gray-700">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d0b290] to-[#e5d5bf]">
      {/* Logo */}
      <div className="pt-6 pl-6">
        <img
          src="/img/Tastoria.jpg"
          alt="Tastoria Logo"
          className="h-16 w-28 rounded-lg shadow-md object-cover"
        />
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <Typography variant="h2" className="font-bold text-gray-800">
                Order Management
              </Typography>
              <Typography className="text-gray-600 mt-1">
                Track and manage customer orders
              </Typography>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-500 rounded-lg p-4 text-white text-center">
                <Typography variant="h4" className="font-bold">{stats.totalOrders}</Typography>
                <Typography variant="small">Total Orders</Typography>
              </div>
              <div className="bg-orange-500 rounded-lg p-4 text-white text-center">
                <Typography variant="h4" className="font-bold">{stats.activeOrders}</Typography>
                <Typography variant="small">Active</Typography>
              </div>
              <div className="bg-blue-500 rounded-lg p-4 text-white text-center">
                <Typography variant="h4" className="font-bold">{stats.completedToday}</Typography>
                <Typography variant="small">Today</Typography>
              </div>
              <div className="bg-purple-500 rounded-lg p-4 text-white text-center">
                <Typography variant="h4" className="font-bold">₹{stats.totalRevenue}</Typography>
                <Typography variant="small">Revenue</Typography>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Card className="mb-6 shadow-sm border-0">
          <CardBody className="p-6">
            <Typography variant="h6" className="font-semibold text-gray-800 mb-4">
              Filters
            </Typography>

            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  label="Search orders..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                >
                  <Option value="all">All Status</Option>
                  <Option value="Pending">Pending</Option>
                  <Option value="Preparing">Preparing</Option>
                  <Option value="Ready">Ready</Option>
                  <Option value="Delivered">Delivered</Option>
                  <Option value="Cancelled">Cancelled</Option>
                </Select>

                <Select
                  label="Sort by"
                  value={sortBy}
                  onChange={setSortBy}
                >
                  <Option value="newest">Latest First</Option>
                  <Option value="oldest">Oldest First</Option>
                  <Option value="total_high">Highest Value</Option>
                  <Option value="total_low">Lowest Value</Option>
                </Select>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Orders List */}
        {sortedOrders.length === 0 ? (
          <Card className="shadow-sm">
            <CardBody className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <Typography variant="h5" className="font-semibold text-gray-600 mb-2">
                No orders found
              </Typography>
              <Typography className="text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Orders will appear here when customers place them"}
              </Typography>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedOrders.map((order) => (
              <Card key={order._id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardBody className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column */}
                    <div className="flex-1 space-y-4">
                      {/* Order Header */}
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <Typography variant="h6" className="font-semibold">
                              {order.orderNumber}
                            </Typography>
                            <Typography variant="small" className="text-gray-600 flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {getTimeAgo(order.createdAt)}
                            </Typography>
                          </div>
                        </div>
                        <Chip
                          value={order.status}
                          color={getStatusColor(order.status)}
                          className="font-medium"
                        />
                      </div>

                      {/* Customer Info */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <Typography variant="small" className="font-medium text-gray-700 mb-2">
                          Customer Details
                        </Typography>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <Typography variant="small">{order.customerName}</Typography>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <Typography variant="small">{order.phone}</Typography>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <Typography variant="small" className="font-medium text-gray-700 mb-3">
                          Items ({order.items.length})
                        </Typography>
                        <div className="space-y-3 max-h-40 overflow-y-auto">
                          {order.items.map((item) => (
                            <div key={item._id} className="flex items-center bg-white rounded-md shadow p-3">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800">{item.name}</div>
                                <div className="text-xs text-gray-500">Quantity: {item.quantity}</div>
                              </div>
                              <div className="font-bold text-blue-600 text-lg">
                                ₹{item.price * item.quantity}
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>
                     </div>
                      {/* Right Column */}
                      <div className="flex flex-col justify-between items-end gap-4 min-w-[200px]">
                        <div className="text-right">
                          <Typography variant="small" className="text-gray-600">Total Amount</Typography>
                          <Typography variant="h4" className="font-bold text-blue-600">
                            ₹{order.total}
                          </Typography>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                          <Button
                            variant="outlined"
                            size="sm"
                            onClick={() => openOrderModal(order)}
                            className="flex items-center gap-2 justify-center"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>

                          {order.status === "Pending" && (
                            <Button
                              color="orange"
                              size="sm"
                              onClick={() => updateStatus(order._id, "Preparing")}
                            >
                              Start Preparing
                            </Button>
                          )}
                          {order.status === "Preparing" && (
                            <Button
                              color="green"
                              size="sm"
                              onClick={() => updateStatus(order._id, "Ready")}
                            >
                              Mark Ready
                            </Button>
                          )}
                          {order.status === "Ready" && (
                            <Button
                              color="blue"
                              size="sm"
                              onClick={() => updateStatus(order._id, "Delivered")}
                            >
                              Mark Delivered
                            </Button>
                          )}
                          {order.status !== "Cancelled" && order.status !== "Delivered" && (
                            <Button
                              color="red"
                              variant="outlined"
                              size="sm"
                              onClick={() => updateStatus(order._id, "Cancelled")}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Dialog
        open={showOrderModal}
        handler={() => setShowOrderModal(false)}
        size="lg"
        className="bg-white"
      >
        <DialogHeader className="bg-blue-500 text-white rounded-t-lg">
          <div className="flex items-center justify-between w-full">
            <div>
              <Typography variant="h5" className="font-bold">Order Details</Typography>
              <Typography variant="small" className="opacity-90">
                {selectedOrder?.orderNumber}
              </Typography>
            </div>
            <Typography variant="h6" className="font-bold">
              ₹{selectedOrder?.total}
            </Typography>
          </div>
        </DialogHeader>

        <DialogBody className="max-h-[70vh] overflow-y-auto p-6">
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Typography variant="h6" className="font-semibold">Status</Typography>
                <Chip
                  value={selectedOrder.status}
                  color={getStatusColor(selectedOrder.status)}
                  className="font-medium"
                />
              </div>

              {/* Customer Information */}
              <div>
                <Typography variant="h6" className="font-semibold mb-3">Customer Information</Typography>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <Typography variant="small" className="text-gray-600">Name</Typography>
                      <Typography className="font-medium">{selectedOrder.customerName}</Typography>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <Typography variant="small" className="text-gray-600">Phone</Typography>
                      <Typography className="font-medium">{selectedOrder.phone}</Typography>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <Typography variant="small" className="text-gray-600">Address</Typography>
                      <Typography className="font-medium">{selectedOrder.address}</Typography>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <Typography variant="small" className="text-gray-600">Order Time</Typography>
                      <Typography className="font-medium">
                        {selectedOrder.createdAt.toLocaleDateString()} at {selectedOrder.createdAt.toLocaleTimeString()}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <Typography variant="h6" className="font-semibold mb-3">
                  Order Items ({selectedOrder.items.length})
                </Typography>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={item._id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <Typography className="font-medium">{item.name}</Typography>
                          <Typography variant="small" className="text-gray-600">
                            Quantity: {item.quantity} • Unit Price: ₹{item.price}
                          </Typography>
                        </div>
                        <Typography className="font-semibold text-lg">
                          ₹{item.price * item.quantity}
                        </Typography>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <Typography variant="h6" className="font-semibold">Total Amount</Typography>
                    <Typography variant="h5" className="font-bold text-blue-600">
                      ₹{selectedOrder.total}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="bg-gray-50 rounded-b-lg">
          <div className="flex gap-3">
            <Button
              variant="outlined"
              onClick={() => setShowOrderModal(false)}
            >
              Close
            </Button>
            {selectedOrder && selectedOrder.status !== "Delivered" && selectedOrder.status !== "Cancelled" && (
              <Button
                color="blue"
                onClick={() => {
                  const nextStatus = selectedOrder.status === "Pending" ? "Preparing" :
                    selectedOrder.status === "Preparing" ? "Ready" : "Delivered";
                  updateStatus(selectedOrder._id, nextStatus);
                  setShowOrderModal(false);
                }}
              >
                {selectedOrder.status === "Pending" && "Start Preparing"}
                {selectedOrder.status === "Preparing" && "Mark Ready"}
                {selectedOrder.status === "Ready" && "Mark Delivered"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </Dialog>
    </div>
  );
}