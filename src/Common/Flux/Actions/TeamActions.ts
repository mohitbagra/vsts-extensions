import { TeamActionsHub } from "Common/Flux/Actions/ActionsHub";
import { StoreFactory } from "Common/Flux/Stores/BaseStore";
import { TeamStore } from "Common/Flux/Stores/TeamStore";
import { localeIgnoreCaseComparer } from "Common/Utilities/String";
import { WebApiTeam } from "TFS/Core/Contracts";
import * as CoreClient from "TFS/Core/RestClient";
import * as VSS_Service from "VSS/Service";

export namespace TeamActions {
    const teamStore: TeamStore = StoreFactory.getInstance<TeamStore>(TeamStore);

    export async function initializeTeams() {
        if (teamStore.isLoaded()) {
            TeamActionsHub.InitializeTeams.invoke(null);
        } else if (!teamStore.isLoading()) {
            teamStore.setLoading(true);
            try {
                const teams = await getTeams();
                teams.sort((a: WebApiTeam, b: WebApiTeam) => localeIgnoreCaseComparer(a.name, b.name));
                TeamActionsHub.InitializeTeams.invoke(teams);
                teamStore.setLoading(false);
            } catch (e) {
                teamStore.setLoading(false);
                throw e.message;
            }
        }
    }

    async function getTeams(): Promise<WebApiTeam[]> {
        const teams: WebApiTeam[] = [];
        const top: number = 300;
        const client = await VSS_Service.getClient<CoreClient.CoreHttpClient4>(CoreClient.CoreHttpClient4);
        const project = VSS.getWebContext().project.id;

        const getTeamDelegate = async (skip: number) => {
            const result: WebApiTeam[] = await client.getTeams(project, top, skip);
            if (result.length > 0) {
                teams.push(...result);
            }
            if (result.length === top) {
                await getTeamDelegate(skip + top);
            }
            return;
        };

        await getTeamDelegate(0);
        return teams;
    }
}
