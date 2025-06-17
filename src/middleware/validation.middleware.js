// src/middleware/validation.middleware.js
const ApiResponse = require('../libs/http/ApiResponse');

class ValidationMiddleware {
  validate(schema) {
    return (req, res, next) => {
      try {
        const { error, value } = schema.validate({
          body: req.body,
          query: req.query,
          params: req.params
        }, {
          abortEarly: false,
          stripUnknown: true,
          convert: true
        });

        if (error) {
          const formattedErrors = this.formatJoiErrors(error);

          return res.status(422).json(
            ApiResponse.error(
              'Validation failed',
              422,
              { errors: formattedErrors }
            )
          );
        }

        req.body = value.body || req.body;
        req.query = value.query || req.query;
        req.params = value.params || req.params;

        next();
      } catch (error) {
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

  formatJoiErrors(error) {
    const formattedErrors = {};

    error.details.forEach((detail) => {
      const path = detail.path.join('.');
      if (!formattedErrors[path]) {
        formattedErrors[path] = [];
      }
      formattedErrors[path].push(detail.message);
    });

    return formattedErrors;
  }
}

module.exports = new ValidationMiddleware();