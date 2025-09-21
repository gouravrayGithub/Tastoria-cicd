import { useEffect, useState } from 'react';
import { Typography, Button, Card, CardBody, CardHeader } from "@material-tailwind/react";
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  UserGroupIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/solid";
import { toast } from 'react-hot-toast';

export function AdminPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    totalRevenue: 0,
    menuItems: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    dailyOrders: 0
  });
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trendingItems, setTrendingItems] = useState([]);
  const [salesData, setSalesData] = useState([]);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || !userData.isAdmin) {
      navigate('/admin-login');
      return;
    }
    setUser(userData);

  }, [navigate]);

  const addMenuItem = async (menuData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(menuData)
      });

      if (!response.ok) {
        throw new Error('Failed to add menu item');
      }

      const newItem = await response.json();
      setMenuItems(prev => [...prev, newItem]);
      toast.success('Menu item added successfully');
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast.error('Failed to add menu item');
    }
  };

  const fetchTrendingItems = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/menu/trending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log("Trending items API response:", data);

      let items = [];
      if (Array.isArray(data.menu)) {
        items = data.menu;
      } else {
        console.error("Trending items response format is invalid:", data);
        toast.error("Unexpected trending items format from API");
      }

      setTrendingItems(items);
    } catch (error) {
      console.error("Error fetching trending items:", error);
      toast.error("Failed to load trending items");
      setTrendingItems([]);
    } finally {
      setIsLoading(false);
    }
  };
