import Editor from "roosterjs-editor-core/lib/editor/Editor";
import EditorPlugin from "roosterjs-editor-core/lib/editor/EditorPlugin";
import PluginEvent from "roosterjs-editor-types/lib/editor/PluginEvent";
import PluginEventType from "roosterjs-editor-types/lib/editor/PluginEventType";

/**
 * Paste plugin, handles onPaste event and paste content into editor
 */
export class ContentChangedPlugin implements EditorPlugin {
    constructor(
        private _onChange: () => void,
    ) {}

    public initialize(_editor: Editor) {
        // no op
    }

    public dispose() {
        // no op
    }

    public onPluginEvent(event: PluginEvent) {
        if (event.eventType === PluginEventType.ContentChanged
         || event.eventType === PluginEventType.KeyUp
         || event.eventType === PluginEventType.CompositionEnd
        ) {
            this._onChange();
        }
    }
}
