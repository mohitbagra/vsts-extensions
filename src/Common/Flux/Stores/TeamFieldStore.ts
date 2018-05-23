import { TeamFieldActionsHub } from "Common/Flux/Actions/ActionsHub";
import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { TeamFieldValues } from "TFS/Work/Contracts";

export class TeamFieldStore extends BaseStore<IDictionaryStringTo<TeamFieldValues>, TeamFieldValues, string> {
    constructor() {
        super();
        this.items = {};
    }

    public getItem(teamId: string): TeamFieldValues {
         return this.items[teamId.toLowerCase()] || null;
    }

    public getKey(): string {
        return "TeamFieldStore";
    }

    protected initializeActionListeners() {
        TeamFieldActionsHub.InitializeTeamFieldItem.addListener((values: {teamId: string, teamFieldValues: TeamFieldValues}) => {
            if (values) {
                this.items[values.teamId.toLowerCase()] = values.teamFieldValues;
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: string): string {
        return key;
    }
}
