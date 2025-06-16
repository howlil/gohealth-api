// src/middleware/validation.middleware.js
const ApiResponse = require('../libs/http/ApiResponse');
const { validationResult } = require('express-validator');

class ValidationMiddleware {
  validate() {
    return (req, res, next) => {
      try {
        console.log('Validating request data:', {
          body: req.body,
          query: req.query,
          params: req.params
        });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          const formattedErrors = this.formatExpressValidatorErrors(errors);
          console.log('Formatted errors:', formattedErrors);

          return res.status(422).json(
            ApiResponse.error(
              'Validation failed',
              422,
              { errors: formattedErrors }
            )
          );
        }

        next();
      } catch (error) {
        console.error('Validation error:', error);

        return res.status(422).json(
          ApiResponse.error(
            'Validation failed',
            422,
            { errors: { general: [error.message] } }
          )
        );
      }
    };
  }

  formatExpressValidatorErrors(errors) {
    const formattedErrors = {};

    errors.array().forEach((error) => {
      const field = error.path;
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(error.msg);
    });

    return formattedErrors;
  }
}

module.exports = new ValidationMiddleware();