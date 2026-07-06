import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { GearFilterQuery } from "./gear.interface"

const getAllGearFromDB = async(query:GearFilterQuery)=>{
const {category,price,brand} = query;

const andConditions:Prisma.GearItemWhereInput[] = [];

if(category){
    andConditions.push({
        OR:[
            {
                categoryId:category
            },
            {
                category:{
                    name:{
                        contains:category,
                        mode:"insensitive"
                    },
                },
            },
        ],
    })
}

if (brand){
    andConditions.push({
        brand:{
            contains:brand,
            mode:"insensitive"
        }
    })
}

if(price){
    const maxPrice = Number(price);

    if(Number.isNaN(maxPrice)){
        throw new Error("Price must be a Valid number");
        
    }

    andConditions.push({
    pricePerDay:{
        lte:maxPrice
    }
})
}

const whereCondition : Prisma.GearItemWhereInput = andConditions.length>0 ? {AND:andConditions}:{};

const gear = await prisma.gearItem.findMany({
    where:whereCondition,
    orderBy:{
        createdAt:"desc"
    },
    include:{
        category:true,
    }
})

return gear


}

const getSingleGearFromDB = ()=>{

}

export const  gearService  = {
    getAllGearFromDB,
    getSingleGearFromDB

}