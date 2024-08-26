import express from 'express' ;
import { Response , Request } from 'express';
// import cors from 'cors'
import { Router } from 'express';
import authRouter from '../middleware/auth';

const transferRouter = Router();

transferRouter.post('/transfer' , authRouter , (res:Response , req:Request)=>{
       



    res.json({
   "message" : " signup page called"
    })
})

transferRouter.get('/balance' , (res:Response , req:Request)=>{
    res.json({
   "message" : " deatial page called"
    })
})

export default transferRouter;
