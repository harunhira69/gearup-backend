
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { createError, createValidationError } from "../../utils/createError";
import { GearFilterQuery } from "./gear.interface";
import httpStatus from "http-status"

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
      throw createValidationError([
        {
            field:"price",
            message:"Price must be a valid number"
        }
      ])
        
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
        provider:{
            select:{
                id:true,
                name:true,
                email:true,
                role:true,
                status:true,
            },
        },
    },
});

return gear


};

const getSingleGearFromDB = (gearId:string)=>{
const gear = prisma.gearItem.findUnique({
    where:{
        id:gearId
    },
    include:{
        category:true,
        provider:{
            select:{
                id:true,
                name:true,
                email:true,
                role:true,
                status:true
            },
        },
    },
});

if(!gear){
    throw createError("Gear Item Not Found",httpStatus.NOT_FOUND,{
        field:"id",
        value:gearId,
    });
}

return gear;

};

export const  gearService  = {
    getAllGearFromDB,
    getSingleGearFromDB

}