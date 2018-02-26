import "./SettingsPanel.scss";

import * as React from "react";

import { InfoLabel } from "Library/Components/InfoLabel";
import { Loading } from "Library/Components/Loading";
import { arrayEquals, contains, findIndex, first } from "Library/Utilities/Array";
import * as ExtensionDataManager from "Library/Utilities/ExtensionDataManager";
import { stringEquals } from "Library/Utilities/String";
import { PrimaryButton } from "OfficeFabric/Button";
import { ITag, TagPicker } from "OfficeFabric/components/pickers/TagPicker/TagPicker";
import { Dropdown, IDropdownOption, IDropdownProps } from "OfficeFabric/Dropdown";
import { TextField } from "OfficeFabric/TextField";
import { autobind } from "OfficeFabric/Utilities";
import { Constants, ISettings } from "RelatedWits/Models";
import { WorkItemField } from "TFS/WorkItemTracking/Contracts";
import { WorkItemFormService } from "TFS/WorkItemTracking/Services";

export interface ISettingsPanelProps {
    settings: ISettings;
    onSave(userPreferenceModel: ISettings): void;
}

export interface ISettingsPanelState {
    loading: boolean;
    sortField?: WorkItemField;
    queryFields?: WorkItemField[];
    sortableFields?: WorkItemField[];
    queryableFields?: WorkItemField[];
    top: string;
    saving?: boolean;
}

export class SettingsPanel extends React.Component<ISettingsPanelProps, ISettingsPanelState> {
    constructor(props: ISettingsPanelProps, context?: any) {
        super(props, context);

        this.state = {
            loading: true,
            top: props.settings.top.toString()
        };
    }

    public componentDidMount() {
        this.initialize();
    }

    public async initialize(): Promise<void> {
        const workItemFormService = await WorkItemFormService.getService();
        const fields = await workItemFormService.getFields();

        const sortableFields = fields.filter(field =>
            Constants.SortableFieldTypes.indexOf(field.type) !== -1
            && !contains(Constants.ExcludedFields, field.referenceName, (f1, f2) => stringEquals(f1, f2, true))).sort(this._fieldNameComparer);

        const queryableFields = fields.filter(field =>
            (Constants.QueryableFieldTypes.indexOf(field.type) !== -1 || stringEquals(field.referenceName, "System.Tags", true))
            && !contains(Constants.ExcludedFields, field.referenceName, (f1, f2) => stringEquals(f1, f2, true)));

        const sortField = first(sortableFields, field => stringEquals(field.referenceName, this.props.settings.sortByField, true)) ||
                          first(sortableFields, field => stringEquals(field.referenceName, Constants.DEFAULT_SORT_BY_FIELD, true));

        let queryFields = this.props.settings.fields.map(fName => first(queryableFields, field => stringEquals(field.referenceName, fName, true)));
        queryFields = queryFields.filter(f => f != null);

        this.setState({loading: false, sortableFields: sortableFields, queryableFields: queryableFields, sortField: sortField, queryFields: queryFields});
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return (
                <div className="settings-panel">
                    <Loading />
                </div>
            );
        }

        const sortableFieldOptions: IDropdownOption[] = this.state.sortableFields.map((field: WorkItemField, index: number) => {
            return {
                key: field.referenceName,
                index: index,
                text: field.name,
                selected: stringEquals(this.state.sortField.referenceName, field.referenceName, true)
            };
        });

