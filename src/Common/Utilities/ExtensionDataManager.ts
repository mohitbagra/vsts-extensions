import { ExtensionDataService } from "VSS/SDK/Services/ExtensionData";

let extensionDataService: ExtensionDataService;

async function getDataService(): Promise<ExtensionDataService> {
    if (!extensionDataService) {
        extensionDataService = await VSS.getService<ExtensionDataService>(VSS.ServiceIds.ExtensionData);
    }

    return extensionDataService;
}

/**
* Read user/account scoped documents
*/
export async function readDocuments<T>(key: string, isPrivate?: boolean): Promise<T[]> {
    const dataService: ExtensionDataService = await getDataService();
    let data: T[];

    try {
        data = await dataService.getDocuments(key, isPrivate ? { scopeType: "User" } : undefined);
    }
    catch (e) {
        data = [];
    }

    return data;
}

/**
* Read a specific user/account scoped document
*/
export async function readDocument<T>(key: string, id: string, defaultValue?: T, isPrivate?: boolean): Promise<T> {
    const dataService: ExtensionDataService = await getDataService();
    let data: T;
    try {
        data = await dataService.getDocument(key, id, isPrivate ? { scopeType: "User" } : undefined);
    }
    catch (e) {
        data = defaultValue;
    }

    return data;
}

/**
* Create user/account scoped document
*/
export async function createDocument<T>(key: string, data: T, isPrivate?: boolean): Promise<T> {
    const dataService: ExtensionDataService = await getDataService();
    return dataService.createDocument(key, data, isPrivate ? { scopeType: "User" } : undefined);
}

/**
* Update user/account scoped document
*/
export async function updateDocument<T>(key: string, data: T, isPrivate?: boolean): Promise<T> {
    const dataService: ExtensionDataService = await getDataService();
    return dataService.updateDocument(key, data, isPrivate ? { scopeType: "User" } : undefined);
}

/**
* Add or Update user/account scoped document
*/
export async function addOrUpdateDocument<T>(key: string, data: T, isPrivate?: boolean): Promise<T> {
    const dataService: ExtensionDataService = await getDataService();
    return dataService.setDocument(key, data, isPrivate ? { scopeType: "User" } : undefined);
}

/**
* Delete user/account scoped document
*/
export async function deleteDocument(key: string, id: string, isPrivate?: boolean): Promise<void> {
    const dataService: ExtensionDataService = await getDataService();
    return dataService.deleteDocument(key, id, isPrivate ? { scopeType: "User" } : undefined);
}

/**
* Read user extension settings
*/
export async function readSetting<T>(key: string, defaultValue?: T, isPrivate?: boolean): Promise<T> {
    const dataService: ExtensionDataService = await getDataService();
    try {
        const data = await dataService.getValue<T>(key, isPrivate ? { scopeType: "User" } : undefined);
        return data == null ? defaultValue : data;
    }
    catch (e) {
        return defaultValue;
    }
}

/**
* Write user extension settings
*/
export async function writeSetting<T>(key: string, data: T, isPrivate?: boolean): Promise<T> {
    const dataService: ExtensionDataService = await getDataService();
    return dataService.setValue<T>(key, data, isPrivate ? { scopeType: "User" } : undefined);
}

/**
* Query collection names
*/
export async function queryCollectionNames(collectionNames: string[]): Promise<ExtensionDataCollection[]> {
    const dataService: ExtensionDataService = await getDataService();
    return dataService.queryCollectionNames(collectionNames);
}

/**
* Query collection
*/
export async function queryCollections(collections: ExtensionDataCollection[]): Promise<ExtensionDataCollection[]> {
    const dataService: ExtensionDataService = await getDataService();
    return dataService.queryCollections(collections);
}
