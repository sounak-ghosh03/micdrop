export const errorMiddleware = (err, req, res, next) => {
   console.error("Error:", err);

   const statusCode = err.statusCode || 500;

   res.status(statusCode).json({
      success: false,
      message:
         process.env.NODE_ENV === "production"
            ? "Something went wrong"
            : err.message,
   });
};
