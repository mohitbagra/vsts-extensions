import "./App.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import { ChecklistActions } from "Checklist/Actions/ChecklistActions";
import * as ChecklistView_Async from "Checklist/Components/ChecklistView";
import { Loading } from "Library/Components/Loading";
import { getAsyncLoadedComponent } from "Library/Components/Utilities/AsyncLoadedComponent";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { ErrorMessageActions } from "Library/Flux/Actions/ErrorMessageActions";
import { getMarketplaceUrl, getWorkItemTypeSettingsUrl } from "Library/Utilities/UrlHelper";
import { getWorkItemProject, getWorkItemType } from "Library/Utilities/WorkItemFormHelpers";
import { IconButton } from "OfficeFabric/Button";
import { Fabric } from "OfficeFabric/Fabric";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { Pivot, PivotItem } from "OfficeFabric/Pivot";
import { DirectionalHint, TooltipDelay, TooltipHost } from "OfficeFabric/Tooltip";
import { autobind } from "OfficeFabric/Utilities";
import * as WitExtensionContracts from "TFS/WorkItemTracking/ExtensionContracts";

const AsyncChecklistView = getAsyncLoadedComponent(
    ["scripts/ChecklistView"],
    (m: typeof ChecklistView_Async) => m.ChecklistView,
    () => <Loading />);

interface IChecklistAppState extends IBaseFluxComponentState {
    workItemId: number;
    workItemType: string;
    projectName: string;
}

export class ChecklistApp extends BaseFluxComponent<IBaseFluxComponentProps, IChecklistAppState> {
    public componentDidMount() {
        super.componentDidMount();

        VSS.register(VSS.getContribution().id, {
            onLoaded: (args: WitExtensionContracts.IWorkItemLoadedArgs) => {
                this._onWorkItemLoad(args.id, args.isNew);
            },
            onUnloaded: (_args: WitExtensionContracts.IWorkItemChangedArgs) => {
                ErrorMessageActions.dismissErrorMessage("ChecklistError");
                this.setState({workItemId: null, workItemType: null, projectName: null});
            },
            onSaved: (args: WitExtensionContracts.IWorkItemChangedArgs) => {
                if (args.id !== this.state.workItemId) {
                    this.setState({workItemId: args.id});
                }
            },
            onRefreshed: (_args: WitExtensionContracts.IWorkItemChangedArgs) => {
                this._refreshChecklist(this.state.workItemId);
            }
        } as WitExtensionContracts.IWorkItemNotificationListener);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        VSS.unregister(VSS.getContribution().id);
    }

    public render(): JSX.Element {
        const {workItemId} = this.state;

        if (workItemId == null) {
            return null;
        }
        else if (workItemId === 0) {
            return (
                <Fabric className="fabric-container">
                    <MessageBar messageBarType={MessageBarType.info}>
                        You need to save the workitem before working with checklist.
                    </MessageBar>
                </Fabric>
            );
        }
        else {
            return (
                <Fabric className="fabric-container">
                    <div className="container">
                        <div className="command-bar">
                            <TooltipHost
                                content={"How to use the extension"}
                                delay={TooltipDelay.medium}
                                directionalHint={DirectionalHint.bottomLeftEdge}
                            >
                                <IconButton
                                    className="info-button command-item"
                                    iconProps={{
                                        iconName: "InfoSolid"
                                    }}
                                    href={getMarketplaceUrl()}
                                    target="_blank"
                                />
                            </TooltipHost>
                            <TooltipHost
                                content={"Refresh"}
                                delay={TooltipDelay.medium}
                                directionalHint={DirectionalHint.bottomRightEdge}
                            >
                                <IconButton
                                    className="command-item"
                                    iconProps={{iconName: "Refresh"}}
                                    onClick={this._onRefreshClick}
                                />
                            </TooltipHost>
                            <TooltipHost
                                content={"Settings"}
                                delay={TooltipDelay.medium}
                                directionalHint={DirectionalHint.bottomRightEdge}
                            >
                                <IconButton
                                    className="command-item"
                                    iconProps={{iconName: "Settings"}}
                                    href={getWorkItemTypeSettingsUrl(this.state.workItemType, this.state.projectName)}
                                    target="_blank"
                                />
                            </TooltipHost>
                        </div>
                        <Pivot initialSelectedIndex={0}>
                            <PivotItem linkText="Shared" itemKey="shared">
                                <AsyncChecklistView
                                    workItemId={workItemId}
                                    key="shared"
                                    isPersonal={false}
                                />
                            </PivotItem>
                            <PivotItem linkText="Personal" itemKey="personal">
                                <AsyncChecklistView
                                    workItemId={workItemId}
                                    key="personal"
                                    isPersonal={true}
                                />
                            </PivotItem>
                        </Pivot>
                    </div>
                </Fabric>
            );
        }
    }

    protected initializeState() {
        this.state = this._getFreshState();
    }

    private _getFreshState(): IChecklistAppState {
        return {
            workItemId: null,
            workItemType: null,
            projectName: null
        };
    }

    @autobind
    private async _onWorkItemLoad(workItemId: number, isNew: boolean) {
        const workItemType = await getWorkItemType();
        const projectName = await getWorkItemProject();
        this.setState({workItemId: isNew ? 0 : workItemId, projectName: projectName, workItemType: workItemType});
    }

    @autobind
    private _onRefreshClick() {
        this._refreshChecklist(this.state.workItemId);
    }

    private _refreshChecklist(workItemId: number) {
        if (workItemId != null && workItemId !== 0) {
            ChecklistActions.refreshChecklist(workItemId);
        }
    }
}

export function init() {
    initializeIcons();
    ReactDOM.render(<ChecklistApp />, document.getElementById("ext-container"));
}
