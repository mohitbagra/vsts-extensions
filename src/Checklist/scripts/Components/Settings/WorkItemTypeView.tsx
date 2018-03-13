import "../ChecklistView.scss";

import * as React from "react";
import { arrayMove, SortableContainer, SortableElement, SortableHandle } from "react-sortable-hoc";

import { ChecklistActions } from "Checklist/Actions/ChecklistActions";
import { ChecklistItem } from "Checklist/Components/ChecklistItem";
import { ChecklistItemEditor } from "Checklist/Components/ChecklistItemEditor";
import { IChecklistItem, IWorkItemChecklist } from "Checklist/Interfaces";
import { StoresHub } from "Checklist/Stores/StoresHub";
import { Loading } from "Library/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { findIndex } from "Library/Utilities/Array";
import { isNullOrWhiteSpace, stringEquals } from "Library/Utilities/String";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { Modal } from "OfficeFabric/Modal";
import { autobind } from "OfficeFabric/Utilities";
import { Hub } from "VSSUI/Components/Hub";
import { HubHeader } from "VSSUI/Components/HubHeader";
import { IPivotBarAction, PivotBarItem } from "VSSUI/Components/PivotBar";
import { HubViewState, IHubViewState } from "VSSUI/Utilities/HubViewState";
import { VssIcon, VssIconType } from "VSSUI/VssIcon";

const DragHandle = SortableHandle(() => <VssIcon className="drag-handle" iconName="GlobalNavButton" iconType={VssIconType.fabric} />);

const SortableItem = SortableElement(({value}) => {
    return (
        <div className="checklist-item-container">
            <DragHandle />
            {value}
        </div>
    );
});

const SortableList = SortableContainer(({items}) => {
    return (
        <div className="checklist-items">
            {items.map((value, index) => (
                <SortableItem key={`item-${index}`} index={index} value={value} />
            ))}
        </div>
    );
});

export interface IWorkItemTypeViewProps extends IBaseFluxComponentProps {
    workItemType: string;
}

export interface IWorkItemTypeViewState extends IBaseFluxComponentState {
    checklist: IWorkItemChecklist;
    error?: string;
    disabled?: boolean;
    editItem?: IChecklistItem;
}

export class WorkItemTypeView extends BaseFluxComponent<IWorkItemTypeViewProps, IWorkItemTypeViewState> {
    private _hubViewState: IHubViewState;

    constructor(props: IWorkItemTypeViewProps, context?: any) {
        super(props, context);
        this._hubViewState = new HubViewState();
        this._hubViewState.selectedPivot.value = "Default";
    }

    public componentDidMount() {
        super.componentDidMount();
        this._refresh();
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this._clearStores();
    }

    public componentWillReceiveProps(nextProps: IWorkItemTypeViewProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);

