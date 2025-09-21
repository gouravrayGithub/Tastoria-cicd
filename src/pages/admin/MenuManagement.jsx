import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Camera } from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from 'react-hot-toast';
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export default function MenuManagement() {
    const [menu, setMenu] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const { restaurantId } = useParams();
    const [newItem, setNewItem] = useState({
        name: "",
        price: "",
        description: "",
        detailedDescription: "",
        category: "",
        image: "",
        ingredients: [],
        nutritionalInfo: {
            calories: "",
            protein: "",
            carbs: "",
            fat: "",
        },
    });

    const [currentIngredient, setCurrentIngredient] = useState("");

    const categories = ["Starters", "Main Course", "Desserts", "Beverages", "Snacks"];

    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(restaurantId || "");

    // Load menu from state (simulating localStorage)
    useEffect(() => {
        if (!selectedRestaurant) return;
        const fetchMenu = async () => {
            try {
                const res = await fetch(`${API_URL}/api/menu/${selectedRestaurant}`);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                setMenu(data.menu || []);
            } catch (err) {
                console.error("Error fetching menu:", err);
                setMenu([]); // Set empty array on error
            }
        };
        fetchMenu();
    }, [selectedRestaurant]); // <-- important: run every time restaurant changes


    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const res = await fetch(`${API_URL}/api/restaurants`);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                const data = await res.json();
                setRestaurants(data.restaurants || []);
                if (!selectedRestaurant && data.restaurants.length > 0) {
                    setSelectedRestaurant(data.restaurants[0]._id);
                }
            } catch (err) {
                console.error("Failed to load restaurants:", err);
                setRestaurants([]);
            }
        };
        fetchRestaurants();
    }, []);

    const resetForm = () => {
        setNewItem({
            name: "",
            price: "",
            description: "",
            detailedDescription: "",
            category: "Starters",
            image: "",
            ingredients: [],
            isVegetarian: true,
            preparationTime: "15-20 mins",
            spicyLevel: "Mild",
            servingSize: "1 serving",
            nutritionalInfo: {
                calories: "",
                protein: "",
                carbs: "",
                fat: "",
            },
        });
        setCurrentIngredient("");
        setEditingIndex(null);
        setShowForm(false);
    };

    const handleAddOrUpdate = async () => {
        if (!newItem.name.trim()) return alert("Name is required");
        if (newItem.price === "" || isNaN(newItem.price) || Number(newItem.price) < 0)
           return toast.error("Valid price is required");
        if (!newItem.category) return toast.error("Category is required");
        if (!selectedRestaurant) return toast.error("Please select a restaurant");

        // Create a more compatible payload structure
        const payload = {
            // Required fields
            name: newItem.name.trim(),
            price: Number(newItem.price),
            description: newItem.description?.trim() || "",
            category: newItem.category,
            restaurant: selectedRestaurant,

            // Optional fields with defaults
            image: newItem.image || "",
            ingredients: Array.isArray(newItem.ingredients) ? newItem.ingredients : [],
            allergens: [],
            isVegetarian: newItem.isVegetarian !== undefined ? newItem.isVegetarian : true,
            preparationTime: newItem.preparationTime || "15-20 mins",
            rating: 4.5,
            spicyLevel: newItem.spicyLevel || "Mild",
            servingSize: newItem.servingSize || "1 serving",
            isAvailable: true,

            // Additional fields
            detailedDescription: newItem.detailedDescription?.trim() || "",
            nutritionalInfo: {
                calories: newItem.nutritionalInfo?.calories || "",
                protein: newItem.nutritionalInfo?.protein || "",
                carbs: newItem.nutritionalInfo?.carbs || "",
                fat: newItem.nutritionalInfo?.fat || "",
            },
        };

        try {
            const editingId = editingIndex !== null ? menu[editingIndex]._id : null;
            const url = editingId
                ? `${API_URL}/api/menu/${selectedRestaurant}/${editingId}` // PUT
                : `${API_URL}/api/menu/${selectedRestaurant}`;             // POST

            console.log("Sending payload to:", url);
            console.log("Payload:", payload);

            const res = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let errorMessage = "Validation error";
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`;
                    console.error("API Error Details:", errorData);
                } catch (parseError) {
                    errorMessage = `HTTP ${res.status}: ${res.statusText}`;
                    console.error("Failed to parse error response:", parseError);
                }
                throw new Error(errorMessage);
            }
            const data = await res.json();
            console.log("API Response:", data);

            if (editingId) {
                const updatedMenu = [...menu];
                // Handle different response structures
                const updatedItem = data.item || data.menuItem || data;
                updatedMenu[editingIndex] = updatedItem;
                setMenu(updatedMenu);
               
            } else {
                // Handle different response structures
                const newItem = data.item || data.menuItem || data;
                setMenu([...menu, newItem]);
                 
            }

            resetForm();
            toast.success(`Menu item ${editingId ? 'updated' : 'added'} successfully!`);
        } catch (err) {
            console.error("Error saving menu item:", err);
            toast.error(`Failed to save menu item: ${err.message}`);
        }
    };





    const handleEdit = (index) => {
        setNewItem(menu[index]);
        setEditingIndex(index);
        setShowForm(true);
    };

  const handleDelete = async (index) => {
    const itemId = menu[index]._id;

    // Show a toast with confirm/cancel buttons
    const toastId = toast((t) => (
        <div className="flex flex-col gap-2">
            <span>Are you sure you want to delete this menu item?</span>
            <div className="flex gap-2 justify-end">
                <button
                    onClick={async () => {
                        toast.dismiss(t.id); // dismiss the confirmation toast
                        try {
                            const res = await fetch(`${API_URL}/api/menu/${selectedRestaurant}/${itemId}`, {
                                method: "DELETE",
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.message || "Delete failed");

                            setMenu(menu.filter((_, i) => i !== index));
                            toast.success("Menu item deleted successfully!");
                        } catch (err) {
                            console.error("Error deleting item:", err);
                            toast.error("Failed to delete item");
                        }
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Delete
                </button>
                <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                    Cancel
                </button>
            </div>
        </div>
    ), { duration: Infinity }); // keep the toast until user acts
};


    const addIngredient = () => {
        if (currentIngredient.trim() && !newItem.ingredients.includes(currentIngredient.trim())) {
            setNewItem({
                ...newItem,
                ingredients: [...newItem.ingredients, currentIngredient.trim()]
            });
            setCurrentIngredient("");
        }
    };

    const removeIngredient = (ingredientToRemove) => {
        setNewItem({
            ...newItem,
            ingredients: newItem.ingredients.filter(ing => ing !== ingredientToRemove)
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("file", file);

            try {
                console.log("Uploading image:", file.name);
                const res = await fetch(`${API_URL}/api/menu/upload-image`, {
                    method: "POST",
                    body: formData,
                });

                console.log("Upload response status:", res.status);

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("Upload error response:", errorText);
                    throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
                }

                const data = await res.json();
                console.log("Upload response data:", data);

                // Check if we have an image URL (successful upload)
                if (!data.imageUrl && !data.url && !data.image) {
                    throw new Error(data.message || "No image URL received");
                }

                // Handle different response structures for image URL
                const imageUrl = data.imageUrl || data.url || data.image || "/img/placeholder-food.jpg";
                setNewItem({ ...newItem, image: imageUrl });
                toast.success("Image uploaded successfully:", imageUrl);
                toast.success("Image uploaded successfully!");
            } catch (err) {
                console.error("Image upload error:", err);
                toast.error(`Image upload failed: ${err.message}`);
            }
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-2 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Cafe Card Selector */}
                <div className="mb-8 overflow-x-auto pb-2">
                    <div className="flex gap-4 min-w-[300px]">
                        {restaurants.map(r => (
                            <div
                                key={r.id || r._id}
                                onClick={() => setSelectedRestaurant(r.id || r._id)}
                                className={`cursor-pointer flex-shrink-0 w-64 sm:w-72 bg-white rounded-xl shadow-lg p-4 transition-all duration-300 border-2
                                    ${selectedRestaurant === (r.id || r._id)
                                        ? "border-orange-500 scale-105"
                                        : "border-transparent hover:scale-105 hover:border-orange-300"}`}
                                style={{ minWidth: "16rem" }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold text-orange-600">
                                        {r.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg text-orange-700">{r.name}</div>
                                        <div className="text-gray-500 text-sm">{r.location || "Cafe"}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Show selected cafe name */}
                {selectedRestaurant && (
                    <div className="mb-4 text-2xl font-bold text-orange-700 text-center sm:text-left transition-all duration-300">
                        {restaurants.find(r => (r.id || r._id) === selectedRestaurant)?.name}
                    </div>
                )}

                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">Menu Management</h1>
                            <p className="text-gray-600 text-sm sm:text-base">Manage your restaurant menu items</p>
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 flex items-center gap-2 shadow-lg text-sm sm:text-base"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Item
                            </button>
                           
                        </div>
                    </div>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg sm:max-w-4xl max-h-[95vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {editingIndex !== null ? "Edit Menu Item" : "Add New Menu Item"}
                                </h2>
                                <button
                                    onClick={resetForm}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant</label>
                                    <select
                                        value={selectedRestaurant}
                                        onChange={(e) => setSelectedRestaurant(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                        {restaurants.map(r => (
                                            <option key={r.id || r._id} value={r.id || r._id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>

                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            placeholder="Enter menu item name"
                                        />
                                    </div>

                                    {/* Price */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                                        <input
                                            type="number"
                                            value={newItem.price}
                                            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            placeholder="Enter price"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea
                                            value={newItem.description}
                                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            placeholder="Short description"
                                        />
                                    </div>

                                    {/* Detailed Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description</label>
                                        <textarea
                                            value={newItem.detailedDescription}
                                            onChange={(e) => setNewItem({ ...newItem, detailedDescription: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            placeholder="Detailed description"
                                        />
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                        <select
                                            value={newItem.category}
                                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Vegetarian/Non-Vegetarian */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                        <select
                                            value={newItem.isVegetarian ? 'vegetarian' : 'non-vegetarian'}
                                            onChange={(e) => setNewItem({ ...newItem, isVegetarian: e.target.value === 'vegetarian' })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        >
                                            <option value="vegetarian">Vegetarian</option>
                                            <option value="non-vegetarian">Non-Vegetarian</option>
                                        </select>
                                    </div>

                                    {/* Preparation Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Preparation Time</label>
                                        <input
                                            type="text"
                                            value={newItem.preparationTime || "15-20 mins"}
                                            onChange={(e) => setNewItem({ ...newItem, preparationTime: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            placeholder="e.g., 15-20 mins"
                                        />
                                    </div>

                                    {/* Spicy Level */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Spicy Level</label>
                                        <select
                                            value={newItem.spicyLevel || "Mild"}
                                            onChange={(e) => setNewItem({ ...newItem, spicyLevel: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        >
                                            <option value="None">None</option>
                                            <option value="Mild">Mild</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hot">Hot</option>
                                            <option value="Very Hot">Very Hot</option>
                                        </select>
                                    </div>

                                    {/* Serving Size */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Serving Size</label>
                                        <input
                                            type="text"
                                            value={newItem.servingSize || "1 serving"}
                                            onChange={(e) => setNewItem({ ...newItem, servingSize: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            placeholder="e.g., 1 serving, 2-3 people"
                                        />
                                    </div>

                                    {/* Image Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-500 transition-colors">
                                            {newItem.image ? (
                                                <div className="relative">
                                                    <img src={newItem.image} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                                                    <button
                                                        onClick={() => setNewItem({ ...newItem, image: "" })}
                                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                        id="image-upload"
                                                    />
                                                    <label htmlFor="image-upload" className="cursor-pointer text-orange-600 hover:text-orange-700">
                                                        Click to upload image
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ingredients */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={currentIngredient}
                                                onChange={(e) => setCurrentIngredient(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                                                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="Add an ingredient"
                                            />
                                            <button
                                                onClick={addIngredient}
                                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {newItem.ingredients.map((ingredient, index) => (
                                                <span
                                                    key={index}
                                                    className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                                                >
                                                    {ingredient}
                                                    <button
                                                        onClick={() => removeIngredient(ingredient)}
                                                        className="text-orange-600 hover:text-orange-800"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Nutritional Info */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nutritional Information</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={newItem.nutritionalInfo.calories}
                                                onChange={(e) => setNewItem({
                                                    ...newItem,
                                                    nutritionalInfo: { ...newItem.nutritionalInfo, calories: e.target.value }
                                                })}
                                                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="Calories (e.g., 266 kcal)"
                                            />
                                            <input
                                                type="text"
                                                value={newItem.nutritionalInfo.protein}
                                                onChange={(e) => setNewItem({
                                                    ...newItem,
                                                    nutritionalInfo: { ...newItem.nutritionalInfo, protein: e.target.value }
                                                })}
                                                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="Protein (e.g., 12g)"
                                            />
                                            <input
                                                type="text"
                                                value={newItem.nutritionalInfo.carbs}
                                                onChange={(e) => setNewItem({
                                                    ...newItem,
                                                    nutritionalInfo: { ...newItem.nutritionalInfo, carbs: e.target.value }
                                                })}
                                                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="Carbs (e.g., 30g)"
                                            />
                                            <input
                                                type="text"
                                                value={newItem.nutritionalInfo.fat}
                                                onChange={(e) => setNewItem({
                                                    ...newItem,
                                                    nutritionalInfo: { ...newItem.nutritionalInfo, fat: e.target.value }
                                                })}
                                                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                placeholder="Fat (e.g., 10g)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddOrUpdate}
                                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                                >
                                    {editingIndex !== null ? "Update Item" : "Add Item"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                {/* Menu Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menu.map((item, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                            {item.image && (
                                <div className="h-48 bg-gray-200 overflow-hidden">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            )}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-1">{item.name}</h3>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <span className="inline-block bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                                                {item.category}
                                            </span>
                                            <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${item.isVegetarian ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {item.isVegetarian ? 'Veg' : 'Non-Veg'}
                                            </span>
                                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                                {item.preparationTime}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-green-600">₹{item.price}</div>
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

                                {item.ingredients.length > 0 && (
                                    <div className="mb-3">
                                        <div className="flex flex-wrap gap-1">
                                            {item.ingredients.slice(0, 3).map((ingredient, i) => (
                                                <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                                    {ingredient}
                                                </span>
                                            ))}
                                            {item.ingredients.length > 3 && (
                                                <span className="text-gray-500 text-xs px-2 py-1">
                                                    +{item.ingredients.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(item.nutritionalInfo.calories || item.nutritionalInfo.protein || item.nutritionalInfo.carbs || item.nutritionalInfo.fat) && (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {item.nutritionalInfo.calories && <div><span className="font-medium">Calories:</span> {item.nutritionalInfo.calories}</div>}
                                            {item.nutritionalInfo.protein && <div><span className="font-medium">Protein:</span> {item.nutritionalInfo.protein}</div>}
                                            {item.nutritionalInfo.carbs && <div><span className="font-medium">Carbs:</span> {item.nutritionalInfo.carbs}</div>}
                                            {item.nutritionalInfo.fat && <div><span className="font-medium">Fat:</span> {item.nutritionalInfo.fat}</div>}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(index)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(index)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {menu.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">🍽️</div>
                            <h3 className="text-xl font-medium text-gray-600 mb-2">No menu items yet</h3>
                            <p className="text-gray-500 mb-4">Start by adding your first menu item</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300"
                            >
                                Add Your First Item
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export { MenuManagement };