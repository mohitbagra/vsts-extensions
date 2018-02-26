import * as React from "react";

import {
    BaseFluxComponent, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { ISimpleComboProps, SimpleCombo } from "Library/Components/VssCombo/SimpleCombo";
import { TeamActions } from "Library/Flux/Actions/TeamActions";
import { BaseStore, StoreFactory } from "Library/Flux/Stores/BaseStore";
import { TeamStore } from "Library/Flux/Stores/TeamStore";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { WebApiTeam } from "TFS/Core/Contracts";

export interface ITeamPickerState extends IBaseFluxComponentState {
    allTeams?: WebApiTeam[];
}

export class TeamPicker extends BaseFluxComponent<ISimpleComboProps<WebApiTeam>, ITeamPickerState> {
    private _teamStore = StoreFactory.getInstance<TeamStore>(TeamStore);

    public componentDidMount() {
        super.componentDidMount();
        if (this._teamStore.isLoaded()) {
            this.setState({
                allTeams: this._teamStore.getAll()
            });
        }
        else {
            TeamActions.initializeTeams();
        }
    }

    public render(): JSX.Element {
        if (!this.state.allTeams) {
            return <Spinner size={SpinnerSize.large} />;
        }

        const props = {
            ...this.props,
            className: css("team-picker", this.props.className),
            getItemText: (team: WebApiTeam) => team.name,
            options: this.state.allTeams,
            limitedToAllowedOptions: true
        } as ISimpleComboProps<WebApiTeam>;

        return <SimpleCombo {...props} />;
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [this._teamStore];
    }

    protected getStoresState(): ITeamPickerState {
        return {
            allTeams: this._teamStore.getAll()
        };
    }
}
