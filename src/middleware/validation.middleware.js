// src/middleware/validation.middleware.js
const ApiResponse = require('../libs/http/ApiResponse');

class ValidationMiddleware {
  validate(schema) {
    return async (req, res, next) => {
      try {
        const validatedData = await schema.validate({
          body: req.body,
          query: req.query,
          params: req.params
        }, {
          abortEarly: false,
          stripUnknown: true
        });

        // Replace request data with validated data
        req.body = validatedData.body || req.body;
        req.query = validatedData.query || req.query;
        req.params = validatedData.params || req.params;

        next();
      } catch (error) {
        const errors = this.formatYupErrors(error);
        
        return res.status(422).json(
          ApiResponse.error(
            'Validation failed',
            422,
            errors
          )
        );
      }
    };
  }

  formatYupErrors(error) {
    const errors = {};
    
    if (error.inner) {
      error.inner.forEach((err) => {
        const path = err.path.split('.').slice(1).join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
    }
    
    return errors;
  }
}

module.exports = new ValidationMiddleware();