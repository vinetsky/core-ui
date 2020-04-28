import template from '../templates/referenceListItem.hbs';
import list from 'list';
import { htmlHelpers } from '../../../../../utils';

const classes = {
    SELECTED: 'editor_checked'
};

export default Marionette.View.extend({
    className() {
        return `dd-list__i${this.options.showCheckboxes ? ' dd-list__i_checkbox' : ''}`;
    },

    tagName: 'tr',

    behaviors: [
        {
            behaviorClass: list.views.behaviors.ListItemViewBehavior,
            multiSelect: true,
            selectOnCursor: false
        }
    ],

    template: Handlebars.compile(template),

    templateContext() {
        const text = this.options.getDisplayText(this.model.toJSON());

        return {
            textForTitle: this.model.get('title') || htmlHelpers.getTextfromHTML(text),
            text,
            showCheckboxes: this.options.showCheckboxes
        };
    },

    onRender() {
        if (this.model.selected) {
            this.__markSelected();
        } else {
            this.__markDeselected();
        }
    },

    modelEvents: {
        selected: '__markSelected',
        deselected: '__markDeselected'
    },

    __markSelected() {
        this.el.classList.add(classes.SELECTED);
        this.$el.find('.js-checkbox') && this.$el.find('.js-checkbox').addClass(classes.SELECTED);
    },

    __markDeselected() {
        this.el.classList.remove(classes.SELECTED);
        this.$el.find('.js-checkbox') && this.$el.find('.js-checkbox').removeClass(classes.SELECTED);
    }
});
