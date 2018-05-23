export function first<T>(array: T[], predicate?: (value: T) => boolean): T {
    if (!array || array.length === 0) {
        return null;
    }

    if (predicate == null) {
        return array[0];
    }

    const items = array.filter(predicate);
    return (items && items.length > 0) ? items[0] : null;
}

export function findIndex<T>(array: T[], predicate: (param: T) => boolean): number {
    for (let i = 0; i < array.length; i++) {
        if (predicate(array[i])) {
            return i;
        }
    }

    return -1;
}

export function union<T>(arrayA: T[], arrayB: T[], comparer?: (a: T, b: T) => number): T[] {
    let result: T[];

    if (!arrayB || arrayB.length === 0) {
        return arrayA;
    }

    result = arrayA.concat(arrayB);
    uniqueSort(result, comparer);

    return result;
}

export function uniqueSort<T>(array: T[], comparer?: (a: T, b: T) => number): T[] {
    comparer = comparer || defaultComparer;

    array.sort(comparer);
    let l = array.length;

    for (let i = 1; i < l; i++) {
        if (comparer(array[i], array[i - 1]) === 0) {
            array.splice(i--, 1);
            l--;
        }
    }

    return array;
}

export function unique<T>(array: T[], comparer?: (a: T, b: T) => number): T[] {
    const result = array.slice(0);
    uniqueSort(result, comparer);

    return result;
}

export function removeWhere<T>(array: T[], predicate: (element: T) => boolean, count?: number, startAt: number = 0) {
    const indexesToRemove: number[] = [];
    for (let i = startAt; i < array.length; ++i) {
        if (predicate(array[i])) {
            indexesToRemove.push(i);
            if (indexesToRemove.length === count) {
                break;
            }
        }
    }
    removeAllIndexes(array, indexesToRemove);
}

export function removeAtIndex<T>(array: T[], index: number): boolean {
    return removeAllIndexes(array, [index]);
}

export function subtract<T>(arrayA: T[], arrayB: T[], comparer: (s: T, t: T) => boolean): T[] {
    const result: T[] = [];

    if (!arrayA || arrayA.length === 0 || !arrayB || arrayB.length === 0) {
        return arrayA;
    }

    for (const val of arrayA) {
        if (!contains(arrayB, val, comparer)) {
            result.push(val);
        }
    }

    return result;
}

export function removeAllIndexes<T>(array: T[], indexes: number[]): boolean {
    let result = true;
    const sortedIndexes = indexes.slice();
    sortedIndexes.sort((a, b) => Number(a) - Number(b));
    for (let i = sortedIndexes.length - 1; i >= 0; --i) {
        const index = sortedIndexes[i];
        if (index >= array.length || index < 0) {
            result = false;
            continue;
        }
        array.splice(index, 1);
    }
    return result;
}

export function contains<T>(array: T[], value: T, comparer: (s: T, t: T) => boolean): boolean {
    if (value == null) {
        return false;
    }

    for (const item of array) {
        if (comparer(item, value)) {
            return true;
        }
    }

    return false;
}

export function arrayEquals<T>(source: T[], target: T[], comparer?: (s: T, t: T) => boolean, sorted: boolean = false): boolean {
    if (!source && !target) {
        return true;
    }
    if ((!source && target) || (source && !target)) {
        return false;
    }

    if (source.length !== target.length) {
        return false;
    }

    if (!comparer) {
        comparer = defaultComparison;
    }

    if (!sorted) {
        for (const s of source) {
            if (!contains(target, s, comparer)) {
                return false;
            }
        }
    }
    else {
        for (let i = 0; i < source.length; i++) {
            if (!comparer(source[i], target[i])) {
                return false;
            }
        }
    }

    return true;
}

function defaultComparer<T>(a: T, b: T): number {
    if (a === b) {
        return 0;
    }
    else if (a > b) {
        return 1;
    }
    else {
        return -1;
    }
}

function defaultComparison<T>(a: T, b: T): boolean {
    return a === b;
}
