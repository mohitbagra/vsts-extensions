import { ClassificationNodeActionsHub } from "Common/Flux/Actions/ActionsHub";
import { BaseStore } from "Common/Flux/Stores/BaseStore";
import { WorkItemClassificationNode } from "TFS/WorkItemTracking/Contracts";

export interface IClassificationNodeItem {
    areaPathRoot: WorkItemClassificationNode;
    iterationPathRoot: WorkItemClassificationNode;
}

export enum ClassificationNodeKey {
    Area = "Area",
    Iteration = "Iteration"
}

export class ClassificationNodeStore extends BaseStore<IClassificationNodeItem, WorkItemClassificationNode, ClassificationNodeKey> {
    private _areaPathIdMap: IDictionaryStringTo<WorkItemClassificationNode>;
    private _areaPathMap: IDictionaryStringTo<WorkItemClassificationNode>;
    private _iterationPathIdMap: IDictionaryStringTo<WorkItemClassificationNode>;
    private _iterationPathMap: IDictionaryStringTo<WorkItemClassificationNode>;

    constructor() {
        super();

        this.items = {} as IClassificationNodeItem;
        this._areaPathIdMap = {};
        this._areaPathMap = {};
        this._iterationPathIdMap = {};
        this._iterationPathMap = {};
    }

    public getItem(nodeKey: ClassificationNodeKey): WorkItemClassificationNode {
        return nodeKey === ClassificationNodeKey.Area ? this.items.areaPathRoot : this.items.iterationPathRoot;
    }

    public getAreaPathNode(nodeIdOrPath: string): WorkItemClassificationNode {
        const key = (nodeIdOrPath || "").toLowerCase();
        return this._areaPathIdMap[key] || this._areaPathMap[key];
    }

    public getIterationPathNode(nodeIdOrPath: string): WorkItemClassificationNode {
        const key = (nodeIdOrPath || "").toLowerCase();
        return this._iterationPathIdMap[key] || this._iterationPathMap[key];
    }

    public getKey(): string {
        return "ClassificationNodeStore";
    }

    protected initializeActionListeners() {
        ClassificationNodeActionsHub.InitializeAreaPaths.addListener((rootNode: WorkItemClassificationNode) => {
            if (rootNode) {
                this.items.areaPathRoot = rootNode;
                this._populateNodeData(rootNode, null, ClassificationNodeKey.Area);
            }

            this.emitChanged();
        });

        ClassificationNodeActionsHub.InitializeIterationPaths.addListener((rootNode: WorkItemClassificationNode) => {
            if (rootNode) {
                this.items.iterationPathRoot = rootNode;
                this._populateNodeData(rootNode, null, ClassificationNodeKey.Iteration);
            }

            this.emitChanged();
        });
    }

    protected convertItemKeyToString(key: ClassificationNodeKey): string {
        return key;
    }

    private _populateNodeData(node: WorkItemClassificationNode, parentNodeName: string, nodeType: ClassificationNodeKey) {
        const nodeName = parentNodeName ? `${parentNodeName}\\${node.name}` : node.name;

        if (nodeType === ClassificationNodeKey.Area) {
            this._areaPathMap[nodeName.toLowerCase()] = node;
            this._areaPathIdMap[node.id.toString()] = node;
        }
        else {
            this._iterationPathMap[nodeName.toLowerCase()] = node;
            this._iterationPathIdMap[node.id.toString()] = node;
        }

        if (node.children) {
            for (const child of node.children) {
                this._populateNodeData(child, nodeName, nodeType);
            }
        }
    }
}
