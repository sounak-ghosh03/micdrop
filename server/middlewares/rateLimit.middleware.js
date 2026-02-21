const requestCounts = new Map();

export const rateLimitMiddleware = (limit = 10, windowMs = 60000) => {
   return (req, res, next) => {
      const userId = req.user?.id || req.ip;

      const currentTime = Date.now();

      if (!requestCounts.has(userId)) {
         requestCounts.set(userId, []);
      }

      const timestamps = requestCounts.get(userId);

      // Remove expired timestamps
      const filtered = timestamps.filter(
         (timestamp) => currentTime - timestamp < windowMs,
      );

      if (filtered.length >= limit) {
         return res.status(429).json({
            message: "Too many requests. Please slow down.",
         });
      }

      filtered.push(currentTime);
      requestCounts.set(userId, filtered);

      next();
   };
};
