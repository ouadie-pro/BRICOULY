const Joi = require('joi');

const createReviewSchema = Joi.object({
  providerId: Joi.string().required(),
  serviceRequestId: Joi.string(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().allow('').max(500)
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5),
  comment: Joi.string().allow('').max(500)
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const messages = error.details.map(d => d.message).join(', ');
      return res.status(400).json({
        success: false,
        error: messages,
        data: null
      });
    }
    
    next();
  };
};

module.exports = {
  createReviewSchema,
  updateReviewSchema,
  validate
};