import { cookies } from "next/headers"; import { SignJWT,jwtVerify } from "jose";
const secret=new TextEncoder().encode(process.env.AUTH_SECRET||"dev-secret"); const COOKIE="tiffin_session";
export async function createSession(userId:string,role:"OWNER"|"CUSTOMER"){const token=await new SignJWT({userId,role}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(secret);(await cookies()).set(COOKIE,token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:604800});}
export async function getSession(){const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;try{const {payload}=await jwtVerify(token,secret);if(typeof payload.userId!=="string")return null;return {userId:payload.userId,role:payload.role==="CUSTOMER"?"CUSTOMER" as const:"OWNER" as const};}catch{return null}}
export async function destroySession(){(await cookies()).delete(COOKIE)}
