//@flow

import GridItemBehavior from '../models/behaviors/GridItemBehavior';
import CollapsibleBehavior from '../../models/behaviors/CollapsibleBehavior';
import CellViewFactory from '../CellViewFactory';

const classes = {
    selected: 'selected',
    expanded: 'collapsible-btn_expanded'
};

const defaultOptions = {
    levelMargin: 15,
    collapsibleButtonWidth: 14
};

/**
 * Some description for initializer
 * @name RowView
 * @memberof module:core.list.views
 * @class RowView
 * @extends Marionette.ItemView
 * @constructor
 * @description View используемый по умолчанию для отображения строки списка
 * @param {Object} options Constructor options
 * @param {Array} options.columns Массив колонк
 * @param {Object} options.gridEventAggregator ?
 * @param {Number} [options.paddingLeft=20] Левый отступ
 * @param {Number} [options.paddingRight=10] Правый отступ
 * */
export default Marionette.ItemView.extend({
    className: 'record-row grid-row',

    ui: {
        cells: '.js-grid-cell',
        collapsibleButton: '.js-collapsible-button'
    },

    events: {
        click: '__onClick',
        dblclick: '__onDblClick',
        'click @ui.collapsibleButton': '__toggleCollapse'
    },

    modelEvents: {
        selected: '__handleSelection',
        deselected: '__handleDeselection',
        highlighted: '__handleHighlight',
        unhighlighted: '__handleUnhighlight'
    },

    initialize() {
        _.defaults(this.options, defaultOptions);

        // TODO: think about implementation in tree or grouped grids
        // this.listenTo(this.model, 'checked', this.__onModelChecked);
        // this.listenTo(this.model, 'unchecked', this.__onModelUnchecked);
    },

    getValue(id) {
        this.model.get(id);
    },

    onRender() {
        const model = this.model;
        if (model.selected) {
            this.__handleSelection();
        }
        if (model.highlighted) {
            this.__handleHighlight(model.highlightedFragment);
        }
    },

    onDestroy() {
        if (this.cellViews) {
            this.cellViews.forEach(x => x.destroy());
        }
    },

    updateCollapsed(collapsed, external) {
        if (!collapsed) {
            this.model.expand();
            if (external) {
                this.model.hidden = false;
            }
        } else {
            this.model.collapse();
            if (this.model.level && external) {
                this.model.hidden = true;
            }
        }
    },

    _renderTemplate() {
        this.cellViews = [];
        this.cellViewsEl = [];
        let isFirstChild = true;

        this.options.columns.forEach((gridColumn, index) => {
            const id = gridColumn.id;

            let value;

            if (gridColumn.cellViewOptions && gridColumn.cellViewOptions.getValue) { //todo WTF
                value = gridColumn.cellViewOptions.getValue.apply(this, [gridColumn]);
            } else {
                value = this.model.get(id);
            }

            this.model.set({ value }, { silent: true });

            /*
            let schemaExtension;

            if (_.isFunction(gridColumn.schemaExtension)) {
                schemaExtension = gridColumn.schemaExtension(this.model);
            }
            const rowModel = this.model.get('rowModel');

            if (_.isFunction(gridColumn.getReadonly)) {
                readonly = gridColumn.getReadonly(rowModel);
                this.listenTo(rowModel, 'change', () => this.editorView.editor.setReadonly(gridColumn.getReadonly(rowModel)));
            }

            if (_.isFunction(gridColumn.getHidden)) {
                hidden = gridColumn.getHidden(rowModel);
                this.listenTo(rowModel, 'change', () => this.editorView.editor.setHidden(gridColumn.getHidden(rowModel)));
            }

            if (_.isFunction(gridColumn.schemaExtension)) {
                schemaExtension = gridColumn.schemaExtension(rowModel);
            }
            */

            const cellView = new (CellViewFactory.getCellViewForColumn(gridColumn))({
                className: `grid-cell ${this.getOption('uniqueId')}-column${index}`,
                schema: gridColumn,
                model: this.model,
                key: gridColumn.key || gridColumn.id
            });

            if (this.getOption('isTree') && isFirstChild && !gridColumn.viewModel.get('isCheckboxColumn')) {
                const level = this.model.level || 0;
                const margin = level * this.options.levelMargin;
                const hasChildren = this.model.children && this.model.children.length;

                cellView.on('render', () => {
                    if (hasChildren) {
                        cellView.el.insertAdjacentHTML(
                            'afterbegin',
                            `<span class="collapsible-btn js-collapsible-button ${this.model.collapsed === false ? classes.expanded : ''}" style="margin-left:${margin}px;"></span>`
                        );
                    } else {
                        cellView.el.insertAdjacentHTML('afterbegin', `<span style="margin-left:${margin + defaultOptions.collapsibleButtonWidth}px;"></span>`);
                    }
                });

                isFirstChild = false;
            }
            cellView.render();

            this.cellViews.push(cellView);
            this.cellViewsEl.push(cellView.$el);
        });
        this.$el.append(this.cellViewsEl);
    },

    __handleHighlight(fragment) {
        this.cellViews.forEach(cellView => {
            cellView.model.set('highlightedFragment', fragment);
        });
    },

    __handleUnhighlight() {
        this.cellViews.forEach(cellView => {
            cellView.model.set('highlightedFragment', null);
        });
    },

    __onClick(e) {
        const model = this.model;
        const selectFn = model.collection.selectSmart || model.collection.select;
        if (selectFn) {
            selectFn.call(model.collection, model, e.ctrlKey, e.shiftKey);
        }
        this.trigger('click', this.model);
    },

    __onDblClick() {
        this.trigger('dblclick', this.model);
    },

    setFitToView() {
        this.__setInitialWidth();
    },

    __handleSelection() {
        this.el.classList.add(classes.selected);
    },

    __handleDeselection() {
        this.el.classList.remove(classes.selected);
    },

    __toggleCollapse() {
        this.updateCollapsed(this.model.collapsed === undefined ? false : !this.model.collapsed);
        this.trigger('toggle:collapse', this.model);
        return false;
    },

    __onModelChecked() {
        this.internalCheck = true;
        if (this.model.children && this.model.children.length) {
            this.model.children.forEach(model => {
                model.check();
            });
        }
        this.internalCheck = false;
        this.__updateParentChecked();
    },

    __onModelUnchecked() {
        this.internalCheck = true;
        if (this.model.children && this.model.children.length) {
            this.model.children.forEach(model => {
                model.uncheck();
            });
        }
        this.internalCheck = false;
        this.__updateParentChecked();
    },

    __updateParentChecked() {
        if (this.internalCheck) {
            return;
        }
        const parentModel = this.model.parentModel;
        if (parentModel) {
            let checkedChildren = 0;
            parentModel.children.forEach(child => {
                if (child.checked) {
                    checkedChildren++;
                }
            });
            if (checkedChildren === 0) {
                parentModel.uncheck();
            } else if (parentModel.children.length === checkedChildren) {
                parentModel.check();
            } else {
                parentModel.checkSome();
            }
        }
    }
});
