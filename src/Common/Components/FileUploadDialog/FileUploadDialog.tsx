import "./FileUploadDialog.scss";

import * as React from "react";

import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { DefaultButton, PrimaryButton } from "OfficeFabric/Button";
import { Dialog, DialogFooter, DialogType } from "OfficeFabric/Dialog";
import { css } from "OfficeFabric/Utilities";
import {
    FileInput, FileInputContentType, FileInputResult, FileInputUpdateEventData
} from "VSSUI/FileInput";

export interface IFileInputDialogProps extends IBaseFluxComponentProps {
    maximumNumberOfFiles?: number;
    allowedFileExtensions?: string[];
    maxFileSize?: number;
    resultContentType?: FileInputContentType;
    title?: string;
    onDialogClose(): void;
    onOkClick(files: FileInputResult[]): void;
}

export interface IFileInputDialogState extends IBaseFluxComponentState {
    files: FileInputResult[];
}

export class FileUploadDialog extends BaseFluxComponent<IFileInputDialogProps, IFileInputDialogState> {
    public render(): JSX.Element {
        const {title, maxFileSize, className, resultContentType, maximumNumberOfFiles, allowedFileExtensions} = this.props;

        return (
            <Dialog
                hidden={false}
                title={title || "Upload files"}
                modalProps={{
                    containerClassName: css("file-upload-dialog", className)
                }}
                dialogContentProps={{
                    type: DialogType.close
                }}
                onDismiss={this._onDialogClose}
                closeButtonAriaLabel={"Cancel"}
                firstFocusableSelector={"vss-FileInput-browseContainer"}
            >
                <div>
                    <FileInput
                        maximumNumberOfFiles={maximumNumberOfFiles || 1}
                        maximumSingleFileSize={maxFileSize || 10 * 1024 * 1024}
                        allowedFileExtensions={allowedFileExtensions}
                        updateHandler={this._onFileInputUpdate}
                        resultContentType={resultContentType || FileInputContentType.RawFile}
                    />

                    <DialogFooter>
                        <PrimaryButton
                            className={css("fabric-style-overrides")}
                            ariaLabel="OK"
                            onClick={this._onOkClicked}
                            disabled={!this.state.files || this.state.files.length === 0}
                        >
                            OK
                        </PrimaryButton>

                        <DefaultButton
                            ariaLabel="Cancel"
                            onClick={this._onDialogClose}
                        >
                            Cancel
                        </DefaultButton>
                    </DialogFooter>
                </div>
            </Dialog>
        );
    }

    private _closeDialog() {
        if (!!this.props.onDialogClose) {
            this.props.onDialogClose();
        }
    }

    private _onDialogClose = () => {
        this._closeDialog();
    }

    private _onOkClicked = () => {
        if (!!this.props.onOkClick) {
            this.props.onOkClick(this.state.files);
        }
        this._closeDialog();
    }

    private _onFileInputUpdate = (updateEvent: FileInputUpdateEventData) => {
        let files: FileInputResult[] = null;
        if (updateEvent && updateEvent.files && updateEvent.files.length) {
            files = updateEvent.files.map(f => f.result);
        }
        this.setState({
            files: files
        });
    }
}
