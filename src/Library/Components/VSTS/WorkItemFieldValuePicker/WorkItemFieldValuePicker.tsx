import "./WorkItemFieldValuePicker.scss";

import * as React from "react";

import { RichEditor } from "Library/Components/RichEditor";
import {
    DEFAULT_BUTTONS
} from "Library/Components/RichEditor/Toolbar/RichEditorToolbarButtonNames";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { ThrottledTextField } from "Library/Components/Utilities/ThrottledTextField";
import { DatePickerCombo } from "Library/Components/VssCombo/DatePickerCombo";
import { SimpleCombo } from "Library/Components/VssCombo/SimpleCombo";
import { ClassificationPicker } from "Library/Components/VSTS/ClassificationPicker";
import { WorkItemTagPicker } from "Library/Components/VSTS/WorkItemTagPicker";
import {
    WorkItemTypeFieldAllowedValuesActions
} from "Library/Flux/Actions/WorkItemTypeFieldAllowedValuesActions";
import { BaseStore, StoreFactory } from "Library/Flux/Stores/BaseStore";
import { ClassificationNodeKey } from "Library/Flux/Stores/ClassificationNodeStore";
import {
    WorkItemTypeFieldAllowedValuesStore
} from "Library/Flux/Stores/WorkItemTypeFieldAllowedValuesStore";
import { isNullOrWhiteSpace, stringEquals } from "Library/Utilities/String";
import { Checkbox } from "OfficeFabric/Checkbox";
import { autobind, css } from "OfficeFabric/Utilities";
import { FieldType, WorkItemField } from "TFS/WorkItemTracking/Contracts";

export interface IWorkItemFieldValuePickerProps extends IBaseFluxComponentProps {
    field: WorkItemField;
    workItemType: string;
    value?: any;
    label?: string;
    delay?: number;
    info?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    onChange(value: any): void;
}

export interface IWorkItemFieldValuePickerState extends IBaseFluxComponentState {
    allowedValues?: string[];
    internalValue?: any;
}

export class WorkItemFieldValuePicker extends BaseFluxComponent<IWorkItemFieldValuePickerProps, IWorkItemFieldValuePickerState> {
    private static FieldTypesSupportingAllowedValues = [
        FieldType.String,
        FieldType.Integer,
        FieldType.Double,
        FieldType.PicklistDouble,
        FieldType.PicklistInteger,
        FieldType.PicklistString
    ];

    private _fieldAllowedValuesStore = StoreFactory.getInstance<WorkItemTypeFieldAllowedValuesStore>(WorkItemTypeFieldAllowedValuesStore);

    public componentDidMount() {
        super.componentDidMount();

        const {field, workItemType} = this.props;

        if (this._fieldSupportsAllowedValues(field)) {
            const allowedValues = this._fieldAllowedValuesStore.getAllowedValues(workItemType, field.referenceName);
            if (allowedValues == null) {
                WorkItemTypeFieldAllowedValuesActions.initializeAllowedValues(workItemType, field.referenceName);
            }
            else {
                this.setState({allowedValues: allowedValues});
            }
        }
    }

    public componentWillReceiveProps(nextProps: IWorkItemFieldValuePickerProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);

        const {field, workItemType} = nextProps;
        const oldField = this.props.field;
        const oldWorkItemType = this.props.workItemType;

