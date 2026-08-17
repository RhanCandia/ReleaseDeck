const manifest = {"name":"ReleaseDeck"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const callable = api.callable;
const addEventListener = api.addEventListener;
const removeEventListener = api.removeEventListener;
const toaster = api.toaster;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } } return target; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var {
        attr,
        size,
        title
      } = props,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaGithub (props) {
  return GenIcon({"attr":{"viewBox":"0 0 496 512"},"child":[{"tag":"path","attr":{"d":"M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"},"child":[]}]})(props);
}function FaLinux (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M220.8 123.3c1 .5 1.8 1.7 3 1.7 1.1 0 2.8-.4 2.9-1.5.2-1.4-1.9-2.3-3.2-2.9-1.7-.7-3.9-1-5.5-.1-.4.2-.8.7-.6 1.1.3 1.3 2.3 1.1 3.4 1.7zm-21.9 1.7c1.2 0 2-1.2 3-1.7 1.1-.6 3.1-.4 3.5-1.6.2-.4-.2-.9-.6-1.1-1.6-.9-3.8-.6-5.5.1-1.3.6-3.4 1.5-3.2 2.9.1 1 1.8 1.5 2.8 1.4zM420 403.8c-3.6-4-5.3-11.6-7.2-19.7-1.8-8.1-3.9-16.8-10.5-22.4-1.3-1.1-2.6-2.1-4-2.9-1.3-.8-2.7-1.5-4.1-2 9.2-27.3 5.6-54.5-3.7-79.1-11.4-30.1-31.3-56.4-46.5-74.4-17.1-21.5-33.7-41.9-33.4-72C311.1 85.4 315.7.1 234.8 0 132.4-.2 158 103.4 156.9 135.2c-1.7 23.4-6.4 41.8-22.5 64.7-18.9 22.5-45.5 58.8-58.1 96.7-6 17.9-8.8 36.1-6.2 53.3-6.5 5.8-11.4 14.7-16.6 20.2-4.2 4.3-10.3 5.9-17 8.3s-14 6-18.5 14.5c-2.1 3.9-2.8 8.1-2.8 12.4 0 3.9.6 7.9 1.2 11.8 1.2 8.1 2.5 15.7.8 20.8-5.2 14.4-5.9 24.4-2.2 31.7 3.8 7.3 11.4 10.5 20.1 12.3 17.3 3.6 40.8 2.7 59.3 12.5 19.8 10.4 39.9 14.1 55.9 10.4 11.6-2.6 21.1-9.6 25.9-20.2 12.5-.1 26.3-5.4 48.3-6.6 14.9-1.2 33.6 5.3 55.1 4.1.6 2.3 1.4 4.6 2.5 6.7v.1c8.3 16.7 23.8 24.3 40.3 23 16.6-1.3 34.1-11 48.3-27.9 13.6-16.4 36-23.2 50.9-32.2 7.4-4.5 13.4-10.1 13.9-18.3.4-8.2-4.4-17.3-15.5-29.7zM223.7 87.3c9.8-22.2 34.2-21.8 44-.4 6.5 14.2 3.6 30.9-4.3 40.4-1.6-.8-5.9-2.6-12.6-4.9 1.1-1.2 3.1-2.7 3.9-4.6 4.8-11.8-.2-27-9.1-27.3-7.3-.5-13.9 10.8-11.8 23-4.1-2-9.4-3.5-13-4.4-1-6.9-.3-14.6 2.9-21.8zM183 75.8c10.1 0 20.8 14.2 19.1 33.5-3.5 1-7.1 2.5-10.2 4.6 1.2-8.9-3.3-20.1-9.6-19.6-8.4.7-9.8 21.2-1.8 28.1 1 .8 1.9-.2-5.9 5.5-15.6-14.6-10.5-52.1 8.4-52.1zm-13.6 60.7c6.2-4.6 13.6-10 14.1-10.5 4.7-4.4 13.5-14.2 27.9-14.2 7.1 0 15.6 2.3 25.9 8.9 6.3 4.1 11.3 4.4 22.6 9.3 8.4 3.5 13.7 9.7 10.5 18.2-2.6 7.1-11 14.4-22.7 18.1-11.1 3.6-19.8 16-38.2 14.9-3.9-.2-7-1-9.6-2.1-8-3.5-12.2-10.4-20-15-8.6-4.8-13.2-10.4-14.7-15.3-1.4-4.9 0-9 4.2-12.3zm3.3 334c-2.7 35.1-43.9 34.4-75.3 18-29.9-15.8-68.6-6.5-76.5-21.9-2.4-4.7-2.4-12.7 2.6-26.4v-.2c2.4-7.6.6-16-.6-23.9-1.2-7.8-1.8-15 .9-20 3.5-6.7 8.5-9.1 14.8-11.3 10.3-3.7 11.8-3.4 19.6-9.9 5.5-5.7 9.5-12.9 14.3-18 5.1-5.5 10-8.1 17.7-6.9 8.1 1.2 15.1 6.8 21.9 16l19.6 35.6c9.5 19.9 43.1 48.4 41 68.9zm-1.4-25.9c-4.1-6.6-9.6-13.6-14.4-19.6 7.1 0 14.2-2.2 16.7-8.9 2.3-6.2 0-14.9-7.4-24.9-13.5-18.2-38.3-32.5-38.3-32.5-13.5-8.4-21.1-18.7-24.6-29.9s-3-23.3-.3-35.2c5.2-22.9 18.6-45.2 27.2-59.2 2.3-1.7.8 3.2-8.7 20.8-8.5 16.1-24.4 53.3-2.6 82.4.6-20.7 5.5-41.8 13.8-61.5 12-27.4 37.3-74.9 39.3-112.7 1.1.8 4.6 3.2 6.2 4.1 4.6 2.7 8.1 6.7 12.6 10.3 12.4 10 28.5 9.2 42.4 1.2 6.2-3.5 11.2-7.5 15.9-9 9.9-3.1 17.8-8.6 22.3-15 7.7 30.4 25.7 74.3 37.2 95.7 6.1 11.4 18.3 35.5 23.6 64.6 3.3-.1 7 .4 10.9 1.4 13.8-35.7-11.7-74.2-23.3-84.9-4.7-4.6-4.9-6.6-2.6-6.5 12.6 11.2 29.2 33.7 35.2 59 2.8 11.6 3.3 23.7.4 35.7 16.4 6.8 35.9 17.9 30.7 34.8-2.2-.1-3.2 0-4.2 0 3.2-10.1-3.9-17.6-22.8-26.1-19.6-8.6-36-8.6-38.3 12.5-12.1 4.2-18.3 14.7-21.4 27.3-2.8 11.2-3.6 24.7-4.4 39.9-.5 7.7-3.6 18-6.8 29-32.1 22.9-76.7 32.9-114.3 7.2zm257.4-11.5c-.9 16.8-41.2 19.9-63.2 46.5-13.2 15.7-29.4 24.4-43.6 25.5s-26.5-4.8-33.7-19.3c-4.7-11.1-2.4-23.1 1.1-36.3 3.7-14.2 9.2-28.8 9.9-40.6.8-15.2 1.7-28.5 4.2-38.7 2.6-10.3 6.6-17.2 13.7-21.1.3-.2.7-.3 1-.5.8 13.2 7.3 26.6 18.8 29.5 12.6 3.3 30.7-7.5 38.4-16.3 9-.3 15.7-.9 22.6 5.1 9.9 8.5 7.1 30.3 17.1 41.6 10.6 11.6 14 19.5 13.7 24.6zM173.3 148.7c2 1.9 4.7 4.5 8 7.1 6.6 5.2 15.8 10.6 27.3 10.6 11.6 0 22.5-5.9 31.8-10.8 4.9-2.6 10.9-7 14.8-10.4s5.9-6.3 3.1-6.6-2.6 2.6-6 5.1c-4.4 3.2-9.7 7.4-13.9 9.8-7.4 4.2-19.5 10.2-29.9 10.2s-18.7-4.8-24.9-9.7c-3.1-2.5-5.7-5-7.7-6.9-1.5-1.4-1.9-4.6-4.3-4.9-1.4-.1-1.8 3.7 1.7 6.5z"},"child":[]}]})(props);
}function FaArrowLeft (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"},"child":[]}]})(props);
}function FaArrowUp (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M34.9 289.5l-22.2-22.2c-9.4-9.4-9.4-24.6 0-33.9L207 39c9.4-9.4 24.6-9.4 33.9 0l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9L413 289.4c-9.5 9.5-25 9.3-34.3-.4L264 168.6V456c0 13.3-10.7 24-24 24h-32c-13.3 0-24-10.7-24-24V168.6L69.2 289.1c-9.3 9.8-24.8 10-34.3.4z"},"child":[]}]})(props);
}function FaBan (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M256 8C119.034 8 8 119.033 8 256s111.034 248 248 248 248-111.034 248-248S392.967 8 256 8zm130.108 117.892c65.448 65.448 70 165.481 20.677 235.637L150.47 105.216c70.204-49.356 170.226-44.735 235.638 20.676zM125.892 386.108c-65.448-65.448-70-165.481-20.677-235.637L361.53 406.784c-70.203 49.356-170.226 44.736-235.638-20.676z"},"child":[]}]})(props);
}function FaBoxOpen (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M425.7 256c-16.9 0-32.8-9-41.4-23.4L320 126l-64.2 106.6c-8.7 14.5-24.6 23.5-41.5 23.5-4.5 0-9-.6-13.3-1.9L64 215v178c0 14.7 10 27.5 24.2 31l216.2 54.1c10.2 2.5 20.9 2.5 31 0L551.8 424c14.2-3.6 24.2-16.4 24.2-31V215l-137 39.1c-4.3 1.3-8.8 1.9-13.3 1.9zm212.6-112.2L586.8 41c-3.1-6.2-9.8-9.8-16.7-8.9L320 64l91.7 152.1c3.8 6.3 11.4 9.3 18.5 7.3l197.9-56.5c9.9-2.9 14.7-13.9 10.2-23.1zM53.2 41L1.7 143.8c-4.6 9.2.3 20.2 10.1 23l197.9 56.5c7.1 2 14.7-1 18.5-7.3L320 64 69.8 32.1c-6.9-.8-13.5 2.7-16.6 8.9z"},"child":[]}]})(props);
}function FaBox (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M509.5 184.6L458.9 32.8C452.4 13.2 434.1 0 413.4 0H272v192h238.7c-.4-2.5-.4-5-1.2-7.4zM240 0H98.6c-20.7 0-39 13.2-45.5 32.8L2.5 184.6c-.8 2.4-.8 4.9-1.2 7.4H240V0zM0 224v240c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V224H0z"},"child":[]}]})(props);
}function FaCog (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"},"child":[]}]})(props);
}function FaDotCircle (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm80 248c0 44.112-35.888 80-80 80s-80-35.888-80-80 35.888-80 80-80 80 35.888 80 80z"},"child":[]}]})(props);
}function FaDownload (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"},"child":[]}]})(props);
}function FaExclamationCircle (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zm-248 50c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"},"child":[]}]})(props);
}function FaExclamationTriangle (props) {
  return GenIcon({"attr":{"viewBox":"0 0 576 512"},"child":[{"tag":"path","attr":{"d":"M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"},"child":[]}]})(props);
}function FaFolder (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M464 128H272l-64-64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V176c0-26.51-21.49-48-48-48z"},"child":[]}]})(props);
}function FaHdd (props) {
  return GenIcon({"attr":{"viewBox":"0 0 576 512"},"child":[{"tag":"path","attr":{"d":"M576 304v96c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48v-96c0-26.51 21.49-48 48-48h480c26.51 0 48 21.49 48 48zm-48-80a79.557 79.557 0 0 1 30.777 6.165L462.25 85.374A48.003 48.003 0 0 0 422.311 64H153.689a48 48 0 0 0-39.938 21.374L17.223 230.165A79.557 79.557 0 0 1 48 224h480zm-48 96c-17.673 0-32 14.327-32 32s14.327 32 32 32 32-14.327 32-32-14.327-32-32-32zm-96 0c-17.673 0-32 14.327-32 32s14.327 32 32 32 32-14.327 32-32-14.327-32-32-32z"},"child":[]}]})(props);
}function FaInfoCircle (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z"},"child":[]}]})(props);
}function FaPlus (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"},"child":[]}]})(props);
}function FaRedo (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M500.33 0h-47.41a12 12 0 0 0-12 12.57l4 82.76A247.42 247.42 0 0 0 256 8C119.34 8 7.9 119.53 8 256.19 8.1 393.07 119.1 504 256 504a247.1 247.1 0 0 0 166.18-63.91 12 12 0 0 0 .48-17.43l-34-34a12 12 0 0 0-16.38-.55A176 176 0 1 1 402.1 157.8l-101.53-4.87a12 12 0 0 0-12.57 12v47.41a12 12 0 0 0 12 12h200.33a12 12 0 0 0 12-12V12a12 12 0 0 0-12-12z"},"child":[]}]})(props);
}function FaSave (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"},"child":[]}]})(props);
}function FaStar (props) {
  return GenIcon({"attr":{"viewBox":"0 0 576 512"},"child":[{"tag":"path","attr":{"d":"M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z"},"child":[]}]})(props);
}function FaSync (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M440.65 12.57l4 82.77A247.16 247.16 0 0 0 255.83 8C134.73 8 33.91 94.92 12.29 209.82A12 12 0 0 0 24.09 224h49.05a12 12 0 0 0 11.67-9.26 175.91 175.91 0 0 1 317-56.94l-101.46-4.86a12 12 0 0 0-12.57 12v47.41a12 12 0 0 0 12 12H500a12 12 0 0 0 12-12V12a12 12 0 0 0-12-12h-47.37a12 12 0 0 0-11.98 12.57zM255.83 432a175.61 175.61 0 0 1-146-77.8l101.8 4.87a12 12 0 0 0 12.57-12v-47.4a12 12 0 0 0-12-12H12a12 12 0 0 0-12 12V500a12 12 0 0 0 12 12h47.35a12 12 0 0 0 12-12.6l-4.15-82.57A247.17 247.17 0 0 0 255.83 504c121.11 0 221.93-86.92 243.55-201.82a12 12 0 0 0-11.8-14.18h-49.05a12 12 0 0 0-11.67 9.26A175.86 175.86 0 0 1 255.83 432z"},"child":[]}]})(props);
}function FaTag (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M0 252.118V48C0 21.49 21.49 0 48 0h204.118a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882L293.823 497.941c-18.745 18.745-49.137 18.745-67.882 0L14.059 286.059A48 48 0 0 1 0 252.118zM112 64c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48z"},"child":[]}]})(props);
}function FaTrash (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"},"child":[]}]})(props);
}function FaRegCircle (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200z"},"child":[]}]})(props);
}

