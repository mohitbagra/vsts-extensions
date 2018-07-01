import "./SettingsPanel.scss";

import * as React from "react";

import { SettingsActions } from "BugBashPro/Actions/SettingsActions";
import { ErrorKeys } from "BugBashPro/Constants";
import { IBugBashSettings, IUserSettings } from "BugBashPro/Interfaces";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { InfoLabel } from "Common/Components/InfoLabel";
import { Loading } from "Common/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { ErrorMessageActions } from "Common/Flux/Actions/ErrorMessageActions";
import { GitRepoActions } from "Common/Flux/Actions/GitRepoActions";
import { TeamActions } from "Common/Flux/Actions/TeamActions";
import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { PrimaryButton } from "OfficeFabric/Button";
import { ComboBox, IComboBoxOption, IComboBoxProps } from "OfficeFabric/ComboBox";
import { Label } from "OfficeFabric/Label";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { WebApiTeam } from "TFS/Core/Contracts";
import { GitRepository } from "TFS/VersionControl/Contracts";

interface ISettingsPanelState extends IBaseFluxComponentState {
    origBugBashSettings: IBugBashSettings;
    newBugBashSettings: IBugBashSettings;
    origUserSettings: IUserSettings;
    newUserSettings: IUserSettings;
    gitRepos: IComboBoxOption[];
    teams: IComboBoxOption[];
    error?: string;
}

export class SettingsPanel extends BaseFluxComponent<IBaseFluxComponentProps, ISettingsPanelState> {
    public componentDidMount() {
        super.componentDidMount();
        SettingsActions.initializeBugBashSettings();
        SettingsActions.initializeUserSettings();
        TeamActions.initializeTeams();
        GitRepoActions.initializeGitRepos();
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this._dismissErrorMessage();
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        } else {
            return (
                <div className="settings-panel">
                    {this.state.error && (
                        <MessageBar className="message-panel" messageBarType={MessageBarType.error} onDismiss={this._dismissErrorMessage}>
                            {"Settings could not be saved due to an unknown error. Please refresh the page and try again."}
                        </MessageBar>
                    )}
                    <div className="settings-controls-container">
                        <Label className="settings-label">Project Settings</Label>
                        <div className="settings-control">
                            <InfoLabel label="Media Git Repo" info="Select a git repo to store media and attachments" />
                            <ComboBox
                                options={this.state.gitRepos}
                                onRenderList={this._onRenderCallout}
                                allowFreeform={false}
                                autoComplete="on"
                                selectedKey={this.state.newBugBashSettings.gitMediaRepo}
                                onChanged={this._onRepoChange}
                            />
                        </div>
                        <PrimaryButton className="save-button" disabled={!this._isSettingsDirty()} onClick={this._onSaveClick}>
                            Save
                        </PrimaryButton>
                    </div>

                    <div className="settings-controls-container">
                        <Label className="settings-label">User Settings</Label>
                        <div className="settings-control">
                            <InfoLabel label="Associated team" info="Select a team associated with you." />
                            <ComboBox
                                options={this.state.teams}
                                onRenderList={this._onRenderCallout}
                                allowFreeform={false}
                                autoComplete="on"
                                selectedKey={this.state.newUserSettings.associatedTeam}
                                onChanged={this._onTeamChange}
                            />
                        </div>
                        <PrimaryButton className="save-button" disabled={!this._isUserSettingsDirty()} onClick={this._onSaveUserSettingClick}>
                            Save
                        </PrimaryButton>
                    </div>
                </div>
            );
        }
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.bugBashSettingsStore, StoresHub.gitRepoStore, StoresHub.teamStore, StoresHub.userSettingsStore, StoresHub.errorMessageStore];
    }

    protected getInitialState(): ISettingsPanelState {
        return {
            loading: true
        } as ISettingsPanelState;
    }

    protected getStoresState(): ISettingsPanelState {
        const isLoading =
            StoresHub.bugBashSettingsStore.isLoading() || StoresHub.gitRepoStore.isLoading() || StoresHub.teamStore.isLoading() || StoresHub.userSettingsStore.isLoading();

        const bugBashSettings = StoresHub.bugBashSettingsStore.getAll();
        let userSetting = StoresHub.userSettingsStore.getItem(VSS.getWebContext().user.email);

        if (isLoading) {
            userSetting = null;
        } else {
            if (userSetting == null) {
                userSetting = {
                    id: VSS.getWebContext().user.email,
                    associatedTeam: null
                };
            }
        }

        let state = {
            newBugBashSettings: bugBashSettings ? { ...bugBashSettings } : null,
            origBugBashSettings: bugBashSettings ? { ...bugBashSettings } : null,
            newUserSettings: userSetting ? { ...userSetting } : null,
            origUserSettings: userSetting ? { ...userSetting } : null,
            loading: isLoading,
            error: StoresHub.errorMessageStore.getItem(ErrorKeys.BugBashSettingsError)
        } as ISettingsPanelState;

        if (StoresHub.teamStore.isLoaded() && !this.state.teams) {
            const emptyItem = [
                {
                    key: "",
                    text: "<No team>"
                }
            ];

            const teams: IComboBoxOption[] = emptyItem.concat(
                StoresHub.teamStore.getAll().map((t: WebApiTeam) => {
                    return {
                        key: t.id,
                        text: t.name
                    };
                })
            );

            state = { ...state, teams: teams } as ISettingsPanelState;
        }

        if (StoresHub.gitRepoStore.isLoaded() && !this.state.gitRepos) {
            const emptyItem = [
                {
                    key: "",
                    text: "<No repo>"
                }
            ];

            const repos: IComboBoxOption[] = emptyItem.concat(
                StoresHub.gitRepoStore.getAll().map((r: GitRepository) => {
                    return {
                        key: r.id,
                        text: r.name
                    };
                })
            );

            state = { ...state, gitRepos: repos } as ISettingsPanelState;
        }

        return state;
    }

    private _isSettingsDirty(): boolean {
        return this.state.newBugBashSettings.gitMediaRepo !== this.state.origBugBashSettings.gitMediaRepo;
    }

    private _isUserSettingsDirty(): boolean {
        return this.state.newUserSettings.associatedTeam !== this.state.origUserSettings.associatedTeam;
    }

    private _onRepoChange = (option?: IComboBoxOption) => {
        const newSettings = { ...this.state.newBugBashSettings };
        newSettings.gitMediaRepo = option.key as string;
        this.setState({ newBugBashSettings: newSettings } as ISettingsPanelState);
    };

    private _onTeamChange = (option?: IComboBoxOption) => {
        const newSettings = { ...this.state.newUserSettings };
        newSettings.associatedTeam = option.key as string;
        this.setState({ newUserSettings: newSettings } as ISettingsPanelState);
    };

    private _dismissErrorMessage = () => {
        ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashSettingsError);
    };

    private _onSaveClick = () => {
        if (this._isSettingsDirty()) {
            SettingsActions.updateBugBashSettings(this.state.newBugBashSettings);
        }
    };

    private _onSaveUserSettingClick = () => {
        if (this._isUserSettingsDirty()) {
            SettingsActions.updateUserSettings(this.state.newUserSettings);
        }
    };

    private _onRenderCallout = (props?: IComboBoxProps, defaultRender?: (props?: IComboBoxProps) => JSX.Element): JSX.Element => {
        return <div className="callout-container">{defaultRender(props)}</div>;
    };
}
