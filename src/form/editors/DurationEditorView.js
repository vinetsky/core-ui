import { keyCode, dateHelpers, helpers } from 'utils';
import LocalizationService from '../../services/LocalizationService';
import template from './templates/durationEditor.hbs';
import BaseEditorView from './base/BaseEditorView';
import formRepository from '../formRepository';
import iconWrapRemove from './iconsWraps/iconWrapRemove.html';
import iconWrapNumber from './iconsWraps/iconWrapNumber.html';

const focusablePartId = {
    DAYS: 'days',
    HOURS: 'hours',
    MINUTES: 'minutes',
    SECONDS: 'seconds'
};

const changeModes = {
    keydown: 'keydown',
    blur: 'blur'
};

const createFocusableParts = function(options) {
    const result = [];
    const settings = {};
    settings.daysSettings = _.defaultsPure(options.days, options.allFocusableParts, {
        text: LocalizationService.get('CORE.FORM.EDITORS.DURATION.WORKDURATION.DAYS'),
        maxLength: 4
    });
    settings.hoursSettings = _.defaultsPure(options.hours, options.allFocusableParts, {
        text: LocalizationService.get('CORE.FORM.EDITORS.DURATION.WORKDURATION.HOURS'),
        maxLength: 4
    });
    settings.minutesSettings = _.defaultsPure(options.minutes, options.allFocusableParts, {
        text: LocalizationService.get('CORE.FORM.EDITORS.DURATION.WORKDURATION.MINUTES'),
        maxLength: 4
    });
    settings.secondsSettings = _.defaultsPure(options.seconds, options.allFocusableParts, {
        text: LocalizationService.get('CORE.FORM.EDITORS.DURATION.WORKDURATION.SECONDS'),
        maxLength: 4
    });
    Object.values(settings).forEach(setting => (setting.text = ` ${setting.text}`)); //RegExp in getSegmentValue method based on ' ' (\s)
    if (options.allowDays) {
        result.push({
            id: focusablePartId.DAYS,
            text: settings.daysSettings.text,
            maxLength: settings.daysSettings.maxLength,
            milliseconds: 1000 * 60 * 60 * options.hoursPerDay
        });
    }
    if (options.allowHours) {
        result.push({
            id: focusablePartId.HOURS,
            text: settings.hoursSettings.text,
            maxLength: settings.hoursSettings.maxLength,
            milliseconds: 1000 * 60 * 60
        });
    }
    if (options.allowMinutes) {
        result.push({
            id: focusablePartId.MINUTES,
            text: settings.minutesSettings.text,
            maxLength: settings.minutesSettings.maxLength,
            milliseconds: 1000 * 60
        });
    }
    if (options.allowSeconds) {
        result.push({
            id: focusablePartId.SECONDS,
            text: settings.secondsSettings.text,
            maxLength: settings.secondsSettings.maxLength,
            milliseconds: 1000
        });
    }
    return result;
};

const defaultOptions = () => ({
    hoursPerDay: 24,
    allowDays: true,
    allowHours: true,
    allowMinutes: true,
    allowSeconds: true,
    showTitle: true,
    showEmptyParts: false,
    hideClearButton: false,
    changeMode: changeModes.blur,
    fillZero: false,
    normalTime: false,
    class: '',
    emptyPlaceholder: Localizer.get('CORE.FORM.EDITORS.DURATION.NOTSET'),
    max: undefined,
    days: undefined,
    hours: undefined,
    minutes: undefined,
    seconds: undefined,
    min: undefined
    // allFocusableParts: undefined,
    // seconds: undefined // days, minutes, hours
});

const stateModes = {
    EDIT: 'edit',
    VIEW: 'view'
};

