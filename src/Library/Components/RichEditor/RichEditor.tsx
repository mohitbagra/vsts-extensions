import "./RichEditor.scss";

import * as React from "react";

import "trumbowyg/dist/trumbowyg";
import "trumbowyg/dist/ui/trumbowyg.min.css";

import { InfoLabel } from "Library/Components/InfoLabel";
import { InputError } from "Library/Components/InputError";
import { IFocussable } from "Library/Components/Interfaces";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { delay, DelayedFunction } from "Library/Utilities/Core";
import { newGuid } from "Library/Utilities/Guid";
import "Library/Utilities/PasteImagePlugin";
import { StaticObservable } from "Library/Utilities/StaticObservable";
import { isNullOrEmpty } from "Library/Utilities/String";
import "Library/Utilities/UploadImagePlugin";
import { autobind, css } from "OfficeFabric/Utilities";

export interface IRichEditorProps extends IBaseFluxComponentProps {
    containerId?: string;
    value?: string;
    delay?: number;
    editorOptions?: any;
    label?: string;
    info?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    onChange(newValue: string): void;
    getPastedImageUrl?(value: string): Promise<string>;
}

export interface IRichEditorState extends IBaseFluxComponentState {
    value?: string;
}

export class RichEditor extends BaseFluxComponent<IRichEditorProps, IRichEditorState> implements IFocussable {
    private _richEditorContainer: JQuery;
    private _containerId: string;
    private _delayedFunction: DelayedFunction;

    public focus() {
        if (this._richEditorContainer) {
            this._richEditorContainer.focus();
        }
    }

    public componentDidMount() {
        super.componentDidMount();

        StaticObservable.getInstance().unsubscribe(this._onImagePaste, "imagepasted");
        StaticObservable.getInstance().subscribe(this._onImagePaste, "imagepasted");

        this._richEditorContainer = $(`#${this._containerId}`);
        this._richEditorContainer
            .trumbowyg(this.props.editorOptions || {})
            .on("tbwchange", this._onChange)
            .on("tbwblur", this._fireChange);

        this._richEditorContainer.trumbowyg("html", this.props.value || "");

        if (this.props.disabled) {
            this._richEditorContainer.trumbowyg("disable");
        }
    }

    public componentWillUnmount() {
        super.componentWillUnmount();

        StaticObservable.getInstance().unsubscribe(this._onImagePaste, "imagepasted");

        this._richEditorContainer.trumbowyg("destroy");
        this._disposeDelayedFunction();
    }

    public componentWillReceiveProps(nextProps: IRichEditorProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);
        this._disposeDelayedFunction();

        if (nextProps.value !== this.state.value) {
            this._richEditorContainer.trumbowyg("html", nextProps.value || "");
            this.setState({
                value: nextProps.value
            });
        }

        if (nextProps.disabled !== this.props.disabled) {
            if (nextProps.disabled) {
                this._richEditorContainer.trumbowyg("disable");
            }
            else {
                this._richEditorContainer.trumbowyg("disable");
            }
        }
    }

    public render() {
        const error = this.props.error || this._getDefaultError();

        return (
            <div className={css("rich-editor-container", this.props.className)}>
                {this.props.label && <InfoLabel className="rich-editor-label" label={this.props.label} info={this.props.info} />}
                <div className="progress-bar" style={{visibility: this.state.loading ? "visible" : "hidden"}} />
                <div id={this._containerId} className="rich-editor" />
                {error && <InputError className="rich-editor-error" error={error} />}
            </div>
        );
    }

    protected initializeState(): void {
        this.state = {
            value: this.props.value || ""
        };

        this._containerId = this.props.containerId || newGuid();
    }

    private _getDefaultError(): string {
        if (this.props.required && isNullOrEmpty(this.state.value)) {
            return "A value is required";
        }
    }

    @autobind
    private _onChange() {
        this._disposeDelayedFunction();

        if (this.props.delay == null) {
            this._fireChange();
        }
        else {
            this._delayedFunction = delay(this, this.props.delay, () => {
                this._fireChange();
            });
        }
    }

    @autobind
    private _fireChange() {
        this._disposeDelayedFunction();

        const value = this._richEditorContainer.trumbowyg("html");
        this.setState({value: value}, () => {
            this.props.onChange(value);
        });
    }

    @autobind
    private async _onImagePaste(args: {data: string, callback(url: string): void}) {
        if (!this.props.getPastedImageUrl) {
            return;
        }

        this.setState({loading: true});

        try {
            const imageUrl = await this.props.getPastedImageUrl(args.data);
            args.callback(imageUrl);
            this.setState({loading: false});
        }
        catch (e) {
            args.callback(null);
            this.setState({loading: false});
        }
    }

    private _disposeDelayedFunction() {
        if (this._delayedFunction) {
            this._delayedFunction.cancel();
            this._delayedFunction = null;
        }
    }
}
