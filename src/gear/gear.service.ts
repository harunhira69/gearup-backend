import { prisma } from "../lib/prisma"
import { CreateCategoryPayload } from "./gear.interface"

const createCategoryDB = async(payload:CreateCategoryPayload)=>{
const category = await prisma.category.create({
    data:payload
});
return category
}
const getAllgearDB = async()=>{

}

export const gearService = {
    getAllgearDB,
    createCategoryDB

}