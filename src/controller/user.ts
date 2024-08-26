import express from 'express';
import {Response, Request} from 'express';
import jwt from 'jsonwebtoken'
import {Router} from 'express';
import {UserSchema, User, AccountSchema} from '../Types/types';
import Prisma from '../db';
import authRouter from '../middleware/auth';


const userRouter = Router();
const secretKey = process.env.JWT_SECRET as string;
if (! secretKey) {
    throw new Error('JWT_SECRET environment variable is not set');
}

userRouter.post('/signup', async (req : Request, res : Response) => {
    try {
        const userDetails = req.body;

        // Validate the user details with UserSchema
        const response = UserSchema.safeParse(userDetails);
        if (! response.success) {
            return res.status(400).json(response.error);
        }

        const {username, password, firstName, lastName} = userDetails;
        const existingUser = await Prisma.user.findUnique({
            where: {
                username: username
            }
        });

        // Check if user already exists
        if (existingUser) {
            return res.status(400).json({error: 'Username already exists'});
        }
        // Create a new user with an empty account field
        const newUser = await Prisma.user.create({
            data: {
                username,
                firstName,
                lastName,
                password, // has to hash the passwod for more security using bcrypt
                accounts: {
                    connect: []
                }, // Initialize with an empty array
            }
        });
        const paylod = {
            username: newUser.username,
            id: newUser.id
        }

        const token = jwt.sign(paylod, secretKey)

        // Respond with the created user
        res.status(201).json({user: newUser, token: token});
    } catch (error) { // Handle any errors that occur during user creation
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});
userRouter.post('/signin', async (req : Request, res : Response) => {
    const {username, password} = req.body;
    if (!username || !password) {
        return res.status(400).json({error: 'Please provide both username and password'})
    }
    try {


        const user = await Prisma.user.findUnique({
            where: {
                username,
                password
            }
        })

        if (! user) {
            return res.status(401).json({error: 'Invalid credentials'});
        }

        // Define payload
        const payload = {
            username,
            id: user.id ?? 1, // Default to 1 if user.id is null or undefined
        };
        const token = jwt.sign(payload, secretKey);
        res.status(200).json({user: user, token: token})
    } catch (e) {
        res.status(500).json({error: e})
    }

})
userRouter.get('/detail', authRouter, async (req : Request, res : Response) => {

    const userId = (req as any).user_id;
    try {
        const user = await Prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {
                accounts: true
            }
        })

        if (! user) {
            return res.status(404).json({error: 'User not found'})
        } else {
            return res.status(200).json({user: user})
        }

    } catch (e) {
        res.status(500).json({error: e})
    }


})

userRouter.post('/createAccount', authRouter, async (req : Request, res : Response) => { // const userId:number = 3;
    const userId = (req as any).user_id;

    if (typeof userId !== 'number') {
        return res.status(400).json({
            error: {
                message: "User ID is missing or invalid."
            }
        });
    }
    const accountDetails = req.body;
    accountDetails.user_id = userId;
    const parsed = AccountSchema.safeParse(accountDetails);
    if (! parsed.success) {
        return res.status(400).json({error: parsed.error})
    } else {
        try {
            const {type, balance} = accountDetails;

            const newAccount = await Prisma.account.create({
                data: {
                    user_id: userId,
                    type: type,
                    balance: balance
                }
            })

            await Prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    accounts: {
                        connect: {
                            id: newAccount.id
                        }
                    }
                }
            })

            res.status(200).json({newAccount})


        } catch (e) {
            res.status(500).json({error: e})
        }
    }
})

userRouter.get('/balance/:accountId', authRouter, async (req: Request, res: Response) => {
    const userId = (req as any).user_id; // Extract user ID from the request
    const { accountId } = req.params; // Extract account ID from the URL parameters
  
    // Ensure accountId is present and valid
    if (!accountId) {
      return res.status(400).json({
        message: "Provide the account id",
      });
    }
  
    try {
      // Fetch the account based on accountId
      const account = await Prisma.account.findUnique({
        where: {
          id: Number(accountId),
        },
      });
  
      if (!account) {
        return res.status(404).json({
          error: "There is no account associated with this account id",
        });
      }
  
      // Check if the account belongs to the user
      if (account.user_id !== userId) {
        return res.status(403).json({
          error: "This account is not associated with this user",
        });
      }
  
      // Respond with the account balance
      return res.status(200).json({
        balance: account.balance,
      });
    } catch (e) {
      return res.status(500).json({
        error: e,
      });
    }
  });
  

export default userRouter;
