const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const ApiResponse = {
  success: (res, data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data,
      error: null
    });
  },

  error: (res, message, statusCode = 500, error = null) => {
    return res.status(statusCode).json({
      success: false,
      data: null,
      error: message
    });
  },

  paginated: (res, data, pagination, statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data,
      pagination,
      error: null
    });
  },

  created: (res, data) => {
    return res.status(201).json({
      success: true,
      data,
      error: null
    });
  },

  noContent: (res) => {
    return res.status(204).send();
  }
};

module.exports = {
  asyncHandler,
  ApiResponse
};