const fetchReleasesCallable = callable("fetch_releases");
const startDownloadCallable = callable("start_download");
const cancelDownloadCallable = callable("cancel_download");
const getInstalledPackagesCallable = callable("get_installed_packages");
const uninstallPackageCallable = callable("uninstall_package");
const checkAllUpdatesCallable = callable("check_all_updates");
const upgradePackageCallable = callable("upgrade_package");
const getSettingsCallable = callable("get_settings");
const saveSettingsCallable = callable("save_settings");
const Api = {
    fetchReleases: (repo) => fetchReleasesCallable(repo),
    startDownload: (params) => startDownloadCallable(params.repo, params.name, params.version, params.asset_name, params.download_url, params.custom_install_dir),
    cancelDownload: () => cancelDownloadCallable(),
    getInstalledPackages: () => getInstalledPackagesCallable(),
    uninstallPackage: (packageId, deleteFiles = true) => uninstallPackageCallable(packageId, deleteFiles),
    checkAllUpdates: () => checkAllUpdatesCallable(),
    upgradePackage: (packageId) => upgradePackageCallable(packageId),
    getSettings: () => getSettingsCallable(),
    saveSettings: (settings) => saveSettingsCallable(settings),
};

function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes <= 0)
        return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function DownloadTab({ settings, downloadProgress, onDownloadStarted, onInstalledRefresh, onNavigateToSettings, }) {
    const pinnedRepos = settings?.pinned_repos || [];
    // Drill-down navigation state
    const [currentStep, setCurrentStep] = SP_REACT.useState({ type: "repos" });
    // Cached releases per repo
    const [releasesCache, setReleasesCache] = SP_REACT.useState({});
    const [isLoadingReleases, setIsLoadingReleases] = SP_REACT.useState(false);
    const [errorMessage, setErrorMessage] = SP_REACT.useState(null);
    // Selected & focused state
    const [selectedAssetId, setSelectedAssetId] = SP_REACT.useState(null);
    const [focusedVersionId, setFocusedVersionId] = SP_REACT.useState(null);
    const [focusedAssetId, setFocusedAssetId] = SP_REACT.useState(null);
    const [showChangelog, setShowChangelog] = SP_REACT.useState(false);
    // Fetch releases on demand when entering a repository
    const loadRepoVersions = async (repo, force = false) => {
        setCurrentStep({ type: "versions", repo });
        setErrorMessage(null);
        // If already cached and not forced, don't re-fetch
        if (!force && releasesCache[repo] && releasesCache[repo].length > 0) {
            return;
        }
        setIsLoadingReleases(true);
        try {
            const res = await Api.fetchReleases(repo);
            if (res.success && res.releases && res.releases.length > 0) {
                const fetched = res.releases;
                setReleasesCache((prev) => ({ ...prev, [repo]: fetched }));
            }
            else {
                setErrorMessage(res.error || `No published releases found for ${repo}.`);
            }
        }
        catch (e) {
            setErrorMessage(`Failed to query GitHub: ${e?.message || e}`);
        }
        finally {
            setIsLoadingReleases(false);
        }
    };
    const handleSelectRelease = (repo, release) => {
        setCurrentStep({ type: "packages", repo, release });
        setShowChangelog(false);
        // Auto-select recommended asset if available
        if (release.assets && release.assets.length > 0) {
            const rec = release.assets.find((a) => a.is_recommended) || release.assets[0];
            setSelectedAssetId(rec ? rec.id : release.assets[0].id);
        }
        else {
            setSelectedAssetId(null);
        }
    };
    const handleStartDownload = async (repo, release, asset) => {
        const displayName = release.name || repo.split("/")[1] || repo;
        onDownloadStarted();
        toaster.toast({
            title: "ReleaseDeck",
            body: `Downloading ${displayName} (${release.tag_name})...`,
        });
        try {
            const res = await Api.startDownload({
                repo: repo,
                name: displayName,
                version: release.tag_name,
                asset_name: asset.name,
                download_url: asset.download_url,
            });
            if (res.success) {
                toaster.toast({
                    title: "ReleaseDeck",
                    body: `Successfully installed ${displayName}!`,
                });
                onInstalledRefresh();
            }
            else {
                toaster.toast({
                    title: "Download Failed",
                    body: res.error || "Unknown error during installation.",
                });
                setErrorMessage(res.error || "Installation failed.");
            }
        }
        catch (e) {
            toaster.toast({
                title: "Download Error",
                body: e?.message || "Unexpected download error.",
            });
        }
    };
    const handleCancelDownload = async () => {
        await Api.cancelDownload();
        toaster.toast({
            title: "ReleaseDeck",
            body: "Download cancelled.",
        });
    };
    const isDownloading = downloadProgress &&
        downloadProgress.status !== "complete" &&
        downloadProgress.status !== "error";
    // Reset to repos list if current repo is deleted from Settings
    SP_REACT.useEffect(() => {
        if (currentStep.type !== "repos" && !pinnedRepos.includes(currentStep.repo)) {
            setCurrentStep({ type: "repos" });
        }
    }, [pinnedRepos]);
    // ==========================================
    // VIEW 1: REPOSITORIES LIST
    // ==========================================
    if (currentStep.type === "repos") {
        if (pinnedRepos.length === 0) {
            return (SP_JSX.jsx(DFL.PanelSection, { title: "Download", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                            padding: "16px 8px",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%",
                            boxSizing: "border-box",
                        }, children: [SP_JSX.jsx(FaStar, { size: 26, color: "#ffd43b" }), SP_JSX.jsx("div", { style: { fontSize: "13px", fontWeight: "bold" }, children: "No Repositories Added Yet" }), SP_JSX.jsx("div", { style: { fontSize: "11px", opacity: 0.75, lineHeight: "1.3" }, children: "Add GitHub repositories in Settings to browse and download releases." }), SP_JSX.jsx("div", { style: { marginTop: "6px", width: "100%" }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onNavigateToSettings, children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px" }, children: [SP_JSX.jsx(FaCog, {}), " Open Settings & Add Repos"] }) }) })] }) }) }));
        }
        return (SP_JSX.jsx(DFL.PanelSection, { title: "Repositories", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", display: "flex", flexDirection: "column", gap: "4px" }, children: [SP_JSX.jsx("div", { style: { fontSize: "11px", opacity: 0.7, marginBottom: "2px" }, children: "Select a repository to view releases:" }), SP_JSX.jsx(DFL.Focusable, { "flow-children": "vertical", style: { display: "flex", flexDirection: "column", gap: "4px", width: "100%", boxSizing: "border-box" }, children: pinnedRepos.map((repo) => (SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => loadRepoVersions(repo), children: SP_JSX.jsxs("div", { style: {
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        fontSize: "12px",
                                        gap: "8px",
                                    }, children: [SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", wordBreak: "break-all", textAlign: "left" }, children: [SP_JSX.jsx(FaFolder, { style: { flexShrink: 0, color: "#74c0fc" } }), SP_JSX.jsx("span", { children: repo })] }), SP_JSX.jsx("span", { style: { fontSize: "11px", opacity: 0.6, flexShrink: 0 }, children: "\u2794" })] }) }, repo))) })] }) }) }));
    }
    // ==========================================
    // VIEW 2: VERSIONS LIST (WITH RETRY BUTTON)
    // ==========================================
    if (currentStep.type === "versions") {
        const { repo } = currentStep;
        const releases = releasesCache[repo] || [];
        return (SP_JSX.jsxs(DFL.PanelSection, { title: "Versions", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", display: "flex", flexDirection: "column", gap: "4px" }, children: [SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setCurrentStep({ type: "repos" }), children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }, children: [SP_JSX.jsx(FaArrowLeft, {}), " Back to Repositories"] }) }), SP_JSX.jsxs("div", { style: {
                                    padding: "4px 6px",
                                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                                    borderRadius: "3px",
                                    fontSize: "11px",
                                    fontWeight: "bold",
                                    wordBreak: "break-all",
                                }, children: ["\uD83D\uDCC1 ", repo] })] }) }), isLoadingReleases && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", padding: "12px", gap: "6px", fontSize: "11px" }, children: [SP_JSX.jsx(DFL.Spinner, {}), SP_JSX.jsx("span", { children: "Fetching versions..." })] }) })), errorMessage && !isLoadingReleases && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                            padding: "8px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(220, 53, 69, 0.2)",
                            color: "#ff6b6b",
                            fontSize: "11px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            wordBreak: "break-word",
                            width: "100%",
                            boxSizing: "border-box",
                        }, children: [SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px" }, children: [SP_JSX.jsx(FaExclamationTriangle, { style: { flexShrink: 0 } }), SP_JSX.jsx("span", { children: errorMessage })] }), SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => loadRepoVersions(repo, true), children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px" }, children: [SP_JSX.jsx(FaRedo, {}), " Retry Fetching Versions"] }) })] }) })), !isLoadingReleases && releases.length > 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", display: "flex", flexDirection: "column", gap: "2px" }, children: [SP_JSX.jsx("div", { style: { fontSize: "10px", opacity: 0.65, marginBottom: "2px" }, children: "Select a Version:" }), SP_JSX.jsx(DFL.Focusable, { "flow-children": "vertical", style: { display: "flex", flexDirection: "column", gap: "2px", width: "100%", boxSizing: "border-box" }, children: releases.map((rel, index) => {
                                    const isFocused = focusedVersionId === rel.id;
                                    return (SP_JSX.jsxs(DFL.Focusable, { onFocus: () => setFocusedVersionId(rel.id), onBlur: () => setFocusedVersionId((current) => (current === rel.id ? null : current)), onActivate: () => handleSelectRelease(repo, rel), onClick: () => handleSelectRelease(repo, rel), style: {
                                            padding: "5px 8px",
                                            borderRadius: "4px",
                                            backgroundColor: isFocused ? "#1a9fff" : "transparent",
                                            border: isFocused ? "1px solid #ffffff" : "1px solid transparent",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            cursor: "pointer",
                                            width: "100%",
                                            boxSizing: "border-box",
                                            transition: "background-color 0.15s ease",
                                        }, children: [SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1, textAlign: "left" }, children: [SP_JSX.jsx(FaTag, { style: {
                                                            flexShrink: 0,
                                                            fontSize: "10px",
                                                            color: isFocused ? "#ffffff" : index === 0 ? "#51cf66" : "#74c0fc",
                                                        } }), SP_JSX.jsx("span", { style: {
                                                            fontSize: "11px",
                                                            fontWeight: isFocused || index === 0 ? "bold" : "normal",
                                                            color: isFocused ? "#ffffff" : "#74c0fc",
                                                            textDecoration: isFocused ? "none" : "underline",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }, children: rel.tag_name }), index === 0 && (SP_JSX.jsx("span", { style: {
                                                            fontSize: "8px",
                                                            backgroundColor: isFocused ? "rgba(0, 0, 0, 0.3)" : "#2b8a3e",
                                                            color: "#fff",
                                                            padding: "0 4px",
                                                            borderRadius: "2px",
                                                            flexShrink: 0,
                                                        }, children: "Latest" })), rel.prerelease && (SP_JSX.jsx("span", { style: {
                                                            fontSize: "8px",
                                                            backgroundColor: isFocused ? "rgba(0, 0, 0, 0.3)" : "#e67700",
                                                            color: "#fff",
                                                            padding: "0 4px",
                                                            borderRadius: "2px",
                                                            flexShrink: 0,
                                                        }, children: "Pre" }))] }), SP_JSX.jsxs("span", { style: {
                                                    fontSize: "10px",
                                                    opacity: isFocused ? 0.95 : 0.6,
                                                    color: isFocused ? "#ffffff" : undefined,
                                                    flexShrink: 0,
                                                }, children: [rel.assets.length, " file", rel.assets.length === 1 ? "" : "s", " \u2794"] })] }, rel.id));
                                }) })] }) }))] }));
    }
    // ==========================================
    // VIEW 3: PACKAGES LIST (SLEEK RADIO ROWS WITH CRISP FOCUS)
    // ==========================================
    const { repo, release } = currentStep;
    const selectedAsset = release.assets.find((a) => a.id === selectedAssetId) || release.assets[0];
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Packages", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", display: "flex", flexDirection: "column", gap: "4px" }, children: [SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setCurrentStep({ type: "versions", repo }), children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }, children: [SP_JSX.jsx(FaArrowLeft, {}), " Back to Versions"] }) }), SP_JSX.jsxs("div", { style: {
                                padding: "4px 6px",
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                borderRadius: "3px",
                                fontSize: "11px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "4px",
                            }, children: [SP_JSX.jsx("span", { style: { fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: repo }), SP_JSX.jsx("span", { style: { opacity: 0.8, fontSize: "10px" }, children: release.tag_name })] })] }) }), isDownloading && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                        padding: "8px",
                        boxSizing: "border-box",
                        width: "100%",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        borderRadius: "6px",
                        border: "1px solid #1a9fff",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                    }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "bold" }, children: [SP_JSX.jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "6px" }, children: downloadProgress?.status === "extracting" ? "📦 Extracting..." : "📥 Downloading..." }), SP_JSX.jsxs("span", { children: [downloadProgress?.percent || 0, "%"] })] }), SP_JSX.jsx(DFL.ProgressBar, { nProgress: downloadProgress?.percent || 0 }), SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "9px", opacity: 0.8 }, children: [SP_JSX.jsxs("span", { children: [downloadProgress?.speed_mb_s || 0, " MB/s"] }), SP_JSX.jsxs("span", { children: [formatBytes(downloadProgress?.downloaded || 0), " / ", formatBytes(downloadProgress?.total || 0)] })] }), SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: handleCancelDownload, children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontSize: "10px" }, children: [SP_JSX.jsx(FaBan, {}), " Cancel"] }) })] }) })), release.body && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%" }, children: [SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => setShowChangelog(!showChangelog), children: SP_JSX.jsx("span", { style: { fontSize: "10px" }, children: showChangelog ? "Hide Changelog" : "View Release Notes" }) }), showChangelog && (SP_JSX.jsx("div", { style: {
                                maxHeight: "100px",
                                overflowY: "auto",
                                overflowX: "hidden",
                                padding: "6px",
                                marginTop: "3px",
                                backgroundColor: "rgba(0,0,0,0.3)",
                                borderRadius: "3px",
                                fontSize: "10px",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                lineHeight: "1.3",
                                opacity: 0.85,
                            }, children: release.body }))] }) })), release.assets.length === 0 ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { textAlign: "center", padding: "10px", opacity: 0.7, fontSize: "11px" }, children: [SP_JSX.jsx(FaBoxOpen, { size: 18 }), SP_JSX.jsx("div", { children: "No binary packages attached to this release." })] }) })) : (SP_JSX.jsxs(SP_JSX.Fragment, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", display: "flex", flexDirection: "column", gap: "2px" }, children: [SP_JSX.jsxs("div", { style: { fontSize: "11px", fontWeight: "bold", marginBottom: "2px" }, children: ["Select Package (", release.assets.length, "):"] }), SP_JSX.jsx(DFL.Focusable, { "flow-children": "vertical", style: { display: "flex", flexDirection: "column", gap: "2px", width: "100%", boxSizing: "border-box" }, children: release.assets.map((asset) => {
                                        const isSelected = selectedAsset && asset.id === selectedAsset.id;
                                        const isFocused = focusedAssetId === asset.id;
                                        return (SP_JSX.jsxs(DFL.Focusable, { onFocus: () => setFocusedAssetId(asset.id), onBlur: () => setFocusedAssetId((current) => (current === asset.id ? null : current)), onActivate: () => setSelectedAssetId(asset.id), onClick: () => setSelectedAssetId(asset.id), style: {
                                                padding: "5px 8px",
                                                borderRadius: "4px",
                                                backgroundColor: isFocused
                                                    ? "#1a9fff"
                                                    : isSelected
                                                        ? "rgba(26, 159, 255, 0.15)"
                                                        : "transparent",
                                                border: isFocused
                                                    ? "1px solid #ffffff"
                                                    : isSelected
                                                        ? "1px solid rgba(26, 159, 255, 0.4)"
                                                        : "1px solid transparent",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: "6px",
                                                width: "100%",
                                                boxSizing: "border-box",
                                                transition: "background-color 0.15s ease",
                                            }, children: [SP_JSX.jsx("span", { style: { marginTop: "2px", flexShrink: 0 }, children: isSelected ? (SP_JSX.jsx(FaDotCircle, { style: { color: isFocused ? "#ffffff" : "#1a9fff", fontSize: "12px" } })) : (SP_JSX.jsx(FaRegCircle, { style: { color: isFocused ? "#ffffff" : "rgba(255, 255, 255, 0.45)", fontSize: "12px" } })) }), SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "1px", flex: 1, minWidth: 0, textAlign: "left" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }, children: [SP_JSX.jsx("span", { style: {
                                                                        fontSize: "11px",
                                                                        fontWeight: isSelected || isFocused ? "bold" : "normal",
                                                                        color: isFocused ? "#ffffff" : isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.9)",
                                                                        wordBreak: "break-word",
                                                                        overflowWrap: "anywhere",
                                                                        whiteSpace: "normal",
                                                                        lineHeight: "1.3",
                                                                    }, children: asset.name }), asset.is_recommended && (SP_JSX.jsxs("span", { style: {
                                                                        fontSize: "8px",
                                                                        backgroundColor: isFocused ? "rgba(0, 0, 0, 0.3)" : "#2b8a3e",
                                                                        color: "#fff",
                                                                        padding: "0 3px",
                                                                        borderRadius: "2px",
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        gap: "2px",
                                                                        flexShrink: 0,
                                                                    }, children: [SP_JSX.jsx(FaLinux, {}), " Rec"] }))] }), SP_JSX.jsxs("span", { style: {
                                                                fontSize: "10px",
                                                                opacity: isFocused ? 0.9 : 0.65,
                                                                color: isFocused ? "#ffffff" : undefined,
                                                            }, children: ["Size: ", formatBytes(asset.size)] })] })] }, asset.id));
                                    }) })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", display: "flex", flexDirection: "column", gap: "4px" }, children: [SP_JSX.jsxs("div", { style: { fontSize: "10px", opacity: 0.7, wordBreak: "break-all" }, children: ["Target: ", SP_JSX.jsxs("code", { children: ["~/Applications/", repo.split("/")[1] || repo, "/"] })] }), SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !selectedAsset || !!isDownloading, onClick: () => selectedAsset && handleStartDownload(repo, release, selectedAsset), children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px" }, children: [SP_JSX.jsx(FaDownload, {}), selectedAsset ? `Download & Extract (${formatBytes(selectedAsset.size)})` : "Select a Package"] }) })] }) })] }))] }));
}