/**
 * @name DurationEditorView
 * @memberof module:core.form.editors
 * @class Inline duration editor. Supported data type: <code>String</code> in ISO8601 format (for example: 'P4DT1H4M').
 * @extends module:core.form.editors.base.BaseEditorView
 * @param {Object} options Options object. All the properties of {@link module:core.form.editors.base.BaseEditorView BaseEditorView} class are also supported.
 * @param {Number} [options.hoursPerDay=24] The amount of hours per day. The intended use case is counting work days taking work hours into account.
 * The logic is disabled by default: a day is considered as 24 hours.
 * @param {Boolean} [options.allowDays=true] Whether to display the day segment. At least one segment must be displayed.
 * @param {Boolean} [options.allowHours=true] Whether to display the hour segment. At least one segment must be displayed.
 * @param {Boolean} [options.allowMinutes=true] Whether to display the minute segment. At least one segment must be displayed.
 * @param {Boolean} [options.allowSeconds=true] Whether to display the second segment. At least one segment must be displayed.
 * @param {Boolean} {options.showTitle=true} Whether to show title attribute.
 * @param {Object}  [seconds] second Options
 * @param {Number}  [seconds.maxLength=4] Max digit capacity of seconds
 * @param {Number}  [seconds.text=(localization)] Separator. Show after part.
 * Similar options for days, hours, minutes. If all options are similar, use @param {Object} [allFocusableParts] by default.
 * @param {Object, String, Number} [max, min] Max, min value. Type - like arg for moment.duration
 * */

