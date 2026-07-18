import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    _id: any;
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // 1. Get token from either cookie or Authorization header
  let betterAuthToken = req.cookies && (req.cookies['better-auth.session_token'] || req.cookies['__Secure-better-auth.session_token']);
  let bearerToken = null;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    bearerToken = req.headers.authorization.split(' ')[1];
    // JWTs have exactly 2 dots (3 parts: header.payload.signature)
    // Better Auth signed cookies have 1 dot (2 parts: token.signature) or 0 dots
    if (bearerToken) {
      const dotCount = (bearerToken.match(/\./g) || []).length;
      if (dotCount !== 2) {
        betterAuthToken = bearerToken;
      }
    }
  }

  // Extract the actual token from the signed cookie format (token.signature)
  if (betterAuthToken && betterAuthToken.includes('.')) {
    betterAuthToken = betterAuthToken.split('.')[0];
  }

  // Ensure it's URL decoded (Next.js or frontend might pass it URL encoded)
  if (betterAuthToken) {
    try {
      betterAuthToken = decodeURIComponent(betterAuthToken);
    } catch(e) {}
  }

  // 2. Check for Better Auth session
  if (betterAuthToken) {
    try {
      const sessionCollection = mongoose.connection.collection('session');
      
      // Check both raw and hashed token
      const crypto = require('crypto');
      const hashedToken = crypto.createHash('sha256').update(betterAuthToken).digest('hex');
      
      const session = await sessionCollection.findOne({ 
        $or: [
          { token: betterAuthToken },
          { token: hashedToken }
        ]
      });
      
      if (session && session.expiresAt > new Date()) {
        const usersCollection = mongoose.connection.collection('user');
        
        // Handle both string and ObjectId userId from Better Auth
        let userObjectId;
        try {
          userObjectId = new mongoose.Types.ObjectId(session.userId.toString());
        } catch (e) {
          userObjectId = session.userId; // fallback if somehow not compatible
        }
        
        const userDoc = await usersCollection.findOne({ _id: userObjectId });
        
        if (userDoc) {
          const idStr = userDoc._id.toString();
          req.user = {
            _id: userDoc._id,
            id: idStr,
            email: userDoc.email,
            name: userDoc.name,
            role: userDoc.role || 'user',
          };
          return next();
        }
      } else {
        // If it's explicitly a betterAuthToken but invalid/expired, we shouldn't fallback to JWT
        // because it will just throw "token failed" anyway. We can just return 401 here.
        if (!req.headers.authorization?.startsWith('Bearer')) {
          res.status(401).json({ success: false, message: 'Not authorized, session expired' });
          return;
        }
      }
    } catch (err) {
      console.error('Better Auth verification failed', err);
    }
  }

  // 2. Fallback to JWT (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { id: string };

      const user = await User.findById(decoded.id).select('-passwordHash');
      
      if (!user) {
         res.status(401).json({ success: false, message: 'Not authorized, user not found' });
         return;
      }
      
      const idStr = (user._id as any).toString();
      req.user = {
        _id: user._id,
        id: idStr,
        email: user.email,
        name: (user as any).name,
        role: user.role,
      };
      return next();
    } catch (error) {
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
      return;
    }
  }

  res.status(401).json({ success: false, message: 'Not authorized, no token' });
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized as an admin' });
  }
};
