import express from 'express' ;
import { Response , Request } from 'express';
import jwt from 'jsonwebtoken'
import { Router } from 'express';
import { UserSchema , User } from '../Types/types';
import Prisma from '../db';
import authRouter from '../middleware/auth';




const userRouter = Router();
const secretKey = process.env.JWT_SECRET as string;
if (!secretKey) {
    throw new Error('JWT_SECRET environment variable is not set');
}

userRouter.post('/signup', async (req: Request, res: Response) => {
    try {
        const userDetails = req.body;

        // Validate the user details with UserSchema
        const response = UserSchema.safeParse(userDetails);
        if (!response.success) {
            return res.status(400).json(response.error);
        }

        const { username, password, firstName, lastName } = userDetails;
        const existingUser = await Prisma.user.findUnique({
            where: {
                username: username,
            },
        });

        // Check if user already exists
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        // Create a new user with an empty account field
        const newUser = await Prisma.user.create({
            data: {
                username,
                firstName,
                lastName,
                password, // has to hash the passwod for more security using bcrypt
                accounts :{
                    connect : []
                }, // Initialize with an empty array
            },
        });
        const paylod = {
            username: newUser.username,
            id : newUser.id
        }

        const token = jwt.sign(paylod , secretKey)

        // Respond with the created user
        res.status(201).json({
            user : newUser,
            token : token
        });
    } catch (error) {
        // Handle any errors that occur during user creation
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
userRouter.post('/signin' , async (req:Request ,res:Response )=>{
   const {username , password } = req.body;
   if(!username || !password ){
    return res.status(400).json({error : 'Please provide both username and password'})
   } try{

   
   const user = await Prisma.user.findUnique({
    where:{
        username ,
        password
    }
   })
  
   if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
}

// Define payload
const payload = {
    username,
    id: user.id ?? 1, // Default to 1 if user.id is null or undefined
};
 const token = jwt.sign(payload, secretKey);
 res.status(200).json({
    user: user,
    token: token
 })
   } catch(e){
     res.status(500).json({
        error : e
     })
   }

})
userRouter.get('/detail' , authRouter , async  (req:Request ,res:Response )=>{

    const userId = (req as any).user_id;
  try{
    const user = await Prisma.user.findUnique({
        where:{
            id : userId
        }
    })
  
  if(!user){
    return res.status(404).json({error : 'User not found'})
  }
  else{
    return res.status(200).json({
        user : user
    })
  }
  
  }catch(e){
    res.status(500).json({
        error : e})
  }

    
})

export default userRouter;
