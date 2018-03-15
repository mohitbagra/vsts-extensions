import "./ChecklistView.scss";

import * as React from "react";
import { arrayMove, SortableContainer, SortableElement, SortableHandle } from "react-sortable-hoc";

import { ChecklistActions } from "Checklist/Actions/ChecklistActions";
import { ChecklistItem } from "Checklist/Components/ChecklistItem";
import { ChecklistItemEditor } from "Checklist/Components/ChecklistItemEditor";
import {
    ChecklistItemState, ChecklistType, IChecklistItem, IWorkItemChecklist, IWorkItemChecklists
} from "Checklist/Interfaces";
import { StoresHub } from "Checklist/Stores/StoresHub";
import { Loading } from "Library/Components/Loading";
import { AutoResizableComponent } from "Library/Components/Utilities/AutoResizableComponent";
import {
    IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { findIndex } from "Library/Utilities/Array";
import { delegate } from "Library/Utilities/Core";
import { isNullOrWhiteSpace, stringEquals } from "Library/Utilities/String";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { Modal } from "OfficeFabric/Modal";
import { autobind } from "OfficeFabric/Utilities";
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

export interface IChecklistViewProps extends IBaseFluxComponentProps {
    workItemId: number;
    workItemType: string;
    projectId: string;
    isPersonal?: boolean;
}

export interface IChecklistViewState extends IBaseFluxComponentState {
    checklists: IWorkItemChecklists;
    error?: string;
    disabled?: boolean;
    editChecklistItem?: IChecklistItem;
    editChecklistItemType?: ChecklistType;
}

export class ChecklistView extends AutoResizableComponent<IChecklistViewProps, IChecklistViewState> {
    public componentDidMount() {
        super.componentDidMount();
        if (this.state.checklists == null) {
            ChecklistActions.initializeChecklists(this.props.workItemId, this.props.workItemType, this.props.projectId);
        }
    }

    public componentWillReceiveProps(nextProps: IChecklistViewProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);
        if (this.props.workItemId !== nextProps.workItemId) {
            const checklist = this._getChecklists(nextProps.workItemId);
            if (checklist) {
                this.setState({checklists: checklist, editChecklistItem: null, error: null, disabled: false});
            }
            else {
                this.setState({checklists: null, editChecklistItem: null, error: null, disabled: false});
                ChecklistActions.initializeChecklists(nextProps.workItemId, nextProps.workItemType, nextProps.projectId);
            }
        }
    }

    public render(): JSX.Element {
        const {checklists, disabled} = this.state;
        const {isPersonal} = this.props;

        if (checklists == null) {
            return <Loading />;
        }
        else {
            return (
                <div className="checklist-view">
                    {this._renderEditView()}
                    {this._renderError()}
                    {this._renderChecklistItemsContainer()}
                    <ChecklistItemEditor
                        inputPlaceholder="Add new item"
                        disabled={disabled}
                        onSubmit={delegate(this, this._addChecklistItem, isPersonal ? ChecklistType.Personal : ChecklistType.Shared)}
                    />
                </div>
            );
        }
    }

    protected initializeState() {
        const {workItemId} = this.props;
        const error = StoresHub.errorMessageStore.getItem("ChecklistError");

        this.state = {
            checklists: this._getChecklists(workItemId),
            disabled: StoresHub.checklistStore.isLoading(`${workItemId}`) || !isNullOrWhiteSpace(error),
            error: error,
            editChecklistItem: null
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.checklistStore, StoresHub.errorMessageStore];
    }

    protected getStoresState(): IChecklistViewState {
        const {workItemId} = this.props;
        const checklists = this._getChecklists(workItemId);
        const error = StoresHub.errorMessageStore.getItem("ChecklistError");

        let newState: IChecklistViewState = {
            disabled: StoresHub.checklistStore.isLoading(`${workItemId}`) || !isNullOrWhiteSpace(error),
            error: error
        } as IChecklistViewState;

        if (!StoresHub.checklistStore.isLoading(`${workItemId}`)) {
            newState = {...newState, checklists: checklists};
        }
        return newState;
    }

    private _renderChecklistItemsContainer(): JSX.Element {
        const {checklists} = this.state;

        if (this.props.isPersonal) {
            return (
                <div className="checklist-items-container">
                    {this._renderChecklistItems(checklists.personal.checklistItems, ChecklistType.Personal)}
                </div>
            );
        }
        else {
            return (
                <div className="checklist-items-container">
                    <div>
                        <div className="checklist-items-label">Default items</div>
                        {this._renderChecklistItems(checklists.witDefault.checklistItems, ChecklistType.WitDefault)}
                    </div>
                    <div style={{marginTop: "10px"}}>
                        <div className="checklist-items-label">Custom items</div>
                        {this._renderChecklistItems(checklists.shared.checklistItems, ChecklistType.Shared)}
                    </div>
                </div>
            );
        }
    }

    private _renderChecklistItems(checklistItems: IChecklistItem[], checklistType: ChecklistType): JSX.Element {
        if (checklistItems == null || checklistItems.length === 0) {
            return this._renderZeroDataMessage(checklistType);
        }

        const items = checklistItems.map(i => this._renderChecklistItem(i, checklistType));
        if (checklistType === ChecklistType.WitDefault) {
            return (
                <div className="checklist-items">
                    {items.map(i => (
                        <div className="checklist-item-container" style={{paddingLeft: "19px"}} >
                            {i}
                        </div>
                    ))}
                </div>
            );
        }
        else {
            return (
                <SortableList
                    items={items}
                    axis="y"
                    lockAxis="y"
                    onSortEnd={delegate(this, this._reorderChecklistItem, checklistType)}
                    useDragHandle={true}
                />
            );
        }
    }

    private _renderZeroDataMessage(checklistType: ChecklistType): JSX.Element {
        const message = checklistType === ChecklistType.WitDefault ? "No default checklist items configured for this work item type" : "No checklist items added";
        return (
            <MessageBar messageBarType={MessageBarType.info} className="message-bar">
                {message}
            </MessageBar>
        );
    }

    @autobind
    private _renderChecklistItem(checklistItem: IChecklistItem, checklistType: ChecklistType): JSX.Element {
        return (
            <ChecklistItem
                checklistItem={checklistItem}
                disabled={this.state.disabled}
                onEdit={delegate(this, this._editChecklistItem, checklistType)}
                onDelete={delegate(this, this._deleteChecklistItem, checklistType)}
                onToggleCheck={delegate(this, this._onToggleChecklistItem, checklistType)}
            />
        );
    }

    private _renderEditView(): JSX.Element {
        const {editChecklistItem, editChecklistItemType} = this.state;
        if (editChecklistItem) {
            return (
                <Modal
                    isOpen={true}
                    onDismiss={this._cancelItemEdit}
                    isBlocking={false}
                    containerClassName="edit-checklist-item-overlay"
                >
                    <ChecklistItemEditor
                        checklistItem={editChecklistItem}
                        onSubmit={delegate(this, this._updateChecklistItem, editChecklistItemType)}
                        onCancel={this._cancelItemEdit}
                        showStatePicker={true}
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

    @autobind
    private _editChecklistItem(checklistItem: IChecklistItem, checklistType: ChecklistType) {
        this.setState({editChecklistItem: {...checklistItem}, editChecklistItemType: checklistType});
    }

    @autobind
    private _cancelItemEdit() {
        this.setState({editChecklistItem: null, editChecklistItemType: null});
    }

    @autobind
    private _onToggleChecklistItem(checklistItem: IChecklistItem, checked: boolean, checklistType: ChecklistType) {
        const checklist = this._getWorkItemChecklistFromType(checklistType);
        const newChecklistItems = [...checklist.checklistItems];
        const index = findIndex(newChecklistItems, (i: IChecklistItem) => stringEquals(i.id, checklistItem.id, true));
        if (index !== -1) {
            newChecklistItems[index] = {...newChecklistItems[index], state: checked ? ChecklistItemState.Completed : ChecklistItemState.New};
            this._updateChecklist(newChecklistItems, checklistType);
        }
    }

    @autobind
    private async _reorderChecklistItem(data: {oldIndex: number, newIndex: number}, checklistType: ChecklistType) {
        const {oldIndex, newIndex} = data;

        if (oldIndex !== newIndex) {
            const checklist = this._getWorkItemChecklistFromType(checklistType);
            const newChecklistItems = arrayMove([...checklist.checklistItems], oldIndex, newIndex);
            this._updateChecklist(newChecklistItems, checklistType);
        }
    }

    @autobind
    private _deleteChecklistItem(checklistItem: IChecklistItem, checklistType: ChecklistType) {
        const checklist = this._getWorkItemChecklistFromType(checklistType);
        const newChecklistItems = checklist.checklistItems.filter((i: IChecklistItem) => !stringEquals(i.id, checklistItem.id, true));
        if (newChecklistItems.length !== checklist.checklistItems.length) {
            this._updateChecklist(newChecklistItems, checklistType);
        }
    }

    @autobind
    private async _addChecklistItem(checklistItem: IChecklistItem, checklistType: ChecklistType) {
        const checklist = this._getWorkItemChecklistFromType(checklistType);
        const newChecklistItem = {...checklistItem, id: `${Date.now()}`};
        const newChecklistItems = (checklist.checklistItems || []).concat(newChecklistItem);

        this._updateChecklist(newChecklistItems, checklistType);
    }

    @autobind
    private _updateChecklistItem(checklistItem: IChecklistItem, checklistType: ChecklistType) {
        const checklist = this._getWorkItemChecklistFromType(checklistType);
        const newChecklistItems = [...checklist.checklistItems];
        const index = findIndex(newChecklistItems, (i: IChecklistItem) => stringEquals(i.id, checklistItem.id, true));
        if (index !== -1) {
            newChecklistItems[index] = {...newChecklistItems[index], text: checklistItem.text, required: checklistItem.required, state: checklistItem.state};
            this._updateChecklist(newChecklistItems, checklistType);
        }

        this._cancelItemEdit();
    }

    private async _updateChecklist(checklistItems: IChecklistItem[], checklistType: ChecklistType) {
        const checklist = {...this._getWorkItemChecklistFromType(checklistType)};
        checklist.checklistItems = checklistItems;

        const newChecklistsState = {...this.state.checklists};
        switch (checklistType) {
            case ChecklistType.Personal:
                newChecklistsState.personal = checklist;
                break;
            case ChecklistType.Shared:
                newChecklistsState.shared = checklist;
                break;
            default:
                newChecklistsState.witDefault = checklist;
                break;
        }

        this.setState({checklists: newChecklistsState});
        ChecklistActions.updateChecklist(checklist, checklistType);
    }

    private _getChecklists(workItemId: number): IWorkItemChecklists {
        if (workItemId == null || workItemId === 0) {
            return null;
        }

        return StoresHub.checklistStore.getItem(this.props.workItemId.toString());
    }

    private _getWorkItemChecklistFromType(checklistType: ChecklistType): IWorkItemChecklist {
        const { checklists } = this.state;
        if (checklists == null) {
            return null;
        }

        switch (checklistType) {
            case ChecklistType.Personal:
                return checklists.personal;
            case ChecklistType.Shared:
                return checklists.shared;
            default:
                return checklists.witDefault;
        }
    }
}
