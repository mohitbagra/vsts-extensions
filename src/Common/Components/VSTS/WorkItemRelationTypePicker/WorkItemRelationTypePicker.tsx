import * as React from "react";

import {
    BaseFluxComponent, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { ISimpleComboProps, SimpleCombo } from "Common/Components/VssCombo/SimpleCombo";
import { WorkItemRelationTypeActions } from "Common/Flux/Actions/WorkItemRelationTypeActions";
import { BaseStore, StoreFactory } from "Common/Flux/Stores/BaseStore";
import { WorkItemRelationTypeStore } from "Common/Flux/Stores/WorkItemRelationTypeStore";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { WorkItemRelationType } from "TFS/WorkItemTracking/Contracts";

export interface IWorkItemRelationTypePickerState extends IBaseFluxComponentState {
    relationTypes?: WorkItemRelationType[];
}

export class WorkItemRelationTypePicker extends BaseFluxComponent<ISimpleComboProps<WorkItemRelationType>, IWorkItemRelationTypePickerState> {
    private _workItemRelationTypeStore = StoreFactory.getInstance<WorkItemRelationTypeStore>(WorkItemRelationTypeStore);

    public componentDidMount() {
        super.componentDidMount();
        if (this._workItemRelationTypeStore.isLoaded()) {
            this.setState({
                relationTypes: this._workItemRelationTypeStore.getAll()
            });
        }
        else {
            WorkItemRelationTypeActions.initializeWorkItemRelationTypes();
        }
    }

    public render(): JSX.Element {
        if (!this.state.relationTypes) {
            return <Spinner size={SpinnerSize.large} />;
        }

        const props = {
            ...this.props,
            className: css("work-item-relation-type-picker", this.props.className),
            getItemText: (relationType: WorkItemRelationType) => relationType.name,
            options: this.state.relationTypes,
            limitedToAllowedOptions: true
        } as ISimpleComboProps<WorkItemRelationType>;

        return <SimpleCombo {...props} />;
    }

    protected getStoresState(): IWorkItemRelationTypePickerState {
        return {
            relationTypes: this._workItemRelationTypeStore.getAll()
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [this._workItemRelationTypeStore];
    }
}
