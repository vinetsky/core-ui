
import template from './templates/documentExpressionEditor.html';
import NewExpressionEditorView from './NewExpressionEditorView';
import formRepository from '../formRepository';

const defaultOptions = {
    showTemplate: true
};

const valueTypes = {
    value: 'value',
    context: 'context',
    expression: 'expression',
    script: 'script',
    template: 'template'
};

export default NewExpressionEditorView.extend({
    initialize(options = {}) {
        _.extend(this.options, defaultOptions, _.pick(options || {}, _.keys(defaultOptions)));
        NewExpressionEditorView.prototype.initialize.call(this, options);
    },

    template: Handlebars.compile(template),


    regions: {
        typeContainer: '.js-new-expression-type-container',
        valueContainer: '.js-new-expression-value-container',
        contextContainer: '.js-new-expression-context-container',
        scriptContainer: '.js-new-expression-script-container',
        expressionContainer: '.js-new-expression-expression-container',
        templateContainer: '.js-new-expression-template-container'
    },

    ui: {
        type: '.js-new-expression-type-container',
        value: '.js-new-expression-value-container',
        context: '.js-new-expression-context-container',
        script: '.js-new-expression-script-container',
        expression: '.js-new-expression-expression-container',
        template: '.js-new-expression-template-container'
    },

    onShow() {
        this.valueTypeCollection = new Backbone.Collection(null, { comparator: false });

        this.__showValueEditor();
        this.__showContextEditor();
        this.__showExpressionEditor();
        this.__showScriptEditor();
        this.__showTemplateEditor();
        this.__showTypeEditor();
        this.__updateEditorState();
    },

    __showTemplateEditor() {
        if (!this.options.showTemplate) {
            return;
        }
        this.valueTypeCollection.add({
            id: valueTypes.template,
            text: Localizer.get('SUITEGENERAL.FORM.EDITORS.EXPRESSION.TEMPLATE')
        });

        this.templateEditor = new formRepository.editors.DropdownEditor(_.extend(this.options.templateEditorOptions, {
            value: this.value.type === valueTypes.template ? this.value.value : null,
        }));

        this.listenTo(this.templateEditor, 'change', this.__updateEditorValue);
        this.templateContainer.show(this.templateEditor);
    },

    __updateEditorState() {
        this.ui.value.toggleClass('hidden', this.value.type !== valueTypes.value);
        this.ui.expression.toggleClass('hidden', this.value.type !== valueTypes.expression);
        this.ui.script.toggleClass('hidden', this.value.type !== valueTypes.script);
        this.ui.context.toggleClass('hidden', this.value.type !== valueTypes.context);
        this.ui.template.toggleClass('hidden', this.value.type !== valueTypes.template);
    },

    __updateEditorValue() {
        const type = this.typeEditor.getValue();
        let value;
        switch (this.value.type) {
            case valueTypes.value:
                value = this.valueEditor.getValue();
                break;
            case valueTypes.context:
                value = this.contextEditor.getValue();
                break;
            case valueTypes.expression:
                value = this.expressionEditor ? this.expressionEditor.getValue() : null;
                break;
            case valueTypes.script:
                value = this.scriptEditor ? this.scriptEditor.getValue() : null;
                break;
            case valueTypes.template:
                value = this.templateEditor ? this.templateEditor.getValue() : null;
                break;
            default:
                break;
        }
        this.value = { type, value };
        this.__triggerChange();
    }
});
