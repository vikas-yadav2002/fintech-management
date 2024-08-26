import express from 'express' ;
import cors from 'cors'
import appRouter from './routes/route';

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/v1', appRouter)


app.listen(3000 , ()=>{
    console.log('Server is running on port 3000');
})
