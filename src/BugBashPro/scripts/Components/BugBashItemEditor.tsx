import "./BugBashItemEditor.scss";

import * as React from "react";

import { BugBashItemCommentActions } from "BugBashPro/Actions/BugBashItemCommentActions";
import { RichEditorComponent } from "BugBashPro/Components/RichEditorComponent";
import {
    BugBashFieldNames, BugBashItemFieldNames, ErrorKeys, SizeLimits, UrlActions
} from "BugBashPro/Constants";
import { copyImageToGitRepo } from "BugBashPro/Helpers";
import { IBugBashItemComment } from "BugBashPro/Interfaces";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { BugBashItem } from "BugBashPro/ViewModels/BugBashItem";
import { Loading } from "Library/Components/Loading";
import {
    RichEditorToolbarButtonNames
} from "Library/Components/RichEditor/Toolbar/RichEditorToolbarButtonNames";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { ThrottledTextField } from "Library/Components/Utilities/ThrottledTextField";
import { TeamPicker } from "Library/Components/VSTS/TeamPicker";
import { ErrorMessageActions } from "Library/Flux/Actions/ErrorMessageActions";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { confirmAction } from "Library/Utilities/Core";
import { defaultDateComparer, friendly } from "Library/Utilities/Date";
import { getCurrentUser, IdentityRef } from "Library/Utilities/Identity";
import { navigate } from "Library/Utilities/Navigation";
import { Checkbox } from "OfficeFabric/Checkbox";
import { CommandBar } from "OfficeFabric/CommandBar";
import { ActivityItem } from "OfficeFabric/components/ActivityItem";
import { IContextualMenuItem } from "OfficeFabric/ContextualMenu";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { Overlay } from "OfficeFabric/Overlay";
import {
    DirectionalHint, TooltipDelay, TooltipHost, TooltipOverflowMode
} from "OfficeFabric/Tooltip";
import { autobind } from "OfficeFabric/Utilities";
import { WebApiTeam } from "TFS/Core/Contracts";

export interface IBugBashItemEditorProps extends IBaseFluxComponentProps {
    bugBashItem: BugBashItem;
    bugBashId: string;
    isMaximized?: boolean;
}

export interface IBugBashItemEditorState extends IBaseFluxComponentState {
    comments?: IBugBashItemComment[];
    commentsLoading?: boolean;
    error?: string;
}

export class BugBashItemEditor extends BaseFluxComponent<IBugBashItemEditorProps, IBugBashItemEditorState> {
    public componentDidMount() {
        super.componentDidMount();

        if (!this.props.bugBashItem.isNew() && !this.props.bugBashItem.isAccepted) {
             BugBashItemCommentActions.initializeComments(this.props.bugBashItem.id);
        }
    }

    public componentWillReceiveProps(nextProps: Readonly<IBugBashItemEditorProps>) {
        if (this.props.bugBashItem.id !== nextProps.bugBashItem.id) {
            this._dismissErrorMessage();

            if (nextProps.bugBashItem.isAccepted || nextProps.bugBashItem.isNew()) {
                this.setState({
                    comments: [],
                    commentsLoading: false
                });
            }
            else if (StoresHub.bugBashItemCommentStore.isLoaded(nextProps.bugBashItem.id)) {
                this.setState({
                    comments: StoresHub.bugBashItemCommentStore.getItem(nextProps.bugBashItem.id),
                    commentsLoading: false
                });
            }
            else {
                this.setState({
                    comments: null,
                    commentsLoading: true
                });
                BugBashItemCommentActions.initializeComments(nextProps.bugBashItem.id);
            }
        }
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this._dismissErrorMessage();
    }

