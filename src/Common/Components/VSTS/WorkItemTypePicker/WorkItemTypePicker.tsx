import * as React from "react";

import {
    BaseFluxComponent, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { ISimpleComboProps, SimpleCombo } from "Common/Components/VssCombo/SimpleCombo";
import { WorkItemTypeActions } from "Common/Flux/Actions/WorkItemTypeActions";
import { BaseStore, StoreFactory } from "Common/Flux/Stores/BaseStore";
import { WorkItemTypeStore } from "Common/Flux/Stores/WorkItemTypeStore";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { WorkItemType } from "TFS/WorkItemTracking/Contracts";

export interface IWorkItemTypePickerState extends IBaseFluxComponentState {
    allWits?: WorkItemType[];
}

export class WorkItemTypePicker extends BaseFluxComponent<ISimpleComboProps<WorkItemType>, IWorkItemTypePickerState> {
    private _workItemTypeStore = StoreFactory.getInstance<WorkItemTypeStore>(WorkItemTypeStore);

    public componentDidMount() {
        super.componentDidMount();
        if (this._workItemTypeStore.isLoaded()) {
            this.setState({
                allWits: this._workItemTypeStore.getAll()
            });
        }
        else {
            WorkItemTypeActions.initializeWorkItemTypes();
        }
    }

    public render(): JSX.Element {
        if (!this.state.allWits) {
            return <Spinner size={SpinnerSize.large} />;
        }

        const props = {
            ...this.props,
            className: css("work-item-type-picker", this.props.className),
            getItemText: (wit: WorkItemType) => wit.name,
            options: this.state.allWits,
            limitedToAllowedOptions: true
        } as ISimpleComboProps<WorkItemType>;

        return <SimpleCombo {...props} />;
    }

    protected getStoresState(): IWorkItemTypePickerState {
        return {
            allWits: this._workItemTypeStore.getAll()
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [this._workItemTypeStore];
    }

}
