import express from 'express' ;
import { Response , Request } from 'express';
// import cors from 'cors'
import { Router } from 'express';
import authRouter from '../middleware/auth';
import { TransactionSchema } from '../Types/types';
import Prisma from '../db';
import { parse } from 'path';

const transferRouter = Router();

transferRouter.post('/send', authRouter, async (req: Request, res: Response) => {
    const userId = (req as any).user_id;
    const transferDetails = req.body;
    
    // Validate the transaction details
    const parsed = TransactionSchema.safeParse(transferDetails);
    if (!parsed.success) {
      return res.status(400).json({
        error : parsed.error,
      });
    }
  
    try {
      const { amount, toAccountId, fromAccountId, type } = transferDetails;
    
      // Start the transaction
      await Prisma.$transaction(async (prisma) => {
        // Validate sender's account
        const senderAccount = await prisma.account.findUnique({
          where: {
            id: fromAccountId,
          },
        });
  
        if (!senderAccount) {
          return res.status(400).json({
            message: 'Invalid sender account id',
          });
        }
  
        if (senderAccount.user_id !== userId) {
          return res.status(400).json({
            message: 'You are not the owner of the sender account',
          });
        }
        if(amount> senderAccount.balance){
            return res.status(400).json({
                message: 'Insufficient balance',
            })
        }
        // Validate receiver's account
        const receiverAccount = await prisma.account.findUnique({
          where: {
            id: toAccountId,
          },
        });
  
        if (!receiverAccount) {
          return res.status(400).json({
            message: 'Invalid receiver account id',
          });
        }
  
        // Perform the transfer: debit sender and credit receiver
        await prisma.account.update({
          where: { id: fromAccountId },
          data: { balance: { decrement: amount } },
        });
  
        await prisma.account.update({
          where: { id: toAccountId },
          data: { balance: { increment: amount } },
        });
  
        // Create the transaction record
        const newTransaction = await prisma.transaction.create({
          data: {
            amount,
            type,
            fromAccountId,
            toAccountId,
            
            status: 'completed',
          },
        });
  
        // Commit the transaction
        return res.status(200).json({
          message: 'Transfer successful',
          transaction: newTransaction,
        });
      });
    } catch (e) {
      return res.status(500).json({
        error: e,
      });
    }
  });
  

transferRouter.get('/alltransactions/:accountId' , authRouter ,  async ( req:Request , res:Response )=>{
    const userId = (req as any ).user_id;
   const { accountId } = req.params;
   console.log(accountId);
   if(!accountId){
   return res.status(400).json({
    message : "please give the account id"
   })
   }
   try{
    const existingAccount = await Prisma.account.findFirst({
        where:{
            id : Number(accountId)
        }
       })

    if(existingAccount?.user_id !== userId){
        return res.status(400).json({
            message: "you are not the owner of this account"
        })
    }
    const transactions = await Prisma.transaction.findMany({
        where:{
            fromAccountId : existingAccount?.id,
        }
    })
   
    return res.status(200).json({
      transactions,
    })

   }catch(e){
    return res.status(500).json({
        error: e,
    })
   }
  
})

export default transferRouter;
