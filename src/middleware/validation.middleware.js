// src/middleware/validation.middleware.js
const ApiResponse = require('../libs/http/ApiResponse');
const Logger = require('../libs/logger/Logger');

class ValidationMiddleware {
  validate(schema) {
    return (req, res, next) => {
      try {
        // Log incoming request data for debugging
        Logger.debug('Validation Middleware - Incoming request:', {
          method: req.method,
          path: req.path,
          body: req.body,
          query: req.query,
          params: req.params
        });

        // Check if schema already has body/query/params structure
        const hasStructure = schema.describe().keys &&
          (schema.describe().keys.body ||
            schema.describe().keys.query ||
            schema.describe().keys.params);

        Logger.debug('Schema structure:', {
          hasStructure,
          schemaKeys: schema.describe().keys ? Object.keys(schema.describe().keys) : 'none'
        });

        let dataToValidate;
        let validationSchema;

        if (hasStructure) {
          // Schema already has structure, use it directly
          dataToValidate = {
            body: req.body,
            query: req.query,
            params: req.params
          };
          validationSchema = schema;
        } else {
          // Schema is just for body, wrap it
          dataToValidate = req.body;
          validationSchema = schema;
        }

        Logger.debug('Data to validate:', dataToValidate);

        const { error, value } = validationSchema.validate(dataToValidate, {
          abortEarly: false,
          stripUnknown: true,
          convert: true
        });

        if (error) {
          const formattedErrors = this.formatJoiErrors(error);

          Logger.error('Validation failed:', {
            path: req.path,
            method: req.method,
            errors: formattedErrors,
            details: error.details
          });

          return res.status(422).json(
            ApiResponse.error(
              'Validation failed',
              422,
              { errors: formattedErrors }
            )
          );
        }

        Logger.debug('Validation passed, validated values:', value);

        // Update request with validated values
        if (hasStructure) {
          // Only update body since query and params are often read-only
          if (value.body !== undefined) {
            req.body = value.body;
          }
          // Store validated query and params in req for later use if needed
          if (value.query !== undefined) {
            req.validatedQuery = value.query;
          }
          if (value.params !== undefined) {
            req.validatedParams = value.params;
          }
        } else {
          req.body = value;
        }

        next();
      } catch (error) {
        Logger.error('Validation middleware error:', {
          message: error.message,
          stack: error.stack
        });

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