import { onImageAdd } from "Common/Components/RichEditor/Toolbar/Buttons";
import Editor from "roosterjs-editor-core/lib/editor/Editor";
import EditorPlugin from "roosterjs-editor-core/lib/editor/EditorPlugin";
import { buildSnapshot, restoreSnapshot } from "roosterjs-editor-core/lib/undo/snapshotUtils";
import { getFirstLeafNode } from "roosterjs-editor-dom/lib/domWalker/getLeafNode";
import { getNextLeafSibling } from "roosterjs-editor-dom/lib/domWalker/getLeafSibling";
import applyFormat from "roosterjs-editor-dom/lib/utils/applyFormat";
import fromHtml from "roosterjs-editor-dom/lib/utils/fromHtml";
import sanitizeHtml, {
    SanitizeHtmlPropertyCallback
} from "roosterjs-editor-dom/lib/utils/sanitizeHtml";
import buildClipboardData from "roosterjs-editor-plugins/lib/Paste/buildClipboardData";
import textToHtml from "roosterjs-editor-plugins/lib/Paste/textToHtml";
import convertPastedContentFromWord from "roosterjs-editor-plugins/lib/Paste/wordConverter/convertPastedContentFromWord";
import NodeType from "roosterjs-editor-types/lib/browser/NodeType";
import BeforePasteEvent from "roosterjs-editor-types/lib/clipboard/BeforePasteEvent";
import ClipboardData from "roosterjs-editor-types/lib/clipboard/ClipboardData";
import PasteOption from "roosterjs-editor-types/lib/clipboard/PasteOption";
import { ChangeSource } from "roosterjs-editor-types/lib/editor/ContentChangedEvent";
import DefaultFormat from "roosterjs-editor-types/lib/editor/DefaultFormat";
import PluginEvent from "roosterjs-editor-types/lib/editor/PluginEvent";
import PluginEventType from "roosterjs-editor-types/lib/editor/PluginEventType";

/**
 * Paste plugin, handles onPaste event and paste content into editor
 */
export class Paste implements EditorPlugin {
    private _editor: Editor;
    private _pasteDisposer: () => void;

    /**
     * Create an instance of Paste
     */
    constructor(
        private _getPastedImageUrl: (data: string) => Promise<string>,
        private _htmlPropertyCallbacks?: SanitizeHtmlPropertyCallback
    ) {}

    public initialize(editor: Editor) {
        this._editor = editor;
        this._pasteDisposer = editor.addDomEventHandler("paste", this._onPaste);
    }

    public dispose() {
        this._pasteDisposer();
        this._pasteDisposer = null;
        this._editor = null;
    }

    public onPluginEvent(event: PluginEvent) {
        if (event.eventType === PluginEventType.BeforePaste) {
            const beforePasteEvent = <BeforePasteEvent>event;

            if (beforePasteEvent.pasteOption === PasteOption.PasteHtml) {
                convertPastedContentFromWord(beforePasteEvent.fragment);
            }
        }
    }

    /**
     * Paste into editor using passed in clipboardData with original format
     * @param clipboardData The clipboardData to paste
     */
    public pasteOriginal(clipboardData: ClipboardData) {
        this._paste(clipboardData, this._detectPasteOption(clipboardData));
    }

    /**
     * Paste plain text into editor using passed in clipboardData
     * @param clipboardData The clipboardData to paste
     */
    public pasteText(clipboardData: ClipboardData) {
        this._paste(clipboardData, PasteOption.PasteText);
    }

    /**
     * Paste into editor using passed in clipboardData with curent format
     * @param clipboardData The clipboardData to paste
     */
    public pasteAndMergeFormat(clipboardData: ClipboardData) {
        this._paste(clipboardData, this._detectPasteOption(clipboardData), true);
    }

    private _onPaste = (event: Event) => {
        this._editor.addUndoSnapshot();
        buildClipboardData(
            <ClipboardEvent>event,
            this._editor,
            clipboardData => {
                if (!clipboardData.html && clipboardData.text) {
                    clipboardData.html = textToHtml(clipboardData.text);
                }
                if (!clipboardData.isHtmlFromTempDiv) {
                    clipboardData.html = sanitizeHtml(
                        clipboardData.html,
                        null,
                        false,
                        this._htmlPropertyCallbacks,
                        true
                    );
                }
                this.pasteOriginal(clipboardData);
            },
            false
        );
    }

    private _detectPasteOption(clipboardData: ClipboardData): PasteOption {
        return clipboardData.text || !clipboardData.image
            ? PasteOption.PasteHtml
            : PasteOption.PasteImage;
    }

    private _paste(
        clipboardData: ClipboardData,
        pasteOption: PasteOption,
        mergeCurrentFormat?: boolean
    ) {
        const document = this._editor.getDocument();
        const fragment = document.createDocumentFragment();

        if (pasteOption === PasteOption.PasteHtml) {
            const html = clipboardData.html;
            const nodes = fromHtml(html, document);

            for (const node of nodes) {
                if (mergeCurrentFormat) {
                    this._applyTextFormat(node, clipboardData.originalFormat);
                }
                fragment.appendChild(node);
            }
        }

        const event: BeforePasteEvent = {
            eventType: PluginEventType.BeforePaste,
            clipboardData: clipboardData,
            fragment: fragment,
            pasteOption: pasteOption,
        };

        this._editor.triggerEvent(event, true);
        this._internalPaste(event);
    }

    private _internalPaste(event: BeforePasteEvent) {
        const { clipboardData, fragment, pasteOption } = event;
        this._editor.focus();
        if (clipboardData.snapshotBeforePaste == null) {
            clipboardData.snapshotBeforePaste = buildSnapshot(this._editor);
        } else {
            restoreSnapshot(this._editor, clipboardData.snapshotBeforePaste);
        }

        switch (pasteOption) {
            case PasteOption.PasteHtml:
                this._editor.insertNode(fragment);
                this._editor.triggerContentChangedEvent(ChangeSource.Paste, clipboardData);
                this._editor.addUndoSnapshot();
                break;

            case PasteOption.PasteText:
                const html = textToHtml(clipboardData.text);
                this._editor.insertContent(html);
                this._editor.triggerContentChangedEvent(ChangeSource.Paste, clipboardData);
                this._editor.addUndoSnapshot();
                break;

            default:
                onImageAdd(this._editor, clipboardData.image, this._getPastedImageUrl);
                break;
        }
    }

    private _applyTextFormat(node: Node, format: DefaultFormat) {
        let leaf = getFirstLeafNode(node);
        const parents: HTMLElement[] = [];
        while (leaf) {
            if (
                leaf.nodeType === NodeType.Text &&
                leaf.parentNode &&
                parents.indexOf(<HTMLElement>leaf.parentNode) < 0
            ) {
                parents.push(<HTMLElement>leaf.parentNode);
            }
            leaf = getNextLeafSibling(node, leaf);
        }
        for (const parent of parents) {
            applyFormat(parent, format);
        }
    }
}
