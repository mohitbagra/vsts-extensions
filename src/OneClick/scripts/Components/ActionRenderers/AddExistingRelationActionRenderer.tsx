import * as React from "react";

import { Loading } from "Library/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { ThrottledTextField } from "Library/Components/Utilities/ThrottledTextField";
import { WorkItemRelationTypePicker } from "Library/Components/VSTS/WorkItemRelationTypePicker";
import { WorkItemRelationTypeActions } from "Library/Flux/Actions/WorkItemRelationTypeActions";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { autobind, css } from "OfficeFabric/Utilities";
import { StoresHub } from "OneClick/Flux/Stores/StoresHub";
import { WorkItemRelationType } from "TFS/WorkItemTracking/Contracts";

export interface IAddExistingRelationActionRendererProps extends IBaseFluxComponentProps {
    workItemId: string;
    relationType: string;
    valueError?: string;
    onWorkItemIdChange(value: string): void;
    onRelationTypeChange(value: string): void;
}

export class AddExistingRelationActionRenderer extends BaseFluxComponent<IAddExistingRelationActionRendererProps, IBaseFluxComponentState> {
    public componentDidMount() {
        super.componentDidMount();
        WorkItemRelationTypeActions.initializeWorkItemRelationTypes();
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }

        const selectedRelationType: WorkItemRelationType = StoresHub.workItemRelationTypeStore.getItem(this.props.relationType);

        return (
            <div className={css("add-existing-relation-picker", this.props.className)}>
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
                <ThrottledTextField
                    className="action-property-control"
                    value={this.props.workItemId}
                    label="Work item id"
                    required={true}
                    info="Either add a work item id or use @fieldValue macro to pull work item id from a field value"
                    onChanged={this._onWorkItemIdChange}
                    delay={200}
                    errorMessage={this.props.valueError}
                />
            </div>
        );
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.workItemRelationTypeStore];
    }

    protected getStoresState(): IBaseFluxComponentState {
        return {
            loading: StoresHub.workItemRelationTypeStore.isLoading(),
        };
    }

    protected initializeState(): void {
        this.state = {
            loading: true
        };
    }

    @autobind
    private _onWorkItemIdChange(value: string) {
        this.props.onWorkItemIdChange(value);
    }

    @autobind
    private _onWorkItemRelationTypeChange(witRelationType: WorkItemRelationType, value?: string) {
        this.props.onRelationTypeChange(witRelationType ? witRelationType.name : value);
    }
}