function InstalledTab({ packages, isLoading, onRefresh, onNavigateToDownload, }) {
    const [isCheckingUpdates, setIsCheckingUpdates] = SP_REACT.useState(false);
    const [upgradingId, setUpgradingId] = SP_REACT.useState(null);
    const [deletingId, setDeletingId] = SP_REACT.useState(null);
    const handleCheckUpdates = async () => {
        setIsCheckingUpdates(true);
        try {
            const updatedList = await Api.checkAllUpdates();
            const updateCount = updatedList.filter((p) => p.has_update).length;
            toaster.toast({
                title: "ReleaseDeck",
                body: updateCount > 0
                    ? `Found ${updateCount} update(s) available!`
                    : "All packages are up to date.",
            });
            onRefresh();
        }
        catch (e) {
            toaster.toast({
                title: "Update Check Failed",
                body: e?.message || "Could not check updates.",
            });
        }
        finally {
            setIsCheckingUpdates(false);
        }
    };
    const handleUpgrade = async (pkg) => {
        setUpgradingId(pkg.id);
        toaster.toast({
            title: "ReleaseDeck",
            body: `Upgrading ${pkg.name} to ${pkg.latest_version}...`,
        });
        try {
            const res = await Api.upgradePackage(pkg.id);
            if (res.success) {
                toaster.toast({
                    title: "Upgrade Complete",
                    body: `${pkg.name} updated to ${pkg.latest_version}!`,
                });
                onRefresh();
            }
            else {
                toaster.toast({
                    title: "Upgrade Failed",
                    body: res.error || "Upgrade failed.",
                });
            }
        }
        catch (e) {
            toaster.toast({
                title: "Upgrade Error",
                body: e?.message || "Unexpected error.",
            });
        }
        finally {
            setUpgradingId(null);
        }
    };
    const handleUninstall = async (pkg) => {
        if (deletingId !== pkg.id) {
            setDeletingId(pkg.id);
            return;
        }
        try {
            const res = await Api.uninstallPackage(pkg.id, true);
            if (res.success) {
                toaster.toast({
                    title: "ReleaseDeck",
                    body: `Uninstalled ${pkg.name}.`,
                });
                onRefresh();
            }
            else {
                toaster.toast({
                    title: "Uninstall Error",
                    body: res.error || "Could not uninstall package.",
                });
            }
        }
        catch (e) {
            toaster.toast({
                title: "Uninstall Error",
                body: e?.message || "Unexpected error.",
            });
        }
        finally {
            setDeletingId(null);
        }
    };
    return (SP_JSX.jsxs(DFL.PanelSection, { title: `Installed (${packages.length})`, children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: isLoading || isCheckingUpdates, onClick: handleCheckUpdates, children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px" }, children: [SP_JSX.jsx(FaSync, { className: isCheckingUpdates ? "spin-icon" : "" }), isCheckingUpdates ? "Checking..." : "Check for Updates"] }) }) }), isLoading && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { display: "flex", justifyContent: "center", padding: "12px" }, children: SP_JSX.jsx(DFL.Spinner, {}) }) })), !isLoading && packages.length === 0 && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                        padding: "16px 8px",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        opacity: 0.8,
                        width: "100%",
                        boxSizing: "border-box",
                    }, children: [SP_JSX.jsx(FaBoxOpen, { size: 28 }), SP_JSX.jsx("div", { style: { fontSize: "13px", fontWeight: "bold" }, children: "No Packages Installed Yet" }), SP_JSX.jsx("div", { style: { fontSize: "11px", opacity: 0.7 }, children: "Download game ports and tools directly from GitHub." }), SP_JSX.jsx("div", { style: { marginTop: "6px", width: "100%" }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onNavigateToDownload, children: SP_JSX.jsx("span", { style: { fontSize: "11px" }, children: "Browse & Download" }) }) })] }) })), !isLoading &&
                packages.map((pkg) => {
                    const isUpgrading = upgradingId === pkg.id;
                    const isConfirmingDelete = deletingId === pkg.id;
                    return (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: {
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                border: pkg.has_update ? "1px solid #f59f00" : "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "6px",
                                padding: "8px 10px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                width: "100%",
                                boxSizing: "border-box",
                            }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }, children: [SP_JSX.jsxs("div", { style: { minWidth: 0, flex: 1 }, children: [SP_JSX.jsx("div", { style: { fontWeight: "bold", fontSize: "12px", wordBreak: "break-word" }, children: pkg.name }), SP_JSX.jsx("div", { style: { fontSize: "10px", opacity: 0.65, wordBreak: "break-all" }, children: pkg.repository })] }), pkg.has_update && (SP_JSX.jsxs("span", { style: {
                                                backgroundColor: "#f59f00",
                                                color: "#000",
                                                fontSize: "9px",
                                                fontWeight: "bold",
                                                padding: "1px 5px",
                                                borderRadius: "3px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "3px",
                                                flexShrink: 0,
                                            }, children: [SP_JSX.jsx(FaExclamationCircle, {}), " Update"] }))] }), SP_JSX.jsxs("div", { style: { fontSize: "10px", opacity: 0.8, display: "flex", flexDirection: "column", gap: "2px" }, children: [SP_JSX.jsxs("div", { children: ["Ver: ", SP_JSX.jsx("strong", { children: pkg.installed_version }), pkg.has_update && (SP_JSX.jsxs("span", { style: { color: "#ffd43b", marginLeft: "4px" }, children: ["\u2794 ", SP_JSX.jsx("strong", { children: pkg.latest_version })] }))] }), SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px" }, children: [SP_JSX.jsx(FaHdd, {}), " Size: ", formatBytes(pkg.size_bytes)] }), SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "4px", wordBreak: "break-all" }, children: [SP_JSX.jsx(FaFolder, {}), " Path: ", SP_JSX.jsx("code", { children: pkg.install_path })] })] }), SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "4px", marginTop: "2px" }, children: [pkg.has_update && (SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: isUpgrading, onClick: () => handleUpgrade(pkg), children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontSize: "11px" }, children: [SP_JSX.jsx(FaArrowUp, {}), isUpgrading ? "Updating..." : `Update to ${pkg.latest_version}`] }) })), SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => handleUninstall(pkg), children: SP_JSX.jsxs("div", { style: {
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: "4px",
                                                    fontSize: "11px",
                                                    color: isConfirmingDelete ? "#ff6b6b" : undefined,
                                                }, children: [SP_JSX.jsx(FaTrash, {}), isConfirmingDelete ? "Confirm Delete?" : "Uninstall"] }) })] })] }) }, pkg.id));
                })] }));
}