        if (!stringEquals(this.props.workItemType, nextProps.workItemType, true)) {
            this._refresh(nextProps.workItemType);
        }
    }

    public render(): JSX.Element {
        return (
            <Hub
                className="rule-group-list-hub"
                hubViewState={this._hubViewState}
                hideFullScreenToggle={true}
                commands={this._getHubCommands()}
            >
                <HubHeader title={`Default checklist items for "${this.props.workItemType}"`} />

                <PivotBarItem name="Default" itemKey="Default">
                    {this._renderChecklistView()}
                </PivotBarItem>
            </Hub>
        );
    }

    protected initializeState() {
        this.state = {
            checklist: null,
            disabled: false,
            error: null,
            editItem: null
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.checklistStore, StoresHub.errorMessageStore];
    }

    protected getStoresState(): IWorkItemTypeViewState {
        const {workItemType} = this.props;
        const checklist = this._getChecklist(workItemType);
        const error = StoresHub.errorMessageStore.getItem("ChecklistError");

        let newState: IWorkItemTypeViewState = {
            disabled: StoresHub.checklistStore.isLoading(workItemType) || !isNullOrWhiteSpace(error),
            error: error
        } as IWorkItemTypeViewState;

        if (!StoresHub.checklistStore.isLoading(workItemType)) {
            newState = {...newState, checklist: checklist};
        }
        return newState;
    }

    private _getHubCommands(): IPivotBarAction[] {
        return [
            {
                key: "refresh",
                name: "Refresh",
                disabled: this.state.checklist == null,
                important: true,
                iconProps: { iconName: "Refresh", iconType: VssIconType.fabric },
                onClick: () => this._refresh()
            }
        ];
    }

    private _renderChecklistView(): JSX.Element {
        const {checklist, disabled} = this.state;

        if (checklist == null) {
            return <Loading />;
        }
        return (
            <div className="checklist-view">
                {this._renderZeroDataMessage()}
                {this._renderEditView()}
                {this._renderError()}
                <div className="checklist-items-container">
                    {this._renderChecklistItems()}
                </div>
                <ChecklistItemEditor
                    inputPlaceholder="Add new item"
                    disabled={disabled}
                    onSubmit={this._addChecklistItem}
                />
            </div>
        );
    }

    @autobind
    private _renderChecklistItem(checklistItem: IChecklistItem): JSX.Element {
        return (
            <ChecklistItem
                checklistItem={checklistItem}
                disabled={this.state.disabled}
                allowEditDefaultItems={true}
                disableStateChange={true}
                onEdit={this._editChecklistItem}
                onDelete={this._deleteChecklistItem}
            />
        );
    }

    private _renderZeroDataMessage(): JSX.Element {
        const {checklist} = this.state;
        if (checklist.checklistItems == null || checklist.checklistItems.length === 0) {
            return (
                <MessageBar messageBarType={MessageBarType.info} className="message-bar">
                    {`No default checklist items created for "${this.props.workItemType}".`}
                </MessageBar>
            );
        }
        return null;
    }

    private _renderEditView(): JSX.Element {
        if (this.state.editItem) {
            return (
                <Modal
                    isOpen={true}
                    onDismiss={this._cancelItemEdit}
                    isBlocking={false}
                    containerClassName="edit-checklist-item-overlay"
                >
                    <ChecklistItemEditor
                        checklistItem={this.state.editItem}
                        onSubmit={this._updateChecklistItem}
                        onCancel={this._cancelItemEdit}
                        autoFocus={true}
                    />
                </Modal>
            );
        }
        return null;
    }

    private _renderError(): JSX.Element {
        const error = this.state.error;
        if (error) {
            return (
                <MessageBar className="error-message" messageBarType={MessageBarType.error}>
                    {error}
                </MessageBar>
            );
        }
        return null;
    }

    private _renderChecklistItems(): JSX.Element {
        const {checklist} = this.state;
        if (checklist.checklistItems != null && checklist.checklistItems.length > 0) {
            const items = checklist.checklistItems.map(this._renderChecklistItem);
            return (
                <SortableList
                    items={items}
                    axis="y"
                    lockAxis="y"
                    onSortEnd={this._reorderChecklistItem}
                    useDragHandle={true}
                />
            );
        }
        return null;
    }

    private _refresh(workItemType?: string) {
        const workItemTypeName = workItemType || this.props.workItemType;
        this._clearStores(workItemTypeName);

        this.setState({checklist: null, editItem: null, error: null, disabled: false});
        ChecklistActions.initializeChecklistForWorkItemType(workItemTypeName);
    }

    private _clearStores(currentWorkItemType?: string) {
        StoresHub.checklistStore.clear();
        StoresHub.checklistStore.setCurrentWorkItemType(currentWorkItemType);
    }

    @autobind
    private _editChecklistItem(item: IChecklistItem) {
        this.setState({editItem: {...item}});
    }

    @autobind
    private _cancelItemEdit() {
        this.setState({editItem: null});
    }

    @autobind
    private async _reorderChecklistItem(data: {oldIndex: number, newIndex: number}) {
        const {oldIndex, newIndex} = data;
        if (oldIndex !== newIndex) {
            const {checklist} = this.state;
            const newChecklistItems = arrayMove([...checklist.checklistItems], oldIndex, newIndex);
            this._updateChecklist(newChecklistItems);
        }
    }

    @autobind
    private _deleteChecklistItem(item: IChecklistItem) {
        const {checklist} = this.state;
        const newChecklistItems = checklist.checklistItems.filter((i: IChecklistItem) => !stringEquals(i.id, item.id, true));
        if (newChecklistItems.length !== checklist.checklistItems.length) {
            this._updateChecklist(newChecklistItems);
        }
    }

    @autobind
    private async _addChecklistItem(checklistItem: IChecklistItem) {
        const {checklist} = this.state;
        const newChecklistItem = {...checklistItem, id: `dci_${Date.now()}`, isDefault: true};
        const newChecklistItems = (checklist.checklistItems || []).concat(newChecklistItem);

        this._updateChecklist(newChecklistItems);
    }

    @autobind
    private _updateChecklistItem(item: IChecklistItem) {
        const {checklist} = this.state;
        const newChecklistItems = [...checklist.checklistItems];
        const index = findIndex(newChecklistItems, (i: IChecklistItem) => stringEquals(i.id, item.id, true));
        if (index !== -1) {
            newChecklistItems[index] = {...newChecklistItems[index], text: item.text, required: item.required};
            this._updateChecklist(newChecklistItems);
        }

        this._cancelItemEdit();
    }

    private async _updateChecklist(checklistItems: IChecklistItem[]) {
        const checklist = {...this.state.checklist};
        checklist.checklistItems = checklistItems;

        this.setState({checklist: checklist});
        ChecklistActions.updateChecklistForWorkItemType(checklist);
    }

    private _getChecklist(workItemType: string): IWorkItemChecklist {
        if (isNullOrWhiteSpace(workItemType)) {
            return null;
        }

        const checklists = StoresHub.checklistStore.getItem(this.props.workItemType);
        return checklists == null ? null : checklists.shared;
    }
}
