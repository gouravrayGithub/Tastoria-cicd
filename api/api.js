import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for now
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health Check Route
app.get("/api/health", (req, res) => {
  console.log("Health check endpoint called");
  res.status(200).json({ status: "healthy" });
});

// Chat Route
app.post("/api/chat", (req, res) => {
  try {
    console.log("Chat endpoint called with body:", req.body);
    const userMessage = req.body.message || "";
    if (!userMessage.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }
    console.log(`Received message: ${userMessage}`);
    
    const response = getBotResponse(userMessage.toLowerCase());
    console.log(`Sending response: ${JSON.stringify(response)}`);
    
    res.json(response);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Sorry, there was an error processing your request." });
  }
});

// User Registration Route
app.post("/api/users/register", (req, res) => {
  try {
    console.log("Register endpoint called with body:", req.body);
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: "Please provide username, email and password" 
      });
    }

    // Here you would typically:
    // 1. Hash the password
    // 2. Check if user already exists
    // 3. Save to database
    // For now, we'll just send a success response
    
    res.status(201).json({ 
      message: "User registered successfully",
      user: {
        username,
        email
      }
    });

  } catch (error) {
    console.error(`Registration error: ${error.message}`);
    res.status(500).json({ 
      message: "Error registering user",
      error: error.message 
    });
  }
});

// Function to handle bot responses
function getBotResponse(message) {
  message = message.toLowerCase().replace(/[-_]/g, " "); // Normalize input

  if (message.includes("slot")) {
    return {
      message: "I'll take you to the slot booking page right away!",
      action: "navigate",
      cafeId: "ttmm-slot"
    };
  }

  if (message.includes("hangout") || message.includes("hagout")) {
    return {
      message: "I'll show you Hangout Cafe's menu!",
      action: "navigate",
      cafeId: "hangout-cafe"
    };
  }

  if (message.includes("cafe house") || message.includes("cafehouse")) {
    return {
      message: "Let me show you Cafe House's menu!",
      action: "navigate",
      cafeId: "cafe-house"
    };
  }

  if (message.includes("ttmm")) {
    return {
      message: "I'll take you to TTMM's menu right away!",
      action: "navigate",
      cafeId: "ttmm"
    };
  }

  if (message.includes("ttmm-slot")) {
    return {
      message: "I'll take you to TTMM's slot booking page right away!",
      action: "navigate",
      cafeId: "ttmm-slot"
    };
  }

  if (message.includes("golden bakery")) {
    return {
      message: "Let me show you Golden Bakery's menu!",
      action: "navigate",
      cafeId: "golden-bakery"
    };
  }

  if (message.includes("menu")) {
    return {
      message: "I can help you with our cafe menus. We have Hangout Cafe, TTMM, and Cafe House. Which one would you like to know about?"
    };
  }

  if (["book", "reservation", "table"].some(word => message.includes(word))) {
    return {
      message: "I can help you book a table. Which cafe would you like to make a reservation at?"
    };
  }

  if (message.includes("location")) {
    return {
      message: "All our cafes are located in Parbhani. Would you like specific directions to any of them?"
    };
  }

  return {
    message: "I can help you with menu information, reservations, and locations for our cafes. What would you like to know?"
  };
}

// Mock data for restaurants and menus
const restaurants = [
  {
    _id: 'hangout-cafe',
    name: 'Hangout Cafe',
    cuisine: 'Multi-cuisine',
    priceRange: '₹200-500',
    deliveryTime: '20-30 mins',
    rating: 4.5,
    reviews: 120,
    description: 'A cozy cafe offering delicious food and great ambiance',
    images: ['/img/Hangout.jpg']
  },
  {
    _id: 'cafe-house',
    name: 'Cafe House',
    cuisine: 'Continental',
    priceRange: '₹150-400',
    deliveryTime: '15-25 mins',
    rating: 4.3,
    reviews: 95,
    description: 'Fresh continental dishes with a modern twist',
    images: ['/img/cafeHouse.jpg']
  },
  {
    _id: 'ttmm',
    name: 'TTMM',
    cuisine: 'Indian',
    priceRange: '₹100-300',
    deliveryTime: '10-20 mins',
    rating: 4.7,
    reviews: 150,
    description: 'Authentic Indian flavors with traditional recipes',
    images: ['/img/ttmm.jpg']
  },
  {
    _id: 'golden-bakery',
    name: 'Golden Bakery',
    cuisine: 'Bakery',
    priceRange: '₹50-200',
    deliveryTime: '5-15 mins',
    rating: 4.4,
    reviews: 80,
    description: 'Fresh baked goods and sweet treats',
    images: ['/img/golden.jpg']
  }
];

