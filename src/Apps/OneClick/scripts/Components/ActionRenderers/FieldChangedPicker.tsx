import * as React from "react";

import { Loading } from "Common/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { WorkItemFieldPicker } from "Common/Components/VSTS/WorkItemFieldPicker";
import { WorkItemFieldValuePicker } from "Common/Components/VSTS/WorkItemFieldValuePicker";
import { WorkItemFieldActions } from "Common/Flux/Actions/WorkItemFieldActions";
import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { contains } from "Common/Utilities/Array";
import { stringEquals } from "Common/Utilities/String";
import { css } from "OfficeFabric/Utilities";
import { ExcludedFields } from "OneClick/Constants";
import { StoresHub } from "OneClick/Flux/Stores/StoresHub";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";

export interface IFieldChangedPickerProps extends IBaseFluxComponentProps {
    fieldRefName: string;
    workItemType: string;
    oldFieldValue: string;
    newFieldValue: string;
    oldFieldValueError?: string;
    newFieldValueError?: string;
    onFieldChange(fieldRefName: string): void;
    onOldFieldValueChange(value: string): void;
    onNewFieldValueChange(value: string): void;
}

export class FieldChangedPicker extends BaseFluxComponent<IFieldChangedPickerProps, IBaseFluxComponentState> {
    public componentDidMount() {
        super.componentDidMount();
        WorkItemFieldActions.initializeWorkItemFields();
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }

        const workItemType = StoresHub.workItemTypeStore.getItem(this.props.workItemType);
        const witFields = workItemType.fields.map(f => f.referenceName);
        let selectedField: WorkItemField = StoresHub.workItemFieldStore.getItem(this.props.fieldRefName);

        if (selectedField == null
            || !contains(witFields, this.props.fieldRefName, (s1, s2) => stringEquals(s1, s2, true))
            || contains(ExcludedFields, selectedField.referenceName, (s1, s2) => stringEquals(s1, s2, true))) {
            selectedField = null;
        }

        return (
            <div className={css("field-name-value-picker", this.props.className)}>
                <WorkItemFieldPicker
                    className="action-property-control"
                    selectedOption={selectedField}
                    selectedValue={this.props.fieldRefName}
                    onChange={this._onFieldChange}
                    label="Field name"
                    info="Select a field"
                    delay={200}
                    required={true}
                    excludeFields={ExcludedFields}
                    workItemType={this.props.workItemType}
                />
                <WorkItemFieldValuePicker
                    className="action-property-control"
                    value={this.props.oldFieldValue}
                    field={selectedField}
                    workItemType={this.props.workItemType}
                    onChange={this._onOldFieldValueChange}
                    delay={200}
                    label="Old field value"
                    info="Enter old field value. Supported macros - @any, @fieldValue, @today, @me."
                    error={this.props.oldFieldValueError}
                />
                <WorkItemFieldValuePicker
                    className="action-property-control"
                    value={this.props.newFieldValue}
                    field={selectedField}
                    workItemType={this.props.workItemType}
                    onChange={this._onNewFieldValueChange}
                    delay={200}
                    label="New field value"
                    info="Enter new field value. Supported macros - @any, @fieldValue, @today, @me."
                    error={this.props.newFieldValueError}
                />
            </div>
        );
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.workItemFieldStore];
    }

    protected getStoresState(): IBaseFluxComponentState {
        return {
            loading: StoresHub.workItemFieldStore.isLoading()
        };
    }

    protected getInitialState(): IBaseFluxComponentState {
        return {
            loading: true
        };
    }

    private _onFieldChange = (field: WorkItemField, value?: string) => {
        this.props.onFieldChange(field ? field.referenceName : value);
    }

    private _onOldFieldValueChange = (value: any) => {
        this.props.onOldFieldValueChange(value);
    }

    private _onNewFieldValueChange = (value: any) => {
        this.props.onNewFieldValueChange(value);
    }
}
