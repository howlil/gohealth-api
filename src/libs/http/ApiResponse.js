class ApiResponse {
  constructor(success, statusCode, message, data = null, meta = null) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  static success(data = null, message = 'Success', statusCode = 200, meta = null) {
    return new ApiResponse(true, statusCode, message, data, meta);
  }

  static error(message = 'Error', statusCode = 500, data = null) {
    return new ApiResponse(false, statusCode, message, data);
  }

  static created(data = null, message = 'Resource created successfully', meta = null) {
    return new ApiResponse(true, 201, message, data, meta);
  }

  static updated(data = null, message = 'Resource updated successfully', meta = null) {
    return new ApiResponse(true, 200, message, data, meta);
  }

  static deleted(message = 'Resource deleted successfully') {
    return new ApiResponse(true, 200, message);
  }

  static pagination(data, page, limit, total, message = 'Success') {
    const meta = {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    };
    return new ApiResponse(true, 200, message, data, meta);
  }
}

module.exports = ApiResponse;