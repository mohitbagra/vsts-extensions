import { Observable } from "VSSUI/Utilities/Observable";

export class Action<T> extends Observable<T> {
    private static executing: boolean = false;

    public invoke(payload: T): void {
        if (Action.executing) {
            console.warn("Cannot invoke an action from inside another action.");
        }

        Action.executing = true;

        try {
            this.notify(payload, null);
        }
        finally {
            Action.executing = false;
        }
    }

    public addListener(listener: (payload: T) => void) {
        this.subscribe(listener);
    }

    public removeListener(listener: (payload: T) => void) {
        this.unsubscribe(listener);
    }
}
