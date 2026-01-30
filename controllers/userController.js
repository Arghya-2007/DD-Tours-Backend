const { admin } = require("../config/firebase");

// --- 1. GET USERS (With Pagination) ---
const getAllUsers = async (req, res) => {
  try {
    // Read query params from the URL (e.g., ?limit=10&nextPageToken=...)
    const maxResults = parseInt(req.query.limit) || 10;
    const pageToken = req.query.nextPageToken || undefined;

    // Firebase Admin SDK supports native pagination
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

    // Send back data AND the token for the next page
    res.status(200).json({
      users,
      nextPageToken: listUsersResult.pageToken, // This is null if no more users exist
    });
  } catch (error) {
    console.error("Error listing users:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// --- 2. DELETE USER ---
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

module.exports = { getAllUsers, deleteUser };
