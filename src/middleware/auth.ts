import { NextFunction, Request, Response } from "express";
import { Role } from "../../generated/prisma/enums";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import config from "../config";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: Role;
      };
    }
  }
}
export const auth = (...requiredRoles: Role[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const token =
      req.cookies.accessToken ?  req.cookies.accessToken
      :
      req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1]
    
        : req.headers.authorization;

    if (!token) {
      throw new Error("You are not logged in. Please log in first.");
    }

    const verifyToken = jwtUtils.verifyToken(
      token,
      config.jwt_access_secret
    );

    if (!verifyToken.success) {
      throw new Error(verifyToken.message);
    }

    const { id, name, email, role } =
      verifyToken.data as JwtPayload;

    // Role Check
    if (
      requiredRoles.length > 0 &&
      !requiredRoles.includes(role)
    ) {
      throw new Error(
        "Forbidden. You don't have permission to access this resource."
      );
    }

    // User Exists?
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new Error("User not found. Please log in again.");
    }

    // Blocked User Check
    if (user.activeStatus === "BLOCKED") {
      throw new Error(
        "Your account has been blocked. Please contact support."
      );
    }

    req.user = {
      id,
      name,
      email,
      role,
    };

    next();
  });
};