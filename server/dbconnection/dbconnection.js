import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config();
const connectDB= async ()=>{
    try{  
        await mongoose.connect(process.env.MONGO_URI)
        console.log("DataBase have been succesfully Connected")

    }catch(error){
        console.log("error:",error)
        console.log("DataBase have Disconnected ,Please check the errors.")        
    }
}
export default connectDB;