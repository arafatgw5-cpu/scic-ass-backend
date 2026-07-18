import mongoose from 'mongoose';

// ১. TypeScript-কে বলে দিচ্ছি ক্যাশ অবজেক্টটি দেখতে কেমন হবে
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// ২. গ্লোবাল অবজেক্টে আমাদের ক্যাশ যুক্ত করছি
declare global {
  var mongooseCache: MongooseCache | undefined;
}

// ৩. ক্যাশ ইনিশিয়ালাইজ করা (যদি না থাকে তবে নতুন অবজেক্ট তৈরি হবে)
const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export const connectDB = async () => {
  // ৪. যদি আগে থেকেই কানেকশন থাকে, তবে সেটি রিটার্ন করো
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
    
    // ৫. bufferCommands: false যোগ করা হয়েছে (১০ সেকেন্ড টাইমআউট বন্ধ করার জন্য)
    const opts = {
      dbName,
      maxPoolSize: 10,
      bufferCommands: false, 
    };

    if (!cached.promise) {
      cached.promise = mongoose.connect(mongoURI, opts);
    }

    cached.conn = await cached.promise;
    
    // ৬. এখানে TypeScript এখন নিশ্চিত যে cached.conn null নয়, তাই এটি এরর দেবে না
    console.log(`✅ MongoDB Connected: ${cached.conn.connection.host}`);
    
    return cached.conn;

  } catch (error: any) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    
    // ফেইল করলে পরের বার আবার চেষ্টা করার জন্য promise রিসেট করে দাও
    cached.promise = null;

    // লোকাল এনভায়রনমেন্টে প্রসেস বন্ধ করবে, কিন্তু Vercel-এ শুধু এরর থ্রো করবে
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
      process.exit(1);
    } else {
      throw error;
    }
  }
};