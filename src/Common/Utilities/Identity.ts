import { isGuid } from "Common/Utilities/Guid";
import { isNullOrWhiteSpace, startsWith } from "Common/Utilities/String";

export interface IdentityRef {
    id: string;
    displayName: string;
    uniqueName: string;
    descriptor?: string;
    imageUrl?: string;
}

export function getCurrentUserName(includeId?: boolean): string {
    const currentUser = VSS.getWebContext().user;
    if (includeId) {
        return `${currentUser.name} <${currentUser.id || ""};${currentUser.uniqueName || ""}>`;
    }
    else {
        return `${currentUser.name} <${currentUser.uniqueName || ""}>`;
    }
}

export function getCurrentUser(): IdentityRef {
    const currentUser = VSS.getWebContext().user;
    return {
        id: currentUser.id,
        displayName: currentUser.name,
        uniqueName: currentUser.uniqueName || currentUser.email,
        imageUrl: getIdentityImageUrl(currentUser.id)
    };
}

export function getDistinctNameFromIdentityRef(identityRef: IdentityRef, includeId?: boolean): string {
    if (identityRef == null) {
        return "";
    }

    const displayName = identityRef.displayName;
    const id = includeId ? identityRef.id : null;
    const uniqueName = identityRef.uniqueName;
    let alias: string;

    if (id && uniqueName) {
        alias = `${id};${uniqueName}`;
    }
    else if (!id && uniqueName) {
        alias = `${uniqueName}`;
    }
    else if (id && !uniqueName) {
        alias = `${id}`;
    }
    else {
        alias = null;
    }

    if (alias) {
        return `${displayName} <${alias}>`;
    }
    else {
        return displayName;
    }
}

export function parseWorkItemIdentityName(distinctName: string): IdentityRef {
    if (isNullOrWhiteSpace(distinctName)) {
        return {
            id: null,
            displayName: null,
            uniqueName: null,
            imageUrl: null
        };
    }

    const i = distinctName.lastIndexOf("<");
    const j = distinctName.lastIndexOf(">");
    let displayName = distinctName;
    let uniqueName: string;
    let rightPart: string;
    let id: string;

    if (i >= 0 && j > i && j === distinctName.length - 1) {
        displayName = distinctName.substr(0, i).trim();
        rightPart = distinctName.substr(i + 1, j - i - 1).trim();
        const vsIdFromAlias: string = getVsIdFromGroupUniqueName(rightPart); // if it has vsid in unique name (for TFS groups)

        if (rightPart.indexOf("@") !== -1 || rightPart.indexOf("\\") !== -1 || vsIdFromAlias || isGuid(rightPart)) {
            // if its a valid alias
            uniqueName = rightPart;

            // If the alias component is just a guid then this is not a uniqueName but
            // vsId which is used only for TFS groups
            if (vsIdFromAlias !== "") {
                id = vsIdFromAlias;
                uniqueName = null;
            }
        }
        else {
            // if its not a valid alias, treat it as a non-identity string
            displayName = distinctName;
        }
    }

    return {
        id: id,
        displayName: displayName,
        uniqueName: uniqueName,
        imageUrl: getIdentityImageUrl(id, uniqueName)
    };
}

export function parseUniquefiedIdentityName(distinctName: string): IdentityRef {
    if (isNullOrWhiteSpace(distinctName)) {
        return {
            id: null,
            displayName: null,
            uniqueName: null,
            imageUrl: null
        };
    }

    const i = distinctName.lastIndexOf("<");
    const j = distinctName.lastIndexOf(">");
    let displayName = distinctName;
    let uniqueName: string;
    let id: string;

    if (i >= 0 && j > i && j === distinctName.length - 1) {
        displayName = distinctName.substr(0, i).trim();
        const rightPart = distinctName.substr(i + 1, j - i - 1).trim();
        const idAndUniqueName = parseIdAndUniqueName(rightPart);
        id = idAndUniqueName.id;
        uniqueName = idAndUniqueName.uniqueName;
    }

    return {
        id: id,
        displayName: displayName,
        uniqueName: uniqueName,
        imageUrl: getIdentityImageUrl(id, uniqueName)
    };
}

export function getIdentityImageUrl(id: string, uniqueName?: string): string {
    if (!isNullOrWhiteSpace(id)) {
        return `${VSS.getWebContext().host.uri}/_api/_common/IdentityImage?id=${id}`;
    }
    else if (!isNullOrWhiteSpace(uniqueName)) {
        return `${VSS.getWebContext().host.uri}/_api/_common/IdentityImage?identifier=${uniqueName}&identifierType=0`;
    }

    return null;
}

function getVsIdFromGroupUniqueName(str: string): string {
    let leftPart: string;
    if (isNullOrWhiteSpace(str)) { return ""; }

    let vsid = null;
    const i = str.lastIndexOf("\\");
    if (i === -1) {
        leftPart = str;
    }
    else {
        leftPart = str.substr(0, i);
    }

    if (startsWith(leftPart, "id:")) {
        const rightPart = leftPart.substr(3).trim();
        vsid = isGuid(rightPart) ? rightPart : "";
    }

    return vsid;
}

function parseIdAndUniqueName(str: string): {id: string, uniqueName: string} {
    if (isNullOrWhiteSpace(str)) {
        return {id: null, uniqueName: null};
    }

    const parts = str.split(";");
    if (parts.length === 1) {
        if (isGuid(parts[0])) {
            return {id: parts[0], uniqueName: null};
        }
        return {id: null, uniqueName: parts[0]};
    }
    else {
        return {id: parts[0], uniqueName: parts[1]};
    }
}
