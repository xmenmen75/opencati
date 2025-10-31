import { UserTeam } from "@prisma/client";

export function getTeamColor(team: UserTeam): string {
    if(team === UserTeam.EVEN){
        return "#4F726C"
    }else {
        return "#9A8A9F"
    }
}