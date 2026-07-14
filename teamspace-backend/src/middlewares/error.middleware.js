import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
      data: err.data,
    });
  }

  console.error("Unhandled error: ", err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    errors: [],
    data: null,
  });
};

export { errorHandler };
