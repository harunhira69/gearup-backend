import app from "./app"
import { prisma } from "./lib/prisma";
const PORT = 5000;

async function main (){
    try {
        await prisma.$connect()
        console.log("connect database successfully")
        app.listen(PORT,()=>{
     console.log(`Sever is running on port ${PORT}`)
        })
    } catch (error) {
        console.error("Error starting the server",error)
        await prisma.$disconnect()
        process.exit(1);
    }
}

main()