        if (!stringEquals(field && field.referenceName, oldField && oldField.referenceName, true) || !stringEquals(oldWorkItemType, workItemType, true)) {
            if (this._fieldSupportsAllowedValues(field)) {
                const allowedValues = this._fieldAllowedValuesStore.getAllowedValues(workItemType, field.referenceName);
                this.setState({allowedValues: allowedValues, internalValue: nextProps.value});

                if (allowedValues == null) {
                    WorkItemTypeFieldAllowedValuesActions.initializeAllowedValues(workItemType, field.referenceName);
                }
            }
            else {
                this.setState({allowedValues: null, internalValue: nextProps.value});
            }
        }
        else if (this.state.internalValue !== nextProps.value) {
            this.setState({internalValue: nextProps.value});
        }
    }

    public render(): JSX.Element {
        const {field, delay, label, disabled, info, required, error} = this.props;
        const {internalValue = ""} = this.state;

        const className = css("field-value-picker", this.props.className);

        if (!field || (this._fieldSupportsAllowedValues(field) && this.state.allowedValues == null)) {
            return (
                <ThrottledTextField
                    className={className}
                    value={""}
                    label={label}
                    info={info}
                    disabled={true}
                />
            );
        }

        if (field.referenceName === "System.Tags") {
            return (
                <WorkItemTagPicker
                    label={label}
                    info={info}
                    required={required}
                    error={error}
                    disabled={disabled}
                    selectedTags={isNullOrWhiteSpace(internalValue) ? [] : (internalValue as string).split(";")}
                    onChange={this._onTagsChange}
                />
            );
        }

        switch (field.type) {
            case FieldType.Boolean:
                const checked = (internalValue === 1 || internalValue === "1" || stringEquals(internalValue as string, "true", true) || internalValue as boolean === true) ? true : false;
                return (
                    <Checkbox
                        className={className}
                        checked={checked}
                        onChange={this._onCheckboxChange}
                        disabled={disabled}
                    />
                );
            case FieldType.PlainText:
                return (
                    <ThrottledTextField
                        className={className}
                        value={internalValue as string}
                        multiline={true}
                        resizable={false}
                        label={label}
                        info={info}
                        delay={delay}
                        required={required}
                        errorMessage={error}
                        disabled={disabled}
                        onChanged={this._onFieldValueChange}
                    />
                );
            case FieldType.History:
            case FieldType.Html:
                return (
                    <RichEditor
                        className={className}
                        value={internalValue as string}
                        label={label}
                        info={info}
                        disabled={disabled}
                        delay={delay}
                        required={required}
                        error={error}
                        editorOptions={{
                            buttons: DEFAULT_BUTTONS
                        }}
                        onChange={this._onFieldValueChange}
                    />
                );
            case FieldType.TreePath:
                return (
                    <ClassificationPicker
                        value={internalValue as string}
                        className={className}
                        label={label}
                        info={info}
                        delay={delay}
                        required={required}
                        disabled={disabled}
                        error={error}
                        onChange={this._onFieldValueChange}
                        keyType={field.referenceName === "System.AreaPath" ? ClassificationNodeKey.Area : ClassificationNodeKey.Iteration}
                    />
                );
            case FieldType.DateTime:
                return (
                    <DatePickerCombo
                        value={internalValue}
                        className={className}
                        label={label}
                        info={info}
                        delay={delay}
                        required={required}
                        disabled={disabled}
                        error={error}
                        onChange={this._onFieldValueChange}
                    />
                );
            default:
                if (this._fieldSupportsAllowedValues(field) && this.state.allowedValues.length > 0) {
                    return (
                        <SimpleCombo
                            options={this.state.allowedValues}
                            selectedValue={internalValue as string}
                            className={className}
                            label={label}
                            info={info}
                            delay={delay}
                            required={required}
                            disabled={disabled}
                            error={error}
                            onChange={this._onComboValueChange}
                        />
                    );
                }
                else {
                    return (
                        <ThrottledTextField
                            className={className}
                            value={internalValue as string}
                            label={label}
                            info={info}
                            delay={delay}
                            required={required}
                            errorMessage={error}
                            disabled={disabled}
                            onChanged={this._onFieldValueChange}
                        />
                    );
                }
        }
    }

    protected initializeState(): void {
        this.state = {
            allowedValues: null,
            internalValue: this.props.value
        };
    }

    protected getStoresState(): IWorkItemFieldValuePickerState {
        return {
            allowedValues: this.props.field ? this._fieldAllowedValuesStore.getAllowedValues(this.props.workItemType, this.props.field.referenceName) : null
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [this._fieldAllowedValuesStore];
    }

    private _fieldSupportsAllowedValues(field: WorkItemField): boolean {
        return field && !field.isIdentity && WorkItemFieldValuePicker.FieldTypesSupportingAllowedValues.indexOf(field.type) !== -1;
    }

    @autobind
    private _onCheckboxChange(_ev: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) {
        return this._onFieldValueChange(checked ? "1" : "0");
    }

    @autobind
    private _onComboValueChange(option: string, value: string) {
        this._onFieldValueChange(option || value);
    }

    @autobind
    private _onTagsChange(tags: string[]) {
        this._onFieldValueChange(tags.join(";"));
    }

    @autobind
    private _onFieldValueChange(value: any) {
        this.setState(
            {
                internalValue: value
            },
            () => {
                this.props.onChange(value);
            }
        );
    }
}
