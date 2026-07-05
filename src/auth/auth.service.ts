import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { Payload } from "./auth.interface"
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { SignOptions } from "jsonwebtoken";

const loginUserDB = async(payload:Payload)=>{
    const {email,password} = payload;
    const user = await prisma.user.findUniqueOrThrow({
        where:{
            email
        },
        include:{
            profile:true
        }
    })

   const matchPassword = await bcrypt.compare(password,user.password);

   if(!matchPassword){
    throw new Error("Password is incorrect");
    
   }

 const jwtPayload = {
    id:user.id,
    name:user.name,
    email:user.email,
    role:user.role,
    status:user.status
 }

 const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expiry as SignOptions
    
 )

 const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expiry as SignOptions
 )

 return {user,accessToken,refreshToken}

}

const getUserDB = async(userId:string)=>{
const user = await prisma.user.findUniqueOrThrow({
    where:{
        id:userId
    },
    omit:{
        password:true
    },
    include:{
        profile:true
    }
});

if(!user){
    throw new Error("User Not Found");
    
}

return user


}

const refreshToken = async(refreshToken:string)=>{

const verifyRefreshToken = jwtUtils.verifyToken(refreshToken,config.jwt_refresh_secret)

if(!verifyRefreshToken.success){
    throw new Error(verifyRefreshToken.message);
    
}

const {id} = verifyRefreshToken.data as JwtPayload;


const user = await prisma.user.findUniqueOrThrow({
    where:{
        id
    }

})

if(user. status==="SUSPENDED"){
    throw new Error("User is Suspended");
    
}

const jwtPayload = {
    id,
    name:user.name,
    email:user.email,
    role:user.role,

}

const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expiry as SignOptions
);

return {accessToken}
}

export const authService = {
    loginUserDB,
    getUserDB,
    refreshToken
}