const {Category} = require('../model/category');
const { entityIdGenerator } = require('../utils/entityGenerator');

const addCategory = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.categoryName) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const existingCategory = await Category.find({ categoryName: payload.categoryName });
    if (!existingCategory) {
      return res.status(409).json({ message: "This category already exists" });
    }

    const categoryId = entityIdGenerator('CA');
    const newCategory = new Category({
      ...payload,
      categoryId,
    });

    const savedCategory = await newCategory.save();

    return res.status(201).json({ message: "Category added successfully", data: savedCategory });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

module.exports = {
  addCategory,
};
