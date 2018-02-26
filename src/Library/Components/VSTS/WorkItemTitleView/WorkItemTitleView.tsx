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
import { autobind, css } from "OfficeFabric/Utilities";
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

        let witColor = wit ? wit.color : null;
        const witIcon = wit ? (wit as any).icon : null;
        const witIconUrl = (witIcon && witIcon.id) ? witIcon.url : null;

        if (witColor) {
            witColor = `#${witColor.substring(witColor.length - 6)}`;
        }
        else {
            witColor = "#000000";
        }

        const webContext = VSS.getWebContext();
        const witUrl = `${webContext.collection.uri}/${webContext.project.name}/_workitems/edit/${this.props.workItemId}`;

        return (
            <div
                className={`${css("work-item-title-view", this.props.className)} ${(witIconUrl || !wit) ? "no-color" : ""}`}
                style={(witIconUrl || !wit) ? undefined : {borderColor: witColor}}
            >
                {witIconUrl && <img src={witIconUrl} alt="icon" />}
                {this.props.showId && <span className="work-item-id">{this.props.workItemId}</span>}
                <Link
                    className="title-link"
                    href={witUrl}
                    onClick={this._onLinkClick}
                >
                    {this.props.title}
                </Link>
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

    @autobind
    private _onLinkClick(e: React.MouseEvent<HTMLElement>) {
        if (this.props.onClick && !e.ctrlKey) {
            e.preventDefault();
            this.props.onClick(e);
        }
    }
}
