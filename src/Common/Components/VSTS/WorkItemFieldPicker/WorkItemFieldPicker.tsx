import * as React from "react";

import {
    BaseFluxComponent, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { ISimpleComboProps, SimpleCombo } from "Common/Components/VssCombo/SimpleCombo";
import { WorkItemFieldActions } from "Common/Flux/Actions/WorkItemFieldActions";
import { WorkItemTypeActions } from "Common/Flux/Actions/WorkItemTypeActions";
import { BaseStore, StoreFactory } from "Common/Flux/Stores/BaseStore";
import { WorkItemFieldStore } from "Common/Flux/Stores/WorkItemFieldStore";
import { WorkItemTypeStore } from "Common/Flux/Stores/WorkItemTypeStore";
import { arrayEquals, contains } from "Common/Utilities/Array";
import { isNullOrWhiteSpace, stringEquals } from "Common/Utilities/String";
import { Spinner, SpinnerSize } from "OfficeFabric/Spinner";
import { css } from "OfficeFabric/Utilities";
import { FieldType, WorkItemField } from "TFS/WorkItemTracking/Contracts";

export interface IWorkItemFieldPickerProps extends ISimpleComboProps<WorkItemField> {
    allowedFieldTypes?: FieldType[];
    workItemType?: string;
    excludeFields?: string[];
}

export interface IWorkItemFieldPickerState extends IBaseFluxComponentState {
    allowedFields?: WorkItemField[];
}

export class WorkItemFieldPicker extends BaseFluxComponent<IWorkItemFieldPickerProps, IWorkItemFieldPickerState> {
    private _fieldStore = StoreFactory.getInstance<WorkItemFieldStore>(WorkItemFieldStore);
    private _workItemTypeStore = StoreFactory.getInstance<WorkItemTypeStore>(WorkItemTypeStore);

    public componentDidMount() {
        super.componentDidMount();
        let waitForStores = false;

        if (!this._fieldStore.isLoaded()) {
            WorkItemFieldActions.initializeWorkItemFields();
            waitForStores = true;
        }
        if (!isNullOrWhiteSpace(this.props.workItemType) && !this._workItemTypeStore.isLoaded()) {
            WorkItemTypeActions.initializeWorkItemTypes();
            waitForStores = true;
        }

        if (!waitForStores) {
            this.setState({
                allowedFields: this._getAllowedFields(this.props.allowedFieldTypes, this.props.excludeFields, this.props.workItemType)
            });
        }
    }

    public componentWillReceiveProps(nextProps: IWorkItemFieldPickerProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);

        if (!isNullOrWhiteSpace(nextProps.workItemType) && !this._workItemTypeStore.isLoaded()) {
            WorkItemTypeActions.initializeWorkItemTypes();
            return;
        }

        if (!arrayEquals(nextProps.allowedFieldTypes, this.props.allowedFieldTypes) || !arrayEquals(nextProps.excludeFields, this.props.excludeFields)) {
            this.setState({allowedFields: this._getAllowedFields(nextProps.allowedFieldTypes, nextProps.excludeFields, nextProps.workItemType)});
        }
    }

    public render(): JSX.Element {
        if (!this.state.allowedFields) {
            return <Spinner size={SpinnerSize.large} />;
        }

        const props = {
            ...this.props,
            className: css("work-item-field-picker", this.props.className),
            getItemText: (field: WorkItemField) => field.name,
            options: this.state.allowedFields,
            limitedToAllowedOptions: true
        } as ISimpleComboProps<WorkItemField>;

        return <SimpleCombo {...props} />;
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [this._fieldStore, this._workItemTypeStore];
    }

    protected getStoresState(): IWorkItemFieldPickerState {
        return {
            allowedFields: this._getAllowedFields(this.props.allowedFieldTypes, this.props.excludeFields, this.props.workItemType)
        };
    }

    private _getAllowedFields(allowedFieldTypes: FieldType[], excludeFields: string[], workItemType: string): WorkItemField[] {
        if (!this._fieldStore.isLoaded() || (!isNullOrWhiteSpace(workItemType) && !this._workItemTypeStore.isLoaded())) {
            return null;
        }

        const allFields = this._fieldStore.getAll();
        return allFields.filter(f => {
            let witFields: string[];
            if (!isNullOrWhiteSpace(workItemType) && this._workItemTypeStore.itemExists(workItemType)) {
                witFields = this._workItemTypeStore.getItem(workItemType).fields.map(wf => wf.referenceName);
            }

            return (!allowedFieldTypes || allowedFieldTypes.indexOf(f.type) !== -1)
                && (!excludeFields || !contains(excludeFields, f.referenceName, (a, b) => stringEquals(a, b, true)))
                && (!witFields || contains(witFields, f.referenceName, (s1, s2) => stringEquals(s1, s2, true)));
        });
    }
}
