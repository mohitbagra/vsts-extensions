import * as React from "react";

import { Loading } from "Library/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { stringEquals } from "Library/Utilities/String";
import { autobind } from "OfficeFabric/Utilities";

export interface IWorkItemTypeViewProps extends IBaseFluxComponentProps {
    workItemTypeName: string;
}

export interface IWorkItemTypeViewState extends IBaseFluxComponentState {
    workItemTypeEnabled?: boolean;
}

export class WorkItemTypeView extends BaseFluxComponent<IWorkItemTypeViewProps, IWorkItemTypeViewState> {
    public componentDidMount() {
        super.componentDidMount();
        this._refresh();
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this._clearStores();
    }

    public componentWillReceiveProps(nextProps: IWorkItemTypeViewProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);

        if (!stringEquals(this.props.workItemTypeName, nextProps.workItemTypeName, true)) {
            this._refresh(nextProps.workItemTypeName);
        }
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }
        return <span>{this.props.workItemTypeName}</span>;
    }

    protected getStoresState(): IWorkItemTypeViewState {
        return {
            loading: false,
            workItemTypeEnabled: true
        } as IWorkItemTypeViewState;
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [];
    }

    protected initializeState() {
        this.state = {
            loading: false,
            workItemTypeEnabled: null
        };
    }

    @autobind
    private _refresh(workItemType?: string) {
        const workItemTypeName = workItemType || this.props.workItemTypeName;
        this._clearStores(workItemTypeName);
    }

    private _clearStores(_currentWorkItemType?: string) {
        // to do
    }
}