// In-memory storage for menu items (in production, use a database)
let menuItems = {};

// Initialize with some sample menu items
menuItems['hangout-cafe'] = [
  {
    _id: '1',
    name: 'Margherita Pizza',
    price: 299,
    description: 'Classic tomato and mozzarella pizza',
    detailedDescription: 'Fresh tomato sauce, mozzarella cheese, and basil on a thin crust',
    category: 'Main Course',
    image: '/img/pizza.jpg',
    ingredients: ['Tomato sauce', 'Mozzarella', 'Basil', 'Dough'],
    allergens: ['Gluten', 'Dairy'],
    isVegetarian: true,
    preparationTime: '15-20 mins',
    rating: 4.5,
    spicyLevel: 'Mild',
    servingSize: '1 pizza',
    isAvailable: true,
    restaurant: 'hangout-cafe'
  },
  {
    _id: '2',
    name: 'Cappuccino',
    price: 89,
    description: 'Rich and creamy coffee',
    detailedDescription: 'Espresso with steamed milk and foam',
    category: 'Beverages',
    image: '/img/Cappuccino.jpg',
    ingredients: ['Espresso', 'Milk', 'Foam'],
    allergens: ['Dairy'],
    isVegetarian: true,
    preparationTime: '5-10 mins',
    rating: 4.3,
    spicyLevel: 'None',
    servingSize: '1 cup',
    isAvailable: true,
    restaurant: 'hangout-cafe'
  }
];

// Restaurants API
app.get("/api/restaurants", (req, res) => {
  try {
    console.log("Restaurants endpoint called");
    res.json({
      success: true,
      restaurants: restaurants
    });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching restaurants" 
    });
  }
});

// Menu API - Get menu for a specific restaurant
app.get("/api/menu/:restaurantId", (req, res) => {
  try {
    const { restaurantId } = req.params;
    console.log(`Menu endpoint called for restaurant: ${restaurantId}`);
    
    const menu = menuItems[restaurantId] || [];
    res.json({
      success: true,
      menu: menu
    });
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching menu" 
    });
  }
});

// Menu API - Add new menu item
app.post("/api/menu/:restaurantId", (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuItem = req.body;
    
    console.log(`Adding menu item for restaurant: ${restaurantId}`, menuItem);
    
    // Generate a unique ID
    const newId = Date.now().toString();
    const newMenuItem = {
      ...menuItem,
      _id: newId,
      restaurant: restaurantId
    };
    
    // Initialize menu array if it doesn't exist
    if (!menuItems[restaurantId]) {
      menuItems[restaurantId] = [];
    }
    
    // Add the new item
    menuItems[restaurantId].push(newMenuItem);
    
    res.status(201).json({
      success: true,
      message: "Menu item added successfully",
      item: newMenuItem
    });
  } catch (error) {
    console.error("Error adding menu item:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error adding menu item" 
    });
  }
});

// Menu API - Update menu item
app.put("/api/menu/:restaurantId/:itemId", (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    const updatedItem = req.body;
    
    console.log(`Updating menu item ${itemId} for restaurant: ${restaurantId}`, updatedItem);
    
    if (!menuItems[restaurantId]) {
      return res.status(404).json({ 
        success: false, 
        message: "Restaurant not found" 
      });
    }
    
    const itemIndex = menuItems[restaurantId].findIndex(item => item._id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Menu item not found" 
      });
    }
    
    // Update the item
    menuItems[restaurantId][itemIndex] = {
      ...menuItems[restaurantId][itemIndex],
      ...updatedItem,
      _id: itemId,
      restaurant: restaurantId
    };
    
    res.json({
      success: true,
      message: "Menu item updated successfully",
      item: menuItems[restaurantId][itemIndex]
    });
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating menu item" 
    });
  }
});

