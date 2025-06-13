class ApiResponse {
  constructor(success, message, data = null) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static success(data = null, message = 'Success') {
    return new ApiResponse(true, message, data);
  }

  static error(message = 'Error', data = null) {
    return new ApiResponse(false, message, data);
  }

  static created(data = null, message = 'Resource created successfully') {
    return new ApiResponse(true, message, data);
  }

  static updated(data = null, message = 'Resource updated successfully') {
    return new ApiResponse(true, message, data);
  }

  static deleted(message = 'Resource deleted successfully') {
    return new ApiResponse(true, message);
  }

}

module.exports = ApiResponse;