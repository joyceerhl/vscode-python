/**
 * Copyright (c) 2018 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { IEvent, IEventEmitter } from './EventEmitter';
import { IDeleteEvent, IInsertEvent } from './CircularList';
import { IParams } from './parser/Types';
import { IOptionsService, IUnicodeService } from './services/Services';

export interface ICoreTerminal {
    optionsService: IOptionsService;
    unicodeService: IUnicodeService;
}

export interface IDisposable {
    dispose(): void;
}

  /**
   * A string or number representing text font weight.
   */
  export type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | number;

  /**
   * A string representing log level.
   */
  export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'off';

type RendererType = 'dom' | 'canvas';

/**
 * An object containing start up options for the terminal.
 */
export interface IPublicTerminalOptions {
    /**
     * Whether to allow the use of proposed API. When false, any usage of APIs
     * marked as experimental/proposed will throw an error. This defaults to
     * true currently, but will change to false in v5.0.
     */
    allowProposedApi?: boolean;

    /**
     * Whether background should support non-opaque color. It must be set before
     * executing the `Terminal.open()` method and can't be changed later without
     * executing it again. Note that enabling this can negatively impact
     * performance.
     */
    allowTransparency?: boolean;

    /**
     * If enabled, alt + click will move the prompt cursor to position
     * underneath the mouse. The default is true.
     */
    altClickMovesCursor?: boolean;

    /**
     * A data uri of the sound to use for the bell when `bellStyle = 'sound'`.
     */
    bellSound?: string;

    /**
     * The type of the bell notification the terminal will use.
     */
    bellStyle?: 'none' | 'sound';

    /**
     * When enabled the cursor will be set to the beginning of the next line
     * with every new line. This is equivalent to sending '\r\n' for each '\n'.
     * Normally the termios settings of the underlying PTY deals with the
     * translation of '\n' to '\r\n' and this setting should not be used. If you
     * deal with data from a non-PTY related source, this settings might be
     * useful.
     */
    convertEol?: boolean;

    /**
     * The number of columns in the terminal.
     */
    cols?: number;

    /**
     * Whether the cursor blinks.
     */
    cursorBlink?: boolean;

    /**
     * The style of the cursor.
     */
    cursorStyle?: 'block' | 'underline' | 'bar';

    /**
     * The width of the cursor in CSS pixels when `cursorStyle` is set to 'bar'.
     */
    cursorWidth?: number;

    /**
     * Whether input should be disabled.
     */
    disableStdin?: boolean;

    /**
     * Whether to draw bold text in bright colors. The default is true.
     */
    drawBoldTextInBrightColors?: boolean;

    /**
     * The modifier key hold to multiply scroll speed.
     */
    fastScrollModifier?: 'alt' | 'ctrl' | 'shift' | undefined;

    /**
     * The scroll speed multiplier used for fast scrolling.
     */
    fastScrollSensitivity?: number;

    /**
     * The font size used to render text.
     */
    fontSize?: number;

    /**
     * The font family used to render text.
     */
    fontFamily?: string;

    /**
     * The font weight used to render non-bold text.
     */
    fontWeight?: FontWeight;

    /**
     * The font weight used to render bold text.
     */
    fontWeightBold?: FontWeight;

    /**
     * The spacing in whole pixels between characters.
     */
    letterSpacing?: number;

    /**
     * The line height used to render text.
     */
    lineHeight?: number;

    /**
     * The duration in milliseconds before link tooltip events fire when
     * hovering on a link.
     * @deprecated This will be removed when the link matcher API is removed.
     */
    linkTooltipHoverDuration?: number;

    /**
     * What log level to use, this will log for all levels below and including
     * what is set:
     *
     * 1. debug
     * 2. info (default)
     * 3. warn
     * 4. error
     * 5. off
     */
    logLevel?: LogLevel;

    /**
     * Whether to treat option as the meta key.
     */
    macOptionIsMeta?: boolean;

    /**
     * Whether holding a modifier key will force normal selection behavior,
     * regardless of whether the terminal is in mouse events mode. This will
     * also prevent mouse events from being emitted by the terminal. For
     * example, this allows you to use xterm.js' regular selection inside tmux
     * with mouse mode enabled.
     */
    macOptionClickForcesSelection?: boolean;