    public render(): JSX.Element {
        const item = this.props.bugBashItem;

        if (item.isAccepted) {
            const webContext = VSS.getWebContext();
            const witUrl = `${webContext.collection.uri}${webContext.project.id}/_workitems/edit/${item.workItemId}`;

            return (
                <div className="item-editor accepted-item">
                    <MessageBar messageBarType={MessageBarType.success} className="message-panel">
                        This item has been accepted. Please open <a href={witUrl} target="_blank">#{item.workItemId}</a> to edit the workitem.
                    </MessageBar>
                </div>
            );
        }

        const createdBy = item.getFieldValue<IdentityRef>(BugBashItemFieldNames.CreatedBy);
        const createdByName = createdBy ? createdBy.displayName : null;
        const createdDate = item.getFieldValue<Date>(BugBashItemFieldNames.CreatedDate);
        const createdByInfo = item.isNew() ? null : `Created by ${createdByName} ${friendly(createdDate)}`;

        const teamId = item.getFieldValue<string>(BugBashItemFieldNames.TeamId);
        const team = StoresHub.teamStore.getItem(teamId);

        const title = item.getFieldValue<string>(BugBashItemFieldNames.Title);
        const description = item.getFieldValue<string>(BugBashItemFieldNames.Description);
        const rejected = item.getFieldValue<boolean>(BugBashItemFieldNames.Rejected);
        const rejectReason = item.getFieldValue<string>(BugBashItemFieldNames.RejectReason);
        const rejectedBy = item.getFieldValue<IdentityRef>(BugBashItemFieldNames.RejectedBy);
        const rejectedByName = (rejected && rejectedBy) ? rejectedBy.displayName : null;

        return (
            <div className="item-editor" onKeyDown={this._onEditorKeyDown} tabIndex={0}>
                {this.state.loading && <Overlay className="loading-overlay"><Loading /></Overlay>}
                {this.state.error
                    && (
                        <MessageBar
                            messageBarType={MessageBarType.error}
                            onDismiss={this._dismissErrorMessage}
                            className="message-panel"
                        >
                            {this.state.error}
                        </MessageBar>
                    )}

                <CommandBar
                    className="item-editor-commandbar"
                    items={this._getItemEditorCommands()}
                    farItems={this._getItemEditorFarCommands()}
                />

                <div className="item-editor-controls">
                    <ThrottledTextField
                        label="Title"
                        inputClassName="bugbashitem-inputbox"
                        maxLength={SizeLimits.TitleFieldMaxLength}
                        value={title}
                        required={true}
                        delay={200}
                        onChanged={this._onTitleChange}
                    />

                    { createdByInfo &&
                        <div className="created-info overflow-ellipsis">
                            <TooltipHost
                                content={createdByInfo}
                                delay={TooltipDelay.medium}
                                overflowMode={TooltipOverflowMode.Parent}
                                directionalHint={DirectionalHint.bottomCenter}
                            >
                                {createdByInfo}
                            </TooltipHost>
                        </div>
                    }

                    <div className="item-team-container">
                        <TeamPicker
                            selectedOption={team}
                            selectedValue={teamId}
                            label="Assigned to team"
                            delay={200}
                            required={true}
                            onChange={this._onTeamChange}
                        />
                    </div>

                    { rejected &&
                        <ThrottledTextField
                            label="Reject reason"
                            info={`Rejected by ${rejectedByName}`}
                            inputClassName="bugbashitem-inputbox"
                            maxLength={SizeLimits.RejectFieldMaxLength}
                            className="reject-reason-input"
                            value={rejectReason}
                            delay={200}
                            required={true}
                            onChanged={this._onRejectReasonChange}
                        />
                    }

                    <RichEditorComponent
                        className="item-description-container"
                        value={description}
                        label="Description"
                        delay={200}
                        editorOptions={{
                            getPastedImageUrl: this._pasteImage,
                            buttons: [RichEditorToolbarButtonNames.btnBold, RichEditorToolbarButtonNames.btnItalic, RichEditorToolbarButtonNames.btnUnformat, RichEditorToolbarButtonNames.btnFullscreen]
                        }}
                        onChange={this._onDescriptionChange}
                    />

                    <RichEditorComponent
                        className="item-comments-editor-container"
                        label="Discussion"
                        value={item.newComment || ""}
                        delay={200}
                        editorOptions={{
                            getPastedImageUrl: this._pasteImage,
                            buttons: []
                        }}
                        onChange={this._onCommentChange}
                    />

                    <div className="item-comments-container">
                        {this._renderComments()}
                    </div>
                </div>
            </div>
        );
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.bugBashItemCommentStore, StoresHub.bugBashItemStore, StoresHub.errorMessageStore];
    }

    protected getStoresState(): IBugBashItemEditorState {
        return {
            comments: StoresHub.bugBashItemCommentStore.getItem(this.props.bugBashItem.id),
            commentsLoading: StoresHub.bugBashItemCommentStore.isLoading(this.props.bugBashItem.id),
            loading: StoresHub.bugBashItemStore.isLoading(this.props.bugBashItem.id),
            error: StoresHub.errorMessageStore.getItem(ErrorKeys.BugBashItemError)
        };
    }

    protected initializeState() {
        this.state = {
            comments: this.props.bugBashItem.isNew() ? [] : null,
            commentsLoading: this.props.bugBashItem.isNew() ? false : true
        };
    }

    private _getItemEditorFarCommands(): IContextualMenuItem[] {
        const bugBash = StoresHub.bugBashStore.getItem(this.props.bugBashId);

        if (!bugBash.getFieldValue<boolean>(BugBashFieldNames.AutoAccept, true)) {
            if (this.props.bugBashItem.isAccepted) {
                return [];
            }

            const isMenuDisabled = this.props.bugBashItem.isDirty() || this.props.bugBashItem.isNew();

            const menuItems: IContextualMenuItem[] = [
                {
                    key: "Accept", name: "Accept", title: "Create workitems from selected items",
                    iconProps: {iconName: "Accept"}, className: !isMenuDisabled ? "acceptItemButton" : "",
                    disabled: isMenuDisabled,
                    onClick: this._acceptBugBashItem
                },
                {
                    key: "Reject",
                    onRender: () => {
                        return (
                            <Checkbox
                                disabled={this.props.bugBashItem.isNew()}
                                className="reject-menu-item-checkbox"
                                label="Reject"
                                checked={this.props.bugBashItem.getFieldValue<boolean>(BugBashItemFieldNames.Rejected)}
                                onChange={this._rejectBugBashItem}
                            />
                        );
                    }
                }
            ];

            if (!this.props.bugBashItem.isNew()) {
                menuItems.push({
                    key: "fullscreen", name: "",
                    title: this.props.isMaximized ? "Go back to list" : "Go fullscreen",
                    iconProps: {iconName: this.props.isMaximized ? "BackToWindow" : "FullScreen"},
                    onClick: this._toggleFullScreen
                });
            }
            return menuItems;
        }
        else {
            return [{
                key: "Accept", name: "Auto accept on", className: "auto-accept-menuitem",
                title: "Auto accept is turned on for this bug bash. A work item would be created as soon as a bug bash item is created",
                iconProps: {iconName: "SkypeCircleCheck"}
            }];
        }
    }

    private _getItemEditorCommands(): IContextualMenuItem[] {
        const menuItems: IContextualMenuItem[] = [
            {
                key: "save", name: "",
                iconProps: {iconName: "Save"},
                disabled: !this.props.bugBashItem.isDirty()
                        || !this.props.bugBashItem.isValid(),
                onClick: this._saveSelectedItem
            },
            {
                key: "refresh", name: "",
                iconProps: {iconName: "Refresh"},
                disabled: this.props.bugBashItem.isNew(),
                onClick: this._refreshBugBashItem
            },
            {
                key: "undo", name: "",
                title: "Undo changes", iconProps: {iconName: "Undo"},
                disabled: !this.props.bugBashItem.isDirty(),
                onClick: this._revertBugBashItem
            }
        ];

        if (!this.props.bugBashItem.isNew()) {
            menuItems.push({
                key: "delete",
                iconProps: {iconName: "Cancel", style: { color: "#da0a00", fontWeight: "bold" }},
                title: "Delete item",
                onClick: this._deleteBugBashItem
            });
        }
        return menuItems;
    }

    private _renderComments(): React.ReactNode {
        if (!this.props.bugBashItem.isNew()) {
            if (this.state.commentsLoading || !this.state.comments) {
                return <Loading />;
            }
            else {
                let comments = this.state.comments.slice();
                comments = comments.sort((c1: IBugBashItemComment, c2: IBugBashItemComment) => {
                    return -1 * defaultDateComparer(c1.createdDate, c2.createdDate);
                });

                return comments.map((comment: IBugBashItemComment, index: number) => {
                    return (
                        <ActivityItem
                            key={index}
                            className="item-comment"
                            activityDescription={
                                [
                                    <span key={1} className="created-by">{comment.createdBy.displayName}</span>,
                                    <span key={2} className="created-date">commented {friendly(comment.createdDate)}</span>,
                                ]
                            }
                            activityPersonas={
                                [
                                    {
                                        imageUrl: comment.createdBy.imageUrl
                                    }
                                ]
                            }
                            comments={<div className="message" dangerouslySetInnerHTML={{ __html: comment.content }} />}
                        />
                    );
                });
            }
        }
        else {
            return null;
        }
    }

    @autobind
    private async _pasteImage(data: string): Promise<string> {
        const gitPath = StoresHub.bugBashStore.getItem(this.props.bugBashId).getFieldValue<string>(BugBashFieldNames.Title, true).replace(" ", "_");

        try {
            return await copyImageToGitRepo(data, gitPath);
        }
        catch (e) {
            ErrorMessageActions.showErrorMessage(e, ErrorKeys.BugBashItemError);
            return null;
        }
    }

    @autobind
    private _onEditorKeyDown(e: React.KeyboardEvent<any>) {
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            this._saveSelectedItem();
        }
    }

    private _onChange<T extends string | number | boolean | Date>(fieldName: BugBashItemFieldNames, fieldValue: T) {
        this.props.bugBashItem.setFieldValue<T>(fieldName, fieldValue);
    }

    @autobind
    private _onCommentChange(newComment: string) {
        this.props.bugBashItem.setComment(newComment);
    }

    @autobind
    private _onTitleChange(value: string) {
        this._onChange(BugBashItemFieldNames.Title, value);
    }

    @autobind
    private _onDescriptionChange(value: string) {
        this._onChange(BugBashItemFieldNames.Description, value);
    }

    @autobind
    private _onRejectReasonChange(value: string) {
        this._onChange(BugBashItemFieldNames.RejectReason, value);
    }

    @autobind
    private _onTeamChange(team: WebApiTeam, value?: string) {
        this._onChange(BugBashItemFieldNames.TeamId, team ? team.id : value);
    }

    @autobind
    private _dismissErrorMessage() {
        setTimeout(
            () => {
                ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashItemError);
            },
            0
        );
    }

    @autobind
    private _acceptBugBashItem() {
        this.props.bugBashItem.accept();
    }

    @autobind
    private _rejectBugBashItem(_ev: React.FormEvent<HTMLElement>, checked: boolean) {
        this.props.bugBashItem.setFieldValue(BugBashItemFieldNames.Rejected, checked ? true : false, false);
        this.props.bugBashItem.setFieldValue<IdentityRef>(BugBashItemFieldNames.RejectedBy, checked ? getCurrentUser() : null, false);
        this.props.bugBashItem.setFieldValue(BugBashItemFieldNames.RejectReason, "");
    }

    @autobind
    private async _refreshBugBashItem() {
        if (!this.props.bugBashItem.isNew()) {
            const confirm = await confirmAction(this.props.bugBashItem.isDirty(), "Refreshing the item will undo your unsaved changes. Are you sure you want to do that?");
            if (confirm) {
                this.props.bugBashItem.refresh();
            }
        }
    }

    @autobind
    private async _revertBugBashItem() {
        const confirm = await confirmAction(true, "Are you sure you want to undo your changes to this item?");
        if (confirm) {
            this.props.bugBashItem.reset();
        }
    }

    @autobind
    private async _deleteBugBashItem() {
        const confirm = await confirmAction(true, "Are you sure you want to delete this item?");
        if (confirm) {
            this.props.bugBashItem.delete();
        }
    }

    @autobind
    private _saveSelectedItem() {
        this.props.bugBashItem.save(this.props.bugBashId);
    }

    @autobind
    private _toggleFullScreen() {
        if (this.props.isMaximized) {
            // go back to list
            navigate({ view: UrlActions.ACTION_RESULTS, id: this.props.bugBashId });
        }
        else {
            // open full screen item editor
            navigate({view: UrlActions.ACTION_RESULTS, id: this.props.bugBashId, itemId: this.props.bugBashItem.id});
        }
    }
}