        return (
            <div className="settings-panel">
                <div className="settings-controls">
                    <div className="settings-control-container">
                        <InfoLabel label="Max count" info="Maximum number of work items to retrieve" />
                        <TextField
                            value={`${this.state.top}`}
                            onChanged={this._onTopValueChange}
                            onGetErrorMessage={this._getTopError}
                        />
                    </div>

                    <div className="settings-control-container">
                        <InfoLabel label="Sort by" info="Select a field which will be used to sort the results" />
                        <Dropdown
                            className="sort-field-dropdown"
                            onRenderList={this._onRenderCallout}
                            options={sortableFieldOptions}
                            onChanged={this._updateSortField}
                        />
                    </div>

                    <div className="settings-control-container">
                        <InfoLabel label="Fields to seek" info="Select a list of fields which will be used to seek related work items" />
                        <TagPicker
                            className="tagpicker"
                            defaultSelectedItems={this.state.queryFields.map(f => this._getFieldTag(f))}
                            onResolveSuggestions={this._onFieldFilterChanged}
                            getTextFromItem={this._getTagTextFromItem}
                            onChange={this._updateQueryFields}
                            pickerSuggestionsProps={
                                {
                                    suggestionsHeaderText: "Suggested Fields",
                                    noResultsFoundText: "No fields Found"
                                }
                            }
                        />
                    </div>
                </div>

                <PrimaryButton className="save-button" disabled={!this._isSettingsDirty() || !this._isSettingsValid() || this.state.saving} onClick={this._onSaveClick}>
                    Save
                </PrimaryButton>
            </div>
        );
    }

    private _isInteger(value: string): boolean {
        return /^\d+$/.test(value);
    }

    @autobind
    private _onTopValueChange(newValue: string) {
        this._updateTop(newValue);
    }

    @autobind
    private _getTagTextFromItem(item: ITag): string {
        return item.name;
    }

    @autobind
    private _getTopError(value: string): string {
        if (value == null || value.trim() === "") {
            return "A value is required";
        }
        if (!this._isInteger(value)) {
            return "Enter a positive integer value";
        }
        if (parseInt(value, 10) > 500) {
            return "For better performance, please enter a value less than 500";
        }
        return "";
    }

    private _isSettingsDirty(): boolean {
        return this.props.settings.top.toString() !== this.state.top
            || !stringEquals(this.props.settings.sortByField, this.state.sortField.referenceName, true)
            || !arrayEquals(this.props.settings.fields, this.state.queryFields.map(f => f.referenceName), (f1, f2) => stringEquals(f1, f2, true));
    }

    private _isSettingsValid(): boolean {
        return this._isInteger(this.state.top) && parseInt(this.state.top, 10) > 0 && parseInt(this.state.top, 10) <= 500;
    }

    @autobind
    private async _onSaveClick(): Promise<void> {
        if (!this._isSettingsValid()) {
            return;
        }

        const userPreferenceModel: ISettings = {
            sortByField: this.state.sortField.referenceName,
            fields: this.state.queryFields.map(f => f.referenceName),
            top: parseInt(this.state.top, 10)
        };

        this.setState({saving: true});
        const workItemFormService = await WorkItemFormService.getService();
        const workItemType = await workItemFormService.getFieldValue("System.WorkItemType") as string;
        const project = await workItemFormService.getFieldValue("System.TeamProject") as string;
        await ExtensionDataManager.writeSetting<ISettings>(`${Constants.StorageKey}_${project}_${workItemType}`, userPreferenceModel, true);

        this.setState({saving: false});
        this.props.onSave(userPreferenceModel);
    }

    @autobind
    private _getFieldTag(field: WorkItemField): ITag {
        return {
            key: field.referenceName,
            name: field.name
        };
    }

    @autobind
    private _onRenderCallout(props?: IDropdownProps, defaultRender?: (props?: IDropdownProps) => JSX.Element): JSX.Element {
        return (
            <div className="callout-container">
                {defaultRender(props)}
            </div>
        );
    }

    @autobind
    private _updateSortField(option: IDropdownOption) {
        const sortField = first(this.state.sortableFields, (field: WorkItemField) => stringEquals(field.referenceName, option.key as string, true));
        this.setState({sortField: sortField});
    }

    @autobind
    private _updateQueryFields(items: ITag[]) {
        const queryFields = items.map((item: ITag) => first(this.state.queryableFields, (field: WorkItemField) => stringEquals(field.referenceName, item.key, true)));
        this.setState({queryFields: queryFields});
    }

    @autobind
    private _updateTop(top: string) {
        this.setState({top: top});
    }

    @autobind
    private _onFieldFilterChanged(filterText: string, tagList: ITag[]): ITag[] {
        return filterText
            ? this.state.queryableFields.filter(field => field.name.toLowerCase().indexOf(filterText.toLowerCase()) === 0
                && findIndex(tagList, (tag: ITag) => stringEquals(tag.key, field.referenceName, true)) === -1).map(field => {
                    return { key: field.referenceName, name: field.name};
                })
            : [];
    }

    private _fieldNameComparer(a: WorkItemField, b: WorkItemField): number {
        const aUpper = a.name.toUpperCase();
        const bUpper = b.name.toUpperCase();

        if (aUpper < bUpper) { return -1; }
        if (aUpper > bUpper) { return 1; }
        return 0;
    }
}
