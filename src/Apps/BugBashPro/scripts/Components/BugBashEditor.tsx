import "./BugBashEditor.scss";

import * as React from "react";

import { BugBashFieldNames, ErrorKeys, SizeLimits } from "BugBashPro/Constants";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { BugBash } from "BugBashPro/ViewModels/BugBash";
import { InfoLabel } from "Common/Components/InfoLabel";
import { InputError } from "Common/Components/InputError";
import { Loading } from "Common/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { ThrottledTextField } from "Common/Components/Utilities/ThrottledTextField";
import { TeamPicker } from "Common/Components/VSTS/TeamPicker";
import { WorkItemFieldPicker } from "Common/Components/VSTS/WorkItemFieldPicker";
import { WorkItemTypePicker } from "Common/Components/VSTS/WorkItemTypePicker";
import { ErrorMessageActions } from "Common/Flux/Actions/ErrorMessageActions";
import { TeamActions } from "Common/Flux/Actions/TeamActions";
import { WorkItemFieldActions } from "Common/Flux/Actions/WorkItemFieldActions";
import { WorkItemTemplateActions } from "Common/Flux/Actions/WorkItemTemplateActions";
import { WorkItemTypeActions } from "Common/Flux/Actions/WorkItemTypeActions";
import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { defaultDateComparer } from "Common/Utilities/Date";
import { isNullOrWhiteSpace } from "Common/Utilities/String";
import { Checkbox } from "OfficeFabric/Checkbox";
import { DatePicker } from "OfficeFabric/DatePicker";
import { Dropdown, IDropdownOption, IDropdownProps } from "OfficeFabric/Dropdown";
import { Link } from "OfficeFabric/Link";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { Overlay } from "OfficeFabric/Overlay";
import { WebApiTeam } from "TFS/Core/Contracts";
import {
    FieldType, WorkItemField, WorkItemTemplateReference, WorkItemType
} from "TFS/WorkItemTracking/Contracts";

export interface IBugBashEditorProps extends IBaseFluxComponentProps {
    bugBash: BugBash;
}

export interface IBugBashEditorState extends IBaseFluxComponentState {
    templates: IDropdownOption[];
    error?: string;
}

export class BugBashEditor extends BaseFluxComponent<IBugBashEditorProps, IBugBashEditorState>  {
    public componentDidMount() {
        super.componentDidMount();

        WorkItemFieldActions.initializeWorkItemFields();
        WorkItemTypeActions.initializeWorkItemTypes();
        TeamActions.initializeTeams();

        const acceptTemplateTeam = this.props.bugBash.getFieldValue<string>(BugBashFieldNames.AcceptTemplateTeam);
        if (acceptTemplateTeam) {
            WorkItemTemplateActions.initializeWorkItemTemplates(acceptTemplateTeam);
        }
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this._dismissErrorMessage();
    }

    public componentWillReceiveProps(nextProps: Readonly<IBugBashEditorProps>) {
        const nextAcceptTemplateTeam = nextProps.bugBash.getFieldValue<string>(BugBashFieldNames.AcceptTemplateTeam);

        if (this.props.bugBash.id !== nextProps.bugBash.id) {
            this._dismissErrorMessage();
        }

        if (nextAcceptTemplateTeam) {
            if (StoresHub.workItemTemplateStore.isLoaded(nextAcceptTemplateTeam)) {
                const templates = StoresHub.workItemTemplateStore.getItem(nextAcceptTemplateTeam).map((template: WorkItemTemplateReference) => {
                    return {
                        key: template.id.toLowerCase(),
                        text: template.name
                    };
                });

                this.setState({templates: templates} as IBugBashEditorState);
            }
            else {
                WorkItemTemplateActions.initializeWorkItemTemplates(nextAcceptTemplateTeam);
            }
        }
        else {
            this.setState({templates: []} as IBugBashEditorState);
        }
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }

