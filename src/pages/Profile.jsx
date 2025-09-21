import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Avatar,
  Switch,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Input,
  Select,
  Option,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Spinner,
  IconButton,
  Chip,
} from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  Cog6ToothIcon,
  ShoppingBagIcon,
  CalendarIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL;

export function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phoneNumber: "", photoURL: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: "HOME",
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [error, setError] = useState(null);

  const tabs = [
    { label: "Overview", value: "overview", icon: UserIcon, color: "blue" },
    { label: "Orders", value: "orders", icon: ShoppingBagIcon, color: "green" },
    { label: "Bookings", value: "bookings", icon: CalendarIcon, color: "purple" },
    { label: "Settings", value: "settings", icon: Cog6ToothIcon, color: "gray" },
  ];

  const colorMap = {
    blue: "text-blue-500",
    green: "text-green-500",
    purple: "text-purple-500",
    gray: "text-gray-500",
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      setEditForm({
        name: userData.name || "",
        phoneNumber: userData.phoneNumber || "",
        photoURL: userData.profileImage || "",
      });
    }
  }, [userData]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserData(response.data);
      setOrders(response.data.recentOrders || []);
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.response?.data?.message || err.message || "Failed to fetch profile");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/sign-in", { state: { message: "Session expired. Please sign in again." } });
      }
      toast.error(err.response?.data?.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/sign-in");
    } catch {
      toast.error("Failed to logout");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("name", editForm.name);
      formData.append("phoneNumber", editForm.phoneNumber);
      if (selectedFile) formData.append("photo", selectedFile);

      const response = await axios.put(`${API_URL}/api/auth/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setUserData(response.data.user);
      setUser(response.data.user); // update context user
      setIsEditProfileOpen(false);
      setSelectedFile(null);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setEditForm((prev) => ({ ...prev, photoURL: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleAddAddress = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/api/users/address`, newAddress, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setUserData(response.data.data);
        setIsAddressModalOpen(false);
        setNewAddress({ type: "HOME", street: "", city: "", state: "", zipCode: "" });
        toast.success("Address added successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add address");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${API_URL}/api/users/address/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setUserData(response.data.data);
        toast.success("Address deleted successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete address");
    }
  };
