import "./SettingsApp.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { initializeIcons } from "@uifabric/icons";
import { WorkItemTypeView } from "Checklist/Components/Settings/WorkItemTypeView";
import { StoresHub } from "Checklist/Stores/StoresHub";
import { Loading } from "Library/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { WorkItemTypeActions } from "Library/Flux/Actions/WorkItemTypeActions";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { navigate } from "Library/Utilities/Navigation";
import { getMarketplaceUrl, getWorkItemTypeSettingsUrl } from "Library/Utilities/UrlHelper";
import { IconButton } from "OfficeFabric/Button";
import { Fabric } from "OfficeFabric/Fabric";
import { INavLink, Nav } from "OfficeFabric/Nav";
import { DirectionalHint, TooltipDelay, TooltipHost } from "OfficeFabric/Tooltip";
import { autobind } from "OfficeFabric/Utilities";
import { HostNavigationService } from "VSS/SDK/Services/Navigation";

export interface IAppState extends IBaseFluxComponentState {
    selectedWit?: string;
}

export class SettingsApp extends BaseFluxComponent<IBaseFluxComponentProps, IAppState> {
    private _navigationService: HostNavigationService;

    public componentDidMount() {
        super.componentDidMount();

        this._attachNavigate();
        WorkItemTypeActions.initializeWorkItemTypes();
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this._detachNavigate();
    }

    public render(): JSX.Element {
        return (
            <Fabric className="fabric-container">
                {this.state.loading && <Loading />}
                {!this.state.loading &&
                    <div className="container">
                        <Nav
                            className="workitemtype-selector-nav"
                            groups={[
                                {
                                    links: this._getWITNavGroups()
                                }
                            ]}
                            onLinkClick={this._onNavLinkClick}
                            selectedKey={this.state.selectedWit}
                        />

                        <div className="workitemtype-container">
                            <WorkItemTypeView
                                workItemType={this.state.selectedWit}
                            />
                        </div>
                    </div>
                }
                {!this.state.loading &&
                    <div className="info-button-contaier">
                        <TooltipHost
                            content={"How to use the extension"}
                            delay={TooltipDelay.medium}
                            directionalHint={DirectionalHint.bottomLeftEdge}
                        >
                            <IconButton
                                className="info-button"
                                iconProps={{
                                    iconName: "InfoSolid"
                                }}
                                href={getMarketplaceUrl()}
                                target="_blank"
                            />
                        </TooltipHost>
                    </div>
                }
            </Fabric>
        );
    }

    protected initializeState() {
        this.state = {
            loading: true
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.workItemTypeStore];
    }

    protected getStoresState(): IAppState {
        const workItemTypes = StoresHub.workItemTypeStore.getAll();
        let newState = {
            loading: StoresHub.workItemTypeStore.isLoading()
        } as IAppState;

        if (workItemTypes) {
            if (!this.state.selectedWit) {
                // if no wit is selected, route to the 1st wit
                navigate({ witName: workItemTypes[0].name }, true, false, null, true);
                newState = {...newState, selectedWit: workItemTypes[0].name};
            }
            else {
                // check the correct witName for current selected wit
                const wit = StoresHub.workItemTypeStore.getItem(this.state.selectedWit);
                if (!wit) {
                    // if its an invalid wit, route to the 1st workitemtype page
                    navigate({ witName: workItemTypes[0].name }, true, false, null, true);
                    newState = {...newState, selectedWit: workItemTypes[0].name};
                }
                else {
                    newState = {...newState, selectedWit: wit.name};
                }
            }
        }

        return newState;
    }

    @autobind
    private _onNavLinkClick(e: React.MouseEvent<HTMLElement>, link: INavLink) {
        if (!e.ctrlKey) {
            e.preventDefault();
            navigate({ witName: link.key });
        }
    }

    private async _attachNavigate() {
        this._navigationService = await VSS.getService(VSS.ServiceIds.Navigation) as HostNavigationService;
        this._navigationService.attachNavigate(null, this._onNavigate, true);
    }

    private _detachNavigate() {
        if (this._navigationService) {
            this._navigationService.detachNavigate(null, this._onNavigate);
        }
    }

    @autobind
    private async _onNavigate() {
        if (this._navigationService) {
            const workItemTypes = StoresHub.workItemTypeStore.getAll();
            const state = await this._navigationService.getCurrentState();
            let witName = state && state.witName;

            if (witName && workItemTypes) {
                // if wit store is loaded, check the store for witName
                // if it doesnt exist in store, get the 1st work item type from store.
                const wit = StoresHub.workItemTypeStore.getItem(witName);
                if (!wit) {
                    // if its an invalid wit, route to the 1st workitemtype page
                    navigate({ witName: workItemTypes[0].name }, true);
                    return;
                }
                else {
                    witName = wit.name;
                }
            }
            else if (!witName && workItemTypes) {
                witName = workItemTypes[0].name;
            }

            this.setState({
                selectedWit: witName
            });
        }
    }

    private _getWITNavGroups(): INavLink[] {
        return StoresHub.workItemTypeStore.getAll().map(wit => ({
            name: wit.name,
            key: wit.name,
            url: getWorkItemTypeSettingsUrl(wit.name)
        }));
    }
}

export function init() {
    initializeIcons();

    const container = document.getElementById("ext-container");
    const spinner = document.getElementById("spinner");
    container.removeChild(spinner);

    ReactDOM.render(<SettingsApp />, container);
}
