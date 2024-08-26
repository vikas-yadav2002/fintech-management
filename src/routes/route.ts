import express from 'express' ;
// import cors from 'cors'
import { Router } from 'express';
import userRouter from '../controller/user';
import transferRouter from '../controller/transfer';

const appRouter = Router();

appRouter.use('/user' , userRouter);
appRouter.use('/transfer' , transferRouter);



export default appRouter;


