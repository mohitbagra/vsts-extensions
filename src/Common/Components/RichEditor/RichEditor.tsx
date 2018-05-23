import "./RichEditor.scss";

import * as React from "react";

import { InfoLabel } from "Common/Components/InfoLabel";
import { InputError } from "Common/Components/InputError";
import { IFocussable } from "Common/Components/Interfaces";
import { ContentChangedPlugin } from "Common/Components/RichEditor/Plugins/ContentChangedPlugin";
import { Paste } from "Common/Components/RichEditor/Plugins/Paste";
import { RichEditorToolbar } from "Common/Components/RichEditor/Toolbar/RichEditorToolbar";
import {
    ALL_BUTTONS, RichEditorToolbarButtonNames
} from "Common/Components/RichEditor/Toolbar/RichEditorToolbarButtonNames";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Common/Components/Utilities/BaseFluxComponent";
import { delay, DelayedFunction } from "Common/Utilities/Core";
import { isNullOrEmpty } from "Common/Utilities/String";
import { css } from "OfficeFabric/Utilities";
import Editor from "roosterjs-editor-core/lib/editor/Editor";
import EditorOptions from "roosterjs-editor-core/lib/editor/EditorOptions";
import EditorPlugin from "roosterjs-editor-core/lib/editor/EditorPlugin";
import ContentEdit from "roosterjs-editor-plugins/lib/ContentEdit/ContentEdit";
import DefaultShortcut from "roosterjs-editor-plugins/lib/DefaultShortcut/DefaultShortcut";
import HyperLink from "roosterjs-editor-plugins/lib/HyperLink/HyperLink";

export interface IRichEditorProps extends IBaseFluxComponentProps {
    value?: string;
    delay?: number;
    label?: string;
    info?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    editorOptions?: IEditorOptions;
    onChange(newValue: string): void;
}

export interface IRichEditorState extends IBaseFluxComponentState {
    value?: string;
}

export interface IEditorOptions {
    buttons?: RichEditorToolbarButtonNames[];
    getPastedImageUrl?(value: string): Promise<string>;
}

export class RichEditor extends BaseFluxComponent<IRichEditorProps, IRichEditorState> implements IFocussable {
    private _contentDiv: HTMLDivElement;
    private _delayedFunction: DelayedFunction;
    private _editor: Editor;

    public focus() {
        if (this._editor) {
            this._editor.focus();
        }
    }

    public componentDidMount() {
        super.componentDidMount();
        const plugins: EditorPlugin[] = [
            new DefaultShortcut(),
            new HyperLink(href => `${href}.\n Ctrl-Click to follow link.`),
            new ContentEdit(),
            new ContentChangedPlugin(this._onChange)
        ];
        if (this.props.editorOptions && this.props.editorOptions.getPastedImageUrl) {
            plugins.push(new Paste(this._getImageUrl));
        }

        const options: EditorOptions = {
            plugins: plugins,
            initialContent: this.state.value
        };
        this._editor = new Editor(this._contentDiv, options);

        if (this.props.disabled) {
            this._contentDiv.setAttribute("contenteditable", "false");
        }
    }

    public componentWillUnmount() {
        super.componentWillUnmount();
        this._editor.dispose();
        this._disposeDelayedFunction();
    }

    public componentWillReceiveProps(nextProps: IRichEditorProps, context?: any) {
        super.componentWillReceiveProps(nextProps, context);
        this._disposeDelayedFunction();

        if (nextProps.value !== this.state.value) {
            this._editor.setContent(nextProps.value || "");
            this.setState({
                value: nextProps.value
            });
        }

        if (nextProps.disabled !== this.props.disabled) {
            if (nextProps.disabled) {
                this._contentDiv.setAttribute("contenteditable", "false");
            }
            else {
                this._contentDiv.setAttribute("contenteditable", "true");
            }
        }
    }

    public render() {
        const error = this.props.error || this._getDefaultError();

        return (
            <div className={css("rich-editor-container", this.props.className)}>
                {this.props.label && <InfoLabel className="rich-editor-label" label={this.props.label} info={this.props.info} />}
                <div className="progress-bar" style={{visibility: this.state.loading ? "visible" : "hidden"}} />
                {this._renderToolbar()}
                <div className="rich-editor" ref={this._onContentDivRef} />
                <div className="rich-editor-dialog-container" />
                {error && <InputError className="rich-editor-error" error={error} />}
            </div>
        );
    }

    protected initializeState(): void {
        this.state = {
            value: this.props.value || ""
        };
    }

    private _renderToolbar(): JSX.Element {
        let buttons = (this.props.editorOptions && this.props.editorOptions.buttons) || ALL_BUTTONS;
        if (!this.props.editorOptions || !this.props.editorOptions.getPastedImageUrl) {
            buttons = buttons.filter(b => b !== RichEditorToolbarButtonNames.btnUploadImage);
        }

        if (buttons.length > 0) {
            return (
                <RichEditorToolbar
                    buttons={buttons}
                    getEditor={this._getEditor}
                    options={{
                        getImageUrl: this._getImageUrl
                    }}
                />
            );
        }
        return null;
    }

    private _getDefaultError(): string {
        if (this.props.required && isNullOrEmpty(this.state.value)) {
            return "A value is required";
        }
    }

    private _disposeDelayedFunction() {
        if (this._delayedFunction) {
            this._delayedFunction.cancel();
            this._delayedFunction = null;
        }
    }

    private _getEditor = (): Editor => {
        return this._editor;
    }

    private _onContentDivRef = (ref: HTMLDivElement) => {
        this._contentDiv = ref;
    }

    private _onChange = () => {
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

    private _fireChange = () => {
        this._disposeDelayedFunction();

        const value = this._editor.getContent();
        if (value !== this.state.value) {
            this.setState({value: value}, () => {
                this.props.onChange(value);
            });
        }
    }

    private _getImageUrl = async (data: string): Promise<string> => {
        if (!this.props.editorOptions || !this.props.editorOptions.getPastedImageUrl) {
            return null;
        }

        this.setState({loading: true});

        try {
            const imageUrl = await this.props.editorOptions.getPastedImageUrl(data);
            this.setState({loading: false});
            return imageUrl;
        }
        catch (e) {
            this.setState({loading: false});
            return null;
        }
    }
}
