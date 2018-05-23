import {
    IBugBash, IBugBashItem, IBugBashItemComment, IBugBashSettings, ILongText, ISortState,
    IUserSettings
} from "BugBashPro/Interfaces";
import { Action } from "Common/Flux/Actions/Action";
import { IFilterState } from "VSSUI/Utilities/Filter";

export namespace BugBashClientActionsHub {
    export const SelectedBugBashItemChanged = new Action<string>();
}

export namespace SettingsActionsHub {
    export const InitializeBugBashSettings = new Action<IBugBashSettings>();
    export const UpdateBugBashSettings = new Action<IBugBashSettings>();
    export const InitializeUserSettings = new Action<IUserSettings[]>();
    export const UpdateUserSettings = new Action<IUserSettings>();
}

export namespace BugBashActionsHub {
    export const InitializeAllBugBashes = new Action<IBugBash[]>();
    export const InitializeBugBash = new Action<IBugBash>();
    export const UpdateBugBash = new Action<IBugBash>();
    export const DeleteBugBash = new Action<string>();
    export const CreateBugBash = new Action<IBugBash>();
    export const FireStoreChange = new Action<void>();
    export const ApplyFilter = new Action<IFilterState>();
    export const ClearSortAndFilter = new Action<void>();
    export const ApplySort = new Action<ISortState>();
    export const Clean = new Action<void>();
}

export namespace BugBashItemCommentActionsHub {
    export const InitializeComments = new Action<{bugBashItemId: string, comments: IBugBashItemComment[]}>();
    export const CreateComment = new Action<{bugBashItemId: string, comment: IBugBashItemComment}>();
    export const Clean = new Action<void>();
}

export namespace BugBashItemActionsHub {
    export const InitializeBugBashItems = new Action<IBugBashItem[]>();
    export const InitializeBugBashItem = new Action<IBugBashItem>();
    export const CreateBugBashItem = new Action<IBugBashItem>();
    export const UpdateBugBashItem = new Action<IBugBashItem>();
    export const DeleteBugBashItem = new Action<string>();
    export const FireStoreChange = new Action<void>();
    export const ApplyFilter = new Action<IFilterState>();
    export const ClearSortAndFilter = new Action<void>();
    export const ApplySort = new Action<ISortState>();
    export const Clean = new Action<void>();
}

export namespace LongTextActionsHub {
    export const AddOrUpdateLongText = new Action<ILongText>();
    export const FireStoreChange = new Action<void>();
    export const Clean = new Action<void>();
}
