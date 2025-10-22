const crypto = require("crypto");
/*
 * path: server/error.js
 */
class AppError extends Error {
  /**
   * @param {Object} options
   * @param {number} [options.statusCode=500]
   * @param {string} [options.level='normal']             // 'normal' | 'critical'
   * @param {string} [options.errorType='InternalServerError']
   * @param {string} [options.message='The server has encountered an error.']
   * @param {string} [options.context]
   * @param {string} [options.help]
   * @param {string|number} [options.code]
   * @param {object} [options.errorDetails]
   * @param {boolean} [options.hideStack=false]
   * @param {string} [options.id]                         // request-scoped id
   */
  constructor(options = {}) {
    const {
      statusCode = 500,
      level = "normal",
      errorType = "InternalServerError",
      message = "The server has encountered an error.",
      context,
      help,
      code,
      errorDetails,
      hideStack = false,
      id,
    } = options;

    super(message);
    this.name = errorType;
    this.statusCode = statusCode;
    this.level = level;
    this.errorType = errorType;
    this.context = context;
    this.help = help;
    this.code = code;
    this.errorDetails = errorDetails;
    this.hideStack = hideStack;
    this.id =
      id || crypto.randomUUID?.() || crypto.randomBytes(16).toString("hex");

    // Maintain proper stack (V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/** ---------- Helpers to keep options clean ---------- */
const mergeOptions = (options, defaults) => {
  const out = { ...defaults };
  Object.keys(options || {}).forEach((k) => {
    if (options[k] !== undefined) out[k] = options[k];
  });
  return out;
};

/** ---------- Typed error classes (subset, dễ mở rộng) ---------- */
class InternalServerError extends AppError {
  constructor(options = {}) {
    super(
      mergeOptions(options, {
        statusCode: 500,
        level: "critical",
        errorType: "InternalServerError",
        message: "The server has encountered an error.",
      })
    );
  }
}
class BadRequestError extends AppError {
  constructor(options = {}) {
    super(
      mergeOptions(options, {
        statusCode: 400,
        errorType: "BadRequestError",
        message: "The request could not be understood.",
      })
    );
  }
}
class ValidationError extends AppError {
  constructor(options = {}) {
    super(
      mergeOptions(options, {
        statusCode: 422,
        errorType: "ValidationError",
        message: "The request failed validation.",
      })
    );
  }
}
class UnauthorizedError extends AppError {
  constructor(options = {}) {
    super(
      mergeOptions(options, {
        statusCode: 401,
        errorType: "UnauthorizedError",
        message: "You are not authorised to make this request.",
      })
    );
  }
}
class NoPermissionError extends AppError {
  constructor(options = {}) {
    super(
      mergeOptions(options, {
        statusCode: 403,
        errorType: "NoPermissionError",
        message: "You do not have permission to perform this request.",
      })
    );
  }
}
class NotFoundError extends AppError {
  constructor(options = {}) {
    super(
      mergeOptions(options, {
        statusCode: 404,
        errorType: "NotFoundError",
        message: "Resource could not be found.",
        hideStack: true,
      })
    );
  }
}
class TooManyRequestsError extends AppError {
  constructor(options = {}) {
    super(
      mergeOptions(options, {
        statusCode: 429,
        errorType: "TooManyRequestsError",
        message:
          "Server has received too many similar requests in a short space of time.",
      })
    );
  }
}
class ConflictError extends AppError {
  constructor(options = {}) {
    super(
      mergeOptions(options, {
        statusCode: 409,
        errorType: "ConflictError",
        message: "The server has encountered an conflict.",
      })
    );
  }
}

module.exports = {
  AppError,
  InternalServerError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  NoPermissionError,
  NotFoundError,
  TooManyRequestsError,
  ConflictError,
};