const fetchSalesData = async () => {
  try {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/api/menu/sales`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch sales data");

    const data = await response.json();

    // Fix: make sure it's always an array
    if (Array.isArray(data)) {
      setSalesData(data);
    } else if (Array.isArray(data.sales)) {
      setSalesData(data.sales);
    } else {
      console.error("Unexpected sales data format:", data);
      setSalesData([]);
    }
  } catch (error) {
    console.error("Error fetching sales data:", error);
    toast.error("Failed to load sales data");
    setSalesData([]);
  } finally {
    setIsLoading(false);
  }
};

 useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, []);


  useEffect(() => {
    fetchSalesData();

  }, []);


  useEffect(() => {
    fetchTrendingItems();
  }, []);

  // Mobile StatCard (same as original)
 const MobileStatCard= ({ title, value, icon: Icon, color }) => (
    <Card className="bg-white shadow-md border-0">
      <CardBody className="p-4 flex items-center justify-between">
        <div>
          <Typography className="text-gray-600 text-sm">{title}</Typography>
          <Typography className="text-gray-900 text-xl font-bold">
            {title === "Revenue" ? `₹${value.toLocaleString()}` : value}
          </Typography>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </CardBody>
    </Card>
  );

  // Enhanced Desktop StatCard
  const DesktopStatCard = ({ title, value, icon: Icon, color, percentage }) => (
    <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0">
      <CardBody className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className={`p-4 rounded-2xl bg-gradient-to-br from-${color}-500 to-${color}-600 shadow-lg`}>
            <Icon className="h-10 w-10 text-white" />
          </div>
          {percentage && (
            <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
              <Typography className="text-green-600 text-xs font-semibold">
                +{percentage}%
              </Typography>
            </div>
          )}
        </div>
        <div>
          <Typography className="text-gray-600 text-sm font-medium mb-2">
            {title}
          </Typography>
          <Typography className="text-gray-900 text-3xl font-bold">
            {typeof value === 'number' && title.includes('Revenue') ? `₹${value.toLocaleString()}` : value}
          </Typography>
        </div>
      </CardBody>
    </Card>
  );

  // Mobile ActionCard (same as original)
  const MobileActionCard = ({ title, description, icon: Icon, color, onClick }) => (
    <Card
      className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200 border-0 cursor-pointer"
      onClick={onClick}
    >
      <CardBody className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-${color}-100 flex-shrink-0`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
          <div className="flex-1 min-w-0">
            <Typography className="text-gray-900 font-semibold text-sm mb-1">
              {title}
            </Typography>
            <Typography className="text-gray-600 text-xs leading-relaxed">
              {description}
            </Typography>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  // Enhanced Desktop ActionCard
  const DesktopActionCard = ({ title, description, icon: Icon, color, onClick, buttonText = "Manage" }) => (
    <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 group overflow-hidden">
      <div className={`h-2 bg-gradient-to-r from-${color}-500 to-${color}-600`}></div>
      <CardBody className="p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-4 rounded-xl bg-gradient-to-br from-${color}-100 to-${color}-200 group-hover:from-${color}-500 group-hover:to-${color}-600 transition-all duration-300`}>
            <Icon className={`h-8 w-8 text-${color}-600 group-hover:text-white transition-colors duration-300`} />
          </div>
          <div className="flex-1">
            <Typography className="text-gray-900 font-bold text-xl mb-3">
              {title}
            </Typography>
            <Typography className="text-gray-600 leading-relaxed">
              {description}
            </Typography>
          </div>
        </div>
        <Button
          className={`w-full bg-gradient-to-r from-${color}-500 to-${color}-600 hover:from-${color}-600 hover:to-${color}-700 shadow-lg hover:shadow-xl transition-all duration-300`}
          onClick={onClick}
        >
          {buttonText}
        </Button>
      </CardBody>
    </Card>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#d0b290] to-[#e5d5bf]">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d0b290] to-[#e5d5bf]">
      {/* Header - Enhanced for desktop, same for mobile */}
      <div className="bg-white shadow-sm lg:shadow-xl lg:backdrop-blur-md lg:bg-opacity-95">
        <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 lg:gap-6">
              <img
                src="/img/Tastoria.jpg"
                alt="Tastoria Logo"
                className="h-10 w-16 lg:h-16 lg:w-28 rounded-md lg:rounded-2xl shadow-sm lg:shadow-lg object-cover"
              />
              <div>
                <Typography className="font-semibold lg:font-bold text-gray-900 text-lg lg:text-3xl">
                  Admin Dashboard
                </Typography>
                <Typography className="text-gray-600 text-sm lg:text-lg lg:mt-1">
                  Welcome{window.innerWidth >= 1024 ? ' back' : ''}, {user?.displayName || 'Admin'}
                </Typography>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-600 transition-colors lg:bg-gradient-to-r lg:from-red-500 lg:to-red-600 lg:hover:from-red-600 lg:hover:to-red-700 lg:shadow-lg lg:hover:shadow-xl lg:px-8"
              onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                navigate('/admin-login');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-10 space-y-6 lg:space-y-10">
        {/* Desktop Overview Section */}
        <div className="hidden lg:block text-center mb-10">
          <Typography className="font-bold text-gray-900 text-4xl mb-4">
            Dashboard Overview
          </Typography>
          <Typography className="text-gray-600 text-lg">
            Monitor your restaurant's performance and manage operations
          </Typography>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Mobile Stats */}
          <div className="lg:hidden contents">
            <MobileStatCard
              title="Revenue"
              value={stats.totalRevenue}
              icon={CurrencyDollarIcon}
              color="green"
            />
            <MobileStatCard
              title="Orders"
              value={stats.totalOrders}
              icon={ShoppingCartIcon}
              color="blue"
            />
            <MobileStatCard
              title="Active"
              value={stats.activeOrders}
              icon={ClipboardDocumentListIcon}
              color="orange"
            />
            <MobileStatCard
              title="Today"
              value={stats.dailyOrders}
              icon={CalendarDaysIcon}
              color="purple"
            />
          </div>

          {/* Desktop Stats */}
          <div className="hidden lg:contents">
            <DesktopStatCard
              title="Total Revenue"
              value={stats.totalRevenue}
              icon={CurrencyDollarIcon}
              color="green"
              percentage="12"
            />
            <DesktopStatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingCartIcon}
              color="blue"
              percentage="8"
            />
            <DesktopStatCard
              title="Active Orders"
              value={stats.activeOrders}
              icon={ClipboardDocumentListIcon}
              color="orange"
            />
            <DesktopStatCard
              title="Daily Orders"
              value={stats.dailyOrders}
              icon={CalendarDaysIcon}
              color="purple"
              percentage="5"
            />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-10">
          {/* Actions */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-8">
            <Typography className="font-semibold lg:font-bold text-gray-900 text-lg lg:text-3xl mb-4">
              Quick Actions
            </Typography>

            <div className="grid sm:grid-cols-2 gap-4 lg:gap-8">
              {/* Mobile Actions */}
              <div className="lg:hidden contents">
                <MobileActionCard
                  title="Orders"
                  description="Manage incoming orders"
                  icon={ShoppingCartIcon}
                  color="blue"
                  onClick={() => navigate('/admin/orders')}
                />
                <MobileActionCard
                  title="Menu"
                  description="Update menu items"
                  icon={Cog6ToothIcon}
                  color="purple"
                  onClick={() => navigate('/admin/menu')}
                />
                <MobileActionCard
                  title="Cafes"
                  description="Manage locations"
                  icon={UserGroupIcon}
                  color="indigo"
                  onClick={() => navigate('/admin/cafes')}
                />
                <MobileActionCard
                  title="Reservations"
                  description="Table bookings"
                  icon={ClockIcon}
                  color="green"
                  onClick={() => navigate('/admin/reservations')}
                />
              </div>

              {/* Desktop Actions */}
              <div className="hidden lg:contents">
                <DesktopActionCard
                  title="Order Management"
                  description="Track and manage all incoming orders in real-time with advanced filtering and status updates"
                  icon={ShoppingCartIcon}
                  color="blue"
                  onClick={() => navigate('/admin/orders')}
                  buttonText="Manage Orders"
                />
                <DesktopActionCard
                  title="Menu Management"
                  description="Update menu items, categories, pricing and availability across all locations"
                  icon={Cog6ToothIcon}
                  color="purple"
                  onClick={() => navigate('/admin/menu')}
                  buttonText="Manage Menu"
                />
                <DesktopActionCard
                  title="Cafe Management"
                  description="Manage restaurant locations, staff assignments and operational settings"
                  icon={UserGroupIcon}
                  color="indigo"
                  onClick={() => navigate('/admin/cafes')}
                  buttonText="Manage Cafes"
                />
                <DesktopActionCard
                  title="Reservations"
                  description="Handle table bookings, availability scheduling and customer reservations"
                  icon={ClockIcon}
                  color="green"
                  onClick={() => navigate('/admin/reservations')}
                  buttonText="View Reservations"
                />
              </div>
            </div>
          </div>

          {/* Trending Items - Enhanced for desktop */}
          <div>
            <Card className="bg-white shadow-sm lg:shadow-xl border-0 overflow-hidden">
              <CardHeader className="bg-yellow-500 lg:bg-gradient-to-r lg:from-yellow-500 lg:to-yellow-600 text-white p-4 lg:p-8 m-0 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <Typography className="font-semibold lg:font-bold lg:text-xl">
                    Trending Items
                  </Typography>
                  <Button
                    variant="text"
                    size="sm"
                    className="text-white hover:bg-white hover:bg-opacity-20 p-1 lg:px-4 lg:transition-all lg:duration-300"
                    onClick={() => navigate('/admin/menu')}
                  >
                    View All {window.innerWidth >= 1024 ? '→' : ''}
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="p-4 lg:p-8">
                {isLoading ? (
                  <div className="flex justify-center py-8 lg:py-12">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 border-2 lg:border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {trendingItems.map((item, index) => (
                      <div
                        key={item._id || item.id}
                        className="flex items-center gap-3 lg:gap-4 p-2 lg:p-4 hover:bg-gray-50 rounded lg:rounded-xl transition-colors lg:transition-all lg:duration-200"
                      >
                        <img
                          src={item.image || '/placeholder.png'}
                          alt={item.name}
                          className="h-12 w-12 lg:h-16 lg:w-16 rounded-full object-cover lg:shadow-md"
                        />
                        <div className="flex-1 min-w-0">
                          <Typography className="text-sm lg:font-semibold font-medium text-gray-900 truncate lg:mb-1">
                            {item.name}
                          </Typography>
                          <Typography className="text-xs lg:text-sm text-gray-500">
                            {item.category}
                          </Typography>
                        </div>
                        <Typography className="text-sm lg:text-lg font-semibold lg:font-bold text-blue-600">
                          ₹{item.price}
                        </Typography>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>


            </Card>
          </div>
        </div>

        {/* Analytics - Enhanced for desktop */}
        <Card className="bg-white shadow-sm lg:shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-blue-500 lg:bg-gradient-to-r lg:from-blue-500 lg:to-blue-600 text-white p-4 lg:p-8 m-0 rounded-t-lg">
            <Typography className="font-semibold lg:font-bold lg:text-xl">
              Sales {window.innerWidth >= 1024 ? 'Analytics' : 'Overview'}
            </Typography>
          </CardHeader>
          <CardBody className="p-6 lg:p-12">
            {salesData.length === 0 ? (
              <div className="h-48 lg:h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <Typography className="text-gray-500">No sales data available</Typography>
              </div>
            ) : (
              <div className="h-48 lg:h-64">
<ResponsiveContainer width="100%" height="100%">
  <LineChart data={salesData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip formatter={(value, name) =>
      name === "revenue" ? `₹${value.toLocaleString()}` : value
    } />
    {/* Revenue line */}
    <Line
      type="monotone"
      dataKey="revenue"
      stroke="#3b82f6"
      strokeWidth={3}
      dot={{ r: 4 }}
      name="Revenue"
    />
    {/* Orders line */}
    <Line
      type="monotone"
      dataKey="orders"
      stroke="#10b981"
      strokeWidth={3}
      dot={{ r: 4 }}
      name="Orders"
    />
  </LineChart>
</ResponsiveContainer>

              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default AdminPortal;