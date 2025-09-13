// custom error
class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
    };
  }

  toString() {
    return `${this.statusCode}: ${this.message}`;
  }
}

export default CustomError;
