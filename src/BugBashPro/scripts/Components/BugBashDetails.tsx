import "./BugBashDetails.scss";

import * as React from "react";

import { LongTextActions } from "BugBashPro/Actions/LongTextActions";
import { RichEditorComponent } from "BugBashPro/Components/RichEditorComponent";
import { ErrorKeys } from "BugBashPro/Constants";
import { copyImageToGitRepo } from "BugBashPro/Helpers";
import { StoresHub } from "BugBashPro/Stores/StoresHub";
import { LongText } from "BugBashPro/ViewModels/LongText";
import { Loading } from "Library/Components/Loading";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { ErrorMessageActions } from "Library/Flux/Actions/ErrorMessageActions";
import { BaseStore } from "Library/Flux/Stores/BaseStore";
import { Label } from "OfficeFabric/Label";
import { MessageBar, MessageBarType } from "OfficeFabric/MessageBar";
import { autobind } from "OfficeFabric/Utilities";

export interface IBugBashDetailsProps extends IBaseFluxComponentProps {
    id: string;
    isEditMode: boolean;
}

export interface IBugBashDetailsState extends IBaseFluxComponentState {
    error: string;
    longText: LongText;
}

export class BugBashDetails extends BaseFluxComponent<IBugBashDetailsProps, IBugBashDetailsState>  {
    public componentDidMount() {
        super.componentDidMount();
        LongTextActions.initializeLongText(this.props.id);
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this._dismissErrorMessage();
    }

    public render(): JSX.Element {
        if (this.state.loading) {
            return <Loading />;
        }

        return (
            <div className="bugbash-details">
                { this.state.error &&
                    <MessageBar
                        className="message-panel"
                        messageBarType={MessageBarType.error}
                        onDismiss={this._dismissErrorMessage}
                    >
                        {this.state.error}
                    </MessageBar>
                }

                <div
                    className="bugbash-details-contents"
                    onKeyDown={this._onEditorKeyDown}
                    tabIndex={0}
                >

                    { this.props.isEditMode &&
                        <RichEditorComponent
                            value={this.state.longText.Text}
                            delay={200}
                            editorOptions={{
                                getPastedImageUrl: this._pasteImage,
                                buttons: [
                                    "bold", "italic", "upload", "removeformat", "fullscreen",
                                    "undo", "redo", "super", "sub", "left", "center", "right",
                                    "bullet", "number"
                                ]
                            }}
                            onChange={this._onChange}
                        />
                    }

                    { !this.props.isEditMode && !this.state.longText.Text &&
                        <Label className="bugbash-details-nodata">No details have been added to this Bug bash. Click Edit to enter details.</Label>
                    }

                    { !this.props.isEditMode && this.state.longText.Text &&
                        <div className="bugbash-details-html" dangerouslySetInnerHTML={{__html: this.state.longText.Text}} />
                    }
                </div>
            </div>
        );
    }

    protected initializeState() {
        this.state = {
            loading: true,
            longText: null,
            error: null
        };
    }

    protected getStores(): BaseStore<any, any, any>[] {
        return [StoresHub.longTextStore, StoresHub.errorMessageStore];
    }

    protected getStoresState(): IBugBashDetailsState {
        return {
            loading: StoresHub.longTextStore.isLoading(this.props.id),
            longText: StoresHub.longTextStore.getItem(this.props.id),
            error: StoresHub.errorMessageStore.getItem(ErrorKeys.BugBashDetailsError)
        } as IBugBashDetailsState;
    }

    @autobind
    private _dismissErrorMessage() {
        ErrorMessageActions.dismissErrorMessage(ErrorKeys.BugBashDetailsError);
    }

    @autobind
    private _onChange(newValue: string) {
        this.state.longText.setDetails(newValue);
    }

    @autobind
    private async _pasteImage(data: string): Promise<string> {
        try {
            return await copyImageToGitRepo(data, "Details");
        }
        catch (e) {
            ErrorMessageActions.showErrorMessage(e, ErrorKeys.BugBashDetailsError);
            return null;
        }
    }

    @autobind
    private _onEditorKeyDown(e: React.KeyboardEvent<any>) {
        if (e.ctrlKey && e.keyCode === 83 && this.props.isEditMode) {
            e.preventDefault();
            this.state.longText.save();
        }
    }
}
