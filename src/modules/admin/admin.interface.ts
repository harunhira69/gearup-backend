import { Role, UserStatus } from "../../../generated/prisma/enums";

export interface UpdateUserPayload  {
    status?:UserStatus;
    role?:Exclude<Role,"ADMIN">
}