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

export interface IFieldNameValuePickerProps extends IBaseFluxComponentProps {
    fieldRefName: string;
    fieldValue: string;
    workItemType: string;
    valueError?: string;
    onFieldChange(fieldRefName: string): void;
    onFieldValueChange(value: string): void;
}

export class FieldNameValuePicker extends BaseFluxComponent<IFieldNameValuePickerProps, IBaseFluxComponentState> {
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
                    value={this.props.fieldValue}
                    field={selectedField}
                    workItemType={this.props.workItemType}
                    onChange={this._onFieldValueChange}
                    delay={200}
                    label="Field value"
                    info="Enter field value. Supported macros - @fieldValue, @today, @me."
                    error={this.props.valueError}
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

    protected initializeState(): void {
        this.state = {
            loading: true
        };
    }

    private _onFieldChange = (field: WorkItemField, value?: string) => {
        this.props.onFieldChange(field ? field.referenceName : value);
    }

    private _onFieldValueChange = (value: any) => {
        this.props.onFieldValueChange(value);
    }
}
