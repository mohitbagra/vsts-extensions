import "./WorkItemTitleView.scss";

import * as React from "react";

import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { WorkItemTypeActions } from "Library/Flux/Actions/WorkItemTypeActions";
import { BaseStore, StoreFactory } from "Library/Flux/Stores/BaseStore";
import { WorkItemTypeStore } from "Library/Flux/Stores/WorkItemTypeStore";
import { stringEquals } from "Library/Utilities/String";
import { Link } from "OfficeFabric/Link";
import {
    DirectionalHint, TooltipDelay, TooltipHost, TooltipOverflowMode
} from "OfficeFabric/Tooltip";
import { css } from "OfficeFabric/Utilities";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";

export interface IWorkItemTitleViewProps extends IBaseFluxComponentProps {
    workItemId: number;
    title: string;
    workItemType: string;
    showId?: boolean;
    onClick?(e: React.MouseEvent<HTMLElement>): void;
}

export interface IWorkItemTitleViewState extends IBaseFluxComponentState {
    workItemType: WorkItemType;
}

export class WorkItemTitleView extends BaseFluxComponent<IWorkItemTitleViewProps, IWorkItemTitleViewState> {
    private _workItemTypeStore = StoreFactory.getInstance<WorkItemTypeStore>(WorkItemTypeStore);

    public componentDidMount() {
        super.componentDidMount();
        if (this._workItemTypeStore.isLoaded()) {
            this.setState({
                workItemType: this._workItemTypeStore.getItem(this.props.workItemType)
            });
        }
        else {
            WorkItemTypeActions.initializeWorkItemTypes();
        }
    }

    public componentWillReceiveProps(nextProps: IWorkItemTitleViewProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);

        if (!stringEquals(nextProps.workItemType, this.props.workItemType, true)) {
            if (this._workItemTypeStore.isLoaded()) {
                this.setState({
                    workItemType: this._workItemTypeStore.getItem(nextProps.workItemType)
                });
            }
        }
    }

    public render(): JSX.Element {
        const wit = this.state.workItemType;

        const witIcon = wit ? wit.icon : null;
        const witIconUrl = (witIcon && witIcon.id) ? witIcon.url : null;

        const webContext = VSS.getWebContext();
        const witUrl = `${webContext.collection.uri}/${webContext.project.name}/_workitems/edit/${this.props.workItemId}`;

        return (
            <div
                className={`${css("work-item-title-view", this.props.className)}`}
            >
                {witIconUrl && <img src={witIconUrl} alt="icon" />}
                {this.props.showId && <span className="work-item-id">{this.props.workItemId}</span>}
                <div className="title-link">
                    <TooltipHost
                        content={this.props.title}
                        delay={TooltipDelay.medium}
                        overflowMode={TooltipOverflowMode.Parent}
                        directionalHint={DirectionalHint.bottomLeftEdge}
                    >
                        <Link
                            href={witUrl}
                            onClick={this._onLinkClick}
                        >
                            {this.props.title}
                        </Link>
                    </TooltipHost>
                </div>
            </div>
        );
    }

    protected initializeState(): void {
        this.state = { workItemType: null };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [this._workItemTypeStore];
    }

    protected getStoresState(): IWorkItemTitleViewState {
        return {
            workItemType: this._workItemTypeStore.isLoaded() ? this._workItemTypeStore.getItem(this.props.workItemType) : null
        };
    }

    private _onLinkClick = (e: React.MouseEvent<HTMLElement>) => {
        if (this.props.onClick && !e.ctrlKey) {
            e.preventDefault();
            this.props.onClick(e);
        }
    }
}
