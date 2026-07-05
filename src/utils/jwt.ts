import jwt, { JwtPayload,  SignOptions } from "jsonwebtoken"

const createToken = (payload:JwtPayload,secret:string,expiresIn:SignOptions)=>{
    const token = jwt.sign(payload,secret,
        {
        expiresIn 
    } as SignOptions
)

    return token

}

const verifyToken =(token:string,secret:string)=>{
    try {
    const validToken= jwt.verify(token,secret);
    return {
        success:true,
        data:validToken
    }
    } catch (error:any) {
        return {
            success:false,
            message:error.message
        }
    
    }

}

export const jwtUtils = {
    createToken,
    verifyToken
}