function SettingsTab({ settings, onSettingsSaved }) {
    const [token, setToken] = SP_REACT.useState("");
    const [installDir, setInstallDir] = SP_REACT.useState("~/Applications");
    const [newRepo, setNewRepo] = SP_REACT.useState("");
    const [pinnedRepos, setPinnedRepos] = SP_REACT.useState([]);
    const [focusedRepo, setFocusedRepo] = SP_REACT.useState(null);
    const [isSaving, setIsSaving] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => {
        if (settings) {
            setToken(settings.github_token || "");
            setInstallDir(settings.default_install_dir || "~/Applications");
            setPinnedRepos(settings.pinned_repos || []);
        }
    }, [settings]);
    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const res = await Api.saveSettings({
                github_token: token.trim(),
                default_install_dir: installDir.trim(),
                pinned_repos: pinnedRepos,
            });
            if (res.success && res.settings) {
                onSettingsSaved(res.settings);
                toaster.toast({
                    title: "ReleaseDeck",
                    body: "Settings saved successfully!",
                });
            }
        }
        catch (e) {
            toaster.toast({
                title: "Settings Error",
                body: e?.message || "Could not save settings.",
            });
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleAddPinnedRepo = () => {
        const trimmed = newRepo.trim();
        if (!trimmed)
            return;
        if (pinnedRepos.includes(trimmed))
            return;
        const updated = [...pinnedRepos, trimmed];
        setPinnedRepos(updated);
        setNewRepo("");
    };
    const handleRemovePinnedRepo = (repoToRemove) => {
        const updated = pinnedRepos.filter((r) => r !== repoToRemove);
        setPinnedRepos(updated);
        toaster.toast({
            title: "ReleaseDeck",
            body: `Removed ${repoToRemove}. Remember to Save Settings.`,
        });
    };
    return (SP_JSX.jsxs(DFL.PanelSection, { title: "Settings", children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { width: "100%", boxSizing: "border-box" }, children: SP_JSX.jsx(DFL.TextField, { label: "GitHub Personal Access Token", description: "Optional: Prevents 403 API rate limits", value: token, onChange: (e) => setToken(e.target.value) }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { width: "100%", boxSizing: "border-box" }, children: SP_JSX.jsx(DFL.TextField, { label: "Default Install Directory", value: installDir, onChange: (e) => setInstallDir(e.target.value) }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%", boxSizing: "border-box" }, children: [SP_JSX.jsxs("div", { style: { fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }, children: ["Saved Repositories (", pinnedRepos.length, ")"] }), pinnedRepos.length === 0 ? (SP_JSX.jsx("div", { style: { fontSize: "11px", opacity: 0.6, fontStyle: "italic", marginBottom: "8px" }, children: "No saved repositories added yet." })) : (SP_JSX.jsxs("div", { style: { marginBottom: "8px" }, children: [SP_JSX.jsx("div", { style: { fontSize: "10px", opacity: 0.65, marginBottom: "3px" }, children: "Press (A) to delete repository:" }), SP_JSX.jsx(DFL.Focusable, { "flow-children": "vertical", style: {
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "3px",
                                        width: "100%",
                                        boxSizing: "border-box",
                                    }, children: pinnedRepos.map((repo) => {
                                        const isFocused = focusedRepo === repo;
                                        return (SP_JSX.jsxs(DFL.Focusable, { onFocus: () => setFocusedRepo(repo), onBlur: () => setFocusedRepo((current) => (current === repo ? null : current)), onActivate: () => handleRemovePinnedRepo(repo), onClick: () => handleRemovePinnedRepo(repo), style: {
                                                padding: "5px 8px",
                                                borderRadius: "4px",
                                                backgroundColor: isFocused ? "#1a9fff" : "rgba(255, 255, 255, 0.04)",
                                                border: isFocused ? "1px solid #ffffff" : "1px solid transparent",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                cursor: "pointer",
                                                width: "100%",
                                                boxSizing: "border-box",
                                                transition: "background-color 0.15s ease",
                                            }, children: [SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }, children: [SP_JSX.jsx(FaFolder, { style: {
                                                                color: isFocused ? "#ffffff" : "#74c0fc",
                                                                flexShrink: 0,
                                                                fontSize: "10px",
                                                            } }), SP_JSX.jsx("span", { style: {
                                                                fontSize: "11px",
                                                                fontWeight: isFocused ? "bold" : "normal",
                                                                color: "#ffffff",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                                whiteSpace: "nowrap",
                                                            }, children: repo })] }), SP_JSX.jsxs("div", { style: {
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "4px",
                                                        fontSize: "10px",
                                                        color: isFocused ? "#ffffff" : "#ff6b6b",
                                                        flexShrink: 0,
                                                        opacity: isFocused ? 1 : 0.85,
                                                    }, children: [SP_JSX.jsx(FaTrash, { size: 10 }), SP_JSX.jsx("span", { children: "Delete" })] })] }, repo));
                                    }) })] })), SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "4px", width: "100%", boxSizing: "border-box" }, children: [SP_JSX.jsx(DFL.TextField, { label: "Add Repository", description: "Format: owner/repo", value: newRepo, onChange: (e) => setNewRepo(e.target.value) }), SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: !newRepo.trim(), onClick: handleAddPinnedRepo, children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px" }, children: [SP_JSX.jsx(FaPlus, {}), " Add Repository"] }) })] })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", disabled: isSaving, onClick: handleSaveSettings, children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px" }, children: [SP_JSX.jsx(FaSave, {}), isSaving ? "Saving..." : "Save Settings"] }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { fontSize: "10px", opacity: 0.6, lineHeight: "1.3", wordBreak: "break-word", padding: "4px 0" }, children: [SP_JSX.jsx(FaInfoCircle, {}), " Classic GitHub tokens need no special permissions."] }) })] }));
}

