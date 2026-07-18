"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Cache the mongoose connection for serverless environments
let isConnected = false;
const connectDB = async () => {
    if (isConnected) {
        console.log('=> using existing database connection');
        return;
    }
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        const dbName = process.env.DB_NAME || 'scic-ass';
        const db = await mongoose_1.default.connect(mongoURI, {
            dbName,
            maxPoolSize: 10,
        });
        isConnected = db.connections[0].readyState === 1;
        console.log(`MongoDB Connected: ${db.connection.host}`);
    }
    catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // Don't exit process in serverless, throw instead
        if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
            process.exit(1);
        }
        else {
            throw error;
        }
    }
};
exports.connectDB = connectDB;