export default formRepository.editors.Duration = BaseEditorView.extend({
    initialize(options = {}) {
        this.__applyOptions(options, defaultOptions);
        this.focusableParts = createFocusableParts(this.options);

        this.state = {
            mode: stateModes.VIEW,
            displayValue: dateHelpers.durationISOToObject(this.value)
        };
    },

    template: Handlebars.compile(template),

    templateContext() {
        return {
            size: this.__getInputSize(),
            showIcon: !this.readonly || this.value
        };
    },

    focusElement: '.js-input',

    className: 'js-duration editor editor_duration',

    ui: {
        input: '.js-input',
        clearButton: '.js-clear-button'
    },

    regions: {
        durationRegion: 'js-duration'
    },

    events: {
        'click @ui.clearButton': '__onClearClickHandler',
        'dblclick @ui.clearButton': '__onClearDblclick',
        'focus @ui.input': '__focus',
        'click @ui.input': '__onClick',
        'blur @ui.input': '__onBlur',
        'keydown @ui.input': '__keydown',
        'keyup @ui.input': '__keyup',
        mouseenter: '__onMouseenter'
    },

    __onClearClick() {
        if (this.__isDoubleClicked) {
            this.__isDoubleClicked = false;
            return;
        }
        this.triggeredByClean = true;
        this.__updateState({
            mode: stateModes.VIEW,
            displayValue: null
        });
        this.__value(null, true);
        this.focus();
    },

    __onClick() {
        this.trigger('click');
        this.__focus();
    },

    __focus() {
        if (this.readonly) {
            return;
        }
        const curretPos = this.getCaretPos();
        this.__updateState({
            mode: stateModes.EDIT
        });
        const pos = this.fixCaretPos(curretPos);
        this.setCaretPos(pos);
    },

    __onBlur() {
        if (this.state.mode === stateModes.VIEW) {
            return;
        }

        this.__updateValueByInput(true);
    },

    __getInputSize(value) {
        const inEditMode = this.state.mode === stateModes.EDIT;
        const inputValue = value || this.state.displayValue;
        const minInputSize = 5;
        const valueString = value || this.__createInputString(inputValue, inEditMode);
        const specialCoefficient = 0.97; // to get new size, this is because length refers to number of characters, where as size in most browsers refers to em units
        const valueSymbols = valueString.split('');
        if (valueSymbols.length === 0) {
            return minInputSize * specialCoefficient;
        }
        const colons = valueSymbols.filter(symbol => symbol === ':').length;
        const letters = valueSymbols.length - colons;
        const durationSize = letters * specialCoefficient + colons * 0.3; // because duration has ':'
        return durationSize;
    },

    __updateValueByInput(updateState) {
        let valueObject = this.__getObjectValueFromInput();

        valueObject = this.__checkMaxMinObject(valueObject, this.options.max, this.options.min);

        if (updateState) {
            this.__updateState({
                mode: stateModes.VIEW,
                displayValue: valueObject
            });
        }

        if (this.triggeredByClean) {
            this.triggeredByClean = false;
            if (Object.values(valueObject).every(value => value === 0)) {
                // this.ui.input.val(null);
                // this.__value(null, true);
                return;
            }
        }
        this.__value(moment.duration(valueObject).toISOString(), true);
    },

    __getObjectValueFromInput() {
        const values = this.getSegmentValue();
        const valueObject = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        };
        this.focusableParts.forEach((seg, i) => {
            valueObject[seg.id] = Number(values[i]);
        });

        const days = valueObject.days;

        const devider = 24 / this.options.hoursPerDay;

        const realDays = Math.floor(days / devider);
        const daysRemainder = days % devider;

        valueObject.days = realDays;
        valueObject.hours += daysRemainder * this.options.hoursPerDay;

        return valueObject;
    },

    getCaretPos() {
        return this.ui.input[0].selectionStart;
    },

    fixCaretPos(pos) {
        let resultPosition;
        const index = this.getSegmentIndex(pos);
        const focusablePart1 = this.focusableParts[index];
        const focusablePart2 = this.focusableParts[index + 1];
        if (pos >= focusablePart1.start && pos <= focusablePart1.end) {
            resultPosition = pos;
        } else if (pos > focusablePart1.end && (focusablePart2 ? pos < focusablePart2.start : true)) {
            resultPosition = focusablePart1.end;
        }
        return resultPosition !== undefined ? resultPosition : focusablePart1.start;
    },

    setCaretPos(pos) {
        this.ui.input[0].setSelectionRange(pos, pos);
    },

    moveCaret(delta) {
        this.setCaretPos(this.getCaretPos() + delta);
    },

    getSegmentIndex(pos) {
        // returns the index of the segment where we are at
        let i;
        let segmentIndex;

        segmentIndex = this.focusableParts.length - 1;
        this.initSegmentStartEnd();
        for (i = 0; i < this.focusableParts.length; i++) {
            const focusablePart1 = this.focusableParts[i];
            const focusablePart2 = this.focusableParts[i + 1];
            if (focusablePart1.start <= pos && pos <= focusablePart1.end) {
                // the position is within the first segment
                segmentIndex = i;
                break;
            }
            if (focusablePart2) {
                if (focusablePart1.end < pos && pos < focusablePart2.start) {
                    const whitespaceLength = 1;
                    if (pos < focusablePart2.start - whitespaceLength) {
                        // the position is at '1 <here>d 2 h' >> first fragment
                        segmentIndex = i;
                    } else {
                        // the position is at '1 d<here> 2 h' >> second fragment
                        segmentIndex = i + 1;
                    }
                    break;
                }
            }
        }
        return segmentIndex;
    },

    getSegmentValue(index) {
        const segments = [];
        for (let i = 0; i < this.focusableParts.length; i++) {
            // matches '123 d' segment
            segments.push('(\\S*)\\s+\\S*');
        }
        const regexStr = `^\\s*${segments.join('\\s+')}$`;
        let result = new RegExp(regexStr, 'g').exec(this.ui.input.val());
        if (!result) {
            result = this.focusableParts.map(() => '0');
            result.push('0');
        }
        return index !== undefined ? result[index + 1] : result.slice(1, this.focusableParts.length + 1);
    },

    getCurrentSegmentValue() {
        return this.getSegmentValue(this.getSegmentIndex(this.getCaretPos()));
    },

    setSegmentValue(index, value, replace) {
        let val = this.getSegmentValue(index);
        val = !replace ? parseInt(val) + value : value;
        if (val < 0) {
            return false;
        }
        if (this.options.normalTime) {
            val = this.__floorTime(val, this.focusableParts[index].id);
        }
        val = val.toString();
        if (val.length > this.focusableParts[index].maxLength) {
            return false;
        }
        const str = this.ui.input.val();
        this.ui.input.val(str.substr(0, this.focusableParts[index].start) + val + str.substr(this.focusableParts[index].end));
        return true;
    },

    atSegmentEnd(position) {
        const index = this.getSegmentIndex(position);
        return position === this.focusableParts[index].end;
    },

    atSegmentStart(position) {
        const index = this.getSegmentIndex(position);
        return position === this.focusableParts[index].start;
    },

    __value(value, triggerChange) {
        if (value === this.value) {
            return;
        }
        this.value = value;
        this.__updateEmpty();

        if (triggerChange) {
            this.__triggerChange();
        }
    },

    __keydown(event) {
        // this.ui.input[0].hasAttribute('readonly') for time editor, because setReadonly set tabindex -1
        if (event.ctrlKey || !this.getEditable() || this.ui.input[0].hasAttribute('readonly')) {
            return;
        }
        const position = this.getCaretPos();
        const index = this.getSegmentIndex(position);
        const focusablePart = this.focusableParts[index];
        switch (event.keyCode) {
            case keyCode.UP:
                if (this.setSegmentValue(index, 1)) {
                    this.initSegmentStartEnd();
                    this.setCaretPos(focusablePart.end);
                }
                return false;
            case keyCode.DOWN:
                if (this.setSegmentValue(index, -1)) {
                    this.initSegmentStartEnd();
                    this.setCaretPos(focusablePart.end);
                }
                return false;
            case keyCode.PAGE_UP:
                if (this.setSegmentValue(index, 10)) {
                    this.initSegmentStartEnd();
                    this.setCaretPos(focusablePart.end);
                }
                return false;
            case keyCode.PAGE_DOWN:
                if (this.setSegmentValue(index, -10)) {
                    this.initSegmentStartEnd();
                    this.setCaretPos(focusablePart.end);
                }
                return false;
            case keyCode.LEFT:
                if (this.atSegmentStart(position)) {
                    this.__setCaretToPreviousPart(index);
                    return false;
                }
                break;
            case keyCode.RIGHT:
                if (this.atSegmentEnd(position)) {
                    this.__setCaretToNextPart(index);
                    return false;
                }
                break;
            case keyCode.DELETE:
                if (this.atSegmentEnd(position)) {
                    this.__setCaretToNextPart(index);
                    return false;
                }
                if (this.getCurrentSegmentValue().length === 1) {
                    this.__replaceModeFor(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], '0', 'right');
                    this.moveCaret(1);
                    return false;
                }
                break;
            case keyCode.BACKSPACE:
                if (this.atSegmentStart(position)) {
                    this.__setCaretToPreviousPart(index);
                    return false;
                }
                if (this.getCurrentSegmentValue().length === 1) {
                    this.__replaceModeFor(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], '0', 'left');
                    this.moveCaret(-1);
                    return false;
                }
                break;
            case keyCode.ESCAPE:
                this.ui.input.blur();
                this.__updateState({
                    mode: stateModes.VIEW
                });
                break;
            case keyCode.ENTER:
                break;
            case keyCode.TAB: {
                const delta = event.shiftKey ? -1 : 1;
                if (this.focusableParts[index + delta]) {
                    this.setCaretPos(this.focusableParts[index + delta].start);
                    return false;
                }
                break;
            }
            case keyCode.HOME:
                this.setCaretPos(this.focusableParts[0].start);
                return false;
            case keyCode.END:
                this.setCaretPos(this.focusableParts[this.focusableParts.length - 1].end);
                return false;
            default: {
                let charValue = null;
                if (event.keyCode >= keyCode.NUM_0 && event.keyCode <= keyCode.NUM_9) {
                    charValue = event.keyCode - keyCode.NUM_0;
                } else if (event.keyCode >= keyCode.NUMPAD_0 && event.keyCode <= keyCode.NUMPAD_9) {
                    charValue = event.keyCode - keyCode.NUMPAD_0;
                }
                const valid = charValue !== null;
                if (!valid) {
                    return false;
                }
                if (this.getCurrentSegmentValue() === '0' && this.atSegmentEnd(position)) {
                    this.__replaceModeFor(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], '', 'left');
                    this.moveCaret(-1);
                } else {
                    this.__replaceModeFor(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
                }
                if (this.getSegmentValue(index).length >= focusablePart.maxLength) {
                    return false;
                }
            }
        }

        this.trigger('keydown', event);
    },

    __keyup(event) {
        if (event.ctrlKey || this.readonly) {
            return;
        }
        if (event.keyCode === keyCode.ENTER || this.options.changeMode === changeModes.keydown) {
            this.__updateValueByInput();
        }
        if (
            (event.keyCode >= keyCode.NUM_0 && event.keyCode <= keyCode.NUM_9) ||
            (event.keyCode >= keyCode.NUMPAD_0 && event.keyCode <= keyCode.NUMPAD_9) ||
            event.keyCode === keyCode.DELETE
        ) {
            const position = this.getCaretPos();
            const index = this.getSegmentIndex(position);
            const focusablePart = this.focusableParts[index];
            const segmentValue = this.getSegmentValue(index);
            if (segmentValue.length < focusablePart.maxLength) {
                return;
            }
            if (this.atSegmentEnd(position)) {
                if (this.options.normalTime) {
                    this.setSegmentValue(index, this.__floorTime(segmentValue, focusablePart.id), true);
                }
                this.__setCaretToNextPart(index);
            }
        }
        if (event.keyCode === keyCode.BACKSPACE) {
            const position = this.getCaretPos();
            const index = this.getSegmentIndex(position);
            const focusablePart = this.focusableParts[index];
            if (this.getSegmentValue(index).length < focusablePart.maxLength) {
                return;
            }
            if (this.atSegmentStart(position)) {
                this.__setCaretToPreviousPart(index);
            }
        }
    },

    __floorTime(segValue, id) {
        const maxValue = {
            [focusablePartId.DAYS]: 31,
            [focusablePartId.HOURS]: 23,
            [focusablePartId.MINUTES]: 59,
            [focusablePartId.SECONDS]: 59
        };
        return Number(segValue) > maxValue[id] ? maxValue[id] : segValue;
    },

    __setCaretToNextPart(index) {
        if (this.focusableParts[index + 1]) {
            this.setCaretPos(this.focusableParts[index + 1].start);
        }
    },

    __setCaretToPreviousPart(index) {
        if (this.focusableParts[index - 1]) {
            this.setCaretPos(this.focusableParts[index - 1].end);
        }
    },

    __replaceModeFor(arrChar, insertChar = '', direction = 'right') {
        const inpValue = this.ui.input.val();
        const dirClarity = direction === 'left' ? 1 : 0;
        const caretPos = this.getCaretPos();
        const valueAfterCaret = inpValue[caretPos - dirClarity];
        if (arrChar.some(char => char === valueAfterCaret)) {
            this.ui.input.val(this.__replaceChar(inpValue, caretPos - dirClarity, insertChar));
            this.setCaretPos(caretPos);
        }
    },

    __replaceChar(str, i, insertChar = '') {
        return str.substr(0, i) + insertChar + str.slice(i + 1);
    },

    initSegmentStartEnd() {
        const values = this.getSegmentValue();
        let start = 0;
        for (let i = 0; i < this.focusableParts.length; i++) {
            const focusablePart = this.focusableParts[i];
            if (i > 0) {
                // counting whitespace before the value of the segment
                start++;
            }
            focusablePart.start = start;
            focusablePart.end = focusablePart.start + values[i].length;
            start = focusablePart.end + focusablePart.text.length;
        }
    },

    __createInputString(value, editable) {
        // The methods creates a string which reflects current mode (view/edit) and value.
        // The string is set into UI in __updateState

        const isNull = value === null;
        const seconds = !isNull ? value.seconds : 0;
        const minutes = !isNull ? value.minutes : 0;
        const hours = !isNull ? value.hours : 0;
        const days = !isNull ? value.days : 0;
        const data = {
            [focusablePartId.DAYS]: days,
            [focusablePartId.HOURS]: hours,
            [focusablePartId.MINUTES]: minutes,
            [focusablePartId.SECONDS]: seconds
        };

        if (!editable && isNull) {
            // null value is rendered as empty text
            return '';
        }
        if (!this.options.showEmptyParts && !editable) {
            const filledSegments = this.focusableParts.filter(part => Boolean(data[part.id]));
            if (filledSegments.length > 0) {
                // returns string like '0d 4h 32m'
                return filledSegments.reduce((p, seg) => `${p}${data[seg.id]}${seg.text} `, '').trim();
            }
            // returns string like '0d'
            return `0${this.focusableParts[0].text}`;
        }
        // always returns string with all editable segments like '0 d 5 h 2 m'
        return this.focusableParts
            .map(seg => {
                const val = data[seg.id];
                let valStr = this.options.showEmptyParts ? String(val) : _.isNumber(val) ? String(val) : '';
                valStr = this.options.fillZero ? this.__fillZero(valStr, seg.maxLength) : valStr;
                return valStr + seg.text;
            })
            .join(' ');
    },

    __fillZero(string, length) {
        const mask = '000000000000';
        return (mask + string).slice(-length);
    },

    __normalizeDuration(object) {
        // Data normalization:
        // Object like this: { days: 2, hours: 3, minutes: 133, seconds: 0 }
        // Is converted into this: { days: 2, hours: 5, minutes: 13, seconds: 0 }
        // But if hours segment is disallowed, it will look like this: { days: 2, hours: 0, minutes: 313, seconds: 0 } // 313 = 133 + 3*60

        if (object === null) {
            return null;
        }

        let totalMilliseconds = moment.duration(object).asMilliseconds();
        const result = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        };
        this.focusableParts.forEach(seg => {
            result[seg.id] = Math.floor(totalMilliseconds / seg.milliseconds);
            totalMilliseconds %= seg.milliseconds;
        });
        return result;
    },

    setValue(value, triggerChange) {
        this.__value(value, triggerChange);
        this.__updateState({
            mode: stateModes.VIEW,
            displayValue: dateHelpers.durationISOToObject(value)
        });
    },

    __updateState(newState) {
        // updates inner state variables
        // updates UI

        if (!newState.mode || (newState.mode === stateModes.EDIT && newState.displayValue !== undefined)) {
            helpers.throwInvalidOperationError("The operation is inconsistent or isn't supported by this logic.");
        }

        if (this.state.mode === newState.mode && newState.mode === stateModes.EDIT) {
            return;
        }

        this.state.mode = newState.mode;
        if (newState.displayValue !== undefined) {
            this.state.displayValue = newState.displayValue;
        }

        if (!this.isRendered()) {
            return;
        }

        const normalizedDisplayValue = this.__normalizeDuration(this.state.displayValue);
        const inEditMode = this.state.mode === stateModes.EDIT;
        const val = this.__createInputString(normalizedDisplayValue, inEditMode);
        this.ui.input.get(0).size = this.__getInputSize(val);
        this.ui.input.val(val);
        if (this.options.showTitle && !inEditMode) {
            this.$editorEl.prop('title', val);
        }
    },

    __onMouseenter() {
        this.$editorEl.off('mouseenter');

        if (!this.options.hideClearButton) {
            this.renderIcons(iconWrapNumber, iconWrapRemove);
        }
    },

    __checkMaxMinObject(valueObject, maxValue, minValue) {
        let value = moment.duration(valueObject).asMilliseconds();
        if (maxValue != null) {
            const max = moment.duration(maxValue).asMilliseconds();
            value = value > max ? max : value;
        }
        if (minValue != null) {
            const min = moment.duration(minValue).asMilliseconds();
            value = value < min ? min : value;
        }
        return dateHelpers.durationToObject(value);
    }
});
