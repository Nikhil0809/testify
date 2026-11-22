import mongoose from 'mongoose';

// Cache the connection promise so concurrent callers (server boot + seeder)
// share a single connection instead of opening two.
let connectionPromise = null;

const connectDB = () => {
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(process.env.MONGO_URI)
    .then((conn) => {
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn;
    })
    .catch((err) => {
      connectionPromise = null;
      console.error(`MongoDB connection error: ${err.message}`);
      throw err;
    });

  return connectionPromise;
};

export default connectDB;
