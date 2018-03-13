import "./ChecklistView.scss";

import * as React from "react";
import { arrayMove, SortableContainer, SortableElement, SortableHandle } from "react-sortable-hoc";

import { ChecklistActions } from "Checklist/Actions/ChecklistActions";
import { ChecklistItem } from "Checklist/Components/ChecklistItem";
import { ChecklistItemEditor } from "Checklist/Components/ChecklistItemEditor";
import { ChecklistItemState, IChecklistItem, IWorkItemChecklist } from "Checklist/Interfaces";
import { StoresHub } from "Checklist/Stores/StoresHub";
import { Loading } from "Library/Components/Loading";
import { AutoResizableComponent } from "Library/Components/Utilities/AutoResizableComponent";
import {
    IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { findIndex } from "Library/Utilities/Array";
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
    checklist: IWorkItemChecklist;
    error?: string;
    disabled?: boolean;
    editItem?: IChecklistItem;
}

export class ChecklistView extends AutoResizableComponent<IChecklistViewProps, IChecklistViewState> {
    public componentDidMount() {
        super.componentDidMount();
        if (this.state.checklist == null) {
            ChecklistActions.initializeChecklist(this.props.workItemId, this.props.workItemType, this.props.projectId);
        }
    }

    public componentWillReceiveProps(nextProps: IChecklistViewProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);
        if (this.props.workItemId !== nextProps.workItemId) {
            const checklist = this._getChecklist(nextProps.workItemId, nextProps.isPersonal);
            if (checklist) {
                this.setState({checklist: checklist, editItem: null, error: null, disabled: false});
            }
            else {
                this.setState({checklist: null, editItem: null, error: null, disabled: false});
                ChecklistActions.initializeChecklist(nextProps.workItemId, nextProps.workItemType, nextProps.projectId);
            }
        }
    }

    public render(): JSX.Element {
        const {checklist, disabled} = this.state;

        if (checklist == null) {
            return <Loading />;
        }
        else {
            return (
                <div className="checklist-items-container">
                    {this._renderZeroDataMessage()}
                    {this._renderEditView()}
                    {this._renderError()}
                    {this._renderChecklistItems()}
                    <ChecklistItemEditor
                        inputPlaceholder="Add new item"
                        disabled={disabled}
                        onSubmit={this._addChecklistItem}
                    />
                </div>
            );
        }
    }

    protected initializeState() {
        const {workItemId, isPersonal} = this.props;
        const error = StoresHub.errorMessageStore.getItem("ChecklistError");

        this.state = {
            checklist: this._getChecklist(workItemId, isPersonal),
            disabled: StoresHub.checklistStore.isLoading(`${workItemId}`) || !isNullOrWhiteSpace(error),
            error: error,
            editItem: null
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.checklistStore, StoresHub.errorMessageStore];
    }

    protected getStoresState(): IChecklistViewState {
        const {workItemId, isPersonal} = this.props;
        const checklist = this._getChecklist(workItemId, isPersonal);
        const error = StoresHub.errorMessageStore.getItem("ChecklistError");

        let newState: IChecklistViewState = {
            disabled: StoresHub.checklistStore.isLoading(`${workItemId}`) || !isNullOrWhiteSpace(error),
            error: error
        } as IChecklistViewState;

        if (!StoresHub.checklistStore.isLoading(`${workItemId}`)) {
            newState = {...newState, checklist: checklist};
        }
        return newState;
    }

    @autobind
    private _renderChecklistItem(checklistItem: IChecklistItem): JSX.Element {
        return (
            <ChecklistItem
                checklistItem={checklistItem}
                disabled={this.state.disabled}
                onEdit={this._editChecklistItem}
                onDelete={this._deleteChecklistItem}
                onToggleCheck={this._onToggleChecklistItem}
            />
        );
    }

    private _renderZeroDataMessage(): JSX.Element {
        const {checklist} = this.state;
        if (checklist.checklistItems == null || checklist.checklistItems.length === 0) {
            return (
                <MessageBar messageBarType={MessageBarType.info} className="message-bar">
                    No checklist items yet.
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

    @autobind
    private _editChecklistItem(item: IChecklistItem) {
        this.setState({editItem: {...item}});
    }

    @autobind
    private _cancelItemEdit() {
        this.setState({editItem: null});
    }

    @autobind
    private _onToggleChecklistItem(item: IChecklistItem, checked: boolean) {
        const {checklist} = this.state;
        const newChecklistItems = [...checklist.checklistItems];
        const index = findIndex(newChecklistItems, (i: IChecklistItem) => stringEquals(i.id, item.id, true));
        if (index !== -1) {
            newChecklistItems[index] = {...newChecklistItems[index], state: checked ? ChecklistItemState.Completed : ChecklistItemState.New};
            this._updateChecklist(newChecklistItems);
        }
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
        const newChecklistItem = {...checklistItem, id: `${Date.now()}`};
        const newChecklistItems = (checklist.checklistItems || []).concat(newChecklistItem);

        this._updateChecklist(newChecklistItems);
    }

    @autobind
    private _updateChecklistItem(item: IChecklistItem) {
        const {checklist} = this.state;
        const newChecklistItems = [...checklist.checklistItems];
        const index = findIndex(newChecklistItems, (i: IChecklistItem) => stringEquals(i.id, item.id, true));
        if (index !== -1) {
            newChecklistItems[index] = {...newChecklistItems[index], text: item.text, required: item.required, state: item.state};
            this._updateChecklist(newChecklistItems);
        }

        this._cancelItemEdit();
    }

    private async _updateChecklist(checklistItems: IChecklistItem[]) {
        const {isPersonal} = this.props;
        const checklist = {...this.state.checklist};
        checklist.checklistItems = checklistItems;

        this.setState({checklist: checklist});
        ChecklistActions.updateChecklist(checklist, isPersonal);
    }

    private _getChecklist(workItemId: number, isPersonal: boolean): IWorkItemChecklist {
        if (workItemId == null || workItemId === 0) {
            return null;
        }

        const checklists = StoresHub.checklistStore.getItem(this.props.workItemId.toString());
        return checklists == null ? null : (isPersonal ? checklists.personal : checklists.shared);
    }
}
