import "./App.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import { SettingsActions } from "BugBashPro/Actions/SettingsActions";
import * as AllBugBashesView_Async from "BugBashPro/Components/AllBugBashesView";
import { BugBashView } from "BugBashPro/Components/BugBashView";
import { BugBashViewPivotKeys, ChangelogMajorVersion, UrlActions } from "BugBashPro/Constants";
import { SettingsDataService } from "BugBashPro/DataServices/SettingsDataService";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { Badge } from "Common/Components/Badge";
import { Loading } from "Common/Components/Loading";
import { getAsyncLoadedComponent } from "Common/Components/Utilities/AsyncLoadedComponent";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { getHostNavigationService, navigate } from "Common/Utilities/Navigation";
import { Fabric } from "OfficeFabric/Fabric";
import { Link } from "OfficeFabric/Link";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { HostNavigationService } from "VSS/SDK/Services/Navigation";

export enum AppViewMode {
    All,
    New,
    Results,
    Edit,
    Charts,
    Details
}

export interface IAppState extends IBaseFluxComponentState {
    appViewMode: AppViewMode;
    bugBashId?: string;
    bugBashItemId?: string;
    userSettingsAvailable?: boolean;
    changeVersion?: string;
}

const AsyncAllBugBashView = getAsyncLoadedComponent(
    ["scripts/AllBugBashesView"],
    (m: typeof AllBugBashesView_Async) => m.AllBugBashesView,
    () => <Loading />);

export class App extends BaseFluxComponent<IBaseFluxComponentProps, IAppState> {
    private _navigationService: HostNavigationService;

    public componentDidMount() {
        super.componentDidMount();
        this._attachNavigate();
        SettingsActions.initializeUserSettings();
        this._initializeNewChangesMessage();
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this._detachNavigate();
    }

    public shouldComponentUpdate(_nextProps: Readonly<IBaseFluxComponentProps>, nextState: Readonly<IAppState>) {
        if (this.state.appViewMode !== nextState.appViewMode
            || this.state.bugBashId !== nextState.bugBashId
            || this.state.bugBashItemId !== nextState.bugBashItemId
            || this.state.userSettingsAvailable !== nextState.userSettingsAvailable
            || this.state.changeVersion !== nextState.changeVersion
            || this.state.loading !== nextState.loading) {

            return true;
        }

        return false;
    }

    public render(): JSX.Element {
        let view;

        if (this.state.appViewMode == null) {
            view = <Loading />;
        }
        else {
            switch (this.state.appViewMode) {
                case AppViewMode.All:
                    view = <AsyncAllBugBashView />;
                    break;
                case AppViewMode.New:
                case AppViewMode.Edit:
                    view = <BugBashView pivotKey={BugBashViewPivotKeys.Edit} bugBashId={this.state.bugBashId} />;
                    break;
                case AppViewMode.Results:
                    view = <BugBashView pivotKey={BugBashViewPivotKeys.Results} bugBashId={this.state.bugBashId} bugBashItemId={this.state.bugBashItemId} />;
                    break;
                case AppViewMode.Charts:
                    view = <BugBashView pivotKey={BugBashViewPivotKeys.Charts} bugBashId={this.state.bugBashId} />;
                    break;
                case AppViewMode.Details:
                    view = <BugBashView pivotKey={BugBashViewPivotKeys.Details} bugBashId={this.state.bugBashId} />;
                    break;
                default:
                    view = <Loading />;
            }
        }

        return (
            <Fabric className="fabric-container">
                {this._renderBadge()}
                {this.state.changeVersion &&
                    (
                        <MessageBar
                            className="changelog-message"
                            onDismiss={this._onDismissChangeLogMessage}
                            messageBarType={MessageBarType.info}
                        >
                            {`Extension upgraded to version ${this.state.changeVersion}.`}
                            <Link target="_blank" href="https://marketplace.visualstudio.com/items?itemName=mohitbagra.bugbashpro#changelog"> View the changelog.</Link>
                        </MessageBar>
                    )
                }
                {view}
            </Fabric>
        );
    }

