"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const cached = global.mongoose || { conn: null, promise: null };
if (!global.mongoose) {
    global.mongoose = cached;
}
const connectDB = async () => {
    // ১. যদি আগে থেকেই কানেকশন থাকে, তবে সেটি রিটার্ন করো (নতুন করে কানেক্ট করবে না)
    if (cached.conn) {
        console.log('=> using existing database connection');
        return cached.conn;
    }
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        const dbName = process.env.DB_NAME || 'scic-ass';
        // ২. কানেকশন অপশনে bufferCommands: false যোগ করা হয়েছে (সবচেয়ে গুরুত্বপূর্ণ)
        const opts = {
            dbName,
            maxPoolSize: 10,
            bufferCommands: false, // 🔥 এটি ১০ সেকেন্ডের টাইমআউট এরর বন্ধ করবে
        };
        if (!cached.promise) {
            cached.promise = mongoose_1.default.connect(mongoURI, opts);
        }
        cached.conn = await cached.promise;
        console.log(`✅ MongoDB Connected: ${cached.conn.connection.host}`);
        return cached.conn;
    }
    catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        // ভুল হলে ক্যাশ রিসেট করো যাতে পরের রিকোয়েস্ট আবার চেষ্টা করতে পারে
        cached.promise = null;
        // ডেভেলপমেন্টে প্রসেস এক্সিট, কিন্তু Vercel-এ এরর থ্রো করবে
        if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
            process.exit(1);
        }
        else {
            throw error;
        }
    }
};
exports.connectDB = connectDB;