// Menu API - Delete menu item
app.delete("/api/menu/:restaurantId/:itemId", (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    
    console.log(`Deleting menu item ${itemId} for restaurant: ${restaurantId}`);
    
    if (!menuItems[restaurantId]) {
      return res.status(404).json({ 
        success: false, 
        message: "Restaurant not found" 
      });
    }
    
    const itemIndex = menuItems[restaurantId].findIndex(item => item._id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Menu item not found" 
      });
    }
    
    // Remove the item
    menuItems[restaurantId].splice(itemIndex, 1);
    
    res.json({
      success: true,
      message: "Menu item deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting menu item" 
    });
  }
});

// Restaurant API - Add new restaurant
app.post("/api/restaurants", (req, res) => {
  try {
    const restaurant = req.body;
    
    console.log("Adding new restaurant:", restaurant);
    
    // Generate a unique ID
    const newId = restaurant.name.toLowerCase().replace(/\s+/g, '-');
    const newRestaurant = {
      ...restaurant,
      _id: newId
    };
    
    // Add the new restaurant
    restaurants.push(newRestaurant);
    
    res.status(201).json({
      success: true,
      message: "Restaurant added successfully",
      restaurant: newRestaurant
    });
  } catch (error) {
    console.error("Error adding restaurant:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error adding restaurant" 
    });
  }
});

// Restaurant API - Update restaurant
app.put("/api/restaurants/:restaurantId", (req, res) => {
  try {
    const { restaurantId } = req.params;
    const updatedRestaurant = req.body;
    
    console.log(`Updating restaurant ${restaurantId}:`, updatedRestaurant);
    
    const restaurantIndex = restaurants.findIndex(r => r._id === restaurantId);
    if (restaurantIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Restaurant not found" 
      });
    }
    
    // Update the restaurant
    restaurants[restaurantIndex] = {
      ...restaurants[restaurantIndex],
      ...updatedRestaurant,
      _id: restaurantId
    };
    
    res.json({
      success: true,
      message: "Restaurant updated successfully",
      restaurant: restaurants[restaurantIndex]
    });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error updating restaurant" 
    });
  }
});

// Restaurant API - Delete restaurant
app.delete("/api/restaurants/:restaurantId", (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    console.log(`Deleting restaurant ${restaurantId}`);
    
    const restaurantIndex = restaurants.findIndex(r => r._id === restaurantId);
    if (restaurantIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "Restaurant not found" 
      });
    }
    
    // Remove the restaurant
    restaurants.splice(restaurantIndex, 1);
    
    // Also remove associated menu items
    delete menuItems[restaurantId];
    
    res.json({
      success: true,
      message: "Restaurant deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting restaurant:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting restaurant" 
    });
  }
});

// Image upload endpoint for restaurants
app.post("/api/restaurants/upload-image", upload.single('file'), (req, res) => {
  try {
    console.log("Restaurant image upload endpoint called");
    
    // Check if there's a file in the request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const file = req.file;
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `restaurant_${timestamp}_${randomString}.${fileExtension}`;
    
    // In a real application, you would save the file to a proper storage location
    // For now, we'll simulate saving and return a mock URL
    const imageUrl = `/uploads/restaurants/${fileName}`;
    
    console.log(`Image uploaded: ${fileName}, Size: ${file.size} bytes, Type: ${file.mimetype}`);
    
    res.json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
      fileName: fileName,
      fileSize: file.size,
      originalName: file.originalname
    });
    
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error uploading image" 
    });
  }
});

// Legacy menu image upload endpoint (for backward compatibility)
app.post("/api/menu/upload-image", upload.single('file'), (req, res) => {
  try {
    console.log("Menu image upload endpoint called");
    
    // Check if there's a file in the request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const file = req.file;
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `menu_${timestamp}_${randomString}.${fileExtension}`;
    
    // In a real application, you would save the file to a proper storage location
    // For now, we'll simulate saving and return a mock URL
    const imageUrl = `/uploads/menu/${fileName}`;
    
    console.log(`Menu image uploaded: ${fileName}, Size: ${file.size} bytes, Type: ${file.mimetype}`);
    
    res.json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
      fileName: fileName,
      fileSize: file.size,
      originalName: file.originalname
    });
    
  } catch (error) {
    console.error("Error uploading menu image:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error uploading image" 
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