    /**
     * The minimum contrast ratio for text in the terminal, setting this will
     * change the foreground color dynamically depending on whether the contrast
     * ratio is met. Example values:
     *
     * - 1: The default, do nothing.
     * - 4.5: Minimum for WCAG AA compliance.
     * - 7: Minimum for WCAG AAA compliance.
     * - 21: White on black or black on white.
     */
    minimumContrastRatio?: number;

    /**
     * The type of renderer to use, this allows using the fallback DOM renderer
     * when canvas is too slow for the environment. The following features do
     * not work when the DOM renderer is used:
     *
     * - Letter spacing
     * - Cursor blink
     */
    rendererType?: RendererType;

    /**
     * Whether to select the word under the cursor on right click, this is
     * standard behavior in a lot of macOS applications.
     */
    rightClickSelectsWord?: boolean;

    /**
     * The number of rows in the terminal.
     */
    rows?: number;

    /**
     * Whether screen reader support is enabled. When on this will expose
     * supporting elements in the DOM to support NVDA on Windows and VoiceOver
     * on macOS.
     */
    screenReaderMode?: boolean;

    /**
     * The amount of scrollback in the terminal. Scrollback is the amount of
     * rows that are retained when lines are scrolled beyond the initial
     * viewport.
     */
    scrollback?: number;

    /**
     * The scrolling speed multiplier used for adjusting normal scrolling speed.
     */
    scrollSensitivity?: number;

    /**
     * The size of tab stops in the terminal.
     */
    tabStopWidth?: number;

    /**
     * The color theme of the terminal.
     */
    theme?: ITheme;

    /**
     * Whether "Windows mode" is enabled. Because Windows backends winpty and
     * conpty operate by doing line wrapping on their side, xterm.js does not
     * have access to wrapped lines. When Windows mode is enabled the following
     * changes will be in effect:
     *
     * - Reflow is disabled.
     * - Lines are assumed to be wrapped if the last character of the line is
     *   not whitespace.
     */
    windowsMode?: boolean;

    /**
     * A string containing all characters that are considered word separated by the
     * double click to select work logic.
     */
    wordSeparator?: string;

    /**
     * Enable various window manipulation and report features.
     * All features are disabled by default for security reasons.
     */
    windowOptions?: IWindowOptions;
}

/**
 * Contains colors to theme the terminal with.
 */
export interface ITheme {
    /** The default foreground color */
    foreground?: string;
    /** The default background color */
    background?: string;
    /** The cursor color */
    cursor?: string;
    /** The accent color of the cursor (fg color for a block cursor) */
    cursorAccent?: string;
    /** The selection background color (can be transparent) */
    selection?: string;
    /** ANSI black (eg. `\x1b[30m`) */
    black?: string;
    /** ANSI red (eg. `\x1b[31m`) */
    red?: string;
    /** ANSI green (eg. `\x1b[32m`) */
    green?: string;
    /** ANSI yellow (eg. `\x1b[33m`) */
    yellow?: string;
    /** ANSI blue (eg. `\x1b[34m`) */
    blue?: string;
    /** ANSI magenta (eg. `\x1b[35m`) */
    magenta?: string;
    /** ANSI cyan (eg. `\x1b[36m`) */
    cyan?: string;
    /** ANSI white (eg. `\x1b[37m`) */
    white?: string;
    /** ANSI bright black (eg. `\x1b[1;30m`) */
    brightBlack?: string;
    /** ANSI bright red (eg. `\x1b[1;31m`) */
    brightRed?: string;
    /** ANSI bright green (eg. `\x1b[1;32m`) */
    brightGreen?: string;
    /** ANSI bright yellow (eg. `\x1b[1;33m`) */
    brightYellow?: string;
    /** ANSI bright blue (eg. `\x1b[1;34m`) */
    brightBlue?: string;
    /** ANSI bright magenta (eg. `\x1b[1;35m`) */
    brightMagenta?: string;
    /** ANSI bright cyan (eg. `\x1b[1;36m`) */
    brightCyan?: string;
    /** ANSI bright white (eg. `\x1b[1;37m`) */
    brightWhite?: string;
}

// TODO: The options that are not in the public API should be reviewed
export interface ITerminalOptions extends IPublicTerminalOptions {
    [key: string]: any;
    cancelEvents?: boolean;
    convertEol?: boolean;
    termName?: string;
}

export type XtermListener = (...args: any[]) => void;