        return (
            <div className="bugbash-editor">
                { this.state.error &&
                    <MessageBar
                        className="message-panel"
                        messageBarType={MessageBarType.error}
                        onDismiss={this._dismissErrorMessage}
                    >
                        {this.state.error}
                    </MessageBar>
                }
                {this._renderEditor()}
            </div>
        );
    }

    protected getInitialState(): IBugBashEditorState {
        return {
            loading: true,
            templates: []
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [
            StoresHub.bugBashStore,
            StoresHub.workItemFieldStore,
            StoresHub.teamStore, StoresHub.workItemTemplateStore, StoresHub.workItemTypeStore, StoresHub.errorMessageStore];
    }

    protected getStoresState(): IBugBashEditorState {
        let state = {
            loading: StoresHub.workItemTypeStore.isLoading() || StoresHub.workItemFieldStore.isLoading() || StoresHub.teamStore.isLoading(),
            error: StoresHub.errorMessageStore.getItem(ErrorKeys.BugBashError)
        } as IBugBashEditorState;

        const acceptTemplateTeam = this.props.bugBash.getFieldValue<string>(BugBashFieldNames.AcceptTemplateTeam);
        if (!isNullOrWhiteSpace(acceptTemplateTeam) && StoresHub.workItemTemplateStore.isLoaded(acceptTemplateTeam)) {
            const templates = StoresHub.workItemTemplateStore.getItem(acceptTemplateTeam).map((template: WorkItemTemplateReference) => {
                return {
                    key: template.id.toLowerCase(),
                    text: template.name
                };
            });

            state = {...state, templates: templates};
        }

        return state;
    }

    private _renderEditor(): JSX.Element {
        const bugBash = this.props.bugBash;
        const isBugBashLoading = !this.props.bugBash.isNew() ? StoresHub.bugBashStore.isLoading(this.props.bugBash.id) : StoresHub.bugBashStore.isLoading();

        const bugBashTitle = bugBash.getFieldValue<string>(BugBashFieldNames.Title);
        const workItemTypeName = bugBash.getFieldValue<string>(BugBashFieldNames.WorkItemType);
        const startTime = bugBash.getFieldValue<Date>(BugBashFieldNames.StartTime);
        const endTime = bugBash.getFieldValue<Date>(BugBashFieldNames.EndTime);
        const itemDescriptionField = bugBash.getFieldValue<string>(BugBashFieldNames.ItemDescriptionField);
        const acceptTemplateId = bugBash.getFieldValue<string>(BugBashFieldNames.AcceptTemplateId);
        const acceptTemplateTeamId = bugBash.getFieldValue<string>(BugBashFieldNames.AcceptTemplateTeam);
        const defaultTeamId = bugBash.getFieldValue<string>(BugBashFieldNames.DefaultTeam);

        const defaultTeam = StoresHub.teamStore.getItem(defaultTeamId);
        const acceptTemplateTeam = StoresHub.teamStore.getItem(acceptTemplateTeamId);
        const workItemType = StoresHub.workItemTypeStore.getItem(workItemTypeName);
        const field = StoresHub.workItemFieldStore.getItem(itemDescriptionField);

        return (
            <div className="bugbash-editor-contents" onKeyDown={this._onEditorKeyDown} tabIndex={0}>
                {isBugBashLoading && <Overlay className="loading-overlay"><Loading /></Overlay>}
                <div className="title-container">
                    <ThrottledTextField
                        label="Title"
                        maxLength={SizeLimits.TitleFieldMaxLength}
                        value={bugBashTitle}
                        delay={200}
                        required={true}
                        onChanged={this._onTitleChange}
                    />
                </div>
                <div className="section-container">
                    <div className="first-section">
                        <DatePicker
                            className="editor-control"
                            label="Start Date"
                            allowTextInput={true}
                            isRequired={false}
                            value={startTime}
                            onSelectDate={this._onStartDateChange}
                        />
                        <DatePicker
                            label="Finish Date"
                            className="editor-control"
                            allowTextInput={true}
                            isRequired={false}
                            value={endTime}
                            onSelectDate={this._onEndDateChange}
                        />
                        {startTime
                            && endTime
                            && defaultDateComparer(startTime, endTime) >= 0 &&  <InputError error="Bugbash end time cannot be a date before bugbash start time." />}
                        <WorkItemTypePicker
                            className="editor-control"
                            selectedOption={workItemType}
                            selectedValue={workItemTypeName}
                            onChange={this._onWorkItemTypeChange}
                            delay={200}
                            label="Work item type"
                            info="Select a work item type which would be used to create work items for each bug bash item"
                            required={true}
                        />
                        <WorkItemFieldPicker
                            selectedOption={field}
                            selectedValue={itemDescriptionField}
                            className="editor-control"
                            delay={200}
                            allowedFieldTypes={[FieldType.Html]}
                            label="Description field"
                            info="Select a HTML field that you would want to set while creating a workitem for each bug bash item"
                            required={true}
                            onChange={this._onFieldChange}
                        />
                    </div>
                    <div className="second-section">
                        <div className="checkbox-container">
                            <Checkbox
                                className="auto-accept"
                                label=""
                                checked={bugBash.getFieldValue<boolean>(BugBashFieldNames.AutoAccept)}
                                onChange={this._onAutoAcceptChange}
                            />

                            <InfoLabel label="Auto Accept?" info="Auto create work items on creation of a bug bash item" />
                        </div>

                        <TeamPicker
                            selectedOption={acceptTemplateTeam}
                            selectedValue={acceptTemplateTeamId}
                            className="editor-control"
                            delay={200}
                            required={true}
                            label="Template Team"
                            info="Select a team to pull its templates."
                            onChange={this._onTemplateTeamChange}
                        />

                        <TeamPicker
                            selectedOption={defaultTeam}
                            selectedValue={defaultTeamId}
                            className="editor-control"
                            delay={200}
                            label="Default Team"
                            info="Pick a default team for bug bash items in this bug bash."
                            onChange={this._onDefaultTeamChange}
                        />

                        <div className="template-info-container">
                            <InfoLabel label="Work item template" info="Select a work item template that would be applied during work item creation." />
                            {workItemType && acceptTemplateTeam && <Link href={this._getTemplatePageUrl(acceptTemplateTeamId, workItemType.name)} target="_blank">Add a template</Link>}
                        </div>
                        <Dropdown
                            selectedKey={acceptTemplateId.toLowerCase()}
                            onRenderList={this._onRenderCallout}
                            options={this.state.templates}
                            onChanged={this._onTemplateChange}
                        />
                        {!acceptTemplateId && <InputError error="A work item template is required." />}
                    </div>
                </div>
            </div>
        );
    }

    private _getTemplatePageUrl(teamId: string, workItemType?: string): string {
        const webContext = VSS.getWebContext();
        let url = `${webContext.collection.uri}/${webContext.project.id}/${teamId}/_admin/_work?_a=templates`;
        if (workItemType) {
            url = `${url}&type=${workItemType}`;
        }

        return url;
    }

    private _onChange<T extends string | boolean | Date | number>(fieldName: BugBashFieldNames, fieldValue: T) {
        this.props.bugBash.setFieldValue<T>(fieldName, fieldValue);
    }

    private _dismissErrorMessage = () => {
        setTimeout(
            () => {
                ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashError);
            },
            0
        );
    }

    private _onRenderCallout = (props?: IDropdownProps, defaultRender?: (props?: IDropdownProps) => JSX.Element): JSX.Element => {
        return (
            <div className="callout-container">
                {defaultRender(props)}
            </div>
        );
    }

    private _onEditorKeyDown = (e: React.KeyboardEvent<any>) => {
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            this.props.bugBash.save();
        }
    }

    private _onTitleChange = (value: string) => {
        this._onChange(BugBashFieldNames.Title, value);
    }

    private _onStartDateChange = (value: Date) => {
        this._onChange(BugBashFieldNames.StartTime, value);
    }

    private _onEndDateChange = (value: Date) => {
        this._onChange(BugBashFieldNames.EndTime, value);
    }

    private _onAutoAcceptChange = (_ev: React.FormEvent<HTMLElement>, isChecked: boolean) => {
        this._onChange(BugBashFieldNames.AutoAccept, isChecked);
    }

    private _onTemplateChange = (option: IDropdownOption) => {
        this._onChange(BugBashFieldNames.AcceptTemplateId, option.key as string);
    }

    private _onFieldChange = (field: WorkItemField, value?: string) => {
        this._onChange(BugBashFieldNames.ItemDescriptionField, field ? field.referenceName : value);
    }

    private _onWorkItemTypeChange = (witType: WorkItemType, value?: string) => {
        this._onChange(BugBashFieldNames.WorkItemType, witType ? witType.name : value);
    }

    private _onTemplateTeamChange = (team: WebApiTeam, value?: string) => {
        this.props.bugBash.setFieldValue<string>(BugBashFieldNames.AcceptTemplateId, "", false);
        this._onChange(BugBashFieldNames.AcceptTemplateTeam, team ? team.id : value);
    }

    private _onDefaultTeamChange = (team: WebApiTeam, value?: string) => {
        this._onChange(BugBashFieldNames.DefaultTeam, team ? team.id : value);
    }
}
