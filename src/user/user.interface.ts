import { Role, UserStatus } from "../../generated/prisma/enums";

export interface RegisterUser {
    name: string;
    email: string;
    password: string;
    profilePhoto?: string;
    role?: Role;
    status?: UserStatus;
}
