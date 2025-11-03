import express, { Request, Response } from "express"
import router from "./app/routes/router";




const app = express();

//middleware ata use route k bola dai ja jeson data dila ta resived koro..
app.use(express.json())
app.use("/", router)
//ata akta meddlware ata server runn hossa tar respons ta pattassa apadoto
app.get('/api',(req:Request,res:Response)=>{
    res.send({
        status:true,
        message:"The Server Running Port 5000"
        })
})


export default app;