const { db } = require("../config/firebase");

// --- 1. CREATE BLOG (Admin Only) ---
const createBlog = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content, // HTML or Markdown content
      image,
      category,
      readTime,
      author,
      youtubeUrl, // 🆕 New Field
      facebookUrl, // 🆕 New Field
    } = req.body;

    if (!title || !image) {
      return res.status(400).json({ message: "Title and Image are required." });
    }

    const newBlog = {
      title,
      excerpt: excerpt || title.substring(0, 100) + "...",
      content: content || "",
      image,
      category: category || "General",
      readTime: readTime || "5 min",
      author: author || "Command HQ",
      youtubeUrl: youtubeUrl || "",
      facebookUrl: facebookUrl || "",
      createdAt: new Date().toISOString(),
    };

    await db.collection("blogs").add(newBlog);

    res
      .status(201)
      .json({ message: "Blog Dispatched Successfully!", blog: newBlog });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create blog", error: error.message });
  }
};

// --- 2. GET ALL BLOGS (Public) ---
const getAllBlogs = async (req, res) => {
  try {
    const snapshot = await db
      .collection("blogs")
      .orderBy("createdAt", "desc")
      .get();

    const blogs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(blogs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch blogs", error: error.message });
  }
};

// --- 3. GET SINGLE BLOG (Public) ---
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("blogs").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Report not found." });
    }

    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching report", error: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("blogs").doc(id).delete();
    res.status(200).json({ message: "Report redacted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete report", error: error.message });
  }
};

module.exports = { createBlog, getAllBlogs, getBlogById, deleteBlog };