const handleGoogleLogin = async (firebaseUser) => {
  try {
    const { displayName, email, uid } = firebaseUser;
    const res = await axios.post(`${API_URL}/api/auth/google-signin`, {
      name: displayName,
      email,
      firebaseUid: uid,
    });

    localStorage.setItem("token", res.data.token); // ✅ important
    setUser(res.data.user);
    fetchUserData(); // fetch profile now that token exists
  } catch (err) {
    console.error("Google login failed:", err);
    toast.error(err.response?.data?.message || "Login failed");
  }
};




  const handleToggleDarkMode = async (checked) => {
    try {
      setUserData((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, darkMode: checked },
      }));

      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/auth/profile/preferences`,
        { darkMode: checked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update preferences");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
      case "CONFIRMED":
        return "green";
      case "CANCELLED":
      case "REJECTED":
        return "red";
      case "PENDING":
        return "orange";
      case "PROCESSING":
        return "blue";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
      case "CONFIRMED":
        return CheckCircleIcon;
      case "CANCELLED":
      case "REJECTED":
        return XCircleIcon;
      default:
        return ClockIcon;
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Spinner className="h-16 w-16 mb-4" color="blue" />
        <Typography variant="h6" color="blue-gray">
          Loading your profile...
        </Typography>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <Typography variant="h5" color="red" className="mb-2">
              Oops! Something went wrong
            </Typography>
            <Typography color="gray">{error}</Typography>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 shadow-2xl">
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-12">
              <Avatar
                src={userData.profileImage || "/default-avatar.png"}
                alt={userData.name}
                size="xxl"
                className="mx-auto mb-4"
              />
              <div className="text-white flex-1">
                <Typography variant="h4" className="font-bold">
                  {userData.name || "User"}
                </Typography>
                <Typography className="mt-1">{userData.email}</Typography>
                <Typography className="mt-1">{userData.phoneNumber}</Typography>
                <div className="mt-4 flex gap-3 flex-wrap">
                  <Button
                    size="sm"
                    color="white"
                    variant="outlined"
                    className="text-black font-semibold"
                    onClick={() => setIsEditProfileOpen(true)}
                  >
                    Edit Profile
                  </Button>
                  <Button size="sm" color="white" variant="outlined" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabsHeader className="bg-white rounded-xl p-1 shadow-md">
            {tabs.map(({ label, value, icon: Icon, color }) => (
              <Tab key={value} value={value} className="rounded-lg flex items-center gap-2 font-medium">
                <Icon className={`h-5 w-5 ${colorMap[color]}`} />
                {label}
              </Tab>
            ))}
          </TabsHeader>
          <TabsBody>
            {/* Overview */}
            <TabPanel value="overview">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <Card className="p-4 shadow-lg text-center">
                  <CardBody>
                    <Avatar
                      src={userData.profileImage || "/default-avatar.png"}
                      alt={userData.name}
                      size="xxl"
                      className="mx-auto mb-4"
                    />
                    <Typography variant="h5">{userData.name}</Typography>
                    <Typography color="gray">{userData.email}</Typography>
                    <Typography color="gray">{userData.phoneNumber}</Typography>
                  </CardBody>
                </Card>

                {/* Addresses */}
                <Card className="p-4 shadow-lg">
                  <CardBody>
                    <div className="flex justify-between items-center mb-2">
                      <Typography variant="h6">Addresses</Typography>
                      <IconButton
                        variant="text"
                        color="blue"
                        size="sm"
                        onClick={() => setIsAddressModalOpen(true)}
                      >
                        <PlusIcon className="h-5 w-5" />
                      </IconButton>
                    </div>
                    {userData.addresses?.length ? (
                      <ul className="space-y-2">
                        {userData.addresses.map((addr) => (
                          <li key={addr._id} className="flex justify-between items-center border p-2 rounded-lg">
                            <div>
                              <Typography className="font-semibold">{addr.type}</Typography>
                              <Typography color="gray" className="text-sm">
                                {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}
                              </Typography>
                            </div>
                            <IconButton
                              variant="text"
                              color="red"
                              size="sm"
                              onClick={() => handleDeleteAddress(addr._id)}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </IconButton>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Typography color="gray" className="text-sm">
                        No addresses added yet.
                      </Typography>
                    )}
                  </CardBody>
                </Card>
              </div>
            </TabPanel>

            {/* Orders */}
            <TabPanel value="orders">
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {orders.length ? (
                  orders.map((order) => (
                    <Card key={order._id} className="p-4 shadow-lg">
                      <CardBody>
                        <div className="flex justify-between items-start">
                          <div>
                            <Typography variant="h6">Order #{order._id.slice(-6)}</Typography>
                            <Typography color="gray" className="text-sm">
                              {new Date(order.createdAt).toLocaleString()}
                            </Typography>
                          </div>
                          <Chip
                            value={order.status}
                            color={getStatusColor(order.status)}
                            icon={getStatusIcon(order.status)}
                          />
                        </div>
                        <Typography className="mt-2 font-bold">₹{order.totalAmount}</Typography>
                        <Button
                          size="sm"
                          variant="outlined"
                          className="mt-2"
                          onClick={() => navigate(`/orders/${order._id}`)}
                        >
                          View Details
                        </Button>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <Typography color="gray">No orders found.</Typography>
                )}
              </div>
            </TabPanel>

            {/* Bookings */}
            <TabPanel value="bookings">
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookings.length ? (
                  bookings.map((booking) => (
                    <Card key={booking._id} className="p-4 shadow-lg">
                      <CardBody>
                        <div className="flex justify-between items-start">
                          <div>
                            <Typography variant="h6">{booking.title || "Booking"}</Typography>
                            <Typography color="gray" className="text-sm">
                              {new Date(booking.date).toLocaleString()}
                            </Typography>
                          </div>
                          <Chip
                            value={booking.status}
                            color={getStatusColor(booking.status)}
                            icon={getStatusIcon(booking.status)}
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outlined"
                          className="mt-2"
                          onClick={() => navigate(`/bookings/${booking._id}`)}
                        >
                          View Details
                        </Button>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <Typography color="gray">No bookings found.</Typography>
                )}
              </div>
            </TabPanel>

            {/* Settings */}
            <TabPanel value="settings">
              <div className="mt-6 max-w-md space-y-6">
                <div className="flex items-center justify-between">
                  <Typography>Dark Mode</Typography>
                  <Switch
                    checked={userData.preferences?.darkMode || false}
                    onChange={(e) => handleToggleDarkMode(e.target.checked)}
                  />
                </div>
              </div>
            </TabPanel>
          </TabsBody>
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} handler={() => setIsEditProfileOpen(!isEditProfileOpen)}>
        <DialogHeader>Edit Profile</DialogHeader>
        <DialogBody divider>
          <div className="flex flex-col gap-4">
            <Input
              label="Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={editForm.phoneNumber}
              onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
            />
            <div>
              <label className="block mb-1 font-medium">Profile Picture</label>
              <input type="file" accept="image/*" onChange={handleFileSelect} />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setIsEditProfileOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateProfile}>Save</Button>
        </DialogFooter>
      </Dialog>

      {/* Add Address Dialog */}
      <Dialog open={isAddressModalOpen} handler={() => setIsAddressModalOpen(!isAddressModalOpen)}>
        <DialogHeader>Add Address</DialogHeader>
        <DialogBody divider>
          <div className="flex flex-col gap-4">
            <Select
              label="Type"
              value={newAddress.type}
              onChange={(value) => setNewAddress((prev) => ({ ...prev, type: value }))}
            >
              <Option value="HOME">Home</Option>
              <Option value="WORK">Work</Option>
              <Option value="OTHER">Other</Option>
            </Select>
            <Input
              label="Street"
              value={newAddress.street}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, street: e.target.value }))}
            />
            <Input
              label="City"
              value={newAddress.city}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
            />
            <Input
              label="State"
              value={newAddress.state}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, state: e.target.value }))}
            />
            <Input
              label="Zip Code"
              value={newAddress.zipCode}
              onChange={(e) => setNewAddress((prev) => ({ ...prev, zipCode: e.target.value }))}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setIsAddressModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddAddress}>Add</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

export default Profile;
