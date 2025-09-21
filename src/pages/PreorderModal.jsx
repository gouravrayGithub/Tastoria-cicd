import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Typography } from '@material-tailwind/react';

function PreorderModal() {
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [errorLoadingRestaurants, setErrorLoadingRestaurants] = useState(false);


  const navigate = useNavigate();
  const auth = getAuth();
  const { user: mongoUser, isAuthenticated: isMongoAuthenticated, logout } = useAuth();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const isLoggedIn = isMongoAuthenticated || !!firebaseUser;
const currentUser = firebaseUser || mongoUser;


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.6, 
        staggerChildren: 0.1
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/restaurants`);
        const data = await res.json();
        if (data.success) setRestaurants(data.restaurants);
        else setErrorLoadingRestaurants(true);
      } catch (error) {
        console.error(error);
        setErrorLoadingRestaurants(true);
      } finally {
        setLoadingRestaurants(false);
      }
    };
    fetchRestaurants();
  }, []);

  const navigateWithTransition = useCallback((to) => {
    if (typeof window.requestIdleCallback === 'function') {
      requestIdleCallback(() => navigate(to, { replace: true }));
    } else {
      setTimeout(() => navigate(to, { replace: true }), 0);
    }
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setFirebaseUser(user);
      } else {
        setFirebaseUser(null);
      }
    });
    return () => unsubscribe();
  }, [auth]);
  

  useEffect(() => {
    if (currentUser) {
      const cartKey = `cart_${currentUser.id || currentUser._id}`;
      // ...rest of cart logic...
    }
  }, [currentUser]);

  const handleRestaurantClick = (restaurant) => {
    if (isLoggedIn) 
      {
      navigate('/preorderpage', { 
        state: { 
          restaurantName: restaurant.name,
          restaurantId: restaurant._id 
        } 
      });
    } else {
      localStorage.setItem('redirectAfterLogin', '/preorderpage');
      navigate('/sign-in');
    }
  };

  if (loadingRestaurants) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#d0b290] to-[#e5d5bf]">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-xl font-medium text-gray-700">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return null;


  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#d0b290] to-[#e5d5bf] ${isModalOpen ? '' : 'hidden'}`}>
      {/* Success Login Popup */}
      {showLoginPopup && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 right-6 z-30"
        >
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
            <span className="text-lg mr-2">✓</span>
            <span className="font-medium">Successfully logged in!</span>
          </div>
        </motion.div>
      )}

      {/* Logo */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-6 left-6 z-20"
      >
        <img 
          src="/img/Tastoria.jpg" 
          alt="Tastoria Logo" 
          className="h-16 w-28 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200" 
        />
      </motion.div>

      <div className="px-6 pt-28 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 max-w-2xl mx-auto"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4">
            Choose Your Restaurant
          </h1>
          <p className="text-lg text-gray-600">
            Discover delicious meals from our partner restaurants
          </p>
        </motion.div>

        {/* Restaurants */}
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          className="max-w-4xl mx-auto space-y-6"
        >
          {restaurants.map((restaurant) => (
            <motion.div
              key={restaurant._id}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 ${selectedRestaurant === restaurant._id ? 'border-blue-400' : 'border-transparent hover:border-blue-200'}`}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="sm:w-80 h-48 sm:h-64 flex-shrink-0 overflow-hidden">
                  <img
                    src={restaurant.images?.[0] || "/img/placeholder.jpg"}
                    alt={restaurant.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-2xl font-bold text-gray-800">{restaurant.name}</h3>
                      <div className="flex items-center bg-yellow-100 px-3 py-1 rounded-full">
                        <span className="text-yellow-600 font-semibold">{restaurant.rating}</span>
                        <span className="ml-1 text-yellow-500">★</span>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {restaurant.cuisine}
                      </span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        {restaurant.priceRange}
                      </span>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                        {restaurant.deliveryTime}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {restaurant.description}
                    </p>
                    
                    <p className="text-sm text-gray-500 mb-6">
                      {restaurant.reviews} reviews
                    </p>
                  </div>

                  <button
                    onClick={() => handleRestaurantClick(restaurant)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 group"
                  >
                    <span>Browse Menu</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default PreorderModal;