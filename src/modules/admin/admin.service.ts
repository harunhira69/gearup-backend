import { Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma"
import { createError } from "../../utils/createError";
import { UpdateUserPayload } from "./admin.interface";
import httpStatus from "http-status"
const getAllUsersFromDB = async()=>{
    const user = await prisma.$transaction(async(tx)=>{

        const result = await tx.user.findMany({
            orderBy:{
                createdAt:"desc"
            },
            select:{
                id:true,
                name:true,
                email:true,
                role:true,
                status:true,
                phone:true,
                address:true,
                imageUrl:true,
                stripeCustomerId:true,
                createdAt:true,
                updatedAt:true,
            },
        });
        return result

    
    })

    return user;

}

const updateUserIntoDB = async(
    userId:string,
    adminId:string,
    payload:UpdateUserPayload
)=>{

    const result = await prisma.$transaction(async(tx)=>{
const user = await tx.user.findUnique({
    where:{
        id:userId
    },
    select:{
        id:true,
        role:true,
        status:true
    }
})


if(!user){
    throw createError("User Not Found",httpStatus.NOT_FOUND,{
        filed:"id",
        value:userId
    })
}



    if (user.role === Role.ADMIN) {
      throw createError(
        "Admin user cannot be updated from this endpoint",
        httpStatus.FORBIDDEN,
        {
          userId,
          role: user.role,
        }
      );
    }



        if (userId === adminId && payload.status === UserStatus.SUSPENDED) {
      throw createError(
        "Admin cannot suspend own account",
        httpStatus.BAD_REQUEST,
        {
          userId,
          requestedStatus: payload.status,
        }
      );
    }


        if (payload.role && (payload.role as Role) === Role.ADMIN) {
      throw createError(
        "Admin role cannot be assigned from this endpoint",
        httpStatus.FORBIDDEN,
        {
          requestedRole: payload.role,
        }
      );
    }


        const updatedUser = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(payload.status && {
          status: payload.status,
        }),
        ...(payload.role && {
          role: payload.role,
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        address: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });


    return updatedUser;


    })
return result

}



const getAllGearFromDB = async()=>{
    const gearItem = await prisma.$transaction(async(tx)=>{
        const result = await tx.gearItem.findMany({
            orderBy:{
                createdAt:"desc"
            },
           include:{
            category:true,
            provider:{
                select:{
                    id: true,
            name: true,
            email: true,
            role: true,
            status: true,
                },
            },
           },
        })


        return result
    })

    return gearItem

}


const getAllRentalsFromDB = async()=>{
const rentals = await prisma.$transaction(async (tx) => {
    const result = await tx.rentalOrder.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
        items: {
          include: {
            gearItem: {
              include: {
                category: true,
                provider: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        payment: true,
        reviews: true,
      },
    });

    return result;
  });

  return rentals;
}

export const adminService = {
    getAllUsersFromDB,
    updateUserIntoDB,
    getAllGearFromDB,
    getAllRentalsFromDB
}