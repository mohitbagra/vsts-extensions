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
import { ExcludedFields, FormEvents } from "OneClick/Constants";
import { StoresHub } from "OneClick/Flux/Stores/StoresHub";
import { isAnyMacro, translateToFieldValue } from "OneClick/Helpers";
import { BaseMacro } from "OneClick/Macros/Macros";
import { BaseTrigger } from "OneClick/RuleTriggers/BaseTrigger";
import { FieldType } from "TFS/WorkItemTracking/Contracts";
import { IWorkItemFieldChangedArgs } from "TFS/WorkItemTracking/ExtensionContracts";

const AsyncFieldChangedPicker = getAsyncLoadedComponent(
    ["scripts/ActionRenderers"],
    (m: typeof ActionRenderers_Async) => m.FieldChangedPicker,
    () => <Loading />);

export class FieldChangedTrigger extends BaseTrigger {
    private _workItemType: string;

    public async shouldTrigger(args: IWorkItemFieldChangedArgs): Promise<boolean> {
        const formService = await getFormService();
        const fieldName = this.getAttribute<string>("fieldName", true);
        const field = await getWorkItemField(fieldName);
        if (field == null) {
            return false;
        }
        const oldFieldValue: string = await translateToFieldValue(this.getAttribute<string>("oldFieldValue", true) || "", field.type);
        const newFieldValue: string = await translateToFieldValue(this.getAttribute<string>("newFieldValue", true) || "", field.type);

        if (args && args.changedFields && args.changedFields[fieldName]) {
            const oldValue = await formService.getFieldValue(fieldName, true);
            const newValue = await formService.getFieldValue(fieldName);

            return (oldValue !== newValue) && (isAnyMacro(oldFieldValue) || oldFieldValue === oldValue) && (isAnyMacro(newFieldValue) || newFieldValue === newValue);
        }

        return false;
    }

    public getFriendlyName(): string {
        return "Field changed";
    }

    public getDescription(): string {
        return "Triggers when a field changes";
    }

    public isDirty(): boolean {
        return super.isDirty()
            || !stringEquals(this.getAttribute<string>("fieldName", true), this.getAttribute<string>("fieldName"), true)
            || !stringEquals(this.getAttribute<string>("oldFieldValue", true), this.getAttribute<string>("oldFieldValue"), true)
            || !stringEquals(this.getAttribute<string>("newFieldValue", true), this.getAttribute<string>("newFieldValue"), true);
    }

    public isValid(): boolean {
        const fieldName = this.getAttribute<string>("fieldName");
        const oldFieldValue = this.getAttribute<string>("oldFieldValue");
        const newFieldValue = this.getAttribute<string>("newFieldValue");

        if (isNullOrEmpty(fieldName)) {
            return false;
        }

        if (!StoresHub.workItemFieldStore.isLoaded() || !StoresHub.workItemTypeStore.isLoaded() || !this._workItemType) {
            return true;
        }

        const workItemType = StoresHub.workItemTypeStore.getItem(this._workItemType);
        const witFields = workItemType.fields.map(f => f.referenceName);
        const field = StoresHub.workItemFieldStore.getItem(fieldName);

        if (field) {
            return !contains(ExcludedFields, field.referenceName, (s1, s2) => stringEquals(s1, s2, true))
                && contains(witFields, field.referenceName, (s1, s2) => stringEquals(s1, s2, true))
                && isNullOrEmpty(this._getFieldValueError(field.type, oldFieldValue))
                && isNullOrEmpty(this._getFieldValueError(field.type, newFieldValue));
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

    public getAssociatedFormEvent(): FormEvents {
        return FormEvents.onFieldChanged;
    }

    public render(workItemType: string): React.ReactNode {
        this._workItemType = workItemType;

        const fieldName = this.getAttribute<string>("fieldName");
        const oldFieldValue = this.getAttribute<string>("oldFieldValue");
        const newFieldValue = this.getAttribute<string>("newFieldValue");
        const field = StoresHub.workItemFieldStore.getItem(fieldName);
        let oldFieldValueError = "";
        let newFieldValueError = "";
        if (field) {
            oldFieldValueError = this._getFieldValueError(field.type, oldFieldValue);
            newFieldValueError = this._getFieldValueError(field.type, newFieldValue);
        }

        return (
            <div>
                <AsyncFieldChangedPicker
                    workItemType={workItemType}
                    fieldRefName={fieldName}
                    onFieldChange={this._onFieldChange}
                    oldFieldValue={oldFieldValue}
                    newFieldValue={newFieldValue}
                    onOldFieldValueChange={this._onOldFieldValueChange}
                    onNewFieldValueChange={this._onNewFieldValueChange}
                    oldFieldValueError={oldFieldValueError}
                    newFieldValueError={newFieldValueError}
                />
            </div>
        );
    }

    protected defaultAttributes(): IDictionaryStringTo<any> {
        return {
            fieldName: "",
            oldFieldValue: "",
            newFieldValue: ""
        };
    }

    private _getFieldValueError(fieldType: FieldType, value: string): string {
        if ((BaseMacro.isMacro(value) && BaseMacro.getMacroType(value)) || isAnyMacro(value)) {
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
        this.setAttribute<string>("oldFieldValue", "", false);
        this._onNewFieldValueChange("");
    }

    private _onOldFieldValueChange = (fieldValue: string) => {
        this.setAttribute<string>("oldFieldValue", fieldValue || "");
    }

    private _onNewFieldValueChange = (fieldValue: string) => {
        this.setAttribute<string>("newFieldValue", fieldValue || "");
    }
}
