import * as React from "react";

import { Loading } from "Common/Components/Loading";
import { getAsyncLoadedComponent } from "Common/Components/Utilities/AsyncLoadedComponent";
import { contains } from "Common/Utilities/Array";
import { isDate } from "Common/Utilities/Date";
import { isInteger, isNumeric } from "Common/Utilities/Number";
import { isNullOrEmpty, stringEquals } from "Common/Utilities/String";
import { getFormService, getWorkItemField } from "Common/Utilities/WorkItemFormHelpers";
import { IIconProps } from "OfficeFabric/Icon";
import * as ActionRenderers_Async from "OneClick/Components/ActionRenderers";
import { ExcludedFields } from "OneClick/Constants";
import { StoresHub } from "OneClick/Flux/Stores/StoresHub";
import { translateToFieldValue } from "OneClick/Helpers";
import { BaseMacro } from "OneClick/Macros/Macros";
import { BaseAction } from "OneClick/RuleActions/BaseAction";
import { FieldType } from "TFS/WorkItemTracking/Contracts";

const AsyncFieldNameValuePicker = getAsyncLoadedComponent(
    ["scripts/ActionRenderers"],
    (m: typeof ActionRenderers_Async) => m.FieldNameValuePicker,
    () => <Loading />);

export class SetFieldValueAction extends BaseAction {
    private _workItemType: string;

    public async run() {
        const fieldName = this.getAttribute<string>("fieldName", true);
        const formService = await getFormService();
        const field = await getWorkItemField(fieldName);
        if (field) {
            const fieldValue: string = await translateToFieldValue(this.getAttribute<string>("fieldValue", true) || "", field.type);
            await formService.setFieldValue(fieldName, fieldValue);
        }
    }

    public getFriendlyName(): string {
        return "Set field value";
    }

    public getDescription(): string {
        return "Sets a field value";
    }

    public isDirty(): boolean {
        return super.isDirty()
            || !stringEquals(this.getAttribute<string>("fieldName", true), this.getAttribute<string>("fieldName"), true)
            || !stringEquals(this.getAttribute<string>("fieldValue", true), this.getAttribute<string>("fieldValue"), true);
    }

    public isValid(): boolean {
        const fieldName = this.getAttribute<string>("fieldName");
        const fieldValue = this.getAttribute<string>("fieldValue");

        if (isNullOrEmpty(fieldName) || !StoresHub.workItemFieldStore.isLoaded() || !this._workItemType) {
            return false;
        }

        const workItemType = StoresHub.workItemTypeStore.getItem(this._workItemType);
        const witFields = workItemType.fields.map(f => f.referenceName);
        const field = StoresHub.workItemFieldStore.getItem(fieldName);

        if (field) {
            return !contains(ExcludedFields, field.referenceName, (s1, s2) => stringEquals(s1, s2, true))
                && contains(witFields, field.referenceName, (s1, s2) => stringEquals(s1, s2, true))
                && isNullOrEmpty(this._getFieldValueError(field.type, fieldValue));
        }

        return false;
    }

    public getIcon(): IIconProps {
        return {
            iconName: "FieldChanged",
            styles: {
                root: {color: "#004578 !important"}
            }
        };
    }

    public render(workItemType: string): React.ReactNode {
        this._workItemType = workItemType;

        const fieldName = this.getAttribute<string>("fieldName");
        const fieldValue = this.getAttribute<string>("fieldValue");
        const field = StoresHub.workItemFieldStore.getItem(fieldName);
        let valueError = "";
        if (field) {
            valueError = this._getFieldValueError(field.type, fieldValue);
        }

        return (
            <div>
                <AsyncFieldNameValuePicker
                    workItemType={workItemType}
                    fieldRefName={fieldName}
                    fieldValue={fieldValue}
                    onFieldChange={this._onFieldChange}
                    onFieldValueChange={this._onFieldValueChange}
                    valueError={valueError}
                />
            </div>
        );
    }

    protected defaultAttributes(): IDictionaryStringTo<any> {
        return {
            fieldName: "",
            fieldValue: ""
        };
    }

    private _getFieldValueError(fieldType: FieldType, value: string): string {
        if (BaseMacro.isMacro(value) && BaseMacro.getMacroType(value)) {
            return null;
        }

        switch (fieldType) {
            case FieldType.Boolean:
                return this._validateBoolean(value);
            case FieldType.Double:
                return this._validateNumber(value);
            case FieldType.DateTime:
                return this._validateDateTime(value);
            case FieldType.Integer:
                return this._validateInteger(value);
            default:
                return null;
        }
    }

    private _validateBoolean(value: string): string {
        if (value && !stringEquals(value, "True", true)
            && !stringEquals(value, "1", true)
            && !stringEquals(value, "False", true)
            && !stringEquals(value, "0", true)) {

            return "Invalid boolean value";
        }
        return "";
    }

    private _validateNumber(value: string): string {
        if (value && !isNumeric(value)) {
            return "Invalid numeric value";
        }
        return "";
    }

    private _validateInteger(value: string): string {
        if (value && !isInteger(value)) {
            return "Invalid integer value";
        }
        return "";
    }

    private _validateDateTime(value: string): string {
        if (value && !isDate(value)) {
            return "Invalid date value";
        }

        return "";
    }

    private _onFieldChange = (fieldName: string) => {
        this.setAttribute<string>("fieldName", fieldName || "", false);
        this._onFieldValueChange("");
    }

    private _onFieldValueChange = (fieldValue: string) => {
        this.setAttribute<string>("fieldValue", fieldValue || "");
    }
}