    protected getInitialState(): IAppState {
        return {
            appViewMode: null,
            userSettingsAvailable: true
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.userSettingsStore];
    }

    protected getStoresState(): IAppState {
        return {
            userSettingsAvailable: StoresHub.userSettingsStore.isLoading() ? true : StoresHub.userSettingsStore.itemExists(VSS.getWebContext().user.email)
        } as IAppState;
    }

    private async _initializeNewChangesMessage() {
        const lastChangeVersion = await SettingsDataService.loadSetting("changeVersion", "", true);
        if (lastChangeVersion !== ChangelogMajorVersion) {
            this.setState({changeVersion: ChangelogMajorVersion});
        }
    }

    private _renderBadge(): JSX.Element {
        if (!this.state.userSettingsAvailable) {
            return (
                <Badge className="bugbash-badge" notificationCount={1}>
                    <div className="bugbash-badge-callout">
                        <div className="badge-callout-header">
                            Don't forget to set your associated team!!
                        </div>
                        <div className="badge-callout-inner">
                            <div>
                                You can set a team associated with you in the current project by clicking on "Settings" link in the Bug Bash home page.
                            </div>
                            <div>
                                If you have set a team associated with you, any bug bash item created by you will also count towards your team.
                            </div>
                            <div>
                                This will be reflected in the "Created By" chart in a Bug Bash.
                            </div>
                        </div>
                    </div>
                </Badge>
            );
        }

        return null;
    }

    private async _attachNavigate() {
        this._navigationService = await getHostNavigationService();
        this._navigationService.attachNavigate(null, this._onNavigate, true);
    }

    private _detachNavigate() {
        if (this._navigationService) {
            this._navigationService.detachNavigate(null, this._onNavigate);
        }
    }

    private _onDismissChangeLogMessage = () => {
        SettingsDataService.updateSetting("changeVersion", this.state.changeVersion, true);
        this.setState({changeVersion: null});
    }

    private _onNavigate = async () => {
        if (this._navigationService) {
            const state = await this._navigationService.getCurrentState();
            const view: string = state && state.view;

            if (state == null || (state.action == null && state.view == null)) {
                // if no view is provided, redirect to directory view
                navigate({ view: UrlActions.ACTION_ALL }, true);
                return;
            }
            else if (state.action && !state.view) {
                // replace _a with view parameter
                navigate({ view: state.action, id: state.id || null, itemId: state.itemId || null }, true);
                return;
            }

            switch (view.toLowerCase()) {
                case UrlActions.ACTION_DETAILS:
                    this.setState({ appViewMode: AppViewMode.Details, bugBashId: state.id || null, bugBashItemId: null });
                    break;
                case UrlActions.ACTION_RESULTS:
                    this.setState({ appViewMode: AppViewMode.Results, bugBashId: state.id || null, bugBashItemId: state.itemId || null });
                    break;
                case UrlActions.ACTION_EDIT:
                    this.setState({ appViewMode: AppViewMode.Edit, bugBashId: state.id || null, bugBashItemId: null });
                    break;
                case UrlActions.ACTION_CHARTS:
                    this.setState({ appViewMode: AppViewMode.Charts, bugBashId: state.id || null, bugBashItemId: null });
                    break;
                case UrlActions.ACTION_ALL:
                    this.setState({ appViewMode: AppViewMode.All, bugBashId: null, bugBashItemId: null });
                    break;
                default:
                    navigate({ view: UrlActions.ACTION_ALL }, true);
            }
        }
    }
}

export function init() {
    initializeIcons();

    const container = document.getElementById("ext-container");
    const spinner = document.getElementById("spinner");
    container.removeChild(spinner);

    ReactDOM.render(<App />, container);
}
