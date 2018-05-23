import "./App.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import { ChecklistActions } from "Checklist/Actions/ChecklistActions";
import * as ChecklistView_Async from "Checklist/Components/ChecklistView";
import { Loading } from "Common/Components/Loading";
import { getAsyncLoadedComponent } from "Common/Components/Utilities/AsyncLoadedComponent";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { ErrorMessageActions } from "Common/Flux/Actions/ErrorMessageActions";
import { getMarketplaceUrl, getWorkItemTypeSettingsUrl } from "Common/Utilities/UrlHelper";
import { getFormService } from "Common/Utilities/WorkItemFormHelpers";
import { IconButton } from "OfficeFabric/Button";
import { Fabric } from "OfficeFabric/Fabric";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { Pivot, PivotItem } from "OfficeFabric/Pivot";
import { DirectionalHint, TooltipDelay, TooltipHost } from "OfficeFabric/Tooltip";
import { TeamProject } from "TFS/Core/Contracts";
import * as CoreClient from "TFS/Core/RestClient";
import {
    IWorkItemChangedArgs, IWorkItemLoadedArgs, IWorkItemNotificationListener
} from "TFS/WorkItemTracking/ExtensionContracts";

const AsyncChecklistView = getAsyncLoadedComponent(
    ["scripts/ChecklistView"],
    (m: typeof ChecklistView_Async) => m.ChecklistView,
    () => <Loading />);

interface IChecklistAppState extends IBaseFluxComponentState {
    workItemId: number;
}

export class ChecklistApp extends BaseFluxComponent<IBaseFluxComponentProps, IChecklistAppState> {
    private _project: TeamProject;
    private _workItemTypeName: string;

    public componentDidMount() {
        super.componentDidMount();

        VSS.register(VSS.getContribution().id, {
            onLoaded: (args: IWorkItemLoadedArgs) => {
                this._onWorkItemLoad(args.id, args.isNew);
            },
            onUnloaded: (_args: IWorkItemChangedArgs) => {
                ErrorMessageActions.dismissErrorMessage("ChecklistError");
                this.setState({workItemId: null});
            },
            onSaved: (args: IWorkItemChangedArgs) => {
                if (args.id !== this.state.workItemId) {
                    this.setState({workItemId: args.id});
                }
            },
            onRefreshed: (_args: IWorkItemChangedArgs) => {
                this._refreshChecklist(this.state.workItemId);
            }
        } as IWorkItemNotificationListener);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        VSS.unregister(VSS.getContribution().id);
    }

    public render(): JSX.Element {
        const {workItemId} = this.state;

        if (workItemId == null) {
            return <Loading />;
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
                                    href={this._project ? getWorkItemTypeSettingsUrl(this._workItemTypeName, this._project.name) : undefined}
                                    target="_blank"
                                />
                            </TooltipHost>
                        </div>
                        <Pivot initialSelectedIndex={0}>
                            <PivotItem linkText="Shared" itemKey="shared">
                                <AsyncChecklistView
                                    workItemId={workItemId}
                                    workItemType={this._workItemTypeName}
                                    projectId={this._project.id}
                                    key="shared"
                                    isPersonal={false}
                                />
                            </PivotItem>
                            <PivotItem linkText="Personal" itemKey="personal">
                                <AsyncChecklistView
                                    workItemId={workItemId}
                                    workItemType={this._workItemTypeName}
                                    projectId={this._project.id}
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
            workItemId: null
        };
    }

    private _refreshChecklist(workItemId: number) {
        if (workItemId != null && workItemId !== 0 && this._project) {
            ChecklistActions.refreshChecklists(workItemId, this._workItemTypeName, this._project.id);
        }
    }

    private _onWorkItemLoad = async (workItemId: number, isNew: boolean) => {
        if (!this._project) {
            const formService = await getFormService();
            const fieldValues = await formService.getFieldValues(["System.WorkItemType", "System.TeamProject"]);
            this._workItemTypeName = fieldValues["System.WorkItemType"] as string;
            const projectName = fieldValues["System.TeamProject"] as string;
            this._project = await CoreClient.getClient().getProject(projectName);
        }

        this.setState({workItemId: isNew ? 0 : workItemId});
    }

    private _onRefreshClick = () => {
        this._refreshChecklist(this.state.workItemId);
    }
}

export function init() {
    initializeIcons();
    ReactDOM.render(<ChecklistApp />, document.getElementById("ext-container"));
}
