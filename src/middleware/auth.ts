import express, { NextFunction } from 'express' ;
import { Response , Request } from 'express';
import jwt from 'jsonwebtoken'
import { Router } from 'express';
import { UserSchema , User } from '../Types/types';
import Prisma from '../db';


const secretKey = process.env.JWT_SECRET as string;
if (!secretKey) {
    throw new Error('JWT_SECRET environment variable is not set');
}

const authRouter = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('authorization');
    if (!token) {
        return res.status(401).send({ message: 'Access denied' });
    }

    try {
        const decoded = jwt.verify(token, secretKey) as { id: number }; // Cast to expected type

        // Ensure decoded contains the 'id' field
        if (decoded && decoded.id) {
           (req as any).user_id = decoded.id; // TypeScript should be aware of req.user_id
            next(); // Call next middleware if authentication is successful
        } else {
            return res.status(401).send({ message: 'Access denied' });
        }
    } catch (error) {
        console.error('JWT verification error:', error);
        return res.status(401).send({ message: 'Access denied' });
    }
};


export default authRouter;
