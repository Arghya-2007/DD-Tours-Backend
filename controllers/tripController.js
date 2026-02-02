// controllers/tripController.js
const { db } = require("../config/firebase");
const cloudinary = require("../config/cloudinary");

// --- Helper: Upload ONE file to Cloudinary ---
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "dd-tours-packages" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
};

// --- Helper: Delete ONE file from Cloudinary ---
const deleteFromCloudinary = async (publicId) => {
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Warning: Failed to delete image from Cloudinary:", error);
    }
  }
};

// --- Helper: Safe JSON Parse ---
const parseArrayField = (fieldValue) => {
  if (!fieldValue) return [];
  try {
    return JSON.parse(fieldValue);
  } catch (e) {
    // Fallback for simple comma-separated string
    return fieldValue.split(",").map((item) => item.trim());
  }
};

// --- 1. CREATE Trip (Updated with New Fields) ---
const createTrip = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      duration,
      location,
      fixedDate, // New
      expectedMonth, // New
      bookingEndsIn, // New
      includedItems,
      placesCovered, // New
    } = req.body;

    // Validation
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }
    if (!title || !price) {
      return res
        .status(400)
        .json({ message: "Title and Price are required fields." });
    }

    // Parse Arrays
    const parsedIncludedItems = parseArrayField(includedItems);
    const parsedPlacesCovered = parseArrayField(placesCovered);

    // Upload Images
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer),
    );
    const uploadResults = await Promise.all(uploadPromises);
    const images = uploadResults.map((result) => ({
      url: result.secure_url,
      id: result.public_id,
    }));

    // Create Object
    const newTrip = {
      title: title.trim(),
      description: description ? description.trim() : "",
      price: Number(price),
      duration: duration || "TBD",
      location: location || "TBD",

      // New Scheduling Fields
      fixedDate: fixedDate || "",
      expectedMonth: expectedMonth || "",
      bookingEndsIn: bookingEndsIn || "",

      // Arrays
      includedItems: parsedIncludedItems,
      placesCovered: parsedPlacesCovered,

      images: images,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("trips").add(newTrip);

    res.status(201).json({
      message: "Trip added successfully",
      id: docRef.id,
      ...newTrip,
    });
  } catch (error) {
    console.error("Error creating trip:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// --- 2. GET All Trips ---
const getAllTrips = async (req, res) => {
  try {
    const snapshot = await db
      .collection("trips")
      .orderBy("createdAt", "desc")
      .get();
    if (snapshot.empty) return res.status(200).json([]);

    const trips = [];
    snapshot.forEach((doc) => {
      trips.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(trips);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching trips", error: error.message });
  }
};

// --- 3. GET Single Trip ---
const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("trips").doc(id).get();
    if (!doc.exists) return res.status(404).json({ message: "Trip not found" });

    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching trip", error: error.message });
  }
};

// --- 4. UPDATE Trip (Updated with New Fields) ---
const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const docRef = db.collection("trips").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: "Trip not found" });

    // Parse Arrays if present
    if (updates.includedItems) {
      updates.includedItems = parseArrayField(updates.includedItems);
    }
    if (updates.placesCovered) {
      updates.placesCovered = parseArrayField(updates.placesCovered);
    }

    // Handle Image Replacement
    if (req.files && req.files.length > 0) {
      const tripData = doc.data();

      // Delete old images
      if (tripData.images && Array.isArray(tripData.images)) {
        for (const img of tripData.images) await deleteFromCloudinary(img.id);
      } else if (tripData.imageId) {
        await deleteFromCloudinary(tripData.imageId);
      }

      // Upload new images
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer),
      );
      const uploadResults = await Promise.all(uploadPromises);

      updates.images = uploadResults.map((result) => ({
        url: result.secure_url,
        id: result.public_id,
      }));

      // Cleanup legacy fields
      updates.imageUrl = "";
      updates.imageId = "";
    }

    if (updates.price) updates.price = Number(updates.price);

    await docRef.update(updates);
    res
      .status(200)
      .json({ message: "Trip updated successfully", id, ...updates });
  } catch (error) {
    console.error("Error updating trip:", error);
    res
      .status(500)
      .json({ message: "Error updating trip", error: error.message });
  }
};

// --- 5. DELETE Trip ---
const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("trips").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: "Trip not found" });

    const tripData = doc.data();
    if (tripData.images && Array.isArray(tripData.images)) {
      for (const img of tripData.images) await deleteFromCloudinary(img.id);
    } else if (tripData.imageId) {
      await deleteFromCloudinary(tripData.imageId);
    }

    await docRef.delete();
    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting trip", error: error.message });
  }
};

module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
};
