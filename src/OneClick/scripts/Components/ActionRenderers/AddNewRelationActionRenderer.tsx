import "./AddNewRelationActionRenderer.scss";

import * as React from "react";

import { InfoLabel } from "Library/Components/InfoLabel";
import { InputError } from "Library/Components/InputError";
import { Loading } from "Library/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { TeamPicker } from "Library/Components/VSTS/TeamPicker";
import { WorkItemRelationTypePicker } from "Library/Components/VSTS/WorkItemRelationTypePicker";
import { WorkItemTypePicker } from "Library/Components/VSTS/WorkItemTypePicker";
import { TeamActions } from "Library/Flux/Actions/TeamActions";
import { WorkItemRelationTypeActions } from "Library/Flux/Actions/WorkItemRelationTypeActions";
import { WorkItemTemplateActions } from "Library/Flux/Actions/WorkItemTemplateActions";
import { WorkItemTypeActions } from "Library/Flux/Actions/WorkItemTypeActions";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { isNullOrWhiteSpace, stringEquals } from "Library/Utilities/String";
import { Dropdown, IDropdownOption, IDropdownProps } from "OfficeFabric/Dropdown";
import { Link } from "OfficeFabric/Link";
import { autobind, css } from "OfficeFabric/Utilities";
import { StoresHub } from "OneClick/Flux/Stores/StoresHub";
import { WebApiTeam } from "TFS/Core/Contracts";
import {
    WorkItemRelationType, WorkItemTemplateReference, WorkItemType
} from "TFS/WorkItemTracking/Contracts";

export interface IAddNewRelationActionRendererProps extends IBaseFluxComponentProps {
    workItemType: string;
    relationType: string;
    teamId: string;
    templateId: string;
    onWorkItemTypeChange(value: string): void;
    onRelationTypeChange(value: string): void;
    onTeamChange(value: string): void;
    onTemplateChange(value: string): void;
}

export interface IAddNewRelationActionRendererState extends IBaseFluxComponentState {
    templates?: WorkItemTemplateReference[];
}

export class AddNewRelationActionRenderer extends BaseFluxComponent<IAddNewRelationActionRendererProps, IAddNewRelationActionRendererState> {
    public componentDidMount() {
        super.componentDidMount();
        WorkItemTypeActions.initializeWorkItemTypes();
        WorkItemRelationTypeActions.initializeWorkItemRelationTypes();
        TeamActions.initializeTeams();

        if (!isNullOrWhiteSpace(this.props.teamId)) {
            this._loadTemplates(this.props.teamId);
        }
    }

    public componentWillReceiveProps(nextProps: IAddNewRelationActionRendererProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);

        if (!isNullOrWhiteSpace(nextProps.teamId)) {
            if (!stringEquals(nextProps.teamId, this.props.teamId, true)) {
                if (StoresHub.workItemTemplateStore.isLoaded(nextProps.teamId)) {
                    this.setState({templates: StoresHub.workItemTemplateStore.getItem(nextProps.teamId)});
                }
                else {
                    this._loadTemplates(nextProps.teamId);
                }
            }
        }
        else {
            this.setState({templates: []});
        }
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }

        const selectedWit: WorkItemType = StoresHub.workItemTypeStore.getItem(this.props.workItemType);
        const selectedRelationType: WorkItemRelationType = StoresHub.workItemRelationTypeStore.getItem(this.props.relationType);
        const selectedTeam: WebApiTeam = StoresHub.teamStore.getItem(this.props.teamId);
        const selectedTemplate: WorkItemTemplateReference = StoresHub.workItemTemplateStore.getTemplate(this.props.templateId);

        const templateDropdownOptions = this.state.templates
            .filter(t => isNullOrWhiteSpace(this.props.workItemType) || stringEquals(t.workItemTypeName, this.props.workItemType, true))
            .map((template: WorkItemTemplateReference) => {
                return {
                    key: template.id.toLowerCase(),
                    text: template.name
                };
            });

        return (
            <div className={css("add-new-relation-picker", this.props.className)}>
                <WorkItemTypePicker
                    className="action-property-control"
                    selectedOption={selectedWit}
                    selectedValue={this.props.workItemType}
                    onChange={this._onWorkItemTypeChange}
                    label="Work item type"
                    info="Select a work item type for the linked workitem"
                    delay={200}
                    required={true}
                />
                <WorkItemRelationTypePicker
                    className="action-property-control"
                    selectedOption={selectedRelationType}
                    selectedValue={this.props.relationType}
                    onChange={this._onWorkItemRelationTypeChange}
                    label="Work item relation type"
                    info="Select a work item relation type to link the workitems"
                    delay={200}
                    required={true}
                />
                <TeamPicker
                    className="action-property-control"
                    selectedOption={selectedTeam}
                    selectedValue={this.props.teamId}
                    onChange={this._onTeamChange}
                    label="Team"
                    info="Select a team to pick its work item templates"
                    delay={200}
                    required={true}
                />

                <div className="template-info-container">
                    <InfoLabel label="Work item template" info="Select a work item template that would be applied during linked work item creation." />
                    {selectedTeam && <Link href={this._getTemplatePageUrl(this.props.teamId, this.props.workItemType)} target="_blank">Add a template</Link>}
                </div>
                <Dropdown
                    selectedKey={this.props.templateId.toLowerCase()}
                    onRenderList={this._onRenderCallout}
                    options={templateDropdownOptions}
                    onChanged={this._onTemplateChange}
                />

                {!this.props.templateId && <InputError error="A work item template is required." />}
                {this.props.templateId && !selectedTemplate && <InputError error="This template doesnt exist." />}
            </div>
        );
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.teamStore, StoresHub.workItemTypeStore, StoresHub.workItemRelationTypeStore, StoresHub.workItemTemplateStore];
    }

    protected getStoresState(): IAddNewRelationActionRendererState {
        return {
            loading: StoresHub.workItemTypeStore.isLoading() || StoresHub.teamStore.isLoading() || StoresHub.workItemRelationTypeStore.isLoading(),
            templates: StoresHub.workItemTemplateStore.getItem(this.props.teamId || "") || []
        };
    }

    protected initializeState(): void {
        this.state = {
            loading: true,
            templates: []
        };
    }

    private _getTemplatePageUrl(teamId: string, workItemType?: string): string {
        const webContext = VSS.getWebContext();
        let url = `${webContext.collection.uri}/${webContext.project.id}/${teamId}/_admin/_work?_a=templates`;
        if (workItemType) {
            url = `${url}&type=${workItemType}`;
        }

        return url;
    }

    private async _loadTemplates(teamId: string) {
        try {
            await WorkItemTemplateActions.initializeWorkItemTemplates(teamId);
        }
        catch {
            // eat
        }
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
    private _onWorkItemTypeChange(witType: WorkItemType, value?: string) {
        this.props.onWorkItemTypeChange(witType ? witType.name : value);
    }

    @autobind
    private _onWorkItemRelationTypeChange(witRelationType: WorkItemRelationType, value?: string) {
        this.props.onRelationTypeChange(witRelationType ? witRelationType.name : value);
    }

    @autobind
    private _onTeamChange(team: WebApiTeam, value?: string) {
        this.props.onTeamChange(team ? team.id : value);
    }

    @autobind
    private _onTemplateChange(option: IDropdownOption) {
        this.props.onTemplateChange(option.key as string);
    }
}
