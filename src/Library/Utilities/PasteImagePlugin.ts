import { StaticObservable } from "Library/Utilities/StaticObservable";

 // tslint:disable-next-line:no-function-expression
(function ($: any) {
    "use strict";

    $.extend(true, ($ as any).trumbowyg, {
        plugins: {
            pasteImage: {
                init: (trumbowyg: any) => {
                    trumbowyg.pasteHandlers.push((pasteEvent) => {
                        try {
                            const items = (pasteEvent.originalEvent || pasteEvent).clipboardData.items;

                            for (let i = items.length - 1; i >= 0; i += 1) {
                                if (items[i].type.indexOf("image") === 0) {
                                    const reader = new FileReader();
                                    reader.onloadend = (event) => {
                                        const data = (event.target as any).result;

                                        StaticObservable.getInstance().notify(
                                            {
                                                data: data,
                                                callback: (imageUrl: string) => {
                                                    if (imageUrl) {
                                                        trumbowyg.execCmd("insertImage", imageUrl, undefined, true);
                                                        $([`img[src="${imageUrl}"]:not([alt])`].join(""), trumbowyg.$box).css("width", "auto").css("max-height", "400px");
                                                    }
                                                }
                                            },
                                            "imagepasted"
                                        );
                                    };

                                    const file = items[i].getAsFile();
                                    reader.readAsDataURL(file);

                                    break;
                                }
                            }
                        } catch {
                            // eat up
                        }
                    });
                }
            }
        }
    });
})(jQuery);
