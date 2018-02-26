import { StoreFactory } from "Library/Flux/Stores/BaseStore";
import { RelatedWorkItemsStore } from "RelatedWits/Stores/RelatedWorkItemsStore";

export namespace StoresHub {
    export const relatedWorkItemsStore: RelatedWorkItemsStore = StoreFactory.getInstance<RelatedWorkItemsStore>(RelatedWorkItemsStore);
}
