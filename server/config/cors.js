const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
          return callback(null, true);
      }
      return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
};

module.exports = {
  allowedOrigins,
  corsOptions
};
