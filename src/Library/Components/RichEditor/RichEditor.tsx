import "./RichEditor.scss";

import * as React from "react";

import { InfoLabel } from "Library/Components/InfoLabel";
import { InputError } from "Library/Components/InputError";
import { IFocussable } from "Library/Components/Interfaces";
import { RichEditorToolbar } from "Library/Components/RichEditor/Toolbar/RichEditorToolbar";
import {
    RichEditorToolbarButtonNames
} from "Library/Components/RichEditor/Toolbar/RichEditorToolbarButtonNames";
import {
    BaseFluxComponent, IBaseFluxComponentProps, IBaseFluxComponentState
} from "Library/Components/Utilities/BaseFluxComponent";
import { delay, DelayedFunction } from "Library/Utilities/Core";
import { isNullOrEmpty } from "Library/Utilities/String";
import { autobind, css } from "OfficeFabric/Utilities";
import Editor from "roosterjs-editor-core/lib/editor/Editor";
import EditorOptions from "roosterjs-editor-core/lib/editor/EditorOptions";
import EditorPlugin from "roosterjs-editor-core/lib/editor/EditorPlugin";
import ContentEdit from "roosterjs-editor-plugins/lib/ContentEdit/ContentEdit";
import DefaultShortcut from "roosterjs-editor-plugins/lib/DefaultShortcut/DefaultShortcut";
import HyperLink from "roosterjs-editor-plugins/lib/HyperLink/HyperLink";

const DEFAULT_BUTTONS = [
    RichEditorToolbarButtonNames.btnBold,
    RichEditorToolbarButtonNames.btnItalic,
    RichEditorToolbarButtonNames.btnUnderline,
    RichEditorToolbarButtonNames.btnUnformat,
    RichEditorToolbarButtonNames.btnUnlink,
    RichEditorToolbarButtonNames.btnBullets,
    RichEditorToolbarButtonNames.btnNumbering,
    RichEditorToolbarButtonNames.btnSuperScript,
    RichEditorToolbarButtonNames.btnSubscript,
    RichEditorToolbarButtonNames.btnStrikethrough,
    RichEditorToolbarButtonNames.btnIndent,
    RichEditorToolbarButtonNames.btnOutdent,
    RichEditorToolbarButtonNames.btnAlignLeft,
    RichEditorToolbarButtonNames.btnAlignCenter,
    RichEditorToolbarButtonNames.btnAlignRight,
    RichEditorToolbarButtonNames.btnFullscreen
];

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
            new HyperLink(),
            new ContentEdit(),
        ];
        const options: EditorOptions = {
            plugins: plugins,
            initialContent: this.state.value
        };
        this._editor = new Editor(this._contentDiv, options);
        this._editor.addDomEventHandler("keyup", this._onChange);
        this._editor.addDomEventHandler("paste", this._onChange);
        this._editor.addDomEventHandler("input", this._onChange);

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
        const buttons = (this.props.editorOptions && this.props.editorOptions.buttons) || DEFAULT_BUTTONS;
        if (buttons.length > 0) {
            return (
                <RichEditorToolbar
                    buttons={buttons}
                    getEditor={this._getEditor}
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

    @autobind
    private _getEditor(): Editor {
        return this._editor;
    }

    @autobind
    private _onContentDivRef(ref: HTMLDivElement) {
        this._contentDiv = ref;
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

        const value = this._editor.getContent();
        this.setState({value: value}, () => {
            this.props.onChange(value);
        });
    }

    // @autobind
    // private async _onImagePaste(args: {data: string, callback(url: string): void}) {
    //     if (!this.props.getPastedImageUrl) {
    //         return;
    //     }

    //     this.setState({loading: true});

    //     try {
    //         const imageUrl = await this.props.getPastedImageUrl(args.data);
    //         args.callback(imageUrl);
    //         this.setState({loading: false});
    //     }
    //     catch (e) {
    //         args.callback(null);
    //         this.setState({loading: false});
    //     }
    // }

    private _disposeDelayedFunction() {
        if (this._delayedFunction) {
            this._delayedFunction.cancel();
            this._delayedFunction = null;
        }
    }
}
