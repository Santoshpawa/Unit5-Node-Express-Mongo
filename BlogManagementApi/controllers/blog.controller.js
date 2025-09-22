const blogModel = require("../models/blog.model");



// post a blog
async function addBlog(req,res){
    try {
        
        req.body.createdBy = req.user;
        await blogModel.create(req.body);
        res.json({msg:"Blog added"})
    } catch (error) {
        res.json({msg:"Something went wrong"});
    }
}

// fetch the blog
async function getAllBlogs(req,res){
    try {
        let userId = req.user;
        let blogs = await blogModel.find({createdBy: userId});
        res.json(blogs);
    } catch (error) {
         res.json({msg:"Something went wrong"});
    }
}

// updating the blog
async function updateBlogById(req,res){
    try {
        let blogId = req.params.id;
        await blogModel.findByIdAndUpdate(blogId,req.body);
        res.json({msg:"Blog updated"});
    } catch (error) {
        res.json({msg:"Something went wrong"})
    }
}

// delete a blog by id
async function deleteBlogById(req,res){
    try {
        let blogId = req.params.id;
        await blogModel.findByIdAndDelete(blogId);
        res.json({msg:"Blog deleted"});
    } catch (error) {
        res.json({msg:"Something went wrong"})
    }
}

// get statistics
async function getStatistics(req,res){
    try {
        
    } catch (error) {
        
    }
}


module.exports = { addBlog, getAllBlogs, updateBlogById, deleteBlogById, getStatistics}