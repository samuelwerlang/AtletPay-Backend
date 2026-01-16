import { prisma } from "../lib/prisma.js"
//import { SaasPlanType } from "@prisma/client"




interface ISaasPlanInfo {
    name : string,
    price : number,
    maxplans? : number,
    maxstudents? : number,
    stripePriceId : string
 //   type : SaasPlanType
}
async function createSaasPlan(){}