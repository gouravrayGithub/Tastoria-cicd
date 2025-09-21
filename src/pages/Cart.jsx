import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();
  const { user: contextUser, isAuthenticated } = useAuth();

  useEffect(() => {
    const initializeCart = async () => {
      if (!isAuthenticated || !contextUser) {
        navigate('/sign-in');
        return;
      }

      const userId = contextUser.uid || contextUser._id || contextUser.email;
      if (!userId) {
        navigate('/sign-in');
        return;
      }

      const savedCart = localStorage.getItem(`cart_${userId}`);
      if (savedCart) setCartItems(JSON.parse(savedCart));

      setIsLoading(false);
    };

    initializeCart();
  }, [isAuthenticated, contextUser, auth, navigate]);

  const addToCart = (newItem) => {
    const userId = contextUser?.uid || contextUser?._id || contextUser?.email;
    if (!userId) {
      toast.error("You must be logged in to add items.");
      return;
    }

    const existingItem = cartItems.find(item => item.id === newItem.id);

    const updatedCart = existingItem
      ? cartItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
            : item
        )
      : [...cartItems, { ...newItem, quantity: newItem.quantity || 1 }];

    setCartItems(updatedCart);
    localStorage.setItem(`cart_${userId}`, JSON.stringify(updatedCart));
    toast.success(`${newItem.name} added to cart`);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    const userId = contextUser?.uid || contextUser?._id || contextUser?.email;
    if (!userId) return;

    const updatedCart = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem(`cart_${userId}`, JSON.stringify(updatedCart));
  };

  const removeItem = (itemId) => {
    const userId = contextUser?.uid || contextUser?._id || contextUser?.email;
    if (!userId) return;

    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem(`cart_${userId}`, JSON.stringify(updatedCart));
  };

  const calculateTotal = () => cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  const placeOrder = async () => {
    if (!isAuthenticated || !contextUser) {
      toast.error("Please sign in to place an order.");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setPlacingOrder(true);

    const ordersByRestaurant = {};
    cartItems.forEach(item => {
      if (!ordersByRestaurant[item.restaurant]) {
        ordersByRestaurant[item.restaurant] = [];
      }
      ordersByRestaurant[item.restaurant].push({ itemId: item.id, quantity: item.quantity });
    });

    for (const [restaurantId, items] of Object.entries(ordersByRestaurant)) {
      const orderData = {
        customerName: contextUser.name || contextUser.displayName || "",
        phone: "", // phone removed
        address: "",
        restaurant: restaurantId,
        items,
        estimatedTime: 0
      };

      try {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders`, orderData);
        toast.success(`Order placed`);
      } catch (err) {
        console.error(`Failed to place order for restaurant ${restaurantId}:`, err.response?.data || err.message);
        toast.error(`Failed to place order for restaurant ${restaurantId}`);
      }
    }

    const userId = contextUser?.uid || contextUser?._id || contextUser?.email;
    setCartItems([]);
    if (userId) localStorage.removeItem(`cart_${userId}`);
    setPlacingOrder(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#d0b290]">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d0b290] pb-16 sm:pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">Your Cart</h1>

        {cartItems.length === 0 ? (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden text-center p-6">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <button
              onClick={() => navigate('/preorder')} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden mb-20">
            <div className="divide-y divide-gray-200">
              {cartItems.map(item => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row gap-4 items-center">
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-gray-500">{item.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 bg-gray-200 rounded">-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 bg-gray-200 rounded">+</button>
                      <span className="ml-auto font-semibold">₹{item.price * item.quantity}</span>
                      <button onClick={() => removeItem(item.id)} className="text-red-500">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-lg font-semibold">Total: ₹{calculateTotal()}</span>
              <button 
                onClick={placeOrder} 
                disabled={placingOrder}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition"
              >
                {placingOrder ? "Placing Order..." : "Proceed to Checkout"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
