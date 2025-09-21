import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Camera, MapPin, Star, Clock, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Route } from "react-router-dom";
import PreorderPage from "../PreorderModal.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export  function CafeManagement() {
    const [cafes, setCafes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [newCafe, setNewCafe] = useState({
        name: "",
        cuisine: "",
        priceRange: "",
        deliveryTime: "",
        rating: 4.0,
        reviews: 0,
        description: "",
        images: [],
        location: "",
        phone: "",
        email: "",
        isActive: true
    });

    const [currentImage, setCurrentImage] = useState("");

    const navigate = useNavigate();

    // Load cafes from API
    useEffect(() => {
        const fetchCafes = async () => {
            try {
                const res = await fetch(`${API_URL}/api/restaurants`);
                const data = await res.json();
                if (data.success) {
                    setCafes(data.restaurants || []);
                }
            } catch (err) {
                console.error("Error fetching cafes:", err);
            }
        };
        fetchCafes();
    }, []);

    const resetForm = () => {
        setNewCafe({
            name: "",
            cuisine: "",
            priceRange: "",
            deliveryTime: "",
            rating: 4.0,
            reviews: 0,
            description: "",
            images: [],
            location: "",
            phone: "",
            email: "",
            isActive: true
        });
        setCurrentImage("");
        setEditingIndex(null);
        setShowForm(false);
    };

    const handleAddOrUpdate = async () => {
        if (!newCafe.name.trim()) return alert("Cafe name is required");
        if (!newCafe.cuisine.trim()) return alert("Cuisine type is required");
        if (!newCafe.description.trim()) return alert("Description is required");

        const payload = {
            ...newCafe,
            rating: Number(newCafe.rating),
            reviews: Number(newCafe.reviews)
        };

        try {
            const editingId = editingIndex !== null ? cafes[editingIndex]._id : null;
            const res = await fetch(
                editingId
                    ? `${API_URL}/api/restaurants/${editingId}` // PUT
                    : `${API_URL}/api/restaurants`,             // POST
                {
                    method: editingId ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) {
                let errorMessage = "Validation error";
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                    
                    // If it's a 404 error, provide more context
                    if (res.status === 404) {
                        errorMessage = `Restaurant not found. ${errorMessage}`;
                        if (errorData.availableIds) {
                            console.log("Available restaurant IDs:", errorData.availableIds);
                        }
                    }
                } catch (parseError) {
                    // If response is not JSON (like HTML error page), use status text
                    errorMessage = `Server error: ${res.status} ${res.statusText}`;
                }
                throw new Error(errorMessage);
            }
            
            const data = await res.json();

            if (editingId) {
                const updatedCafes = [...cafes];
                updatedCafes[editingIndex] = data.restaurant;
                setCafes(updatedCafes);
            } else {
                setCafes([...cafes, data.restaurant]);
            }

            resetForm();
        } catch (err) {
            console.error("Error saving cafe:", err);
            alert(`Failed to save cafe: ${err.message}`);
        }
    };

    const handleEdit = (index) => {
        setNewCafe(cafes[index]);
        setEditingIndex(index);
        setShowForm(true);
    };

    const handleDelete = async (index) => {
        const cafeId = cafes[index]._id;
        if (window.confirm("Are you sure you want to delete this cafe?")) {
            try {
                const res = await fetch(`${API_URL}/api/restaurants/${cafeId}`, {
                    method: "DELETE",
                });
                
                if (!res.ok) {
                    let errorMessage = "Delete failed";
                    try {
                        const errorData = await res.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (parseError) {
                        errorMessage = `Server error: ${res.status} ${res.statusText}`;
                    }
                    throw new Error(errorMessage);
                }
                
                const data = await res.json();
                setCafes(cafes.filter((_, i) => i !== index));
            } catch (err) {
                console.error("Error deleting cafe:", err);
                alert(`Failed to delete cafe: ${err.message}`);
            }
        }
    };

    const addImage = () => {
        if (currentImage.trim() && !newCafe.images.includes(currentImage.trim())) {
            setNewCafe({
                ...newCafe,
                images: [...newCafe.images, currentImage.trim()]
            });
            setCurrentImage("");
        }
    };

    const removeImage = (imageToRemove) => {
        setNewCafe({
            ...newCafe,
            images: newCafe.images.filter(img => img !== imageToRemove)
        });
    };

  const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (file) {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("Uploading image:", file.name, "Size:", file.size);

      const res = await fetch(`${API_URL}/api/restaurants/upload-image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorMessage = "Upload failed";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log("Upload response data:", data);

      const imageUrl = data.imageUrl || data.url || data.image || data.path;
      if (!imageUrl) {
        throw new Error("No image URL received from server");
      }

      // ✅ Push uploaded image into cafe state
      setNewCafe((prev) => ({
        ...prev,
        images: [...prev.images, imageUrl],
      }));

      setCurrentImage(""); // reset input
      console.log("Image uploaded successfully:", imageUrl);
    } catch (err) {
      console.error("Image upload error:", err);
      alert(`Image upload failed: ${err.message}`);
    }
  }
};

    const handlePreorderClick = (restaurantId) => {
        navigate(`/preorder/${restaurantId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">Cafe Management</h1>
                            <p className="text-gray-600">Manage your restaurant cafes and locations</p>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center gap-2 shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Add New Cafe
                        </button>
                    </div>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {editingIndex !== null ? "Edit Cafe" : "Add New Cafe"}
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
                                <div className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Cafe Name</label>
                                        <input
                                            type="text"
                                            value={newCafe.name}
                                            onChange={(e) => setNewCafe({ ...newCafe, name: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter cafe name"
                                        />
                                    </div>

                                    {/* Cuisine */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type</label>
                                        <input
                                            type="text"
                                            value={newCafe.cuisine}
                                            onChange={(e) => setNewCafe({ ...newCafe, cuisine: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Multi-cuisine, Italian, Indian"
                                        />
                                    </div>

                                    {/* Price Range */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                                        <input
                                            type="text"
                                            value={newCafe.priceRange}
                                            onChange={(e) => setNewCafe({ ...newCafe, priceRange: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., ₹200-500"
                                        />
                                    </div>

                                    {/* Delivery Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time</label>
                                        <input
                                            type="text"
                                            value={newCafe.deliveryTime}
                                            onChange={(e) => setNewCafe({ ...newCafe, deliveryTime: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., 20-30 mins"
                                        />
                                    </div>

                                    {/* Rating */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="5"
                                            value={newCafe.rating}
                                            onChange={(e) => setNewCafe({ ...newCafe, rating: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="4.0"
                                        />
                                    </div>

                                    {/* Reviews Count */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reviews Count</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={newCafe.reviews}
                                            onChange={(e) => setNewCafe({ ...newCafe, reviews: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea
                                            value={newCafe.description}
                                            onChange={(e) => setNewCafe({ ...newCafe, description: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Describe your cafe"
                                            rows="3"
                                        />
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                        <input
                                            type="text"
                                            value={newCafe.location}
                                            onChange={(e) => setNewCafe({ ...newCafe, location: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter cafe location"
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            value={newCafe.phone}
                                            onChange={(e) => setNewCafe({ ...newCafe, phone: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter phone number"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={newCafe.email}
                                            onChange={(e) => setNewCafe({ ...newCafe, email: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter email address"
                                        />
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                        <select
                                            value={newCafe.isActive ? 'active' : 'inactive'}
                                            onChange={(e) => setNewCafe({ ...newCafe, isActive: e.target.value === 'active' })}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>

                                    {/* Images */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                                        <div className="space-y-3">
                                            {/* URL Input */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={currentImage}
                                                    onChange={(e) => setCurrentImage(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && addImage()}
                                                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Add image URL"
                                                />
                                                <button
                                                    onClick={addImage}
                                                    disabled={!currentImage.trim()}
                                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                >
                                                    Add URL
                                                </button>
                                            </div>
                                            
                                            {/* File Upload */}
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                    id="image-upload"
                                                />
                                                <label htmlFor="image-upload" className="cursor-pointer text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2">
                                                    <Camera className="w-4 h-4" />
                                                    Upload Image File
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG/GIF</p>
                                            </div>
                                            
                                            {/* Current Images */}
                                            {newCafe.images.length > 0 && (
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-2">Current Images ({newCafe.images.length}):</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {newCafe.images.map((image, index) => (
                                                            <div key={index} className="relative group">
                                                                <img 
                                                                    src={image} 
                                                                    alt={`Cafe ${index + 1}`} 
                                                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                                                    onError={(e) => {
                                                                        e.target.src = '/img/placeholder-food.jpg';
                                                                        e.target.alt = 'Image not found';
                                                                    }}
                                                                />
                                                                <button
                                                                    onClick={() => removeImage(image)}
                                                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="Remove image"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
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
                                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                                >
                                    {editingIndex !== null ? "Update Cafe" : "Add Cafe"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cafes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cafes.map((cafe, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                            {cafe.images && cafe.images.length > 0 && (
                                <div className="h-48 bg-gray-200 overflow-hidden">
                                    <img
                                        src={cafe.images[0]}
                                        alt={cafe.name}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            )}

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-1">{cafe.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>{cafe.location || 'Location not specified'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-yellow-500 mb-1">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="font-semibold">{cafe.rating}</span>
                                        </div>
                                        <div className="text-sm text-gray-500">{cafe.reviews} reviews</div>
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{cafe.description}</p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                        {cafe.cuisine}
                                    </span>
                                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        {cafe.priceRange}
                                    </span>
                                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {cafe.deliveryTime}
                                    </span>
                                </div>

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
                                    <button
                                        onClick={() => handlePreorderClick(cafe._id)}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                                    >
                                        Preorder
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {cafes.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">🏪</div>
                            <h3 className="text-xl font-medium text-gray-600 mb-2">No cafes yet</h3>
                            <p className="text-gray-500 mb-4">Start by adding your first cafe</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                            >
                                Add Your First Cafe
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export default CafeManagement;