/**
 * A keyboard event interface which does not depend on the DOM, KeyboardEvent implicitly extends
 * this event.
 */
export interface IKeyboardEvent {
    altKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
    keyCode: number;
    key: string;
    type: string;
}

export interface ICircularList<T> {
    length: number;
    maxLength: number;
    isFull: boolean;

    onDeleteEmitter: IEventEmitter<IDeleteEvent>;
    onDelete: IEvent<IDeleteEvent>;
    onInsertEmitter: IEventEmitter<IInsertEvent>;
    onInsert: IEvent<IInsertEvent>;
    onTrimEmitter: IEventEmitter<number>;
    onTrim: IEvent<number>;

    get(index: number): T | undefined;
    set(index: number, value: T): void;
    push(value: T): void;
    recycle(): T;
    pop(): T | undefined;
    splice(start: number, deleteCount: number, ...items: T[]): void;
    trimStart(count: number): void;
    shiftElements(start: number, count: number, offset: number): void;
}

export const enum KeyboardResultType {
    SEND_KEY,
    SELECT_ALL,
    PAGE_UP,
    PAGE_DOWN,
}

export interface IKeyboardResult {
    type: KeyboardResultType;
    cancel: boolean;
    key: string | undefined;
}

export interface ICharset {
    [key: string]: string | undefined;
}

export type CharData = [number, string, number, number];
export type IColorRGB = [number, number, number];

export interface IExtendedAttrs {
    underlineStyle: number;
    underlineColor: number;
    clone(): IExtendedAttrs;
    isEmpty(): boolean;
}

/** Attribute data */
export interface IAttributeData {
    fg: number;
    bg: number;
    extended: IExtendedAttrs;

    clone(): IAttributeData;

    // flags
    isInverse(): number;
    isBold(): number;
    isUnderline(): number;
    isBlink(): number;
    isInvisible(): number;
    isItalic(): number;
    isDim(): number;

    // color modes
    getFgColorMode(): number;
    getBgColorMode(): number;
    isFgRGB(): boolean;
    isBgRGB(): boolean;
    isFgPalette(): boolean;
    isBgPalette(): boolean;
    isFgDefault(): boolean;
    isBgDefault(): boolean;
    isAttributeDefault(): boolean;

    // colors
    getFgColor(): number;
    getBgColor(): number;

    // extended attrs
    hasExtendedAttrs(): number;
    updateExtended(): void;
    getUnderlineColor(): number;
    getUnderlineColorMode(): number;
    isUnderlineColorRGB(): boolean;
    isUnderlineColorPalette(): boolean;
    isUnderlineColorDefault(): boolean;
    getUnderlineStyle(): number;
}

/** Cell data */
export interface ICellData extends IAttributeData {
    content: number;
    combinedData: string;
    isCombined(): number;
    getWidth(): number;
    getChars(): string;
    getCode(): number;
    setFromCharData(value: CharData): void;
    getAsCharData(): CharData;
}

/**
 * Interface for a line in the terminal buffer.
 */
export interface IBufferLine {
    length: number;
    isWrapped: boolean;
    get(index: number): CharData;
    set(index: number, value: CharData): void;
    loadCell(index: number, cell: ICellData): ICellData;
    setCell(index: number, cell: ICellData): void;
    setCellFromCodePoint(
        index: number,
        codePoint: number,
        width: number,
        fg: number,
        bg: number,
        eAttrs: IExtendedAttrs,
    ): void;
    addCodepointToCell(index: number, codePoint: number): void;
    insertCells(pos: number, n: number, ch: ICellData, eraseAttr?: IAttributeData): void;
    deleteCells(pos: number, n: number, fill: ICellData, eraseAttr?: IAttributeData): void;
    replaceCells(start: number, end: number, fill: ICellData, eraseAttr?: IAttributeData): void;
    resize(cols: number, fill: ICellData): void;
    fill(fillCellData: ICellData): void;
    copyFrom(line: IBufferLine): void;
    clone(): IBufferLine;
    getTrimmedLength(): number;
    translateToString(trimRight?: boolean, startCol?: number, endCol?: number): string;

    /* direct access to cell attrs */
    getWidth(index: number): number;
    hasWidth(index: number): number;
    getFg(index: number): number;
    getBg(index: number): number;
    hasContent(index: number): number;
    getCodePoint(index: number): number;
    isCombined(index: number): number;
    getString(index: number): string;
}

