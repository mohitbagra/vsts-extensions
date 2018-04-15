export enum WebSettingsScope {
    User = 1,
    Project = 4,
    ProjectAndUser = 5,
    Collection = 6,
    Root = 7,
}

export function writeLocalSetting(key: string, value: string, scope: WebSettingsScope) {
    const scopedKey = _getScopedKey(key, scope);
    if (scopedKey) {
        try {
            window.localStorage.setItem(scopedKey, value);
        }
        catch {
            // eat up
        }
    }
}

export function readLocalSetting(key: string, scope: WebSettingsScope, defaultValue?: string): string {
    const scopedKey = _getScopedKey(key, scope);
    if (scopedKey) {
        try {
            return window.localStorage.getItem(scopedKey) || defaultValue;
        } catch {
            return defaultValue;
        }
    }
    return null;
}

export function removeLocalSetting(key: string, scope: WebSettingsScope) {
    const scopedKey = _getScopedKey(key, scope);
    if (scopedKey) {
        try {
            window.localStorage.removeItem(scopedKey);
        }
        catch {
            // eat up
        }
    }
}

function _getScopedKey(key: string, scope: WebSettingsScope): string {
    const context = VSS.getWebContext();
    const user = context.user.id;
    const project = (context.project && context.project.id) || "";
    const collection = context.collection.id;

    switch (scope) {
        case WebSettingsScope.User:
            {
                return user + key;
            }

        case WebSettingsScope.Project:
            {
                return `${collection}/${project}${key}`;
            }

        case WebSettingsScope.ProjectAndUser:
            {
                return `${project}/${user}${key}`;
            }

        default:
            return null;
    }
}
