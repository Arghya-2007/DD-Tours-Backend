// controllers/userController.js
const { admin, db } = require("../config/firebase"); // <--- Added 'db' here

// ==========================================
//  CUSTOMER ROUTES (For the Public Website)
// ==========================================

// 1. Get MY Profile (Read from Firestore)
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid; // From token

    // Check Firestore for extra details (Aadhar, Address, etc.)
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(200).json({}); // Return empty if no profile yet
    }

    res.status(200).json(userDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Update/Complete MY Profile (Write to Firestore)
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { phone, address, dob, aadharNo, panNo } = req.body;

    // We only save the fields we allow (No name/email changes)
    const updateData = {
      phone,
      address,
      dob,
      aadharNo,
      panNo,
      isProfileComplete: true,
      updatedAt: new Date().toISOString(),
    };

    // { merge: true } ensures we don't delete other data
    await db.collection("users").doc(userId).set(updateData, { merge: true });

    res.status(200).json({ message: "Profile Updated", user: updateData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
//  ADMIN ROUTES (For Your Dashboard)
// ==========================================

// 3. GET ALL USERS (With Pagination)
const getAllUsers = async (req, res) => {
  try {
    const maxResults = parseInt(req.query.limit) || 10;
    const pageToken = req.query.nextPageToken || undefined;

    const listUsersResult = await admin.auth().listUsers(maxResults, pageToken);

    const users = listUsersResult.users.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || "No Name",
      photoURL: userRecord.photoURL || null,
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
    }));

    res.status(200).json({
      users,
      nextPageToken: listUsersResult.pageToken,
    });
  } catch (error) {
    console.error("Error listing users:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// 4. DELETE USER
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await admin.auth().deleteUser(id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getUserProfile,
  updateUserProfile,
};
