const Joi = require('joi');

const SERVICE_TYPES = [
  'plumber', 'electrician', 'painter', 'carpenter', 'cleaner',
  'mover', 'hvac', 'landscaper', 'roofer', 'appliance_repair', 'general'
];

const createRequestSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required(),
  description: Joi.string().trim().min(10).max(1000).required(),
  serviceType: Joi.string().valid(...SERVICE_TYPES).required(),
  location: Joi.string().allow(''),
  budget: Joi.number().min(0),
  preferredDate: Joi.date().iso(),
  preferredTime: Joi.string().valid('morning', 'afternoon', 'evening', 'anytime').default('anytime')
});

const updateRequestSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100),
  description: Joi.string().trim().min(10).max(1000),
  serviceType: Joi.string().valid(...SERVICE_TYPES),
  location: Joi.string().allow(''),
  budget: Joi.number().min(0),
  preferredDate: Joi.date().iso().allow(null),
  preferredTime: Joi.string().valid('morning', 'afternoon', 'evening', 'anytime'),
  status: Joi.string().valid('open', 'in_progress', 'completed')
});

const applySchema = Joi.object({
  message: Joi.string().allow('').max(500),
  proposedPrice: Joi.number().min(0)
});

const updateApplicationSchema = Joi.object({
  status: Joi.string().valid('pending', 'accepted', 'rejected').required(),
  message: Joi.string().allow('')
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
  createRequestSchema,
  updateRequestSchema,
  applySchema,
  updateApplicationSchema,
  validate,
  SERVICE_TYPES
};