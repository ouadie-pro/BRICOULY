const Category = require('../models/Category');

exports.getCategories = async (req, res) => {
  try {
    console.log('[getCategories] Request received', { query: req.query });
    const categories = await Category.find();
    console.log('[getCategories] Found categories:', categories.length);

    res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error('[getCategories] Error:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getCategory = async (req, res) => {
  try {
    console.log('[getCategory] Request received', { params: req.params });
    const category = await Category.findById(req.params.id).populate('providers');
    console.log('[getCategory] Found category:', category?.name);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.seedCategories = async (req, res) => {
  try {
    const categories = [
      { name: 'Plumbing', icon: 'plumbing', color: 'bg-blue-50 text-primary' },
      { name: 'Electrical', icon: 'bolt', color: 'bg-yellow-50 text-yellow-600' },
      { name: 'Cleaning', icon: 'cleaning_services', color: 'bg-purple-50 text-purple-600' },
      { name: 'Painting', icon: 'format_paint', color: 'bg-pink-50 text-pink-600' },
      { name: 'Carpentry', icon: 'carpenter', color: 'bg-amber-50 text-amber-700' },
      { name: 'Moving', icon: 'local_shipping', color: 'bg-green-50 text-green-600' },
      { name: 'Repair', icon: 'handyman', color: 'bg-red-50 text-red-500' },
      { name: 'More', icon: 'grid_view', color: 'bg-slate-100 text-slate-500' },
    ];

    await Category.deleteMany({});
    const created = await Category.insertMany(categories);

    res.json({
      success: true,
      count: created.length,
      categories: created,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
