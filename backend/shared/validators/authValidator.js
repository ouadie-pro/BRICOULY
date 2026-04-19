const Joi = require('joi');

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('client', 'provider').default('client'),
  phone: Joi.string().allow(''),
  specialization: Joi.string().valid(
    'plumber', 'electrician', 'painter', 'carpenter', 'cleaner',
    'mover', 'hvac', 'landscaper', 'roofer', 'appliance_repair', 'general'
  ).when('role', { is: 'provider', then: Joi.required() }),
  bio: Joi.string().allow('').max(500)
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  phone: Joi.string().allow(''),
  location: Joi.string().allow(''),
  avatar: Joi.string().allow(''),
  bio: Joi.string().allow('').max(500),
  city: Joi.string().allow(''),
  specialization: Joi.string().valid(
    'plumber', 'electrician', 'painter', 'carpenter', 'cleaner',
    'mover', 'hvac', 'landscaper', 'roofer', 'appliance_repair', 'general'
  ),
  hourlyRate: Joi.number().min(0)
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
  signupSchema,
  loginSchema,
  updateProfileSchema,
  validate
};