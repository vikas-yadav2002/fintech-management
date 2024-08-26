import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            user_id?: number; // or string, depending on your use case
        }
    }
}