export interface IMarker extends IDisposable {
    readonly id: number;
    readonly isDisposed: boolean;
    readonly line: number;
    onDispose: IEvent<void>;
}
export interface IModes {
    insertMode: boolean;
}

export interface IDecPrivateModes {
    applicationCursorKeys: boolean;
    applicationKeypad: boolean;
    bracketedPasteMode: boolean;
    origin: boolean;
    reverseWraparound: boolean;
    sendFocus: boolean;
    wraparound: boolean; // defaults: xterm - true, vt100 - false
}

export interface IRowRange {
    start: number;
    end: number;
}

/**
 * Interface for mouse events in the core.
 */
export const enum CoreMouseButton {
    LEFT = 0,
    MIDDLE = 1,
    RIGHT = 2,
    NONE = 3,
    WHEEL = 4,
    // additional buttons 1..8
    // untested!
    AUX1 = 8,
    AUX2 = 9,
    AUX3 = 10,
    AUX4 = 11,
    AUX5 = 12,
    AUX6 = 13,
    AUX7 = 14,
    AUX8 = 15,
}

export const enum CoreMouseAction {
    UP = 0, // buttons, wheel
    DOWN = 1, // buttons, wheel
    LEFT = 2, // wheel only
    RIGHT = 3, // wheel only
    MOVE = 32, // buttons only
}

export interface ICoreMouseEvent {
    /** column (zero based). */
    col: number;
    /** row (zero based). */
    row: number;
    /**
     * Button the action occured. Due to restrictions of the tracking protocols
     * it is not possible to report multiple buttons at once.
     * Wheel is treated as a button.
     * There are invalid combinations of buttons and actions possible
     * (like move + wheel), those are silently ignored by the CoreMouseService.
     */
    button: CoreMouseButton;
    action: CoreMouseAction;
    /**
     * Modifier states.
     * Protocols will add/ignore those based on specific restrictions.
     */
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
}

/**
 * CoreMouseEventType
 * To be reported to the browser component which events a mouse
 * protocol wants to be catched and forwarded as an ICoreMouseEvent
 * to CoreMouseService.
 */
export const enum CoreMouseEventType {
    NONE = 0,
    /** any mousedown event */
    DOWN = 1,
    /** any mouseup event */
    UP = 2,
    /** any mousemove event while a button is held */
    DRAG = 4,
    /** any mousemove event without a button */
    MOVE = 8,
    /** any wheel event */
    WHEEL = 16,
}

/**
 * Mouse protocol interface.
 * A mouse protocol can be registered and activated at the CoreMouseService.
 * `events` should contain a list of needed events as a hint for the browser component
 * to install/remove the appropriate event handlers.
 * `restrict` applies further protocol specific restrictions like not allowed
 * modifiers or filtering invalid event types.
 */
export interface ICoreMouseProtocol {
    events: CoreMouseEventType;
    restrict: (e: ICoreMouseEvent) => boolean;
}

/**
 * CoreMouseEncoding
 * The tracking encoding can be registered and activated at the CoreMouseService.
 * If a ICoreMouseEvent passes all procotol restrictions it will be encoded
 * with the active encoding and sent out.
 * Note: Returning an empty string will supress sending a mouse report,
 * which can be used to skip creating falsey reports in limited encodings
 * (DEFAULT only supports up to 223 1-based as coord value).
 */
export type CoreMouseEncoding = (event: ICoreMouseEvent) => string;

/**
 * windowOptions
 */
export interface IWindowOptions {
    restoreWin?: boolean;
    minimizeWin?: boolean;
    setWinPosition?: boolean;
    setWinSizePixels?: boolean;
    raiseWin?: boolean;
    lowerWin?: boolean;
    refreshWin?: boolean;
    setWinSizeChars?: boolean;
    maximizeWin?: boolean;
    fullscreenWin?: boolean;
    getWinState?: boolean;
    getWinPosition?: boolean;
    getWinSizePixels?: boolean;
    getScreenSizePixels?: boolean;
    getCellSizePixels?: boolean;
    getWinSizeChars?: boolean;
    getScreenSizeChars?: boolean;
    getIconTitle?: boolean;
    getWinTitle?: boolean;
    pushTitle?: boolean;
    popTitle?: boolean;
    setWinLines?: boolean;
}

