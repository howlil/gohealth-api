// src/middleware/validation.middleware.js
const ApiResponse = require('../libs/http/ApiResponse');

class ValidationMiddleware {
  validate(schema) {
    return async (req, res, next) => {
      try {
        console.log('Validating request data:', {
          body: req.body,
          query: req.query,
          params: req.params
        });

        const validatedData = await schema.validate({
          body: req.body,
          query: req.query,
          params: req.params
        }, {
          abortEarly: false,
          stripUnknown: true
        });

        // Only replace req.body as it's writable
        // Don't attempt to modify req.query or req.params
        if (validatedData.body) {
          req.body = validatedData.body;
        }

        next();
      } catch (error) {
        console.error('Validation error:', error);

        const errors = this.formatYupErrors(error);
        console.log('Formatted errors:', errors);

        return res.status(422).json(
          ApiResponse.error(
            'Validation failed',
            422,
            { errors }
          )
        );
      }
    };
  }

  formatYupErrors(error) {
    const errors = {};

    if (error.inner && error.inner.length > 0) {
      error.inner.forEach((err) => {
        const path = err.path.split('.').slice(1).join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
    } else if (error.message) {
      errors.general = [error.message];
    }

    return errors;
  }
}

module.exports = new ValidationMiddleware();