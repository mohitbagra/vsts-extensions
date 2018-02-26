import { StaticObservable } from "Library/Utilities/StaticObservable";

// tslint:disable-next-line:no-function-expression
(function ($: any) {
    "use strict";

    $.extend(true, ($ as any).trumbowyg, {
        langs: {
            en: {
                upload: "Upload",
                file: "File",
                uploadError: "Error"
            }
        },

        plugins: {
            upload: {
                init: (trumbowyg: any) => {
                    const btnDef = {
                        fn: () => {
                            trumbowyg.saveRange();

                            let file;

                            trumbowyg.openModalInsert(
                                // Title
                                trumbowyg.lang.upload,

                                // Fields
                                {
                                    file: {
                                        type: "file",
                                        required: true,
                                        attributes: {
                                            accept: "image/*"
                                        }
                                    }
                                },

                                // Callback
                                () => {
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
                                                    trumbowyg.closeModal();
                                                }
                                            },
                                            "imagepasted"
                                        );
                                    };
                                    reader.readAsDataURL(file);
                                }
                            );

                            $("input[type=file]").on("change", (e) => {
                                file = (e.target as any).files[0];
                            });
                        }
                    };

                    trumbowyg.addBtnDef("upload", btnDef);
                }
            }
        }
    });
})(jQuery);
