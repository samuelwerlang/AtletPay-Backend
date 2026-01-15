import { prisma } from "../lib/prisma.js"

interface IPlanInfo {
    name : string,
    price : number,
    description : string,
    durationInWeeks : string,
    sessionsPerWeek : string,
    personalId : string,
    studentPlan : string[]
}

async function createPlanService(planInfo : IPlanInfo) {

}

export default createPlanService