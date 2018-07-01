import "./WorkItemStateView.scss";

import * as React from "react";

import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { WorkItemStateItemActions } from "Common/Flux/Actions/WorkItemStateItemActions";
import { BaseStore, StoreFactory } from "Common/Flux/Stores/BaseStore";
import { WorkItemStateItemStore } from "Common/Flux/Stores/WorkItemStateItemStore";
import { first } from "Common/Utilities/Array";
import { stringEquals } from "Common/Utilities/String";
import {
    DirectionalHint, TooltipDelay, TooltipHost, TooltipOverflowMode
} from "OfficeFabric/Tooltip";
import { css } from "OfficeFabric/Utilities";
import { WorkItemStateColor } from "TFS/WorkItemTracking/Contracts";

export interface IWorkItemStateViewProps extends IBaseFluxComponentProps {
    state: string;
    workItemType: string;
}

export interface IWorkItemStateViewState extends IBaseFluxComponentState {
    workItemTypeState: WorkItemStateColor;
}

export class WorkItemStateView extends BaseFluxComponent<IWorkItemStateViewProps, IWorkItemStateViewState> {
    private _workItemStateItemStore = StoreFactory.getInstance<WorkItemStateItemStore>(WorkItemStateItemStore);

    public componentDidMount() {
        super.componentDidMount();
        if (this._workItemStateItemStore.isLoaded(this.props.workItemType)) {
            const workItemTypeStates = this._workItemStateItemStore.getItem(this.props.workItemType);
            this.setState({
                workItemTypeState: first(workItemTypeStates, s => stringEquals(s.name, this.props.state, true))
            });
        } else {
            WorkItemStateItemActions.initializeWorkItemStates(this.props.workItemType);
        }
    }

    public componentWillReceiveProps(nextProps: IWorkItemStateViewProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);

        if (!stringEquals(nextProps.state, this.props.state, true) || !stringEquals(nextProps.workItemType, this.props.workItemType, true)) {
            if (this._workItemStateItemStore.isLoaded(nextProps.workItemType)) {
                const workItemTypeStates = this._workItemStateItemStore.getItem(nextProps.workItemType);
                this.setState({
                    workItemTypeState: first(workItemTypeStates, s => stringEquals(s.name, nextProps.state, true))
                });
            } else {
                WorkItemStateItemActions.initializeWorkItemStates(nextProps.workItemType);
            }
        }
    }

    public render(): JSX.Element {
        let stateColor;

        if (this.state.workItemTypeState && this.state.workItemTypeState.color) {
            stateColor = `#${this.state.workItemTypeState.color.substring(this.state.workItemTypeState.color.length - 6)}`;
        } else {
            stateColor = "#000000";
        }

        return (
            <div className={css("work-item-state-view", this.props.className)}>
                <span
                    className="work-item-type-state-color"
                    style={{
                        backgroundColor: stateColor,
                        borderColor: stateColor
                    }}
                />
                <TooltipHost
                    content={this.props.state}
                    hostClassName="state-name"
                    delay={TooltipDelay.medium}
                    overflowMode={TooltipOverflowMode.Self}
                    directionalHint={DirectionalHint.bottomLeftEdge}
                >
                    {this.props.state}
                </TooltipHost>
            </div>
        );
    }

    protected getStoresState(): IWorkItemStateViewState {
        const workItemTypeStates = this._workItemStateItemStore.getItem(this.props.workItemType);

        return {
            workItemTypeState: workItemTypeStates ? first(workItemTypeStates, s => stringEquals(s.name, this.props.state, true)) : null
        };
    }

    protected getInitialState(): IWorkItemStateViewState {
        return { workItemTypeState: null };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [this._workItemStateItemStore];
    }
}
