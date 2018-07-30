

import CanvasView from 'demoPage/views/CanvasView';

export default function () {
    const model = new Backbone.Model({
        numberValue: 42
    });

    return new CanvasView({
        view: new core.form.editors.NumberEditor({
            model,
            key: 'numberValue',
            changeMode: 'keydown',
            autocommit: true,
            min: -300,
            max: 300000,
            step: 3,
            allowFloat: true,
            format: '0,0[.]00'
        }),
        presentation: '{{numberValue}}',
        isEditor: true
    });
}