function ReleaseDeckContent() {
    const [activeTab, setActiveTab] = SP_REACT.useState("download");
    const [installedPackages, setInstalledPackages] = SP_REACT.useState([]);
    const [isLoadingInstalled, setIsLoadingInstalled] = SP_REACT.useState(false);
    const [settings, setSettings] = SP_REACT.useState(null);
    const [downloadProgress, setDownloadProgress] = SP_REACT.useState(null);
    const refreshInstalled = async () => {
        setIsLoadingInstalled(true);
        try {
            const pkgs = await Api.getInstalledPackages();
            setInstalledPackages(pkgs);
            if (pkgs.length > 0 && activeTab !== "settings") {
                setActiveTab("installed");
            }
        }
        catch (e) {
            console.error("Failed to load packages:", e);
        }
        finally {
            setIsLoadingInstalled(false);
        }
    };
    const loadSettings = async () => {
        try {
            const s = await Api.getSettings();
            setSettings(s);
        }
        catch (e) {
            console.error("Failed to load settings:", e);
        }
    };
    SP_REACT.useEffect(() => {
        refreshInstalled();
        loadSettings();
        const progressListener = addEventListener("download_progress", (progress) => {
            setDownloadProgress(progress);
            if (progress.status === "complete") {
                refreshInstalled();
            }
        });
        return () => {
            removeEventListener("download_progress", progressListener);
        };
    }, []);
    return (SP_JSX.jsxs("div", { style: { width: "100%", maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden" }, children: [SP_JSX.jsxs(DFL.Focusable, { "flow-children": "horizontal", style: {
                    display: "flex",
                    gap: "4px",
                    width: "100%",
                    boxSizing: "border-box",
                    marginBottom: "10px",
                }, children: [SP_JSX.jsx(DFL.DialogButton, { onClick: () => setActiveTab("installed"), style: {
                            flex: 1,
                            minWidth: 0,
                            backgroundColor: activeTab === "installed" ? "rgba(26, 159, 255, 0.45)" : "rgba(255, 255, 255, 0.05)",
                            border: activeTab === "installed" ? "1px solid #1a9fff" : "1px solid rgba(255, 255, 255, 0.1)",
                            padding: "6px 2px",
                            fontSize: "11px",
                            height: "auto",
                        }, children: SP_JSX.jsxs("div", { style: {
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }, children: [SP_JSX.jsx(FaBox, { style: { flexShrink: 0 } }), SP_JSX.jsxs("span", { children: ["Installed", installedPackages.length > 0 ? ` (${installedPackages.length})` : ""] })] }) }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => setActiveTab("download"), style: {
                            flex: 1,
                            minWidth: 0,
                            backgroundColor: activeTab === "download" ? "rgba(26, 159, 255, 0.45)" : "rgba(255, 255, 255, 0.05)",
                            border: activeTab === "download" ? "1px solid #1a9fff" : "1px solid rgba(255, 255, 255, 0.1)",
                            padding: "6px 2px",
                            fontSize: "11px",
                            height: "auto",
                        }, children: SP_JSX.jsxs("div", { style: {
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }, children: [SP_JSX.jsx(FaDownload, { style: { flexShrink: 0 } }), SP_JSX.jsx("span", { children: "Download" })] }) }), SP_JSX.jsx(DFL.DialogButton, { onClick: () => setActiveTab("settings"), style: {
                            width: "36px",
                            minWidth: "36px",
                            flexShrink: 0,
                            backgroundColor: activeTab === "settings" ? "rgba(26, 159, 255, 0.45)" : "rgba(255, 255, 255, 0.05)",
                            border: activeTab === "settings" ? "1px solid #1a9fff" : "1px solid rgba(255, 255, 255, 0.1)",
                            padding: "6px 0",
                            height: "auto",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }, children: SP_JSX.jsx(FaCog, {}) })] }), activeTab === "download" && (SP_JSX.jsx(DownloadTab, { settings: settings, downloadProgress: downloadProgress, onDownloadStarted: () => { }, onInstalledRefresh: refreshInstalled, onNavigateToSettings: () => setActiveTab("settings") })), activeTab === "installed" && (SP_JSX.jsx(InstalledTab, { packages: installedPackages, isLoading: isLoadingInstalled, onRefresh: refreshInstalled, onNavigateToDownload: () => setActiveTab("download") })), activeTab === "settings" && (SP_JSX.jsx(SettingsTab, { settings: settings, onSettingsSaved: (newSettings) => setSettings(newSettings) }))] }));
}
var index = definePlugin(() => {
    return {
        name: "ReleaseDeck",
        icon: SP_JSX.jsx(FaGithub, {}),
        content: SP_JSX.jsx(ReleaseDeckContent, {}),
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