/**
 * Calls the parser and handles actions generated by the parser.
 */
export interface IInputHandler {
    onTitleChange: IEvent<string>;
    onRequestScroll: IEvent<IAttributeData, boolean | void>;

    parse(data: string | Uint8Array): void;
    print(data: Uint32Array, start: number, end: number): void;

    /** C0 BEL */ bell(): void;
    /** C0 LF */ lineFeed(): void;
    /** C0 CR */ carriageReturn(): void;
    /** C0 BS */ backspace(): void;
    /** C0 HT */ tab(): void;
    /** C0 SO */ shiftOut(): void;
    /** C0 SI */ shiftIn(): void;

    /** CSI @ */ insertChars(params: IParams): void;
    /** CSI SP @ */ scrollLeft(params: IParams): void;
    /** CSI A */ cursorUp(params: IParams): void;
    /** CSI SP A */ scrollRight(params: IParams): void;
    /** CSI B */ cursorDown(params: IParams): void;
    /** CSI C */ cursorForward(params: IParams): void;
    /** CSI D */ cursorBackward(params: IParams): void;
    /** CSI E */ cursorNextLine(params: IParams): void;
    /** CSI F */ cursorPrecedingLine(params: IParams): void;
    /** CSI G */ cursorCharAbsolute(params: IParams): void;
    /** CSI H */ cursorPosition(params: IParams): void;
    /** CSI I */ cursorForwardTab(params: IParams): void;
    /** CSI J */ eraseInDisplay(params: IParams): void;
    /** CSI K */ eraseInLine(params: IParams): void;
    /** CSI L */ insertLines(params: IParams): void;
    /** CSI M */ deleteLines(params: IParams): void;
    /** CSI P */ deleteChars(params: IParams): void;
    /** CSI S */ scrollUp(params: IParams): void;
    /** CSI T */ scrollDown(params: IParams, collect?: string): void;
    /** CSI X */ eraseChars(params: IParams): void;
    /** CSI Z */ cursorBackwardTab(params: IParams): void;
    /** CSI ` */ charPosAbsolute(params: IParams): void;
    /** CSI a */ hPositionRelative(params: IParams): void;
    /** CSI b */ repeatPrecedingCharacter(params: IParams): void;
    /** CSI c */ sendDeviceAttributesPrimary(params: IParams): void;
    /** CSI > c */ sendDeviceAttributesSecondary(params: IParams): void;
    /** CSI d */ linePosAbsolute(params: IParams): void;
    /** CSI e */ vPositionRelative(params: IParams): void;
    /** CSI f */ hVPosition(params: IParams): void;
    /** CSI g */ tabClear(params: IParams): void;
    /** CSI h */ setMode(params: IParams, collect?: string): void;
    /** CSI l */ resetMode(params: IParams, collect?: string): void;
    /** CSI m */ charAttributes(params: IParams): void;
    /** CSI n */ deviceStatus(params: IParams, collect?: string): void;
    /** CSI p */ softReset(params: IParams, collect?: string): void;
    /** CSI q */ setCursorStyle(params: IParams, collect?: string): void;
    /** CSI r */ setScrollRegion(params: IParams, collect?: string): void;
    /** CSI s */ saveCursor(params: IParams): void;
    /** CSI u */ restoreCursor(params: IParams): void;
    /** CSI ' } */ insertColumns(params: IParams): void;
    /** CSI ' ~ */ deleteColumns(params: IParams): void;
    /** OSC 0
      OSC 2 */ setTitle(data: string): void;
    /** ESC E */ nextLine(): void;
    /** ESC = */ keypadApplicationMode(): void;
    /** ESC > */ keypadNumericMode(): void;
    /** ESC % G
      ESC % @ */ selectDefaultCharset(): void;
    /** ESC ( C
      ESC ) C
      ESC * C
      ESC + C
      ESC - C
      ESC . C
      ESC / C */ selectCharset(
        collectAndFlag: string,
    ): void;
    /** ESC D */ index(): void;
    /** ESC H */ tabSet(): void;
    /** ESC M */ reverseIndex(): void;
    /** ESC c */ fullReset(): void;
    /** ESC n
      ESC o
      ESC |
      ESC }
      ESC ~ */ setgLevel(level: number): void;
    /** ESC # 8 */ screenAlignmentPattern(): void;
}