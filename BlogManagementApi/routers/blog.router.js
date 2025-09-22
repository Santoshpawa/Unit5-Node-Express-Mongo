const express = require("express");
const { addBlog, getAllBlogs, updateBlogById, deleteBlogById } = require("../controllers/blog.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const blogRouter = express.Router();


// adding a new blog
blogRouter.post("/", authMiddleware, addBlog);

// fetching all blog
blogRouter.get("/", authMiddleware ,getAllBlogs);

// updated blog
blogRouter.patch("/:id", authMiddleware,updateBlogById);

// delete blog
blogRouter.delete("/:id", authMiddleware ,deleteBlogById);

blogRouter.get("/stats", authMiddleware ,getStatistics);

module.exports = blogRouter;