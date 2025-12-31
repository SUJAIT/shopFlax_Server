
import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";



const port = 8000

async function server() {

    try {

//   console.log(config.jwt_refresh_secret)

        await mongoose.connect(config.database_url as string);
 console.log("✅ MongoDB connected");
        app.listen(port, () => {
            console.log(`server is Running a ${port}`)
        })

    } catch (error) {
        console.error(error)
    }


}

server()