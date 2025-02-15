import { Request, Response } from "express";
import { Category, ICategoryDocument } from "../models/category.model";
import { clearCache } from "../middleware/cache.middleware";

export const createCategory = async (req: Request, res: Response) => {
  try {
    const category: ICategoryDocument = await Category.create(req.body);
    await clearCache("categories*");
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: "Failed to create category" });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find()
      .populate("parent", "name")
      .sort({ level: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

export const getCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug }).populate(
      "parent",
      "name"
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch category" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    await clearCache("categories*");
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: "Failed to update category" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    await clearCache("categories*");
    res.json({ message: "Category removed" });
  } catch (error) {
    res.status(400).json({ message: "Failed to delete category" });
  }
};
