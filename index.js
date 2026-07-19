var __defProp = Object.defineProperty;
var __name = (target, value) =>
  __defProp(target, "name", { value, configurable: true });

// ../node_modules/@firebase/util/dist/postinstall.mjs
var getDefaultsFromPostinstall = /* @__PURE__ */ __name(
  () => void 0,
  "getDefaultsFromPostinstall",
);

// ../node_modules/@firebase/util/dist/index.esm.js
var stringToByteArray$1 = /* @__PURE__ */ __name(function (str) {
  const out = [];
  let p2 = 0;
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 128) {
      out[p2++] = c;
    } else if (c < 2048) {
      out[p2++] = (c >> 6) | 192;
      out[p2++] = (c & 63) | 128;
    } else if (
      (c & 64512) === 55296 &&
      i + 1 < str.length &&
      (str.charCodeAt(i + 1) & 64512) === 56320
    ) {
      c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
      out[p2++] = (c >> 18) | 240;
      out[p2++] = ((c >> 12) & 63) | 128;
      out[p2++] = ((c >> 6) & 63) | 128;
      out[p2++] = (c & 63) | 128;
    } else {
      out[p2++] = (c >> 12) | 224;
      out[p2++] = ((c >> 6) & 63) | 128;
      out[p2++] = (c & 63) | 128;
    }
  }
  return out;
}, "stringToByteArray$1");
var byteArrayToString = /* @__PURE__ */ __name(function (bytes) {
  const out = [];
  let pos = 0,
    c = 0;
  while (pos < bytes.length) {
    const c1 = bytes[pos++];
    if (c1 < 128) {
      out[c++] = String.fromCharCode(c1);
    } else if (c1 > 191 && c1 < 224) {
      const c2 = bytes[pos++];
      out[c++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
    } else if (c1 > 239 && c1 < 365) {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      const c4 = bytes[pos++];
      const u =
        (((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) -
        65536;
      out[c++] = String.fromCharCode(55296 + (u >> 10));
      out[c++] = String.fromCharCode(56320 + (u & 1023));
    } else {
      const c2 = bytes[pos++];
      const c3 = bytes[pos++];
      out[c++] = String.fromCharCode(
        ((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63),
      );
    }
  }
  return out.join("");
}, "byteArrayToString");
var base64 = {
  /**
   * Maps bytes to characters.
   */
  byteToCharMap_: null,
  /**
   * Maps characters to bytes.
   */
  charToByteMap_: null,
  /**
   * Maps bytes to websafe characters.
   * @private
   */
  byteToCharMapWebSafe_: null,
  /**
   * Maps websafe characters to bytes.
   * @private
   */
  charToByteMapWebSafe_: null,
  /**
   * Our default alphabet, shared between
   * ENCODED_VALS and ENCODED_VALS_WEBSAFE
   */
  ENCODED_VALS_BASE:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  /**
   * Our default alphabet. Value 64 (=) is special; it means "nothing."
   */
  get ENCODED_VALS() {
    return this.ENCODED_VALS_BASE + "+/=";
  },
  /**
   * Our websafe alphabet.
   */
  get ENCODED_VALS_WEBSAFE() {
    return this.ENCODED_VALS_BASE + "-_.";
  },
  /**
   * Whether this browser supports the atob and btoa functions. This extension
   * started at Mozilla but is now implemented by many browsers. We use the
   * ASSUME_* variables to avoid pulling in the full useragent detection library
   * but still allowing the standard per-browser compilations.
   *
   */
  HAS_NATIVE_SUPPORT: typeof atob === "function",
  /**
   * Base64-encode an array of bytes.
   *
   * @param input An array of bytes (numbers with
   *     value in [0, 255]) to encode.
   * @param webSafe Boolean indicating we should use the
   *     alternative alphabet.
   * @return The base64 encoded string.
   */
  encodeByteArray(input, webSafe) {
    if (!Array.isArray(input)) {
      throw Error("encodeByteArray takes an array as a parameter");
    }
    this.init_();
    const byteToCharMap = webSafe
      ? this.byteToCharMapWebSafe_
      : this.byteToCharMap_;
    const output = [];
    for (let i = 0; i < input.length; i += 3) {
      const byte1 = input[i];
      const haveByte2 = i + 1 < input.length;
      const byte2 = haveByte2 ? input[i + 1] : 0;
      const haveByte3 = i + 2 < input.length;
      const byte3 = haveByte3 ? input[i + 2] : 0;
      const outByte1 = byte1 >> 2;
      const outByte2 = ((byte1 & 3) << 4) | (byte2 >> 4);
      let outByte3 = ((byte2 & 15) << 2) | (byte3 >> 6);
      let outByte4 = byte3 & 63;
      if (!haveByte3) {
        outByte4 = 64;
        if (!haveByte2) {
          outByte3 = 64;
        }
      }
      output.push(
        byteToCharMap[outByte1],
        byteToCharMap[outByte2],
        byteToCharMap[outByte3],
        byteToCharMap[outByte4],
      );
    }
    return output.join("");
  },
  /**
   * Base64-encode a string.
   *
   * @param input A string to encode.
   * @param webSafe If true, we should use the
   *     alternative alphabet.
   * @return The base64 encoded string.
   */
  encodeString(input, webSafe) {
    if (this.HAS_NATIVE_SUPPORT && !webSafe) {
      return btoa(input);
    }
    return this.encodeByteArray(stringToByteArray$1(input), webSafe);
  },
  /**
   * Base64-decode a string.
   *
   * @param input to decode.
   * @param webSafe True if we should use the
   *     alternative alphabet.
   * @return string representing the decoded value.
   */
  decodeString(input, webSafe) {
    if (this.HAS_NATIVE_SUPPORT && !webSafe) {
      return atob(input);
    }
    return byteArrayToString(this.decodeStringToByteArray(input, webSafe));
  },
  /**
   * Base64-decode a string.
   *
   * In base-64 decoding, groups of four characters are converted into three
   * bytes.  If the encoder did not apply padding, the input length may not
   * be a multiple of 4.
   *
   * In this case, the last group will have fewer than 4 characters, and
   * padding will be inferred.  If the group has one or two characters, it decodes
   * to one byte.  If the group has three characters, it decodes to two bytes.
   *
   * @param input Input to decode.
   * @param webSafe True if we should use the web-safe alphabet.
   * @return bytes representing the decoded value.
   */
  decodeStringToByteArray(input, webSafe) {
    this.init_();
    const charToByteMap = webSafe
      ? this.charToByteMapWebSafe_
      : this.charToByteMap_;
    const output = [];
    for (let i = 0; i < input.length;) {
      const byte1 = charToByteMap[input.charAt(i++)];
      const haveByte2 = i < input.length;
      const byte2 = haveByte2 ? charToByteMap[input.charAt(i)] : 0;
      ++i;
      const haveByte3 = i < input.length;
      const byte3 = haveByte3 ? charToByteMap[input.charAt(i)] : 64;
      ++i;
      const haveByte4 = i < input.length;
      const byte4 = haveByte4 ? charToByteMap[input.charAt(i)] : 64;
      ++i;
      if (byte1 == null || byte2 == null || byte3 == null || byte4 == null) {
        throw new DecodeBase64StringError();
      }
      const outByte1 = (byte1 << 2) | (byte2 >> 4);
      output.push(outByte1);
      if (byte3 !== 64) {
        const outByte2 = ((byte2 << 4) & 240) | (byte3 >> 2);
        output.push(outByte2);
        if (byte4 !== 64) {
          const outByte3 = ((byte3 << 6) & 192) | byte4;
          output.push(outByte3);
        }
      }
    }
    return output;
  },
  /**
   * Lazy static initialization function. Called before
   * accessing any of the static map variables.
   * @private
   */
  init_() {
    if (!this.byteToCharMap_) {
      this.byteToCharMap_ = {};
      this.charToByteMap_ = {};
      this.byteToCharMapWebSafe_ = {};
      this.charToByteMapWebSafe_ = {};
      for (let i = 0; i < this.ENCODED_VALS.length; i++) {
        this.byteToCharMap_[i] = this.ENCODED_VALS.charAt(i);
        this.charToByteMap_[this.byteToCharMap_[i]] = i;
        this.byteToCharMapWebSafe_[i] = this.ENCODED_VALS_WEBSAFE.charAt(i);
        this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[i]] = i;
        if (i >= this.ENCODED_VALS_BASE.length) {
          this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(i)] = i;
          this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(i)] = i;
        }
      }
    }
  },
};
var DecodeBase64StringError = class extends Error {
  static {
    __name(this, "DecodeBase64StringError");
  }
  constructor() {
    super(...arguments);
    this.name = "DecodeBase64StringError";
  }
};
var base64Encode = /* @__PURE__ */ __name(function (str) {
  const utf8Bytes = stringToByteArray$1(str);
  return base64.encodeByteArray(utf8Bytes, true);
}, "base64Encode");
var base64urlEncodeWithoutPadding = /* @__PURE__ */ __name(function (str) {
  return base64Encode(str).replace(/\./g, "");
}, "base64urlEncodeWithoutPadding");
var base64Decode = /* @__PURE__ */ __name(function (str) {
  try {
    return base64.decodeString(str, true);
  } catch (e) {
    console.error("base64Decode failed: ", e);
  }
  return null;
}, "base64Decode");
function getGlobal() {
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("Unable to locate global object.");
}
__name(getGlobal, "getGlobal");
var getDefaultsFromGlobal = /* @__PURE__ */ __name(
  () => getGlobal().__FIREBASE_DEFAULTS__,
  "getDefaultsFromGlobal",
);
var getDefaultsFromEnvVariable = /* @__PURE__ */ __name(() => {
  if (typeof process === "undefined" || typeof process.env === "undefined") {
    return;
  }
  const defaultsJsonString = process.env.__FIREBASE_DEFAULTS__;
  if (defaultsJsonString) {
    return JSON.parse(defaultsJsonString);
  }
}, "getDefaultsFromEnvVariable");
var getDefaultsFromCookie = /* @__PURE__ */ __name(() => {
  if (typeof document === "undefined") {
    return;
  }
  let match2;
  try {
    match2 = document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/);
  } catch (e) {
    return;
  }
  const decoded = match2 && base64Decode(match2[1]);
  return decoded && JSON.parse(decoded);
}, "getDefaultsFromCookie");
var getDefaults = /* @__PURE__ */ __name(() => {
  try {
    return (
      getDefaultsFromPostinstall() ||
      getDefaultsFromGlobal() ||
      getDefaultsFromEnvVariable() ||
      getDefaultsFromCookie()
    );
  } catch (e) {
    console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);
    return;
  }
}, "getDefaults");
var getDefaultEmulatorHost = /* @__PURE__ */ __name(
  (productName) => getDefaults()?.emulatorHosts?.[productName],
  "getDefaultEmulatorHost",
);
var getDefaultEmulatorHostnameAndPort = /* @__PURE__ */ __name(
  (productName) => {
    const host = getDefaultEmulatorHost(productName);
    if (!host) {
      return void 0;
    }
    const separatorIndex = host.lastIndexOf(":");
    if (separatorIndex <= 0 || separatorIndex + 1 === host.length) {
      throw new Error(
        `Invalid host ${host} with no separate hostname and port!`,
      );
    }
    const port = parseInt(host.substring(separatorIndex + 1), 10);
    if (host[0] === "[") {
      return [host.substring(1, separatorIndex - 1), port];
    } else {
      return [host.substring(0, separatorIndex), port];
    }
  },
  "getDefaultEmulatorHostnameAndPort",
);
var getDefaultAppConfig = /* @__PURE__ */ __name(
  () => getDefaults()?.config,
  "getDefaultAppConfig",
);
var getExperimentalSetting = /* @__PURE__ */ __name(
  (name4) => getDefaults()?.[`_${name4}`],
  "getExperimentalSetting",
);
var Deferred = class {
  static {
    __name(this, "Deferred");
  }
  constructor() {
    this.reject = () => {};
    this.resolve = () => {};
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
  /**
   * Our API internals are not promisified and cannot because our callback APIs have subtle expectations around
   * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
   * and returns a node-style callback which will resolve or reject the Deferred's promise.
   */
  wrapCallback(callback) {
    return (error, value) => {
      if (error) {
        this.reject(error);
      } else {
        this.resolve(value);
      }
      if (typeof callback === "function") {
        this.promise.catch(() => {});
        if (callback.length === 1) {
          callback(error);
        } else {
          callback(error, value);
        }
      }
    };
  }
};
function createMockUserToken(token, projectId) {
  if (token.uid) {
    throw new Error(
      'The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.',
    );
  }
  const header = {
    alg: "none",
    type: "JWT",
  };
  const project = projectId || "demo-project";
  const iat = token.iat || 0;
  const sub = token.sub || token.user_id;
  if (!sub) {
    throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");
  }
  const payload = {
    // Set all required fields to decent defaults
    iss: `https://securetoken.google.com/${project}`,
    aud: project,
    iat,
    exp: iat + 3600,
    auth_time: iat,
    sub,
    user_id: sub,
    firebase: {
      sign_in_provider: "custom",
      identities: {},
    },
    // Override with user options
    ...token,
  };
  const signature = "";
  return [
    base64urlEncodeWithoutPadding(JSON.stringify(header)),
    base64urlEncodeWithoutPadding(JSON.stringify(payload)),
    signature,
  ].join(".");
}
__name(createMockUserToken, "createMockUserToken");
function getUA() {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator["userAgent"] === "string"
  ) {
    return navigator["userAgent"];
  } else {
    return "";
  }
}
__name(getUA, "getUA");
function isMobileCordova() {
  return (
    typeof window !== "undefined" && // @ts-ignore Setting up an broadly applicable index signature for Window
    // just to deal with this case would probably be a bad idea.
    !!(window["cordova"] || window["phonegap"] || window["PhoneGap"]) &&
    /ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(getUA())
  );
}
__name(isMobileCordova, "isMobileCordova");
function isCloudflareWorker() {
  return (
    typeof navigator !== "undefined" &&
    navigator.userAgent === "Cloudflare-Workers"
  );
}
__name(isCloudflareWorker, "isCloudflareWorker");
function isBrowserExtension() {
  const runtime =
    typeof chrome === "object"
      ? chrome.runtime
      : typeof browser === "object"
        ? browser.runtime
        : void 0;
  return typeof runtime === "object" && runtime.id !== void 0;
}
__name(isBrowserExtension, "isBrowserExtension");
function isReactNative() {
  return (
    typeof navigator === "object" && navigator["product"] === "ReactNative"
  );
}
__name(isReactNative, "isReactNative");
function isIE() {
  const ua = getUA();
  return ua.indexOf("MSIE ") >= 0 || ua.indexOf("Trident/") >= 0;
}
__name(isIE, "isIE");
function isIndexedDBAvailable() {
  try {
    return typeof indexedDB === "object";
  } catch (e) {
    return false;
  }
}
__name(isIndexedDBAvailable, "isIndexedDBAvailable");
function validateIndexedDBOpenable() {
  return new Promise((resolve, reject) => {
    try {
      let preExist = true;
      const DB_CHECK_NAME =
        "validate-browser-context-for-indexeddb-analytics-module";
      const request = self.indexedDB.open(DB_CHECK_NAME);
      request.onsuccess = () => {
        request.result.close();
        if (!preExist) {
          self.indexedDB.deleteDatabase(DB_CHECK_NAME);
        }
        resolve(true);
      };
      request.onupgradeneeded = () => {
        preExist = false;
      };
      request.onerror = () => {
        reject(request.error?.message || "");
      };
    } catch (error) {
      reject(error);
    }
  });
}
__name(validateIndexedDBOpenable, "validateIndexedDBOpenable");
var ERROR_NAME = "FirebaseError";
var FirebaseError = class _FirebaseError extends Error {
  static {
    __name(this, "FirebaseError");
  }
  constructor(code, message, customData) {
    super(message);
    this.code = code;
    this.customData = customData;
    this.name = ERROR_NAME;
    Object.setPrototypeOf(this, _FirebaseError.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ErrorFactory.prototype.create);
    }
  }
};
var ErrorFactory = class {
  static {
    __name(this, "ErrorFactory");
  }
  constructor(service, serviceName, errors) {
    this.service = service;
    this.serviceName = serviceName;
    this.errors = errors;
  }
  create(code, ...data) {
    const customData = data[0] || {};
    const fullCode = `${this.service}/${code}`;
    const template = this.errors[code];
    const message = template ? replaceTemplate(template, customData) : "Error";
    const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
    const error = new FirebaseError(fullCode, fullMessage, customData);
    return error;
  }
};
function replaceTemplate(template, data) {
  return template.replace(PATTERN, (_, key) => {
    const value = data[key];
    return value != null ? String(value) : `<${key}?>`;
  });
}
__name(replaceTemplate, "replaceTemplate");
var PATTERN = /\{\$([^}]+)}/g;
function isEmpty(obj) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}
__name(isEmpty, "isEmpty");
function deepEqual(a, b2) {
  if (a === b2) {
    return true;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b2);
  for (const k2 of aKeys) {
    if (!bKeys.includes(k2)) {
      return false;
    }
    const aProp = a[k2];
    const bProp = b2[k2];
    if (isObject(aProp) && isObject(bProp)) {
      if (!deepEqual(aProp, bProp)) {
        return false;
      }
    } else if (aProp !== bProp) {
      return false;
    }
  }
  for (const k2 of bKeys) {
    if (!aKeys.includes(k2)) {
      return false;
    }
  }
  return true;
}
__name(deepEqual, "deepEqual");
function isObject(thing) {
  return thing !== null && typeof thing === "object";
}
__name(isObject, "isObject");
function querystring(querystringParams) {
  const params = [];
  for (const [key, value] of Object.entries(querystringParams)) {
    if (Array.isArray(value)) {
      value.forEach((arrayVal) => {
        params.push(
          encodeURIComponent(key) + "=" + encodeURIComponent(arrayVal),
        );
      });
    } else {
      params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    }
  }
  return params.length ? "&" + params.join("&") : "";
}
__name(querystring, "querystring");
function querystringDecode(querystring2) {
  const obj = {};
  const tokens = querystring2.replace(/^\?/, "").split("&");
  tokens.forEach((token) => {
    if (token) {
      const [key, value] = token.split("=");
      obj[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });
  return obj;
}
__name(querystringDecode, "querystringDecode");
function extractQuerystring(url) {
  const queryStart = url.indexOf("?");
  if (!queryStart) {
    return "";
  }
  const fragmentStart = url.indexOf("#", queryStart);
  return url.substring(queryStart, fragmentStart > 0 ? fragmentStart : void 0);
}
__name(extractQuerystring, "extractQuerystring");
function createSubscribe(executor, onNoObservers) {
  const proxy = new ObserverProxy(executor, onNoObservers);
  return proxy.subscribe.bind(proxy);
}
__name(createSubscribe, "createSubscribe");
var ObserverProxy = class {
  static {
    __name(this, "ObserverProxy");
  }
  /**
   * @param executor Function which can make calls to a single Observer
   *     as a proxy.
   * @param onNoObservers Callback when count of Observers goes to zero.
   */
  constructor(executor, onNoObservers) {
    this.observers = [];
    this.unsubscribes = [];
    this.observerCount = 0;
    this.task = Promise.resolve();
    this.finalized = false;
    this.onNoObservers = onNoObservers;
    this.task
      .then(() => {
        executor(this);
      })
      .catch((e) => {
        this.error(e);
      });
  }
  next(value) {
    this.forEachObserver((observer) => {
      observer.next(value);
    });
  }
  error(error) {
    this.forEachObserver((observer) => {
      observer.error(error);
    });
    this.close(error);
  }
  complete() {
    this.forEachObserver((observer) => {
      observer.complete();
    });
    this.close();
  }
  /**
   * Subscribe function that can be used to add an Observer to the fan-out list.
   *
   * - We require that no event is sent to a subscriber synchronously to their
   *   call to subscribe().
   */
  subscribe(nextOrObserver, error, complete) {
    let observer;
    if (nextOrObserver === void 0 && error === void 0 && complete === void 0) {
      throw new Error("Missing Observer.");
    }
    if (implementsAnyMethods(nextOrObserver, ["next", "error", "complete"])) {
      observer = nextOrObserver;
    } else {
      observer = {
        next: nextOrObserver,
        error,
        complete,
      };
    }
    if (observer.next === void 0) {
      observer.next = noop;
    }
    if (observer.error === void 0) {
      observer.error = noop;
    }
    if (observer.complete === void 0) {
      observer.complete = noop;
    }
    const unsub = this.unsubscribeOne.bind(this, this.observers.length);
    if (this.finalized) {
      this.task.then(() => {
        try {
          if (this.finalError) {
            observer.error(this.finalError);
          } else {
            observer.complete();
          }
        } catch (e) {}
        return;
      });
    }
    this.observers.push(observer);
    return unsub;
  }
  // Unsubscribe is synchronous - we guarantee that no events are sent to
  // any unsubscribed Observer.
  unsubscribeOne(i) {
    if (this.observers === void 0 || this.observers[i] === void 0) {
      return;
    }
    delete this.observers[i];
    this.observerCount -= 1;
    if (this.observerCount === 0 && this.onNoObservers !== void 0) {
      this.onNoObservers(this);
    }
  }
  forEachObserver(fn) {
    if (this.finalized) {
      return;
    }
    for (let i = 0; i < this.observers.length; i++) {
      this.sendOne(i, fn);
    }
  }
  // Call the Observer via one of it's callback function. We are careful to
  // confirm that the observe has not been unsubscribed since this asynchronous
  // function had been queued.
  sendOne(i, fn) {
    this.task.then(() => {
      if (this.observers !== void 0 && this.observers[i] !== void 0) {
        try {
          fn(this.observers[i]);
        } catch (e) {
          if (typeof console !== "undefined" && console.error) {
            console.error(e);
          }
        }
      }
    });
  }
  close(err) {
    if (this.finalized) {
      return;
    }
    this.finalized = true;
    if (err !== void 0) {
      this.finalError = err;
    }
    this.task.then(() => {
      this.observers = void 0;
      this.onNoObservers = void 0;
    });
  }
};
function implementsAnyMethods(obj, methods) {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  for (const method of methods) {
    if (method in obj && typeof obj[method] === "function") {
      return true;
    }
  }
  return false;
}
__name(implementsAnyMethods, "implementsAnyMethods");
function noop() {}
__name(noop, "noop");
var MAX_VALUE_MILLIS = 4 * 60 * 60 * 1e3;
function getModularInstance(service) {
  if (service && service._delegate) {
    return service._delegate;
  } else {
    return service;
  }
}
__name(getModularInstance, "getModularInstance");
function isCloudWorkstation(url) {
  try {
    const host =
      url.startsWith("http://") || url.startsWith("https://")
        ? new URL(url).hostname
        : url;
    return host.endsWith(".cloudworkstations.dev");
  } catch {
    return false;
  }
}
__name(isCloudWorkstation, "isCloudWorkstation");
async function pingServer(endpoint) {
  const result = await fetch(endpoint, {
    credentials: "include",
  });
  return result.ok;
}
__name(pingServer, "pingServer");

// ../node_modules/@firebase/component/dist/esm/index.esm.js
var Component = class {
  static {
    __name(this, "Component");
  }
  /**
   *
   * @param name The public service name, e.g. app, auth, firestore, database
   * @param instanceFactory Service factory responsible for creating the public interface
   * @param type whether the service provided by the component is public or private
   */
  constructor(name4, instanceFactory, type) {
    this.name = name4;
    this.instanceFactory = instanceFactory;
    this.type = type;
    this.multipleInstances = false;
    this.serviceProps = {};
    this.instantiationMode = "LAZY";
    this.onInstanceCreated = null;
  }
  setInstantiationMode(mode) {
    this.instantiationMode = mode;
    return this;
  }
  setMultipleInstances(multipleInstances) {
    this.multipleInstances = multipleInstances;
    return this;
  }
  setServiceProps(props) {
    this.serviceProps = props;
    return this;
  }
  setInstanceCreatedCallback(callback) {
    this.onInstanceCreated = callback;
    return this;
  }
};
var DEFAULT_ENTRY_NAME = "[DEFAULT]";
var Provider = class {
  static {
    __name(this, "Provider");
  }
  constructor(name4, container) {
    this.name = name4;
    this.container = container;
    this.component = null;
    this.instances = /* @__PURE__ */ new Map();
    this.instancesDeferred = /* @__PURE__ */ new Map();
    this.instancesOptions = /* @__PURE__ */ new Map();
    this.onInitCallbacks = /* @__PURE__ */ new Map();
  }
  /**
   * @param identifier A provider can provide multiple instances of a service
   * if this.component.multipleInstances is true.
   */
  get(identifier) {
    const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
    if (!this.instancesDeferred.has(normalizedIdentifier)) {
      const deferred = new Deferred();
      this.instancesDeferred.set(normalizedIdentifier, deferred);
      if (
        this.isInitialized(normalizedIdentifier) ||
        this.shouldAutoInitialize()
      ) {
        try {
          const instance = this.getOrInitializeService({
            instanceIdentifier: normalizedIdentifier,
          });
          if (instance) {
            deferred.resolve(instance);
          }
        } catch (e) {}
      }
    }
    return this.instancesDeferred.get(normalizedIdentifier).promise;
  }
  getImmediate(options) {
    const normalizedIdentifier = this.normalizeInstanceIdentifier(
      options?.identifier,
    );
    const optional = options?.optional ?? false;
    if (
      this.isInitialized(normalizedIdentifier) ||
      this.shouldAutoInitialize()
    ) {
      try {
        return this.getOrInitializeService({
          instanceIdentifier: normalizedIdentifier,
        });
      } catch (e) {
        if (optional) {
          return null;
        } else {
          throw e;
        }
      }
    } else {
      if (optional) {
        return null;
      } else {
        throw Error(`Service ${this.name} is not available`);
      }
    }
  }
  getComponent() {
    return this.component;
  }
  setComponent(component) {
    if (component.name !== this.name) {
      throw Error(
        `Mismatching Component ${component.name} for Provider ${this.name}.`,
      );
    }
    if (this.component) {
      throw Error(`Component for ${this.name} has already been provided`);
    }
    this.component = component;
    if (!this.shouldAutoInitialize()) {
      return;
    }
    if (isComponentEager(component)) {
      try {
        this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME });
      } catch (e) {}
    }
    for (const [
      instanceIdentifier,
      instanceDeferred,
    ] of this.instancesDeferred.entries()) {
      const normalizedIdentifier =
        this.normalizeInstanceIdentifier(instanceIdentifier);
      try {
        const instance = this.getOrInitializeService({
          instanceIdentifier: normalizedIdentifier,
        });
        instanceDeferred.resolve(instance);
      } catch (e) {}
    }
  }
  clearInstance(identifier = DEFAULT_ENTRY_NAME) {
    this.instancesDeferred.delete(identifier);
    this.instancesOptions.delete(identifier);
    this.instances.delete(identifier);
  }
  // app.delete() will call this method on every provider to delete the services
  // TODO: should we mark the provider as deleted?
  async delete() {
    const services = Array.from(this.instances.values());
    await Promise.all([
      ...services
        .filter((service) => "INTERNAL" in service)
        .map((service) => service.INTERNAL.delete()),
      ...services
        .filter((service) => "_delete" in service)
        .map((service) => service._delete()),
    ]);
  }
  isComponentSet() {
    return this.component != null;
  }
  isInitialized(identifier = DEFAULT_ENTRY_NAME) {
    return this.instances.has(identifier);
  }
  getOptions(identifier = DEFAULT_ENTRY_NAME) {
    return this.instancesOptions.get(identifier) || {};
  }
  initialize(opts = {}) {
    const { options = {} } = opts;
    const normalizedIdentifier = this.normalizeInstanceIdentifier(
      opts.instanceIdentifier,
    );
    if (this.isInitialized(normalizedIdentifier)) {
      throw Error(
        `${this.name}(${normalizedIdentifier}) has already been initialized`,
      );
    }
    if (!this.isComponentSet()) {
      throw Error(`Component ${this.name} has not been registered yet`);
    }
    const instance = this.getOrInitializeService({
      instanceIdentifier: normalizedIdentifier,
      options,
    });
    for (const [
      instanceIdentifier,
      instanceDeferred,
    ] of this.instancesDeferred.entries()) {
      const normalizedDeferredIdentifier =
        this.normalizeInstanceIdentifier(instanceIdentifier);
      if (normalizedIdentifier === normalizedDeferredIdentifier) {
        instanceDeferred.resolve(instance);
      }
    }
    return instance;
  }
  /**
   *
   * @param callback - a function that will be invoked  after the provider has been initialized by calling provider.initialize().
   * The function is invoked SYNCHRONOUSLY, so it should not execute any longrunning tasks in order to not block the program.
   *
   * @param identifier An optional instance identifier
   * @returns a function to unregister the callback
   */
  onInit(callback, identifier) {
    const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
    const existingCallbacks =
      this.onInitCallbacks.get(normalizedIdentifier) ??
      /* @__PURE__ */ new Set();
    existingCallbacks.add(callback);
    this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
    const existingInstance = this.instances.get(normalizedIdentifier);
    if (existingInstance) {
      callback(existingInstance, normalizedIdentifier);
    }
    return () => {
      existingCallbacks.delete(callback);
    };
  }
  /**
   * Invoke onInit callbacks synchronously
   * @param instance the service instance`
   */
  invokeOnInitCallbacks(instance, identifier) {
    const callbacks = this.onInitCallbacks.get(identifier);
    if (!callbacks) {
      return;
    }
    for (const callback of callbacks) {
      try {
        callback(instance, identifier);
      } catch {}
    }
  }
  getOrInitializeService({ instanceIdentifier, options = {} }) {
    let instance = this.instances.get(instanceIdentifier);
    if (!instance && this.component) {
      instance = this.component.instanceFactory(this.container, {
        instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
        options,
      });
      this.instances.set(instanceIdentifier, instance);
      this.instancesOptions.set(instanceIdentifier, options);
      this.invokeOnInitCallbacks(instance, instanceIdentifier);
      if (this.component.onInstanceCreated) {
        try {
          this.component.onInstanceCreated(
            this.container,
            instanceIdentifier,
            instance,
          );
        } catch {}
      }
    }
    return instance || null;
  }
  normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME) {
    if (this.component) {
      return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME;
    } else {
      return identifier;
    }
  }
  shouldAutoInitialize() {
    return !!this.component && this.component.instantiationMode !== "EXPLICIT";
  }
};
function normalizeIdentifierForFactory(identifier) {
  return identifier === DEFAULT_ENTRY_NAME ? void 0 : identifier;
}
__name(normalizeIdentifierForFactory, "normalizeIdentifierForFactory");
function isComponentEager(component) {
  return component.instantiationMode === "EAGER";
}
__name(isComponentEager, "isComponentEager");
var ComponentContainer = class {
  static {
    __name(this, "ComponentContainer");
  }
  constructor(name4) {
    this.name = name4;
    this.providers = /* @__PURE__ */ new Map();
  }
  /**
   *
   * @param component Component being added
   * @param overwrite When a component with the same name has already been registered,
   * if overwrite is true: overwrite the existing component with the new component and create a new
   * provider with the new component. It can be useful in tests where you want to use different mocks
   * for different tests.
   * if overwrite is false: throw an exception
   */
  addComponent(component) {
    const provider = this.getProvider(component.name);
    if (provider.isComponentSet()) {
      throw new Error(
        `Component ${component.name} has already been registered with ${this.name}`,
      );
    }
    provider.setComponent(component);
  }
  addOrOverwriteComponent(component) {
    const provider = this.getProvider(component.name);
    if (provider.isComponentSet()) {
      this.providers.delete(component.name);
    }
    this.addComponent(component);
  }
  /**
   * getProvider provides a type safe interface where it can only be called with a field name
   * present in NameServiceMapping interface.
   *
   * Firebase SDKs providing services should extend NameServiceMapping interface to register
   * themselves.
   */
  getProvider(name4) {
    if (this.providers.has(name4)) {
      return this.providers.get(name4);
    }
    const provider = new Provider(name4, this);
    this.providers.set(name4, provider);
    return provider;
  }
  getProviders() {
    return Array.from(this.providers.values());
  }
};

// ../node_modules/@firebase/logger/dist/esm/index.esm.js
var instances = [];
var LogLevel;
(function (LogLevel2) {
  LogLevel2[(LogLevel2["DEBUG"] = 0)] = "DEBUG";
  LogLevel2[(LogLevel2["VERBOSE"] = 1)] = "VERBOSE";
  LogLevel2[(LogLevel2["INFO"] = 2)] = "INFO";
  LogLevel2[(LogLevel2["WARN"] = 3)] = "WARN";
  LogLevel2[(LogLevel2["ERROR"] = 4)] = "ERROR";
  LogLevel2[(LogLevel2["SILENT"] = 5)] = "SILENT";
})(LogLevel || (LogLevel = {}));
var levelStringToEnum = {
  debug: LogLevel.DEBUG,
  verbose: LogLevel.VERBOSE,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  silent: LogLevel.SILENT,
};
var defaultLogLevel = LogLevel.INFO;
var ConsoleMethod = {
  [LogLevel.DEBUG]: "log",
  [LogLevel.VERBOSE]: "log",
  [LogLevel.INFO]: "info",
  [LogLevel.WARN]: "warn",
  [LogLevel.ERROR]: "error",
};
var defaultLogHandler = /* @__PURE__ */ __name((instance, logType, ...args) => {
  if (logType < instance.logLevel) {
    return;
  }
  const now = /* @__PURE__ */ new Date().toISOString();
  const method = ConsoleMethod[logType];
  if (method) {
    console[method](`[${now}]  ${instance.name}:`, ...args);
  } else {
    throw new Error(
      `Attempted to log a message with an invalid logType (value: ${logType})`,
    );
  }
}, "defaultLogHandler");
var Logger = class {
  static {
    __name(this, "Logger");
  }
  /**
   * Gives you an instance of a Logger to capture messages according to
   * Firebase's logging scheme.
   *
   * @param name The name that the logs will be associated with
   */
  constructor(name4) {
    this.name = name4;
    this._logLevel = defaultLogLevel;
    this._logHandler = defaultLogHandler;
    this._userLogHandler = null;
    instances.push(this);
  }
  get logLevel() {
    return this._logLevel;
  }
  set logLevel(val) {
    if (!(val in LogLevel)) {
      throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
    }
    this._logLevel = val;
  }
  // Workaround for setter/getter having to be the same type.
  setLogLevel(val) {
    this._logLevel = typeof val === "string" ? levelStringToEnum[val] : val;
  }
  get logHandler() {
    return this._logHandler;
  }
  set logHandler(val) {
    if (typeof val !== "function") {
      throw new TypeError("Value assigned to `logHandler` must be a function");
    }
    this._logHandler = val;
  }
  get userLogHandler() {
    return this._userLogHandler;
  }
  set userLogHandler(val) {
    this._userLogHandler = val;
  }
  /**
   * The functions below are all based on the `console` interface
   */
  debug(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
    this._logHandler(this, LogLevel.DEBUG, ...args);
  }
  log(...args) {
    this._userLogHandler &&
      this._userLogHandler(this, LogLevel.VERBOSE, ...args);
    this._logHandler(this, LogLevel.VERBOSE, ...args);
  }
  info(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
    this._logHandler(this, LogLevel.INFO, ...args);
  }
  warn(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
    this._logHandler(this, LogLevel.WARN, ...args);
  }
  error(...args) {
    this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
    this._logHandler(this, LogLevel.ERROR, ...args);
  }
};

// ../node_modules/idb/build/wrap-idb-value.js
var instanceOfAny = /* @__PURE__ */ __name(
  (object, constructors) => constructors.some((c) => object instanceof c),
  "instanceOfAny",
);
var idbProxyableTypes;
var cursorAdvanceMethods;
function getIdbProxyableTypes() {
  return (
    idbProxyableTypes ||
    (idbProxyableTypes = [
      IDBDatabase,
      IDBObjectStore,
      IDBIndex,
      IDBCursor,
      IDBTransaction,
    ])
  );
}
__name(getIdbProxyableTypes, "getIdbProxyableTypes");
function getCursorAdvanceMethods() {
  return (
    cursorAdvanceMethods ||
    (cursorAdvanceMethods = [
      IDBCursor.prototype.advance,
      IDBCursor.prototype.continue,
      IDBCursor.prototype.continuePrimaryKey,
    ])
  );
}
__name(getCursorAdvanceMethods, "getCursorAdvanceMethods");
var cursorRequestMap = /* @__PURE__ */ new WeakMap();
var transactionDoneMap = /* @__PURE__ */ new WeakMap();
var transactionStoreNamesMap = /* @__PURE__ */ new WeakMap();
var transformCache = /* @__PURE__ */ new WeakMap();
var reverseTransformCache = /* @__PURE__ */ new WeakMap();
function promisifyRequest(request) {
  const promise = new Promise((resolve, reject) => {
    const unlisten = /* @__PURE__ */ __name(() => {
      request.removeEventListener("success", success);
      request.removeEventListener("error", error);
    }, "unlisten");
    const success = /* @__PURE__ */ __name(() => {
      resolve(wrap(request.result));
      unlisten();
    }, "success");
    const error = /* @__PURE__ */ __name(() => {
      reject(request.error);
      unlisten();
    }, "error");
    request.addEventListener("success", success);
    request.addEventListener("error", error);
  });
  promise
    .then((value) => {
      if (value instanceof IDBCursor) {
        cursorRequestMap.set(value, request);
      }
    })
    .catch(() => {});
  reverseTransformCache.set(promise, request);
  return promise;
}
__name(promisifyRequest, "promisifyRequest");
function cacheDonePromiseForTransaction(tx) {
  if (transactionDoneMap.has(tx)) return;
  const done = new Promise((resolve, reject) => {
    const unlisten = /* @__PURE__ */ __name(() => {
      tx.removeEventListener("complete", complete);
      tx.removeEventListener("error", error);
      tx.removeEventListener("abort", error);
    }, "unlisten");
    const complete = /* @__PURE__ */ __name(() => {
      resolve();
      unlisten();
    }, "complete");
    const error = /* @__PURE__ */ __name(() => {
      reject(tx.error || new DOMException("AbortError", "AbortError"));
      unlisten();
    }, "error");
    tx.addEventListener("complete", complete);
    tx.addEventListener("error", error);
    tx.addEventListener("abort", error);
  });
  transactionDoneMap.set(tx, done);
}
__name(cacheDonePromiseForTransaction, "cacheDonePromiseForTransaction");
var idbProxyTraps = {
  get(target, prop, receiver) {
    if (target instanceof IDBTransaction) {
      if (prop === "done") return transactionDoneMap.get(target);
      if (prop === "objectStoreNames") {
        return target.objectStoreNames || transactionStoreNamesMap.get(target);
      }
      if (prop === "store") {
        return receiver.objectStoreNames[1]
          ? void 0
          : receiver.objectStore(receiver.objectStoreNames[0]);
      }
    }
    return wrap(target[prop]);
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
  has(target, prop) {
    if (
      target instanceof IDBTransaction &&
      (prop === "done" || prop === "store")
    ) {
      return true;
    }
    return prop in target;
  },
};
function replaceTraps(callback) {
  idbProxyTraps = callback(idbProxyTraps);
}
__name(replaceTraps, "replaceTraps");
function wrapFunction(func) {
  if (
    func === IDBDatabase.prototype.transaction &&
    !("objectStoreNames" in IDBTransaction.prototype)
  ) {
    return function (storeNames, ...args) {
      const tx = func.call(unwrap(this), storeNames, ...args);
      transactionStoreNamesMap.set(
        tx,
        storeNames.sort ? storeNames.sort() : [storeNames],
      );
      return wrap(tx);
    };
  }
  if (getCursorAdvanceMethods().includes(func)) {
    return function (...args) {
      func.apply(unwrap(this), args);
      return wrap(cursorRequestMap.get(this));
    };
  }
  return function (...args) {
    return wrap(func.apply(unwrap(this), args));
  };
}
__name(wrapFunction, "wrapFunction");
function transformCachableValue(value) {
  if (typeof value === "function") return wrapFunction(value);
  if (value instanceof IDBTransaction) cacheDonePromiseForTransaction(value);
  if (instanceOfAny(value, getIdbProxyableTypes()))
    return new Proxy(value, idbProxyTraps);
  return value;
}
__name(transformCachableValue, "transformCachableValue");
function wrap(value) {
  if (value instanceof IDBRequest) return promisifyRequest(value);
  if (transformCache.has(value)) return transformCache.get(value);
  const newValue = transformCachableValue(value);
  if (newValue !== value) {
    transformCache.set(value, newValue);
    reverseTransformCache.set(newValue, value);
  }
  return newValue;
}
__name(wrap, "wrap");
var unwrap = /* @__PURE__ */ __name(
  (value) => reverseTransformCache.get(value),
  "unwrap",
);

// ../node_modules/idb/build/index.js
function openDB(
  name4,
  version4,
  { blocked, upgrade, blocking, terminated } = {},
) {
  const request = indexedDB.open(name4, version4);
  const openPromise = wrap(request);
  if (upgrade) {
    request.addEventListener("upgradeneeded", (event) => {
      upgrade(
        wrap(request.result),
        event.oldVersion,
        event.newVersion,
        wrap(request.transaction),
        event,
      );
    });
  }
  if (blocked) {
    request.addEventListener("blocked", (event) =>
      blocked(
        // Casting due to https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1405
        event.oldVersion,
        event.newVersion,
        event,
      ),
    );
  }
  openPromise
    .then((db) => {
      if (terminated) db.addEventListener("close", () => terminated());
      if (blocking) {
        db.addEventListener("versionchange", (event) =>
          blocking(event.oldVersion, event.newVersion, event),
        );
      }
    })
    .catch(() => {});
  return openPromise;
}
__name(openDB, "openDB");
var readMethods = ["get", "getKey", "getAll", "getAllKeys", "count"];
var writeMethods = ["put", "add", "delete", "clear"];
var cachedMethods = /* @__PURE__ */ new Map();
function getMethod(target, prop) {
  if (!(
    target instanceof IDBDatabase &&
    !(prop in target) &&
    typeof prop === "string"
  )) {
    return;
  }
  if (cachedMethods.get(prop)) return cachedMethods.get(prop);
  const targetFuncName = prop.replace(/FromIndex$/, "");
  const useIndex = prop !== targetFuncName;
  const isWrite = writeMethods.includes(targetFuncName);
  if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
    !(isWrite || readMethods.includes(targetFuncName))
  ) {
    return;
  }
  const method = /* @__PURE__ */ __name(async function (storeName, ...args) {
    const tx = this.transaction(storeName, isWrite ? "readwrite" : "readonly");
    let target2 = tx.store;
    if (useIndex) target2 = target2.index(args.shift());
    return (
      await Promise.all([target2[targetFuncName](...args), isWrite && tx.done])
    )[0];
  }, "method");
  cachedMethods.set(prop, method);
  return method;
}
__name(getMethod, "getMethod");
replaceTraps((oldTraps) => ({
  ...oldTraps,
  get: /* @__PURE__ */ __name(
    (target, prop, receiver) =>
      getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    "get",
  ),
  has: /* @__PURE__ */ __name(
    (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop),
    "has",
  ),
}));

// ../node_modules/@firebase/app/dist/esm/index.esm.js
var PlatformLoggerServiceImpl = class {
  static {
    __name(this, "PlatformLoggerServiceImpl");
  }
  constructor(container) {
    this.container = container;
  }
  // In initial implementation, this will be called by installations on
  // auth token refresh, and installations will send this string.
  getPlatformInfoString() {
    const providers = this.container.getProviders();
    return providers
      .map((provider) => {
        if (isVersionServiceProvider(provider)) {
          const service = provider.getImmediate();
          return `${service.library}/${service.version}`;
        } else {
          return null;
        }
      })
      .filter((logString) => logString)
      .join(" ");
  }
};
function isVersionServiceProvider(provider) {
  const component = provider.getComponent();
  return component?.type === "VERSION";
}
__name(isVersionServiceProvider, "isVersionServiceProvider");
var name$q = "@firebase/app";
var version$1 = "0.15.0";
var logger = new Logger("@firebase/app");
var name$p = "@firebase/app-compat";
var name$o = "@firebase/analytics-compat";
var name$n = "@firebase/analytics";
var name$m = "@firebase/app-check-compat";
var name$l = "@firebase/app-check";
var name$k = "@firebase/auth";
var name$j = "@firebase/auth-compat";
var name$i = "@firebase/database";
var name$h = "@firebase/data-connect";
var name$g = "@firebase/database-compat";
var name$f = "@firebase/functions";
var name$e = "@firebase/functions-compat";
var name$d = "@firebase/installations";
var name$c = "@firebase/installations-compat";
var name$b = "@firebase/messaging";
var name$a = "@firebase/messaging-compat";
var name$9 = "@firebase/performance";
var name$8 = "@firebase/performance-compat";
var name$7 = "@firebase/remote-config";
var name$6 = "@firebase/remote-config-compat";
var name$5 = "@firebase/storage";
var name$4 = "@firebase/storage-compat";
var name$3 = "@firebase/firestore";
var name$2 = "@firebase/ai";
var name$1 = "@firebase/firestore-compat";
var name = "firebase";
var version = "12.15.0";
var DEFAULT_ENTRY_NAME2 = "[DEFAULT]";
var PLATFORM_LOG_STRING = {
  [name$q]: "fire-core",
  [name$p]: "fire-core-compat",
  [name$n]: "fire-analytics",
  [name$o]: "fire-analytics-compat",
  [name$l]: "fire-app-check",
  [name$m]: "fire-app-check-compat",
  [name$k]: "fire-auth",
  [name$j]: "fire-auth-compat",
  [name$i]: "fire-rtdb",
  [name$h]: "fire-data-connect",
  [name$g]: "fire-rtdb-compat",
  [name$f]: "fire-fn",
  [name$e]: "fire-fn-compat",
  [name$d]: "fire-iid",
  [name$c]: "fire-iid-compat",
  [name$b]: "fire-fcm",
  [name$a]: "fire-fcm-compat",
  [name$9]: "fire-perf",
  [name$8]: "fire-perf-compat",
  [name$7]: "fire-rc",
  [name$6]: "fire-rc-compat",
  [name$5]: "fire-gcs",
  [name$4]: "fire-gcs-compat",
  [name$3]: "fire-fst",
  [name$1]: "fire-fst-compat",
  [name$2]: "fire-vertex",
  "fire-js": "fire-js",
  // Platform identifier for JS SDK.
  [name]: "fire-js-all",
};
var _apps = /* @__PURE__ */ new Map();
var _serverApps = /* @__PURE__ */ new Map();
var _components = /* @__PURE__ */ new Map();
function _addComponent(app, component) {
  try {
    app.container.addComponent(component);
  } catch (e) {
    logger.debug(
      `Component ${component.name} failed to register with FirebaseApp ${app.name}`,
      e,
    );
  }
}
__name(_addComponent, "_addComponent");
function _registerComponent(component) {
  const componentName = component.name;
  if (_components.has(componentName)) {
    logger.debug(
      `There were multiple attempts to register component ${componentName}.`,
    );
    return false;
  }
  _components.set(componentName, component);
  for (const app of _apps.values()) {
    _addComponent(app, component);
  }
  for (const serverApp of _serverApps.values()) {
    _addComponent(serverApp, component);
  }
  return true;
}
__name(_registerComponent, "_registerComponent");
function _getProvider(app, name4) {
  const heartbeatController = app.container
    .getProvider("heartbeat")
    .getImmediate({ optional: true });
  if (heartbeatController) {
    void heartbeatController.triggerHeartbeat();
  }
  return app.container.getProvider(name4);
}
__name(_getProvider, "_getProvider");
function _isFirebaseServerApp(obj) {
  if (obj === null || obj === void 0) {
    return false;
  }
  return obj.settings !== void 0;
}
__name(_isFirebaseServerApp, "_isFirebaseServerApp");
var ERRORS = {
  ["no-app"]:
    /* AppError.NO_APP */
    "No Firebase App '{$appName}' has been created - call initializeApp() first",
  ["bad-app-name"]:
    /* AppError.BAD_APP_NAME */
    "Illegal App name: '{$appName}'",
  ["duplicate-app"]:
    /* AppError.DUPLICATE_APP */
    "Firebase App named '{$appName}' already exists with different options or config",
  ["app-deleted"]:
    /* AppError.APP_DELETED */
    "Firebase App named '{$appName}' already deleted",
  ["server-app-deleted"]:
    /* AppError.SERVER_APP_DELETED */
    "Firebase Server App has been deleted",
  ["no-options"]:
    /* AppError.NO_OPTIONS */
    "Need to provide options, when not being deployed to hosting via source.",
  ["invalid-app-argument"]:
    /* AppError.INVALID_APP_ARGUMENT */
    "firebase.{$appName}() takes either no argument or a Firebase App instance.",
  ["invalid-log-argument"]:
    /* AppError.INVALID_LOG_ARGUMENT */
    "First argument to `onLog` must be null or a function.",
  ["idb-open"]:
    /* AppError.IDB_OPEN */
    "Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.",
  ["idb-get"]:
    /* AppError.IDB_GET */
    "Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.",
  ["idb-set"]:
    /* AppError.IDB_WRITE */
    "Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.",
  ["idb-delete"]:
    /* AppError.IDB_DELETE */
    "Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.",
  ["finalization-registry-not-supported"]:
    /* AppError.FINALIZATION_REGISTRY_NOT_SUPPORTED */
    "FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.",
  ["invalid-server-app-environment"]:
    /* AppError.INVALID_SERVER_APP_ENVIRONMENT */
    "FirebaseServerApp is not for use in browser environments.",
};
var ERROR_FACTORY = new ErrorFactory("app", "Firebase", ERRORS);
var FirebaseAppImpl = class {
  static {
    __name(this, "FirebaseAppImpl");
  }
  constructor(options, config, container) {
    this._isDeleted = false;
    this._options = { ...options };
    this._config = { ...config };
    this._name = config.name;
    this._automaticDataCollectionEnabled =
      config.automaticDataCollectionEnabled;
    this._container = container;
    this.container.addComponent(
      new Component(
        "app",
        () => this,
        "PUBLIC",
        /* ComponentType.PUBLIC */
      ),
    );
  }
  get automaticDataCollectionEnabled() {
    this.checkDestroyed();
    return this._automaticDataCollectionEnabled;
  }
  set automaticDataCollectionEnabled(val) {
    this.checkDestroyed();
    this._automaticDataCollectionEnabled = val;
  }
  get name() {
    this.checkDestroyed();
    return this._name;
  }
  get options() {
    this.checkDestroyed();
    return this._options;
  }
  get config() {
    this.checkDestroyed();
    return this._config;
  }
  get container() {
    return this._container;
  }
  get isDeleted() {
    return this._isDeleted;
  }
  set isDeleted(val) {
    this._isDeleted = val;
  }
  /**
   * This function will throw an Error if the App has already been deleted -
   * use before performing API actions on the App.
   */
  checkDestroyed() {
    if (this.isDeleted) {
      throw ERROR_FACTORY.create("app-deleted", { appName: this._name });
    }
  }
};
var SDK_VERSION = version;
function initializeApp(_options, rawConfig = {}) {
  let options = _options;
  if (typeof rawConfig !== "object") {
    const name5 = rawConfig;
    rawConfig = { name: name5 };
  }
  const config = {
    name: DEFAULT_ENTRY_NAME2,
    automaticDataCollectionEnabled: true,
    ...rawConfig,
  };
  const name4 = config.name;
  if (typeof name4 !== "string" || !name4) {
    throw ERROR_FACTORY.create("bad-app-name", {
      appName: String(name4),
    });
  }
  options || (options = getDefaultAppConfig());
  if (!options) {
    throw ERROR_FACTORY.create(
      "no-options",
      /* AppError.NO_OPTIONS */
    );
  }
  const existingApp = _apps.get(name4);
  if (existingApp) {
    if (
      deepEqual(options, existingApp.options) &&
      deepEqual(config, existingApp.config)
    ) {
      return existingApp;
    } else {
      throw ERROR_FACTORY.create("duplicate-app", { appName: name4 });
    }
  }
  const container = new ComponentContainer(name4);
  for (const component of _components.values()) {
    container.addComponent(component);
  }
  const newApp = new FirebaseAppImpl(options, config, container);
  _apps.set(name4, newApp);
  return newApp;
}
__name(initializeApp, "initializeApp");
function getApp(name4 = DEFAULT_ENTRY_NAME2) {
  const app = _apps.get(name4);
  if (!app && name4 === DEFAULT_ENTRY_NAME2 && getDefaultAppConfig()) {
    return initializeApp();
  }
  if (!app) {
    throw ERROR_FACTORY.create("no-app", { appName: name4 });
  }
  return app;
}
__name(getApp, "getApp");
function getApps() {
  return Array.from(_apps.values());
}
__name(getApps, "getApps");
function registerVersion(libraryKeyOrName, version4, variant) {
  let library = PLATFORM_LOG_STRING[libraryKeyOrName] ?? libraryKeyOrName;
  if (variant) {
    library += `-${variant}`;
  }
  const libraryMismatch = library.match(/\s|\//);
  const versionMismatch = version4.match(/\s|\//);
  if (libraryMismatch || versionMismatch) {
    const warning = [
      `Unable to register library "${library}" with version "${version4}":`,
    ];
    if (libraryMismatch) {
      warning.push(
        `library name "${library}" contains illegal characters (whitespace or "/")`,
      );
    }
    if (libraryMismatch && versionMismatch) {
      warning.push("and");
    }
    if (versionMismatch) {
      warning.push(
        `version name "${version4}" contains illegal characters (whitespace or "/")`,
      );
    }
    logger.warn(warning.join(" "));
    return;
  }
  _registerComponent(
    new Component(
      `${library}-version`,
      () => ({ library, version: version4 }),
      "VERSION",
      /* ComponentType.VERSION */
    ),
  );
}
__name(registerVersion, "registerVersion");
var DB_NAME = "firebase-heartbeat-database";
var DB_VERSION = 1;
var STORE_NAME = "firebase-heartbeat-store";
var dbPromise = null;
function getDbPromise() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade: /* @__PURE__ */ __name((db, oldVersion) => {
        switch (oldVersion) {
          case 0:
            try {
              db.createObjectStore(STORE_NAME);
            } catch (e) {
              console.warn(e);
            }
        }
      }, "upgrade"),
    }).catch((e) => {
      throw ERROR_FACTORY.create("idb-open", {
        originalErrorMessage: e.message,
      });
    });
  }
  return dbPromise;
}
__name(getDbPromise, "getDbPromise");
async function readHeartbeatsFromIndexedDB(app) {
  try {
    const db = await getDbPromise();
    const tx = db.transaction(STORE_NAME);
    const result = await tx.objectStore(STORE_NAME).get(computeKey(app));
    await tx.done;
    return result;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-get", {
        originalErrorMessage: e?.message,
      });
      logger.warn(idbGetError.message);
    }
  }
}
__name(readHeartbeatsFromIndexedDB, "readHeartbeatsFromIndexedDB");
async function writeHeartbeatsToIndexedDB(app, heartbeatObject) {
  try {
    const db = await getDbPromise();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const objectStore = tx.objectStore(STORE_NAME);
    await objectStore.put(heartbeatObject, computeKey(app));
    await tx.done;
  } catch (e) {
    if (e instanceof FirebaseError) {
      logger.warn(e.message);
    } else {
      const idbGetError = ERROR_FACTORY.create("idb-set", {
        originalErrorMessage: e?.message,
      });
      logger.warn(idbGetError.message);
    }
  }
}
__name(writeHeartbeatsToIndexedDB, "writeHeartbeatsToIndexedDB");
function computeKey(app) {
  return `${app.name}!${app.options.appId}`;
}
__name(computeKey, "computeKey");
var MAX_HEADER_BYTES = 1024;
var MAX_NUM_STORED_HEARTBEATS = 30;
var HeartbeatServiceImpl = class {
  static {
    __name(this, "HeartbeatServiceImpl");
  }
  constructor(container) {
    this.container = container;
    this._heartbeatsCache = null;
    const app = this.container.getProvider("app").getImmediate();
    this._storage = new HeartbeatStorageImpl(app);
    this._heartbeatsCachePromise = this._storage.read().then((result) => {
      this._heartbeatsCache = result;
      return result;
    });
  }
  /**
   * Called to report a heartbeat. The function will generate
   * a HeartbeatsByUserAgent object, update heartbeatsCache, and persist it
   * to IndexedDB.
   * Note that we only store one heartbeat per day. So if a heartbeat for today is
   * already logged, subsequent calls to this function in the same day will be ignored.
   */
  async triggerHeartbeat() {
    try {
      const platformLogger = this.container
        .getProvider("platform-logger")
        .getImmediate();
      const agent = platformLogger.getPlatformInfoString();
      const date = getUTCDateString();
      if (this._heartbeatsCache?.heartbeats == null) {
        this._heartbeatsCache = await this._heartbeatsCachePromise;
        if (this._heartbeatsCache?.heartbeats == null) {
          return;
        }
      }
      if (
        this._heartbeatsCache.lastSentHeartbeatDate === date ||
        this._heartbeatsCache.heartbeats.some(
          (singleDateHeartbeat) => singleDateHeartbeat.date === date,
        )
      ) {
        return;
      } else {
        this._heartbeatsCache.heartbeats.push({ date, agent });
        if (
          this._heartbeatsCache.heartbeats.length > MAX_NUM_STORED_HEARTBEATS
        ) {
          const earliestHeartbeatIdx = getEarliestHeartbeatIdx(
            this._heartbeatsCache.heartbeats,
          );
          this._heartbeatsCache.heartbeats.splice(earliestHeartbeatIdx, 1);
        }
      }
      return this._storage.overwrite(this._heartbeatsCache);
    } catch (e) {
      logger.warn(e);
    }
  }
  /**
   * Returns a base64 encoded string which can be attached to the heartbeat-specific header directly.
   * It also clears all heartbeats from memory as well as in IndexedDB.
   *
   * NOTE: Consuming product SDKs should not send the header if this method
   * returns an empty string.
   */
  async getHeartbeatsHeader() {
    try {
      if (this._heartbeatsCache === null) {
        await this._heartbeatsCachePromise;
      }
      if (
        this._heartbeatsCache?.heartbeats == null ||
        this._heartbeatsCache.heartbeats.length === 0
      ) {
        return "";
      }
      const date = getUTCDateString();
      const { heartbeatsToSend, unsentEntries } = extractHeartbeatsForHeader(
        this._heartbeatsCache.heartbeats,
      );
      const headerString = base64urlEncodeWithoutPadding(
        JSON.stringify({ version: 2, heartbeats: heartbeatsToSend }),
      );
      this._heartbeatsCache.lastSentHeartbeatDate = date;
      if (unsentEntries.length > 0) {
        this._heartbeatsCache.heartbeats = unsentEntries;
        await this._storage.overwrite(this._heartbeatsCache);
      } else {
        this._heartbeatsCache.heartbeats = [];
        void this._storage.overwrite(this._heartbeatsCache);
      }
      return headerString;
    } catch (e) {
      logger.warn(e);
      return "";
    }
  }
};
function getUTCDateString() {
  const today = /* @__PURE__ */ new Date();
  return today.toISOString().substring(0, 10);
}
__name(getUTCDateString, "getUTCDateString");
function extractHeartbeatsForHeader(
  heartbeatsCache,
  maxSize = MAX_HEADER_BYTES,
) {
  const heartbeatsToSend = [];
  let unsentEntries = heartbeatsCache.slice();
  for (const singleDateHeartbeat of heartbeatsCache) {
    const heartbeatEntry = heartbeatsToSend.find(
      (hb) => hb.agent === singleDateHeartbeat.agent,
    );
    if (!heartbeatEntry) {
      heartbeatsToSend.push({
        agent: singleDateHeartbeat.agent,
        dates: [singleDateHeartbeat.date],
      });
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatsToSend.pop();
        break;
      }
    } else {
      heartbeatEntry.dates.push(singleDateHeartbeat.date);
      if (countBytes(heartbeatsToSend) > maxSize) {
        heartbeatEntry.dates.pop();
        break;
      }
    }
    unsentEntries = unsentEntries.slice(1);
  }
  return {
    heartbeatsToSend,
    unsentEntries,
  };
}
__name(extractHeartbeatsForHeader, "extractHeartbeatsForHeader");
var HeartbeatStorageImpl = class {
  static {
    __name(this, "HeartbeatStorageImpl");
  }
  constructor(app) {
    this.app = app;
    this._canUseIndexedDBPromise = this.runIndexedDBEnvironmentCheck();
  }
  async runIndexedDBEnvironmentCheck() {
    if (!isIndexedDBAvailable()) {
      return false;
    } else {
      return validateIndexedDBOpenable()
        .then(() => true)
        .catch(() => false);
    }
  }
  /**
   * Read all heartbeats.
   */
  async read() {
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return { heartbeats: [] };
    } else {
      const idbHeartbeatObject = await readHeartbeatsFromIndexedDB(this.app);
      if (idbHeartbeatObject?.heartbeats) {
        return idbHeartbeatObject;
      } else {
        return { heartbeats: [] };
      }
    }
  }
  // overwrite the storage with the provided heartbeats
  async overwrite(heartbeatsObject) {
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return;
    } else {
      const existingHeartbeatsObject = await this.read();
      return writeHeartbeatsToIndexedDB(this.app, {
        lastSentHeartbeatDate:
          heartbeatsObject.lastSentHeartbeatDate ??
          existingHeartbeatsObject.lastSentHeartbeatDate,
        heartbeats: heartbeatsObject.heartbeats,
      });
    }
  }
  // add heartbeats
  async add(heartbeatsObject) {
    const canUseIndexedDB = await this._canUseIndexedDBPromise;
    if (!canUseIndexedDB) {
      return;
    } else {
      const existingHeartbeatsObject = await this.read();
      return writeHeartbeatsToIndexedDB(this.app, {
        lastSentHeartbeatDate:
          heartbeatsObject.lastSentHeartbeatDate ??
          existingHeartbeatsObject.lastSentHeartbeatDate,
        heartbeats: [
          ...existingHeartbeatsObject.heartbeats,
          ...heartbeatsObject.heartbeats,
        ],
      });
    }
  }
};
function countBytes(heartbeatsCache) {
  return base64urlEncodeWithoutPadding(
    // heartbeatsCache wrapper properties
    JSON.stringify({ version: 2, heartbeats: heartbeatsCache }),
  ).length;
}
__name(countBytes, "countBytes");
function getEarliestHeartbeatIdx(heartbeats) {
  if (heartbeats.length === 0) {
    return -1;
  }
  let earliestHeartbeatIdx = 0;
  let earliestHeartbeatDate = heartbeats[0].date;
  for (let i = 1; i < heartbeats.length; i++) {
    if (heartbeats[i].date < earliestHeartbeatDate) {
      earliestHeartbeatDate = heartbeats[i].date;
      earliestHeartbeatIdx = i;
    }
  }
  return earliestHeartbeatIdx;
}
__name(getEarliestHeartbeatIdx, "getEarliestHeartbeatIdx");
function registerCoreComponents(variant) {
  _registerComponent(
    new Component(
      "platform-logger",
      (container) => new PlatformLoggerServiceImpl(container),
      "PRIVATE",
      /* ComponentType.PRIVATE */
    ),
  );
  _registerComponent(
    new Component(
      "heartbeat",
      (container) => new HeartbeatServiceImpl(container),
      "PRIVATE",
      /* ComponentType.PRIVATE */
    ),
  );
  registerVersion(name$q, version$1, variant);
  registerVersion(name$q, version$1, "esm2020");
  registerVersion("fire-js", "");
}
__name(registerCoreComponents, "registerCoreComponents");
registerCoreComponents("");

// ../node_modules/firebase/app/dist/esm/index.esm.js
var name2 = "firebase";
var version2 = "12.15.0";
registerVersion(name2, version2, "app");

// ../node_modules/@firebase/webchannel-wrapper/dist/bloom-blob/esm/bloom_blob_es2018.js
var commonjsGlobal =
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
        ? global
        : typeof self !== "undefined"
          ? self
          : {};
var bloom_blob_es2018 = {};
var Integer;
var Md5;
(function () {
  var h;
  function k2(d2, a) {
    function c() {}
    __name(c, "c");
    c.prototype = a.prototype;
    d2.F = a.prototype;
    d2.prototype = new c();
    d2.prototype.constructor = d2;
    d2.D = function (f2, e, g2) {
      for (
        var b2 = Array(arguments.length - 2), r = 2;
        r < arguments.length;
        r++
      )
        b2[r - 2] = arguments[r];
      return a.prototype[e].apply(f2, b2);
    };
  }
  __name(k2, "k");
  function l() {
    this.blockSize = -1;
  }
  __name(l, "l");
  function m2() {
    this.blockSize = -1;
    this.blockSize = 64;
    this.g = Array(4);
    this.C = Array(this.blockSize);
    this.o = this.h = 0;
    this.u();
  }
  __name(m2, "m");
  k2(m2, l);
  m2.prototype.u = function () {
    this.g[0] = 1732584193;
    this.g[1] = 4023233417;
    this.g[2] = 2562383102;
    this.g[3] = 271733878;
    this.o = this.h = 0;
  };
  function n(d2, a, c) {
    c || (c = 0);
    const f2 = Array(16);
    if (typeof a === "string")
      for (var e = 0; e < 16; ++e)
        f2[e] =
          a.charCodeAt(c++) |
          (a.charCodeAt(c++) << 8) |
          (a.charCodeAt(c++) << 16) |
          (a.charCodeAt(c++) << 24);
    else
      for (e = 0; e < 16; ++e)
        f2[e] = a[c++] | (a[c++] << 8) | (a[c++] << 16) | (a[c++] << 24);
    a = d2.g[0];
    c = d2.g[1];
    e = d2.g[2];
    let g2 = d2.g[3],
      b2;
    b2 = (a + (g2 ^ (c & (e ^ g2))) + f2[0] + 3614090360) & 4294967295;
    a = c + (((b2 << 7) & 4294967295) | (b2 >>> 25));
    b2 = (g2 + (e ^ (a & (c ^ e))) + f2[1] + 3905402710) & 4294967295;
    g2 = a + (((b2 << 12) & 4294967295) | (b2 >>> 20));
    b2 = (e + (c ^ (g2 & (a ^ c))) + f2[2] + 606105819) & 4294967295;
    e = g2 + (((b2 << 17) & 4294967295) | (b2 >>> 15));
    b2 = (c + (a ^ (e & (g2 ^ a))) + f2[3] + 3250441966) & 4294967295;
    c = e + (((b2 << 22) & 4294967295) | (b2 >>> 10));
    b2 = (a + (g2 ^ (c & (e ^ g2))) + f2[4] + 4118548399) & 4294967295;
    a = c + (((b2 << 7) & 4294967295) | (b2 >>> 25));
    b2 = (g2 + (e ^ (a & (c ^ e))) + f2[5] + 1200080426) & 4294967295;
    g2 = a + (((b2 << 12) & 4294967295) | (b2 >>> 20));
    b2 = (e + (c ^ (g2 & (a ^ c))) + f2[6] + 2821735955) & 4294967295;
    e = g2 + (((b2 << 17) & 4294967295) | (b2 >>> 15));
    b2 = (c + (a ^ (e & (g2 ^ a))) + f2[7] + 4249261313) & 4294967295;
    c = e + (((b2 << 22) & 4294967295) | (b2 >>> 10));
    b2 = (a + (g2 ^ (c & (e ^ g2))) + f2[8] + 1770035416) & 4294967295;
    a = c + (((b2 << 7) & 4294967295) | (b2 >>> 25));
    b2 = (g2 + (e ^ (a & (c ^ e))) + f2[9] + 2336552879) & 4294967295;
    g2 = a + (((b2 << 12) & 4294967295) | (b2 >>> 20));
    b2 = (e + (c ^ (g2 & (a ^ c))) + f2[10] + 4294925233) & 4294967295;
    e = g2 + (((b2 << 17) & 4294967295) | (b2 >>> 15));
    b2 = (c + (a ^ (e & (g2 ^ a))) + f2[11] + 2304563134) & 4294967295;
    c = e + (((b2 << 22) & 4294967295) | (b2 >>> 10));
    b2 = (a + (g2 ^ (c & (e ^ g2))) + f2[12] + 1804603682) & 4294967295;
    a = c + (((b2 << 7) & 4294967295) | (b2 >>> 25));
    b2 = (g2 + (e ^ (a & (c ^ e))) + f2[13] + 4254626195) & 4294967295;
    g2 = a + (((b2 << 12) & 4294967295) | (b2 >>> 20));
    b2 = (e + (c ^ (g2 & (a ^ c))) + f2[14] + 2792965006) & 4294967295;
    e = g2 + (((b2 << 17) & 4294967295) | (b2 >>> 15));
    b2 = (c + (a ^ (e & (g2 ^ a))) + f2[15] + 1236535329) & 4294967295;
    c = e + (((b2 << 22) & 4294967295) | (b2 >>> 10));
    b2 = (a + (e ^ (g2 & (c ^ e))) + f2[1] + 4129170786) & 4294967295;
    a = c + (((b2 << 5) & 4294967295) | (b2 >>> 27));
    b2 = (g2 + (c ^ (e & (a ^ c))) + f2[6] + 3225465664) & 4294967295;
    g2 = a + (((b2 << 9) & 4294967295) | (b2 >>> 23));
    b2 = (e + (a ^ (c & (g2 ^ a))) + f2[11] + 643717713) & 4294967295;
    e = g2 + (((b2 << 14) & 4294967295) | (b2 >>> 18));
    b2 = (c + (g2 ^ (a & (e ^ g2))) + f2[0] + 3921069994) & 4294967295;
    c = e + (((b2 << 20) & 4294967295) | (b2 >>> 12));
    b2 = (a + (e ^ (g2 & (c ^ e))) + f2[5] + 3593408605) & 4294967295;
    a = c + (((b2 << 5) & 4294967295) | (b2 >>> 27));
    b2 = (g2 + (c ^ (e & (a ^ c))) + f2[10] + 38016083) & 4294967295;
    g2 = a + (((b2 << 9) & 4294967295) | (b2 >>> 23));
    b2 = (e + (a ^ (c & (g2 ^ a))) + f2[15] + 3634488961) & 4294967295;
    e = g2 + (((b2 << 14) & 4294967295) | (b2 >>> 18));
    b2 = (c + (g2 ^ (a & (e ^ g2))) + f2[4] + 3889429448) & 4294967295;
    c = e + (((b2 << 20) & 4294967295) | (b2 >>> 12));
    b2 = (a + (e ^ (g2 & (c ^ e))) + f2[9] + 568446438) & 4294967295;
    a = c + (((b2 << 5) & 4294967295) | (b2 >>> 27));
    b2 = (g2 + (c ^ (e & (a ^ c))) + f2[14] + 3275163606) & 4294967295;
    g2 = a + (((b2 << 9) & 4294967295) | (b2 >>> 23));
    b2 = (e + (a ^ (c & (g2 ^ a))) + f2[3] + 4107603335) & 4294967295;
    e = g2 + (((b2 << 14) & 4294967295) | (b2 >>> 18));
    b2 = (c + (g2 ^ (a & (e ^ g2))) + f2[8] + 1163531501) & 4294967295;
    c = e + (((b2 << 20) & 4294967295) | (b2 >>> 12));
    b2 = (a + (e ^ (g2 & (c ^ e))) + f2[13] + 2850285829) & 4294967295;
    a = c + (((b2 << 5) & 4294967295) | (b2 >>> 27));
    b2 = (g2 + (c ^ (e & (a ^ c))) + f2[2] + 4243563512) & 4294967295;
    g2 = a + (((b2 << 9) & 4294967295) | (b2 >>> 23));
    b2 = (e + (a ^ (c & (g2 ^ a))) + f2[7] + 1735328473) & 4294967295;
    e = g2 + (((b2 << 14) & 4294967295) | (b2 >>> 18));
    b2 = (c + (g2 ^ (a & (e ^ g2))) + f2[12] + 2368359562) & 4294967295;
    c = e + (((b2 << 20) & 4294967295) | (b2 >>> 12));
    b2 = (a + (c ^ e ^ g2) + f2[5] + 4294588738) & 4294967295;
    a = c + (((b2 << 4) & 4294967295) | (b2 >>> 28));
    b2 = (g2 + (a ^ c ^ e) + f2[8] + 2272392833) & 4294967295;
    g2 = a + (((b2 << 11) & 4294967295) | (b2 >>> 21));
    b2 = (e + (g2 ^ a ^ c) + f2[11] + 1839030562) & 4294967295;
    e = g2 + (((b2 << 16) & 4294967295) | (b2 >>> 16));
    b2 = (c + (e ^ g2 ^ a) + f2[14] + 4259657740) & 4294967295;
    c = e + (((b2 << 23) & 4294967295) | (b2 >>> 9));
    b2 = (a + (c ^ e ^ g2) + f2[1] + 2763975236) & 4294967295;
    a = c + (((b2 << 4) & 4294967295) | (b2 >>> 28));
    b2 = (g2 + (a ^ c ^ e) + f2[4] + 1272893353) & 4294967295;
    g2 = a + (((b2 << 11) & 4294967295) | (b2 >>> 21));
    b2 = (e + (g2 ^ a ^ c) + f2[7] + 4139469664) & 4294967295;
    e = g2 + (((b2 << 16) & 4294967295) | (b2 >>> 16));
    b2 = (c + (e ^ g2 ^ a) + f2[10] + 3200236656) & 4294967295;
    c = e + (((b2 << 23) & 4294967295) | (b2 >>> 9));
    b2 = (a + (c ^ e ^ g2) + f2[13] + 681279174) & 4294967295;
    a = c + (((b2 << 4) & 4294967295) | (b2 >>> 28));
    b2 = (g2 + (a ^ c ^ e) + f2[0] + 3936430074) & 4294967295;
    g2 = a + (((b2 << 11) & 4294967295) | (b2 >>> 21));
    b2 = (e + (g2 ^ a ^ c) + f2[3] + 3572445317) & 4294967295;
    e = g2 + (((b2 << 16) & 4294967295) | (b2 >>> 16));
    b2 = (c + (e ^ g2 ^ a) + f2[6] + 76029189) & 4294967295;
    c = e + (((b2 << 23) & 4294967295) | (b2 >>> 9));
    b2 = (a + (c ^ e ^ g2) + f2[9] + 3654602809) & 4294967295;
    a = c + (((b2 << 4) & 4294967295) | (b2 >>> 28));
    b2 = (g2 + (a ^ c ^ e) + f2[12] + 3873151461) & 4294967295;
    g2 = a + (((b2 << 11) & 4294967295) | (b2 >>> 21));
    b2 = (e + (g2 ^ a ^ c) + f2[15] + 530742520) & 4294967295;
    e = g2 + (((b2 << 16) & 4294967295) | (b2 >>> 16));
    b2 = (c + (e ^ g2 ^ a) + f2[2] + 3299628645) & 4294967295;
    c = e + (((b2 << 23) & 4294967295) | (b2 >>> 9));
    b2 = (a + (e ^ (c | ~g2)) + f2[0] + 4096336452) & 4294967295;
    a = c + (((b2 << 6) & 4294967295) | (b2 >>> 26));
    b2 = (g2 + (c ^ (a | ~e)) + f2[7] + 1126891415) & 4294967295;
    g2 = a + (((b2 << 10) & 4294967295) | (b2 >>> 22));
    b2 = (e + (a ^ (g2 | ~c)) + f2[14] + 2878612391) & 4294967295;
    e = g2 + (((b2 << 15) & 4294967295) | (b2 >>> 17));
    b2 = (c + (g2 ^ (e | ~a)) + f2[5] + 4237533241) & 4294967295;
    c = e + (((b2 << 21) & 4294967295) | (b2 >>> 11));
    b2 = (a + (e ^ (c | ~g2)) + f2[12] + 1700485571) & 4294967295;
    a = c + (((b2 << 6) & 4294967295) | (b2 >>> 26));
    b2 = (g2 + (c ^ (a | ~e)) + f2[3] + 2399980690) & 4294967295;
    g2 = a + (((b2 << 10) & 4294967295) | (b2 >>> 22));
    b2 = (e + (a ^ (g2 | ~c)) + f2[10] + 4293915773) & 4294967295;
    e = g2 + (((b2 << 15) & 4294967295) | (b2 >>> 17));
    b2 = (c + (g2 ^ (e | ~a)) + f2[1] + 2240044497) & 4294967295;
    c = e + (((b2 << 21) & 4294967295) | (b2 >>> 11));
    b2 = (a + (e ^ (c | ~g2)) + f2[8] + 1873313359) & 4294967295;
    a = c + (((b2 << 6) & 4294967295) | (b2 >>> 26));
    b2 = (g2 + (c ^ (a | ~e)) + f2[15] + 4264355552) & 4294967295;
    g2 = a + (((b2 << 10) & 4294967295) | (b2 >>> 22));
    b2 = (e + (a ^ (g2 | ~c)) + f2[6] + 2734768916) & 4294967295;
    e = g2 + (((b2 << 15) & 4294967295) | (b2 >>> 17));
    b2 = (c + (g2 ^ (e | ~a)) + f2[13] + 1309151649) & 4294967295;
    c = e + (((b2 << 21) & 4294967295) | (b2 >>> 11));
    b2 = (a + (e ^ (c | ~g2)) + f2[4] + 4149444226) & 4294967295;
    a = c + (((b2 << 6) & 4294967295) | (b2 >>> 26));
    b2 = (g2 + (c ^ (a | ~e)) + f2[11] + 3174756917) & 4294967295;
    g2 = a + (((b2 << 10) & 4294967295) | (b2 >>> 22));
    b2 = (e + (a ^ (g2 | ~c)) + f2[2] + 718787259) & 4294967295;
    e = g2 + (((b2 << 15) & 4294967295) | (b2 >>> 17));
    b2 = (c + (g2 ^ (e | ~a)) + f2[9] + 3951481745) & 4294967295;
    d2.g[0] = (d2.g[0] + a) & 4294967295;
    d2.g[1] =
      (d2.g[1] + (e + (((b2 << 21) & 4294967295) | (b2 >>> 11)))) & 4294967295;
    d2.g[2] = (d2.g[2] + e) & 4294967295;
    d2.g[3] = (d2.g[3] + g2) & 4294967295;
  }
  __name(n, "n");
  m2.prototype.v = function (d2, a) {
    a === void 0 && (a = d2.length);
    const c = a - this.blockSize,
      f2 = this.C;
    let e = this.h,
      g2 = 0;
    for (; g2 < a;) {
      if (e == 0) for (; g2 <= c;) (n(this, d2, g2), (g2 += this.blockSize));
      if (typeof d2 === "string")
        for (; g2 < a;) {
          if (((f2[e++] = d2.charCodeAt(g2++)), e == this.blockSize)) {
            n(this, f2);
            e = 0;
            break;
          }
        }
      else
        for (; g2 < a;)
          if (((f2[e++] = d2[g2++]), e == this.blockSize)) {
            n(this, f2);
            e = 0;
            break;
          }
    }
    this.h = e;
    this.o += a;
  };
  m2.prototype.A = function () {
    var d2 = Array(
      (this.h < 56 ? this.blockSize : this.blockSize * 2) - this.h,
    );
    d2[0] = 128;
    for (var a = 1; a < d2.length - 8; ++a) d2[a] = 0;
    a = this.o * 8;
    for (var c = d2.length - 8; c < d2.length; ++c)
      ((d2[c] = a & 255), (a /= 256));
    this.v(d2);
    d2 = Array(16);
    a = 0;
    for (c = 0; c < 4; ++c)
      for (let f2 = 0; f2 < 32; f2 += 8) d2[a++] = (this.g[c] >>> f2) & 255;
    return d2;
  };
  function p2(d2, a) {
    var c = q;
    return Object.prototype.hasOwnProperty.call(c, d2)
      ? c[d2]
      : (c[d2] = a(d2));
  }
  __name(p2, "p");
  function t(d2, a) {
    this.h = a;
    const c = [];
    let f2 = true;
    for (let e = d2.length - 1; e >= 0; e--) {
      const g2 = d2[e] | 0;
      (f2 && g2 == a) || ((c[e] = g2), (f2 = false));
    }
    this.g = c;
  }
  __name(t, "t");
  var q = {};
  function u(d2) {
    return -128 <= d2 && d2 < 128
      ? p2(d2, function (a) {
          return new t([a | 0], a < 0 ? -1 : 0);
        })
      : new t([d2 | 0], d2 < 0 ? -1 : 0);
  }
  __name(u, "u");
  function v2(d2) {
    if (isNaN(d2) || !isFinite(d2)) return w2;
    if (d2 < 0) return x2(v2(-d2));
    const a = [];
    let c = 1;
    for (let f2 = 0; d2 >= c; f2++) ((a[f2] = (d2 / c) | 0), (c *= 4294967296));
    return new t(a, 0);
  }
  __name(v2, "v");
  function y2(d2, a) {
    if (d2.length == 0) throw Error("number format error: empty string");
    a = a || 10;
    if (a < 2 || 36 < a) throw Error("radix out of range: " + a);
    if (d2.charAt(0) == "-") return x2(y2(d2.substring(1), a));
    if (d2.indexOf("-") >= 0)
      throw Error('number format error: interior "-" character');
    const c = v2(Math.pow(a, 8));
    let f2 = w2;
    for (let g2 = 0; g2 < d2.length; g2 += 8) {
      var e = Math.min(8, d2.length - g2);
      const b2 = parseInt(d2.substring(g2, g2 + e), a);
      e < 8
        ? ((e = v2(Math.pow(a, e))), (f2 = f2.j(e).add(v2(b2))))
        : ((f2 = f2.j(c)), (f2 = f2.add(v2(b2))));
    }
    return f2;
  }
  __name(y2, "y");
  var w2 = u(0),
    z = u(1),
    A2 = u(16777216);
  h = t.prototype;
  h.m = function () {
    if (B2(this)) return -x2(this).m();
    let d2 = 0,
      a = 1;
    for (let c = 0; c < this.g.length; c++) {
      const f2 = this.i(c);
      d2 += (f2 >= 0 ? f2 : 4294967296 + f2) * a;
      a *= 4294967296;
    }
    return d2;
  };
  h.toString = function (d2) {
    d2 = d2 || 10;
    if (d2 < 2 || 36 < d2) throw Error("radix out of range: " + d2);
    if (C2(this)) return "0";
    if (B2(this)) return "-" + x2(this).toString(d2);
    const a = v2(Math.pow(d2, 6));
    var c = this;
    let f2 = "";
    for (;;) {
      const e = D2(c, a).g;
      c = F2(c, e.j(a));
      let g2 = ((c.g.length > 0 ? c.g[0] : c.h) >>> 0).toString(d2);
      c = e;
      if (C2(c)) return g2 + f2;
      for (; g2.length < 6;) g2 = "0" + g2;
      f2 = g2 + f2;
    }
  };
  h.i = function (d2) {
    return d2 < 0 ? 0 : d2 < this.g.length ? this.g[d2] : this.h;
  };
  function C2(d2) {
    if (d2.h != 0) return false;
    for (let a = 0; a < d2.g.length; a++) if (d2.g[a] != 0) return false;
    return true;
  }
  __name(C2, "C");
  function B2(d2) {
    return d2.h == -1;
  }
  __name(B2, "B");
  h.l = function (d2) {
    d2 = F2(this, d2);
    return B2(d2) ? -1 : C2(d2) ? 0 : 1;
  };
  function x2(d2) {
    const a = d2.g.length,
      c = [];
    for (let f2 = 0; f2 < a; f2++) c[f2] = ~d2.g[f2];
    return new t(c, ~d2.h).add(z);
  }
  __name(x2, "x");
  h.abs = function () {
    return B2(this) ? x2(this) : this;
  };
  h.add = function (d2) {
    const a = Math.max(this.g.length, d2.g.length),
      c = [];
    let f2 = 0;
    for (let e = 0; e <= a; e++) {
      let g2 = f2 + (this.i(e) & 65535) + (d2.i(e) & 65535),
        b2 = (g2 >>> 16) + (this.i(e) >>> 16) + (d2.i(e) >>> 16);
      f2 = b2 >>> 16;
      g2 &= 65535;
      b2 &= 65535;
      c[e] = (b2 << 16) | g2;
    }
    return new t(c, c[c.length - 1] & -2147483648 ? -1 : 0);
  };
  function F2(d2, a) {
    return d2.add(x2(a));
  }
  __name(F2, "F");
  h.j = function (d2) {
    if (C2(this) || C2(d2)) return w2;
    if (B2(this)) return B2(d2) ? x2(this).j(x2(d2)) : x2(x2(this).j(d2));
    if (B2(d2)) return x2(this.j(x2(d2)));
    if (this.l(A2) < 0 && d2.l(A2) < 0) return v2(this.m() * d2.m());
    const a = this.g.length + d2.g.length,
      c = [];
    for (var f2 = 0; f2 < 2 * a; f2++) c[f2] = 0;
    for (f2 = 0; f2 < this.g.length; f2++)
      for (let e = 0; e < d2.g.length; e++) {
        const g2 = this.i(f2) >>> 16,
          b2 = this.i(f2) & 65535,
          r = d2.i(e) >>> 16,
          E2 = d2.i(e) & 65535;
        c[2 * f2 + 2 * e] += b2 * E2;
        G(c, 2 * f2 + 2 * e);
        c[2 * f2 + 2 * e + 1] += g2 * E2;
        G(c, 2 * f2 + 2 * e + 1);
        c[2 * f2 + 2 * e + 1] += b2 * r;
        G(c, 2 * f2 + 2 * e + 1);
        c[2 * f2 + 2 * e + 2] += g2 * r;
        G(c, 2 * f2 + 2 * e + 2);
      }
    for (d2 = 0; d2 < a; d2++) c[d2] = (c[2 * d2 + 1] << 16) | c[2 * d2];
    for (d2 = a; d2 < 2 * a; d2++) c[d2] = 0;
    return new t(c, 0);
  };
  function G(d2, a) {
    for (; (d2[a] & 65535) != d2[a];)
      ((d2[a + 1] += d2[a] >>> 16), (d2[a] &= 65535), a++);
  }
  __name(G, "G");
  function H(d2, a) {
    this.g = d2;
    this.h = a;
  }
  __name(H, "H");
  function D2(d2, a) {
    if (C2(a)) throw Error("division by zero");
    if (C2(d2)) return new H(w2, w2);
    if (B2(d2)) return ((a = D2(x2(d2), a)), new H(x2(a.g), x2(a.h)));
    if (B2(a)) return ((a = D2(d2, x2(a))), new H(x2(a.g), a.h));
    if (d2.g.length > 30) {
      if (B2(d2) || B2(a))
        throw Error("slowDivide_ only works with positive integers.");
      for (var c = z, f2 = a; f2.l(d2) <= 0;) ((c = I2(c)), (f2 = I2(f2)));
      var e = J(c, 1),
        g2 = J(f2, 1);
      f2 = J(f2, 2);
      for (c = J(c, 2); !C2(f2);) {
        var b2 = g2.add(f2);
        b2.l(d2) <= 0 && ((e = e.add(c)), (g2 = b2));
        f2 = J(f2, 1);
        c = J(c, 1);
      }
      a = F2(d2, e.j(a));
      return new H(e, a);
    }
    for (e = w2; d2.l(a) >= 0;) {
      c = Math.max(1, Math.floor(d2.m() / a.m()));
      f2 = Math.ceil(Math.log(c) / Math.LN2);
      f2 = f2 <= 48 ? 1 : Math.pow(2, f2 - 48);
      g2 = v2(c);
      for (b2 = g2.j(a); B2(b2) || b2.l(d2) > 0;)
        ((c -= f2), (g2 = v2(c)), (b2 = g2.j(a)));
      C2(g2) && (g2 = z);
      e = e.add(g2);
      d2 = F2(d2, b2);
    }
    return new H(e, d2);
  }
  __name(D2, "D");
  h.B = function (d2) {
    return D2(this, d2).h;
  };
  h.and = function (d2) {
    const a = Math.max(this.g.length, d2.g.length),
      c = [];
    for (let f2 = 0; f2 < a; f2++) c[f2] = this.i(f2) & d2.i(f2);
    return new t(c, this.h & d2.h);
  };
  h.or = function (d2) {
    const a = Math.max(this.g.length, d2.g.length),
      c = [];
    for (let f2 = 0; f2 < a; f2++) c[f2] = this.i(f2) | d2.i(f2);
    return new t(c, this.h | d2.h);
  };
  h.xor = function (d2) {
    const a = Math.max(this.g.length, d2.g.length),
      c = [];
    for (let f2 = 0; f2 < a; f2++) c[f2] = this.i(f2) ^ d2.i(f2);
    return new t(c, this.h ^ d2.h);
  };
  function I2(d2) {
    const a = d2.g.length + 1,
      c = [];
    for (let f2 = 0; f2 < a; f2++)
      c[f2] = (d2.i(f2) << 1) | (d2.i(f2 - 1) >>> 31);
    return new t(c, d2.h);
  }
  __name(I2, "I");
  function J(d2, a) {
    const c = a >> 5;
    a %= 32;
    const f2 = d2.g.length - c,
      e = [];
    for (let g2 = 0; g2 < f2; g2++)
      e[g2] =
        a > 0
          ? (d2.i(g2 + c) >>> a) | (d2.i(g2 + c + 1) << (32 - a))
          : d2.i(g2 + c);
    return new t(e, d2.h);
  }
  __name(J, "J");
  m2.prototype.digest = m2.prototype.A;
  m2.prototype.reset = m2.prototype.u;
  m2.prototype.update = m2.prototype.v;
  Md5 = bloom_blob_es2018.Md5 = m2;
  t.prototype.add = t.prototype.add;
  t.prototype.multiply = t.prototype.j;
  t.prototype.modulo = t.prototype.B;
  t.prototype.compare = t.prototype.l;
  t.prototype.toNumber = t.prototype.m;
  t.prototype.toString = t.prototype.toString;
  t.prototype.getBits = t.prototype.i;
  t.fromNumber = v2;
  t.fromString = y2;
  Integer = bloom_blob_es2018.Integer = t;
}).apply(
  typeof commonjsGlobal !== "undefined"
    ? commonjsGlobal
    : typeof self !== "undefined"
      ? self
      : typeof window !== "undefined"
        ? window
        : {},
);

// ../node_modules/@firebase/firestore/dist/lite/common-90c44673.esm.js
var User = class {
  static {
    __name(this, "User");
  }
  constructor(e) {
    this.uid = e;
  }
  isAuthenticated() {
    return null != this.uid;
  }
  /**
   * Returns a key representing this user, suitable for inclusion in a
   * dictionary.
   */
  toKey() {
    return this.isAuthenticated() ? "uid:" + this.uid : "anonymous-user";
  }
  isEqual(e) {
    return e.uid === this.uid;
  }
};
((User.UNAUTHENTICATED = new User(null)), // TODO(mikelehen): Look into getting a proper uid-equivalent for
  // non-FirebaseAuth providers.
  (User.GOOGLE_CREDENTIALS = new User("google-credentials-uid")),
  (User.FIRST_PARTY = new User("first-party-uid")),
  (User.MOCK_USER = new User("mock-user")));
var f = "12.15.0";
function __PRIVATE_setSDKVersion(e) {
  f = e;
}
__name(__PRIVATE_setSDKVersion, "__PRIVATE_setSDKVersion");
var m = new Logger("@firebase/firestore");
function __PRIVATE_logDebug(e, ...t) {
  if (m.logLevel <= LogLevel.DEBUG) {
    const r = t.map(__PRIVATE_argToString);
    m.debug(`Firestore (${f}): ${e}`, ...r);
  }
}
__name(__PRIVATE_logDebug, "__PRIVATE_logDebug");
function __PRIVATE_logError(e, ...t) {
  if (m.logLevel <= LogLevel.ERROR) {
    const r = t.map(__PRIVATE_argToString);
    m.error(`Firestore (${f}): ${e}`, ...r);
  }
}
__name(__PRIVATE_logError, "__PRIVATE_logError");
function __PRIVATE_logWarn(e, ...t) {
  if (m.logLevel <= LogLevel.WARN) {
    const r = t.map(__PRIVATE_argToString);
    m.warn(`Firestore (${f}): ${e}`, ...r);
  }
}
__name(__PRIVATE_logWarn, "__PRIVATE_logWarn");
function __PRIVATE_argToString(e) {
  if ("string" == typeof e) return e;
  try {
    return /* @__PURE__ */ __name(function __PRIVATE_formatJSON(e2) {
      return JSON.stringify(e2);
    }, "__PRIVATE_formatJSON")(e);
  } catch (t) {
    return e;
  }
}
__name(__PRIVATE_argToString, "__PRIVATE_argToString");
function fail(e, t, r) {
  let n = "Unexpected state";
  ("string" == typeof t ? (n = t) : (r = t), __PRIVATE__fail(e, n, r));
}
__name(fail, "fail");
function __PRIVATE__fail(e, t, r) {
  let n = `FIRESTORE (${f}) INTERNAL ASSERTION FAILED: ${t} (ID: ${e.toString(16)})`;
  if (void 0 !== r)
    try {
      n += " CONTEXT: " + JSON.stringify(r);
    } catch (e2) {
      n += " CONTEXT: " + r;
    }
  throw (__PRIVATE_logError(n), new Error(n));
}
__name(__PRIVATE__fail, "__PRIVATE__fail");
function __PRIVATE_hardAssert(e, t, r, n) {
  let i = "Unexpected state";
  ("string" == typeof r ? (i = r) : (n = r), e || __PRIVATE__fail(t, i, n));
}
__name(__PRIVATE_hardAssert, "__PRIVATE_hardAssert");
function __PRIVATE_debugCast(e, t) {
  return e;
}
__name(__PRIVATE_debugCast, "__PRIVATE_debugCast");
var d = {
  // Causes are copied from:
  // https://github.com/grpc/grpc/blob/bceec94ea4fc5f0085d81235d8e1c06798dc341a/include/grpc%2B%2B/impl/codegen/status_code_enum.h
  /** Not an error; returned on success. */
  OK: "ok",
  /** The operation was cancelled (typically by the caller). */
  CANCELLED: "cancelled",
  /** Unknown error or an error from a different error domain. */
  UNKNOWN: "unknown",
  /**
   * Client specified an invalid argument. Note that this differs from
   * FAILED_PRECONDITION. INVALID_ARGUMENT indicates arguments that are
   * problematic regardless of the state of the system (e.g., a malformed file
   * name).
   */
  INVALID_ARGUMENT: "invalid-argument",
  /**
   * Deadline expired before operation could complete. For operations that
   * change the state of the system, this error may be returned even if the
   * operation has completed successfully. For example, a successful response
   * from a server could have been delayed long enough for the deadline to
   * expire.
   */
  DEADLINE_EXCEEDED: "deadline-exceeded",
  /** Some requested entity (e.g., file or directory) was not found. */
  NOT_FOUND: "not-found",
  /**
   * Some entity that we attempted to create (e.g., file or directory) already
   * exists.
   */
  ALREADY_EXISTS: "already-exists",
  /**
   * The caller does not have permission to execute the specified operation.
   * PERMISSION_DENIED must not be used for rejections caused by exhausting
   * some resource (use RESOURCE_EXHAUSTED instead for those errors).
   * PERMISSION_DENIED must not be used if the caller cannot be identified
   * (use UNAUTHENTICATED instead for those errors).
   */
  PERMISSION_DENIED: "permission-denied",
  /**
   * The request does not have valid authentication credentials for the
   * operation.
   */
  UNAUTHENTICATED: "unauthenticated",
  /**
   * Some resource has been exhausted, perhaps a per-user quota, or perhaps the
   * entire file system is out of space.
   */
  RESOURCE_EXHAUSTED: "resource-exhausted",
  /**
   * Operation was rejected because the system is not in a state required for
   * the operation's execution. For example, directory to be deleted may be
   * non-empty, an rmdir operation is applied to a non-directory, etc.
   *
   * A litmus test that may help a service implementor in deciding
   * between FAILED_PRECONDITION, ABORTED, and UNAVAILABLE:
   *  (a) Use UNAVAILABLE if the client can retry just the failing call.
   *  (b) Use ABORTED if the client should retry at a higher-level
   *      (e.g., restarting a read-modify-write sequence).
   *  (c) Use FAILED_PRECONDITION if the client should not retry until
   *      the system state has been explicitly fixed. E.g., if an "rmdir"
   *      fails because the directory is non-empty, FAILED_PRECONDITION
   *      should be returned since the client should not retry unless
   *      they have first fixed up the directory by deleting files from it.
   *  (d) Use FAILED_PRECONDITION if the client performs conditional
   *      REST Get/Update/Delete on a resource and the resource on the
   *      server does not match the condition. E.g., conflicting
   *      read-modify-write on the same resource.
   */
  FAILED_PRECONDITION: "failed-precondition",
  /**
   * The operation was aborted, typically due to a concurrency issue like
   * sequencer check failures, transaction aborts, etc.
   *
   * See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
   * and UNAVAILABLE.
   */
  ABORTED: "aborted",
  /**
   * Operation was attempted past the valid range. E.g., seeking or reading
   * past end of file.
   *
   * Unlike INVALID_ARGUMENT, this error indicates a problem that may be fixed
   * if the system state changes. For example, a 32-bit file system will
   * generate INVALID_ARGUMENT if asked to read at an offset that is not in the
   * range [0,2^32-1], but it will generate OUT_OF_RANGE if asked to read from
   * an offset past the current file size.
   *
   * There is a fair bit of overlap between FAILED_PRECONDITION and
   * OUT_OF_RANGE. We recommend using OUT_OF_RANGE (the more specific error)
   * when it applies so that callers who are iterating through a space can
   * easily look for an OUT_OF_RANGE error to detect when they are done.
   */
  OUT_OF_RANGE: "out-of-range",
  /** Operation is not implemented or not supported/enabled in this service. */
  UNIMPLEMENTED: "unimplemented",
  /**
   * Internal errors. Means some invariants expected by underlying System has
   * been broken. If you see one of these errors, Something is very broken.
   */
  INTERNAL: "internal",
  /**
   * The service is currently unavailable. This is a most likely a transient
   * condition and may be corrected by retrying with a backoff.
   *
   * See litmus test above for deciding between FAILED_PRECONDITION, ABORTED,
   * and UNAVAILABLE.
   */
  UNAVAILABLE: "unavailable",
  /** Unrecoverable data loss or corruption. */
  DATA_LOSS: "data-loss",
};
var FirestoreError = class extends FirebaseError {
  static {
    __name(this, "FirestoreError");
  }
  /** @hideconstructor */
  constructor(e, t) {
    (super(e, t),
      (this.code = e),
      (this.message = t), // HACK: We write a toString property directly because Error is not a real
      // class and so inheritance does not work correctly. We could alternatively
      // do the same "back-door inheritance" trick that FirebaseError does.
      (this.toString = () =>
        `${this.name}: [code=${this.code}]: ${this.message}`));
  }
};
var __PRIVATE_OAuthToken = class {
  static {
    __name(this, "__PRIVATE_OAuthToken");
  }
  constructor(e, t) {
    ((this.user = t),
      (this.type = "OAuth"),
      (this.headers = /* @__PURE__ */ new Map()),
      this.headers.set("Authorization", `Bearer ${e}`));
  }
};
var __PRIVATE_EmptyAuthCredentialsProvider = class {
  static {
    __name(this, "__PRIVATE_EmptyAuthCredentialsProvider");
  }
  getToken() {
    return Promise.resolve(null);
  }
  invalidateToken() {}
  start(e, t) {
    e.enqueueRetryable(() => t(User.UNAUTHENTICATED));
  }
  shutdown() {}
};
var __PRIVATE_EmulatorAuthCredentialsProvider = class {
  static {
    __name(this, "__PRIVATE_EmulatorAuthCredentialsProvider");
  }
  constructor(e) {
    ((this.token = e) /**
     * Stores the listener registered with setChangeListener()
     * This isn't actually necessary since the UID never changes, but we use this
     * to verify the listen contract is adhered to in tests.
     */,
      (this.changeListener = null));
  }
  getToken() {
    return Promise.resolve(this.token);
  }
  invalidateToken() {}
  start(e, t) {
    ((this.changeListener = t), // Fire with initial user.
      e.enqueueRetryable(() => t(this.token.user)));
  }
  shutdown() {
    this.changeListener = null;
  }
};
var __PRIVATE_LiteAuthCredentialsProvider = class {
  static {
    __name(this, "__PRIVATE_LiteAuthCredentialsProvider");
  }
  constructor(e) {
    ((this.auth = null),
      e.onInit((e2) => {
        this.auth = e2;
      }));
  }
  getToken() {
    return this.auth
      ? this.auth.getToken().then((e) =>
          e
            ? (__PRIVATE_hardAssert("string" == typeof e.accessToken, 42297, {
                t: e,
              }),
              new __PRIVATE_OAuthToken(
                e.accessToken,
                new User(this.auth.getUid()),
              ))
            : null,
        )
      : Promise.resolve(null);
  }
  invalidateToken() {}
  start(e, t) {}
  shutdown() {}
};
var __PRIVATE_FirstPartyToken = class {
  static {
    __name(this, "__PRIVATE_FirstPartyToken");
  }
  constructor(e, t, r) {
    ((this.i = e),
      (this.o = t),
      (this.u = r),
      (this.type = "FirstParty"),
      (this.user = User.FIRST_PARTY),
      (this.l = /* @__PURE__ */ new Map()));
  }
  /**
   * Gets an authorization token, using a provided factory function, or return
   * null.
   */
  h() {
    return this.u ? this.u() : null;
  }
  get headers() {
    this.l.set("X-Goog-AuthUser", this.i);
    const e = this.h();
    return (
      e && this.l.set("Authorization", e),
      this.o && this.l.set("X-Goog-Iam-Authorization-Token", this.o),
      this.l
    );
  }
};
var __PRIVATE_FirstPartyAuthCredentialsProvider = class {
  static {
    __name(this, "__PRIVATE_FirstPartyAuthCredentialsProvider");
  }
  constructor(e, t, r) {
    ((this.i = e), (this.o = t), (this.u = r));
  }
  getToken() {
    return Promise.resolve(
      new __PRIVATE_FirstPartyToken(this.i, this.o, this.u),
    );
  }
  start(e, t) {
    e.enqueueRetryable(() => t(User.FIRST_PARTY));
  }
  shutdown() {}
  invalidateToken() {}
};
var AppCheckToken = class {
  static {
    __name(this, "AppCheckToken");
  }
  constructor(e) {
    ((this.value = e),
      (this.type = "AppCheck"),
      (this.headers = /* @__PURE__ */ new Map()),
      e && e.length > 0 && this.headers.set("x-firebase-appcheck", this.value));
  }
};
var __PRIVATE_LiteAppCheckTokenProvider = class {
  static {
    __name(this, "__PRIVATE_LiteAppCheckTokenProvider");
  }
  constructor(e, t) {
    ((this.m = t),
      (this.appCheck = null),
      (this.T = null),
      _isFirebaseServerApp(e) &&
        e.settings.appCheckToken &&
        (this.T = e.settings.appCheckToken),
      t.onInit((e2) => {
        this.appCheck = e2;
      }));
  }
  getToken() {
    return this.T
      ? Promise.resolve(new AppCheckToken(this.T))
      : this.appCheck
        ? this.appCheck.getToken().then((e) =>
            e
              ? (__PRIVATE_hardAssert("string" == typeof e.token, 3470, {
                  tokenResult: e,
                }),
                new AppCheckToken(e.token))
              : null,
          )
        : Promise.resolve(null);
  }
  invalidateToken() {}
  start(e, t) {}
  shutdown() {}
};
var DatabaseInfo = class {
  static {
    __name(this, "DatabaseInfo");
  }
  /**
   * Constructs a DatabaseInfo using the provided host, databaseId and
   * persistenceKey.
   *
   * @param databaseId - The database to use.
   * @param appId - The Firebase App Id.
   * @param persistenceKey - A unique identifier for this Firestore's local
   * storage (used in conjunction with the databaseId).
   * @param host - The Firestore backend host to connect to.
   * @param ssl - Whether to use SSL when connecting.
   * @param forceLongPolling - Whether to use the forceLongPolling option
   * when using WebChannel as the network transport.
   * @param autoDetectLongPolling - Whether to use the detectBufferingProxy
   * option when using WebChannel as the network transport.
   * @param longPollingOptions - Options that configure long-polling.
   * @param useFetchStreams - Whether to use the Fetch API instead of
   * XMLHTTPRequest
   */
  constructor(e, t, r, n, i, s, o, a, u, _, c) {
    ((this.databaseId = e),
      (this.appId = t),
      (this.persistenceKey = r),
      (this.host = n),
      (this.ssl = i),
      (this.forceLongPolling = s),
      (this.autoDetectLongPolling = o),
      (this.longPollingOptions = a),
      (this.useFetchStreams = u),
      (this.isUsingEmulator = _),
      (this.apiKey = c));
  }
};
var E = "(default)";
var DatabaseId = class _DatabaseId {
  static {
    __name(this, "DatabaseId");
  }
  constructor(e, t) {
    ((this.projectId = e), (this.database = t || E));
  }
  static empty() {
    return new _DatabaseId("", "");
  }
  get isDefaultDatabase() {
    return this.database === E;
  }
  isEqual(e) {
    return (
      e instanceof _DatabaseId &&
      e.projectId === this.projectId &&
      e.database === this.database
    );
  }
};
function __PRIVATE_databaseIdFromApp(e, t) {
  if (!Object.prototype.hasOwnProperty.apply(e.options, ["projectId"]))
    throw new FirestoreError(
      d.INVALID_ARGUMENT,
      '"projectId" not provided in firebase.initializeApp.',
    );
  return new DatabaseId(e.options.projectId, t);
}
__name(__PRIVATE_databaseIdFromApp, "__PRIVATE_databaseIdFromApp");
function __PRIVATE_randomBytes(e) {
  const t =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "undefined" != typeof self && (self.crypto || self.msCrypto),
    r = new Uint8Array(e);
  if (t && "function" == typeof t.getRandomValues) t.getRandomValues(r);
  else for (let t2 = 0; t2 < e; t2++) r[t2] = Math.floor(256 * Math.random());
  return r;
}
__name(__PRIVATE_randomBytes, "__PRIVATE_randomBytes");
var __PRIVATE_AutoId = class {
  static {
    __name(this, "__PRIVATE_AutoId");
  }
  static newId() {
    const e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
      t = 62 * Math.floor(256 / 62);
    let r = "";
    for (; r.length < 20;) {
      const n = __PRIVATE_randomBytes(40);
      for (let i = 0; i < n.length; ++i)
        r.length < 20 && n[i] < t && (r += e.charAt(n[i] % 62));
    }
    return r;
  }
};
function __PRIVATE_primitiveComparator(e, t) {
  return e < t ? -1 : e > t ? 1 : 0;
}
__name(__PRIVATE_primitiveComparator, "__PRIVATE_primitiveComparator");
function __PRIVATE_compareUtf8Strings(e, t) {
  const r = Math.min(e.length, t.length);
  for (let n = 0; n < r; n++) {
    const r2 = e.charAt(n),
      i = t.charAt(n);
    if (r2 !== i)
      return __PRIVATE_isSurrogate(r2) === __PRIVATE_isSurrogate(i)
        ? __PRIVATE_primitiveComparator(r2, i)
        : __PRIVATE_isSurrogate(r2)
          ? 1
          : -1;
  }
  return __PRIVATE_primitiveComparator(e.length, t.length);
}
__name(__PRIVATE_compareUtf8Strings, "__PRIVATE_compareUtf8Strings");
var T = 55296;
var P = 57343;
function __PRIVATE_isSurrogate(e) {
  const t = e.charCodeAt(0);
  return t >= T && t <= P;
}
__name(__PRIVATE_isSurrogate, "__PRIVATE_isSurrogate");
function __PRIVATE_arrayEquals(e, t, r) {
  return e.length === t.length && e.every((e2, n) => r(e2, t[n]));
}
__name(__PRIVATE_arrayEquals, "__PRIVATE_arrayEquals");
var V = "__name__";
var BasePath = class _BasePath {
  static {
    __name(this, "BasePath");
  }
  constructor(e, t, r) {
    (void 0 === t
      ? (t = 0)
      : t > e.length &&
        fail(637, {
          offset: t,
          range: e.length,
        }),
      void 0 === r
        ? (r = e.length - t)
        : r > e.length - t &&
          fail(1746, {
            length: r,
            range: e.length - t,
          }),
      (this.segments = e),
      (this.offset = t),
      (this.len = r));
  }
  get length() {
    return this.len;
  }
  isEqual(e) {
    return 0 === _BasePath.comparator(this, e);
  }
  child(e) {
    const t = this.segments.slice(this.offset, this.limit());
    return (
      e instanceof _BasePath
        ? e.forEach((e2) => {
            t.push(e2);
          })
        : t.push(e),
      this.construct(t)
    );
  }
  /** The index of one past the last segment of the path. */
  limit() {
    return this.offset + this.length;
  }
  popFirst(e) {
    return (
      (e = void 0 === e ? 1 : e),
      this.construct(this.segments, this.offset + e, this.length - e)
    );
  }
  popLast() {
    return this.construct(this.segments, this.offset, this.length - 1);
  }
  firstSegment() {
    return this.segments[this.offset];
  }
  lastSegment() {
    return this.get(this.length - 1);
  }
  get(e) {
    return this.segments[this.offset + e];
  }
  isEmpty() {
    return 0 === this.length;
  }
  isPrefixOf(e) {
    if (e.length < this.length) return false;
    for (let t = 0; t < this.length; t++)
      if (this.get(t) !== e.get(t)) return false;
    return true;
  }
  isImmediateParentOf(e) {
    if (this.length + 1 !== e.length) return false;
    for (let t = 0; t < this.length; t++)
      if (this.get(t) !== e.get(t)) return false;
    return true;
  }
  forEach(e) {
    for (let t = this.offset, r = this.limit(); t < r; t++) e(this.segments[t]);
  }
  toArray() {
    return this.segments.slice(this.offset, this.limit());
  }
  /**
   * Compare 2 paths segment by segment, prioritizing numeric IDs
   * (e.g., "__id123__") in numeric ascending order, followed by string
   * segments in lexicographical order.
   */
  static comparator(e, t) {
    const r = Math.min(e.length, t.length);
    for (let n = 0; n < r; n++) {
      const r2 = _BasePath.compareSegments(e.get(n), t.get(n));
      if (0 !== r2) return r2;
    }
    return __PRIVATE_primitiveComparator(e.length, t.length);
  }
  static compareSegments(e, t) {
    const r = _BasePath.isNumericId(e),
      n = _BasePath.isNumericId(t);
    return r && !n
      ? -1
      : !r && n
        ? 1
        : r && n
          ? _BasePath.extractNumericId(e).compare(_BasePath.extractNumericId(t))
          : __PRIVATE_compareUtf8Strings(e, t);
  }
  // Checks if a segment is a numeric ID (starts with "__id" and ends with "__").
  static isNumericId(e) {
    return e.startsWith("__id") && e.endsWith("__");
  }
  static extractNumericId(e) {
    return Integer.fromString(e.substring(4, e.length - 2));
  }
};
var ResourcePath = class _ResourcePath extends BasePath {
  static {
    __name(this, "ResourcePath");
  }
  construct(e, t, r) {
    return new _ResourcePath(e, t, r);
  }
  canonicalString() {
    return this.toArray().join("/");
  }
  toString() {
    return this.canonicalString();
  }
  toStringWithLeadingSlash() {
    return `/${this.canonicalString()}`;
  }
  /**
   * Returns a string representation of this path
   * where each path segment has been encoded with
   * `encodeURIComponent`.
   */
  toUriEncodedString() {
    return this.toArray().map(encodeURIComponent).join("/");
  }
  /**
   * Creates a resource path from the given slash-delimited string. If multiple
   * arguments are provided, all components are combined. Leading and trailing
   * slashes from all components are ignored.
   */
  static fromString(...e) {
    const t = [];
    for (const r of e) {
      if (r.indexOf("//") >= 0)
        throw new FirestoreError(
          d.INVALID_ARGUMENT,
          `Invalid segment (${r}). Paths must not contain // in them.`,
        );
      t.push(...r.split("/").filter((e2) => e2.length > 0));
    }
    return new _ResourcePath(t);
  }
  static emptyPath() {
    return new _ResourcePath([]);
  }
};
var R = /^[_a-zA-Z][_a-zA-Z0-9]*$/;
var FieldPath$1 = class _FieldPath$1 extends BasePath {
  static {
    __name(this, "FieldPath$1");
  }
  construct(e, t, r) {
    return new _FieldPath$1(e, t, r);
  }
  /**
   * Returns true if the string could be used as a segment in a field path
   * without escaping.
   */
  static isValidIdentifier(e) {
    return R.test(e);
  }
  canonicalString() {
    return this.toArray()
      .map(
        (e) => (
          (e = e.replace(/\\/g, "\\\\").replace(/`/g, "\\`")),
          _FieldPath$1.isValidIdentifier(e) || (e = "`" + e + "`"),
          e
        ),
      )
      .join(".");
  }
  toString() {
    return this.canonicalString();
  }
  /**
   * Returns true if this field references the key of a document.
   */
  isKeyField() {
    return 1 === this.length && this.get(0) === V;
  }
  /**
   * The field designating the key of a document.
   */
  static keyField() {
    return new _FieldPath$1([V]);
  }
  /**
   * Parses a field string from the given server-formatted string.
   *
   * - Splitting the empty string is not allowed (for now at least).
   * - Empty segments within the string (e.g. if there are two consecutive
   *   separators) are not allowed.
   *
   * TODO(b/37244157): we should make this more strict. Right now, it allows
   * non-identifier path components, even if they aren't escaped.
   */
  static fromServerFormat(e) {
    const t = [];
    let r = "",
      n = 0;
    const __PRIVATE_addCurrentSegment = /* @__PURE__ */ __name(() => {
      if (0 === r.length)
        throw new FirestoreError(
          d.INVALID_ARGUMENT,
          `Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,
        );
      (t.push(r), (r = ""));
    }, "__PRIVATE_addCurrentSegment");
    let i = false;
    for (; n < e.length;) {
      const t2 = e[n];
      if ("\\" === t2) {
        if (n + 1 === e.length)
          throw new FirestoreError(
            d.INVALID_ARGUMENT,
            "Path has trailing escape character: " + e,
          );
        const t3 = e[n + 1];
        if ("\\" !== t3 && "." !== t3 && "`" !== t3)
          throw new FirestoreError(
            d.INVALID_ARGUMENT,
            "Path has invalid escape sequence: " + e,
          );
        ((r += t3), (n += 2));
      } else
        "`" === t2
          ? ((i = !i), n++)
          : "." !== t2 || i
            ? ((r += t2), n++)
            : (__PRIVATE_addCurrentSegment(), n++);
    }
    if ((__PRIVATE_addCurrentSegment(), i))
      throw new FirestoreError(
        d.INVALID_ARGUMENT,
        "Unterminated ` in path: " + e,
      );
    return new _FieldPath$1(t);
  }
  static emptyPath() {
    return new _FieldPath$1([]);
  }
};
var DocumentKey = class _DocumentKey {
  static {
    __name(this, "DocumentKey");
  }
  constructor(e) {
    this.path = e;
  }
  static fromPath(e) {
    return new _DocumentKey(ResourcePath.fromString(e));
  }
  static fromName(e) {
    return new _DocumentKey(ResourcePath.fromString(e).popFirst(5));
  }
  static empty() {
    return new _DocumentKey(ResourcePath.emptyPath());
  }
  get collectionGroup() {
    return this.path.popLast().lastSegment();
  }
  /** Returns true if the document is in the specified collectionId. */
  hasCollectionId(e) {
    return this.path.length >= 2 && this.path.get(this.path.length - 2) === e;
  }
  /** Returns the collection group (i.e. the name of the parent collection) for this key. */
  getCollectionGroup() {
    return this.path.get(this.path.length - 2);
  }
  /** Returns the fully qualified path to the parent collection. */
  getCollectionPath() {
    return this.path.popLast();
  }
  isEqual(e) {
    return null !== e && 0 === ResourcePath.comparator(this.path, e.path);
  }
  toString() {
    return this.path.toString();
  }
  static comparator(e, t) {
    return ResourcePath.comparator(e.path, t.path);
  }
  static isDocumentKey(e) {
    return e.length % 2 == 0;
  }
  /**
   * Creates and returns a new document key with the given segments.
   *
   * @param segments - The segments of the path to the document
   * @returns A new instance of DocumentKey
   */
  static fromSegments(e) {
    return new _DocumentKey(new ResourcePath(e.slice()));
  }
};
function __PRIVATE_validateNonEmptyArgument(e, t, r) {
  if (!r)
    throw new FirestoreError(
      d.INVALID_ARGUMENT,
      `Function ${e}() cannot be called with an empty ${t}.`,
    );
}
__name(
  __PRIVATE_validateNonEmptyArgument,
  "__PRIVATE_validateNonEmptyArgument",
);
function __PRIVATE_validateDocumentPath(e) {
  if (!DocumentKey.isDocumentKey(e))
    throw new FirestoreError(
      d.INVALID_ARGUMENT,
      `Invalid document reference. Document references must have an even number of segments, but ${e} has ${e.length}.`,
    );
}
__name(__PRIVATE_validateDocumentPath, "__PRIVATE_validateDocumentPath");
function __PRIVATE_isPlainObject(e) {
  return (
    "object" == typeof e &&
    null !== e &&
    (Object.getPrototypeOf(e) === Object.prototype ||
      null === Object.getPrototypeOf(e))
  );
}
__name(__PRIVATE_isPlainObject, "__PRIVATE_isPlainObject");
function __PRIVATE_valueDescription(e) {
  if (void 0 === e) return "undefined";
  if (null === e) return "null";
  if ("string" == typeof e)
    return (
      e.length > 20 && (e = `${e.substring(0, 20)}...`),
      JSON.stringify(e)
    );
  if ("number" == typeof e || "boolean" == typeof e) return "" + e;
  if ("object" == typeof e) {
    if (e instanceof Array) return "an array";
    {
      const t =
        /** try to get the constructor name for an object. */
        /* @__PURE__ */ __name(function __PRIVATE_tryGetCustomObjectType(e2) {
          if (e2.constructor) return e2.constructor.name;
          return null;
        }, "__PRIVATE_tryGetCustomObjectType")(e);
      return t ? `a custom ${t} object` : "an object";
    }
  }
  return "function" == typeof e
    ? "a function"
    : fail(12329, {
        type: typeof e,
      });
}
__name(__PRIVATE_valueDescription, "__PRIVATE_valueDescription");
function __PRIVATE_cast(e, t) {
  if (
    ("_delegate" in e && // Unwrap Compat types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e = e._delegate),
    !(e instanceof t))
  ) {
    if (t.name === e.constructor.name)
      throw new FirestoreError(
        d.INVALID_ARGUMENT,
        "Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?",
      );
    {
      const r = __PRIVATE_valueDescription(e);
      throw new FirestoreError(
        d.INVALID_ARGUMENT,
        `Expected type '${t.name}', but it was: ${r}`,
      );
    }
  }
  return e;
}
__name(__PRIVATE_cast, "__PRIVATE_cast");
function __PRIVATE_cloneLongPollingOptions(e) {
  const t = {};
  return (
    void 0 !== e.timeoutSeconds && (t.timeoutSeconds = e.timeoutSeconds),
    t
  );
}
__name(__PRIVATE_cloneLongPollingOptions, "__PRIVATE_cloneLongPollingOptions");
var A = null;
function __PRIVATE_generateUniqueDebugId() {
  return (
    null === A
      ? (A = /* @__PURE__ */ __name(
          function __PRIVATE_generateInitialUniqueDebugId() {
            return 268435456 + Math.round(2147483648 * Math.random());
          },
          "__PRIVATE_generateInitialUniqueDebugId",
        )())
      : A++,
    "0x" + A.toString(16)
  );
}
__name(__PRIVATE_generateUniqueDebugId, "__PRIVATE_generateUniqueDebugId");
function __PRIVATE_isNegativeZero(e) {
  return 0 === e && 1 / e == -1 / 0;
}
__name(__PRIVATE_isNegativeZero, "__PRIVATE_isNegativeZero");
var I = "RestConnection";
var p = {
  BatchGetDocuments: "batchGet",
  Commit: "commit",
  RunQuery: "runQuery",
  RunAggregationQuery: "runAggregationQuery",
  ExecutePipeline: "executePipeline",
};
var __PRIVATE_RestConnection = class {
  static {
    __name(this, "__PRIVATE_RestConnection");
  }
  get P() {
    return false;
  }
  constructor(e) {
    ((this.databaseInfo = e), (this.databaseId = e.databaseId));
    const t = e.ssl ? "https" : "http",
      r = encodeURIComponent(this.databaseId.projectId),
      n = encodeURIComponent(this.databaseId.database);
    ((this.V = t + "://" + e.host),
      (this.R = `projects/${r}/databases/${n}`),
      (this.A =
        this.databaseId.database === E
          ? `project_id=${r}`
          : `project_id=${r}&database_id=${n}`));
  }
  I(e, r, n, i, s) {
    const o = __PRIVATE_generateUniqueDebugId(),
      a = this.p(e, r.toUriEncodedString());
    __PRIVATE_logDebug(I, `Sending RPC '${e}' ${o}:`, a, n);
    const u = {
      "google-cloud-resource-prefix": this.R,
      "x-goog-request-params": this.A,
    };
    this.F(u, i, s);
    const { host: _ } = new URL(a),
      c = isCloudWorkstation(_);
    return this.v(e, a, u, n, c).then(
      (t) => (__PRIVATE_logDebug(I, `Received RPC '${e}' ${o}: `, t), t),
      (t) => {
        throw (
          __PRIVATE_logWarn(
            I,
            `RPC '${e}' ${o} failed with error: `,
            t,
            "url: ",
            a,
            "request:",
            n,
          ),
          t
        );
      },
    );
  }
  D(e, t, r, n, i, s) {
    return this.I(e, t, r, n, i);
  }
  /**
   * Modifies the headers for a request, adding any authorization token if
   * present and any additional headers for the request.
   */
  F(e, t, r) {
    ((e["X-Goog-Api-Client"] = // SDK_VERSION is updated to different value at runtime depending on the entry point,
      // so we need to get its value when we need it in a function.
      /* @__PURE__ */ __name(function __PRIVATE_getGoogApiClientValue() {
        return "gl-js/ fire/" + f;
      }, "__PRIVATE_getGoogApiClientValue")()), // Content-Type: text/plain will avoid preflight requests which might
      // mess with CORS and redirects by proxies. If we add custom headers
      // we will need to change this code to potentially use the $httpOverwrite
      // parameter supported by ESF to avoid triggering preflight requests.
      (e["Content-Type"] = "text/plain"),
      this.databaseInfo.appId &&
        (e["X-Firebase-GMPID"] = this.databaseInfo.appId),
      t && t.headers.forEach((t2, r2) => (e[r2] = t2)),
      r && r.headers.forEach((t2, r2) => (e[r2] = t2)));
  }
  p(e, t) {
    const r = p[e];
    let n = `${this.V}/v1/${t}:${r}`;
    return (
      this.databaseInfo.apiKey &&
        (n = `${n}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),
      n
    );
  }
  /**
   * Closes and cleans up any resources associated with the connection. This
   * implementation is a no-op because there are no resources associated
   * with the RestConnection that need to be cleaned up.
   */
  terminate() {}
};
var y;
var w;
function __PRIVATE_mapCodeFromHttpStatus(e) {
  if (void 0 === e)
    return (
      __PRIVATE_logError("RPC_ERROR", "HTTP error has no status"),
      d.UNKNOWN
    );
  switch (e) {
    case 200:
      return d.OK;
    case 400:
      return d.FAILED_PRECONDITION;
    // Other possibilities based on the forward mapping
    // return Code.INVALID_ARGUMENT;
    // return Code.OUT_OF_RANGE;
    case 401:
      return d.UNAUTHENTICATED;
    case 403:
      return d.PERMISSION_DENIED;
    case 404:
      return d.NOT_FOUND;
    case 409:
      return d.ABORTED;
    // Other possibilities:
    // return Code.ALREADY_EXISTS;
    case 416:
      return d.OUT_OF_RANGE;
    case 429:
      return d.RESOURCE_EXHAUSTED;
    case 499:
      return d.CANCELLED;
    case 500:
      return d.UNKNOWN;
    // Other possibilities:
    // return Code.INTERNAL;
    // return Code.DATA_LOSS;
    case 501:
      return d.UNIMPLEMENTED;
    case 503:
      return d.UNAVAILABLE;
    case 504:
      return d.DEADLINE_EXCEEDED;
    default:
      return e >= 200 && e < 300
        ? d.OK
        : e >= 400 && e < 500
          ? d.FAILED_PRECONDITION
          : e >= 500 && e < 600
            ? d.INTERNAL
            : d.UNKNOWN;
  }
}
__name(__PRIVATE_mapCodeFromHttpStatus, "__PRIVATE_mapCodeFromHttpStatus");
(((w = y || (y = {}))[(w.OK = 0)] = "OK"),
  (w[(w.CANCELLED = 1)] = "CANCELLED"),
  (w[(w.UNKNOWN = 2)] = "UNKNOWN"),
  (w[(w.INVALID_ARGUMENT = 3)] = "INVALID_ARGUMENT"),
  (w[(w.DEADLINE_EXCEEDED = 4)] = "DEADLINE_EXCEEDED"),
  (w[(w.NOT_FOUND = 5)] = "NOT_FOUND"),
  (w[(w.ALREADY_EXISTS = 6)] = "ALREADY_EXISTS"),
  (w[(w.PERMISSION_DENIED = 7)] = "PERMISSION_DENIED"),
  (w[(w.UNAUTHENTICATED = 16)] = "UNAUTHENTICATED"),
  (w[(w.RESOURCE_EXHAUSTED = 8)] = "RESOURCE_EXHAUSTED"),
  (w[(w.FAILED_PRECONDITION = 9)] = "FAILED_PRECONDITION"),
  (w[(w.ABORTED = 10)] = "ABORTED"),
  (w[(w.OUT_OF_RANGE = 11)] = "OUT_OF_RANGE"),
  (w[(w.UNIMPLEMENTED = 12)] = "UNIMPLEMENTED"),
  (w[(w.INTERNAL = 13)] = "INTERNAL"),
  (w[(w.UNAVAILABLE = 14)] = "UNAVAILABLE"),
  (w[(w.DATA_LOSS = 15)] = "DATA_LOSS"));
var __PRIVATE_FetchConnection = class extends __PRIVATE_RestConnection {
  static {
    __name(this, "__PRIVATE_FetchConnection");
  }
  N(e, t) {
    throw new Error("Not supported by FetchConnection");
  }
  async v(e, t, r, n, i) {
    const s = JSON.stringify(n);
    let o;
    try {
      const e2 = {
        method: "POST",
        headers: r,
        body: s,
      };
      (i && (e2.credentials = "include"), (o = await fetch(t, e2)));
    } catch (e2) {
      const t2 = e2;
      throw new FirestoreError(
        __PRIVATE_mapCodeFromHttpStatus(t2.status),
        "Request failed with error: " + t2.statusText,
      );
    }
    if (!o.ok) {
      let e2 = await o.json();
      Array.isArray(e2) && (e2 = e2[0]);
      const t2 = e2?.error?.message;
      throw new FirestoreError(
        __PRIVATE_mapCodeFromHttpStatus(o.status),
        `Request failed with error: ${t2 ?? o.statusText}`,
      );
    }
    return o.json();
  }
};
function __PRIVATE_objectSize(e) {
  let t = 0;
  for (const r in e) Object.prototype.hasOwnProperty.call(e, r) && t++;
  return t;
}
__name(__PRIVATE_objectSize, "__PRIVATE_objectSize");
function forEach(e, t) {
  for (const r in e) Object.prototype.hasOwnProperty.call(e, r) && t(r, e[r]);
}
__name(forEach, "forEach");
var __PRIVATE_Base64DecodeError = class extends Error {
  static {
    __name(this, "__PRIVATE_Base64DecodeError");
  }
  constructor() {
    (super(...arguments), (this.name = "Base64DecodeError"));
  }
};
var ByteString = class _ByteString {
  static {
    __name(this, "ByteString");
  }
  constructor(e) {
    this.binaryString = e;
  }
  static fromBase64String(e) {
    const t = /* @__PURE__ */ __name(function __PRIVATE_decodeBase64(e2) {
      try {
        return atob(e2);
      } catch (e3) {
        throw "undefined" != typeof DOMException && e3 instanceof DOMException
          ? new __PRIVATE_Base64DecodeError("Invalid base64 string: " + e3)
          : e3;
      }
    }, "__PRIVATE_decodeBase64")(e);
    return new _ByteString(t);
  }
  static fromUint8Array(e) {
    const t =
      /**
       * Helper function to convert an Uint8array to a binary string.
       */
      /* @__PURE__ */ __name(function __PRIVATE_binaryStringFromUint8Array(e2) {
        let t2 = "";
        for (let r = 0; r < e2.length; ++r) t2 += String.fromCharCode(e2[r]);
        return t2;
      }, "__PRIVATE_binaryStringFromUint8Array")(e);
    return new _ByteString(t);
  }
  [Symbol.iterator]() {
    let e = 0;
    return {
      next: /* @__PURE__ */ __name(
        () =>
          e < this.binaryString.length
            ? {
                value: this.binaryString.charCodeAt(e++),
                done: false,
              }
            : {
                value: void 0,
                done: true,
              },
        "next",
      ),
    };
  }
  toBase64() {
    return /* @__PURE__ */ __name(function __PRIVATE_encodeBase64(e) {
      return btoa(e);
    }, "__PRIVATE_encodeBase64")(this.binaryString);
  }
  toUint8Array() {
    return /* @__PURE__ */ __name(function __PRIVATE_uint8ArrayFromBinaryString(
      e,
    ) {
      const t = new Uint8Array(e.length);
      for (let r = 0; r < e.length; r++) t[r] = e.charCodeAt(r);
      return t;
    }, "__PRIVATE_uint8ArrayFromBinaryString")(this.binaryString);
  }
  approximateByteSize() {
    return 2 * this.binaryString.length;
  }
  compareTo(e) {
    return __PRIVATE_primitiveComparator(this.binaryString, e.binaryString);
  }
  isEqual(e) {
    return this.binaryString === e.binaryString;
  }
};
ByteString.EMPTY_BYTE_STRING = new ByteString("");
var g = new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);
function __PRIVATE_normalizeTimestamp(e) {
  if ((__PRIVATE_hardAssert(!!e, 39018), "string" == typeof e)) {
    let t = 0;
    const r = g.exec(e);
    if (
      (__PRIVATE_hardAssert(!!r, 46558, {
        timestamp: e,
      }),
      r[1])
    ) {
      let e2 = r[1];
      ((e2 = (e2 + "000000000").substr(0, 9)), (t = Number(e2)));
    }
    const n = new Date(e);
    return {
      seconds: Math.floor(n.getTime() / 1e3),
      nanos: t,
    };
  }
  return {
    seconds: __PRIVATE_normalizeNumber(e.seconds),
    nanos: __PRIVATE_normalizeNumber(e.nanos),
  };
}
__name(__PRIVATE_normalizeTimestamp, "__PRIVATE_normalizeTimestamp");
function __PRIVATE_normalizeNumber(e) {
  return "number" == typeof e ? e : "string" == typeof e ? Number(e) : 0;
}
__name(__PRIVATE_normalizeNumber, "__PRIVATE_normalizeNumber");
function __PRIVATE_normalizeByteString(e) {
  return "string" == typeof e
    ? ByteString.fromBase64String(e)
    : ByteString.fromUint8Array(e);
}
__name(__PRIVATE_normalizeByteString, "__PRIVATE_normalizeByteString");
function property(e, t) {
  const r = {
    typeString: e,
  };
  return (t && (r.value = t), r);
}
__name(property, "property");
function __PRIVATE_validateJSON(e, t) {
  if (!__PRIVATE_isPlainObject(e))
    throw new FirestoreError(d.INVALID_ARGUMENT, "JSON must be an object");
  let r;
  for (const n in t)
    if (t[n]) {
      const i = t[n].typeString,
        s =
          "value" in t[n]
            ? {
                value: t[n].value,
              }
            : void 0;
      if (!(n in e)) {
        r = `JSON missing required field: '${n}'`;
        break;
      }
      const o = e[n];
      if (i && typeof o !== i) {
        r = `JSON field '${n}' must be a ${i}.`;
        break;
      }
      if (void 0 !== s && o !== s.value) {
        r = `Expected '${n}' field to equal '${s.value}'`;
        break;
      }
    }
  if (r) throw new FirestoreError(d.INVALID_ARGUMENT, r);
  return true;
}
__name(__PRIVATE_validateJSON, "__PRIVATE_validateJSON");
var F = -62135596800;
var v = 1e6;
var Timestamp = class _Timestamp {
  static {
    __name(this, "Timestamp");
  }
  /**
   * Creates a new timestamp with the current date, with millisecond precision.
   *
   * @returns a new timestamp representing the current date.
   */
  static now() {
    return _Timestamp.fromMillis(Date.now());
  }
  /**
   * Creates a new timestamp from the given date.
   *
   * @param date - The date to initialize the `Timestamp` from.
   * @returns A new `Timestamp` representing the same point in time as the given
   *     date.
   */
  static fromDate(e) {
    return _Timestamp.fromMillis(e.getTime());
  }
  /**
   * Creates a new timestamp from the given number of milliseconds.
   *
   * @param milliseconds - Number of milliseconds since Unix epoch
   *     1970-01-01T00:00:00Z.
   * @returns A new `Timestamp` representing the same point in time as the given
   *     number of milliseconds.
   */
  static fromMillis(e) {
    const t = Math.floor(e / 1e3),
      r = Math.floor((e - 1e3 * t) * v);
    return new _Timestamp(t, r);
  }
  /**
   * Creates a new timestamp.
   *
   * @param seconds - The number of seconds of UTC time since Unix epoch
   *     1970-01-01T00:00:00Z. Must be from 0001-01-01T00:00:00Z to
   *     9999-12-31T23:59:59Z inclusive.
   * @param nanoseconds - The non-negative fractions of a second at nanosecond
   *     resolution. Negative second values with fractions must still have
   *     non-negative nanoseconds values that count forward in time. Must be
   *     from 0 to 999,999,999 inclusive.
   */
  constructor(e, t) {
    if (((this.seconds = e), (this.nanoseconds = t), t < 0))
      throw new FirestoreError(
        d.INVALID_ARGUMENT,
        "Timestamp nanoseconds out of range: " + t,
      );
    if (t >= 1e9)
      throw new FirestoreError(
        d.INVALID_ARGUMENT,
        "Timestamp nanoseconds out of range: " + t,
      );
    if (e < F)
      throw new FirestoreError(
        d.INVALID_ARGUMENT,
        "Timestamp seconds out of range: " + e,
      );
    if (e >= 253402300800)
      throw new FirestoreError(
        d.INVALID_ARGUMENT,
        "Timestamp seconds out of range: " + e,
      );
  }
  /**
   * Converts a `Timestamp` to a JavaScript `Date` object. This conversion
   * causes a loss of precision since `Date` objects only support millisecond
   * precision.
   *
   * @returns JavaScript `Date` object representing the same point in time as
   *     this `Timestamp`, with millisecond precision.
   */
  toDate() {
    return new Date(this.toMillis());
  }
  /**
   * Converts a `Timestamp` to a numeric timestamp (in milliseconds since
   * epoch). This operation causes a loss of precision.
   *
   * @returns The point in time corresponding to this timestamp, represented as
   *     the number of milliseconds since Unix epoch 1970-01-01T00:00:00Z.
   */
  toMillis() {
    return 1e3 * this.seconds + this.nanoseconds / v;
  }
  _compareTo(e) {
    return this.seconds === e.seconds
      ? __PRIVATE_primitiveComparator(this.nanoseconds, e.nanoseconds)
      : __PRIVATE_primitiveComparator(this.seconds, e.seconds);
  }
  /**
   * Returns true if this `Timestamp` is equal to the provided one.
   *
   * @param other - The `Timestamp` to compare against.
   * @returns true if this `Timestamp` is equal to the provided one.
   */
  isEqual(e) {
    return e.seconds === this.seconds && e.nanoseconds === this.nanoseconds;
  }
  /** Returns a textual representation of this `Timestamp`. */
  toString() {
    return (
      "Timestamp(seconds=" +
      this.seconds +
      ", nanoseconds=" +
      this.nanoseconds +
      ")"
    );
  }
  /**
   * Returns a JSON-serializable representation of this `Timestamp`.
   */
  toJSON() {
    return {
      type: _Timestamp._jsonSchemaVersion,
      seconds: this.seconds,
      nanoseconds: this.nanoseconds,
    };
  }
  /**
   * Builds a `Timestamp` instance from a JSON object created by {@link Timestamp.toJSON}.
   */
  static fromJSON(e) {
    if (__PRIVATE_validateJSON(e, _Timestamp._jsonSchema))
      return new _Timestamp(e.seconds, e.nanoseconds);
  }
  /**
   * Converts this object to a primitive string, which allows `Timestamp` objects
   * to be compared using the `>`, `<=`, `>=` and `>` operators.
   */
  valueOf() {
    const e = this.seconds - F;
    return (
      String(e).padStart(12, "0") +
      "." +
      String(this.nanoseconds).padStart(9, "0")
    );
  }
};
((Timestamp._jsonSchemaVersion = "firestore/timestamp/1.0"),
  (Timestamp._jsonSchema = {
    type: property("string", Timestamp._jsonSchemaVersion),
    seconds: property("number"),
    nanoseconds: property("number"),
  }));
function __PRIVATE_isServerTimestamp(e) {
  const t = (e?.mapValue?.fields || {}).__type__?.stringValue;
  return "server_timestamp" === t;
}
__name(__PRIVATE_isServerTimestamp, "__PRIVATE_isServerTimestamp");
function __PRIVATE_getPreviousValue(e) {
  const t = e.mapValue.fields.__previous_value__;
  return __PRIVATE_isServerTimestamp(t) ? __PRIVATE_getPreviousValue(t) : t;
}
__name(__PRIVATE_getPreviousValue, "__PRIVATE_getPreviousValue");
function __PRIVATE_getLocalWriteTime(e) {
  const t = __PRIVATE_normalizeTimestamp(
    e.mapValue.fields.__local_write_time__.timestampValue,
  );
  return new Timestamp(t.seconds, t.nanos);
}
__name(__PRIVATE_getLocalWriteTime, "__PRIVATE_getLocalWriteTime");
var b = "__type__";
var D = "__max__";
var S = "__vector__";
var C = "value";
function __PRIVATE_typeOrder(e) {
  return "nullValue" in e
    ? 0
    : "booleanValue" in e
      ? 1
      : "integerValue" in e || "doubleValue" in e
        ? 2
        : "timestampValue" in e
          ? 3
          : "stringValue" in e
            ? 5
            : "bytesValue" in e
              ? 6
              : "referenceValue" in e
                ? 7
                : "geoPointValue" in e
                  ? 8
                  : "arrayValue" in e
                    ? 9
                    : "mapValue" in e
                      ? __PRIVATE_isServerTimestamp(e)
                        ? 4
                        : /** Returns true if the Value represents the canonical {@link #MAX_VALUE} . */
                          /* @__PURE__ */ __name(function __PRIVATE_isMaxValue(
                              e2,
                            ) {
                              return (
                                (
                                  ((e2.mapValue || {}).fields || {}).__type__ ||
                                  {}
                                ).stringValue === D
                              );
                            }, "__PRIVATE_isMaxValue")(e)
                          ? 9007199254740991
                          : /** Returns true if `value` is a VetorValue. */
                            /* @__PURE__ */ __name(
                                function __PRIVATE_isVectorValue(e2) {
                                  const t = (e2?.mapValue?.fields || {})[b]
                                    ?.stringValue;
                                  return t === S;
                                },
                                "__PRIVATE_isVectorValue",
                              )(e)
                            ? 10
                            : 11
                      : fail(28295, {
                          value: e,
                        });
}
__name(__PRIVATE_typeOrder, "__PRIVATE_typeOrder");
function __PRIVATE_valueEquals(e, t, r) {
  if (e === t) return true;
  const n = __PRIVATE_typeOrder(e);
  if (n !== __PRIVATE_typeOrder(t)) return false;
  switch (n) {
    case 0:
    case 9007199254740991:
      return true;
    case 1:
      return e.booleanValue === t.booleanValue;
    case 4:
      return __PRIVATE_getLocalWriteTime(e).isEqual(
        __PRIVATE_getLocalWriteTime(t),
      );
    case 3:
      return /* @__PURE__ */ __name(function __PRIVATE_timestampEquals(e2, t2) {
        if (
          "string" == typeof e2.timestampValue &&
          "string" == typeof t2.timestampValue &&
          e2.timestampValue.length === t2.timestampValue.length
        )
          return e2.timestampValue === t2.timestampValue;
        const r2 = __PRIVATE_normalizeTimestamp(e2.timestampValue),
          n2 = __PRIVATE_normalizeTimestamp(t2.timestampValue);
        return r2.seconds === n2.seconds && r2.nanos === n2.nanos;
      }, "__PRIVATE_timestampEquals")(e, t);
    case 5:
      return e.stringValue === t.stringValue;
    case 6:
      return /* @__PURE__ */ __name(function __PRIVATE_blobEquals(e2, t2) {
        return __PRIVATE_normalizeByteString(e2.bytesValue).isEqual(
          __PRIVATE_normalizeByteString(t2.bytesValue),
        );
      }, "__PRIVATE_blobEquals")(e, t);
    case 7:
      return e.referenceValue === t.referenceValue;
    case 8:
      return /* @__PURE__ */ __name(function __PRIVATE_geoPointEquals(e2, t2) {
        return (
          __PRIVATE_normalizeNumber(e2.geoPointValue.latitude) ===
            __PRIVATE_normalizeNumber(t2.geoPointValue.latitude) &&
          __PRIVATE_normalizeNumber(e2.geoPointValue.longitude) ===
            __PRIVATE_normalizeNumber(t2.geoPointValue.longitude)
        );
      }, "__PRIVATE_geoPointEquals")(e, t);
    case 2:
      return /* @__PURE__ */ __name(function __PRIVATE_numberEquals(
        e2,
        t2,
        r2,
      ) {
        if ("integerValue" in e2 && "integerValue" in t2)
          return (
            __PRIVATE_normalizeNumber(e2.integerValue) ===
            __PRIVATE_normalizeNumber(t2.integerValue)
          );
        let n2, i;
        if ("doubleValue" in e2 && "doubleValue" in t2)
          ((n2 = __PRIVATE_normalizeNumber(e2.doubleValue)),
            (i = __PRIVATE_normalizeNumber(t2.doubleValue)));
        else {
          if (!r2?.S) return false;
          ((n2 = __PRIVATE_normalizeNumber(e2.integerValue ?? e2.doubleValue)),
            (i = __PRIVATE_normalizeNumber(t2.integerValue ?? t2.doubleValue)));
        }
        if (n2 === i)
          return (
            !!r2?.C ||
            __PRIVATE_isNegativeZero(n2) === __PRIVATE_isNegativeZero(i)
          );
        return !!(void 0 === r2 || r2.O) && isNaN(n2) && isNaN(i);
      }, "__PRIVATE_numberEquals")(e, t, r);
    case 9:
      return __PRIVATE_arrayEquals(
        e.arrayValue.values || [],
        t.arrayValue.values || [],
        (e2, t2) => __PRIVATE_valueEquals(e2, t2, r),
      );
    case 10:
    case 11:
      return /* @__PURE__ */ __name(function __PRIVATE_objectEquals(
        e2,
        t2,
        r2,
      ) {
        const n2 = e2.mapValue.fields || {},
          i = t2.mapValue.fields || {};
        if (__PRIVATE_objectSize(n2) !== __PRIVATE_objectSize(i)) return false;
        for (const e3 in n2)
          if (
            n2.hasOwnProperty(e3) &&
            (void 0 === i[e3] || !__PRIVATE_valueEquals(n2[e3], i[e3], r2))
          )
            return false;
        return true;
      }, "__PRIVATE_objectEquals")(e, t, r);
    default:
      return fail(52216, {
        left: e,
      });
  }
}
__name(__PRIVATE_valueEquals, "__PRIVATE_valueEquals");
function __PRIVATE_isMapValue(e) {
  return !!e && "mapValue" in e;
}
__name(__PRIVATE_isMapValue, "__PRIVATE_isMapValue");
function __PRIVATE_deepClone(e) {
  if (e.geoPointValue)
    return {
      geoPointValue: {
        ...e.geoPointValue,
      },
    };
  if (e.timestampValue && "object" == typeof e.timestampValue)
    return {
      timestampValue: {
        ...e.timestampValue,
      },
    };
  if (e.mapValue) {
    const t = {
      mapValue: {
        fields: {},
      },
    };
    return (
      forEach(
        e.mapValue.fields,
        (e2, r) => (t.mapValue.fields[e2] = __PRIVATE_deepClone(r)),
      ),
      t
    );
  }
  if (e.arrayValue) {
    const t = {
      arrayValue: {
        values: [],
      },
    };
    for (let r = 0; r < (e.arrayValue.values || []).length; ++r)
      t.arrayValue.values[r] = __PRIVATE_deepClone(e.arrayValue.values[r]);
    return t;
  }
  return {
    ...e,
  };
}
__name(__PRIVATE_deepClone, "__PRIVATE_deepClone");
var SnapshotVersion = class _SnapshotVersion {
  static {
    __name(this, "SnapshotVersion");
  }
  static fromTimestamp(e) {
    return new _SnapshotVersion(e);
  }
  static min() {
    return new _SnapshotVersion(new Timestamp(0, 0));
  }
  static max() {
    return new _SnapshotVersion(new Timestamp(253402300799, 999999999));
  }
  constructor(e) {
    this.timestamp = e;
  }
  compareTo(e) {
    return this.timestamp._compareTo(e.timestamp);
  }
  isEqual(e) {
    return this.timestamp.isEqual(e.timestamp);
  }
  /** Returns a number representation of the version for use in spec tests. */
  toMicroseconds() {
    return 1e6 * this.timestamp.seconds + this.timestamp.nanoseconds / 1e3;
  }
  toString() {
    return "SnapshotVersion(" + this.timestamp.toString() + ")";
  }
  toTimestamp() {
    return this.timestamp;
  }
};
var SortedMap = class _SortedMap {
  static {
    __name(this, "SortedMap");
  }
  constructor(e, t) {
    ((this.comparator = e), (this.root = t || LLRBNode.EMPTY));
  }
  // Returns a copy of the map, with the specified key/value added or replaced.
  insert(e, t) {
    return new _SortedMap(
      this.comparator,
      this.root
        .insert(e, t, this.comparator)
        .copy(null, null, LLRBNode.BLACK, null, null),
    );
  }
  // Returns a copy of the map, with the specified key removed.
  remove(e) {
    return new _SortedMap(
      this.comparator,
      this.root
        .remove(e, this.comparator)
        .copy(null, null, LLRBNode.BLACK, null, null),
    );
  }
  // Returns the value of the node with the given key, or null.
  get(e) {
    let t = this.root;
    for (; !t.isEmpty();) {
      const r = this.comparator(e, t.key);
      if (0 === r) return t.value;
      r < 0 ? (t = t.left) : r > 0 && (t = t.right);
    }
    return null;
  }
  // Returns the index of the element in this sorted map, or -1 if it doesn't
  // exist.
  indexOf(e) {
    let t = 0,
      r = this.root;
    for (; !r.isEmpty();) {
      const n = this.comparator(e, r.key);
      if (0 === n) return t + r.left.size;
      n < 0
        ? (r = r.left)
        : // Count all nodes left of the node plus the node itself
          ((t += r.left.size + 1), (r = r.right));
    }
    return -1;
  }
  isEmpty() {
    return this.root.isEmpty();
  }
  // Returns the total number of nodes in the map.
  get size() {
    return this.root.size;
  }
  // Returns the minimum key in the map.
  minKey() {
    return this.root.minKey();
  }
  // Returns the maximum key in the map.
  maxKey() {
    return this.root.maxKey();
  }
  // Traverses the map in key order and calls the specified action function
  // for each key/value pair. If action returns true, traversal is aborted.
  // Returns the first truthy value returned by action, or the last falsey
  // value returned by action.
  inorderTraversal(e) {
    return this.root.inorderTraversal(e);
  }
  forEach(e) {
    this.inorderTraversal((t, r) => (e(t, r), false));
  }
  toString() {
    const e = [];
    return (
      this.inorderTraversal((t, r) => (e.push(`${t}:${r}`), false)),
      `{${e.join(", ")}}`
    );
  }
  // Traverses the map in reverse key order and calls the specified action
  // function for each key/value pair. If action returns true, traversal is
  // aborted.
  // Returns the first truthy value returned by action, or the last falsey
  // value returned by action.
  reverseTraversal(e) {
    return this.root.reverseTraversal(e);
  }
  // Returns an iterator over the SortedMap.
  getIterator() {
    return new SortedMapIterator(this.root, null, this.comparator, false);
  }
  getIteratorFrom(e) {
    return new SortedMapIterator(this.root, e, this.comparator, false);
  }
  getReverseIterator() {
    return new SortedMapIterator(this.root, null, this.comparator, true);
  }
  getReverseIteratorFrom(e) {
    return new SortedMapIterator(this.root, e, this.comparator, true);
  }
};
var SortedMapIterator = class {
  static {
    __name(this, "SortedMapIterator");
  }
  constructor(e, t, r, n) {
    ((this.isReverse = n), (this.nodeStack = []));
    let i = 1;
    for (; !e.isEmpty();)
      if (
        ((i = t ? r(e.key, t) : 1), // flip the comparison if we're going in reverse
        t && n && (i *= -1),
        i < 0)
      )
        e = this.isReverse ? e.left : e.right;
      else {
        if (0 === i) {
          this.nodeStack.push(e);
          break;
        }
        (this.nodeStack.push(e), (e = this.isReverse ? e.right : e.left));
      }
  }
  getNext() {
    let e = this.nodeStack.pop();
    const t = {
      key: e.key,
      value: e.value,
    };
    if (this.isReverse)
      for (e = e.left; !e.isEmpty();) (this.nodeStack.push(e), (e = e.right));
    else
      for (e = e.right; !e.isEmpty();) (this.nodeStack.push(e), (e = e.left));
    return t;
  }
  hasNext() {
    return this.nodeStack.length > 0;
  }
  peek() {
    if (0 === this.nodeStack.length) return null;
    const e = this.nodeStack[this.nodeStack.length - 1];
    return {
      key: e.key,
      value: e.value,
    };
  }
};
var LLRBNode = class _LLRBNode {
  static {
    __name(this, "LLRBNode");
  }
  constructor(e, t, r, n, i) {
    ((this.key = e),
      (this.value = t),
      (this.color = null != r ? r : _LLRBNode.RED),
      (this.left = null != n ? n : _LLRBNode.EMPTY),
      (this.right = null != i ? i : _LLRBNode.EMPTY),
      (this.size = this.left.size + 1 + this.right.size));
  }
  // Returns a copy of the current node, optionally replacing pieces of it.
  copy(e, t, r, n, i) {
    return new _LLRBNode(
      null != e ? e : this.key,
      null != t ? t : this.value,
      null != r ? r : this.color,
      null != n ? n : this.left,
      null != i ? i : this.right,
    );
  }
  isEmpty() {
    return false;
  }
  // Traverses the tree in key order and calls the specified action function
  // for each node. If action returns true, traversal is aborted.
  // Returns the first truthy value returned by action, or the last falsey
  // value returned by action.
  inorderTraversal(e) {
    return (
      this.left.inorderTraversal(e) ||
      e(this.key, this.value) ||
      this.right.inorderTraversal(e)
    );
  }
  // Traverses the tree in reverse key order and calls the specified action
  // function for each node. If action returns true, traversal is aborted.
  // Returns the first truthy value returned by action, or the last falsey
  // value returned by action.
  reverseTraversal(e) {
    return (
      this.right.reverseTraversal(e) ||
      e(this.key, this.value) ||
      this.left.reverseTraversal(e)
    );
  }
  // Returns the minimum node in the tree.
  min() {
    return this.left.isEmpty() ? this : this.left.min();
  }
  // Returns the maximum key in the tree.
  minKey() {
    return this.min().key;
  }
  // Returns the maximum key in the tree.
  maxKey() {
    return this.right.isEmpty() ? this.key : this.right.maxKey();
  }
  // Returns new tree, with the key/value added.
  insert(e, t, r) {
    let n = this;
    const i = r(e, n.key);
    return (
      (n =
        i < 0
          ? n.copy(null, null, null, n.left.insert(e, t, r), null)
          : 0 === i
            ? n.copy(null, t, null, null, null)
            : n.copy(null, null, null, null, n.right.insert(e, t, r))),
      n.fixUp()
    );
  }
  removeMin() {
    if (this.left.isEmpty()) return _LLRBNode.EMPTY;
    let e = this;
    return (
      e.left.isRed() || e.left.left.isRed() || (e = e.moveRedLeft()),
      (e = e.copy(null, null, null, e.left.removeMin(), null)),
      e.fixUp()
    );
  }
  // Returns new tree, with the specified item removed.
  remove(e, t) {
    let r,
      n = this;
    if (t(e, n.key) < 0)
      (n.left.isEmpty() ||
        n.left.isRed() ||
        n.left.left.isRed() ||
        (n = n.moveRedLeft()),
        (n = n.copy(null, null, null, n.left.remove(e, t), null)));
    else {
      if (
        (n.left.isRed() && (n = n.rotateRight()),
        n.right.isEmpty() ||
          n.right.isRed() ||
          n.right.left.isRed() ||
          (n = n.moveRedRight()),
        0 === t(e, n.key))
      ) {
        if (n.right.isEmpty()) return _LLRBNode.EMPTY;
        ((r = n.right.min()),
          (n = n.copy(r.key, r.value, null, null, n.right.removeMin())));
      }
      n = n.copy(null, null, null, null, n.right.remove(e, t));
    }
    return n.fixUp();
  }
  isRed() {
    return this.color;
  }
  // Returns new tree after performing any needed rotations.
  fixUp() {
    let e = this;
    return (
      e.right.isRed() && !e.left.isRed() && (e = e.rotateLeft()),
      e.left.isRed() && e.left.left.isRed() && (e = e.rotateRight()),
      e.left.isRed() && e.right.isRed() && (e = e.colorFlip()),
      e
    );
  }
  moveRedLeft() {
    let e = this.colorFlip();
    return (
      e.right.left.isRed() &&
        ((e = e.copy(null, null, null, null, e.right.rotateRight())),
        (e = e.rotateLeft()),
        (e = e.colorFlip())),
      e
    );
  }
  moveRedRight() {
    let e = this.colorFlip();
    return (
      e.left.left.isRed() && ((e = e.rotateRight()), (e = e.colorFlip())),
      e
    );
  }
  rotateLeft() {
    const e = this.copy(null, null, _LLRBNode.RED, null, this.right.left);
    return this.right.copy(null, null, this.color, e, null);
  }
  rotateRight() {
    const e = this.copy(null, null, _LLRBNode.RED, this.left.right, null);
    return this.left.copy(null, null, this.color, null, e);
  }
  colorFlip() {
    const e = this.left.copy(null, null, !this.left.color, null, null),
      t = this.right.copy(null, null, !this.right.color, null, null);
    return this.copy(null, null, !this.color, e, t);
  }
  // For testing.
  checkMaxDepth() {
    const e = this.check();
    return Math.pow(2, e) <= this.size + 1;
  }
  // In a balanced RB tree, the black-depth (number of black nodes) from root to
  // leaves is equal on both sides.  This function verifies that or asserts.
  check() {
    if (this.isRed() && this.left.isRed())
      throw fail(43730, {
        key: this.key,
        value: this.value,
      });
    if (this.right.isRed())
      throw fail(14113, {
        key: this.key,
        value: this.value,
      });
    const e = this.left.check();
    if (e !== this.right.check()) throw fail(27949);
    return e + (this.isRed() ? 0 : 1);
  }
};
((LLRBNode.EMPTY = null), (LLRBNode.RED = true), (LLRBNode.BLACK = false));
LLRBNode.EMPTY =
  new // Represents an empty node (a leaf node in the Red-Black Tree).
  (class LLRBEmptyNode {
    static {
      __name(this, "LLRBEmptyNode");
    }
    constructor() {
      this.size = 0;
    }
    get key() {
      throw fail(57766);
    }
    get value() {
      throw fail(16141);
    }
    get color() {
      throw fail(16727);
    }
    get left() {
      throw fail(29726);
    }
    get right() {
      throw fail(36894);
    }
    // Returns a copy of the current node.
    copy(e, t, r, n, i) {
      return this;
    }
    // Returns a copy of the tree, with the specified key/value added.
    insert(e, t, r) {
      return new LLRBNode(e, t);
    }
    // Returns a copy of the tree, with the specified key removed.
    remove(e, t) {
      return this;
    }
    isEmpty() {
      return true;
    }
    inorderTraversal(e) {
      return false;
    }
    reverseTraversal(e) {
      return false;
    }
    minKey() {
      return null;
    }
    maxKey() {
      return null;
    }
    isRed() {
      return false;
    }
    // For testing.
    checkMaxDepth() {
      return true;
    }
    check() {
      return 0;
    }
  })();
var SortedSet = class _SortedSet {
  static {
    __name(this, "SortedSet");
  }
  constructor(e) {
    ((this.comparator = e), (this.data = new SortedMap(this.comparator)));
  }
  has(e) {
    return null !== this.data.get(e);
  }
  first() {
    return this.data.minKey();
  }
  last() {
    return this.data.maxKey();
  }
  get size() {
    return this.data.size;
  }
  indexOf(e) {
    return this.data.indexOf(e);
  }
  /** Iterates elements in order defined by "comparator" */
  forEach(e) {
    this.data.inorderTraversal((t, r) => (e(t), false));
  }
  /** Iterates over `elem`s such that: range[0] &lt;= elem &lt; range[1]. */
  forEachInRange(e, t) {
    const r = this.data.getIteratorFrom(e[0]);
    for (; r.hasNext();) {
      const n = r.getNext();
      if (this.comparator(n.key, e[1]) >= 0) return;
      t(n.key);
    }
  }
  /**
   * Iterates over `elem`s such that: start &lt;= elem until false is returned.
   */
  forEachWhile(e, t) {
    let r;
    for (
      r = void 0 !== t ? this.data.getIteratorFrom(t) : this.data.getIterator();
      r.hasNext();
    ) {
      if (!e(r.getNext().key)) return;
    }
  }
  /** Finds the least element greater than or equal to `elem`. */
  firstAfterOrEqual(e) {
    const t = this.data.getIteratorFrom(e);
    return t.hasNext() ? t.getNext().key : null;
  }
  getIterator() {
    return new SortedSetIterator(this.data.getIterator());
  }
  getIteratorFrom(e) {
    return new SortedSetIterator(this.data.getIteratorFrom(e));
  }
  /** Inserts or updates an element */
  add(e) {
    return this.copy(this.data.remove(e).insert(e, true));
  }
  /** Deletes an element */
  delete(e) {
    return this.has(e) ? this.copy(this.data.remove(e)) : this;
  }
  isEmpty() {
    return this.data.isEmpty();
  }
  unionWith(e) {
    let t = this;
    return (
      t.size < e.size && ((t = e), (e = this)),
      e.forEach((e2) => {
        t = t.add(e2);
      }),
      t
    );
  }
  isEqual(e) {
    if (!(e instanceof _SortedSet)) return false;
    if (this.size !== e.size) return false;
    const t = this.data.getIterator(),
      r = e.data.getIterator();
    for (; t.hasNext();) {
      const e2 = t.getNext().key,
        n = r.getNext().key;
      if (0 !== this.comparator(e2, n)) return false;
    }
    return true;
  }
  toArray() {
    const e = [];
    return (
      this.forEach((t) => {
        e.push(t);
      }),
      e
    );
  }
  toString() {
    const e = [];
    return (this.forEach((t) => e.push(t)), "SortedSet(" + e.toString() + ")");
  }
  copy(e) {
    const t = new _SortedSet(this.comparator);
    return ((t.data = e), t);
  }
};
var SortedSetIterator = class {
  static {
    __name(this, "SortedSetIterator");
  }
  constructor(e) {
    this.iter = e;
  }
  getNext() {
    return this.iter.getNext().key;
  }
  hasNext() {
    return this.iter.hasNext();
  }
};
var FieldMask = class _FieldMask {
  static {
    __name(this, "FieldMask");
  }
  constructor(e) {
    ((this.fields = e), // TODO(dimond): validation of FieldMask
      // Sort the field mask to support `FieldMask.isEqual()` and assert below.
      e.sort(FieldPath$1.comparator));
  }
  static empty() {
    return new _FieldMask([]);
  }
  /**
   * Returns a new FieldMask object that is the result of adding all the given
   * fields paths to this field mask.
   */
  unionWith(e) {
    let t = new SortedSet(FieldPath$1.comparator);
    for (const e2 of this.fields) t = t.add(e2);
    for (const r of e) t = t.add(r);
    return new _FieldMask(t.toArray());
  }
  /**
   * Verifies that `fieldPath` is included by at least one field in this field
   * mask.
   *
   * This is an O(n) operation, where `n` is the size of the field mask.
   */
  covers(e) {
    for (const t of this.fields) if (t.isPrefixOf(e)) return true;
    return false;
  }
  isEqual(e) {
    return __PRIVATE_arrayEquals(this.fields, e.fields, (e2, t) =>
      e2.isEqual(t),
    );
  }
};
var ObjectValue = class _ObjectValue {
  static {
    __name(this, "ObjectValue");
  }
  constructor(e) {
    this.value = e;
  }
  static empty() {
    return new _ObjectValue({
      mapValue: {},
    });
  }
  /**
   * Returns the value at the given path or null.
   *
   * @param path - the path to search
   * @returns The value at the path or null if the path is not set.
   */
  field(e) {
    if (e.isEmpty()) return this.value;
    {
      let t = this.value;
      for (let r = 0; r < e.length - 1; ++r)
        if (
          ((t = (t.mapValue.fields || {})[e.get(r)]), !__PRIVATE_isMapValue(t))
        )
          return null;
      return ((t = (t.mapValue.fields || {})[e.lastSegment()]), t || null);
    }
  }
  /**
   * Sets the field to the provided value.
   *
   * @param path - The field path to set.
   * @param value - The value to set.
   */
  set(e, t) {
    this.getFieldsMap(e.popLast())[e.lastSegment()] = __PRIVATE_deepClone(t);
  }
  /**
   * Sets the provided fields to the provided values.
   *
   * @param data - A map of fields to values (or null for deletes).
   */
  setAll(e) {
    let t = FieldPath$1.emptyPath(),
      r = {},
      n = [];
    e.forEach((e2, i2) => {
      if (!t.isImmediateParentOf(i2)) {
        const e3 = this.getFieldsMap(t);
        (this.applyChanges(e3, r, n), (r = {}), (n = []), (t = i2.popLast()));
      }
      e2
        ? (r[i2.lastSegment()] = __PRIVATE_deepClone(e2))
        : n.push(i2.lastSegment());
    });
    const i = this.getFieldsMap(t);
    this.applyChanges(i, r, n);
  }
  /**
   * Removes the field at the specified path. If there is no field at the
   * specified path, nothing is changed.
   *
   * @param path - The field path to remove.
   */
  delete(e) {
    const t = this.field(e.popLast());
    __PRIVATE_isMapValue(t) &&
      t.mapValue.fields &&
      delete t.mapValue.fields[e.lastSegment()];
  }
  isEqual(e) {
    return __PRIVATE_valueEquals(this.value, e.value);
  }
  /**
   * Returns the map that contains the leaf element of `path`. If the parent
   * entry does not yet exist, or if it is not a map, a new map will be created.
   */
  getFieldsMap(e) {
    let t = this.value;
    t.mapValue.fields ||
      (t.mapValue = {
        fields: {},
      });
    for (let r = 0; r < e.length; ++r) {
      let n = t.mapValue.fields[e.get(r)];
      ((__PRIVATE_isMapValue(n) && n.mapValue.fields) ||
        ((n = {
          mapValue: {
            fields: {},
          },
        }),
        (t.mapValue.fields[e.get(r)] = n)),
        (t = n));
    }
    return t.mapValue.fields;
  }
  /**
   * Modifies `fieldsMap` by adding, replacing or deleting the specified
   * entries.
   */
  applyChanges(e, t, r) {
    forEach(t, (t2, r2) => (e[t2] = r2));
    for (const t2 of r) delete e[t2];
  }
  clone() {
    return new _ObjectValue(__PRIVATE_deepClone(this.value));
  }
};
var MutableDocument = class _MutableDocument {
  static {
    __name(this, "MutableDocument");
  }
  constructor(e, t, r, n, i, s, o) {
    ((this.key = e),
      (this.documentType = t),
      (this.version = r),
      (this.readTime = n),
      (this.createTime = i),
      (this.data = s),
      (this.documentState = o));
  }
  /**
   * Creates a document with no known version or data, but which can serve as
   * base document for mutations.
   */
  static newInvalidDocument(e) {
    return new _MutableDocument(
      e,
      0,
      /* version */
      SnapshotVersion.min(),
      /* readTime */
      SnapshotVersion.min(),
      /* createTime */
      SnapshotVersion.min(),
      ObjectValue.empty(),
      0,
      /* DocumentState.SYNCED */
    );
  }
  /**
   * Creates a new document that is known to exist with the given data at the
   * given version.
   */
  static newFoundDocument(e, t, r, n) {
    return new _MutableDocument(
      e,
      1,
      /* version */
      t,
      /* readTime */
      SnapshotVersion.min(),
      /* createTime */
      r,
      n,
      0,
      /* DocumentState.SYNCED */
    );
  }
  /** Creates a new document that is known to not exist at the given version. */
  static newNoDocument(e, t) {
    return new _MutableDocument(
      e,
      2,
      /* version */
      t,
      /* readTime */
      SnapshotVersion.min(),
      /* createTime */
      SnapshotVersion.min(),
      ObjectValue.empty(),
      0,
      /* DocumentState.SYNCED */
    );
  }
  /**
   * Creates a new document that is known to exist at the given version but
   * whose data is not known (e.g. a document that was updated without a known
   * base document).
   */
  static newUnknownDocument(e, t) {
    return new _MutableDocument(
      e,
      3,
      /* version */
      t,
      /* readTime */
      SnapshotVersion.min(),
      /* createTime */
      SnapshotVersion.min(),
      ObjectValue.empty(),
      2,
      /* DocumentState.HAS_COMMITTED_MUTATIONS */
    );
  }
  /**
   * Changes the document type to indicate that it exists and that its version
   * and data are known.
   */
  convertToFoundDocument(e, t) {
    return (
      !this.createTime.isEqual(SnapshotVersion.min()) ||
        (2 !== this.documentType && 0 !== this.documentType) ||
        (this.createTime = e),
      (this.version = e),
      (this.documentType = 1),
      (this.data = t),
      (this.documentState = 0),
      this
    );
  }
  /**
   * Changes the document type to indicate that it doesn't exist at the given
   * version.
   */
  convertToNoDocument(e) {
    return (
      (this.version = e),
      (this.documentType = 2),
      (this.data = ObjectValue.empty()),
      (this.documentState = 0),
      this
    );
  }
  /**
   * Changes the document type to indicate that it exists at a given version but
   * that its data is not known (e.g. a document that was updated without a known
   * base document).
   */
  convertToUnknownDocument(e) {
    return (
      (this.version = e),
      (this.documentType = 3),
      (this.data = ObjectValue.empty()),
      (this.documentState = 2),
      this
    );
  }
  setHasCommittedMutations() {
    return ((this.documentState = 2), this);
  }
  setHasLocalMutations() {
    return (
      (this.documentState = 1),
      (this.version = SnapshotVersion.min()),
      this
    );
  }
  setReadTime(e) {
    return ((this.readTime = e), this);
  }
  get hasLocalMutations() {
    return 1 === this.documentState;
  }
  get hasCommittedMutations() {
    return 2 === this.documentState;
  }
  get hasPendingWrites() {
    return this.hasLocalMutations || this.hasCommittedMutations;
  }
  isValidDocument() {
    return 0 !== this.documentType;
  }
  isFoundDocument() {
    return 1 === this.documentType;
  }
  isNoDocument() {
    return 2 === this.documentType;
  }
  isUnknownDocument() {
    return 3 === this.documentType;
  }
  isEqual(e) {
    return (
      e instanceof _MutableDocument &&
      this.key.isEqual(e.key) &&
      this.version.isEqual(e.version) &&
      this.documentType === e.documentType &&
      this.documentState === e.documentState &&
      this.data.isEqual(e.data)
    );
  }
  mutableCopy() {
    return new _MutableDocument(
      this.key,
      this.documentType,
      this.version,
      this.readTime,
      this.createTime,
      this.data.clone(),
      this.documentState,
    );
  }
  toString() {
    return `Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`;
  }
};
var __PRIVATE_QueryImpl = class {
  static {
    __name(this, "__PRIVATE_QueryImpl");
  }
  /**
   * Initializes a Query with a path and optional additional query constraints.
   * Path must currently be empty if this is a collection group query.
   */
  constructor(
    e,
    t = null,
    r = [],
    n = [],
    i = null,
    s = "F",
    o = null,
    a = null,
  ) {
    ((this.path = e),
      (this.collectionGroup = t),
      (this.explicitOrderBy = r),
      (this.filters = n),
      (this.limit = i),
      (this.limitType = s),
      (this.startAt = o),
      (this.endAt = a),
      (this.B = null), // The corresponding `Target` of this `Query` instance, for use with
      // non-aggregate queries.
      (this.M = null), // The corresponding `Target` of this `Query` instance, for use with
      // aggregate queries. Unlike targets for non-aggregate queries,
      // aggregate query targets do not contain normalized order-bys, they only
      // contain explicit order-bys.
      (this.U = null),
      this.startAt,
      this.endAt);
  }
};
function __PRIVATE_toDouble(e, t) {
  if (e.useProto3Json) {
    if (isNaN(t))
      return {
        doubleValue: "NaN",
      };
    if (t === 1 / 0)
      return {
        doubleValue: "Infinity",
      };
    if (t === -1 / 0)
      return {
        doubleValue: "-Infinity",
      };
  }
  return {
    doubleValue: __PRIVATE_isNegativeZero(t) ? "-0" : t,
  };
}
__name(__PRIVATE_toDouble, "__PRIVATE_toDouble");
function __PRIVATE_toInteger(e) {
  return {
    integerValue: "" + e,
  };
}
__name(__PRIVATE_toInteger, "__PRIVATE_toInteger");
function toNumber(e, t, r) {
  return (Number.isInteger(t) && r?.preferIntegers) ||
    /* @__PURE__ */ __name(function isSafeInteger(e2) {
      return (
        "number" == typeof e2 &&
        Number.isInteger(e2) &&
        !__PRIVATE_isNegativeZero(e2) &&
        e2 <= Number.MAX_SAFE_INTEGER &&
        e2 >= Number.MIN_SAFE_INTEGER
      );
    }, "isSafeInteger")(t)
    ? __PRIVATE_toInteger(t)
    : __PRIVATE_toDouble(e, t);
}
__name(toNumber, "toNumber");
var TransformOperation = class {
  static {
    __name(this, "TransformOperation");
  }
  constructor() {
    this._ = void 0;
  }
};
var __PRIVATE_ServerTimestampTransform = class extends TransformOperation {
  static {
    __name(this, "__PRIVATE_ServerTimestampTransform");
  }
};
var __PRIVATE_ArrayUnionTransformOperation = class extends TransformOperation {
  static {
    __name(this, "__PRIVATE_ArrayUnionTransformOperation");
  }
  constructor(e) {
    (super(), (this.elements = e));
  }
};
var __PRIVATE_ArrayRemoveTransformOperation = class extends TransformOperation {
  static {
    __name(this, "__PRIVATE_ArrayRemoveTransformOperation");
  }
  constructor(e) {
    (super(), (this.elements = e));
  }
};
var __PRIVATE_NumericTransformOperation = class extends TransformOperation {
  static {
    __name(this, "__PRIVATE_NumericTransformOperation");
  }
  constructor(e, t) {
    (super(), (this.serializer = e), (this.k = t));
  }
};
var __PRIVATE_NumericIncrementTransformOperation = class extends __PRIVATE_NumericTransformOperation {
  static {
    __name(this, "__PRIVATE_NumericIncrementTransformOperation");
  }
};
var __PRIVATE_NumericMinimumTransformOperation = class extends __PRIVATE_NumericTransformOperation {
  static {
    __name(this, "__PRIVATE_NumericMinimumTransformOperation");
  }
};
var __PRIVATE_NumericMaximumTransformOperation = class extends __PRIVATE_NumericTransformOperation {
  static {
    __name(this, "__PRIVATE_NumericMaximumTransformOperation");
  }
};
var Precondition = class _Precondition {
  static {
    __name(this, "Precondition");
  }
  constructor(e, t) {
    ((this.updateTime = e), (this.exists = t));
  }
  /** Creates a new empty Precondition. */
  static none() {
    return new _Precondition();
  }
  /** Creates a new Precondition with an exists flag. */
  static exists(e) {
    return new _Precondition(void 0, e);
  }
  /** Creates a new Precondition based on a version a document exists at. */
  static updateTime(e) {
    return new _Precondition(e);
  }
  /** Returns whether this Precondition is empty. */
  get isNone() {
    return void 0 === this.updateTime && void 0 === this.exists;
  }
  isEqual(e) {
    return (
      this.exists === e.exists &&
      (this.updateTime
        ? !!e.updateTime && this.updateTime.isEqual(e.updateTime)
        : !e.updateTime)
    );
  }
};
var Mutation = class {
  static {
    __name(this, "Mutation");
  }
};
var __PRIVATE_SetMutation = class extends Mutation {
  static {
    __name(this, "__PRIVATE_SetMutation");
  }
  constructor(e, t, r, n = []) {
    (super(),
      (this.key = e),
      (this.value = t),
      (this.precondition = r),
      (this.fieldTransforms = n),
      (this.type = 0));
  }
  getFieldMask() {
    return null;
  }
};
var __PRIVATE_PatchMutation = class extends Mutation {
  static {
    __name(this, "__PRIVATE_PatchMutation");
  }
  constructor(e, t, r, n, i = []) {
    (super(),
      (this.key = e),
      (this.data = t),
      (this.fieldMask = r),
      (this.precondition = n),
      (this.fieldTransforms = i),
      (this.type = 1));
  }
  getFieldMask() {
    return this.fieldMask;
  }
};
var __PRIVATE_DeleteMutation = class extends Mutation {
  static {
    __name(this, "__PRIVATE_DeleteMutation");
  }
  constructor(e, t) {
    (super(),
      (this.key = e),
      (this.precondition = t),
      (this.type = 2),
      (this.fieldTransforms = []));
  }
  getFieldMask() {
    return null;
  }
};
var __PRIVATE_VerifyMutation = class extends Mutation {
  static {
    __name(this, "__PRIVATE_VerifyMutation");
  }
  constructor(e, t) {
    (super(),
      (this.key = e),
      (this.precondition = t),
      (this.type = 3),
      (this.fieldTransforms = []));
  }
  getFieldMask() {
    return null;
  }
};
var JsonProtoSerializer = class {
  static {
    __name(this, "JsonProtoSerializer");
  }
  constructor(e, t) {
    ((this.databaseId = e), (this.useProto3Json = t));
  }
};
function toTimestamp(e, t) {
  if (e.useProto3Json) {
    return `${new Date(1e3 * t.seconds).toISOString().replace(/\.\d*/, "").replace("Z", "")}.${("000000000" + t.nanoseconds).slice(-9)}Z`;
  }
  return {
    seconds: "" + t.seconds,
    nanos: t.nanoseconds,
  };
}
__name(toTimestamp, "toTimestamp");
function __PRIVATE_toBytes(e, t) {
  return e.useProto3Json ? t.toBase64() : t.toUint8Array();
}
__name(__PRIVATE_toBytes, "__PRIVATE_toBytes");
function __PRIVATE_toVersion(e, t) {
  return toTimestamp(e, t.toTimestamp());
}
__name(__PRIVATE_toVersion, "__PRIVATE_toVersion");
function __PRIVATE_fromVersion(e) {
  return (
    __PRIVATE_hardAssert(!!e, 49232),
    SnapshotVersion.fromTimestamp(
      /* @__PURE__ */ __name(function fromTimestamp(e2) {
        const t = __PRIVATE_normalizeTimestamp(e2);
        return new Timestamp(t.seconds, t.nanos);
      }, "fromTimestamp")(e),
    )
  );
}
__name(__PRIVATE_fromVersion, "__PRIVATE_fromVersion");
function __PRIVATE_toResourceName(e, t) {
  return __PRIVATE_toResourcePath(e, t).canonicalString();
}
__name(__PRIVATE_toResourceName, "__PRIVATE_toResourceName");
function __PRIVATE_toResourcePath(e, t) {
  const r = /* @__PURE__ */ __name(function __PRIVATE_fullyQualifiedPrefixPath(
    e2,
  ) {
    return new ResourcePath([
      "projects",
      e2.projectId,
      "databases",
      e2.database,
    ]);
  }, "__PRIVATE_fullyQualifiedPrefixPath")(e).child("documents");
  return void 0 === t ? r : r.child(t);
}
__name(__PRIVATE_toResourcePath, "__PRIVATE_toResourcePath");
function __PRIVATE_toName(e, t) {
  return __PRIVATE_toResourceName(e.databaseId, t.path);
}
__name(__PRIVATE_toName, "__PRIVATE_toName");
function fromName(e, t) {
  const r = /* @__PURE__ */ __name(function __PRIVATE_fromResourceName(e2) {
    const t2 = ResourcePath.fromString(e2);
    return (
      __PRIVATE_hardAssert(__PRIVATE_isValidResourceName(t2), 10190, {
        key: t2.toString(),
      }),
      t2
    );
  }, "__PRIVATE_fromResourceName")(t);
  if (r.get(1) !== e.databaseId.projectId)
    throw new FirestoreError(
      d.INVALID_ARGUMENT,
      "Tried to deserialize key from different project: " +
        r.get(1) +
        " vs " +
        e.databaseId.projectId,
    );
  if (r.get(3) !== e.databaseId.database)
    throw new FirestoreError(
      d.INVALID_ARGUMENT,
      "Tried to deserialize key from different database: " +
        r.get(3) +
        " vs " +
        e.databaseId.database,
    );
  return new DocumentKey(
    /* @__PURE__ */ __name(function __PRIVATE_extractLocalPathFromResourceName(
      e2,
    ) {
      return (
        __PRIVATE_hardAssert(
          e2.length > 4 && "documents" === e2.get(4),
          29091,
          {
            key: e2.toString(),
          },
        ),
        e2.popFirst(5)
      );
    }, "__PRIVATE_extractLocalPathFromResourceName")(r),
  );
}
__name(fromName, "fromName");
function __PRIVATE_toMutationDocument(e, t, r) {
  return {
    name: __PRIVATE_toName(e, t),
    fields: r.value.mapValue.fields,
  };
}
__name(__PRIVATE_toMutationDocument, "__PRIVATE_toMutationDocument");
function __PRIVATE_fromBatchGetDocumentsResponse(e, t) {
  return "found" in t
    ? /* @__PURE__ */ __name(function __PRIVATE_fromFound(e2, t2) {
        (__PRIVATE_hardAssert(!!t2.found, 43571),
          t2.found.name,
          t2.found.updateTime);
        const r = fromName(e2, t2.found.name),
          n = __PRIVATE_fromVersion(t2.found.updateTime),
          i = t2.found.createTime
            ? __PRIVATE_fromVersion(t2.found.createTime)
            : SnapshotVersion.min(),
          s = new ObjectValue({
            mapValue: {
              fields: t2.found.fields,
            },
          });
        return MutableDocument.newFoundDocument(r, n, i, s);
      }, "__PRIVATE_fromFound")(e, t)
    : "missing" in t
      ? /* @__PURE__ */ __name(function __PRIVATE_fromMissing(e2, t2) {
          (__PRIVATE_hardAssert(!!t2.missing, 3894),
            __PRIVATE_hardAssert(!!t2.readTime, 22933));
          const r = fromName(e2, t2.missing),
            n = __PRIVATE_fromVersion(t2.readTime);
          return MutableDocument.newNoDocument(r, n);
        }, "__PRIVATE_fromMissing")(e, t)
      : fail(7234, {
          result: t,
        });
}
__name(
  __PRIVATE_fromBatchGetDocumentsResponse,
  "__PRIVATE_fromBatchGetDocumentsResponse",
);
function toMutation(e, t) {
  let r;
  if (t instanceof __PRIVATE_SetMutation)
    r = {
      update: __PRIVATE_toMutationDocument(e, t.key, t.value),
    };
  else if (t instanceof __PRIVATE_DeleteMutation)
    r = {
      delete: __PRIVATE_toName(e, t.key),
    };
  else if (t instanceof __PRIVATE_PatchMutation)
    r = {
      update: __PRIVATE_toMutationDocument(e, t.key, t.data),
      updateMask: __PRIVATE_toDocumentMask(t.fieldMask),
    };
  else {
    if (!(t instanceof __PRIVATE_VerifyMutation))
      return fail(16599, {
        j: t.type,
      });
    r = {
      verify: __PRIVATE_toName(e, t.key),
    };
  }
  return (
    t.fieldTransforms.length > 0 &&
      (r.updateTransforms = t.fieldTransforms.map((e2) =>
        /* @__PURE__ */ __name(function __PRIVATE_toFieldTransform(e3, t2) {
          const r2 = t2.transform;
          if (r2 instanceof __PRIVATE_ServerTimestampTransform)
            return {
              fieldPath: t2.field.canonicalString(),
              setToServerValue: "REQUEST_TIME",
            };
          if (r2 instanceof __PRIVATE_ArrayUnionTransformOperation)
            return {
              fieldPath: t2.field.canonicalString(),
              appendMissingElements: {
                values: r2.elements,
              },
            };
          if (r2 instanceof __PRIVATE_ArrayRemoveTransformOperation)
            return {
              fieldPath: t2.field.canonicalString(),
              removeAllFromArray: {
                values: r2.elements,
              },
            };
          if (r2 instanceof __PRIVATE_NumericIncrementTransformOperation)
            return {
              fieldPath: t2.field.canonicalString(),
              increment: r2.k,
            };
          if (r2 instanceof __PRIVATE_NumericMinimumTransformOperation)
            return {
              fieldPath: t2.field.canonicalString(),
              minimum: r2.k,
            };
          if (r2 instanceof __PRIVATE_NumericMaximumTransformOperation)
            return {
              fieldPath: t2.field.canonicalString(),
              maximum: r2.k,
            };
          throw fail(20930, {
            transform: t2.transform,
          });
        }, "__PRIVATE_toFieldTransform")(0, e2),
      )),
    t.precondition.isNone ||
      (r.currentDocument = /* @__PURE__ */ __name(
        function __PRIVATE_toPrecondition(e2, t2) {
          return void 0 !== t2.updateTime
            ? {
                updateTime: __PRIVATE_toVersion(e2, t2.updateTime),
              }
            : void 0 !== t2.exists
              ? {
                  exists: t2.exists,
                }
              : fail(27497);
        },
        "__PRIVATE_toPrecondition",
      )(e, t.precondition)),
    r
  );
}
__name(toMutation, "toMutation");
function __PRIVATE_toDocumentMask(e) {
  const t = [];
  return (
    e.fields.forEach((e2) => t.push(e2.canonicalString())),
    {
      fieldPaths: t,
    }
  );
}
__name(__PRIVATE_toDocumentMask, "__PRIVATE_toDocumentMask");
function __PRIVATE_isValidResourceName(e) {
  return e.length >= 4 && "projects" === e.get(0) && "databases" === e.get(2);
}
__name(__PRIVATE_isValidResourceName, "__PRIVATE_isValidResourceName");
function __PRIVATE_isProtoValueSerializable(e) {
  return (
    !!e && "function" == typeof e._toProto && "ProtoValue" === e._protoValueType
  );
}
__name(
  __PRIVATE_isProtoValueSerializable,
  "__PRIVATE_isProtoValueSerializable",
);
function __PRIVATE_newSerializer(e) {
  return new JsonProtoSerializer(
    e,
    /* useProto3Json= */
    true,
  );
}
__name(__PRIVATE_newSerializer, "__PRIVATE_newSerializer");
var Datastore = class {
  static {
    __name(this, "Datastore");
  }
};
var __PRIVATE_DatastoreImpl = class extends Datastore {
  static {
    __name(this, "__PRIVATE_DatastoreImpl");
  }
  constructor(e, t, r, n) {
    (super(),
      (this.authCredentials = e),
      (this.appCheckCredentials = t),
      (this.connection = r),
      (this.serializer = n),
      (this.G = false));
  }
  W() {
    if (this.G)
      throw new FirestoreError(
        d.FAILED_PRECONDITION,
        "The client has already been terminated.",
      );
  }
  /** Invokes the provided RPC with auth and AppCheck tokens. */
  I(e, t, r, n) {
    return (
      this.W(),
      Promise.all([
        this.authCredentials.getToken(),
        this.appCheckCredentials.getToken(),
      ])
        .then(([i, s]) =>
          this.connection.I(e, __PRIVATE_toResourcePath(t, r), n, i, s),
        )
        .catch((e2) => {
          throw "FirebaseError" === e2.name
            ? (e2.code === d.UNAUTHENTICATED &&
                (this.authCredentials.invalidateToken(),
                this.appCheckCredentials.invalidateToken()),
              e2)
            : new FirestoreError(d.UNKNOWN, e2.toString());
        })
    );
  }
  /** Invokes the provided RPC with streamed results with auth and AppCheck tokens. */
  D(e, t, r, n, i) {
    return (
      this.W(),
      Promise.all([
        this.authCredentials.getToken(),
        this.appCheckCredentials.getToken(),
      ])
        .then(([s, o]) =>
          this.connection.D(e, __PRIVATE_toResourcePath(t, r), n, s, o, i),
        )
        .catch((e2) => {
          throw "FirebaseError" === e2.name
            ? (e2.code === d.UNAUTHENTICATED &&
                (this.authCredentials.invalidateToken(),
                this.appCheckCredentials.invalidateToken()),
              e2)
            : new FirestoreError(d.UNKNOWN, e2.toString());
        })
    );
  }
  terminate() {
    ((this.G = true), this.connection.terminate());
  }
};
async function __PRIVATE_invokeCommitRpc(e, t) {
  const r = __PRIVATE_debugCast(e),
    n = {
      writes: t.map((e2) => toMutation(r.serializer, e2)),
    };
  await r.I("Commit", r.serializer.databaseId, ResourcePath.emptyPath(), n);
}
__name(__PRIVATE_invokeCommitRpc, "__PRIVATE_invokeCommitRpc");
async function __PRIVATE_invokeBatchGetDocumentsRpc(e, t) {
  const r = __PRIVATE_debugCast(e),
    n = {
      documents: t.map((e2) => __PRIVATE_toName(r.serializer, e2)),
    },
    i = await r.D(
      "BatchGetDocuments",
      r.serializer.databaseId,
      ResourcePath.emptyPath(),
      n,
      t.length,
    ),
    s = /* @__PURE__ */ new Map();
  i.forEach((e2) => {
    const t2 = __PRIVATE_fromBatchGetDocumentsResponse(r.serializer, e2);
    s.set(t2.key.toString(), t2);
  });
  const o = [];
  return (
    t.forEach((e2) => {
      const t2 = s.get(e2.toString());
      (__PRIVATE_hardAssert(!!t2, 55234, {
        key: e2,
      }),
        o.push(t2));
    }),
    o
  );
}
__name(
  __PRIVATE_invokeBatchGetDocumentsRpc,
  "__PRIVATE_invokeBatchGetDocumentsRpc",
);
var $ = "ComponentProvider";
var B = /* @__PURE__ */ new Map();
function __PRIVATE_getDatastore(e) {
  if (e._terminated)
    throw new FirestoreError(
      d.FAILED_PRECONDITION,
      "The client has already been terminated.",
    );
  if (!B.has(e)) {
    __PRIVATE_logDebug($, "Initializing Datastore");
    const t = /* @__PURE__ */ __name(function __PRIVATE_newConnection(e2) {
        return new __PRIVATE_FetchConnection(e2);
      }, "__PRIVATE_newConnection")(
        /* @__PURE__ */ __name(function __PRIVATE_makeDatabaseInfo(
          e2,
          t2,
          r2,
          n2,
          i,
        ) {
          return new DatabaseInfo(
            e2,
            t2,
            r2,
            i.host,
            i.ssl,
            i.experimentalForceLongPolling,
            i.experimentalAutoDetectLongPolling,
            __PRIVATE_cloneLongPollingOptions(i.experimentalLongPollingOptions),
            i.useFetchStreams,
            i.isUsingEmulator,
            n2,
          );
        }, "__PRIVATE_makeDatabaseInfo")(
          e._databaseId,
          e.app.options.appId || "",
          e._persistenceKey,
          e.app.options.apiKey,
          e._freezeSettings(),
        ),
      ),
      r = __PRIVATE_newSerializer(e._databaseId),
      n = /* @__PURE__ */ __name(function __PRIVATE_newDatastore(
        e2,
        t2,
        r2,
        n2,
      ) {
        return new __PRIVATE_DatastoreImpl(e2, t2, r2, n2);
      }, "__PRIVATE_newDatastore")(
        e._authCredentials,
        e._appCheckCredentials,
        t,
        r,
      );
    B.set(e, n);
  }
  return B.get(e);
}
__name(__PRIVATE_getDatastore, "__PRIVATE_getDatastore");
var x = 1048576;
var M = "firestore.googleapis.com";
var Q = true;
var FirestoreSettingsImpl = class {
  static {
    __name(this, "FirestoreSettingsImpl");
  }
  constructor(e) {
    if (void 0 === e.host) {
      if (void 0 !== e.ssl)
        throw new FirestoreError(
          d.INVALID_ARGUMENT,
          "Can't provide ssl option if host option is not set",
        );
      ((this.host = M), (this.ssl = Q));
    } else ((this.host = e.host), (this.ssl = e.ssl ?? Q));
    if (
      ((this.isUsingEmulator = void 0 !== e.emulatorOptions),
      (this.credentials = e.credentials),
      (this.ignoreUndefinedProperties = !!e.ignoreUndefinedProperties),
      (this.localCache = e.localCache),
      void 0 === e.cacheSizeBytes)
    )
      this.cacheSizeBytes = 41943040;
    else {
      if (-1 !== e.cacheSizeBytes && e.cacheSizeBytes < x)
        throw new FirestoreError(
          d.INVALID_ARGUMENT,
          "cacheSizeBytes must be at least 1048576",
        );
      this.cacheSizeBytes = e.cacheSizeBytes;
    }
    (!/* @__PURE__ */ __name(function __PRIVATE_validateIsNotUsedTogether(
      e2,
      t,
      r,
      n,
    ) {
      if (true === t && true === n)
        throw new FirestoreError(
          d.INVALID_ARGUMENT,
          `${e2} and ${r} cannot be used together.`,
        );
    }, "__PRIVATE_validateIsNotUsedTogether")(
      "experimentalForceLongPolling",
      e.experimentalForceLongPolling,
      "experimentalAutoDetectLongPolling",
      e.experimentalAutoDetectLongPolling,
    ),
      (this.experimentalForceLongPolling = !!e.experimentalForceLongPolling),
      this.experimentalForceLongPolling
        ? (this.experimentalAutoDetectLongPolling = false)
        : void 0 === e.experimentalAutoDetectLongPolling
          ? (this.experimentalAutoDetectLongPolling = true)
          : // For backwards compatibility, coerce the value to boolean even though
            // the TypeScript compiler has narrowed the type to boolean already.
            // noinspection PointlessBooleanExpressionJS
            (this.experimentalAutoDetectLongPolling =
              !!e.experimentalAutoDetectLongPolling),
      (this.experimentalLongPollingOptions = __PRIVATE_cloneLongPollingOptions(
        e.experimentalLongPollingOptions ?? {},
      )),
      /* @__PURE__ */ __name(function __PRIVATE_validateLongPollingOptions(e2) {
        if (void 0 !== e2.timeoutSeconds) {
          if (isNaN(e2.timeoutSeconds))
            throw new FirestoreError(
              d.INVALID_ARGUMENT,
              `invalid long polling timeout: ${e2.timeoutSeconds} (must not be NaN)`,
            );
          if (e2.timeoutSeconds < 5)
            throw new FirestoreError(
              d.INVALID_ARGUMENT,
              `invalid long polling timeout: ${e2.timeoutSeconds} (minimum allowed value is 5)`,
            );
          if (e2.timeoutSeconds > 30)
            throw new FirestoreError(
              d.INVALID_ARGUMENT,
              `invalid long polling timeout: ${e2.timeoutSeconds} (maximum allowed value is 30)`,
            );
        }
      }, "__PRIVATE_validateLongPollingOptions")(
        this.experimentalLongPollingOptions,
      ),
      (this.useFetchStreams = !!e.useFetchStreams));
  }
  isEqual(e) {
    return (
      this.host === e.host &&
      this.ssl === e.ssl &&
      this.credentials === e.credentials &&
      this.cacheSizeBytes === e.cacheSizeBytes &&
      this.experimentalForceLongPolling === e.experimentalForceLongPolling &&
      this.experimentalAutoDetectLongPolling ===
        e.experimentalAutoDetectLongPolling &&
      /* @__PURE__ */ __name(function __PRIVATE_longPollingOptionsEqual(e2, t) {
        return e2.timeoutSeconds === t.timeoutSeconds;
      }, "__PRIVATE_longPollingOptionsEqual")(
        this.experimentalLongPollingOptions,
        e.experimentalLongPollingOptions,
      ) &&
      this.ignoreUndefinedProperties === e.ignoreUndefinedProperties &&
      this.useFetchStreams === e.useFetchStreams
    );
  }
};
var Firestore = class {
  static {
    __name(this, "Firestore");
  }
  /** @hideconstructor */
  constructor(e, t, r, n) {
    ((this._authCredentials = e),
      (this._appCheckCredentials = t),
      (this._databaseId = r),
      (this._app = n) /**
       * Whether it's a Firestore or Firestore Lite instance.
       */,
      (this.type = "firestore-lite"),
      (this._persistenceKey = "(lite)"),
      (this._settings = new FirestoreSettingsImpl({})),
      (this._settingsFrozen = false),
      (this._emulatorOptions = {}), // A task that is assigned when the terminate() is invoked and resolved when
      // all components have shut down. Otherwise, Firestore is not terminated,
      // which can mean either the FirestoreClient is in the process of starting,
      // or restarting.
      (this._terminateTask = "notTerminated"));
  }
  /**
   * The {@link @firebase/app#FirebaseApp} associated with this `Firestore` service
   * instance.
   */
  get app() {
    if (!this._app)
      throw new FirestoreError(
        d.FAILED_PRECONDITION,
        "Firestore was not initialized using the Firebase SDK. 'app' is not available",
      );
    return this._app;
  }
  get _initialized() {
    return this._settingsFrozen;
  }
  get _terminated() {
    return "notTerminated" !== this._terminateTask;
  }
  _setSettings(e) {
    if (this._settingsFrozen)
      throw new FirestoreError(
        d.FAILED_PRECONDITION,
        "Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.",
      );
    ((this._settings = new FirestoreSettingsImpl(e)),
      (this._emulatorOptions = e.emulatorOptions || {}),
      void 0 !== e.credentials &&
        (this._authCredentials = /* @__PURE__ */ __name(
          function __PRIVATE_makeAuthCredentialsProvider(e2) {
            if (!e2) return new __PRIVATE_EmptyAuthCredentialsProvider();
            switch (e2.type) {
              case "firstParty":
                return new __PRIVATE_FirstPartyAuthCredentialsProvider(
                  e2.sessionIndex || "0",
                  e2.iamToken || null,
                  e2.authTokenFactory || null,
                );
              case "provider":
                return e2.client;
              default:
                throw new FirestoreError(
                  d.INVALID_ARGUMENT,
                  "makeAuthCredentialsProvider failed due to invalid credential type",
                );
            }
          },
          "__PRIVATE_makeAuthCredentialsProvider",
        )(e.credentials)));
  }
  _getSettings() {
    return this._settings;
  }
  _getEmulatorOptions() {
    return this._emulatorOptions;
  }
  _freezeSettings() {
    return ((this._settingsFrozen = true), this._settings);
  }
  _delete() {
    return (
      "notTerminated" === this._terminateTask &&
        (this._terminateTask = this._terminate()),
      this._terminateTask
    );
  }
  async _restart() {
    "notTerminated" === this._terminateTask
      ? await this._terminate()
      : (this._terminateTask = "notTerminated");
  }
  /** Returns a JSON-serializable representation of this `Firestore` instance. */
  toJSON() {
    return {
      app: this._app,
      databaseId: this._databaseId,
      settings: this._settings,
    };
  }
  /**
   * Terminates all components used by this client. Subclasses can override
   * this method to clean up their own dependencies, but must also call this
   * method.
   *
   * Only ever called once.
   */
  _terminate() {
    return (
      /* @__PURE__ */ __name(function __PRIVATE_removeComponents(e) {
        const t = B.get(e);
        t &&
          (__PRIVATE_logDebug($, "Removing Datastore"),
          B.delete(e),
          t.terminate());
      }, "__PRIVATE_removeComponents")(this),
      Promise.resolve()
    );
  }
};
function getFirestore(e, t) {
  const n = "object" == typeof e ? e : getApp(),
    i = "string" == typeof e ? e : t || "(default)",
    s = _getProvider(n, "firestore/lite").getImmediate({
      identifier: i,
    });
  if (!s._initialized) {
    const e2 = getDefaultEmulatorHostnameAndPort("firestore");
    e2 && connectFirestoreEmulator(s, ...e2);
  }
  return s;
}
__name(getFirestore, "getFirestore");
function connectFirestoreEmulator(e, r, o, a = {}) {
  e = __PRIVATE_cast(e, Firestore);
  const u = isCloudWorkstation(r),
    _ = e._getSettings(),
    c = {
      ..._,
      emulatorOptions: e._getEmulatorOptions(),
    },
    l = `${r}:${o}`;
  (u && pingServer(`https://${l}`),
    _.host !== M &&
      _.host !== l &&
      __PRIVATE_logWarn(
        "Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.",
      ));
  const h = {
    ..._,
    host: l,
    ssl: u,
    emulatorOptions: a,
  };
  if (!deepEqual(h, c) && (e._setSettings(h), a.mockUserToken)) {
    let t, r2;
    if ("string" == typeof a.mockUserToken)
      ((t = a.mockUserToken), (r2 = User.MOCK_USER));
    else {
      t = createMockUserToken(a.mockUserToken, e._app?.options.projectId);
      const n = a.mockUserToken.sub || a.mockUserToken.user_id;
      if (!n)
        throw new FirestoreError(
          d.INVALID_ARGUMENT,
          "mockUserToken must contain 'sub' or 'user_id' field!",
        );
      r2 = new User(n);
    }
    e._authCredentials = new __PRIVATE_EmulatorAuthCredentialsProvider(
      new __PRIVATE_OAuthToken(t, r2),
    );
  }
}
__name(connectFirestoreEmulator, "connectFirestoreEmulator");
var Query = class _Query {
  static {
    __name(this, "Query");
  }
  // This is the lite version of the Query class in the main SDK.
  /** @hideconstructor protected */
  constructor(e, t, r) {
    ((this.converter = t),
      (this._query = r) /** The type of this Firestore reference. */,
      (this.type = "query"),
      (this.firestore = e));
  }
  withConverter(e) {
    return new _Query(this.firestore, e, this._query);
  }
};
var DocumentReference = class _DocumentReference {
  static {
    __name(this, "DocumentReference");
  }
  /** @hideconstructor */
  constructor(e, t, r) {
    ((this.converter = t),
      (this._key = r) /** The type of this Firestore reference. */,
      (this.type = "document"),
      (this.firestore = e));
  }
  get _path() {
    return this._key.path;
  }
  /**
   * The document's identifier within its collection.
   */
  get id() {
    return this._key.path.lastSegment();
  }
  /**
   * A string representing the path of the referenced document (relative
   * to the root of the database).
   */
  get path() {
    return this._key.path.canonicalString();
  }
  /**
   * The collection this `DocumentReference` belongs to.
   */
  get parent() {
    return new CollectionReference(
      this.firestore,
      this.converter,
      this._key.path.popLast(),
    );
  }
  withConverter(e) {
    return new _DocumentReference(this.firestore, e, this._key);
  }
  /**
   * Returns a JSON-serializable representation of this `DocumentReference` instance.
   *
   * @returns a JSON representation of this object.
   */
  toJSON() {
    return {
      type: _DocumentReference._jsonSchemaVersion,
      referencePath: this._key.toString(),
    };
  }
  static fromJSON(e, t, r) {
    if (__PRIVATE_validateJSON(t, _DocumentReference._jsonSchema))
      return new _DocumentReference(
        e,
        r || null,
        new DocumentKey(ResourcePath.fromString(t.referencePath)),
      );
  }
};
((DocumentReference._jsonSchemaVersion = "firestore/documentReference/1.0"),
  (DocumentReference._jsonSchema = {
    type: property("string", DocumentReference._jsonSchemaVersion),
    referencePath: property("string"),
  }));
var CollectionReference = class _CollectionReference extends Query {
  static {
    __name(this, "CollectionReference");
  }
  /** @hideconstructor */
  constructor(e, t, r) {
    (super(
      e,
      t,
      /* @__PURE__ */ __name(function __PRIVATE_newQueryForPath(e2) {
        return new __PRIVATE_QueryImpl(e2);
      }, "__PRIVATE_newQueryForPath")(r),
    ),
      (this._path = r) /** The type of this Firestore reference. */,
      (this.type = "collection"));
  }
  /** The collection's identifier. */
  get id() {
    return this._query.path.lastSegment();
  }
  /**
   * A string representing the path of the referenced collection (relative
   * to the root of the database).
   */
  get path() {
    return this._query.path.canonicalString();
  }
  /**
   * A reference to the containing `DocumentReference` if this is a
   * subcollection. If this isn't a subcollection, the reference is null.
   */
  get parent() {
    const e = this._path.popLast();
    return e.isEmpty()
      ? null
      : new DocumentReference(
          this.firestore,
          /* converter= */
          null,
          new DocumentKey(e),
        );
  }
  withConverter(e) {
    return new _CollectionReference(this.firestore, e, this._path);
  }
};
function doc(e, t, ...r) {
  if (
    ((e = getModularInstance(e)), // We allow omission of 'pathString' but explicitly prohibit passing in both
    // 'undefined' and 'null'.
    1 === arguments.length && (t = __PRIVATE_AutoId.newId()),
    __PRIVATE_validateNonEmptyArgument("doc", "path", t),
    e instanceof Firestore)
  ) {
    const n = ResourcePath.fromString(t, ...r);
    return (
      __PRIVATE_validateDocumentPath(n),
      new DocumentReference(
        e,
        /* converter= */
        null,
        new DocumentKey(n),
      )
    );
  }
  {
    if (!(e instanceof DocumentReference || e instanceof CollectionReference))
      throw new FirestoreError(
        d.INVALID_ARGUMENT,
        "Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore",
      );
    const n = e._path.child(ResourcePath.fromString(t, ...r));
    return (
      __PRIVATE_validateDocumentPath(n),
      new DocumentReference(
        e.firestore,
        e instanceof CollectionReference ? e.converter : null,
        new DocumentKey(n),
      )
    );
  }
}
__name(doc, "doc");
var Bytes = class _Bytes {
  static {
    __name(this, "Bytes");
  }
  /** @hideconstructor */
  constructor(e) {
    this._byteString = e;
  }
  /**
   * Creates a new `Bytes` object from the given Base64 string, converting it to
   * bytes.
   *
   * @param base64 - The Base64 string used to create the `Bytes` object.
   */
  static fromBase64String(e) {
    try {
      return new _Bytes(ByteString.fromBase64String(e));
    } catch (e2) {
      throw new FirestoreError(
        d.INVALID_ARGUMENT,
        "Failed to construct data from Base64 string: " + e2,
      );
    }
  }
  /**
   * Creates a new `Bytes` object from the given Uint8Array.
   *
   * @param array - The Uint8Array used to create the `Bytes` object.
   */
  static fromUint8Array(e) {
    return new _Bytes(ByteString.fromUint8Array(e));
  }
  /**
   * Returns the underlying bytes as a Base64-encoded string.
   *
   * @returns The Base64-encoded string created from the `Bytes` object.
   */
  toBase64() {
    return this._byteString.toBase64();
  }
  /**
   * Returns the underlying bytes in a new `Uint8Array`.
   *
   * @returns The Uint8Array created from the `Bytes` object.
   */
  toUint8Array() {
    return this._byteString.toUint8Array();
  }
  /**
   * Returns a string representation of the `Bytes` object.
   *
   * @returns A string representation of the `Bytes` object.
   */
  toString() {
    return "Bytes(base64: " + this.toBase64() + ")";
  }
  /**
   * Returns true if this `Bytes` object is equal to the provided one.
   *
   * @param other - The `Bytes` object to compare against.
   * @returns true if this `Bytes` object is equal to the provided one.
   */
  isEqual(e) {
    return this._byteString.isEqual(e._byteString);
  }
  /**
   * Returns a JSON-serializable representation of this `Bytes` instance.
   *
   * @returns a JSON representation of this object.
   */
  toJSON() {
    return {
      type: _Bytes._jsonSchemaVersion,
      bytes: this.toBase64(),
    };
  }
  /**
   * Builds a `Bytes` instance from a JSON object created by {@link Bytes.toJSON}.
   *
   * @param json - a JSON object represention of a `Bytes` instance
   * @returns an instance of {@link Bytes} if the JSON object could be parsed. Throws a
   * {@link FirestoreError} if an error occurs.
   */
  static fromJSON(e) {
    if (__PRIVATE_validateJSON(e, _Bytes._jsonSchema))
      return _Bytes.fromBase64String(e.bytes);
  }
};
((Bytes._jsonSchemaVersion = "firestore/bytes/1.0"),
  (Bytes._jsonSchema = {
    type: property("string", Bytes._jsonSchemaVersion),
    bytes: property("string"),
  }));
var FieldPath = class {
  static {
    __name(this, "FieldPath");
  }
  /**
   * Creates a `FieldPath` from the provided field names. If more than one field
   * name is provided, the path will point to a nested field in a document.
   *
   * @param fieldNames - A list of field names.
   */
  constructor(...e) {
    for (let t = 0; t < e.length; ++t)
      if (0 === e[t].length)
        throw new FirestoreError(
          d.INVALID_ARGUMENT,
          "Invalid field name at argument $(i + 1). Field names must not be empty.",
        );
    this._internalPath = new FieldPath$1(e);
  }
  /**
   * Returns true if this `FieldPath` is equal to the provided one.
   *
   * @param other - The `FieldPath` to compare against.
   * @returns true if this `FieldPath` is equal to the provided one.
   */
  isEqual(e) {
    return this._internalPath.isEqual(e._internalPath);
  }
};
var FieldValue = class {
  static {
    __name(this, "FieldValue");
  }
  /**
   * @param _methodName - The public API endpoint that returns this class.
   * @hideconstructor
   */
  constructor(e) {
    this._methodName = e;
  }
};
var GeoPoint = class _GeoPoint {
  static {
    __name(this, "GeoPoint");
  }
  /**
   * Creates a new immutable `GeoPoint` object with the provided latitude and
   * longitude values.
   * @param latitude - The latitude as number between -90 and 90.
   * @param longitude - The longitude as number between -180 and 180.
   */
  constructor(e, t) {
    if (!isFinite(e) || e < -90 || e > 90)
      throw new FirestoreError(
        d.INVALID_ARGUMENT,
        "Latitude must be a number between -90 and 90, but was: " + e,
      );
    if (!isFinite(t) || t < -180 || t > 180)
      throw new FirestoreError(
        d.INVALID_ARGUMENT,
        "Longitude must be a number between -180 and 180, but was: " + t,
      );
    ((this._lat = e), (this._long = t));
  }
  /**
   * The latitude of this `GeoPoint` instance.
   */
  get latitude() {
    return this._lat;
  }
  /**
   * The longitude of this `GeoPoint` instance.
   */
  get longitude() {
    return this._long;
  }
  /**
   * Returns true if this `GeoPoint` is equal to the provided one.
   *
   * @param other - The `GeoPoint` to compare against.
   * @returns true if this `GeoPoint` is equal to the provided one.
   */
  isEqual(e) {
    return this._lat === e._lat && this._long === e._long;
  }
  /**
   * Actually private to JS consumers of our API, so this function is prefixed
   * with an underscore.
   */
  _compareTo(e) {
    return (
      __PRIVATE_primitiveComparator(this._lat, e._lat) ||
      __PRIVATE_primitiveComparator(this._long, e._long)
    );
  }
  /**
   * Returns a JSON-serializable representation of this `GeoPoint` instance.
   *
   * @returns a JSON representation of this object.
   */
  toJSON() {
    return {
      latitude: this._lat,
      longitude: this._long,
      type: _GeoPoint._jsonSchemaVersion,
    };
  }
  /**
   * Builds a `GeoPoint` instance from a JSON object created by {@link GeoPoint.toJSON}.
   *
   * @param json - a JSON object represention of a `GeoPoint` instance
   * @returns an instance of {@link GeoPoint} if the JSON object could be parsed. Throws a
   * {@link FirestoreError} if an error occurs.
   */
  static fromJSON(e) {
    if (__PRIVATE_validateJSON(e, _GeoPoint._jsonSchema))
      return new _GeoPoint(e.latitude, e.longitude);
  }
};
((GeoPoint._jsonSchemaVersion = "firestore/geoPoint/1.0"),
  (GeoPoint._jsonSchema = {
    type: property("string", GeoPoint._jsonSchemaVersion),
    latitude: property("number"),
    longitude: property("number"),
  }));
var VectorValue = class _VectorValue {
  static {
    __name(this, "VectorValue");
  }
  /**
   * @private
   * @internal
   */
  constructor(e) {
    this._values = (e || []).map((e2) => e2);
  }
  /**
   * Returns a copy of the raw number array form of the vector.
   */
  toArray() {
    return this._values.map((e) => e);
  }
  /**
   * Returns `true` if the two `VectorValue` values have the same raw number arrays, returns `false` otherwise.
   */
  isEqual(e) {
    return /* @__PURE__ */ __name(function __PRIVATE_isPrimitiveArrayEqual(
      e2,
      t,
    ) {
      if (e2.length !== t.length) return false;
      for (let r = 0; r < e2.length; ++r) if (e2[r] !== t[r]) return false;
      return true;
    }, "__PRIVATE_isPrimitiveArrayEqual")(this._values, e._values);
  }
  /**
   * Returns a JSON-serializable representation of this `VectorValue` instance.
   *
   * @returns a JSON representation of this object.
   */
  toJSON() {
    return {
      type: _VectorValue._jsonSchemaVersion,
      vectorValues: this._values,
    };
  }
  /**
   * Builds a `VectorValue` instance from a JSON object created by {@link VectorValue.toJSON}.
   *
   * @param json - a JSON object represention of a `VectorValue` instance.
   * @returns an instance of {@link VectorValue} if the JSON object could be parsed. Throws a
   * {@link FirestoreError} if an error occurs.
   */
  static fromJSON(e) {
    if (__PRIVATE_validateJSON(e, _VectorValue._jsonSchema)) {
      if (
        Array.isArray(e.vectorValues) &&
        e.vectorValues.every((e2) => "number" == typeof e2)
      )
        return new _VectorValue(e.vectorValues);
      throw new FirestoreError(
        d.INVALID_ARGUMENT,
        "Expected 'vectorValues' field to be a number array",
      );
    }
  }
};
((VectorValue._jsonSchemaVersion = "firestore/vectorValue/1.0"),
  (VectorValue._jsonSchema = {
    type: property("string", VectorValue._jsonSchemaVersion),
    vectorValues: property("object"),
  }));
var U = /^__.*__$/;
var ParsedUpdateData = class {
  static {
    __name(this, "ParsedUpdateData");
  }
  constructor(e, t, r) {
    ((this.data = e), (this.fieldMask = t), (this.fieldTransforms = r));
  }
  toMutation(e, t) {
    return new __PRIVATE_PatchMutation(
      e,
      this.data,
      this.fieldMask,
      t,
      this.fieldTransforms,
    );
  }
};
function __PRIVATE_isWrite(e) {
  switch (e) {
    case 0:
    // fall through
    case 2:
    // fall through
    case 1:
      return true;
    case 3:
    case 4:
      return false;
    default:
      throw fail(40011, {
        dataSource: e,
      });
  }
}
__name(__PRIVATE_isWrite, "__PRIVATE_isWrite");
var ParseContextImpl = class _ParseContextImpl {
  static {
    __name(this, "ParseContextImpl");
  }
  /**
   * Initializes a ParseContext with the given source and path.
   *
   * @param settings - The settings for the parser.
   * @param databaseId - The database ID of the Firestore instance.
   * @param serializer - The serializer to use to generate the Value proto.
   * @param ignoreUndefinedProperties - Whether to ignore undefined properties
   * rather than throw.
   * @param fieldTransforms - A mutable list of field transforms encountered
   * while parsing the data.
   * @param fieldMask - A mutable list of field paths encountered while parsing
   * the data.
   *
   * TODO(b/34871131): We don't support array paths right now, so path can be
   * null to indicate the context represents any location within an array (in
   * which case certain features will not work and errors will be somewhat
   * compromised).
   */
  constructor(e, t, r, n, i, s) {
    ((this.settings = e),
      (this.databaseId = t),
      (this.serializer = r),
      (this.ignoreUndefinedProperties = n), // Minor hack: If fieldTransforms is undefined, we assume this is an
      // external call and we need to validate the entire path.
      void 0 === i && this.validatePath(),
      (this.fieldTransforms = i || []),
      (this.fieldMask = s || []));
  }
  get path() {
    return this.settings.path;
  }
  get dataSource() {
    return this.settings.dataSource;
  }
  /** Returns a new context with the specified settings overwritten. */
  contextWith(e) {
    return new _ParseContextImpl(
      {
        ...this.settings,
        ...e,
      },
      this.databaseId,
      this.serializer,
      this.ignoreUndefinedProperties,
      this.fieldTransforms,
      this.fieldMask,
    );
  }
  childContextForField(e) {
    const t = this.path?.child(e),
      r = this.contextWith({
        path: t,
        arrayElement: false,
      });
    return (r.validatePathSegment(e), r);
  }
  childContextForFieldPath(e) {
    const t = this.path?.child(e),
      r = this.contextWith({
        path: t,
        arrayElement: false,
      });
    return (r.validatePath(), r);
  }
  childContextForArray(e) {
    return this.contextWith({
      path: void 0,
      arrayElement: true,
    });
  }
  createError(e) {
    return createError(
      e,
      this.settings.methodName,
      this.settings.hasConverter || false,
      this.path,
      this.settings.targetDoc,
    );
  }
  /** Returns 'true' if 'fieldPath' was traversed when creating this context. */
  contains(e) {
    return (
      void 0 !== this.fieldMask.find((t) => e.isPrefixOf(t)) ||
      void 0 !== this.fieldTransforms.find((t) => e.isPrefixOf(t.field))
    );
  }
  validatePath() {
    if (this.path)
      for (let e = 0; e < this.path.length; e++)
        this.validatePathSegment(this.path.get(e));
  }
  validatePathSegment(e) {
    if (0 === e.length)
      throw this.createError("Document fields must not be empty");
    if (__PRIVATE_isWrite(this.dataSource) && U.test(e))
      throw this.createError('Document fields cannot begin and end with "__"');
  }
};
var UserDataReader = class {
  static {
    __name(this, "UserDataReader");
  }
  constructor(e, t, r) {
    ((this.databaseId = e),
      (this.ignoreUndefinedProperties = t),
      (this.serializer = r || __PRIVATE_newSerializer(e)));
  }
  /** Creates a new top-level parse context. */
  createContext(e, t, r, n = false) {
    return new ParseContextImpl(
      {
        dataSource: e,
        methodName: t,
        targetDoc: r,
        path: FieldPath$1.emptyPath(),
        arrayElement: false,
        hasConverter: n,
      },
      this.databaseId,
      this.serializer,
      this.ignoreUndefinedProperties,
    );
  }
};
function __PRIVATE_newUserDataReader(e) {
  const t = e._freezeSettings(),
    r = __PRIVATE_newSerializer(e._databaseId);
  return new UserDataReader(e._databaseId, !!t.ignoreUndefinedProperties, r);
}
__name(__PRIVATE_newUserDataReader, "__PRIVATE_newUserDataReader");
var __PRIVATE_DeleteFieldValueImpl = class ___PRIVATE_DeleteFieldValueImpl extends FieldValue {
  static {
    __name(this, "__PRIVATE_DeleteFieldValueImpl");
  }
  _toFieldTransform(e) {
    if (2 !== e.dataSource)
      throw 1 === e.dataSource
        ? e.createError(
            `${this._methodName}() can only appear at the top level of your update data`,
          )
        : e.createError(
            `${this._methodName}() cannot be used with set() unless you pass {merge:true}`,
          );
    return (e.fieldMask.push(e.path), null);
  }
  isEqual(e) {
    return e instanceof ___PRIVATE_DeleteFieldValueImpl;
  }
};
function __PRIVATE_parseUpdateData(e, t, r, n) {
  const i = e.createContext(1, t, r);
  __PRIVATE_validatePlainObject("Data must be an object, but it was:", i, n);
  const s = [],
    a = ObjectValue.empty();
  forEach(n, (e2, n2) => {
    const u2 = __PRIVATE_fieldPathFromDotSeparatedString(t, e2, r);
    n2 = getModularInstance(n2);
    const _ = i.childContextForFieldPath(u2);
    if (n2 instanceof __PRIVATE_DeleteFieldValueImpl) s.push(u2);
    else {
      const e3 = __PRIVATE_parseData(n2, _);
      null != e3 && (s.push(u2), a.set(u2, e3));
    }
  });
  const u = new FieldMask(s);
  return new ParsedUpdateData(a, u, i.fieldTransforms);
}
__name(__PRIVATE_parseUpdateData, "__PRIVATE_parseUpdateData");
function __PRIVATE_parseUpdateVarargs(e, t, r, n, i, s) {
  const a = e.createContext(1, t, r),
    u = [__PRIVATE_fieldPathFromArgument(t, n, r)],
    _ = [i];
  if (s.length % 2 != 0)
    throw new FirestoreError(
      d.INVALID_ARGUMENT,
      `Function ${t}() needs to be called with an even number of arguments that alternate between field names and values.`,
    );
  for (let e2 = 0; e2 < s.length; e2 += 2)
    (u.push(__PRIVATE_fieldPathFromArgument(t, s[e2])), _.push(s[e2 + 1]));
  const c = [],
    l = ObjectValue.empty();
  for (let e2 = u.length - 1; e2 >= 0; --e2)
    if (!__PRIVATE_fieldMaskContains(c, u[e2])) {
      const t2 = u[e2];
      let r2 = _[e2];
      r2 = getModularInstance(r2);
      const n2 = a.childContextForFieldPath(t2);
      if (r2 instanceof __PRIVATE_DeleteFieldValueImpl) c.push(t2);
      else {
        const e3 = __PRIVATE_parseData(r2, n2);
        null != e3 && (c.push(t2), l.set(t2, e3));
      }
    }
  const h = new FieldMask(c);
  return new ParsedUpdateData(l, h, a.fieldTransforms);
}
__name(__PRIVATE_parseUpdateVarargs, "__PRIVATE_parseUpdateVarargs");
function __PRIVATE_parseData(e, t, r) {
  if (
    __PRIVATE_looksLikeJsonObject(
      // Unwrap the API type from the Compat SDK. This will return the API type
      // from firestore-exp.
      (e = getModularInstance(e)),
    )
  )
    return (
      __PRIVATE_validatePlainObject("Unsupported field value:", t, e),
      __PRIVATE_parseObject(e, t)
    );
  if (e instanceof FieldValue)
    return (
      /* @__PURE__ */ __name(function __PRIVATE_parseSentinelFieldValue(
        e2,
        t2,
      ) {
        if (!__PRIVATE_isWrite(t2.dataSource))
          throw t2.createError(
            `${e2._methodName}() can only be used with update() and set()`,
          );
        if (!t2.path)
          throw t2.createError(
            `${e2._methodName}() is not currently supported inside arrays`,
          );
        const r2 = e2._toFieldTransform(t2);
        r2 && t2.fieldTransforms.push(r2);
      }, "__PRIVATE_parseSentinelFieldValue")(e, t),
      null
    );
  if (void 0 === e && t.ignoreUndefinedProperties) return null;
  if (
    // If context.path is null we are inside an array and we don't support
    // field mask paths more granular than the top-level array.
    (t.path && t.fieldMask.push(t.path), e instanceof Array)
  ) {
    if (t.settings.arrayElement && 4 !== t.dataSource)
      throw t.createError("Nested arrays are not supported");
    return /* @__PURE__ */ __name(function __PRIVATE_parseArray(e2, t2) {
      const r2 = [];
      let n = 0;
      for (const i of e2) {
        let e3 = __PRIVATE_parseData(i, t2.childContextForArray(n));
        (null == e3 && // Just include nulls in the array for fields being replaced with a
          // sentinel.
          (e3 = {
            nullValue: "NULL_VALUE",
          }),
          r2.push(e3),
          n++);
      }
      return {
        arrayValue: {
          values: r2,
        },
      };
    }, "__PRIVATE_parseArray")(e, t);
  }
  return /* @__PURE__ */ __name(function __PRIVATE_parseScalarValue(
    e2,
    t2,
    r2,
  ) {
    if (null === (e2 = getModularInstance(e2)))
      return {
        nullValue: "NULL_VALUE",
      };
    if ("number" == typeof e2) return toNumber(t2.serializer, e2, r2);
    if ("boolean" == typeof e2)
      return {
        booleanValue: e2,
      };
    if ("string" == typeof e2)
      return {
        stringValue: e2,
      };
    if (e2 instanceof Date) {
      const r3 = Timestamp.fromDate(e2);
      return {
        timestampValue: toTimestamp(t2.serializer, r3),
      };
    }
    if (e2 instanceof Timestamp) {
      const r3 = new Timestamp(
        e2.seconds,
        1e3 * Math.floor(e2.nanoseconds / 1e3),
      );
      return {
        timestampValue: toTimestamp(t2.serializer, r3),
      };
    }
    if (e2 instanceof GeoPoint)
      return {
        geoPointValue: {
          latitude: e2.latitude,
          longitude: e2.longitude,
        },
      };
    if (e2 instanceof Bytes)
      return {
        bytesValue: __PRIVATE_toBytes(t2.serializer, e2._byteString),
      };
    if (e2 instanceof DocumentReference) {
      const r3 = t2.databaseId,
        n = e2.firestore._databaseId;
      if (!n.isEqual(r3))
        throw t2.createError(
          `Document reference is for database ${n.projectId}/${n.database} but should be for database ${r3.projectId}/${r3.database}`,
        );
      return {
        referenceValue: __PRIVATE_toResourceName(
          e2.firestore._databaseId || t2.databaseId,
          e2._key.path,
        ),
      };
    }
    if (e2 instanceof VectorValue)
      return /* @__PURE__ */ __name(function __PRIVATE_parseVectorValue(
        e3,
        t3,
      ) {
        const r3 = e3 instanceof VectorValue ? e3.toArray() : e3,
          n = {
            fields: {
              [b]: {
                stringValue: S,
              },
              [C]: {
                arrayValue: {
                  values: r3.map((e4) => {
                    if ("number" != typeof e4)
                      throw t3.createError(
                        "VectorValues must only contain numeric values.",
                      );
                    return __PRIVATE_toDouble(t3.serializer, e4);
                  }),
                },
              },
            },
          };
        return {
          mapValue: n,
        };
      }, "__PRIVATE_parseVectorValue")(e2, t2);
    if (__PRIVATE_isProtoValueSerializable(e2))
      return e2._toProto(t2.serializer);
    throw t2.createError(
      `Unsupported field value: ${__PRIVATE_valueDescription(e2)}`,
    );
  }, "__PRIVATE_parseScalarValue")(e, t, r);
}
__name(__PRIVATE_parseData, "__PRIVATE_parseData");
function __PRIVATE_parseObject(e, t) {
  const r = {};
  return (
    !/* @__PURE__ */ __name(function isEmpty2(e2) {
      for (const t2 in e2)
        if (Object.prototype.hasOwnProperty.call(e2, t2)) return false;
      return true;
    }, "isEmpty")(e)
      ? forEach(e, (e2, n) => {
          const i = __PRIVATE_parseData(n, t.childContextForField(e2));
          null != i && (r[e2] = i);
        })
      : // If we encounter an empty object, we explicitly add it to the update
        // mask to ensure that the server creates a map entry.
        t.path && t.path.length > 0 && t.fieldMask.push(t.path),
    {
      mapValue: {
        fields: r,
      },
    }
  );
}
__name(__PRIVATE_parseObject, "__PRIVATE_parseObject");
function __PRIVATE_looksLikeJsonObject(e) {
  return !(
    "object" != typeof e ||
    null === e ||
    e instanceof Array ||
    e instanceof Date ||
    e instanceof Timestamp ||
    e instanceof GeoPoint ||
    e instanceof Bytes ||
    e instanceof DocumentReference ||
    e instanceof FieldValue ||
    e instanceof VectorValue ||
    __PRIVATE_isProtoValueSerializable(e)
  );
}
__name(__PRIVATE_looksLikeJsonObject, "__PRIVATE_looksLikeJsonObject");
function __PRIVATE_validatePlainObject(e, t, r) {
  if (!__PRIVATE_looksLikeJsonObject(r) || !__PRIVATE_isPlainObject(r)) {
    const n = __PRIVATE_valueDescription(r);
    throw "an object" === n
      ? t.createError(e + " a custom object")
      : t.createError(e + " " + n);
  }
}
__name(__PRIVATE_validatePlainObject, "__PRIVATE_validatePlainObject");
function __PRIVATE_fieldPathFromArgument(e, t, r) {
  if (
    // If required, replace the FieldPath Compat class with the firestore-exp
    // FieldPath.
    (t = getModularInstance(t)) instanceof FieldPath
  )
    return t._internalPath;
  if ("string" == typeof t)
    return __PRIVATE_fieldPathFromDotSeparatedString(e, t);
  throw createError(
    "Field path arguments must be of type string or ",
    e,
    /* hasConverter= */
    false,
    /* path= */
    void 0,
    r,
  );
}
__name(__PRIVATE_fieldPathFromArgument, "__PRIVATE_fieldPathFromArgument");
var k = new RegExp("[~\\*/\\[\\]]");
function __PRIVATE_fieldPathFromDotSeparatedString(e, t, r) {
  if (t.search(k) >= 0)
    throw createError(
      `Invalid field path (${t}). Paths must not contain '~', '*', '/', '[', or ']'`,
      e,
      /* hasConverter= */
      false,
      /* path= */
      void 0,
      r,
    );
  try {
    return new FieldPath(...t.split("."))._internalPath;
  } catch (n) {
    throw createError(
      `Invalid field path (${t}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,
      e,
      /* hasConverter= */
      false,
      /* path= */
      void 0,
      r,
    );
  }
}
__name(
  __PRIVATE_fieldPathFromDotSeparatedString,
  "__PRIVATE_fieldPathFromDotSeparatedString",
);
function createError(e, t, r, n, i) {
  const s = n && !n.isEmpty(),
    o = void 0 !== i;
  let a = `Function ${t}() called with invalid data`;
  (r && (a += " (via `toFirestore()`)"), (a += ". "));
  let u = "";
  return (
    (s || o) &&
      ((u += " (found"),
      s && (u += ` in field ${n}`),
      o && (u += ` in document ${i}`),
      (u += ")")),
    new FirestoreError(d.INVALID_ARGUMENT, a + e + u)
  );
}
__name(createError, "createError");
function __PRIVATE_fieldMaskContains(e, t) {
  return e.some((e2) => e2.isEqual(t));
}
__name(__PRIVATE_fieldMaskContains, "__PRIVATE_fieldMaskContains");
var DocumentSnapshot = class {
  static {
    __name(this, "DocumentSnapshot");
  }
  // Note: This class is stripped down version of the DocumentSnapshot in
  // the legacy SDK. The changes are:
  // - No support for SnapshotMetadata.
  // - No support for SnapshotOptions.
  /** @hideconstructor protected */
  constructor(e, t, r, n, i) {
    ((this._firestore = e),
      (this._userDataWriter = t),
      (this._key = r),
      (this._document = n),
      (this._converter = i));
  }
  /** Property of the `DocumentSnapshot` that provides the document's ID. */
  get id() {
    return this._key.path.lastSegment();
  }
  /**
   * The `DocumentReference` for the document included in the `DocumentSnapshot`.
   */
  get ref() {
    return new DocumentReference(this._firestore, this._converter, this._key);
  }
  /**
   * Signals whether or not the document at the snapshot's location exists.
   *
   * @returns true if the document exists.
   */
  exists() {
    return null !== this._document;
  }
  /**
   * Retrieves all fields in the document as an `Object`. Returns `undefined` if
   * the document doesn't exist.
   *
   * @returns An `Object` containing all fields in the document or `undefined`
   * if the document doesn't exist.
   */
  data() {
    if (this._document) {
      if (this._converter) {
        const e = new QueryDocumentSnapshot(
          this._firestore,
          this._userDataWriter,
          this._key,
          this._document,
          /* converter= */
          null,
        );
        return this._converter.fromFirestore(e);
      }
      return this._userDataWriter.convertValue(this._document.data.value);
    }
  }
  /**
   * @internal
   * @private
   *
   * Retrieves all fields in the document as a proto Value. Returns `undefined` if
   * the document doesn't exist.
   *
   * @returns An `Object` containing all fields in the document or `undefined`
   * if the document doesn't exist.
   */
  _fieldsProto() {
    return this._document?.data.clone().value.mapValue.fields ?? void 0;
  }
  /**
   * Retrieves the field specified by `fieldPath`. Returns `undefined` if the
   * document or field doesn't exist.
   *
   * @param fieldPath - The path (for example 'foo' or 'foo.bar') to a specific
   * field.
   * @returns The data at the specified field location or undefined if no such
   * field exists in the document.
   */
  // We are using `any` here to avoid an explicit cast by our users.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(e) {
    if (this._document) {
      const t = this._document.data.field(
        __PRIVATE_fieldPathFromArgument("DocumentSnapshot.get", e),
      );
      if (null !== t) return this._userDataWriter.convertValue(t);
    }
  }
};
var QueryDocumentSnapshot = class extends DocumentSnapshot {
  static {
    __name(this, "QueryDocumentSnapshot");
  }
  /**
   * Retrieves all fields in the document as an `Object`.
   *
   * @override
   * @returns An `Object` containing all fields in the document.
   */
  data() {
    return super.data();
  }
};
var AbstractUserDataWriter = class {
  static {
    __name(this, "AbstractUserDataWriter");
  }
  convertValue(e, t = "none") {
    switch (__PRIVATE_typeOrder(e)) {
      case 0:
        return null;
      case 1:
        return e.booleanValue;
      case 2:
        return __PRIVATE_normalizeNumber(e.integerValue || e.doubleValue);
      case 3:
        return this.convertTimestamp(e.timestampValue);
      case 4:
        return this.convertServerTimestamp(e, t);
      case 5:
        return e.stringValue;
      case 6:
        return this.convertBytes(__PRIVATE_normalizeByteString(e.bytesValue));
      case 7:
        return this.convertReference(e.referenceValue);
      case 8:
        return this.convertGeoPoint(e.geoPointValue);
      case 9:
        return this.convertArray(e.arrayValue, t);
      case 11:
        return this.convertObject(e.mapValue, t);
      case 10:
        return this.convertVectorValue(e.mapValue);
      default:
        throw fail(62114, {
          value: e,
        });
    }
  }
  convertObject(e, t) {
    return this.convertObjectMap(e.fields, t);
  }
  /**
   * @internal
   */
  convertObjectMap(e, t = "none") {
    const r = {};
    return (
      forEach(e, (e2, n) => {
        r[e2] = this.convertValue(n, t);
      }),
      r
    );
  }
  /**
   * @internal
   */
  convertVectorValue(e) {
    const t = e.fields?.[C].arrayValue?.values?.map((e2) =>
      __PRIVATE_normalizeNumber(e2.doubleValue),
    );
    return new VectorValue(t);
  }
  convertGeoPoint(e) {
    return new GeoPoint(
      __PRIVATE_normalizeNumber(e.latitude),
      __PRIVATE_normalizeNumber(e.longitude),
    );
  }
  convertArray(e, t) {
    return (e.values || []).map((e2) => this.convertValue(e2, t));
  }
  convertServerTimestamp(e, t) {
    switch (t) {
      case "previous":
        const r = __PRIVATE_getPreviousValue(e);
        return null == r ? null : this.convertValue(r, t);
      case "estimate":
        return this.convertTimestamp(__PRIVATE_getLocalWriteTime(e));
      default:
        return null;
    }
  }
  convertTimestamp(e) {
    const t = __PRIVATE_normalizeTimestamp(e);
    return new Timestamp(t.seconds, t.nanos);
  }
  convertDocumentKey(e, t) {
    const r = ResourcePath.fromString(e);
    __PRIVATE_hardAssert(__PRIVATE_isValidResourceName(r), 9688, {
      name: e,
    });
    const n = new DatabaseId(r.get(1), r.get(3)),
      i = new DocumentKey(r.popFirst(5));
    return (
      n.isEqual(t) || // TODO(b/64130202): Somehow support foreign references.
        __PRIVATE_logError(
          `Document ${i} contains a document reference within a different database (${n.projectId}/${n.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`,
        ),
      i
    );
  }
};
var __PRIVATE_LiteUserDataWriter = class extends AbstractUserDataWriter {
  static {
    __name(this, "__PRIVATE_LiteUserDataWriter");
  }
  constructor(e) {
    (super(), (this.firestore = e));
  }
  convertBytes(e) {
    return new Bytes(e);
  }
  convertReference(e) {
    const t = this.convertDocumentKey(e, this.firestore._databaseId);
    return new DocumentReference(
      this.firestore,
      /* converter= */
      null,
      t,
    );
  }
};
function getDoc(e) {
  const t = __PRIVATE_getDatastore(
      (e = __PRIVATE_cast(e, DocumentReference)).firestore,
    ),
    r = new __PRIVATE_LiteUserDataWriter(e.firestore);
  return __PRIVATE_invokeBatchGetDocumentsRpc(t, [e._key]).then((t2) => {
    __PRIVATE_hardAssert(1 === t2.length, 15618);
    const n = t2[0];
    return new DocumentSnapshot(
      e.firestore,
      r,
      e._key,
      n.isFoundDocument() ? n : null,
      e.converter,
    );
  });
}
__name(getDoc, "getDoc");
function updateDoc(e, t, r, ...n) {
  const i = __PRIVATE_newUserDataReader(
    (e = __PRIVATE_cast(e, DocumentReference)).firestore,
  );
  let s;
  s =
    "string" == typeof (t = getModularInstance(t)) || t instanceof FieldPath
      ? __PRIVATE_parseUpdateVarargs(i, "updateDoc", e._key, t, r, n)
      : __PRIVATE_parseUpdateData(i, "updateDoc", e._key, t);
  return __PRIVATE_invokeCommitRpc(__PRIVATE_getDatastore(e.firestore), [
    s.toMutation(e._key, Precondition.exists(true)),
  ]);
}
__name(updateDoc, "updateDoc");

// ../node_modules/@firebase/firestore/dist/lite/index.browser.esm.js
var _t = "4.16.0";
!/* @__PURE__ */ __name(function __PRIVATE_registerFirestore() {
  (__PRIVATE_setSDKVersion(`${SDK_VERSION}_lite`),
    _registerComponent(
      new Component(
        "firestore/lite",
        (t, { instanceIdentifier: e, options: i }) => {
          const a = t.getProvider("app").getImmediate(),
            r = new Firestore(
              new __PRIVATE_LiteAuthCredentialsProvider(
                t.getProvider("auth-internal"),
              ),
              new __PRIVATE_LiteAppCheckTokenProvider(
                a,
                t.getProvider("app-check-internal"),
              ),
              __PRIVATE_databaseIdFromApp(a, e),
              a,
            );
          return (i && r._setSettings(i), r);
        },
        "PUBLIC",
      ).setMultipleInstances(true),
    ), // RUNTIME_ENV and BUILD_TARGET are replaced by real values during the compilation
    registerVersion("firestore-lite", _t, ""),
    registerVersion("firestore-lite", _t, "esm2020"));
}, "__PRIVATE_registerFirestore")();

// ../node_modules/@firebase/auth/dist/esm/index-d90d2ee5.js
function _prodErrorMap() {
  return {
    ["dependent-sdk-initialized-before-auth"]:
      /* AuthErrorCode.DEPENDENT_SDK_INIT_BEFORE_AUTH */
      "Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK.",
  };
}
__name(_prodErrorMap, "_prodErrorMap");
var prodErrorMap = _prodErrorMap;
var _DEFAULT_AUTH_ERROR_FACTORY = new ErrorFactory(
  "auth",
  "Firebase",
  _prodErrorMap(),
);
var logClient = new Logger("@firebase/auth");
function _logWarn(msg, ...args) {
  if (logClient.logLevel <= LogLevel.WARN) {
    logClient.warn(`Auth (${SDK_VERSION}): ${msg}`, ...args);
  }
}
__name(_logWarn, "_logWarn");
function _logError(msg, ...args) {
  if (logClient.logLevel <= LogLevel.ERROR) {
    logClient.error(`Auth (${SDK_VERSION}): ${msg}`, ...args);
  }
}
__name(_logError, "_logError");
function _fail(authOrCode, ...rest) {
  throw createErrorInternal(authOrCode, ...rest);
}
__name(_fail, "_fail");
function _createError(authOrCode, ...rest) {
  return createErrorInternal(authOrCode, ...rest);
}
__name(_createError, "_createError");
function _errorWithCustomMessage(auth, code, message) {
  const errorMap = {
    ...prodErrorMap(),
    [code]: message,
  };
  const factory = new ErrorFactory("auth", "Firebase", errorMap);
  return factory.create(code, {
    appName: auth.name,
  });
}
__name(_errorWithCustomMessage, "_errorWithCustomMessage");
function _serverAppCurrentUserOperationNotSupportedError(auth) {
  return _errorWithCustomMessage(
    auth,
    "operation-not-supported-in-this-environment",
    "Operations that alter the current user are not supported in conjunction with FirebaseServerApp",
  );
}
__name(
  _serverAppCurrentUserOperationNotSupportedError,
  "_serverAppCurrentUserOperationNotSupportedError",
);
function createErrorInternal(authOrCode, ...rest) {
  if (typeof authOrCode !== "string") {
    const code = rest[0];
    const fullParams = [...rest.slice(1)];
    if (fullParams[0]) {
      fullParams[0].appName = authOrCode.name;
    }
    return authOrCode._errorFactory.create(code, ...fullParams);
  }
  return _DEFAULT_AUTH_ERROR_FACTORY.create(authOrCode, ...rest);
}
__name(createErrorInternal, "createErrorInternal");
function _assert(assertion, authOrCode, ...rest) {
  if (!assertion) {
    throw createErrorInternal(authOrCode, ...rest);
  }
}
__name(_assert, "_assert");
function debugFail(failure) {
  const message = `INTERNAL ASSERTION FAILED: ` + failure;
  _logError(message);
  throw new Error(message);
}
__name(debugFail, "debugFail");
function debugAssert(assertion, message) {
  if (!assertion) {
    debugFail(message);
  }
}
__name(debugAssert, "debugAssert");
function _getCurrentUrl() {
  return (typeof self !== "undefined" && self.location?.href) || "";
}
__name(_getCurrentUrl, "_getCurrentUrl");
function _isHttpOrHttps() {
  return _getCurrentScheme() === "http:" || _getCurrentScheme() === "https:";
}
__name(_isHttpOrHttps, "_isHttpOrHttps");
function _getCurrentScheme() {
  return (typeof self !== "undefined" && self.location?.protocol) || null;
}
__name(_getCurrentScheme, "_getCurrentScheme");
function _isOnline() {
  if (
    typeof navigator !== "undefined" &&
    navigator &&
    "onLine" in navigator &&
    typeof navigator.onLine === "boolean" && // Apply only for traditional web apps and Chrome extensions.
    // This is especially true for Cordova apps which have unreliable
    // navigator.onLine behavior unless cordova-plugin-network-information is
    // installed which overwrites the native navigator.onLine value and
    // defines navigator.connection.
    (_isHttpOrHttps() || isBrowserExtension() || "connection" in navigator)
  ) {
    return navigator.onLine;
  }
  return true;
}
__name(_isOnline, "_isOnline");
function _getUserLanguage() {
  if (typeof navigator === "undefined") {
    return null;
  }
  const navigatorLanguage = navigator;
  return (
    // Most reliable, but only supported in Chrome/Firefox.
    (navigatorLanguage.languages && navigatorLanguage.languages[0]) || // Supported in most browsers, but returns the language of the browser
    // UI, not the language set in browser settings.
    navigatorLanguage.language || // Couldn't determine language.
    null
  );
}
__name(_getUserLanguage, "_getUserLanguage");
var Delay = class {
  static {
    __name(this, "Delay");
  }
  constructor(shortDelay, longDelay) {
    this.shortDelay = shortDelay;
    this.longDelay = longDelay;
    debugAssert(
      longDelay > shortDelay,
      "Short delay should be less than long delay!",
    );
    this.isMobile = isMobileCordova() || isReactNative();
  }
  get() {
    if (!_isOnline()) {
      return Math.min(5e3, this.shortDelay);
    }
    return this.isMobile ? this.longDelay : this.shortDelay;
  }
};
function _emulatorUrl(config, path) {
  debugAssert(config.emulator, "Emulator should always be set here");
  const { url } = config.emulator;
  if (!path) {
    return url;
  }
  return `${url}${path.startsWith("/") ? path.slice(1) : path}`;
}
__name(_emulatorUrl, "_emulatorUrl");
var FetchProvider = class {
  static {
    __name(this, "FetchProvider");
  }
  static initialize(fetchImpl, headersImpl, responseImpl) {
    this.fetchImpl = fetchImpl;
    if (headersImpl) {
      this.headersImpl = headersImpl;
    }
    if (responseImpl) {
      this.responseImpl = responseImpl;
    }
  }
  static fetch() {
    if (this.fetchImpl) {
      return this.fetchImpl;
    }
    if (typeof self !== "undefined" && "fetch" in self) {
      return self.fetch;
    }
    if (typeof globalThis !== "undefined" && globalThis.fetch) {
      return globalThis.fetch;
    }
    if (typeof fetch !== "undefined") {
      return fetch;
    }
    debugFail(
      "Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill",
    );
  }
  static headers() {
    if (this.headersImpl) {
      return this.headersImpl;
    }
    if (typeof self !== "undefined" && "Headers" in self) {
      return self.Headers;
    }
    if (typeof globalThis !== "undefined" && globalThis.Headers) {
      return globalThis.Headers;
    }
    if (typeof Headers !== "undefined") {
      return Headers;
    }
    debugFail(
      "Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill",
    );
  }
  static response() {
    if (this.responseImpl) {
      return this.responseImpl;
    }
    if (typeof self !== "undefined" && "Response" in self) {
      return self.Response;
    }
    if (typeof globalThis !== "undefined" && globalThis.Response) {
      return globalThis.Response;
    }
    if (typeof Response !== "undefined") {
      return Response;
    }
    debugFail(
      "Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill",
    );
  }
};
var SERVER_ERROR_MAP = {
  // Custom token errors.
  ["CREDENTIAL_MISMATCH"]:
    /* ServerError.CREDENTIAL_MISMATCH */
    "custom-token-mismatch",
  // This can only happen if the SDK sends a bad request.
  ["MISSING_CUSTOM_TOKEN"]:
    /* ServerError.MISSING_CUSTOM_TOKEN */
    "internal-error",
  // Create Auth URI errors.
  ["INVALID_IDENTIFIER"]:
    /* ServerError.INVALID_IDENTIFIER */
    "invalid-email",
  // This can only happen if the SDK sends a bad request.
  ["MISSING_CONTINUE_URI"]:
    /* ServerError.MISSING_CONTINUE_URI */
    "internal-error",
  // Sign in with email and password errors (some apply to sign up too).
  ["INVALID_PASSWORD"]:
    /* ServerError.INVALID_PASSWORD */
    "wrong-password",
  // This can only happen if the SDK sends a bad request.
  ["MISSING_PASSWORD"]:
    /* ServerError.MISSING_PASSWORD */
    "missing-password",
  // Thrown if Email Enumeration Protection is enabled in the project and the email or password is
  // invalid.
  ["INVALID_LOGIN_CREDENTIALS"]:
    /* ServerError.INVALID_LOGIN_CREDENTIALS */
    "invalid-credential",
  // Sign up with email and password errors.
  ["EMAIL_EXISTS"]:
    /* ServerError.EMAIL_EXISTS */
    "email-already-in-use",
  ["PASSWORD_LOGIN_DISABLED"]:
    /* ServerError.PASSWORD_LOGIN_DISABLED */
    "operation-not-allowed",
  // Verify assertion for sign in with credential errors:
  ["INVALID_IDP_RESPONSE"]:
    /* ServerError.INVALID_IDP_RESPONSE */
    "invalid-credential",
  ["INVALID_PENDING_TOKEN"]:
    /* ServerError.INVALID_PENDING_TOKEN */
    "invalid-credential",
  ["FEDERATED_USER_ID_ALREADY_LINKED"]:
    /* ServerError.FEDERATED_USER_ID_ALREADY_LINKED */
    "credential-already-in-use",
  // This can only happen if the SDK sends a bad request.
  ["MISSING_REQ_TYPE"]:
    /* ServerError.MISSING_REQ_TYPE */
    "internal-error",
  // Send Password reset email errors:
  ["EMAIL_NOT_FOUND"]:
    /* ServerError.EMAIL_NOT_FOUND */
    "user-not-found",
  ["RESET_PASSWORD_EXCEED_LIMIT"]:
    /* ServerError.RESET_PASSWORD_EXCEED_LIMIT */
    "too-many-requests",
  ["EXPIRED_OOB_CODE"]:
    /* ServerError.EXPIRED_OOB_CODE */
    "expired-action-code",
  ["INVALID_OOB_CODE"]:
    /* ServerError.INVALID_OOB_CODE */
    "invalid-action-code",
  // This can only happen if the SDK sends a bad request.
  ["MISSING_OOB_CODE"]:
    /* ServerError.MISSING_OOB_CODE */
    "internal-error",
  // Operations that require ID token in request:
  ["CREDENTIAL_TOO_OLD_LOGIN_AGAIN"]:
    /* ServerError.CREDENTIAL_TOO_OLD_LOGIN_AGAIN */
    "requires-recent-login",
  ["INVALID_ID_TOKEN"]:
    /* ServerError.INVALID_ID_TOKEN */
    "invalid-user-token",
  ["TOKEN_EXPIRED"]:
    /* ServerError.TOKEN_EXPIRED */
    "user-token-expired",
  ["USER_NOT_FOUND"]:
    /* ServerError.USER_NOT_FOUND */
    "user-token-expired",
  // Other errors.
  ["TOO_MANY_ATTEMPTS_TRY_LATER"]:
    /* ServerError.TOO_MANY_ATTEMPTS_TRY_LATER */
    "too-many-requests",
  ["PASSWORD_DOES_NOT_MEET_REQUIREMENTS"]:
    /* ServerError.PASSWORD_DOES_NOT_MEET_REQUIREMENTS */
    "password-does-not-meet-requirements",
  // Phone Auth related errors.
  ["INVALID_CODE"]:
    /* ServerError.INVALID_CODE */
    "invalid-verification-code",
  ["INVALID_SESSION_INFO"]:
    /* ServerError.INVALID_SESSION_INFO */
    "invalid-verification-id",
  ["INVALID_TEMPORARY_PROOF"]:
    /* ServerError.INVALID_TEMPORARY_PROOF */
    "invalid-credential",
  ["MISSING_SESSION_INFO"]:
    /* ServerError.MISSING_SESSION_INFO */
    "missing-verification-id",
  ["SESSION_EXPIRED"]:
    /* ServerError.SESSION_EXPIRED */
    "code-expired",
  // Other action code errors when additional settings passed.
  // MISSING_CONTINUE_URI is getting mapped to INTERNAL_ERROR above.
  // This is OK as this error will be caught by client side validation.
  ["MISSING_ANDROID_PACKAGE_NAME"]:
    /* ServerError.MISSING_ANDROID_PACKAGE_NAME */
    "missing-android-pkg-name",
  ["UNAUTHORIZED_DOMAIN"]:
    /* ServerError.UNAUTHORIZED_DOMAIN */
    "unauthorized-continue-uri",
  // getProjectConfig errors when clientId is passed.
  ["INVALID_OAUTH_CLIENT_ID"]:
    /* ServerError.INVALID_OAUTH_CLIENT_ID */
    "invalid-oauth-client-id",
  // User actions (sign-up or deletion) disabled errors.
  ["ADMIN_ONLY_OPERATION"]:
    /* ServerError.ADMIN_ONLY_OPERATION */
    "admin-restricted-operation",
  // Multi factor related errors.
  ["INVALID_MFA_PENDING_CREDENTIAL"]:
    /* ServerError.INVALID_MFA_PENDING_CREDENTIAL */
    "invalid-multi-factor-session",
  ["MFA_ENROLLMENT_NOT_FOUND"]:
    /* ServerError.MFA_ENROLLMENT_NOT_FOUND */
    "multi-factor-info-not-found",
  ["MISSING_MFA_ENROLLMENT_ID"]:
    /* ServerError.MISSING_MFA_ENROLLMENT_ID */
    "missing-multi-factor-info",
  ["MISSING_MFA_PENDING_CREDENTIAL"]:
    /* ServerError.MISSING_MFA_PENDING_CREDENTIAL */
    "missing-multi-factor-session",
  ["SECOND_FACTOR_EXISTS"]:
    /* ServerError.SECOND_FACTOR_EXISTS */
    "second-factor-already-in-use",
  ["SECOND_FACTOR_LIMIT_EXCEEDED"]:
    /* ServerError.SECOND_FACTOR_LIMIT_EXCEEDED */
    "maximum-second-factor-count-exceeded",
  // Blocking functions related errors.
  ["BLOCKING_FUNCTION_ERROR_RESPONSE"]:
    /* ServerError.BLOCKING_FUNCTION_ERROR_RESPONSE */
    "internal-error",
  // Recaptcha related errors.
  ["RECAPTCHA_NOT_ENABLED"]:
    /* ServerError.RECAPTCHA_NOT_ENABLED */
    "recaptcha-not-enabled",
  ["MISSING_RECAPTCHA_TOKEN"]:
    /* ServerError.MISSING_RECAPTCHA_TOKEN */
    "missing-recaptcha-token",
  ["INVALID_RECAPTCHA_TOKEN"]:
    /* ServerError.INVALID_RECAPTCHA_TOKEN */
    "invalid-recaptcha-token",
  ["INVALID_RECAPTCHA_ACTION"]:
    /* ServerError.INVALID_RECAPTCHA_ACTION */
    "invalid-recaptcha-action",
  ["MISSING_CLIENT_TYPE"]:
    /* ServerError.MISSING_CLIENT_TYPE */
    "missing-client-type",
  ["MISSING_RECAPTCHA_VERSION"]:
    /* ServerError.MISSING_RECAPTCHA_VERSION */
    "missing-recaptcha-version",
  ["INVALID_RECAPTCHA_VERSION"]:
    /* ServerError.INVALID_RECAPTCHA_VERSION */
    "invalid-recaptcha-version",
  ["INVALID_REQ_TYPE"]:
    /* ServerError.INVALID_REQ_TYPE */
    "invalid-req-type",
  /* AuthErrorCode.INVALID_REQ_TYPE */
};
var CookieAuthProxiedEndpoints = [
  "/v1/accounts:signInWithCustomToken",
  "/v1/accounts:signInWithEmailLink",
  "/v1/accounts:signInWithIdp",
  "/v1/accounts:signInWithPassword",
  "/v1/accounts:signInWithPhoneNumber",
  "/v1/token",
  /* Endpoint.TOKEN */
];
var DEFAULT_API_TIMEOUT_MS = new Delay(3e4, 6e4);
function _addTidIfNecessary(auth, request) {
  if (auth.tenantId && !request.tenantId) {
    return {
      ...request,
      tenantId: auth.tenantId,
    };
  }
  return request;
}
__name(_addTidIfNecessary, "_addTidIfNecessary");
async function _performApiRequest(
  auth,
  method,
  path,
  request,
  customErrorMap = {},
) {
  return _performFetchWithErrorHandling(auth, customErrorMap, async () => {
    let body = {};
    let params = {};
    if (request) {
      if (method === "GET") {
        params = request;
      } else {
        body = {
          body: JSON.stringify(request),
        };
      }
    }
    const query2 = querystring({
      ...params,
      key: auth.config.apiKey,
    }).slice(1);
    const headers = await auth._getAdditionalHeaders();
    headers[
      "Content-Type"
      /* HttpHeader.CONTENT_TYPE */
    ] = "application/json";
    if (auth.languageCode) {
      headers[
        "X-Firebase-Locale"
        /* HttpHeader.X_FIREBASE_LOCALE */
      ] = auth.languageCode;
    }
    const fetchArgs = {
      method,
      headers,
      ...body,
    };
    if (!isCloudflareWorker()) {
      fetchArgs.referrerPolicy = "strict-origin-when-cross-origin";
    }
    if (auth.emulatorConfig && isCloudWorkstation(auth.emulatorConfig.host)) {
      fetchArgs.credentials = "include";
    }
    return FetchProvider.fetch()(
      await _getFinalTarget(auth, auth.config.apiHost, path, query2),
      fetchArgs,
    );
  });
}
__name(_performApiRequest, "_performApiRequest");
async function _performFetchWithErrorHandling(auth, customErrorMap, fetchFn) {
  auth._canInitEmulator = false;
  const errorMap = { ...SERVER_ERROR_MAP, ...customErrorMap };
  try {
    const networkTimeout = new NetworkTimeout(auth);
    const response = await Promise.race([fetchFn(), networkTimeout.promise]);
    networkTimeout.clearNetworkTimeout();
    const json = await response.json();
    if ("needConfirmation" in json) {
      throw _makeTaggedError(
        auth,
        "account-exists-with-different-credential",
        json,
      );
    }
    if (response.ok && !("errorMessage" in json)) {
      return json;
    } else {
      const errorMessage = response.ok ? json.errorMessage : json.error.message;
      const [serverErrorCode, serverErrorMessage] = errorMessage.split(" : ");
      if (serverErrorCode === "FEDERATED_USER_ID_ALREADY_LINKED") {
        throw _makeTaggedError(auth, "credential-already-in-use", json);
      } else if (serverErrorCode === "EMAIL_EXISTS") {
        throw _makeTaggedError(auth, "email-already-in-use", json);
      } else if (serverErrorCode === "USER_DISABLED") {
        throw _makeTaggedError(auth, "user-disabled", json);
      }
      const authError =
        errorMap[serverErrorCode] ||
        serverErrorCode.toLowerCase().replace(/[_\s]+/g, "-");
      if (serverErrorMessage) {
        throw _errorWithCustomMessage(auth, authError, serverErrorMessage);
      } else {
        _fail(auth, authError);
      }
    }
  } catch (e) {
    if (e instanceof FirebaseError) {
      throw e;
    }
    _fail(auth, "network-request-failed", { message: String(e) });
  }
}
__name(_performFetchWithErrorHandling, "_performFetchWithErrorHandling");
async function _performSignInRequest(
  auth,
  method,
  path,
  request,
  customErrorMap = {},
) {
  const serverResponse = await _performApiRequest(
    auth,
    method,
    path,
    request,
    customErrorMap,
  );
  if ("mfaPendingCredential" in serverResponse) {
    _fail(auth, "multi-factor-auth-required", {
      _serverResponse: serverResponse,
    });
  }
  return serverResponse;
}
__name(_performSignInRequest, "_performSignInRequest");
async function _getFinalTarget(auth, host, path, query2) {
  const base = `${host}${path}?${query2}`;
  const authInternal = auth;
  const finalTarget = authInternal.config.emulator
    ? _emulatorUrl(auth.config, base)
    : `${auth.config.apiScheme}://${base}`;
  if (CookieAuthProxiedEndpoints.includes(path)) {
    await authInternal._persistenceManagerAvailable;
    if (authInternal._getPersistenceType() === "COOKIE") {
      const cookiePersistence = authInternal._getPersistence();
      return cookiePersistence._getFinalTarget(finalTarget).toString();
    }
  }
  return finalTarget;
}
__name(_getFinalTarget, "_getFinalTarget");
function _parseEnforcementState(enforcementStateStr) {
  switch (enforcementStateStr) {
    case "ENFORCE":
      return "ENFORCE";
    case "AUDIT":
      return "AUDIT";
    case "OFF":
      return "OFF";
    default:
      return "ENFORCEMENT_STATE_UNSPECIFIED";
  }
}
__name(_parseEnforcementState, "_parseEnforcementState");
var NetworkTimeout = class {
  static {
    __name(this, "NetworkTimeout");
  }
  clearNetworkTimeout() {
    clearTimeout(this.timer);
  }
  constructor(auth) {
    this.auth = auth;
    this.timer = null;
    this.promise = new Promise((_, reject) => {
      this.timer = setTimeout(() => {
        return reject(
          _createError(
            this.auth,
            "network-request-failed",
            /* AuthErrorCode.NETWORK_REQUEST_FAILED */
          ),
        );
      }, DEFAULT_API_TIMEOUT_MS.get());
    });
  }
};
function _makeTaggedError(auth, code, response) {
  const errorParams = {
    appName: auth.name,
  };
  if (response.email) {
    errorParams.email = response.email;
  }
  if (response.phoneNumber) {
    errorParams.phoneNumber = response.phoneNumber;
  }
  const error = _createError(auth, code, errorParams);
  error.customData._tokenResponse = response;
  return error;
}
__name(_makeTaggedError, "_makeTaggedError");
function isEnterprise(grecaptcha) {
  return grecaptcha !== void 0 && grecaptcha.enterprise !== void 0;
}
__name(isEnterprise, "isEnterprise");
var RecaptchaConfig = class {
  static {
    __name(this, "RecaptchaConfig");
  }
  constructor(response) {
    this.siteKey = "";
    this.recaptchaEnforcementState = [];
    if (response.recaptchaKey === void 0) {
      throw new Error("recaptchaKey undefined");
    }
    this.siteKey = response.recaptchaKey.split("/")[3];
    this.recaptchaEnforcementState = response.recaptchaEnforcementState;
  }
  /**
   * Returns the reCAPTCHA Enterprise enforcement state for the given provider.
   *
   * @param providerStr - The provider whose enforcement state is to be returned.
   * @returns The reCAPTCHA Enterprise enforcement state for the given provider.
   */
  getProviderEnforcementState(providerStr) {
    if (
      !this.recaptchaEnforcementState ||
      this.recaptchaEnforcementState.length === 0
    ) {
      return null;
    }
    for (const recaptchaEnforcementState of this.recaptchaEnforcementState) {
      if (
        recaptchaEnforcementState.provider &&
        recaptchaEnforcementState.provider === providerStr
      ) {
        return _parseEnforcementState(
          recaptchaEnforcementState.enforcementState,
        );
      }
    }
    return null;
  }
  /**
   * Returns true if the reCAPTCHA Enterprise enforcement state for the provider is set to ENFORCE or AUDIT.
   *
   * @param providerStr - The provider whose enablement state is to be returned.
   * @returns Whether or not reCAPTCHA Enterprise protection is enabled for the given provider.
   */
  isProviderEnabled(providerStr) {
    return (
      this.getProviderEnforcementState(providerStr) === "ENFORCE" ||
      this.getProviderEnforcementState(providerStr) === "AUDIT"
    );
  }
  /**
   * Returns true if reCAPTCHA Enterprise protection is enabled in at least one provider, otherwise
   * returns false.
   *
   * @returns Whether or not reCAPTCHA Enterprise protection is enabled for at least one provider.
   */
  isAnyProviderEnabled() {
    return (
      this.isProviderEnabled(
        "EMAIL_PASSWORD_PROVIDER",
        /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
      ) ||
      this.isProviderEnabled(
        "PHONE_PROVIDER",
        /* RecaptchaAuthProvider.PHONE_PROVIDER */
      )
    );
  }
};
async function getRecaptchaConfig(auth, request) {
  return _performApiRequest(
    auth,
    "GET",
    "/v2/recaptchaConfig",
    _addTidIfNecessary(auth, request),
  );
}
__name(getRecaptchaConfig, "getRecaptchaConfig");
async function deleteAccount(auth, request) {
  return _performApiRequest(auth, "POST", "/v1/accounts:delete", request);
}
__name(deleteAccount, "deleteAccount");
async function getAccountInfo(auth, request) {
  return _performApiRequest(auth, "POST", "/v1/accounts:lookup", request);
}
__name(getAccountInfo, "getAccountInfo");
function utcTimestampToDateString(utcTimestamp) {
  if (!utcTimestamp) {
    return void 0;
  }
  try {
    const date = new Date(Number(utcTimestamp));
    if (!isNaN(date.getTime())) {
      return date.toUTCString();
    }
  } catch (e) {}
  return void 0;
}
__name(utcTimestampToDateString, "utcTimestampToDateString");
async function getIdTokenResult(user, forceRefresh = false) {
  const userInternal = getModularInstance(user);
  const token = await userInternal.getIdToken(forceRefresh);
  const claims = _parseToken(token);
  _assert(
    claims && claims.exp && claims.auth_time && claims.iat,
    userInternal.auth,
    "internal-error",
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  const firebase =
    typeof claims.firebase === "object" ? claims.firebase : void 0;
  const signInProvider = firebase?.["sign_in_provider"];
  return {
    claims,
    token,
    authTime: utcTimestampToDateString(
      secondsStringToMilliseconds(claims.auth_time),
    ),
    issuedAtTime: utcTimestampToDateString(
      secondsStringToMilliseconds(claims.iat),
    ),
    expirationTime: utcTimestampToDateString(
      secondsStringToMilliseconds(claims.exp),
    ),
    signInProvider: signInProvider || null,
    signInSecondFactor: firebase?.["sign_in_second_factor"] || null,
  };
}
__name(getIdTokenResult, "getIdTokenResult");
function secondsStringToMilliseconds(seconds) {
  return Number(seconds) * 1e3;
}
__name(secondsStringToMilliseconds, "secondsStringToMilliseconds");
function _parseToken(token) {
  const [algorithm, payload, signature] = token.split(".");
  if (algorithm === void 0 || payload === void 0 || signature === void 0) {
    _logError("JWT malformed, contained fewer than 3 sections");
    return null;
  }
  try {
    const decoded = base64Decode(payload);
    if (!decoded) {
      _logError("Failed to decode base64 JWT payload");
      return null;
    }
    return JSON.parse(decoded);
  } catch (e) {
    _logError("Caught error parsing JWT payload as JSON", e?.toString());
    return null;
  }
}
__name(_parseToken, "_parseToken");
function _tokenExpiresIn(token) {
  const parsedToken = _parseToken(token);
  _assert(
    parsedToken,
    "internal-error",
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  _assert(
    typeof parsedToken.exp !== "undefined",
    "internal-error",
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  _assert(
    typeof parsedToken.iat !== "undefined",
    "internal-error",
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  return Number(parsedToken.exp) - Number(parsedToken.iat);
}
__name(_tokenExpiresIn, "_tokenExpiresIn");
async function _logoutIfInvalidated(user, promise, bypassAuthState = false) {
  if (bypassAuthState) {
    return promise;
  }
  try {
    return await promise;
  } catch (e) {
    if (e instanceof FirebaseError && isUserInvalidated(e)) {
      if (user.auth.currentUser === user) {
        await user.auth.signOut();
      }
    }
    throw e;
  }
}
__name(_logoutIfInvalidated, "_logoutIfInvalidated");
function isUserInvalidated({ code }) {
  return (
    code === `auth/${"user-disabled"}` ||
    code === `auth/${"user-token-expired"}`
  );
}
__name(isUserInvalidated, "isUserInvalidated");
var ProactiveRefresh = class {
  static {
    __name(this, "ProactiveRefresh");
  }
  constructor(user) {
    this.user = user;
    this.isRunning = false;
    this.timerId = null;
    this.errorBackoff = 3e4;
  }
  _start() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.schedule();
  }
  _stop() {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
    }
  }
  getInterval(wasError) {
    if (wasError) {
      const interval = this.errorBackoff;
      this.errorBackoff = Math.min(
        this.errorBackoff * 2,
        96e4,
        /* Duration.RETRY_BACKOFF_MAX */
      );
      return interval;
    } else {
      this.errorBackoff = 3e4;
      const expTime = this.user.stsTokenManager.expirationTime ?? 0;
      const interval = expTime - Date.now() - 3e5;
      return Math.max(0, interval);
    }
  }
  schedule(wasError = false) {
    if (!this.isRunning) {
      return;
    }
    const interval = this.getInterval(wasError);
    this.timerId = setTimeout(async () => {
      await this.iteration();
    }, interval);
  }
  async iteration() {
    try {
      await this.user.getIdToken(true);
    } catch (e) {
      if (e?.code === `auth/${"network-request-failed"}`) {
        this.schedule(
          /* wasError */
          true,
        );
      }
      return;
    }
    this.schedule();
  }
};
var UserMetadata = class {
  static {
    __name(this, "UserMetadata");
  }
  constructor(createdAt, lastLoginAt) {
    this.createdAt = createdAt;
    this.lastLoginAt = lastLoginAt;
    this._initializeTime();
  }
  _initializeTime() {
    this.lastSignInTime = utcTimestampToDateString(this.lastLoginAt);
    this.creationTime = utcTimestampToDateString(this.createdAt);
  }
  _copy(metadata) {
    this.createdAt = metadata.createdAt;
    this.lastLoginAt = metadata.lastLoginAt;
    this._initializeTime();
  }
  toJSON() {
    return {
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
    };
  }
};
async function _reloadWithoutSaving(user) {
  const auth = user.auth;
  const idToken = await user.getIdToken();
  const response = await _logoutIfInvalidated(
    user,
    getAccountInfo(auth, { idToken }),
  );
  _assert(
    response?.users.length,
    auth,
    "internal-error",
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  const coreAccount = response.users[0];
  user._notifyReloadListener(coreAccount);
  const newProviderData = coreAccount.providerUserInfo?.length
    ? extractProviderData(coreAccount.providerUserInfo)
    : [];
  const providerData = mergeProviderData(user.providerData, newProviderData);
  const oldIsAnonymous = user.isAnonymous;
  const newIsAnonymous =
    !(user.email && coreAccount.passwordHash) && !providerData?.length;
  const isAnonymous = !oldIsAnonymous ? false : newIsAnonymous;
  const updates = {
    uid: coreAccount.localId,
    displayName: coreAccount.displayName || null,
    photoURL: coreAccount.photoUrl || null,
    email: coreAccount.email || null,
    emailVerified: coreAccount.emailVerified || false,
    phoneNumber: coreAccount.phoneNumber || null,
    tenantId: coreAccount.tenantId || null,
    providerData,
    metadata: new UserMetadata(coreAccount.createdAt, coreAccount.lastLoginAt),
    isAnonymous,
  };
  Object.assign(user, updates);
}
__name(_reloadWithoutSaving, "_reloadWithoutSaving");
async function reload(user) {
  const userInternal = getModularInstance(user);
  await _reloadWithoutSaving(userInternal);
  await userInternal.auth._persistUserIfCurrent(userInternal);
  userInternal.auth._notifyListenersIfCurrent(userInternal);
}
__name(reload, "reload");
function mergeProviderData(original, newData) {
  const deduped = original.filter(
    (o) => !newData.some((n) => n.providerId === o.providerId),
  );
  return [...deduped, ...newData];
}
__name(mergeProviderData, "mergeProviderData");
function extractProviderData(providers) {
  return providers.map(({ providerId, ...provider }) => {
    return {
      providerId,
      uid: provider.rawId || "",
      displayName: provider.displayName || null,
      email: provider.email || null,
      phoneNumber: provider.phoneNumber || null,
      photoURL: provider.photoUrl || null,
    };
  });
}
__name(extractProviderData, "extractProviderData");
async function requestStsToken(auth, refreshToken) {
  const response = await _performFetchWithErrorHandling(auth, {}, async () => {
    const body = querystring({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).slice(1);
    const { tokenApiHost, apiKey } = auth.config;
    const url = await _getFinalTarget(
      auth,
      tokenApiHost,
      "/v1/token",
      `key=${apiKey}`,
    );
    const headers = await auth._getAdditionalHeaders();
    headers[
      "Content-Type"
      /* HttpHeader.CONTENT_TYPE */
    ] = "application/x-www-form-urlencoded";
    const options = {
      method: "POST",
      headers,
      body,
    };
    if (auth.emulatorConfig && isCloudWorkstation(auth.emulatorConfig.host)) {
      options.credentials = "include";
    }
    return FetchProvider.fetch()(url, options);
  });
  return {
    accessToken: response.access_token,
    expiresIn: response.expires_in,
    refreshToken: response.refresh_token,
  };
}
__name(requestStsToken, "requestStsToken");
async function revokeToken(auth, request) {
  return _performApiRequest(
    auth,
    "POST",
    "/v2/accounts:revokeToken",
    _addTidIfNecessary(auth, request),
  );
}
__name(revokeToken, "revokeToken");
var StsTokenManager = class _StsTokenManager {
  static {
    __name(this, "StsTokenManager");
  }
  constructor() {
    this.refreshToken = null;
    this.accessToken = null;
    this.expirationTime = null;
  }
  get isExpired() {
    return !this.expirationTime || Date.now() > this.expirationTime - 3e4;
  }
  updateFromServerResponse(response) {
    _assert(
      response.idToken,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    _assert(
      typeof response.idToken !== "undefined",
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    _assert(
      typeof response.refreshToken !== "undefined",
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const expiresIn =
      "expiresIn" in response && typeof response.expiresIn !== "undefined"
        ? Number(response.expiresIn)
        : _tokenExpiresIn(response.idToken);
    this.updateTokensAndExpiration(
      response.idToken,
      response.refreshToken,
      expiresIn,
    );
  }
  updateFromIdToken(idToken) {
    _assert(
      idToken.length !== 0,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const expiresIn = _tokenExpiresIn(idToken);
    this.updateTokensAndExpiration(idToken, null, expiresIn);
  }
  async getToken(auth, forceRefresh = false) {
    if (!forceRefresh && this.accessToken && !this.isExpired) {
      return this.accessToken;
    }
    _assert(
      this.refreshToken,
      auth,
      "user-token-expired",
      /* AuthErrorCode.TOKEN_EXPIRED */
    );
    if (this.refreshToken) {
      await this.refresh(auth, this.refreshToken);
      return this.accessToken;
    }
    return null;
  }
  clearRefreshToken() {
    this.refreshToken = null;
  }
  async refresh(auth, oldToken) {
    const { accessToken, refreshToken, expiresIn } = await requestStsToken(
      auth,
      oldToken,
    );
    this.updateTokensAndExpiration(
      accessToken,
      refreshToken,
      Number(expiresIn),
    );
  }
  updateTokensAndExpiration(accessToken, refreshToken, expiresInSec) {
    this.refreshToken = refreshToken || null;
    this.accessToken = accessToken || null;
    this.expirationTime = Date.now() + expiresInSec * 1e3;
  }
  static fromJSON(appName, object) {
    const { refreshToken, accessToken, expirationTime } = object;
    const manager = new _StsTokenManager();
    if (refreshToken) {
      _assert(typeof refreshToken === "string", "internal-error", {
        appName,
      });
      manager.refreshToken = refreshToken;
    }
    if (accessToken) {
      _assert(typeof accessToken === "string", "internal-error", {
        appName,
      });
      manager.accessToken = accessToken;
    }
    if (expirationTime) {
      _assert(typeof expirationTime === "number", "internal-error", {
        appName,
      });
      manager.expirationTime = expirationTime;
    }
    return manager;
  }
  toJSON() {
    return {
      refreshToken: this.refreshToken,
      accessToken: this.accessToken,
      expirationTime: this.expirationTime,
    };
  }
  _assign(stsTokenManager) {
    this.accessToken = stsTokenManager.accessToken;
    this.refreshToken = stsTokenManager.refreshToken;
    this.expirationTime = stsTokenManager.expirationTime;
  }
  _clone() {
    return Object.assign(new _StsTokenManager(), this.toJSON());
  }
  _performRefresh() {
    return debugFail("not implemented");
  }
};
function assertStringOrUndefined(assertion, appName) {
  _assert(
    typeof assertion === "string" || typeof assertion === "undefined",
    "internal-error",
    { appName },
  );
}
__name(assertStringOrUndefined, "assertStringOrUndefined");
var UserImpl = class _UserImpl {
  static {
    __name(this, "UserImpl");
  }
  constructor({ uid, auth, stsTokenManager, ...opt }) {
    this.providerId = "firebase";
    this.proactiveRefresh = new ProactiveRefresh(this);
    this.reloadUserInfo = null;
    this.reloadListener = null;
    this.uid = uid;
    this.auth = auth;
    this.stsTokenManager = stsTokenManager;
    this.accessToken = stsTokenManager.accessToken;
    this.displayName = opt.displayName || null;
    this.email = opt.email || null;
    this.emailVerified = opt.emailVerified || false;
    this.phoneNumber = opt.phoneNumber || null;
    this.photoURL = opt.photoURL || null;
    this.isAnonymous = opt.isAnonymous || false;
    this.tenantId = opt.tenantId || null;
    this.providerData = opt.providerData ? [...opt.providerData] : [];
    this.metadata = new UserMetadata(
      opt.createdAt || void 0,
      opt.lastLoginAt || void 0,
    );
  }
  async getIdToken(forceRefresh) {
    const accessToken = await _logoutIfInvalidated(
      this,
      this.stsTokenManager.getToken(this.auth, forceRefresh),
    );
    _assert(
      accessToken,
      this.auth,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    if (this.accessToken !== accessToken) {
      this.accessToken = accessToken;
      await this.auth._persistUserIfCurrent(this);
      this.auth._notifyListenersIfCurrent(this);
    }
    return accessToken;
  }
  getIdTokenResult(forceRefresh) {
    return getIdTokenResult(this, forceRefresh);
  }
  reload() {
    return reload(this);
  }
  _assign(user) {
    if (this === user) {
      return;
    }
    _assert(
      this.uid === user.uid,
      this.auth,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    this.displayName = user.displayName;
    this.photoURL = user.photoURL;
    this.email = user.email;
    this.emailVerified = user.emailVerified;
    this.phoneNumber = user.phoneNumber;
    this.isAnonymous = user.isAnonymous;
    this.tenantId = user.tenantId;
    this.providerData = user.providerData.map((userInfo) => ({ ...userInfo }));
    this.metadata._copy(user.metadata);
    this.stsTokenManager._assign(user.stsTokenManager);
  }
  _clone(auth) {
    const newUser = new _UserImpl({
      ...this,
      auth,
      stsTokenManager: this.stsTokenManager._clone(),
    });
    newUser.metadata._copy(this.metadata);
    return newUser;
  }
  _onReload(callback) {
    _assert(
      !this.reloadListener,
      this.auth,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    this.reloadListener = callback;
    if (this.reloadUserInfo) {
      this._notifyReloadListener(this.reloadUserInfo);
      this.reloadUserInfo = null;
    }
  }
  _notifyReloadListener(userInfo) {
    if (this.reloadListener) {
      this.reloadListener(userInfo);
    } else {
      this.reloadUserInfo = userInfo;
    }
  }
  _startProactiveRefresh() {
    this.proactiveRefresh._start();
  }
  _stopProactiveRefresh() {
    this.proactiveRefresh._stop();
  }
  async _updateTokensIfNecessary(response, reload2 = false) {
    let tokensRefreshed = false;
    if (
      response.idToken &&
      response.idToken !== this.stsTokenManager.accessToken
    ) {
      this.stsTokenManager.updateFromServerResponse(response);
      tokensRefreshed = true;
    }
    if (reload2) {
      await _reloadWithoutSaving(this);
    }
    await this.auth._persistUserIfCurrent(this);
    if (tokensRefreshed) {
      this.auth._notifyListenersIfCurrent(this);
    }
  }
  async delete() {
    if (_isFirebaseServerApp(this.auth.app)) {
      return Promise.reject(
        _serverAppCurrentUserOperationNotSupportedError(this.auth),
      );
    }
    const idToken = await this.getIdToken();
    await _logoutIfInvalidated(this, deleteAccount(this.auth, { idToken }));
    this.stsTokenManager.clearRefreshToken();
    return this.auth.signOut();
  }
  toJSON() {
    return {
      uid: this.uid,
      email: this.email || void 0,
      emailVerified: this.emailVerified,
      displayName: this.displayName || void 0,
      isAnonymous: this.isAnonymous,
      photoURL: this.photoURL || void 0,
      phoneNumber: this.phoneNumber || void 0,
      tenantId: this.tenantId || void 0,
      providerData: this.providerData.map((userInfo) => ({ ...userInfo })),
      stsTokenManager: this.stsTokenManager.toJSON(),
      // Redirect event ID must be maintained in case there is a pending
      // redirect event.
      _redirectEventId: this._redirectEventId,
      ...this.metadata.toJSON(),
      // Required for compatibility with the legacy SDK (go/firebase-auth-sdk-persistence-parsing):
      apiKey: this.auth.config.apiKey,
      appName: this.auth.name,
      // Missing authDomain will be tolerated by the legacy SDK.
      // stsTokenManager.apiKey isn't actually required (despite the legacy SDK persisting it).
    };
  }
  get refreshToken() {
    return this.stsTokenManager.refreshToken || "";
  }
  static _fromJSON(auth, object) {
    const displayName = object.displayName ?? void 0;
    const email = object.email ?? void 0;
    const phoneNumber = object.phoneNumber ?? void 0;
    const photoURL = object.photoURL ?? void 0;
    const tenantId = object.tenantId ?? void 0;
    const _redirectEventId = object._redirectEventId ?? void 0;
    const createdAt = object.createdAt ?? void 0;
    const lastLoginAt = object.lastLoginAt ?? void 0;
    const {
      uid,
      emailVerified,
      isAnonymous,
      providerData,
      stsTokenManager: plainObjectTokenManager,
    } = object;
    _assert(
      uid && plainObjectTokenManager,
      auth,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const stsTokenManager = StsTokenManager.fromJSON(
      this.name,
      plainObjectTokenManager,
    );
    _assert(
      typeof uid === "string",
      auth,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    assertStringOrUndefined(displayName, auth.name);
    assertStringOrUndefined(email, auth.name);
    _assert(
      typeof emailVerified === "boolean",
      auth,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    _assert(
      typeof isAnonymous === "boolean",
      auth,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    assertStringOrUndefined(phoneNumber, auth.name);
    assertStringOrUndefined(photoURL, auth.name);
    assertStringOrUndefined(tenantId, auth.name);
    assertStringOrUndefined(_redirectEventId, auth.name);
    assertStringOrUndefined(createdAt, auth.name);
    assertStringOrUndefined(lastLoginAt, auth.name);
    const user = new _UserImpl({
      uid,
      auth,
      email,
      emailVerified,
      displayName,
      isAnonymous,
      photoURL,
      phoneNumber,
      tenantId,
      stsTokenManager,
      createdAt,
      lastLoginAt,
    });
    if (providerData && Array.isArray(providerData)) {
      user.providerData = providerData.map((userInfo) => ({ ...userInfo }));
    }
    if (_redirectEventId) {
      user._redirectEventId = _redirectEventId;
    }
    return user;
  }
  /**
   * Initialize a User from an idToken server response
   * @param auth
   * @param idTokenResponse
   */
  static async _fromIdTokenResponse(
    auth,
    idTokenResponse,
    isAnonymous = false,
  ) {
    const stsTokenManager = new StsTokenManager();
    stsTokenManager.updateFromServerResponse(idTokenResponse);
    const user = new _UserImpl({
      uid: idTokenResponse.localId,
      auth,
      stsTokenManager,
      isAnonymous,
    });
    await _reloadWithoutSaving(user);
    return user;
  }
  /**
   * Initialize a User from an idToken server response
   * @param auth
   * @param idTokenResponse
   */
  static async _fromGetAccountInfoResponse(auth, response, idToken) {
    const coreAccount = response.users[0];
    _assert(
      coreAccount.localId !== void 0,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const providerData =
      coreAccount.providerUserInfo !== void 0
        ? extractProviderData(coreAccount.providerUserInfo)
        : [];
    const isAnonymous =
      !(coreAccount.email && coreAccount.passwordHash) && !providerData?.length;
    const stsTokenManager = new StsTokenManager();
    stsTokenManager.updateFromIdToken(idToken);
    const user = new _UserImpl({
      uid: coreAccount.localId,
      auth,
      stsTokenManager,
      isAnonymous,
    });
    const updates = {
      uid: coreAccount.localId,
      displayName: coreAccount.displayName || null,
      photoURL: coreAccount.photoUrl || null,
      email: coreAccount.email || null,
      emailVerified: coreAccount.emailVerified || false,
      phoneNumber: coreAccount.phoneNumber || null,
      tenantId: coreAccount.tenantId || null,
      providerData,
      metadata: new UserMetadata(
        coreAccount.createdAt,
        coreAccount.lastLoginAt,
      ),
      isAnonymous:
        !(coreAccount.email && coreAccount.passwordHash) &&
        !providerData?.length,
    };
    Object.assign(user, updates);
    return user;
  }
};
var instanceCache = /* @__PURE__ */ new Map();
function _getInstance(cls) {
  debugAssert(cls instanceof Function, "Expected a class definition");
  let instance = instanceCache.get(cls);
  if (instance) {
    debugAssert(
      instance instanceof cls,
      "Instance stored in cache mismatched with class",
    );
    return instance;
  }
  instance = new cls();
  instanceCache.set(cls, instance);
  return instance;
}
__name(_getInstance, "_getInstance");
var InMemoryPersistence = class {
  static {
    __name(this, "InMemoryPersistence");
  }
  constructor() {
    this.type = "NONE";
    this.storage = {};
  }
  async _isAvailable() {
    return true;
  }
  async _set(key, value) {
    this.storage[key] = value;
  }
  async _get(key) {
    const value = this.storage[key];
    return value === void 0 ? null : value;
  }
  async _remove(key) {
    delete this.storage[key];
  }
  _addListener(_key, _listener) {
    return;
  }
  _removeListener(_key, _listener) {
    return;
  }
};
InMemoryPersistence.type = "NONE";
var inMemoryPersistence = InMemoryPersistence;
function _persistenceKeyName(key, apiKey, appName) {
  return `${"firebase"}:${key}:${apiKey}:${appName}`;
}
__name(_persistenceKeyName, "_persistenceKeyName");
var PersistenceUserManager = class _PersistenceUserManager {
  static {
    __name(this, "PersistenceUserManager");
  }
  constructor(persistence, auth, userKey) {
    this.persistence = persistence;
    this.auth = auth;
    this.userKey = userKey;
    const { config, name: name4 } = this.auth;
    this.fullUserKey = _persistenceKeyName(this.userKey, config.apiKey, name4);
    this.fullPersistenceKey = _persistenceKeyName(
      "persistence",
      config.apiKey,
      name4,
    );
    this.boundEventHandler = auth._onStorageEvent.bind(auth);
    this.persistence._addListener(this.fullUserKey, this.boundEventHandler);
  }
  setCurrentUser(user) {
    return this.persistence._set(this.fullUserKey, user.toJSON());
  }
  async getCurrentUser() {
    const blob = await this.persistence._get(this.fullUserKey);
    if (!blob) {
      return null;
    }
    if (typeof blob === "string") {
      const response = await getAccountInfo(this.auth, { idToken: blob }).catch(
        () => void 0,
      );
      if (!response) {
        return null;
      }
      return UserImpl._fromGetAccountInfoResponse(this.auth, response, blob);
    }
    return UserImpl._fromJSON(this.auth, blob);
  }
  removeCurrentUser() {
    return this.persistence._remove(this.fullUserKey);
  }
  savePersistenceForRedirect() {
    return this.persistence._set(
      this.fullPersistenceKey,
      this.persistence.type,
    );
  }
  async setPersistence(newPersistence) {
    if (this.persistence === newPersistence) {
      return;
    }
    const currentUser = await this.getCurrentUser();
    await this.removeCurrentUser();
    this.persistence = newPersistence;
    if (currentUser) {
      return this.setCurrentUser(currentUser);
    }
  }
  delete() {
    this.persistence._removeListener(this.fullUserKey, this.boundEventHandler);
  }
  static async create(auth, persistenceHierarchy, userKey = "authUser") {
    if (!persistenceHierarchy.length) {
      return new _PersistenceUserManager(
        _getInstance(inMemoryPersistence),
        auth,
        userKey,
      );
    }
    const availablePersistences = (
      await Promise.all(
        persistenceHierarchy.map(async (persistence) => {
          if (await persistence._isAvailable()) {
            return persistence;
          }
          return void 0;
        }),
      )
    ).filter((persistence) => persistence);
    let selectedPersistence =
      availablePersistences[0] || _getInstance(inMemoryPersistence);
    const key = _persistenceKeyName(userKey, auth.config.apiKey, auth.name);
    let userToMigrate = null;
    for (const persistence of persistenceHierarchy) {
      try {
        const blob = await persistence._get(key);
        if (blob) {
          let user;
          if (typeof blob === "string") {
            const response = await getAccountInfo(auth, {
              idToken: blob,
            }).catch(() => void 0);
            if (!response) {
              break;
            }
            user = await UserImpl._fromGetAccountInfoResponse(
              auth,
              response,
              blob,
            );
          } else {
            user = UserImpl._fromJSON(auth, blob);
          }
          if (persistence !== selectedPersistence) {
            userToMigrate = user;
          }
          selectedPersistence = persistence;
          break;
        }
      } catch {}
    }
    const migrationHierarchy = availablePersistences.filter(
      (p2) => p2._shouldAllowMigration,
    );
    if (
      !selectedPersistence._shouldAllowMigration ||
      !migrationHierarchy.length
    ) {
      return new _PersistenceUserManager(selectedPersistence, auth, userKey);
    }
    selectedPersistence = migrationHierarchy[0];
    if (userToMigrate) {
      await selectedPersistence._set(key, userToMigrate.toJSON());
    }
    await Promise.all(
      persistenceHierarchy.map(async (persistence) => {
        if (persistence !== selectedPersistence) {
          try {
            await persistence._remove(key);
          } catch {}
        }
      }),
    );
    return new _PersistenceUserManager(selectedPersistence, auth, userKey);
  }
};
function _getBrowserName(userAgent) {
  const ua = userAgent.toLowerCase();
  if (ua.includes("opera/") || ua.includes("opr/") || ua.includes("opios/")) {
    return "Opera";
  } else if (_isIEMobile(ua)) {
    return "IEMobile";
  } else if (ua.includes("msie") || ua.includes("trident/")) {
    return "IE";
  } else if (ua.includes("edge/")) {
    return "Edge";
  } else if (_isFirefox(ua)) {
    return "Firefox";
  } else if (ua.includes("silk/")) {
    return "Silk";
  } else if (_isBlackBerry(ua)) {
    return "Blackberry";
  } else if (_isWebOS(ua)) {
    return "Webos";
  } else if (_isSafari(ua)) {
    return "Safari";
  } else if (
    (ua.includes("chrome/") || _isChromeIOS(ua)) &&
    !ua.includes("edge/")
  ) {
    return "Chrome";
  } else if (_isAndroid(ua)) {
    return "Android";
  } else {
    const re = /([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/;
    const matches = userAgent.match(re);
    if (matches?.length === 2) {
      return matches[1];
    }
  }
  return "Other";
}
__name(_getBrowserName, "_getBrowserName");
function _isFirefox(ua = getUA()) {
  return /firefox\//i.test(ua);
}
__name(_isFirefox, "_isFirefox");
function _isSafari(userAgent = getUA()) {
  const ua = userAgent.toLowerCase();
  return (
    ua.includes("safari/") &&
    !ua.includes("chrome/") &&
    !ua.includes("crios/") &&
    !ua.includes("android")
  );
}
__name(_isSafari, "_isSafari");
function _isChromeIOS(ua = getUA()) {
  return /crios\//i.test(ua);
}
__name(_isChromeIOS, "_isChromeIOS");
function _isIEMobile(ua = getUA()) {
  return /iemobile/i.test(ua);
}
__name(_isIEMobile, "_isIEMobile");
function _isAndroid(ua = getUA()) {
  return /android/i.test(ua);
}
__name(_isAndroid, "_isAndroid");
function _isBlackBerry(ua = getUA()) {
  return /blackberry/i.test(ua);
}
__name(_isBlackBerry, "_isBlackBerry");
function _isWebOS(ua = getUA()) {
  return /webos/i.test(ua);
}
__name(_isWebOS, "_isWebOS");
function _isIOS(ua = getUA()) {
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (/macintosh/i.test(ua) && /mobile/i.test(ua))
  );
}
__name(_isIOS, "_isIOS");
function _isIOSStandalone(ua = getUA()) {
  return _isIOS(ua) && !!window.navigator?.standalone;
}
__name(_isIOSStandalone, "_isIOSStandalone");
function _isIE10() {
  return isIE() && document.documentMode === 10;
}
__name(_isIE10, "_isIE10");
function _isMobileBrowser(ua = getUA()) {
  return (
    _isIOS(ua) ||
    _isAndroid(ua) ||
    _isWebOS(ua) ||
    _isBlackBerry(ua) ||
    /windows phone/i.test(ua) ||
    _isIEMobile(ua)
  );
}
__name(_isMobileBrowser, "_isMobileBrowser");
function _getClientVersion(clientPlatform, frameworks = []) {
  let reportedPlatform;
  switch (clientPlatform) {
    case "Browser":
      reportedPlatform = _getBrowserName(getUA());
      break;
    case "Worker":
      reportedPlatform = `${_getBrowserName(getUA())}-${clientPlatform}`;
      break;
    default:
      reportedPlatform = clientPlatform;
  }
  const reportedFrameworks = frameworks.length
    ? frameworks.join(",")
    : "FirebaseCore-web";
  return `${reportedPlatform}/${"JsCore"}/${SDK_VERSION}/${reportedFrameworks}`;
}
__name(_getClientVersion, "_getClientVersion");
var AuthMiddlewareQueue = class {
  static {
    __name(this, "AuthMiddlewareQueue");
  }
  constructor(auth) {
    this.auth = auth;
    this.queue = [];
  }
  pushCallback(callback, onAbort) {
    const wrappedCallback = /* @__PURE__ */ __name(
      (user) =>
        new Promise((resolve, reject) => {
          try {
            const result = callback(user);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        }),
      "wrappedCallback",
    );
    wrappedCallback.onAbort = onAbort;
    this.queue.push(wrappedCallback);
    const index = this.queue.length - 1;
    return () => {
      this.queue[index] = () => Promise.resolve();
    };
  }
  async runMiddleware(nextUser) {
    if (this.auth.currentUser === nextUser) {
      return;
    }
    const onAbortStack = [];
    try {
      for (const beforeStateCallback of this.queue) {
        await beforeStateCallback(nextUser);
        if (beforeStateCallback.onAbort) {
          onAbortStack.push(beforeStateCallback.onAbort);
        }
      }
    } catch (e) {
      onAbortStack.reverse();
      for (const onAbort of onAbortStack) {
        try {
          onAbort();
        } catch (_) {}
      }
      throw this.auth._errorFactory.create("login-blocked", {
        originalMessage: e?.message,
      });
    }
  }
};
async function _getPasswordPolicy(auth, request = {}) {
  return _performApiRequest(
    auth,
    "GET",
    "/v2/passwordPolicy",
    _addTidIfNecessary(auth, request),
  );
}
__name(_getPasswordPolicy, "_getPasswordPolicy");
var MINIMUM_MIN_PASSWORD_LENGTH = 6;
var PasswordPolicyImpl = class {
  static {
    __name(this, "PasswordPolicyImpl");
  }
  constructor(response) {
    const responseOptions = response.customStrengthOptions;
    this.customStrengthOptions = {};
    this.customStrengthOptions.minPasswordLength =
      responseOptions.minPasswordLength ?? MINIMUM_MIN_PASSWORD_LENGTH;
    if (responseOptions.maxPasswordLength) {
      this.customStrengthOptions.maxPasswordLength =
        responseOptions.maxPasswordLength;
    }
    if (responseOptions.containsLowercaseCharacter !== void 0) {
      this.customStrengthOptions.containsLowercaseLetter =
        responseOptions.containsLowercaseCharacter;
    }
    if (responseOptions.containsUppercaseCharacter !== void 0) {
      this.customStrengthOptions.containsUppercaseLetter =
        responseOptions.containsUppercaseCharacter;
    }
    if (responseOptions.containsNumericCharacter !== void 0) {
      this.customStrengthOptions.containsNumericCharacter =
        responseOptions.containsNumericCharacter;
    }
    if (responseOptions.containsNonAlphanumericCharacter !== void 0) {
      this.customStrengthOptions.containsNonAlphanumericCharacter =
        responseOptions.containsNonAlphanumericCharacter;
    }
    this.enforcementState = response.enforcementState;
    if (this.enforcementState === "ENFORCEMENT_STATE_UNSPECIFIED") {
      this.enforcementState = "OFF";
    }
    this.allowedNonAlphanumericCharacters =
      response.allowedNonAlphanumericCharacters?.join("") ?? "";
    this.forceUpgradeOnSignin = response.forceUpgradeOnSignin ?? false;
    this.schemaVersion = response.schemaVersion;
  }
  validatePassword(password) {
    const status = {
      isValid: true,
      passwordPolicy: this,
    };
    this.validatePasswordLengthOptions(password, status);
    this.validatePasswordCharacterOptions(password, status);
    status.isValid && (status.isValid = status.meetsMinPasswordLength ?? true);
    status.isValid && (status.isValid = status.meetsMaxPasswordLength ?? true);
    status.isValid && (status.isValid = status.containsLowercaseLetter ?? true);
    status.isValid && (status.isValid = status.containsUppercaseLetter ?? true);
    status.isValid &&
      (status.isValid = status.containsNumericCharacter ?? true);
    status.isValid &&
      (status.isValid = status.containsNonAlphanumericCharacter ?? true);
    return status;
  }
  /**
   * Validates that the password meets the length options for the policy.
   *
   * @param password Password to validate.
   * @param status Validation status.
   */
  validatePasswordLengthOptions(password, status) {
    const minPasswordLength = this.customStrengthOptions.minPasswordLength;
    const maxPasswordLength = this.customStrengthOptions.maxPasswordLength;
    if (minPasswordLength) {
      status.meetsMinPasswordLength = password.length >= minPasswordLength;
    }
    if (maxPasswordLength) {
      status.meetsMaxPasswordLength = password.length <= maxPasswordLength;
    }
  }
  /**
   * Validates that the password meets the character options for the policy.
   *
   * @param password Password to validate.
   * @param status Validation status.
   */
  validatePasswordCharacterOptions(password, status) {
    this.updatePasswordCharacterOptionsStatuses(
      status,
      /* containsLowercaseCharacter= */
      false,
      /* containsUppercaseCharacter= */
      false,
      /* containsNumericCharacter= */
      false,
      /* containsNonAlphanumericCharacter= */
      false,
    );
    let passwordChar;
    for (let i = 0; i < password.length; i++) {
      passwordChar = password.charAt(i);
      this.updatePasswordCharacterOptionsStatuses(
        status,
        /* containsLowercaseCharacter= */
        passwordChar >= "a" && passwordChar <= "z",
        /* containsUppercaseCharacter= */
        passwordChar >= "A" && passwordChar <= "Z",
        /* containsNumericCharacter= */
        passwordChar >= "0" && passwordChar <= "9",
        /* containsNonAlphanumericCharacter= */
        this.allowedNonAlphanumericCharacters.includes(passwordChar),
      );
    }
  }
  /**
   * Updates the running validation status with the statuses for the character options.
   * Expected to be called each time a character is processed to update each option status
   * based on the current character.
   *
   * @param status Validation status.
   * @param containsLowercaseCharacter Whether the character is a lowercase letter.
   * @param containsUppercaseCharacter Whether the character is an uppercase letter.
   * @param containsNumericCharacter Whether the character is a numeric character.
   * @param containsNonAlphanumericCharacter Whether the character is a non-alphanumeric character.
   */
  updatePasswordCharacterOptionsStatuses(
    status,
    containsLowercaseCharacter,
    containsUppercaseCharacter,
    containsNumericCharacter,
    containsNonAlphanumericCharacter,
  ) {
    if (this.customStrengthOptions.containsLowercaseLetter) {
      status.containsLowercaseLetter ||
        (status.containsLowercaseLetter = containsLowercaseCharacter);
    }
    if (this.customStrengthOptions.containsUppercaseLetter) {
      status.containsUppercaseLetter ||
        (status.containsUppercaseLetter = containsUppercaseCharacter);
    }
    if (this.customStrengthOptions.containsNumericCharacter) {
      status.containsNumericCharacter ||
        (status.containsNumericCharacter = containsNumericCharacter);
    }
    if (this.customStrengthOptions.containsNonAlphanumericCharacter) {
      status.containsNonAlphanumericCharacter ||
        (status.containsNonAlphanumericCharacter =
          containsNonAlphanumericCharacter);
    }
  }
};
var AuthImpl = class {
  static {
    __name(this, "AuthImpl");
  }
  constructor(app, heartbeatServiceProvider, appCheckServiceProvider, config) {
    this.app = app;
    this.heartbeatServiceProvider = heartbeatServiceProvider;
    this.appCheckServiceProvider = appCheckServiceProvider;
    this.config = config;
    this.currentUser = null;
    this.emulatorConfig = null;
    this.operations = Promise.resolve();
    this.authStateSubscription = new Subscription(this);
    this.idTokenSubscription = new Subscription(this);
    this.beforeStateQueue = new AuthMiddlewareQueue(this);
    this.redirectUser = null;
    this.isProactiveRefreshEnabled = false;
    this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION = 1;
    this._canInitEmulator = true;
    this._isInitialized = false;
    this._deleted = false;
    this._initializationPromise = null;
    this._popupRedirectResolver = null;
    this._errorFactory = _DEFAULT_AUTH_ERROR_FACTORY;
    this._agentRecaptchaConfig = null;
    this._tenantRecaptchaConfigs = {};
    this._projectPasswordPolicy = null;
    this._tenantPasswordPolicies = {};
    this._resolvePersistenceManagerAvailable = void 0;
    this.lastNotifiedUid = void 0;
    this.languageCode = null;
    this.tenantId = null;
    this.settings = { appVerificationDisabledForTesting: false };
    this.frameworks = [];
    this.name = app.name;
    this.clientVersion = config.sdkClientVersion;
    this._persistenceManagerAvailable = new Promise(
      (resolve) => (this._resolvePersistenceManagerAvailable = resolve),
    );
  }
  _initializeWithPersistence(persistenceHierarchy, popupRedirectResolver) {
    if (popupRedirectResolver) {
      this._popupRedirectResolver = _getInstance(popupRedirectResolver);
    }
    this._initializationPromise = this.queue(async () => {
      if (this._deleted) {
        return;
      }
      this.persistenceManager = await PersistenceUserManager.create(
        this,
        persistenceHierarchy,
      );
      this._resolvePersistenceManagerAvailable?.();
      if (this._deleted) {
        return;
      }
      if (this._popupRedirectResolver?._shouldInitProactively) {
        try {
          await this._popupRedirectResolver._initialize(this);
        } catch (e) {}
      }
      await this.initializeCurrentUser(popupRedirectResolver);
      this.lastNotifiedUid = this.currentUser?.uid || null;
      if (this._deleted) {
        return;
      }
      this._isInitialized = true;
    });
    return this._initializationPromise;
  }
  /**
   * If the persistence is changed in another window, the user manager will let us know
   */
  async _onStorageEvent() {
    if (this._deleted) {
      return;
    }
    const user = await this.assertedPersistence.getCurrentUser();
    if (!this.currentUser && !user) {
      return;
    }
    if (this.currentUser && user && this.currentUser.uid === user.uid) {
      this._currentUser._assign(user);
      await this.currentUser.getIdToken();
      return;
    }
    await this._updateCurrentUser(
      user,
      /* skipBeforeStateCallbacks */
      true,
    );
  }
  async initializeCurrentUserFromIdToken(idToken) {
    try {
      const response = await getAccountInfo(this, { idToken });
      const user = await UserImpl._fromGetAccountInfoResponse(
        this,
        response,
        idToken,
      );
      await this.directlySetCurrentUser(user);
    } catch (err) {
      console.warn(
        "FirebaseServerApp could not login user with provided authIdToken: ",
        err,
      );
      await this.directlySetCurrentUser(null);
    }
  }
  async initializeCurrentUser(popupRedirectResolver) {
    if (_isFirebaseServerApp(this.app)) {
      const idToken = this.app.settings.authIdToken;
      if (idToken) {
        return new Promise((resolve) => {
          setTimeout(() =>
            this.initializeCurrentUserFromIdToken(idToken).then(
              resolve,
              resolve,
            ),
          );
        });
      } else {
        return this.directlySetCurrentUser(null);
      }
    }
    const previouslyStoredUser =
      await this.assertedPersistence.getCurrentUser();
    let futureCurrentUser = previouslyStoredUser;
    let needsTocheckMiddleware = false;
    if (popupRedirectResolver && this.config.authDomain) {
      await this.getOrInitRedirectPersistenceManager();
      const redirectUserEventId = this.redirectUser?._redirectEventId;
      const storedUserEventId = futureCurrentUser?._redirectEventId;
      const result = await this.tryRedirectSignIn(popupRedirectResolver);
      if (
        (!redirectUserEventId || redirectUserEventId === storedUserEventId) &&
        result?.user
      ) {
        futureCurrentUser = result.user;
        needsTocheckMiddleware = true;
      }
    }
    if (!futureCurrentUser) {
      return this.directlySetCurrentUser(null);
    }
    if (!futureCurrentUser._redirectEventId) {
      if (needsTocheckMiddleware) {
        try {
          await this.beforeStateQueue.runMiddleware(futureCurrentUser);
        } catch (e) {
          futureCurrentUser = previouslyStoredUser;
          this._popupRedirectResolver._overrideRedirectResult(this, () =>
            Promise.reject(e),
          );
        }
      }
      if (futureCurrentUser) {
        return this.reloadAndSetCurrentUserOrClear(futureCurrentUser);
      } else {
        return this.directlySetCurrentUser(null);
      }
    }
    _assert(
      this._popupRedirectResolver,
      this,
      "argument-error",
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    await this.getOrInitRedirectPersistenceManager();
    if (
      this.redirectUser &&
      this.redirectUser._redirectEventId === futureCurrentUser._redirectEventId
    ) {
      return this.directlySetCurrentUser(futureCurrentUser);
    }
    return this.reloadAndSetCurrentUserOrClear(futureCurrentUser);
  }
  async tryRedirectSignIn(redirectResolver) {
    let result = null;
    try {
      result = await this._popupRedirectResolver._completeRedirectFn(
        this,
        redirectResolver,
        true,
      );
    } catch (e) {
      await this._setRedirectUser(null);
    }
    return result;
  }
  async reloadAndSetCurrentUserOrClear(user) {
    try {
      await _reloadWithoutSaving(user);
    } catch (e) {
      if (e?.code !== `auth/${"network-request-failed"}`) {
        return this.directlySetCurrentUser(null);
      }
    }
    return this.directlySetCurrentUser(user);
  }
  useDeviceLanguage() {
    this.languageCode = _getUserLanguage();
  }
  async _delete() {
    this._deleted = true;
  }
  async updateCurrentUser(userExtern) {
    if (_isFirebaseServerApp(this.app)) {
      return Promise.reject(
        _serverAppCurrentUserOperationNotSupportedError(this),
      );
    }
    const user = userExtern ? getModularInstance(userExtern) : null;
    if (user) {
      _assert(
        user.auth.config.apiKey === this.config.apiKey,
        this,
        "invalid-user-token",
        /* AuthErrorCode.INVALID_AUTH */
      );
    }
    return this._updateCurrentUser(user && user._clone(this));
  }
  async _updateCurrentUser(user, skipBeforeStateCallbacks = false) {
    if (this._deleted) {
      return;
    }
    if (user) {
      _assert(
        this.tenantId === user.tenantId,
        this,
        "tenant-id-mismatch",
        /* AuthErrorCode.TENANT_ID_MISMATCH */
      );
    }
    if (!skipBeforeStateCallbacks) {
      await this.beforeStateQueue.runMiddleware(user);
    }
    return this.queue(async () => {
      await this.directlySetCurrentUser(user);
      this.notifyAuthListeners();
    });
  }
  async signOut() {
    if (_isFirebaseServerApp(this.app)) {
      return Promise.reject(
        _serverAppCurrentUserOperationNotSupportedError(this),
      );
    }
    await this.beforeStateQueue.runMiddleware(null);
    if (this.redirectPersistenceManager || this._popupRedirectResolver) {
      await this._setRedirectUser(null);
    }
    return this._updateCurrentUser(
      null,
      /* skipBeforeStateCallbacks */
      true,
    );
  }
  setPersistence(persistence) {
    if (_isFirebaseServerApp(this.app)) {
      return Promise.reject(
        _serverAppCurrentUserOperationNotSupportedError(this),
      );
    }
    return this.queue(async () => {
      await this.assertedPersistence.setPersistence(_getInstance(persistence));
    });
  }
  _getRecaptchaConfig() {
    if (this.tenantId == null) {
      return this._agentRecaptchaConfig;
    } else {
      return this._tenantRecaptchaConfigs[this.tenantId];
    }
  }
  async validatePassword(password) {
    if (!this._getPasswordPolicyInternal()) {
      await this._updatePasswordPolicy();
    }
    const passwordPolicy = this._getPasswordPolicyInternal();
    if (
      passwordPolicy.schemaVersion !==
      this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION
    ) {
      return Promise.reject(
        this._errorFactory.create(
          "unsupported-password-policy-schema-version",
          {},
        ),
      );
    }
    return passwordPolicy.validatePassword(password);
  }
  _getPasswordPolicyInternal() {
    if (this.tenantId === null) {
      return this._projectPasswordPolicy;
    } else {
      return this._tenantPasswordPolicies[this.tenantId];
    }
  }
  async _updatePasswordPolicy() {
    const response = await _getPasswordPolicy(this);
    const passwordPolicy = new PasswordPolicyImpl(response);
    if (this.tenantId === null) {
      this._projectPasswordPolicy = passwordPolicy;
    } else {
      this._tenantPasswordPolicies[this.tenantId] = passwordPolicy;
    }
  }
  _getPersistenceType() {
    return this.assertedPersistence.persistence.type;
  }
  _getPersistence() {
    return this.assertedPersistence.persistence;
  }
  _updateErrorMap(errorMap) {
    this._errorFactory = new ErrorFactory("auth", "Firebase", errorMap());
  }
  onAuthStateChanged(nextOrObserver, error, completed) {
    return this.registerStateListener(
      this.authStateSubscription,
      nextOrObserver,
      error,
      completed,
    );
  }
  beforeAuthStateChanged(callback, onAbort) {
    return this.beforeStateQueue.pushCallback(callback, onAbort);
  }
  onIdTokenChanged(nextOrObserver, error, completed) {
    return this.registerStateListener(
      this.idTokenSubscription,
      nextOrObserver,
      error,
      completed,
    );
  }
  authStateReady() {
    return new Promise((resolve, reject) => {
      if (this.currentUser) {
        resolve();
      } else {
        const unsubscribe = this.onAuthStateChanged(() => {
          unsubscribe();
          resolve();
        }, reject);
      }
    });
  }
  /**
   * Revokes the given access token. Currently only supports Apple OAuth access tokens.
   */
  async revokeAccessToken(token) {
    if (this.currentUser) {
      const idToken = await this.currentUser.getIdToken();
      const request = {
        providerId: "apple.com",
        tokenType: "ACCESS_TOKEN",
        token,
        idToken,
      };
      if (this.tenantId != null) {
        request.tenantId = this.tenantId;
      }
      await revokeToken(this, request);
    }
  }
  toJSON() {
    return {
      apiKey: this.config.apiKey,
      authDomain: this.config.authDomain,
      appName: this.name,
      currentUser: this._currentUser?.toJSON(),
    };
  }
  async _setRedirectUser(user, popupRedirectResolver) {
    const redirectManager = await this.getOrInitRedirectPersistenceManager(
      popupRedirectResolver,
    );
    return user === null
      ? redirectManager.removeCurrentUser()
      : redirectManager.setCurrentUser(user);
  }
  async getOrInitRedirectPersistenceManager(popupRedirectResolver) {
    if (!this.redirectPersistenceManager) {
      const resolver =
        (popupRedirectResolver && _getInstance(popupRedirectResolver)) ||
        this._popupRedirectResolver;
      _assert(
        resolver,
        this,
        "argument-error",
        /* AuthErrorCode.ARGUMENT_ERROR */
      );
      this.redirectPersistenceManager = await PersistenceUserManager.create(
        this,
        [_getInstance(resolver._redirectPersistence)],
        "redirectUser",
        /* KeyName.REDIRECT_USER */
      );
      this.redirectUser =
        await this.redirectPersistenceManager.getCurrentUser();
    }
    return this.redirectPersistenceManager;
  }
  async _redirectUserForId(id) {
    if (this._isInitialized) {
      await this.queue(async () => {});
    }
    if (this._currentUser?._redirectEventId === id) {
      return this._currentUser;
    }
    if (this.redirectUser?._redirectEventId === id) {
      return this.redirectUser;
    }
    return null;
  }
  async _persistUserIfCurrent(user) {
    if (user === this.currentUser) {
      return this.queue(async () => this.directlySetCurrentUser(user));
    }
  }
  /** Notifies listeners only if the user is current */
  _notifyListenersIfCurrent(user) {
    if (user === this.currentUser) {
      this.notifyAuthListeners();
    }
  }
  _key() {
    return `${this.config.authDomain}:${this.config.apiKey}:${this.name}`;
  }
  _startProactiveRefresh() {
    this.isProactiveRefreshEnabled = true;
    if (this.currentUser) {
      this._currentUser._startProactiveRefresh();
    }
  }
  _stopProactiveRefresh() {
    this.isProactiveRefreshEnabled = false;
    if (this.currentUser) {
      this._currentUser._stopProactiveRefresh();
    }
  }
  /** Returns the current user cast as the internal type */
  get _currentUser() {
    return this.currentUser;
  }
  notifyAuthListeners() {
    if (!this._isInitialized) {
      return;
    }
    this.idTokenSubscription.next(this.currentUser);
    const currentUid = this.currentUser?.uid ?? null;
    if (this.lastNotifiedUid !== currentUid) {
      this.lastNotifiedUid = currentUid;
      this.authStateSubscription.next(this.currentUser);
    }
  }
  registerStateListener(subscription, nextOrObserver, error, completed) {
    if (this._deleted) {
      return () => {};
    }
    const cb =
      typeof nextOrObserver === "function"
        ? nextOrObserver
        : nextOrObserver.next.bind(nextOrObserver);
    let isUnsubscribed = false;
    const promise = this._isInitialized
      ? Promise.resolve()
      : this._initializationPromise;
    _assert(
      promise,
      this,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    promise.then(() => {
      if (isUnsubscribed) {
        return;
      }
      cb(this.currentUser);
    });
    if (typeof nextOrObserver === "function") {
      const unsubscribe = subscription.addObserver(
        nextOrObserver,
        error,
        completed,
      );
      return () => {
        isUnsubscribed = true;
        unsubscribe();
      };
    } else {
      const unsubscribe = subscription.addObserver(nextOrObserver);
      return () => {
        isUnsubscribed = true;
        unsubscribe();
      };
    }
  }
  /**
   * Unprotected (from race conditions) method to set the current user. This
   * should only be called from within a queued callback. This is necessary
   * because the queue shouldn't rely on another queued callback.
   */
  async directlySetCurrentUser(user) {
    if (this.currentUser && this.currentUser !== user) {
      this._currentUser._stopProactiveRefresh();
    }
    if (user && this.isProactiveRefreshEnabled) {
      user._startProactiveRefresh();
    }
    this.currentUser = user;
    if (user) {
      await this.assertedPersistence.setCurrentUser(user);
    } else {
      await this.assertedPersistence.removeCurrentUser();
    }
  }
  queue(action) {
    this.operations = this.operations.then(action, action);
    return this.operations;
  }
  get assertedPersistence() {
    _assert(
      this.persistenceManager,
      this,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    return this.persistenceManager;
  }
  _logFramework(framework) {
    if (!framework || this.frameworks.includes(framework)) {
      return;
    }
    this.frameworks.push(framework);
    this.frameworks.sort();
    this.clientVersion = _getClientVersion(
      this.config.clientPlatform,
      this._getFrameworks(),
    );
  }
  _getFrameworks() {
    return this.frameworks;
  }
  async _getAdditionalHeaders() {
    const headers = {
      ["X-Client-Version"]:
        /* HttpHeader.X_CLIENT_VERSION */
        this.clientVersion,
    };
    if (this.app.options.appId) {
      headers[
        "X-Firebase-gmpid"
        /* HttpHeader.X_FIREBASE_GMPID */
      ] = this.app.options.appId;
    }
    const heartbeatsHeader = await this.heartbeatServiceProvider
      .getImmediate({
        optional: true,
      })
      ?.getHeartbeatsHeader();
    if (heartbeatsHeader) {
      headers[
        "X-Firebase-Client"
        /* HttpHeader.X_FIREBASE_CLIENT */
      ] = heartbeatsHeader;
    }
    const appCheckToken = await this._getAppCheckToken();
    if (appCheckToken) {
      headers[
        "X-Firebase-AppCheck"
        /* HttpHeader.X_FIREBASE_APP_CHECK */
      ] = appCheckToken;
    }
    return headers;
  }
  async _getAppCheckToken() {
    if (_isFirebaseServerApp(this.app) && this.app.settings.appCheckToken) {
      return this.app.settings.appCheckToken;
    }
    const appCheckTokenResult = await this.appCheckServiceProvider
      .getImmediate({ optional: true })
      ?.getToken();
    if (appCheckTokenResult?.error) {
      _logWarn(
        `Error while retrieving App Check token: ${appCheckTokenResult.error}`,
      );
    }
    return appCheckTokenResult?.token;
  }
};
function _castAuth(auth) {
  return getModularInstance(auth);
}
__name(_castAuth, "_castAuth");
var Subscription = class {
  static {
    __name(this, "Subscription");
  }
  constructor(auth) {
    this.auth = auth;
    this.observer = null;
    this.addObserver = createSubscribe(
      (observer) => (this.observer = observer),
    );
  }
  get next() {
    _assert(
      this.observer,
      this.auth,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    return this.observer.next.bind(this.observer);
  }
};
var externalJSProvider = {
  async loadJS() {
    throw new Error("Unable to load external scripts");
  },
  recaptchaV2Script: "",
  recaptchaEnterpriseScript: "",
  gapiScript: "",
};
function _setExternalJSProvider(p2) {
  externalJSProvider = p2;
}
__name(_setExternalJSProvider, "_setExternalJSProvider");
function _loadJS(url) {
  return externalJSProvider.loadJS(url);
}
__name(_loadJS, "_loadJS");
function _recaptchaEnterpriseScriptUrl() {
  return externalJSProvider.recaptchaEnterpriseScript;
}
__name(_recaptchaEnterpriseScriptUrl, "_recaptchaEnterpriseScriptUrl");
function _gapiScriptUrl() {
  return externalJSProvider.gapiScript;
}
__name(_gapiScriptUrl, "_gapiScriptUrl");
function _generateCallbackName(prefix) {
  return `__${prefix}${Math.floor(Math.random() * 1e6)}`;
}
__name(_generateCallbackName, "_generateCallbackName");
var MockGreCAPTCHATopLevel = class {
  static {
    __name(this, "MockGreCAPTCHATopLevel");
  }
  constructor() {
    this.enterprise = new MockGreCAPTCHA();
  }
  ready(callback) {
    callback();
  }
  execute(_siteKey, _options) {
    return Promise.resolve("token");
  }
  render(_container, _parameters) {
    return "";
  }
};
var MockGreCAPTCHA = class {
  static {
    __name(this, "MockGreCAPTCHA");
  }
  ready(callback) {
    callback();
  }
  execute(_siteKey, _options) {
    return Promise.resolve("token");
  }
  render(_container, _parameters) {
    return "";
  }
};
var RECAPTCHA_ENTERPRISE_VERIFIER_TYPE = "recaptcha-enterprise";
var FAKE_TOKEN = "NO_RECAPTCHA";
var RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME = "onFirebaseAuthREInstanceReady";
var RecaptchaEnterpriseVerifier = class _RecaptchaEnterpriseVerifier {
  static {
    __name(this, "RecaptchaEnterpriseVerifier");
  }
  /**
   *
   * @param authExtern - The corresponding Firebase {@link Auth} instance.
   *
   */
  constructor(authExtern) {
    this.type = RECAPTCHA_ENTERPRISE_VERIFIER_TYPE;
    this.auth = _castAuth(authExtern);
  }
  /**
   * Executes the verification process.
   *
   * @returns A Promise for a token that can be used to assert the validity of a request.
   */
  async verify(action = "verify", forceRefresh = false) {
    async function retrieveSiteKey(auth) {
      if (!forceRefresh) {
        if (auth.tenantId == null && auth._agentRecaptchaConfig != null) {
          return auth._agentRecaptchaConfig.siteKey;
        }
        if (
          auth.tenantId != null &&
          auth._tenantRecaptchaConfigs[auth.tenantId] !== void 0
        ) {
          return auth._tenantRecaptchaConfigs[auth.tenantId].siteKey;
        }
      }
      return new Promise(async (resolve, reject) => {
        getRecaptchaConfig(auth, {
          clientType: "CLIENT_TYPE_WEB",
          version: "RECAPTCHA_ENTERPRISE",
          /* RecaptchaVersion.ENTERPRISE */
        })
          .then((response) => {
            if (response.recaptchaKey === void 0) {
              reject(new Error("recaptcha Enterprise site key undefined"));
            } else {
              const config = new RecaptchaConfig(response);
              if (auth.tenantId == null) {
                auth._agentRecaptchaConfig = config;
              } else {
                auth._tenantRecaptchaConfigs[auth.tenantId] = config;
              }
              return resolve(config.siteKey);
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    }
    __name(retrieveSiteKey, "retrieveSiteKey");
    function retrieveRecaptchaToken(siteKey, resolve, reject) {
      const grecaptcha = window.grecaptcha;
      if (isEnterprise(grecaptcha)) {
        grecaptcha.enterprise.ready(() => {
          grecaptcha.enterprise
            .execute(siteKey, { action })
            .then((token) => {
              resolve(token);
            })
            .catch(() => {
              resolve(FAKE_TOKEN);
            });
        });
      } else {
        reject(Error("No reCAPTCHA enterprise script loaded."));
      }
    }
    __name(retrieveRecaptchaToken, "retrieveRecaptchaToken");
    if (this.auth.settings.appVerificationDisabledForTesting) {
      const mockRecaptcha = new MockGreCAPTCHATopLevel();
      return mockRecaptcha.execute("siteKey", { action: "verify" });
    }
    return new Promise((resolve, reject) => {
      retrieveSiteKey(this.auth)
        .then(async (siteKey) => {
          if (
            !forceRefresh &&
            isEnterprise(window.grecaptcha) && // If download has already been initiated, do not trigger another
            // download, await the promise here.
            _RecaptchaEnterpriseVerifier.scriptInjectionDeferred
          ) {
            await _RecaptchaEnterpriseVerifier.scriptInjectionDeferred.promise;
            retrieveRecaptchaToken(siteKey, resolve, reject);
          } else {
            if (typeof window === "undefined") {
              reject(
                new Error("RecaptchaVerifier is only supported in browser"),
              );
              return;
            }
            let url = _recaptchaEnterpriseScriptUrl();
            if (url.length !== 0) {
              url +=
                siteKey +
                `&onload=${RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME}`;
            }
            _RecaptchaEnterpriseVerifier.scriptInjectionDeferred =
              new Deferred();
            window[RECAPTCHA_ENTERPRISE_ONLOAD_CALLBACK_NAME] = () => {
              _RecaptchaEnterpriseVerifier.scriptInjectionDeferred?.resolve();
            };
            _loadJS(url)
              .then(
                () =>
                  _RecaptchaEnterpriseVerifier.scriptInjectionDeferred?.promise,
              )
              .then(() => {
                retrieveRecaptchaToken(siteKey, resolve, reject);
              })
              .catch((error) => {
                reject(error);
              });
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
};
RecaptchaEnterpriseVerifier.scriptInjectionDeferred = null;
async function injectRecaptchaFields(
  auth,
  request,
  action,
  isCaptchaResp = false,
  isFakeToken = false,
) {
  const verifier = new RecaptchaEnterpriseVerifier(auth);
  let captchaResponse;
  if (isFakeToken) {
    captchaResponse = FAKE_TOKEN;
  } else {
    try {
      captchaResponse = await verifier.verify(action);
    } catch (error) {
      captchaResponse = await verifier.verify(action, true);
    }
  }
  const newRequest = { ...request };
  if (action === "mfaSmsEnrollment" || action === "mfaSmsSignIn") {
    if ("phoneEnrollmentInfo" in newRequest) {
      const phoneNumber = newRequest.phoneEnrollmentInfo.phoneNumber;
      const recaptchaToken = newRequest.phoneEnrollmentInfo.recaptchaToken;
      Object.assign(newRequest, {
        phoneEnrollmentInfo: {
          phoneNumber,
          recaptchaToken,
          captchaResponse,
          clientType: "CLIENT_TYPE_WEB",
          recaptchaVersion: "RECAPTCHA_ENTERPRISE",
          /* RecaptchaVersion.ENTERPRISE */
        },
      });
    } else if ("phoneSignInInfo" in newRequest) {
      const recaptchaToken = newRequest.phoneSignInInfo.recaptchaToken;
      Object.assign(newRequest, {
        phoneSignInInfo: {
          recaptchaToken,
          captchaResponse,
          clientType: "CLIENT_TYPE_WEB",
          recaptchaVersion: "RECAPTCHA_ENTERPRISE",
          /* RecaptchaVersion.ENTERPRISE */
        },
      });
    }
    return newRequest;
  }
  if (!isCaptchaResp) {
    Object.assign(newRequest, { captchaResponse });
  } else {
    Object.assign(newRequest, { captchaResp: captchaResponse });
  }
  Object.assign(newRequest, {
    clientType: "CLIENT_TYPE_WEB",
    /* RecaptchaClientType.WEB */
  });
  Object.assign(newRequest, {
    recaptchaVersion: "RECAPTCHA_ENTERPRISE",
    /* RecaptchaVersion.ENTERPRISE */
  });
  return newRequest;
}
__name(injectRecaptchaFields, "injectRecaptchaFields");
async function handleRecaptchaFlow(
  authInstance,
  request,
  actionName,
  actionMethod,
  recaptchaAuthProvider,
) {
  if (recaptchaAuthProvider === "EMAIL_PASSWORD_PROVIDER") {
    if (
      authInstance._getRecaptchaConfig()?.isProviderEnabled(
        "EMAIL_PASSWORD_PROVIDER",
        /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
      )
    ) {
      const requestWithRecaptcha = await injectRecaptchaFields(
        authInstance,
        request,
        actionName,
        actionName === "getOobCode",
        /* RecaptchaActionName.GET_OOB_CODE */
      );
      return actionMethod(authInstance, requestWithRecaptcha);
    } else {
      return actionMethod(authInstance, request).catch(async (error) => {
        if (error.code === `auth/${"missing-recaptcha-token"}`) {
          console.log(
            `${actionName} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`,
          );
          const requestWithRecaptcha = await injectRecaptchaFields(
            authInstance,
            request,
            actionName,
            actionName === "getOobCode",
            /* RecaptchaActionName.GET_OOB_CODE */
          );
          return actionMethod(authInstance, requestWithRecaptcha);
        } else {
          return Promise.reject(error);
        }
      });
    }
  } else if (recaptchaAuthProvider === "PHONE_PROVIDER") {
    if (
      authInstance._getRecaptchaConfig()?.isProviderEnabled(
        "PHONE_PROVIDER",
        /* RecaptchaAuthProvider.PHONE_PROVIDER */
      )
    ) {
      const requestWithRecaptcha = await injectRecaptchaFields(
        authInstance,
        request,
        actionName,
      );
      return actionMethod(authInstance, requestWithRecaptcha).catch(
        async (error) => {
          if (
            authInstance._getRecaptchaConfig()?.getProviderEnforcementState(
              "PHONE_PROVIDER",
              /* RecaptchaAuthProvider.PHONE_PROVIDER */
            ) === "AUDIT"
          ) {
            if (
              error.code === `auth/${"missing-recaptcha-token"}` ||
              error.code === `auth/${"invalid-app-credential"}`
            ) {
              console.log(
                `Failed to verify with reCAPTCHA Enterprise. Automatically triggering the reCAPTCHA v2 flow to complete the ${actionName} flow.`,
              );
              const requestWithRecaptchaFields = await injectRecaptchaFields(
                authInstance,
                request,
                actionName,
                false,
                // isCaptchaResp
                true,
                // isFakeToken
              );
              return actionMethod(authInstance, requestWithRecaptchaFields);
            }
          }
          return Promise.reject(error);
        },
      );
    } else {
      const requestWithRecaptchaFields = await injectRecaptchaFields(
        authInstance,
        request,
        actionName,
        false,
        // isCaptchaResp
        true,
        // isFakeToken
      );
      return actionMethod(authInstance, requestWithRecaptchaFields);
    }
  } else {
    return Promise.reject(
      recaptchaAuthProvider + " provider is not supported.",
    );
  }
}
__name(handleRecaptchaFlow, "handleRecaptchaFlow");
async function _initializeRecaptchaConfig(auth) {
  const authInternal = _castAuth(auth);
  const response = await getRecaptchaConfig(authInternal, {
    clientType: "CLIENT_TYPE_WEB",
    version: "RECAPTCHA_ENTERPRISE",
    /* RecaptchaVersion.ENTERPRISE */
  });
  const config = new RecaptchaConfig(response);
  if (authInternal.tenantId == null) {
    authInternal._agentRecaptchaConfig = config;
  } else {
    authInternal._tenantRecaptchaConfigs[authInternal.tenantId] = config;
  }
  if (config.isAnyProviderEnabled()) {
    const verifier = new RecaptchaEnterpriseVerifier(authInternal);
    void verifier.verify();
  }
}
__name(_initializeRecaptchaConfig, "_initializeRecaptchaConfig");
function initializeAuth(app, deps) {
  const provider = _getProvider(app, "auth");
  if (provider.isInitialized()) {
    const auth2 = provider.getImmediate();
    const initialOptions = provider.getOptions();
    if (deepEqual(initialOptions, deps ?? {})) {
      return auth2;
    } else {
      _fail(
        auth2,
        "already-initialized",
        /* AuthErrorCode.ALREADY_INITIALIZED */
      );
    }
  }
  const auth = provider.initialize({ options: deps });
  return auth;
}
__name(initializeAuth, "initializeAuth");
function _initializeAuthInstance(auth, deps) {
  const persistence = deps?.persistence || [];
  const hierarchy = (
    Array.isArray(persistence) ? persistence : [persistence]
  ).map(_getInstance);
  if (deps?.errorMap) {
    auth._updateErrorMap(deps.errorMap);
  }
  auth._initializeWithPersistence(hierarchy, deps?.popupRedirectResolver);
}
__name(_initializeAuthInstance, "_initializeAuthInstance");
function connectAuthEmulator(auth, url, options) {
  const authInternal = _castAuth(auth);
  _assert(
    /^https?:\/\//.test(url),
    authInternal,
    "invalid-emulator-scheme",
    /* AuthErrorCode.INVALID_EMULATOR_SCHEME */
  );
  const disableWarnings = !!options?.disableWarnings;
  const protocol = extractProtocol(url);
  const { host, port } = extractHostAndPort(url);
  const portStr = port === null ? "" : `:${port}`;
  const emulator = { url: `${protocol}//${host}${portStr}/` };
  const emulatorConfig = Object.freeze({
    host,
    port,
    protocol: protocol.replace(":", ""),
    options: Object.freeze({ disableWarnings }),
  });
  if (!authInternal._canInitEmulator) {
    _assert(
      authInternal.config.emulator && authInternal.emulatorConfig,
      authInternal,
      "emulator-config-failed",
      /* AuthErrorCode.EMULATOR_CONFIG_FAILED */
    );
    _assert(
      deepEqual(emulator, authInternal.config.emulator) &&
        deepEqual(emulatorConfig, authInternal.emulatorConfig),
      authInternal,
      "emulator-config-failed",
      /* AuthErrorCode.EMULATOR_CONFIG_FAILED */
    );
    return;
  }
  authInternal.config.emulator = emulator;
  authInternal.emulatorConfig = emulatorConfig;
  authInternal.settings.appVerificationDisabledForTesting = true;
  if (isCloudWorkstation(host)) {
    void pingServer(`${protocol}//${host}${portStr}`);
  } else if (!disableWarnings) {
    emitEmulatorWarning();
  }
}
__name(connectAuthEmulator, "connectAuthEmulator");
function extractProtocol(url) {
  const protocolEnd = url.indexOf(":");
  return protocolEnd < 0 ? "" : url.substr(0, protocolEnd + 1);
}
__name(extractProtocol, "extractProtocol");
function extractHostAndPort(url) {
  const protocol = extractProtocol(url);
  const authority = /(\/\/)?([^?#/]+)/.exec(url.substr(protocol.length));
  if (!authority) {
    return { host: "", port: null };
  }
  const hostAndPort = authority[2].split("@").pop() || "";
  const bracketedIPv6 = /^(\[[^\]]+\])(:|$)/.exec(hostAndPort);
  if (bracketedIPv6) {
    const host = bracketedIPv6[1];
    return { host, port: parsePort(hostAndPort.substr(host.length + 1)) };
  } else {
    const [host, port] = hostAndPort.split(":");
    return { host, port: parsePort(port) };
  }
}
__name(extractHostAndPort, "extractHostAndPort");
function parsePort(portStr) {
  if (!portStr) {
    return null;
  }
  const port = Number(portStr);
  if (isNaN(port)) {
    return null;
  }
  return port;
}
__name(parsePort, "parsePort");
function emitEmulatorWarning() {
  function attachBanner() {
    const el = document.createElement("p");
    const sty = el.style;
    el.innerText =
      "Running in emulator mode. Do not use with production credentials.";
    sty.position = "fixed";
    sty.width = "100%";
    sty.backgroundColor = "#ffffff";
    sty.border = ".1em solid #000000";
    sty.color = "#b50000";
    sty.bottom = "0px";
    sty.left = "0px";
    sty.margin = "0px";
    sty.zIndex = "10000";
    sty.textAlign = "center";
    el.classList.add("firebase-emulator-warning");
    document.body.appendChild(el);
  }
  __name(attachBanner, "attachBanner");
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info(
      "WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials.",
    );
  }
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", attachBanner);
    } else {
      attachBanner();
    }
  }
}
__name(emitEmulatorWarning, "emitEmulatorWarning");
var AuthCredential = class {
  static {
    __name(this, "AuthCredential");
  }
  /** @internal */
  constructor(providerId, signInMethod) {
    this.providerId = providerId;
    this.signInMethod = signInMethod;
  }
  /**
   * Returns a JSON-serializable representation of this object.
   *
   * @returns a JSON-serializable representation of this object.
   */
  toJSON() {
    return debugFail("not implemented");
  }
  /** @internal */
  _getIdTokenResponse(_auth) {
    return debugFail("not implemented");
  }
  /** @internal */
  _linkToIdToken(_auth, _idToken) {
    return debugFail("not implemented");
  }
  /** @internal */
  _getReauthenticationResolver(_auth) {
    return debugFail("not implemented");
  }
};
async function linkEmailPassword(auth, request) {
  return _performApiRequest(auth, "POST", "/v1/accounts:signUp", request);
}
__name(linkEmailPassword, "linkEmailPassword");
async function signInWithPassword(auth, request) {
  return _performSignInRequest(
    auth,
    "POST",
    "/v1/accounts:signInWithPassword",
    _addTidIfNecessary(auth, request),
  );
}
__name(signInWithPassword, "signInWithPassword");
async function signInWithEmailLink$1(auth, request) {
  return _performSignInRequest(
    auth,
    "POST",
    "/v1/accounts:signInWithEmailLink",
    _addTidIfNecessary(auth, request),
  );
}
__name(signInWithEmailLink$1, "signInWithEmailLink$1");
async function signInWithEmailLinkForLinking(auth, request) {
  return _performSignInRequest(
    auth,
    "POST",
    "/v1/accounts:signInWithEmailLink",
    _addTidIfNecessary(auth, request),
  );
}
__name(signInWithEmailLinkForLinking, "signInWithEmailLinkForLinking");
var EmailAuthCredential = class _EmailAuthCredential extends AuthCredential {
  static {
    __name(this, "EmailAuthCredential");
  }
  /** @internal */
  constructor(_email, _password, signInMethod, _tenantId = null) {
    super("password", signInMethod);
    this._email = _email;
    this._password = _password;
    this._tenantId = _tenantId;
  }
  /** @internal */
  static _fromEmailAndPassword(email, password) {
    return new _EmailAuthCredential(
      email,
      password,
      "password",
      /* SignInMethod.EMAIL_PASSWORD */
    );
  }
  /** @internal */
  static _fromEmailAndCode(email, oobCode, tenantId = null) {
    return new _EmailAuthCredential(email, oobCode, "emailLink", tenantId);
  }
  /** {@inheritdoc AuthCredential.toJSON} */
  toJSON() {
    return {
      email: this._email,
      password: this._password,
      signInMethod: this.signInMethod,
      tenantId: this._tenantId,
    };
  }
  /**
   * Static method to deserialize a JSON representation of an object into an {@link  AuthCredential}.
   *
   * @param json - Either `object` or the stringified representation of the object. When string is
   * provided, `JSON.parse` would be called first.
   *
   * @returns If the JSON input does not represent an {@link AuthCredential}, null is returned.
   */
  static fromJSON(json) {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    if (obj?.email && obj?.password) {
      if (obj.signInMethod === "password") {
        return this._fromEmailAndPassword(obj.email, obj.password);
      } else if (obj.signInMethod === "emailLink") {
        return this._fromEmailAndCode(obj.email, obj.password, obj.tenantId);
      }
    }
    return null;
  }
  /** @internal */
  async _getIdTokenResponse(auth) {
    switch (this.signInMethod) {
      case "password":
        const request = {
          returnSecureToken: true,
          email: this._email,
          password: this._password,
          clientType: "CLIENT_TYPE_WEB",
          /* RecaptchaClientType.WEB */
        };
        return handleRecaptchaFlow(
          auth,
          request,
          "signInWithPassword",
          signInWithPassword,
          "EMAIL_PASSWORD_PROVIDER",
          /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
        );
      case "emailLink":
        return signInWithEmailLink$1(auth, {
          email: this._email,
          oobCode: this._password,
        });
      default:
        _fail(
          auth,
          "internal-error",
          /* AuthErrorCode.INTERNAL_ERROR */
        );
    }
  }
  /** @internal */
  async _linkToIdToken(auth, idToken) {
    switch (this.signInMethod) {
      case "password":
        const request = {
          idToken,
          returnSecureToken: true,
          email: this._email,
          password: this._password,
          clientType: "CLIENT_TYPE_WEB",
          /* RecaptchaClientType.WEB */
        };
        return handleRecaptchaFlow(
          auth,
          request,
          "signUpPassword",
          linkEmailPassword,
          "EMAIL_PASSWORD_PROVIDER",
          /* RecaptchaAuthProvider.EMAIL_PASSWORD_PROVIDER */
        );
      case "emailLink":
        return signInWithEmailLinkForLinking(auth, {
          idToken,
          email: this._email,
          oobCode: this._password,
        });
      default:
        _fail(
          auth,
          "internal-error",
          /* AuthErrorCode.INTERNAL_ERROR */
        );
    }
  }
  /** @internal */
  _getReauthenticationResolver(auth) {
    return this._getIdTokenResponse(auth);
  }
};
async function signInWithIdp(auth, request) {
  return _performSignInRequest(
    auth,
    "POST",
    "/v1/accounts:signInWithIdp",
    _addTidIfNecessary(auth, request),
  );
}
__name(signInWithIdp, "signInWithIdp");
var IDP_REQUEST_URI$1 = "http://localhost";
var OAuthCredential = class _OAuthCredential extends AuthCredential {
  static {
    __name(this, "OAuthCredential");
  }
  constructor() {
    super(...arguments);
    this.pendingToken = null;
  }
  /** @internal */
  static _fromParams(params) {
    const cred = new _OAuthCredential(params.providerId, params.signInMethod);
    if (params.idToken || params.accessToken) {
      if (params.idToken) {
        cred.idToken = params.idToken;
      }
      if (params.accessToken) {
        cred.accessToken = params.accessToken;
      }
      if (params.nonce && !params.pendingToken) {
        cred.nonce = params.nonce;
      }
      if (params.pendingToken) {
        cred.pendingToken = params.pendingToken;
      }
    } else if (params.oauthToken && params.oauthTokenSecret) {
      cred.accessToken = params.oauthToken;
      cred.secret = params.oauthTokenSecret;
    } else {
      _fail(
        "argument-error",
        /* AuthErrorCode.ARGUMENT_ERROR */
      );
    }
    return cred;
  }
  /** {@inheritdoc AuthCredential.toJSON}  */
  toJSON() {
    return {
      idToken: this.idToken,
      accessToken: this.accessToken,
      secret: this.secret,
      nonce: this.nonce,
      pendingToken: this.pendingToken,
      providerId: this.providerId,
      signInMethod: this.signInMethod,
    };
  }
  /**
   * Static method to deserialize a JSON representation of an object into an
   * {@link  AuthCredential}.
   *
   * @param json - Input can be either Object or the stringified representation of the object.
   * When string is provided, JSON.parse would be called first.
   *
   * @returns If the JSON input does not represent an {@link  AuthCredential}, null is returned.
   */
  static fromJSON(json) {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    const { providerId, signInMethod, ...rest } = obj;
    if (!providerId || !signInMethod) {
      return null;
    }
    const cred = new _OAuthCredential(providerId, signInMethod);
    cred.idToken = rest.idToken || void 0;
    cred.accessToken = rest.accessToken || void 0;
    cred.secret = rest.secret;
    cred.nonce = rest.nonce;
    cred.pendingToken = rest.pendingToken || null;
    return cred;
  }
  /** @internal */
  _getIdTokenResponse(auth) {
    const request = this.buildRequest();
    return signInWithIdp(auth, request);
  }
  /** @internal */
  _linkToIdToken(auth, idToken) {
    const request = this.buildRequest();
    request.idToken = idToken;
    return signInWithIdp(auth, request);
  }
  /** @internal */
  _getReauthenticationResolver(auth) {
    const request = this.buildRequest();
    request.autoCreate = false;
    return signInWithIdp(auth, request);
  }
  buildRequest() {
    const request = {
      requestUri: IDP_REQUEST_URI$1,
      returnSecureToken: true,
    };
    if (this.pendingToken) {
      request.pendingToken = this.pendingToken;
    } else {
      const postBody = {};
      if (this.idToken) {
        postBody["id_token"] = this.idToken;
      }
      if (this.accessToken) {
        postBody["access_token"] = this.accessToken;
      }
      if (this.secret) {
        postBody["oauth_token_secret"] = this.secret;
      }
      postBody["providerId"] = this.providerId;
      if (this.nonce && !this.pendingToken) {
        postBody["nonce"] = this.nonce;
      }
      request.postBody = querystring(postBody);
    }
    return request;
  }
};
async function sendPhoneVerificationCode(auth, request) {
  return _performApiRequest(
    auth,
    "POST",
    "/v1/accounts:sendVerificationCode",
    _addTidIfNecessary(auth, request),
  );
}
__name(sendPhoneVerificationCode, "sendPhoneVerificationCode");
async function signInWithPhoneNumber$1(auth, request) {
  return _performSignInRequest(
    auth,
    "POST",
    "/v1/accounts:signInWithPhoneNumber",
    _addTidIfNecessary(auth, request),
  );
}
__name(signInWithPhoneNumber$1, "signInWithPhoneNumber$1");
async function linkWithPhoneNumber$1(auth, request) {
  const response = await _performSignInRequest(
    auth,
    "POST",
    "/v1/accounts:signInWithPhoneNumber",
    _addTidIfNecessary(auth, request),
  );
  if (response.temporaryProof) {
    throw _makeTaggedError(
      auth,
      "account-exists-with-different-credential",
      response,
    );
  }
  return response;
}
__name(linkWithPhoneNumber$1, "linkWithPhoneNumber$1");
var VERIFY_PHONE_NUMBER_FOR_EXISTING_ERROR_MAP_ = {
  ["USER_NOT_FOUND"]:
    /* ServerError.USER_NOT_FOUND */
    "user-not-found",
  /* AuthErrorCode.USER_DELETED */
};
async function verifyPhoneNumberForExisting(auth, request) {
  const apiRequest = {
    ...request,
    operation: "REAUTH",
  };
  return _performSignInRequest(
    auth,
    "POST",
    "/v1/accounts:signInWithPhoneNumber",
    _addTidIfNecessary(auth, apiRequest),
    VERIFY_PHONE_NUMBER_FOR_EXISTING_ERROR_MAP_,
  );
}
__name(verifyPhoneNumberForExisting, "verifyPhoneNumberForExisting");
var PhoneAuthCredential = class _PhoneAuthCredential extends AuthCredential {
  static {
    __name(this, "PhoneAuthCredential");
  }
  constructor(params) {
    super(
      "phone",
      "phone",
      /* SignInMethod.PHONE */
    );
    this.params = params;
  }
  /** @internal */
  static _fromVerification(verificationId, verificationCode) {
    return new _PhoneAuthCredential({ verificationId, verificationCode });
  }
  /** @internal */
  static _fromTokenResponse(phoneNumber, temporaryProof) {
    return new _PhoneAuthCredential({ phoneNumber, temporaryProof });
  }
  /** @internal */
  _getIdTokenResponse(auth) {
    return signInWithPhoneNumber$1(auth, this._makeVerificationRequest());
  }
  /** @internal */
  _linkToIdToken(auth, idToken) {
    return linkWithPhoneNumber$1(auth, {
      idToken,
      ...this._makeVerificationRequest(),
    });
  }
  /** @internal */
  _getReauthenticationResolver(auth) {
    return verifyPhoneNumberForExisting(auth, this._makeVerificationRequest());
  }
  /** @internal */
  _makeVerificationRequest() {
    const { temporaryProof, phoneNumber, verificationId, verificationCode } =
      this.params;
    if (temporaryProof && phoneNumber) {
      return { temporaryProof, phoneNumber };
    }
    return {
      sessionInfo: verificationId,
      code: verificationCode,
    };
  }
  /** {@inheritdoc AuthCredential.toJSON} */
  toJSON() {
    const obj = {
      providerId: this.providerId,
    };
    if (this.params.phoneNumber) {
      obj.phoneNumber = this.params.phoneNumber;
    }
    if (this.params.temporaryProof) {
      obj.temporaryProof = this.params.temporaryProof;
    }
    if (this.params.verificationCode) {
      obj.verificationCode = this.params.verificationCode;
    }
    if (this.params.verificationId) {
      obj.verificationId = this.params.verificationId;
    }
    return obj;
  }
  /** Generates a phone credential based on a plain object or a JSON string. */
  static fromJSON(json) {
    if (typeof json === "string") {
      json = JSON.parse(json);
    }
    const { verificationId, verificationCode, phoneNumber, temporaryProof } =
      json;
    if (
      !verificationCode &&
      !verificationId &&
      !phoneNumber &&
      !temporaryProof
    ) {
      return null;
    }
    return new _PhoneAuthCredential({
      verificationId,
      verificationCode,
      phoneNumber,
      temporaryProof,
    });
  }
};
function parseMode(mode) {
  switch (mode) {
    case "recoverEmail":
      return "RECOVER_EMAIL";
    case "resetPassword":
      return "PASSWORD_RESET";
    case "signIn":
      return "EMAIL_SIGNIN";
    case "verifyEmail":
      return "VERIFY_EMAIL";
    case "verifyAndChangeEmail":
      return "VERIFY_AND_CHANGE_EMAIL";
    case "revertSecondFactorAddition":
      return "REVERT_SECOND_FACTOR_ADDITION";
    default:
      return null;
  }
}
__name(parseMode, "parseMode");
function parseDeepLink(url) {
  const link = querystringDecode(extractQuerystring(url))["link"];
  const doubleDeepLink = link
    ? querystringDecode(extractQuerystring(link))["deep_link_id"]
    : null;
  const iOSDeepLink = querystringDecode(extractQuerystring(url))[
    "deep_link_id"
  ];
  const iOSDoubleDeepLink = iOSDeepLink
    ? querystringDecode(extractQuerystring(iOSDeepLink))["link"]
    : null;
  return iOSDoubleDeepLink || iOSDeepLink || doubleDeepLink || link || url;
}
__name(parseDeepLink, "parseDeepLink");
var ActionCodeURL = class _ActionCodeURL {
  static {
    __name(this, "ActionCodeURL");
  }
  /**
   * @param actionLink - The link from which to extract the URL.
   * @returns The {@link ActionCodeURL} object, or null if the link is invalid.
   *
   * @internal
   */
  constructor(actionLink) {
    const searchParams = querystringDecode(extractQuerystring(actionLink));
    const apiKey =
      searchParams[
        "apiKey"
        /* QueryField.API_KEY */
      ] ?? null;
    const code =
      searchParams[
        "oobCode"
        /* QueryField.CODE */
      ] ?? null;
    const operation = parseMode(
      searchParams[
        "mode"
        /* QueryField.MODE */
      ] ?? null,
    );
    _assert(
      apiKey && code && operation,
      "argument-error",
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    this.apiKey = apiKey;
    this.operation = operation;
    this.code = code;
    this.continueUrl =
      searchParams[
        "continueUrl"
        /* QueryField.CONTINUE_URL */
      ] ?? null;
    this.languageCode =
      searchParams[
        "lang"
        /* QueryField.LANGUAGE_CODE */
      ] ?? null;
    this.tenantId =
      searchParams[
        "tenantId"
        /* QueryField.TENANT_ID */
      ] ?? null;
  }
  /**
   * Parses the email action link string and returns an {@link ActionCodeURL} if the link is valid,
   * otherwise returns null.
   *
   * @param link  - The email action link string.
   * @returns The {@link ActionCodeURL} object, or null if the link is invalid.
   *
   * @public
   */
  static parseLink(link) {
    const actionLink = parseDeepLink(link);
    try {
      return new _ActionCodeURL(actionLink);
    } catch {
      return null;
    }
  }
};
var EmailAuthProvider = class _EmailAuthProvider {
  static {
    __name(this, "EmailAuthProvider");
  }
  constructor() {
    this.providerId = _EmailAuthProvider.PROVIDER_ID;
  }
  /**
   * Initialize an {@link AuthCredential} using an email and password.
   *
   * @example
   * ```javascript
   * const authCredential = EmailAuthProvider.credential(email, password);
   * const userCredential = await signInWithCredential(auth, authCredential);
   * ```
   *
   * @example
   * ```javascript
   * const userCredential = await signInWithEmailAndPassword(auth, email, password);
   * ```
   *
   * @param email - Email address.
   * @param password - User account password.
   * @returns The auth provider credential.
   */
  static credential(email, password) {
    return EmailAuthCredential._fromEmailAndPassword(email, password);
  }
  /**
   * Initialize an {@link AuthCredential} using an email and an email link after a sign in with
   * email link operation.
   *
   * @example
   * ```javascript
   * const authCredential = EmailAuthProvider.credentialWithLink(auth, email, emailLink);
   * const userCredential = await signInWithCredential(auth, authCredential);
   * ```
   *
   * @example
   * ```javascript
   * await sendSignInLinkToEmail(auth, email);
   * // Obtain emailLink from user.
   * const userCredential = await signInWithEmailLink(auth, email, emailLink);
   * ```
   *
   * @param auth - The {@link Auth} instance used to verify the link.
   * @param email - Email address.
   * @param emailLink - Sign-in email link.
   * @returns - The auth provider credential.
   */
  static credentialWithLink(email, emailLink) {
    const actionCodeUrl = ActionCodeURL.parseLink(emailLink);
    _assert(
      actionCodeUrl,
      "argument-error",
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    return EmailAuthCredential._fromEmailAndCode(
      email,
      actionCodeUrl.code,
      actionCodeUrl.tenantId,
    );
  }
};
EmailAuthProvider.PROVIDER_ID = "password";
EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD = "password";
EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD = "emailLink";
var FederatedAuthProvider = class {
  static {
    __name(this, "FederatedAuthProvider");
  }
  /**
   * Constructor for generic OAuth providers.
   *
   * @param providerId - Provider for which credentials should be generated.
   */
  constructor(providerId) {
    this.providerId = providerId;
    this.defaultLanguageCode = null;
    this.customParameters = {};
  }
  /**
   * Set the language gode.
   *
   * @param languageCode - language code
   */
  setDefaultLanguage(languageCode) {
    this.defaultLanguageCode = languageCode;
  }
  /**
   * Sets the OAuth custom parameters to pass in an OAuth request for popup and redirect sign-in
   * operations.
   *
   * @remarks
   * For a detailed list, check the reserved required OAuth 2.0 parameters such as `client_id`,
   * `redirect_uri`, `scope`, `response_type`, and `state` are not allowed and will be ignored.
   *
   * @param customOAuthParameters - The custom OAuth parameters to pass in the OAuth request.
   */
  setCustomParameters(customOAuthParameters) {
    this.customParameters = customOAuthParameters;
    return this;
  }
  /**
   * Retrieve the current list of {@link CustomParameters}.
   */
  getCustomParameters() {
    return this.customParameters;
  }
};
var BaseOAuthProvider = class extends FederatedAuthProvider {
  static {
    __name(this, "BaseOAuthProvider");
  }
  constructor() {
    super(...arguments);
    this.scopes = [];
  }
  /**
   * Add an OAuth scope to the credential.
   *
   * @param scope - Provider OAuth scope to add.
   */
  addScope(scope) {
    if (!this.scopes.includes(scope)) {
      this.scopes.push(scope);
    }
    return this;
  }
  /**
   * Retrieve the current list of OAuth scopes.
   */
  getScopes() {
    return [...this.scopes];
  }
};
var FacebookAuthProvider = class _FacebookAuthProvider extends BaseOAuthProvider {
  static {
    __name(this, "FacebookAuthProvider");
  }
  constructor() {
    super(
      "facebook.com",
      /* ProviderId.FACEBOOK */
    );
  }
  /**
   * Creates a credential for Facebook.
   *
   * @example
   * ```javascript
   * // `event` from the Facebook auth.authResponseChange callback.
   * const credential = FacebookAuthProvider.credential(event.authResponse.accessToken);
   * const result = await signInWithCredential(credential);
   * ```
   *
   * @param accessToken - Facebook access token.
   */
  static credential(accessToken) {
    return OAuthCredential._fromParams({
      providerId: _FacebookAuthProvider.PROVIDER_ID,
      signInMethod: _FacebookAuthProvider.FACEBOOK_SIGN_IN_METHOD,
      accessToken,
    });
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _FacebookAuthProvider.credentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _FacebookAuthProvider.credentialFromTaggedObject(
      error.customData || {},
    );
  }
  static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse || !("oauthAccessToken" in tokenResponse)) {
      return null;
    }
    if (!tokenResponse.oauthAccessToken) {
      return null;
    }
    try {
      return _FacebookAuthProvider.credential(tokenResponse.oauthAccessToken);
    } catch {
      return null;
    }
  }
};
FacebookAuthProvider.FACEBOOK_SIGN_IN_METHOD = "facebook.com";
FacebookAuthProvider.PROVIDER_ID = "facebook.com";
var GoogleAuthProvider = class _GoogleAuthProvider extends BaseOAuthProvider {
  static {
    __name(this, "GoogleAuthProvider");
  }
  constructor() {
    super(
      "google.com",
      /* ProviderId.GOOGLE */
    );
    this.addScope("profile");
  }
  /**
   * Creates a credential for Google. At least one of ID token and access token is required.
   *
   * @example
   * ```javascript
   * // \`googleUser\` from the onsuccess Google Sign In callback.
   * const credential = GoogleAuthProvider.credential(googleUser.getAuthResponse().id_token);
   * const result = await signInWithCredential(credential);
   * ```
   *
   * @param idToken - Google ID token.
   * @param accessToken - Google access token.
   */
  static credential(idToken, accessToken) {
    return OAuthCredential._fromParams({
      providerId: _GoogleAuthProvider.PROVIDER_ID,
      signInMethod: _GoogleAuthProvider.GOOGLE_SIGN_IN_METHOD,
      idToken,
      accessToken,
    });
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _GoogleAuthProvider.credentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _GoogleAuthProvider.credentialFromTaggedObject(
      error.customData || {},
    );
  }
  static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse) {
      return null;
    }
    const { oauthIdToken, oauthAccessToken } = tokenResponse;
    if (!oauthIdToken && !oauthAccessToken) {
      return null;
    }
    try {
      return _GoogleAuthProvider.credential(oauthIdToken, oauthAccessToken);
    } catch {
      return null;
    }
  }
};
GoogleAuthProvider.GOOGLE_SIGN_IN_METHOD = "google.com";
GoogleAuthProvider.PROVIDER_ID = "google.com";
var GithubAuthProvider = class _GithubAuthProvider extends BaseOAuthProvider {
  static {
    __name(this, "GithubAuthProvider");
  }
  constructor() {
    super(
      "github.com",
      /* ProviderId.GITHUB */
    );
  }
  /**
   * Creates a credential for GitHub.
   *
   * @param accessToken - GitHub access token.
   */
  static credential(accessToken) {
    return OAuthCredential._fromParams({
      providerId: _GithubAuthProvider.PROVIDER_ID,
      signInMethod: _GithubAuthProvider.GITHUB_SIGN_IN_METHOD,
      accessToken,
    });
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _GithubAuthProvider.credentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _GithubAuthProvider.credentialFromTaggedObject(
      error.customData || {},
    );
  }
  static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse || !("oauthAccessToken" in tokenResponse)) {
      return null;
    }
    if (!tokenResponse.oauthAccessToken) {
      return null;
    }
    try {
      return _GithubAuthProvider.credential(tokenResponse.oauthAccessToken);
    } catch {
      return null;
    }
  }
};
GithubAuthProvider.GITHUB_SIGN_IN_METHOD = "github.com";
GithubAuthProvider.PROVIDER_ID = "github.com";
var TwitterAuthProvider = class _TwitterAuthProvider extends BaseOAuthProvider {
  static {
    __name(this, "TwitterAuthProvider");
  }
  constructor() {
    super(
      "twitter.com",
      /* ProviderId.TWITTER */
    );
  }
  /**
   * Creates a credential for Twitter.
   *
   * @param token - Twitter access token.
   * @param secret - Twitter secret.
   */
  static credential(token, secret) {
    return OAuthCredential._fromParams({
      providerId: _TwitterAuthProvider.PROVIDER_ID,
      signInMethod: _TwitterAuthProvider.TWITTER_SIGN_IN_METHOD,
      oauthToken: token,
      oauthTokenSecret: secret,
    });
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link UserCredential}.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    return _TwitterAuthProvider.credentialFromTaggedObject(userCredential);
  }
  /**
   * Used to extract the underlying {@link OAuthCredential} from a {@link AuthError} which was
   * thrown during a sign-in, link, or reauthenticate operation.
   *
   * @param userCredential - The user credential.
   */
  static credentialFromError(error) {
    return _TwitterAuthProvider.credentialFromTaggedObject(
      error.customData || {},
    );
  }
  static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse) {
      return null;
    }
    const { oauthAccessToken, oauthTokenSecret } = tokenResponse;
    if (!oauthAccessToken || !oauthTokenSecret) {
      return null;
    }
    try {
      return _TwitterAuthProvider.credential(
        oauthAccessToken,
        oauthTokenSecret,
      );
    } catch {
      return null;
    }
  }
};
TwitterAuthProvider.TWITTER_SIGN_IN_METHOD = "twitter.com";
TwitterAuthProvider.PROVIDER_ID = "twitter.com";
async function signUp(auth, request) {
  return _performSignInRequest(
    auth,
    "POST",
    "/v1/accounts:signUp",
    _addTidIfNecessary(auth, request),
  );
}
__name(signUp, "signUp");
var UserCredentialImpl = class _UserCredentialImpl {
  static {
    __name(this, "UserCredentialImpl");
  }
  constructor(params) {
    this.user = params.user;
    this.providerId = params.providerId;
    this._tokenResponse = params._tokenResponse;
    this.operationType = params.operationType;
  }
  static async _fromIdTokenResponse(
    auth,
    operationType,
    idTokenResponse,
    isAnonymous = false,
  ) {
    const user = await UserImpl._fromIdTokenResponse(
      auth,
      idTokenResponse,
      isAnonymous,
    );
    const providerId = providerIdForResponse(idTokenResponse);
    const userCred = new _UserCredentialImpl({
      user,
      providerId,
      _tokenResponse: idTokenResponse,
      operationType,
    });
    return userCred;
  }
  static async _forOperation(user, operationType, response) {
    await user._updateTokensIfNecessary(
      response,
      /* reload */
      true,
    );
    const providerId = providerIdForResponse(response);
    return new _UserCredentialImpl({
      user,
      providerId,
      _tokenResponse: response,
      operationType,
    });
  }
};
function providerIdForResponse(response) {
  if (response.providerId) {
    return response.providerId;
  }
  if ("phoneNumber" in response) {
    return "phone";
  }
  return null;
}
__name(providerIdForResponse, "providerIdForResponse");
async function signInAnonymously(auth) {
  if (_isFirebaseServerApp(auth.app)) {
    return Promise.reject(
      _serverAppCurrentUserOperationNotSupportedError(auth),
    );
  }
  const authInternal = _castAuth(auth);
  await authInternal._initializationPromise;
  if (authInternal.currentUser?.isAnonymous) {
    return new UserCredentialImpl({
      user: authInternal.currentUser,
      providerId: null,
      operationType: "signIn",
      /* OperationType.SIGN_IN */
    });
  }
  const response = await signUp(authInternal, {
    returnSecureToken: true,
  });
  const userCredential = await UserCredentialImpl._fromIdTokenResponse(
    authInternal,
    "signIn",
    response,
    true,
  );
  await authInternal._updateCurrentUser(userCredential.user);
  return userCredential;
}
__name(signInAnonymously, "signInAnonymously");
var MultiFactorError = class _MultiFactorError extends FirebaseError {
  static {
    __name(this, "MultiFactorError");
  }
  constructor(auth, error, operationType, user) {
    super(error.code, error.message);
    this.operationType = operationType;
    this.user = user;
    Object.setPrototypeOf(this, _MultiFactorError.prototype);
    this.customData = {
      appName: auth.name,
      tenantId: auth.tenantId ?? void 0,
      _serverResponse: error.customData._serverResponse,
      operationType,
    };
  }
  static _fromErrorAndOperation(auth, error, operationType, user) {
    return new _MultiFactorError(auth, error, operationType, user);
  }
};
function _processCredentialSavingMfaContextIfNecessary(
  auth,
  operationType,
  credential,
  user,
) {
  const idTokenProvider =
    operationType === "reauthenticate"
      ? credential._getReauthenticationResolver(auth)
      : credential._getIdTokenResponse(auth);
  return idTokenProvider.catch((error) => {
    if (error.code === `auth/${"multi-factor-auth-required"}`) {
      throw MultiFactorError._fromErrorAndOperation(
        auth,
        error,
        operationType,
        user,
      );
    }
    throw error;
  });
}
__name(
  _processCredentialSavingMfaContextIfNecessary,
  "_processCredentialSavingMfaContextIfNecessary",
);
async function _link$1(user, credential, bypassAuthState = false) {
  const response = await _logoutIfInvalidated(
    user,
    credential._linkToIdToken(user.auth, await user.getIdToken()),
    bypassAuthState,
  );
  return UserCredentialImpl._forOperation(user, "link", response);
}
__name(_link$1, "_link$1");
async function _reauthenticate(user, credential, bypassAuthState = false) {
  const { auth } = user;
  if (_isFirebaseServerApp(auth.app)) {
    return Promise.reject(
      _serverAppCurrentUserOperationNotSupportedError(auth),
    );
  }
  const operationType = "reauthenticate";
  try {
    const response = await _logoutIfInvalidated(
      user,
      _processCredentialSavingMfaContextIfNecessary(
        auth,
        operationType,
        credential,
        user,
      ),
      bypassAuthState,
    );
    _assert(
      response.idToken,
      auth,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const parsed = _parseToken(response.idToken);
    _assert(
      parsed,
      auth,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const { sub: localId } = parsed;
    _assert(
      user.uid === localId,
      auth,
      "user-mismatch",
      /* AuthErrorCode.USER_MISMATCH */
    );
    return UserCredentialImpl._forOperation(user, operationType, response);
  } catch (e) {
    if (e?.code === `auth/${"user-not-found"}`) {
      _fail(
        auth,
        "user-mismatch",
        /* AuthErrorCode.USER_MISMATCH */
      );
    }
    throw e;
  }
}
__name(_reauthenticate, "_reauthenticate");
async function _signInWithCredential(
  auth,
  credential,
  bypassAuthState = false,
) {
  if (_isFirebaseServerApp(auth.app)) {
    return Promise.reject(
      _serverAppCurrentUserOperationNotSupportedError(auth),
    );
  }
  const operationType = "signIn";
  const response = await _processCredentialSavingMfaContextIfNecessary(
    auth,
    operationType,
    credential,
  );
  const userCredential = await UserCredentialImpl._fromIdTokenResponse(
    auth,
    operationType,
    response,
  );
  if (!bypassAuthState) {
    await auth._updateCurrentUser(userCredential.user);
  }
  return userCredential;
}
__name(_signInWithCredential, "_signInWithCredential");
function onIdTokenChanged(auth, nextOrObserver, error, completed) {
  return getModularInstance(auth).onIdTokenChanged(
    nextOrObserver,
    error,
    completed,
  );
}
__name(onIdTokenChanged, "onIdTokenChanged");
function beforeAuthStateChanged(auth, callback, onAbort) {
  return getModularInstance(auth).beforeAuthStateChanged(callback, onAbort);
}
__name(beforeAuthStateChanged, "beforeAuthStateChanged");
function startEnrollPhoneMfa(auth, request) {
  return _performApiRequest(
    auth,
    "POST",
    "/v2/accounts/mfaEnrollment:start",
    _addTidIfNecessary(auth, request),
  );
}
__name(startEnrollPhoneMfa, "startEnrollPhoneMfa");
function finalizeEnrollPhoneMfa(auth, request) {
  return _performApiRequest(
    auth,
    "POST",
    "/v2/accounts/mfaEnrollment:finalize",
    _addTidIfNecessary(auth, request),
  );
}
__name(finalizeEnrollPhoneMfa, "finalizeEnrollPhoneMfa");
function startEnrollTotpMfa(auth, request) {
  return _performApiRequest(
    auth,
    "POST",
    "/v2/accounts/mfaEnrollment:start",
    _addTidIfNecessary(auth, request),
  );
}
__name(startEnrollTotpMfa, "startEnrollTotpMfa");
function finalizeEnrollTotpMfa(auth, request) {
  return _performApiRequest(
    auth,
    "POST",
    "/v2/accounts/mfaEnrollment:finalize",
    _addTidIfNecessary(auth, request),
  );
}
__name(finalizeEnrollTotpMfa, "finalizeEnrollTotpMfa");
var STORAGE_AVAILABLE_KEY = "__sak";
var BrowserPersistenceClass = class {
  static {
    __name(this, "BrowserPersistenceClass");
  }
  constructor(storageRetriever, type) {
    this.storageRetriever = storageRetriever;
    this.type = type;
  }
  _isAvailable() {
    try {
      if (!this.storage) {
        return Promise.resolve(false);
      }
      this.storage.setItem(STORAGE_AVAILABLE_KEY, "1");
      this.storage.removeItem(STORAGE_AVAILABLE_KEY);
      return Promise.resolve(true);
    } catch {
      return Promise.resolve(false);
    }
  }
  _set(key, value) {
    this.storage.setItem(key, JSON.stringify(value));
    return Promise.resolve();
  }
  _get(key) {
    const json = this.storage.getItem(key);
    return Promise.resolve(json ? JSON.parse(json) : null);
  }
  _remove(key) {
    this.storage.removeItem(key);
    return Promise.resolve();
  }
  get storage() {
    return this.storageRetriever();
  }
};
var _POLLING_INTERVAL_MS$1 = 1e3;
var IE10_LOCAL_STORAGE_SYNC_DELAY = 10;
var BrowserLocalPersistence = class extends BrowserPersistenceClass {
  static {
    __name(this, "BrowserLocalPersistence");
  }
  constructor() {
    super(
      () => window.localStorage,
      "LOCAL",
      /* PersistenceType.LOCAL */
    );
    this.boundEventHandler = (event, poll) => this.onStorageEvent(event, poll);
    this.listeners = {};
    this.localCache = {};
    this.pollTimer = null;
    this.fallbackToPolling = _isMobileBrowser();
    this._shouldAllowMigration = true;
  }
  forAllChangedKeys(cb) {
    for (const key of Object.keys(this.listeners)) {
      const newValue = this.storage.getItem(key);
      const oldValue = this.localCache[key];
      if (newValue !== oldValue) {
        cb(key, oldValue, newValue);
      }
    }
  }
  onStorageEvent(event, poll = false) {
    if (!event.key) {
      this.forAllChangedKeys((key2, _oldValue, newValue) => {
        this.notifyListeners(key2, newValue);
      });
      return;
    }
    const key = event.key;
    if (poll) {
      this.detachListener();
    } else {
      this.stopPolling();
    }
    const triggerListeners = /* @__PURE__ */ __name(() => {
      const storedValue2 = this.storage.getItem(key);
      if (!poll && this.localCache[key] === storedValue2) {
        return;
      }
      this.notifyListeners(key, storedValue2);
    }, "triggerListeners");
    const storedValue = this.storage.getItem(key);
    if (
      _isIE10() &&
      storedValue !== event.newValue &&
      event.newValue !== event.oldValue
    ) {
      setTimeout(triggerListeners, IE10_LOCAL_STORAGE_SYNC_DELAY);
    } else {
      triggerListeners();
    }
  }
  notifyListeners(key, value) {
    this.localCache[key] = value;
    const listeners = this.listeners[key];
    if (listeners) {
      for (const listener of Array.from(listeners)) {
        listener(value ? JSON.parse(value) : value);
      }
    }
  }
  startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      this.forAllChangedKeys((key, oldValue, newValue) => {
        this.onStorageEvent(
          new StorageEvent("storage", {
            key,
            oldValue,
            newValue,
          }),
          /* poll */
          true,
        );
      });
    }, _POLLING_INTERVAL_MS$1);
  }
  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
  attachListener() {
    window.addEventListener("storage", this.boundEventHandler);
  }
  detachListener() {
    window.removeEventListener("storage", this.boundEventHandler);
  }
  _addListener(key, listener) {
    if (Object.keys(this.listeners).length === 0) {
      if (this.fallbackToPolling) {
        this.startPolling();
      } else {
        this.attachListener();
      }
    }
    if (!this.listeners[key]) {
      this.listeners[key] = /* @__PURE__ */ new Set();
      this.localCache[key] = this.storage.getItem(key);
    }
    this.listeners[key].add(listener);
  }
  _removeListener(key, listener) {
    if (this.listeners[key]) {
      this.listeners[key].delete(listener);
      if (this.listeners[key].size === 0) {
        delete this.listeners[key];
      }
    }
    if (Object.keys(this.listeners).length === 0) {
      this.detachListener();
      this.stopPolling();
    }
  }
  // Update local cache on base operations:
  async _set(key, value) {
    await super._set(key, value);
    this.localCache[key] = JSON.stringify(value);
  }
  async _get(key) {
    const value = await super._get(key);
    this.localCache[key] = JSON.stringify(value);
    return value;
  }
  async _remove(key) {
    await super._remove(key);
    delete this.localCache[key];
  }
};
BrowserLocalPersistence.type = "LOCAL";
var browserLocalPersistence = BrowserLocalPersistence;
var POLLING_INTERVAL_MS = 1e3;
function getDocumentCookie(name4) {
  const escapedName = name4.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  const matcher = RegExp(`${escapedName}=([^;]+)`);
  return document.cookie.match(matcher)?.[1] ?? null;
}
__name(getDocumentCookie, "getDocumentCookie");
function getCookieName(key) {
  const isDevMode = window.location.protocol === "http:";
  return `${isDevMode ? "__dev_" : "__HOST-"}FIREBASE_${key.split(":")[3]}`;
}
__name(getCookieName, "getCookieName");
var CookiePersistence = class {
  static {
    __name(this, "CookiePersistence");
  }
  constructor() {
    this.type = "COOKIE";
    this.listenerUnsubscribes = /* @__PURE__ */ new Map();
  }
  // used to get the URL to the backend to proxy to
  _getFinalTarget(originalUrl) {
    if (typeof window === void 0) {
      return originalUrl;
    }
    const url = new URL(`${window.location.origin}/__cookies__`);
    url.searchParams.set("finalTarget", originalUrl);
    return url;
  }
  // To be a usable persistence method in a chain browserCookiePersistence ensures that
  // prerequisites have been met, namely that we're in a secureContext, navigator and document are
  // available and cookies are enabled. Not all UAs support these method, so fallback accordingly.
  async _isAvailable() {
    if (typeof isSecureContext === "boolean" && !isSecureContext) {
      return false;
    }
    if (typeof navigator === "undefined" || typeof document === "undefined") {
      return false;
    }
    return navigator.cookieEnabled ?? true;
  }
  // Set should be a noop as we expect middleware to handle this
  async _set(_key, _value) {
    return;
  }
  // Attempt to get the cookie from cookieStore, fallback to document.cookie
  async _get(key) {
    if (!this._isAvailable()) {
      return null;
    }
    const name4 = getCookieName(key);
    if (window.cookieStore) {
      const cookie = await window.cookieStore.get(name4);
      return cookie?.value;
    }
    return getDocumentCookie(name4);
  }
  // Log out by overriding the idToken with a sentinel value of ""
  async _remove(key) {
    if (!this._isAvailable()) {
      return;
    }
    const existingValue = await this._get(key);
    if (!existingValue) {
      return;
    }
    const name4 = getCookieName(key);
    document.cookie = `${name4}=;Max-Age=34560000;Partitioned;Secure;SameSite=Strict;Path=/;Priority=High`;
    await fetch(`/__cookies__`, { method: "DELETE" }).catch(() => void 0);
  }
  // Listen for cookie changes, both cookieStore and fallback to polling document.cookie
  _addListener(key, listener) {
    if (!this._isAvailable()) {
      return;
    }
    const name4 = getCookieName(key);
    if (window.cookieStore) {
      const cb = /* @__PURE__ */ __name((event) => {
        const changedCookie = event.changed.find(
          (change) => change.name === name4,
        );
        if (changedCookie) {
          listener(changedCookie.value);
        }
        const deletedCookie = event.deleted.find(
          (change) => change.name === name4,
        );
        if (deletedCookie) {
          listener(null);
        }
      }, "cb");
      const unsubscribe2 = /* @__PURE__ */ __name(
        () => window.cookieStore.removeEventListener("change", cb),
        "unsubscribe",
      );
      this.listenerUnsubscribes.set(listener, unsubscribe2);
      return window.cookieStore.addEventListener("change", cb);
    }
    let lastValue = getDocumentCookie(name4);
    const interval = setInterval(() => {
      const currentValue = getDocumentCookie(name4);
      if (currentValue !== lastValue) {
        listener(currentValue);
        lastValue = currentValue;
      }
    }, POLLING_INTERVAL_MS);
    const unsubscribe = /* @__PURE__ */ __name(
      () => clearInterval(interval),
      "unsubscribe",
    );
    this.listenerUnsubscribes.set(listener, unsubscribe);
  }
  _removeListener(_key, listener) {
    const unsubscribe = this.listenerUnsubscribes.get(listener);
    if (!unsubscribe) {
      return;
    }
    unsubscribe();
    this.listenerUnsubscribes.delete(listener);
  }
};
CookiePersistence.type = "COOKIE";
var BrowserSessionPersistence = class extends BrowserPersistenceClass {
  static {
    __name(this, "BrowserSessionPersistence");
  }
  constructor() {
    super(
      () => window.sessionStorage,
      "SESSION",
      /* PersistenceType.SESSION */
    );
  }
  _addListener(_key, _listener) {
    return;
  }
  _removeListener(_key, _listener) {
    return;
  }
};
BrowserSessionPersistence.type = "SESSION";
var browserSessionPersistence = BrowserSessionPersistence;
function _allSettled(promises) {
  return Promise.all(
    promises.map(async (promise) => {
      try {
        const value = await promise;
        return {
          fulfilled: true,
          value,
        };
      } catch (reason) {
        return {
          fulfilled: false,
          reason,
        };
      }
    }),
  );
}
__name(_allSettled, "_allSettled");
var Receiver = class _Receiver {
  static {
    __name(this, "Receiver");
  }
  constructor(eventTarget) {
    this.eventTarget = eventTarget;
    this.handlersMap = {};
    this.boundEventHandler = this.handleEvent.bind(this);
  }
  /**
   * Obtain an instance of a Receiver for a given event target, if none exists it will be created.
   *
   * @param eventTarget - An event target (such as window or self) through which the underlying
   * messages will be received.
   */
  static _getInstance(eventTarget) {
    const existingInstance = this.receivers.find((receiver) =>
      receiver.isListeningto(eventTarget),
    );
    if (existingInstance) {
      return existingInstance;
    }
    const newInstance = new _Receiver(eventTarget);
    this.receivers.push(newInstance);
    return newInstance;
  }
  isListeningto(eventTarget) {
    return this.eventTarget === eventTarget;
  }
  /**
   * Fans out a MessageEvent to the appropriate listeners.
   *
   * @remarks
   * Sends an {@link Status.ACK} upon receipt and a {@link Status.DONE} once all handlers have
   * finished processing.
   *
   * @param event - The MessageEvent.
   *
   */
  async handleEvent(event) {
    const messageEvent = event;
    const { eventId, eventType, data } = messageEvent.data;
    const handlers = this.handlersMap[eventType];
    if (!handlers?.size) {
      return;
    }
    messageEvent.ports[0].postMessage({
      status: "ack",
      eventId,
      eventType,
    });
    const promises = Array.from(handlers).map(async (handler) =>
      handler(messageEvent.origin, data),
    );
    const response = await _allSettled(promises);
    messageEvent.ports[0].postMessage({
      status: "done",
      eventId,
      eventType,
      response,
    });
  }
  /**
   * Subscribe an event handler for a particular event.
   *
   * @param eventType - Event name to subscribe to.
   * @param eventHandler - The event handler which should receive the events.
   *
   */
  _subscribe(eventType, eventHandler) {
    if (Object.keys(this.handlersMap).length === 0) {
      this.eventTarget.addEventListener("message", this.boundEventHandler);
    }
    if (!this.handlersMap[eventType]) {
      this.handlersMap[eventType] = /* @__PURE__ */ new Set();
    }
    this.handlersMap[eventType].add(eventHandler);
  }
  /**
   * Unsubscribe an event handler from a particular event.
   *
   * @param eventType - Event name to unsubscribe from.
   * @param eventHandler - Optional event handler, if none provided, unsubscribe all handlers on this event.
   *
   */
  _unsubscribe(eventType, eventHandler) {
    if (this.handlersMap[eventType] && eventHandler) {
      this.handlersMap[eventType].delete(eventHandler);
    }
    if (!eventHandler || this.handlersMap[eventType].size === 0) {
      delete this.handlersMap[eventType];
    }
    if (Object.keys(this.handlersMap).length === 0) {
      this.eventTarget.removeEventListener("message", this.boundEventHandler);
    }
  }
};
Receiver.receivers = [];
function _generateEventId(prefix = "", digits = 10) {
  let random = "";
  for (let i = 0; i < digits; i++) {
    random += Math.floor(Math.random() * 10);
  }
  return prefix + random;
}
__name(_generateEventId, "_generateEventId");
var Sender = class {
  static {
    __name(this, "Sender");
  }
  constructor(target) {
    this.target = target;
    this.handlers = /* @__PURE__ */ new Set();
  }
  /**
   * Unsubscribe the handler and remove it from our tracking Set.
   *
   * @param handler - The handler to unsubscribe.
   */
  removeMessageHandler(handler) {
    if (handler.messageChannel) {
      handler.messageChannel.port1.removeEventListener(
        "message",
        handler.onMessage,
      );
      handler.messageChannel.port1.close();
    }
    this.handlers.delete(handler);
  }
  /**
   * Send a message to the Receiver located at {@link target}.
   *
   * @remarks
   * We'll first wait a bit for an ACK , if we get one we will wait significantly longer until the
   * receiver has had a chance to fully process the event.
   *
   * @param eventType - Type of event to send.
   * @param data - The payload of the event.
   * @param timeout - Timeout for waiting on an ACK from the receiver.
   *
   * @returns An array of settled promises from all the handlers that were listening on the receiver.
   */
  async _send(eventType, data, timeout = 50) {
    const messageChannel =
      typeof MessageChannel !== "undefined" ? new MessageChannel() : null;
    if (!messageChannel) {
      throw new Error(
        "connection_unavailable",
        /* _MessageError.CONNECTION_UNAVAILABLE */
      );
    }
    let completionTimer;
    let handler;
    return new Promise((resolve, reject) => {
      const eventId = _generateEventId("", 20);
      messageChannel.port1.start();
      const ackTimer = setTimeout(() => {
        reject(
          new Error(
            "unsupported_event",
            /* _MessageError.UNSUPPORTED_EVENT */
          ),
        );
      }, timeout);
      handler = {
        messageChannel,
        onMessage(event) {
          const messageEvent = event;
          if (messageEvent.data.eventId !== eventId) {
            return;
          }
          switch (messageEvent.data.status) {
            case "ack":
              clearTimeout(ackTimer);
              completionTimer = setTimeout(
                () => {
                  reject(
                    new Error(
                      "timeout",
                      /* _MessageError.TIMEOUT */
                    ),
                  );
                },
                3e3,
                /* _TimeoutDuration.COMPLETION */
              );
              break;
            case "done":
              clearTimeout(completionTimer);
              resolve(messageEvent.data.response);
              break;
            default:
              clearTimeout(ackTimer);
              clearTimeout(completionTimer);
              reject(
                new Error(
                  "invalid_response",
                  /* _MessageError.INVALID_RESPONSE */
                ),
              );
              break;
          }
        },
      };
      this.handlers.add(handler);
      messageChannel.port1.addEventListener("message", handler.onMessage);
      this.target.postMessage(
        {
          eventType,
          eventId,
          data,
        },
        [messageChannel.port2],
      );
    }).finally(() => {
      if (handler) {
        this.removeMessageHandler(handler);
      }
    });
  }
};
function _window() {
  return window;
}
__name(_window, "_window");
function _setWindowLocation(url) {
  _window().location.href = url;
}
__name(_setWindowLocation, "_setWindowLocation");
function _isWorker() {
  return (
    typeof _window()["WorkerGlobalScope"] !== "undefined" &&
    typeof _window()["importScripts"] === "function"
  );
}
__name(_isWorker, "_isWorker");
async function _getActiveServiceWorker() {
  if (!navigator?.serviceWorker) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.active;
  } catch {
    return null;
  }
}
__name(_getActiveServiceWorker, "_getActiveServiceWorker");
function _getServiceWorkerController() {
  return navigator?.serviceWorker?.controller || null;
}
__name(_getServiceWorkerController, "_getServiceWorkerController");
function _getWorkerGlobalScope() {
  return _isWorker() ? self : null;
}
__name(_getWorkerGlobalScope, "_getWorkerGlobalScope");
var DB_NAME2 = "firebaseLocalStorageDb";
var DB_VERSION2 = 1;
var DB_OBJECTSTORE_NAME = "firebaseLocalStorage";
var DB_DATA_KEYPATH = "fbase_key";
var DBPromise = class {
  static {
    __name(this, "DBPromise");
  }
  constructor(request) {
    this.request = request;
  }
  toPromise() {
    return new Promise((resolve, reject) => {
      this.request.addEventListener("success", () => {
        resolve(this.request.result);
      });
      this.request.addEventListener("error", () => {
        reject(this.request.error);
      });
    });
  }
};
function getObjectStore(db, isReadWrite) {
  return db
    .transaction([DB_OBJECTSTORE_NAME], isReadWrite ? "readwrite" : "readonly")
    .objectStore(DB_OBJECTSTORE_NAME);
}
__name(getObjectStore, "getObjectStore");
function _deleteDatabase() {
  const request = indexedDB.deleteDatabase(DB_NAME2);
  return new DBPromise(request).toPromise();
}
__name(_deleteDatabase, "_deleteDatabase");
function _openDatabase() {
  const request = indexedDB.open(DB_NAME2, DB_VERSION2);
  return new Promise((resolve, reject) => {
    request.addEventListener("error", () => {
      reject(request.error);
    });
    request.addEventListener("upgradeneeded", () => {
      const db = request.result;
      try {
        db.createObjectStore(DB_OBJECTSTORE_NAME, { keyPath: DB_DATA_KEYPATH });
      } catch (e) {
        reject(e);
      }
    });
    request.addEventListener("success", async () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_OBJECTSTORE_NAME)) {
        db.close();
        await _deleteDatabase();
        resolve(await _openDatabase());
      } else {
        resolve(db);
      }
    });
  });
}
__name(_openDatabase, "_openDatabase");
async function _putObject(db, key, value) {
  const request = getObjectStore(db, true).put({
    [DB_DATA_KEYPATH]: key,
    value,
  });
  return new DBPromise(request).toPromise();
}
__name(_putObject, "_putObject");
async function getObject(db, key) {
  const request = getObjectStore(db, false).get(key);
  const data = await new DBPromise(request).toPromise();
  return data === void 0 ? null : data.value;
}
__name(getObject, "getObject");
function _deleteObject(db, key) {
  const request = getObjectStore(db, true).delete(key);
  return new DBPromise(request).toPromise();
}
__name(_deleteObject, "_deleteObject");
var _POLLING_INTERVAL_MS = 800;
var _TRANSACTION_RETRY_COUNT = 3;
var IndexedDBLocalPersistence = class {
  static {
    __name(this, "IndexedDBLocalPersistence");
  }
  constructor() {
    this.type = "LOCAL";
    this.dbPromise = null;
    this._shouldAllowMigration = true;
    this.listeners = {};
    this.localCache = {};
    this.pollTimer = null;
    this.pendingWrites = 0;
    this.receiver = null;
    this.sender = null;
    this.serviceWorkerReceiverAvailable = false;
    this.activeServiceWorker = null;
    this._workerInitializationPromise =
      this.initializeServiceWorkerMessaging().then(
        () => {},
        () => {},
      );
  }
  async _openDb() {
    if (this.dbPromise) {
      return this.dbPromise;
    }
    this.dbPromise = _openDatabase();
    this.dbPromise.catch(() => {
      this.dbPromise = null;
    });
    return this.dbPromise;
  }
  async _withRetries(op) {
    let numAttempts = 0;
    while (true) {
      try {
        const db = await this._openDb();
        return await op(db);
      } catch (e) {
        if (numAttempts++ > _TRANSACTION_RETRY_COUNT) {
          throw e;
        }
        if (this.dbPromise) {
          const db = await this.dbPromise;
          db.close();
          this.dbPromise = null;
        }
      }
    }
  }
  /**
   * IndexedDB events do not propagate from the main window to the worker context.  We rely on a
   * postMessage interface to send these events to the worker ourselves.
   */
  async initializeServiceWorkerMessaging() {
    return _isWorker() ? this.initializeReceiver() : this.initializeSender();
  }
  /**
   * As the worker we should listen to events from the main window.
   */
  async initializeReceiver() {
    this.receiver = Receiver._getInstance(_getWorkerGlobalScope());
    this.receiver._subscribe("keyChanged", async (_origin, data) => {
      const keys = await this._poll();
      return {
        keyProcessed: keys.includes(data.key),
      };
    });
    this.receiver._subscribe("ping", async (_origin, _data) => {
      return [
        "keyChanged",
        /* _EventType.KEY_CHANGED */
      ];
    });
  }
  /**
   * As the main window, we should let the worker know when keys change (set and remove).
   *
   * @remarks
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/ready | ServiceWorkerContainer.ready}
   * may not resolve.
   */
  async initializeSender() {
    this.activeServiceWorker = await _getActiveServiceWorker();
    if (!this.activeServiceWorker) {
      return;
    }
    this.sender = new Sender(this.activeServiceWorker);
    const results = await this.sender._send(
      "ping",
      {},
      800,
      /* _TimeoutDuration.LONG_ACK */
    );
    if (!results) {
      return;
    }
    if (
      results[0]?.fulfilled &&
      results[0]?.value.includes(
        "keyChanged",
        /* _EventType.KEY_CHANGED */
      )
    ) {
      this.serviceWorkerReceiverAvailable = true;
    }
  }
  /**
   * Let the worker know about a changed key, the exact key doesn't technically matter since the
   * worker will just trigger a full sync anyway.
   *
   * @remarks
   * For now, we only support one service worker per page.
   *
   * @param key - Storage key which changed.
   */
  async notifyServiceWorker(key) {
    if (
      !this.sender ||
      !this.activeServiceWorker ||
      _getServiceWorkerController() !== this.activeServiceWorker
    ) {
      return;
    }
    try {
      await this.sender._send(
        "keyChanged",
        { key },
        // Use long timeout if receiver has previously responded to a ping from us.
        this.serviceWorkerReceiverAvailable ? 800 : 50,
        /* _TimeoutDuration.ACK */
      );
    } catch {}
  }
  async _isAvailable() {
    try {
      if (!indexedDB) {
        return false;
      }
      await this._withRetries(async (db) => {
        await _putObject(db, STORAGE_AVAILABLE_KEY, "1");
        await _deleteObject(db, STORAGE_AVAILABLE_KEY);
      });
      return true;
    } catch {}
    return false;
  }
  async _withPendingWrite(write) {
    this.pendingWrites++;
    try {
      await write();
    } finally {
      this.pendingWrites--;
    }
  }
  async _set(key, value) {
    return this._withPendingWrite(async () => {
      await this._withRetries((db) => _putObject(db, key, value));
      this.localCache[key] = value;
      return this.notifyServiceWorker(key);
    });
  }
  async _get(key) {
    const obj = await this._withRetries((db) => getObject(db, key));
    this.localCache[key] = obj;
    return obj;
  }
  async _remove(key) {
    return this._withPendingWrite(async () => {
      await this._withRetries((db) => _deleteObject(db, key));
      delete this.localCache[key];
      return this.notifyServiceWorker(key);
    });
  }
  async _poll() {
    const result = await this._withRetries((db) => {
      const getAllRequest = getObjectStore(db, false).getAll();
      return new DBPromise(getAllRequest).toPromise();
    });
    if (!result) {
      return [];
    }
    if (this.pendingWrites !== 0) {
      return [];
    }
    const keys = [];
    const keysInResult = /* @__PURE__ */ new Set();
    if (result.length !== 0) {
      for (const { fbase_key: key, value } of result) {
        keysInResult.add(key);
        if (JSON.stringify(this.localCache[key]) !== JSON.stringify(value)) {
          this.notifyListeners(key, value);
          keys.push(key);
        }
      }
    }
    for (const localKey of Object.keys(this.localCache)) {
      if (this.localCache[localKey] && !keysInResult.has(localKey)) {
        this.notifyListeners(localKey, null);
        keys.push(localKey);
      }
    }
    return keys;
  }
  notifyListeners(key, newValue) {
    this.localCache[key] = newValue;
    const listeners = this.listeners[key];
    if (listeners) {
      for (const listener of Array.from(listeners)) {
        listener(newValue);
      }
    }
  }
  startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(
      async () => this._poll(),
      _POLLING_INTERVAL_MS,
    );
  }
  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
  _addListener(key, listener) {
    if (Object.keys(this.listeners).length === 0) {
      this.startPolling();
    }
    if (!this.listeners[key]) {
      this.listeners[key] = /* @__PURE__ */ new Set();
      void this._get(key);
    }
    this.listeners[key].add(listener);
  }
  _removeListener(key, listener) {
    if (this.listeners[key]) {
      this.listeners[key].delete(listener);
      if (this.listeners[key].size === 0) {
        delete this.listeners[key];
      }
    }
    if (Object.keys(this.listeners).length === 0) {
      this.stopPolling();
    }
  }
};
IndexedDBLocalPersistence.type = "LOCAL";
var indexedDBLocalPersistence = IndexedDBLocalPersistence;
function startSignInPhoneMfa(auth, request) {
  return _performApiRequest(
    auth,
    "POST",
    "/v2/accounts/mfaSignIn:start",
    _addTidIfNecessary(auth, request),
  );
}
__name(startSignInPhoneMfa, "startSignInPhoneMfa");
function finalizeSignInPhoneMfa(auth, request) {
  return _performApiRequest(
    auth,
    "POST",
    "/v2/accounts/mfaSignIn:finalize",
    _addTidIfNecessary(auth, request),
  );
}
__name(finalizeSignInPhoneMfa, "finalizeSignInPhoneMfa");
function finalizeSignInTotpMfa(auth, request) {
  return _performApiRequest(
    auth,
    "POST",
    "/v2/accounts/mfaSignIn:finalize",
    _addTidIfNecessary(auth, request),
  );
}
__name(finalizeSignInTotpMfa, "finalizeSignInTotpMfa");
var _JSLOAD_CALLBACK = _generateCallbackName("rcb");
var NETWORK_TIMEOUT_DELAY = new Delay(3e4, 6e4);
var RECAPTCHA_VERIFIER_TYPE = "recaptcha";
async function _verifyPhoneNumber(auth, options, verifier) {
  if (!auth._getRecaptchaConfig()) {
    try {
      await _initializeRecaptchaConfig(auth);
    } catch (error) {
      console.log(
        "Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.",
      );
    }
  }
  try {
    let phoneInfoOptions;
    if (typeof options === "string") {
      phoneInfoOptions = {
        phoneNumber: options,
      };
    } else {
      phoneInfoOptions = options;
    }
    if ("session" in phoneInfoOptions) {
      const session = phoneInfoOptions.session;
      if ("phoneNumber" in phoneInfoOptions) {
        _assert(
          session.type === "enroll",
          auth,
          "internal-error",
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        const startPhoneMfaEnrollmentRequest = {
          idToken: session.credential,
          phoneEnrollmentInfo: {
            phoneNumber: phoneInfoOptions.phoneNumber,
            clientType: "CLIENT_TYPE_WEB",
            /* RecaptchaClientType.WEB */
          },
        };
        const startEnrollPhoneMfaActionCallback = /* @__PURE__ */ __name(
          async (authInstance, request) => {
            if (request.phoneEnrollmentInfo.captchaResponse === FAKE_TOKEN) {
              _assert(
                verifier?.type === RECAPTCHA_VERIFIER_TYPE,
                authInstance,
                "argument-error",
                /* AuthErrorCode.ARGUMENT_ERROR */
              );
              const requestWithRecaptchaV2 = await injectRecaptchaV2Token(
                authInstance,
                request,
                verifier,
              );
              return startEnrollPhoneMfa(authInstance, requestWithRecaptchaV2);
            }
            return startEnrollPhoneMfa(authInstance, request);
          },
          "startEnrollPhoneMfaActionCallback",
        );
        const startPhoneMfaEnrollmentResponse = handleRecaptchaFlow(
          auth,
          startPhoneMfaEnrollmentRequest,
          "mfaSmsEnrollment",
          startEnrollPhoneMfaActionCallback,
          "PHONE_PROVIDER",
          /* RecaptchaAuthProvider.PHONE_PROVIDER */
        );
        const response = await startPhoneMfaEnrollmentResponse.catch(
          (error) => {
            return Promise.reject(error);
          },
        );
        return response.phoneSessionInfo.sessionInfo;
      } else {
        _assert(
          session.type === "signin",
          auth,
          "internal-error",
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        const mfaEnrollmentId =
          phoneInfoOptions.multiFactorHint?.uid ||
          phoneInfoOptions.multiFactorUid;
        _assert(
          mfaEnrollmentId,
          auth,
          "missing-multi-factor-info",
          /* AuthErrorCode.MISSING_MFA_INFO */
        );
        const startPhoneMfaSignInRequest = {
          mfaPendingCredential: session.credential,
          mfaEnrollmentId,
          phoneSignInInfo: {
            clientType: "CLIENT_TYPE_WEB",
            /* RecaptchaClientType.WEB */
          },
        };
        const startSignInPhoneMfaActionCallback = /* @__PURE__ */ __name(
          async (authInstance, request) => {
            if (request.phoneSignInInfo.captchaResponse === FAKE_TOKEN) {
              _assert(
                verifier?.type === RECAPTCHA_VERIFIER_TYPE,
                authInstance,
                "argument-error",
                /* AuthErrorCode.ARGUMENT_ERROR */
              );
              const requestWithRecaptchaV2 = await injectRecaptchaV2Token(
                authInstance,
                request,
                verifier,
              );
              return startSignInPhoneMfa(authInstance, requestWithRecaptchaV2);
            }
            return startSignInPhoneMfa(authInstance, request);
          },
          "startSignInPhoneMfaActionCallback",
        );
        const startPhoneMfaSignInResponse = handleRecaptchaFlow(
          auth,
          startPhoneMfaSignInRequest,
          "mfaSmsSignIn",
          startSignInPhoneMfaActionCallback,
          "PHONE_PROVIDER",
          /* RecaptchaAuthProvider.PHONE_PROVIDER */
        );
        const response = await startPhoneMfaSignInResponse.catch((error) => {
          return Promise.reject(error);
        });
        return response.phoneResponseInfo.sessionInfo;
      }
    } else {
      const sendPhoneVerificationCodeRequest = {
        phoneNumber: phoneInfoOptions.phoneNumber,
        clientType: "CLIENT_TYPE_WEB",
        /* RecaptchaClientType.WEB */
      };
      const sendPhoneVerificationCodeActionCallback = /* @__PURE__ */ __name(
        async (authInstance, request) => {
          if (request.captchaResponse === FAKE_TOKEN) {
            _assert(
              verifier?.type === RECAPTCHA_VERIFIER_TYPE,
              authInstance,
              "argument-error",
              /* AuthErrorCode.ARGUMENT_ERROR */
            );
            const requestWithRecaptchaV2 = await injectRecaptchaV2Token(
              authInstance,
              request,
              verifier,
            );
            return sendPhoneVerificationCode(
              authInstance,
              requestWithRecaptchaV2,
            );
          }
          return sendPhoneVerificationCode(authInstance, request);
        },
        "sendPhoneVerificationCodeActionCallback",
      );
      const sendPhoneVerificationCodeResponse = handleRecaptchaFlow(
        auth,
        sendPhoneVerificationCodeRequest,
        "sendVerificationCode",
        sendPhoneVerificationCodeActionCallback,
        "PHONE_PROVIDER",
        /* RecaptchaAuthProvider.PHONE_PROVIDER */
      );
      const response = await sendPhoneVerificationCodeResponse.catch(
        (error) => {
          return Promise.reject(error);
        },
      );
      return response.sessionInfo;
    }
  } finally {
    verifier?._reset();
  }
}
__name(_verifyPhoneNumber, "_verifyPhoneNumber");
async function injectRecaptchaV2Token(auth, request, recaptchaV2Verifier) {
  _assert(
    recaptchaV2Verifier.type === RECAPTCHA_VERIFIER_TYPE,
    auth,
    "argument-error",
    /* AuthErrorCode.ARGUMENT_ERROR */
  );
  const recaptchaV2Token = await recaptchaV2Verifier.verify();
  _assert(
    typeof recaptchaV2Token === "string",
    auth,
    "argument-error",
    /* AuthErrorCode.ARGUMENT_ERROR */
  );
  const newRequest = { ...request };
  if ("phoneEnrollmentInfo" in newRequest) {
    const phoneNumber = newRequest.phoneEnrollmentInfo.phoneNumber;
    const captchaResponse = newRequest.phoneEnrollmentInfo.captchaResponse;
    const clientType = newRequest.phoneEnrollmentInfo.clientType;
    const recaptchaVersion = newRequest.phoneEnrollmentInfo.recaptchaVersion;
    Object.assign(newRequest, {
      phoneEnrollmentInfo: {
        phoneNumber,
        recaptchaToken: recaptchaV2Token,
        captchaResponse,
        clientType,
        recaptchaVersion,
      },
    });
    return newRequest;
  } else if ("phoneSignInInfo" in newRequest) {
    const captchaResponse = newRequest.phoneSignInInfo.captchaResponse;
    const clientType = newRequest.phoneSignInInfo.clientType;
    const recaptchaVersion = newRequest.phoneSignInInfo.recaptchaVersion;
    Object.assign(newRequest, {
      phoneSignInInfo: {
        recaptchaToken: recaptchaV2Token,
        captchaResponse,
        clientType,
        recaptchaVersion,
      },
    });
    return newRequest;
  } else {
    Object.assign(newRequest, { recaptchaToken: recaptchaV2Token });
    return newRequest;
  }
}
__name(injectRecaptchaV2Token, "injectRecaptchaV2Token");
var PhoneAuthProvider = class _PhoneAuthProvider {
  static {
    __name(this, "PhoneAuthProvider");
  }
  /**
   * @param auth - The Firebase {@link Auth} instance in which sign-ins should occur.
   *
   */
  constructor(auth) {
    this.providerId = _PhoneAuthProvider.PROVIDER_ID;
    this.auth = _castAuth(auth);
  }
  /**
   *
   * Starts a phone number authentication flow by sending a verification code to the given phone
   * number.
   *
   * @example
   * ```javascript
   * const provider = new PhoneAuthProvider(auth);
   * const verificationId = await provider.verifyPhoneNumber(phoneNumber, applicationVerifier);
   * // Obtain verificationCode from the user.
   * const authCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
   * const userCredential = await signInWithCredential(auth, authCredential);
   * ```
   *
   * @example
   * An alternative flow is provided using the `signInWithPhoneNumber` method.
   * ```javascript
   * const confirmationResult = signInWithPhoneNumber(auth, phoneNumber, applicationVerifier);
   * // Obtain verificationCode from the user.
   * const userCredential = confirmationResult.confirm(verificationCode);
   * ```
   *
   * @param phoneInfoOptions - The user's {@link PhoneInfoOptions}. The phone number should be in
   * E.164 format (e.g. +16505550101).
   * @param applicationVerifier - An {@link ApplicationVerifier}, which prevents
   * requests from unauthorized clients. This SDK includes an implementation
   * based on reCAPTCHA v2, {@link RecaptchaVerifier}. If you've enabled
   * reCAPTCHA Enterprise bot protection in Enforce mode, this parameter is
   * optional; in all other configurations, the parameter is required.
   *
   * @returns A Promise for a verification ID that can be passed to
   * {@link PhoneAuthProvider.credential} to identify this flow.
   */
  verifyPhoneNumber(phoneOptions, applicationVerifier) {
    return _verifyPhoneNumber(
      this.auth,
      phoneOptions,
      getModularInstance(applicationVerifier),
    );
  }
  /**
   * Creates a phone auth credential, given the verification ID from
   * {@link PhoneAuthProvider.verifyPhoneNumber} and the code that was sent to the user's
   * mobile device.
   *
   * @example
   * ```javascript
   * const provider = new PhoneAuthProvider(auth);
   * const verificationId = provider.verifyPhoneNumber(phoneNumber, applicationVerifier);
   * // Obtain verificationCode from the user.
   * const authCredential = PhoneAuthProvider.credential(verificationId, verificationCode);
   * const userCredential = signInWithCredential(auth, authCredential);
   * ```
   *
   * @example
   * An alternative flow is provided using the `signInWithPhoneNumber` method.
   * ```javascript
   * const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, applicationVerifier);
   * // Obtain verificationCode from the user.
   * const userCredential = await confirmationResult.confirm(verificationCode);
   * ```
   *
   * @param verificationId - The verification ID returned from {@link PhoneAuthProvider.verifyPhoneNumber}.
   * @param verificationCode - The verification code sent to the user's mobile device.
   *
   * @returns The auth provider credential.
   */
  static credential(verificationId, verificationCode) {
    return PhoneAuthCredential._fromVerification(
      verificationId,
      verificationCode,
    );
  }
  /**
   * Generates an {@link AuthCredential} from a {@link UserCredential}.
   * @param userCredential - The user credential.
   */
  static credentialFromResult(userCredential) {
    const credential = userCredential;
    return _PhoneAuthProvider.credentialFromTaggedObject(credential);
  }
  /**
   * Returns an {@link AuthCredential} when passed an error.
   *
   * @remarks
   *
   * This method works for errors like
   * `auth/account-exists-with-different-credentials`. This is useful for
   * recovering when attempting to set a user's phone number but the number
   * in question is already tied to another account. For example, the following
   * code tries to update the current user's phone number, and if that
   * fails, links the user with the account associated with that number:
   *
   * ```js
   * const provider = new PhoneAuthProvider(auth);
   * const verificationId = await provider.verifyPhoneNumber(number, verifier);
   * try {
   *   const code = ''; // Prompt the user for the verification code
   *   await updatePhoneNumber(
   *       auth.currentUser,
   *       PhoneAuthProvider.credential(verificationId, code));
   * } catch (e) {
   *   if ((e as FirebaseError)?.code === 'auth/account-exists-with-different-credential') {
   *     const cred = PhoneAuthProvider.credentialFromError(e);
   *     await linkWithCredential(auth.currentUser, cred);
   *   }
   * }
   *
   * // At this point, auth.currentUser.phoneNumber === number.
   * ```
   *
   * @param error - The error to generate a credential from.
   */
  static credentialFromError(error) {
    return _PhoneAuthProvider.credentialFromTaggedObject(
      error.customData || {},
    );
  }
  static credentialFromTaggedObject({ _tokenResponse: tokenResponse }) {
    if (!tokenResponse) {
      return null;
    }
    const { phoneNumber, temporaryProof } = tokenResponse;
    if (phoneNumber && temporaryProof) {
      return PhoneAuthCredential._fromTokenResponse(
        phoneNumber,
        temporaryProof,
      );
    }
    return null;
  }
};
PhoneAuthProvider.PROVIDER_ID = "phone";
PhoneAuthProvider.PHONE_SIGN_IN_METHOD = "phone";
function _withDefaultResolver(auth, resolverOverride) {
  if (resolverOverride) {
    return _getInstance(resolverOverride);
  }
  _assert(
    auth._popupRedirectResolver,
    auth,
    "argument-error",
    /* AuthErrorCode.ARGUMENT_ERROR */
  );
  return auth._popupRedirectResolver;
}
__name(_withDefaultResolver, "_withDefaultResolver");
var IdpCredential = class extends AuthCredential {
  static {
    __name(this, "IdpCredential");
  }
  constructor(params) {
    super(
      "custom",
      "custom",
      /* ProviderId.CUSTOM */
    );
    this.params = params;
  }
  _getIdTokenResponse(auth) {
    return signInWithIdp(auth, this._buildIdpRequest());
  }
  _linkToIdToken(auth, idToken) {
    return signInWithIdp(auth, this._buildIdpRequest(idToken));
  }
  _getReauthenticationResolver(auth) {
    return signInWithIdp(auth, this._buildIdpRequest());
  }
  _buildIdpRequest(idToken) {
    const request = {
      requestUri: this.params.requestUri,
      sessionId: this.params.sessionId,
      postBody: this.params.postBody,
      tenantId: this.params.tenantId,
      pendingToken: this.params.pendingToken,
      returnSecureToken: true,
      returnIdpCredential: true,
    };
    if (idToken) {
      request.idToken = idToken;
    }
    return request;
  }
};
function _signIn(params) {
  return _signInWithCredential(
    params.auth,
    new IdpCredential(params),
    params.bypassAuthState,
  );
}
__name(_signIn, "_signIn");
function _reauth(params) {
  const { auth, user } = params;
  _assert(
    user,
    auth,
    "internal-error",
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  return _reauthenticate(
    user,
    new IdpCredential(params),
    params.bypassAuthState,
  );
}
__name(_reauth, "_reauth");
async function _link(params) {
  const { auth, user } = params;
  _assert(
    user,
    auth,
    "internal-error",
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  return _link$1(user, new IdpCredential(params), params.bypassAuthState);
}
__name(_link, "_link");
var AbstractPopupRedirectOperation = class {
  static {
    __name(this, "AbstractPopupRedirectOperation");
  }
  constructor(auth, filter, resolver, user, bypassAuthState = false) {
    this.auth = auth;
    this.resolver = resolver;
    this.user = user;
    this.bypassAuthState = bypassAuthState;
    this.pendingPromise = null;
    this.eventManager = null;
    this.filter = Array.isArray(filter) ? filter : [filter];
  }
  execute() {
    return new Promise(async (resolve, reject) => {
      this.pendingPromise = { resolve, reject };
      try {
        this.eventManager = await this.resolver._initialize(this.auth);
        await this.onExecution();
        this.eventManager.registerConsumer(this);
      } catch (e) {
        this.reject(e);
      }
    });
  }
  async onAuthEvent(event) {
    const { urlResponse, sessionId, postBody, tenantId, error, type } = event;
    if (error) {
      this.reject(error);
      return;
    }
    const params = {
      auth: this.auth,
      requestUri: urlResponse,
      sessionId,
      tenantId: tenantId || void 0,
      postBody: postBody || void 0,
      user: this.user,
      bypassAuthState: this.bypassAuthState,
    };
    try {
      this.resolve(await this.getIdpTask(type)(params));
    } catch (e) {
      this.reject(e);
    }
  }
  onError(error) {
    this.reject(error);
  }
  getIdpTask(type) {
    switch (type) {
      case "signInViaPopup":
      case "signInViaRedirect":
        return _signIn;
      case "linkViaPopup":
      case "linkViaRedirect":
        return _link;
      case "reauthViaPopup":
      case "reauthViaRedirect":
        return _reauth;
      default:
        _fail(
          this.auth,
          "internal-error",
          /* AuthErrorCode.INTERNAL_ERROR */
        );
    }
  }
  resolve(cred) {
    debugAssert(this.pendingPromise, "Pending promise was never set");
    this.pendingPromise.resolve(cred);
    this.unregisterAndCleanUp();
  }
  reject(error) {
    debugAssert(this.pendingPromise, "Pending promise was never set");
    this.pendingPromise.reject(error);
    this.unregisterAndCleanUp();
  }
  unregisterAndCleanUp() {
    if (this.eventManager) {
      this.eventManager.unregisterConsumer(this);
    }
    this.pendingPromise = null;
    this.cleanUp();
  }
};
var _POLL_WINDOW_CLOSE_TIMEOUT = new Delay(2e3, 1e4);
var PopupOperation = class _PopupOperation extends AbstractPopupRedirectOperation {
  static {
    __name(this, "PopupOperation");
  }
  constructor(auth, filter, provider, resolver, user) {
    super(auth, filter, resolver, user);
    this.provider = provider;
    this.authWindow = null;
    this.pollId = null;
    if (_PopupOperation.currentPopupAction) {
      _PopupOperation.currentPopupAction.cancel();
    }
    _PopupOperation.currentPopupAction = this;
  }
  async executeNotNull() {
    const result = await this.execute();
    _assert(
      result,
      this.auth,
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    return result;
  }
  async onExecution() {
    debugAssert(
      this.filter.length === 1,
      "Popup operations only handle one event",
    );
    const eventId = _generateEventId();
    this.authWindow = await this.resolver._openPopup(
      this.auth,
      this.provider,
      this.filter[0],
      // There's always one, see constructor
      eventId,
    );
    this.authWindow.associatedEvent = eventId;
    this.resolver._originValidation(this.auth).catch((e) => {
      this.reject(e);
    });
    this.resolver._isIframeWebStorageSupported(this.auth, (isSupported) => {
      if (!isSupported) {
        this.reject(
          _createError(
            this.auth,
            "web-storage-unsupported",
            /* AuthErrorCode.WEB_STORAGE_UNSUPPORTED */
          ),
        );
      }
    });
    this.pollUserCancellation();
  }
  get eventId() {
    return this.authWindow?.associatedEvent || null;
  }
  cancel() {
    this.reject(
      _createError(
        this.auth,
        "cancelled-popup-request",
        /* AuthErrorCode.EXPIRED_POPUP_REQUEST */
      ),
    );
  }
  cleanUp() {
    if (this.authWindow) {
      this.authWindow.close();
    }
    if (this.pollId) {
      window.clearTimeout(this.pollId);
    }
    this.authWindow = null;
    this.pollId = null;
    _PopupOperation.currentPopupAction = null;
  }
  pollUserCancellation() {
    const poll = /* @__PURE__ */ __name(() => {
      if (this.authWindow?.window?.closed) {
        this.pollId = window.setTimeout(
          () => {
            this.pollId = null;
            this.reject(
              _createError(
                this.auth,
                "popup-closed-by-user",
                /* AuthErrorCode.POPUP_CLOSED_BY_USER */
              ),
            );
          },
          8e3,
          /* _Timeout.AUTH_EVENT */
        );
        return;
      }
      this.pollId = window.setTimeout(poll, _POLL_WINDOW_CLOSE_TIMEOUT.get());
    }, "poll");
    poll();
  }
};
PopupOperation.currentPopupAction = null;
var PENDING_REDIRECT_KEY = "pendingRedirect";
var redirectOutcomeMap = /* @__PURE__ */ new Map();
var RedirectAction = class extends AbstractPopupRedirectOperation {
  static {
    __name(this, "RedirectAction");
  }
  constructor(auth, resolver, bypassAuthState = false) {
    super(
      auth,
      [
        "signInViaRedirect",
        "linkViaRedirect",
        "reauthViaRedirect",
        "unknown",
        /* AuthEventType.UNKNOWN */
      ],
      resolver,
      void 0,
      bypassAuthState,
    );
    this.eventId = null;
  }
  /**
   * Override the execute function; if we already have a redirect result, then
   * just return it.
   */
  async execute() {
    let readyOutcome = redirectOutcomeMap.get(this.auth._key());
    if (!readyOutcome) {
      try {
        const hasPendingRedirect = await _getAndClearPendingRedirectStatus(
          this.resolver,
          this.auth,
        );
        const result = hasPendingRedirect ? await super.execute() : null;
        readyOutcome = /* @__PURE__ */ __name(
          () => Promise.resolve(result),
          "readyOutcome",
        );
      } catch (e) {
        readyOutcome = /* @__PURE__ */ __name(
          () => Promise.reject(e),
          "readyOutcome",
        );
      }
      redirectOutcomeMap.set(this.auth._key(), readyOutcome);
    }
    if (!this.bypassAuthState) {
      redirectOutcomeMap.set(this.auth._key(), () => Promise.resolve(null));
    }
    return readyOutcome();
  }
  async onAuthEvent(event) {
    if (event.type === "signInViaRedirect") {
      return super.onAuthEvent(event);
    } else if (event.type === "unknown") {
      this.resolve(null);
      return;
    }
    if (event.eventId) {
      const user = await this.auth._redirectUserForId(event.eventId);
      if (user) {
        this.user = user;
        return super.onAuthEvent(event);
      } else {
        this.resolve(null);
      }
    }
  }
  async onExecution() {}
  cleanUp() {}
};
async function _getAndClearPendingRedirectStatus(resolver, auth) {
  const key = pendingRedirectKey(auth);
  const persistence = resolverPersistence(resolver);
  if (!(await persistence._isAvailable())) {
    return false;
  }
  const hasPendingRedirect = (await persistence._get(key)) === "true";
  await persistence._remove(key);
  return hasPendingRedirect;
}
__name(_getAndClearPendingRedirectStatus, "_getAndClearPendingRedirectStatus");
function _overrideRedirectResult(auth, result) {
  redirectOutcomeMap.set(auth._key(), result);
}
__name(_overrideRedirectResult, "_overrideRedirectResult");
function resolverPersistence(resolver) {
  return _getInstance(resolver._redirectPersistence);
}
__name(resolverPersistence, "resolverPersistence");
function pendingRedirectKey(auth) {
  return _persistenceKeyName(
    PENDING_REDIRECT_KEY,
    auth.config.apiKey,
    auth.name,
  );
}
__name(pendingRedirectKey, "pendingRedirectKey");
async function _getRedirectResult(
  auth,
  resolverExtern,
  bypassAuthState = false,
) {
  if (_isFirebaseServerApp(auth.app)) {
    return Promise.reject(
      _serverAppCurrentUserOperationNotSupportedError(auth),
    );
  }
  const authInternal = _castAuth(auth);
  const resolver = _withDefaultResolver(authInternal, resolverExtern);
  const action = new RedirectAction(authInternal, resolver, bypassAuthState);
  const result = await action.execute();
  if (result && !bypassAuthState) {
    delete result.user._redirectEventId;
    await authInternal._persistUserIfCurrent(result.user);
    await authInternal._setRedirectUser(null, resolverExtern);
  }
  return result;
}
__name(_getRedirectResult, "_getRedirectResult");
var EVENT_DUPLICATION_CACHE_DURATION_MS = 10 * 60 * 1e3;
var AuthEventManager = class {
  static {
    __name(this, "AuthEventManager");
  }
  constructor(auth) {
    this.auth = auth;
    this.cachedEventUids = /* @__PURE__ */ new Set();
    this.consumers = /* @__PURE__ */ new Set();
    this.queuedRedirectEvent = null;
    this.hasHandledPotentialRedirect = false;
    this.lastProcessedEventTime = Date.now();
  }
  registerConsumer(authEventConsumer) {
    this.consumers.add(authEventConsumer);
    if (
      this.queuedRedirectEvent &&
      this.isEventForConsumer(this.queuedRedirectEvent, authEventConsumer)
    ) {
      this.sendToConsumer(this.queuedRedirectEvent, authEventConsumer);
      this.saveEventToCache(this.queuedRedirectEvent);
      this.queuedRedirectEvent = null;
    }
  }
  unregisterConsumer(authEventConsumer) {
    this.consumers.delete(authEventConsumer);
  }
  onEvent(event) {
    if (this.hasEventBeenHandled(event)) {
      return false;
    }
    let handled = false;
    this.consumers.forEach((consumer) => {
      if (this.isEventForConsumer(event, consumer)) {
        handled = true;
        this.sendToConsumer(event, consumer);
        this.saveEventToCache(event);
      }
    });
    if (this.hasHandledPotentialRedirect || !isRedirectEvent(event)) {
      return handled;
    }
    this.hasHandledPotentialRedirect = true;
    if (!handled) {
      this.queuedRedirectEvent = event;
      handled = true;
    }
    return handled;
  }
  sendToConsumer(event, consumer) {
    if (event.error && !isNullRedirectEvent(event)) {
      const code = event.error.code?.split("auth/")[1] || "internal-error";
      consumer.onError(_createError(this.auth, code));
    } else {
      consumer.onAuthEvent(event);
    }
  }
  isEventForConsumer(event, consumer) {
    const eventIdMatches =
      consumer.eventId === null ||
      (!!event.eventId && event.eventId === consumer.eventId);
    return consumer.filter.includes(event.type) && eventIdMatches;
  }
  hasEventBeenHandled(event) {
    if (
      Date.now() - this.lastProcessedEventTime >=
      EVENT_DUPLICATION_CACHE_DURATION_MS
    ) {
      this.cachedEventUids.clear();
    }
    return this.cachedEventUids.has(eventUid(event));
  }
  saveEventToCache(event) {
    this.cachedEventUids.add(eventUid(event));
    this.lastProcessedEventTime = Date.now();
  }
};
function eventUid(e) {
  return [e.type, e.eventId, e.sessionId, e.tenantId]
    .filter((v2) => v2)
    .join("-");
}
__name(eventUid, "eventUid");
function isNullRedirectEvent({ type, error }) {
  return type === "unknown" && error?.code === `auth/${"no-auth-event"}`;
}
__name(isNullRedirectEvent, "isNullRedirectEvent");
function isRedirectEvent(event) {
  switch (event.type) {
    case "signInViaRedirect":
    case "linkViaRedirect":
    case "reauthViaRedirect":
      return true;
    case "unknown":
      return isNullRedirectEvent(event);
    default:
      return false;
  }
}
__name(isRedirectEvent, "isRedirectEvent");
async function _getProjectConfig(auth, request = {}) {
  return _performApiRequest(auth, "GET", "/v1/projects", request);
}
__name(_getProjectConfig, "_getProjectConfig");
var IP_ADDRESS_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
var HTTP_REGEX = /^https?/;
async function _validateOrigin(auth) {
  if (auth.config.emulator) {
    return;
  }
  const { authorizedDomains } = await _getProjectConfig(auth);
  for (const domain of authorizedDomains) {
    try {
      if (matchDomain(domain)) {
        return;
      }
    } catch {}
  }
  _fail(
    auth,
    "unauthorized-domain",
    /* AuthErrorCode.INVALID_ORIGIN */
  );
}
__name(_validateOrigin, "_validateOrigin");
function matchDomain(expected) {
  const currentUrl = _getCurrentUrl();
  const { protocol, hostname } = new URL(currentUrl);
  if (expected.startsWith("chrome-extension://")) {
    const ceUrl = new URL(expected);
    if (ceUrl.hostname === "" && hostname === "") {
      return (
        protocol === "chrome-extension:" &&
        expected.replace("chrome-extension://", "") ===
          currentUrl.replace("chrome-extension://", "")
      );
    }
    return protocol === "chrome-extension:" && ceUrl.hostname === hostname;
  }
  if (!HTTP_REGEX.test(protocol)) {
    return false;
  }
  if (IP_ADDRESS_REGEX.test(expected)) {
    return hostname === expected;
  }
  const escapedDomainPattern = expected.replace(/\./g, "\\.");
  const re = new RegExp(
    "^(.+\\." + escapedDomainPattern + "|" + escapedDomainPattern + ")$",
    "i",
  );
  return re.test(hostname);
}
__name(matchDomain, "matchDomain");
var NETWORK_TIMEOUT = new Delay(3e4, 6e4);
function resetUnloadedGapiModules() {
  const beacon = _window().___jsl;
  if (beacon?.H) {
    for (const hint of Object.keys(beacon.H)) {
      beacon.H[hint].r = beacon.H[hint].r || [];
      beacon.H[hint].L = beacon.H[hint].L || [];
      beacon.H[hint].r = [...beacon.H[hint].L];
      if (beacon.CP) {
        for (let i = 0; i < beacon.CP.length; i++) {
          beacon.CP[i] = null;
        }
      }
    }
  }
}
__name(resetUnloadedGapiModules, "resetUnloadedGapiModules");
function loadGapi(auth) {
  return new Promise((resolve, reject) => {
    function loadGapiIframe() {
      resetUnloadedGapiModules();
      gapi.load("gapi.iframes", {
        callback: /* @__PURE__ */ __name(() => {
          resolve(gapi.iframes.getContext());
        }, "callback"),
        ontimeout: /* @__PURE__ */ __name(() => {
          resetUnloadedGapiModules();
          reject(
            _createError(
              auth,
              "network-request-failed",
              /* AuthErrorCode.NETWORK_REQUEST_FAILED */
            ),
          );
        }, "ontimeout"),
        timeout: NETWORK_TIMEOUT.get(),
      });
    }
    __name(loadGapiIframe, "loadGapiIframe");
    if (_window().gapi?.iframes?.Iframe) {
      resolve(gapi.iframes.getContext());
    } else if (!!_window().gapi?.load) {
      loadGapiIframe();
    } else {
      const cbName = _generateCallbackName("iframefcb");
      _window()[cbName] = () => {
        if (!!gapi.load) {
          loadGapiIframe();
        } else {
          reject(
            _createError(
              auth,
              "network-request-failed",
              /* AuthErrorCode.NETWORK_REQUEST_FAILED */
            ),
          );
        }
      };
      return _loadJS(`${_gapiScriptUrl()}?onload=${cbName}`).catch((e) =>
        reject(e),
      );
    }
  }).catch((error) => {
    cachedGApiLoader = null;
    throw error;
  });
}
__name(loadGapi, "loadGapi");
var cachedGApiLoader = null;
function _loadGapi(auth) {
  cachedGApiLoader = cachedGApiLoader || loadGapi(auth);
  return cachedGApiLoader;
}
__name(_loadGapi, "_loadGapi");
var PING_TIMEOUT = new Delay(5e3, 15e3);
var IFRAME_PATH = "__/auth/iframe";
var EMULATED_IFRAME_PATH = "emulator/auth/iframe";
var IFRAME_ATTRIBUTES = {
  style: {
    position: "absolute",
    top: "-100px",
    width: "1px",
    height: "1px",
  },
  "aria-hidden": "true",
  tabindex: "-1",
};
var EID_FROM_APIHOST = /* @__PURE__ */ new Map([
  ["identitytoolkit.googleapis.com", "p"],
  // production
  ["staging-identitytoolkit.sandbox.googleapis.com", "s"],
  // staging
  ["test-identitytoolkit.sandbox.googleapis.com", "t"],
  // test
]);
function getIframeUrl(auth) {
  const config = auth.config;
  _assert(
    config.authDomain,
    auth,
    "auth-domain-config-required",
    /* AuthErrorCode.MISSING_AUTH_DOMAIN */
  );
  const url = config.emulator
    ? _emulatorUrl(config, EMULATED_IFRAME_PATH)
    : `https://${auth.config.authDomain}/${IFRAME_PATH}`;
  const params = {
    apiKey: config.apiKey,
    appName: auth.name,
    v: SDK_VERSION,
  };
  const eid = EID_FROM_APIHOST.get(auth.config.apiHost);
  if (eid) {
    params.eid = eid;
  }
  const frameworks = auth._getFrameworks();
  if (frameworks.length) {
    params.fw = frameworks.join(",");
  }
  return `${url}?${querystring(params).slice(1)}`;
}
__name(getIframeUrl, "getIframeUrl");
async function _openIframe(auth) {
  const context = await _loadGapi(auth);
  const gapi2 = _window().gapi;
  _assert(
    gapi2,
    auth,
    "internal-error",
    /* AuthErrorCode.INTERNAL_ERROR */
  );
  return context.open(
    {
      where: document.body,
      url: getIframeUrl(auth),
      messageHandlersFilter: gapi2.iframes.CROSS_ORIGIN_IFRAMES_FILTER,
      attributes: IFRAME_ATTRIBUTES,
      dontclear: true,
    },
    (iframe) =>
      new Promise(async (resolve, reject) => {
        await iframe.restyle({
          // Prevent iframe from closing on mouse out.
          setHideOnLeave: false,
        });
        const networkError = _createError(
          auth,
          "network-request-failed",
          /* AuthErrorCode.NETWORK_REQUEST_FAILED */
        );
        const networkErrorTimer = _window().setTimeout(() => {
          reject(networkError);
        }, PING_TIMEOUT.get());
        function clearTimerAndResolve() {
          _window().clearTimeout(networkErrorTimer);
          resolve(iframe);
        }
        __name(clearTimerAndResolve, "clearTimerAndResolve");
        iframe.ping(clearTimerAndResolve).then(clearTimerAndResolve, () => {
          reject(networkError);
        });
      }),
  );
}
__name(_openIframe, "_openIframe");
var BASE_POPUP_OPTIONS = {
  location: "yes",
  resizable: "yes",
  statusbar: "yes",
  toolbar: "no",
};
var DEFAULT_WIDTH = 500;
var DEFAULT_HEIGHT = 600;
var TARGET_BLANK = "_blank";
var FIREFOX_EMPTY_URL = "http://localhost";
var AuthPopup = class {
  static {
    __name(this, "AuthPopup");
  }
  constructor(window2) {
    this.window = window2;
    this.associatedEvent = null;
  }
  close() {
    if (this.window) {
      try {
        this.window.close();
      } catch (e) {}
    }
  }
};
function _open(
  auth,
  url,
  name4,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
) {
  const top = Math.max((window.screen.availHeight - height) / 2, 0).toString();
  const left = Math.max((window.screen.availWidth - width) / 2, 0).toString();
  let target = "";
  const options = {
    ...BASE_POPUP_OPTIONS,
    width: width.toString(),
    height: height.toString(),
    top,
    left,
  };
  const ua = getUA().toLowerCase();
  if (name4) {
    target = _isChromeIOS(ua) ? TARGET_BLANK : name4;
  }
  if (_isFirefox(ua)) {
    url = url || FIREFOX_EMPTY_URL;
    options.scrollbars = "yes";
  }
  const optionsString = Object.entries(options).reduce(
    (accum, [key, value]) => `${accum}${key}=${value},`,
    "",
  );
  if (_isIOSStandalone(ua) && target !== "_self") {
    openAsNewWindowIOS(url || "", target);
    return new AuthPopup(null);
  }
  const newWin = window.open(url || "", target, optionsString);
  _assert(
    newWin,
    auth,
    "popup-blocked",
    /* AuthErrorCode.POPUP_BLOCKED */
  );
  try {
    newWin.focus();
  } catch (e) {}
  return new AuthPopup(newWin);
}
__name(_open, "_open");
function openAsNewWindowIOS(url, target) {
  const el = document.createElement("a");
  el.href = url;
  el.target = target;
  const click = document.createEvent("MouseEvent");
  click.initMouseEvent(
    "click",
    true,
    true,
    window,
    1,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    1,
    null,
  );
  el.dispatchEvent(click);
}
__name(openAsNewWindowIOS, "openAsNewWindowIOS");
var WIDGET_PATH = "__/auth/handler";
var EMULATOR_WIDGET_PATH = "emulator/auth/handler";
var FIREBASE_APP_CHECK_FRAGMENT_ID = encodeURIComponent("fac");
async function _getRedirectUrl(
  auth,
  provider,
  authType,
  redirectUrl,
  eventId,
  additionalParams,
) {
  _assert(
    auth.config.authDomain,
    auth,
    "auth-domain-config-required",
    /* AuthErrorCode.MISSING_AUTH_DOMAIN */
  );
  _assert(
    auth.config.apiKey,
    auth,
    "invalid-api-key",
    /* AuthErrorCode.INVALID_API_KEY */
  );
  const params = {
    apiKey: auth.config.apiKey,
    appName: auth.name,
    authType,
    redirectUrl,
    v: SDK_VERSION,
    eventId,
  };
  if (provider instanceof FederatedAuthProvider) {
    provider.setDefaultLanguage(auth.languageCode);
    params.providerId = provider.providerId || "";
    if (!isEmpty(provider.getCustomParameters())) {
      params.customParameters = JSON.stringify(provider.getCustomParameters());
    }
    for (const [key, value] of Object.entries(additionalParams || {})) {
      params[key] = value;
    }
  }
  if (provider instanceof BaseOAuthProvider) {
    const scopes = provider.getScopes().filter((scope) => scope !== "");
    if (scopes.length > 0) {
      params.scopes = scopes.join(",");
    }
  }
  if (auth.tenantId) {
    params.tid = auth.tenantId;
  }
  const paramsDict = params;
  for (const key of Object.keys(paramsDict)) {
    if (paramsDict[key] === void 0) {
      delete paramsDict[key];
    }
  }
  const appCheckToken = await auth._getAppCheckToken();
  const appCheckTokenFragment = appCheckToken
    ? `#${FIREBASE_APP_CHECK_FRAGMENT_ID}=${encodeURIComponent(appCheckToken)}`
    : "";
  return `${getHandlerBase(auth)}?${querystring(paramsDict).slice(1)}${appCheckTokenFragment}`;
}
__name(_getRedirectUrl, "_getRedirectUrl");
function getHandlerBase({ config }) {
  if (!config.emulator) {
    return `https://${config.authDomain}/${WIDGET_PATH}`;
  }
  return _emulatorUrl(config, EMULATOR_WIDGET_PATH);
}
__name(getHandlerBase, "getHandlerBase");
var WEB_STORAGE_SUPPORT_KEY = "webStorageSupport";
var BrowserPopupRedirectResolver = class {
  static {
    __name(this, "BrowserPopupRedirectResolver");
  }
  constructor() {
    this.eventManagers = {};
    this.iframes = {};
    this.originValidationPromises = {};
    this._redirectPersistence = browserSessionPersistence;
    this._completeRedirectFn = _getRedirectResult;
    this._overrideRedirectResult = _overrideRedirectResult;
  }
  // Wrapping in async even though we don't await anywhere in order
  // to make sure errors are raised as promise rejections
  async _openPopup(auth, provider, authType, eventId) {
    debugAssert(
      this.eventManagers[auth._key()]?.manager,
      "_initialize() not called before _openPopup()",
    );
    const url = await _getRedirectUrl(
      auth,
      provider,
      authType,
      _getCurrentUrl(),
      eventId,
    );
    return _open(auth, url, _generateEventId());
  }
  async _openRedirect(auth, provider, authType, eventId) {
    await this._originValidation(auth);
    const url = await _getRedirectUrl(
      auth,
      provider,
      authType,
      _getCurrentUrl(),
      eventId,
    );
    _setWindowLocation(url);
    return new Promise(() => {});
  }
  _initialize(auth) {
    const key = auth._key();
    if (this.eventManagers[key]) {
      const { manager, promise: promise2 } = this.eventManagers[key];
      if (manager) {
        return Promise.resolve(manager);
      } else {
        debugAssert(promise2, "If manager is not set, promise should be");
        return promise2;
      }
    }
    const promise = this.initAndGetManager(auth);
    this.eventManagers[key] = { promise };
    promise.catch(() => {
      delete this.eventManagers[key];
    });
    return promise;
  }
  async initAndGetManager(auth) {
    const iframe = await _openIframe(auth);
    const manager = new AuthEventManager(auth);
    iframe.register(
      "authEvent",
      (iframeEvent) => {
        _assert(
          iframeEvent?.authEvent,
          auth,
          "invalid-auth-event",
          /* AuthErrorCode.INVALID_AUTH_EVENT */
        );
        const handled = manager.onEvent(iframeEvent.authEvent);
        return {
          status: handled ? "ACK" : "ERROR",
          /* GapiOutcome.ERROR */
        };
      },
      gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER,
    );
    this.eventManagers[auth._key()] = { manager };
    this.iframes[auth._key()] = iframe;
    return manager;
  }
  _isIframeWebStorageSupported(auth, cb) {
    const iframe = this.iframes[auth._key()];
    iframe.send(
      WEB_STORAGE_SUPPORT_KEY,
      { type: WEB_STORAGE_SUPPORT_KEY },
      (result) => {
        const isSupported = result?.[0]?.[WEB_STORAGE_SUPPORT_KEY];
        if (isSupported !== void 0) {
          cb(!!isSupported);
        }
        _fail(
          auth,
          "internal-error",
          /* AuthErrorCode.INTERNAL_ERROR */
        );
      },
      gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER,
    );
  }
  _originValidation(auth) {
    const key = auth._key();
    if (!this.originValidationPromises[key]) {
      this.originValidationPromises[key] = _validateOrigin(auth);
    }
    return this.originValidationPromises[key];
  }
  get _shouldInitProactively() {
    return _isMobileBrowser() || _isSafari() || _isIOS();
  }
};
var browserPopupRedirectResolver = BrowserPopupRedirectResolver;
var MultiFactorAssertionImpl = class {
  static {
    __name(this, "MultiFactorAssertionImpl");
  }
  constructor(factorId) {
    this.factorId = factorId;
  }
  _process(auth, session, displayName) {
    switch (session.type) {
      case "enroll":
        return this._finalizeEnroll(auth, session.credential, displayName);
      case "signin":
        return this._finalizeSignIn(auth, session.credential);
      default:
        return debugFail("unexpected MultiFactorSessionType");
    }
  }
};
var PhoneMultiFactorAssertionImpl = class _PhoneMultiFactorAssertionImpl extends MultiFactorAssertionImpl {
  static {
    __name(this, "PhoneMultiFactorAssertionImpl");
  }
  constructor(credential) {
    super(
      "phone",
      /* FactorId.PHONE */
    );
    this.credential = credential;
  }
  /** @internal */
  static _fromCredential(credential) {
    return new _PhoneMultiFactorAssertionImpl(credential);
  }
  /** @internal */
  _finalizeEnroll(auth, idToken, displayName) {
    return finalizeEnrollPhoneMfa(auth, {
      idToken,
      displayName,
      phoneVerificationInfo: this.credential._makeVerificationRequest(),
    });
  }
  /** @internal */
  _finalizeSignIn(auth, mfaPendingCredential) {
    return finalizeSignInPhoneMfa(auth, {
      mfaPendingCredential,
      phoneVerificationInfo: this.credential._makeVerificationRequest(),
    });
  }
};
var PhoneMultiFactorGenerator = class {
  static {
    __name(this, "PhoneMultiFactorGenerator");
  }
  constructor() {}
  /**
   * Provides a {@link PhoneMultiFactorAssertion} to confirm ownership of the phone second factor.
   *
   * @remarks
   * This method does not work in a Node.js environment.
   *
   * @param phoneAuthCredential - A credential provided by {@link PhoneAuthProvider.credential}.
   * @returns A {@link PhoneMultiFactorAssertion} which can be used with
   * {@link MultiFactorResolver.resolveSignIn}
   */
  static assertion(credential) {
    return PhoneMultiFactorAssertionImpl._fromCredential(credential);
  }
};
PhoneMultiFactorGenerator.FACTOR_ID = "phone";
var TotpMultiFactorGenerator = class {
  static {
    __name(this, "TotpMultiFactorGenerator");
  }
  /**
   * Provides a {@link TotpMultiFactorAssertion} to confirm ownership of
   * the TOTP (time-based one-time password) second factor.
   * This assertion is used to complete enrollment in TOTP second factor.
   *
   * @param secret A {@link TotpSecret} containing the shared secret key and other TOTP parameters.
   * @param oneTimePassword One-time password from TOTP App.
   * @returns A {@link TotpMultiFactorAssertion} which can be used with
   * {@link MultiFactorUser.enroll}.
   */
  static assertionForEnrollment(secret, oneTimePassword) {
    return TotpMultiFactorAssertionImpl._fromSecret(secret, oneTimePassword);
  }
  /**
   * Provides a {@link TotpMultiFactorAssertion} to confirm ownership of the TOTP second factor.
   * This assertion is used to complete signIn with TOTP as the second factor.
   *
   * @param enrollmentId identifies the enrolled TOTP second factor.
   * @param oneTimePassword One-time password from TOTP App.
   * @returns A {@link TotpMultiFactorAssertion} which can be used with
   * {@link MultiFactorResolver.resolveSignIn}.
   */
  static assertionForSignIn(enrollmentId, oneTimePassword) {
    return TotpMultiFactorAssertionImpl._fromEnrollmentId(
      enrollmentId,
      oneTimePassword,
    );
  }
  /**
   * Returns a promise to {@link TotpSecret} which contains the TOTP shared secret key and other parameters.
   * Creates a TOTP secret as part of enrolling a TOTP second factor.
   * Used for generating a QR code URL or inputting into a TOTP app.
   * This method uses the auth instance corresponding to the user in the multiFactorSession.
   *
   * @param session The {@link MultiFactorSession} that the user is part of.
   * @returns A promise to {@link TotpSecret}.
   */
  static async generateSecret(session) {
    const mfaSession = session;
    _assert(
      typeof mfaSession.user?.auth !== "undefined",
      "internal-error",
      /* AuthErrorCode.INTERNAL_ERROR */
    );
    const response = await startEnrollTotpMfa(mfaSession.user.auth, {
      idToken: mfaSession.credential,
      totpEnrollmentInfo: {},
    });
    return TotpSecret._fromStartTotpMfaEnrollmentResponse(
      response,
      mfaSession.user.auth,
    );
  }
};
TotpMultiFactorGenerator.FACTOR_ID = "totp";
var TotpMultiFactorAssertionImpl = class _TotpMultiFactorAssertionImpl extends MultiFactorAssertionImpl {
  static {
    __name(this, "TotpMultiFactorAssertionImpl");
  }
  constructor(otp, enrollmentId, secret) {
    super(
      "totp",
      /* FactorId.TOTP */
    );
    this.otp = otp;
    this.enrollmentId = enrollmentId;
    this.secret = secret;
  }
  /** @internal */
  static _fromSecret(secret, otp) {
    return new _TotpMultiFactorAssertionImpl(otp, void 0, secret);
  }
  /** @internal */
  static _fromEnrollmentId(enrollmentId, otp) {
    return new _TotpMultiFactorAssertionImpl(otp, enrollmentId);
  }
  /** @internal */
  async _finalizeEnroll(auth, idToken, displayName) {
    _assert(
      typeof this.secret !== "undefined",
      auth,
      "argument-error",
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    return finalizeEnrollTotpMfa(auth, {
      idToken,
      displayName,
      totpVerificationInfo: this.secret._makeTotpVerificationInfo(this.otp),
    });
  }
  /** @internal */
  async _finalizeSignIn(auth, mfaPendingCredential) {
    _assert(
      this.enrollmentId !== void 0 && this.otp !== void 0,
      auth,
      "argument-error",
      /* AuthErrorCode.ARGUMENT_ERROR */
    );
    const totpVerificationInfo = { verificationCode: this.otp };
    return finalizeSignInTotpMfa(auth, {
      mfaPendingCredential,
      mfaEnrollmentId: this.enrollmentId,
      totpVerificationInfo,
    });
  }
};
var TotpSecret = class _TotpSecret {
  static {
    __name(this, "TotpSecret");
  }
  // The public members are declared outside the constructor so the docs can be generated.
  constructor(
    secretKey,
    hashingAlgorithm,
    codeLength,
    codeIntervalSeconds,
    enrollmentCompletionDeadline,
    sessionInfo,
    auth,
  ) {
    this.sessionInfo = sessionInfo;
    this.auth = auth;
    this.secretKey = secretKey;
    this.hashingAlgorithm = hashingAlgorithm;
    this.codeLength = codeLength;
    this.codeIntervalSeconds = codeIntervalSeconds;
    this.enrollmentCompletionDeadline = enrollmentCompletionDeadline;
  }
  /** @internal */
  static _fromStartTotpMfaEnrollmentResponse(response, auth) {
    return new _TotpSecret(
      response.totpSessionInfo.sharedSecretKey,
      response.totpSessionInfo.hashingAlgorithm,
      response.totpSessionInfo.verificationCodeLength,
      response.totpSessionInfo.periodSec,
      new Date(response.totpSessionInfo.finalizeEnrollmentTime).toUTCString(),
      response.totpSessionInfo.sessionInfo,
      auth,
    );
  }
  /** @internal */
  _makeTotpVerificationInfo(otp) {
    return { sessionInfo: this.sessionInfo, verificationCode: otp };
  }
  /**
   * Returns a QR code URL as described in
   * https://github.com/google/google-authenticator/wiki/Key-Uri-Format
   * This can be displayed to the user as a QR code to be scanned into a TOTP app like Google Authenticator.
   * If the optional parameters are unspecified, an accountName of <userEmail> and issuer of <firebaseAppName> are used.
   *
   * @param accountName the name of the account/app along with a user identifier.
   * @param issuer issuer of the TOTP (likely the app name).
   * @returns A QR code URL string.
   */
  generateQrCodeUrl(accountName, issuer) {
    let useDefaults = false;
    if (_isEmptyString(accountName) || _isEmptyString(issuer)) {
      useDefaults = true;
    }
    if (useDefaults) {
      if (_isEmptyString(accountName)) {
        accountName = this.auth.currentUser?.email || "unknownuser";
      }
      if (_isEmptyString(issuer)) {
        issuer = this.auth.name;
      }
    }
    return `otpauth://totp/${issuer}:${accountName}?secret=${this.secretKey}&issuer=${issuer}&algorithm=${this.hashingAlgorithm}&digits=${this.codeLength}`;
  }
};
function _isEmptyString(input) {
  return typeof input === "undefined" || input?.length === 0;
}
__name(_isEmptyString, "_isEmptyString");
var name3 = "@firebase/auth";
var version3 = "1.13.3";
var AuthInterop = class {
  static {
    __name(this, "AuthInterop");
  }
  constructor(auth) {
    this.auth = auth;
    this.internalListeners = /* @__PURE__ */ new Map();
  }
  getUid() {
    this.assertAuthConfigured();
    return this.auth.currentUser?.uid || null;
  }
  async getToken(forceRefresh) {
    this.assertAuthConfigured();
    await this.auth._initializationPromise;
    if (!this.auth.currentUser) {
      return null;
    }
    const accessToken = await this.auth.currentUser.getIdToken(forceRefresh);
    return { accessToken };
  }
  addAuthTokenListener(listener) {
    this.assertAuthConfigured();
    if (this.internalListeners.has(listener)) {
      return;
    }
    const unsubscribe = this.auth.onIdTokenChanged((user) => {
      listener(user?.stsTokenManager.accessToken || null);
    });
    this.internalListeners.set(listener, unsubscribe);
    this.updateProactiveRefresh();
  }
  removeAuthTokenListener(listener) {
    this.assertAuthConfigured();
    const unsubscribe = this.internalListeners.get(listener);
    if (!unsubscribe) {
      return;
    }
    this.internalListeners.delete(listener);
    unsubscribe();
    this.updateProactiveRefresh();
  }
  assertAuthConfigured() {
    _assert(
      this.auth._initializationPromise,
      "dependent-sdk-initialized-before-auth",
      /* AuthErrorCode.DEPENDENT_SDK_INIT_BEFORE_AUTH */
    );
  }
  updateProactiveRefresh() {
    if (this.internalListeners.size > 0) {
      this.auth._startProactiveRefresh();
    } else {
      this.auth._stopProactiveRefresh();
    }
  }
};
function getVersionForPlatform(clientPlatform) {
  switch (clientPlatform) {
    case "Node":
      return "node";
    case "ReactNative":
      return "rn";
    case "Worker":
      return "webworker";
    case "Cordova":
      return "cordova";
    case "WebExtension":
      return "web-extension";
    default:
      return void 0;
  }
}
__name(getVersionForPlatform, "getVersionForPlatform");
function registerAuth(clientPlatform) {
  _registerComponent(
    new Component(
      "auth",
      (container, { options: deps }) => {
        const app = container.getProvider("app").getImmediate();
        const heartbeatServiceProvider = container.getProvider("heartbeat");
        const appCheckServiceProvider =
          container.getProvider("app-check-internal");
        const { apiKey, authDomain } = app.options;
        _assert(apiKey && !apiKey.includes(":"), "invalid-api-key", {
          appName: app.name,
        });
        const config = {
          apiKey,
          authDomain,
          clientPlatform,
          apiHost: "identitytoolkit.googleapis.com",
          tokenApiHost: "securetoken.googleapis.com",
          apiScheme: "https",
          sdkClientVersion: _getClientVersion(clientPlatform),
        };
        const authInstance = new AuthImpl(
          app,
          heartbeatServiceProvider,
          appCheckServiceProvider,
          config,
        );
        _initializeAuthInstance(authInstance, deps);
        return authInstance;
      },
      "PUBLIC",
      /* ComponentType.PUBLIC */
    )
      .setInstantiationMode(
        "EXPLICIT",
        /* InstantiationMode.EXPLICIT */
      )
      .setInstanceCreatedCallback(
        (container, _instanceIdentifier, _instance) => {
          const authInternalProvider = container.getProvider(
            "auth-internal",
            /* _ComponentName.AUTH_INTERNAL */
          );
          authInternalProvider.initialize();
        },
      ),
  );
  _registerComponent(
    new Component(
      "auth-internal",
      (container) => {
        const auth = _castAuth(
          container
            .getProvider(
              "auth",
              /* _ComponentName.AUTH */
            )
            .getImmediate(),
        );
        return ((auth2) => new AuthInterop(auth2))(auth);
      },
      "PRIVATE",
      /* ComponentType.PRIVATE */
    ).setInstantiationMode(
      "EXPLICIT",
      /* InstantiationMode.EXPLICIT */
    ),
  );
  registerVersion(name3, version3, getVersionForPlatform(clientPlatform));
  registerVersion(name3, version3, "esm2020");
}
__name(registerAuth, "registerAuth");
var DEFAULT_ID_TOKEN_MAX_AGE = 5 * 60;
var authIdTokenMaxAge =
  getExperimentalSetting("authIdTokenMaxAge") || DEFAULT_ID_TOKEN_MAX_AGE;
var lastPostedIdToken = null;
var mintCookieFactory = /* @__PURE__ */ __name(
  (url) => async (user) => {
    const idTokenResult = user && (await user.getIdTokenResult());
    const idTokenAge =
      idTokenResult &&
      (/* @__PURE__ */ new Date().getTime() -
        Date.parse(idTokenResult.issuedAtTime)) /
        1e3;
    if (idTokenAge && idTokenAge > authIdTokenMaxAge) {
      return;
    }
    const idToken = idTokenResult?.token;
    if (lastPostedIdToken === idToken) {
      return;
    }
    lastPostedIdToken = idToken;
    await fetch(url, {
      method: idToken ? "POST" : "DELETE",
      headers: idToken
        ? {
            Authorization: `Bearer ${idToken}`,
          }
        : {},
    });
  },
  "mintCookieFactory",
);
function getAuth(app = getApp()) {
  const provider = _getProvider(app, "auth");
  if (provider.isInitialized()) {
    return provider.getImmediate();
  }
  const auth = initializeAuth(app, {
    popupRedirectResolver: browserPopupRedirectResolver,
    persistence: [
      indexedDBLocalPersistence,
      browserLocalPersistence,
      browserSessionPersistence,
    ],
  });
  const authTokenSyncPath = getExperimentalSetting("authTokenSyncURL");
  if (
    authTokenSyncPath &&
    typeof isSecureContext === "boolean" &&
    isSecureContext
  ) {
    const authTokenSyncUrl = new URL(authTokenSyncPath, location.origin);
    if (location.origin === authTokenSyncUrl.origin) {
      const mintCookie = mintCookieFactory(authTokenSyncUrl.toString());
      beforeAuthStateChanged(auth, mintCookie, () =>
        mintCookie(auth.currentUser),
      );
      onIdTokenChanged(auth, (user) => mintCookie(user));
    }
  }
  const authEmulatorHost = getDefaultEmulatorHost("auth");
  if (authEmulatorHost) {
    connectAuthEmulator(auth, `http://${authEmulatorHost}`);
  }
  return auth;
}
__name(getAuth, "getAuth");
function getScriptParentElement() {
  return document.getElementsByTagName("head")?.[0] ?? document;
}
__name(getScriptParentElement, "getScriptParentElement");
_setExternalJSProvider({
  loadJS(url) {
    return new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.setAttribute("src", url);
      el.onload = resolve;
      el.onerror = (e) => {
        const error = _createError(
          "internal-error",
          /* AuthErrorCode.INTERNAL_ERROR */
        );
        error.customData = e;
        reject(error);
      };
      el.type = "text/javascript";
      el.charset = "UTF-8";
      getScriptParentElement().appendChild(el);
    });
  },
  gapiScript: "https://apis.google.com/js/api.js",
  recaptchaV2Script: "https://www.google.com/recaptcha/api.js",
  recaptchaEnterpriseScript:
    "https://www.google.com/recaptcha/enterprise.js?render=",
});
registerAuth(
  "Browser",
  /* ClientPlatform.BROWSER */
);

// api/limpar.js
var ANCHOR_DATES = {
  D: "2026-01-26",
};
function isDiaDeTrabalho(team) {
  const anchorStr = ANCHOR_DATES[team];
  if (!anchorStr) return true;
  const now = /* @__PURE__ */ new Date();
  const formatter = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const localDateStr = formatter.format(now);
  const localMidnight = /* @__PURE__ */ new Date(`${localDateStr}T00:00:00Z`);
  const anchorMidnight = /* @__PURE__ */ new Date(`${anchorStr}T00:00:00Z`);
  const diffDays = Math.round(
    (localMidnight.getTime() - anchorMidnight.getTime()) / (24 * 60 * 60 * 1e3),
  );
  const cycleDay = ((diffDays % 4) + 4) % 4;
  return cycleDay === 0 || cycleDay === 1;
}
__name(isDiaDeTrabalho, "isDiaDeTrabalho");
async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const team = url.searchParams.get("team")?.toUpperCase() || "D";
  const token = url.searchParams.get("token");
  const force = url.searchParams.get("force") === "true";
  if (!env.CRON_SECRET_TOKEN || token !== env.CRON_SECRET_TOKEN) {
    return new Response(
      JSON.stringify({ error: "Acesso N\xE3o Autorizado. Token inv\xE1lido." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const worksToday = isDiaDeTrabalho(team);
  if (!worksToday && !force) {
    return new Response(
      JSON.stringify({
        status: "skipped",
        message: `Hoje \xE9 folga para a Turma ${team}.`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const firebaseConfig = {
    apiKey: env.VITE_apiKey_dss,
    authDomain: env.VITE_authDomain_dss,
    projectId: env.VITE_projectId_dss,
  };
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  try {
    await signInAnonymously(auth);
    console.log(
      `[limpar] Turma ${team} \u2014 autentica\xE7\xE3o OK, iniciando limpeza...`,
    );
    const docRef = doc(db, `turma ${team.toLowerCase()}`, "estado_painel");
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.log(
        `[limpar] Turma ${team} \u2014 documento n\xE3o encontrado no Firestore.`,
      );
      return new Response(
        JSON.stringify({
          status: "no_data",
          message: `Nenhum dado encontrado para a Turma ${team}. Nada para limpar.`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const state = docSnap.data();
    let newDepartmentsData = state.departmentsData;
    if (Array.isArray(newDepartmentsData)) {
      newDepartmentsData = newDepartmentsData.map((dept) => ({
        ...dept,
        data: (dept.data || []).map((emp) => ({
          ...emp,
          line: "",
          machine: "",
        })),
      }));
    }
    let newSpecialShiftData = state.specialShiftData;
    if (Array.isArray(newSpecialShiftData)) {
      newSpecialShiftData = newSpecialShiftData.map((emp) => ({
        ...emp,
        line: "",
        machine: "",
      }));
    }
    const updates = { updatedAt: /* @__PURE__ */ new Date().toISOString() };
    if (Array.isArray(newDepartmentsData))
      updates.departmentsData = newDepartmentsData;
    if (Array.isArray(newSpecialShiftData))
      updates.specialShiftData = newSpecialShiftData;
    await updateDoc(docRef, updates);
    console.log(
      `[limpar] Turma ${team} \u2014 limpeza conclu\xEDda com sucesso.`,
    );
    return new Response(
      JSON.stringify({
        status: "success",
        message: `Limpeza (Linha e Loco) da Turma ${team} conclu\xEDda.`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao limpar", details: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
__name(onRequest, "onRequest");

// ../.wrangler/tmp/pages-Bmd37g/functionsRoutes-0.08097330772641553.mjs
var routes = [
  {
    routePath: "/api/limpar",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest],
  },
];

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name4 = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          (code >= 48 && code <= 57) || // `A-Z`
          (code >= 65 && code <= 90) || // `a-z`
          (code >= 97 && code <= 122) || // `_`
          code === 95
        ) {
          name4 += str[j++];
          continue;
        }
        break;
      }
      if (!name4) throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name4 });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError(
              "Capturing groups are not allowed at ".concat(j),
            );
          }
        }
        pattern += str[j++];
      }
      if (count) throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern) throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes,
    prefixes = _a === void 0 ? "./" : _a,
    _b = options.delimiter,
    delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function (type) {
    if (i < tokens.length && tokens[i].type === type) return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function (type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0) return value2;
    var _a2 = tokens[i],
      nextType = _a2.type,
      index = _a2.index;
    throw new TypeError(
      "Unexpected "
        .concat(nextType, " at ")
        .concat(index, ", expected ")
        .concat(type),
    );
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function () {
    var result2 = "";
    var value2;
    while ((value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function (value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1) return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function (prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError(
        'Must have text between two parameters, missing text after "'.concat(
          prev.name,
          '"',
        ),
      );
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!"
      .concat(escapeString(prevText), ")[^")
      .concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name4 = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name4 || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name4 || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || "",
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || "",
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode,
    decode =
      _a === void 0
        ? function (x2) {
            return x2;
          }
        : _a;
  return function (pathname) {
    var m2 = re.exec(pathname);
    if (!m2) return false;
    var path = m2[0],
      index = m2.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function (i2) {
      if (m2[i2] === void 0) return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m2[i2]
          .split(key.prefix + key.suffix)
          .map(function (value) {
            return decode(value, key);
          });
      } else {
        params[key.name] = decode(m2[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m2.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys) return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: "",
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function (path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict,
    strict = _a === void 0 ? false : _a,
    _b = options.start,
    start = _b === void 0 ? true : _b,
    _c = options.end,
    end = _c === void 0 ? true : _c,
    _d = options.encode,
    encode =
      _d === void 0
        ? function (x2) {
            return x2;
          }
        : _d,
    _e = options.delimiter,
    delimiter = _e === void 0 ? "/#?" : _e,
    _f = options.endsWith,
    endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys) keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:"
              .concat(prefix, "((?:")
              .concat(token.pattern, ")(?:")
              .concat(suffix)
              .concat(prefix, "(?:")
              .concat(token.pattern, "))*)")
              .concat(suffix, ")")
              .concat(mod);
          } else {
            route += "(?:"
              .concat(prefix, "(")
              .concat(token.pattern, ")")
              .concat(suffix, ")")
              .concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError(
              'Can not repeat "'.concat(
                token.name,
                '" without a prefix and suffix',
              ),
            );
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:"
          .concat(prefix)
          .concat(suffix, ")")
          .concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict) route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited =
      typeof endToken === "string"
        ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1
        : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp) return regexpToRegexp(path, keys);
  if (Array.isArray(path)) return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-plugin.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request, relativePathname) {
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false,
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false,
    });
    const matchResult = routeMatcher(relativePathname);
    const mountMatchResult = mountMatcher(relativePathname);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path,
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true,
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false,
    });
    const matchResult = routeMatcher(relativePathname);
    const mountMatchResult = mountMatcher(relativePathname);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path,
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
function pages_template_plugin_default(pluginArgs) {
  const onRequest2 = /* @__PURE__ */ __name(async (workerContext) => {
    let { request } = workerContext;
    const { env, next } = workerContext;
    let { data } = workerContext;
    const url = new URL(request.url);
    const relativePathname =
      `/${url.pathname.replace(workerContext.functionPath, "") || ""}`.replace(
        /^\/\//,
        "/",
      );
    const handlerIterator = executeRequest(request, relativePathname);
    const pluginNext = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url2 = input;
        if (typeof input === "string") {
          url2 = new URL(input, request.url).toString();
        }
        request = new Request(url2, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: workerContext.functionPath + path,
          next: pluginNext,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          pluginArgs,
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException:
            workerContext.passThroughOnException.bind(workerContext),
        };
        const response = await handler(context);
        return cloneResponse(response);
      } else {
        return next(request);
      }
    }, "pluginNext");
    return pluginNext();
  }, "onRequest");
  return onRequest2;
}
__name(pages_template_plugin_default, "default");
var cloneResponse = /* @__PURE__ */ __name(
  (response) =>
    // https://fetch.spec.whatwg.org/#null-body-status
    new Response(
      [101, 204, 205, 304].includes(response.status) ? null : response.body,
      response,
    ),
  "cloneResponse",
);
export { pages_template_plugin_default as default };
/*! Bundled license information:

@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/util/dist/index.esm.js:
@firebase/logger/dist/esm/index.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/index.browser.esm.js:
@firebase/firestore/dist/lite/index.browser.esm.js:
@firebase/firestore/dist/lite/index.browser.esm.js:
@firebase/firestore/dist/lite/index.browser.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/index.browser.esm.js:
@firebase/firestore/dist/lite/index.browser.esm.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
@firebase/component/dist/esm/index.esm.js:
@firebase/app/dist/esm/index.esm.js:
@firebase/app/dist/esm/index.esm.js:
@firebase/firestore/dist/lite/index.browser.esm.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
firebase/app/dist/esm/index.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/index.browser.esm.js:
@firebase/firestore/dist/lite/index.browser.esm.js:
@firebase/firestore/dist/lite/index.browser.esm.js:
@firebase/firestore/dist/lite/index.browser.esm.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/util/dist/index.esm.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/app/dist/esm/index.esm.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/webchannel-wrapper/dist/bloom-blob/esm/bloom_blob_es2018.js:
  (** @license
  Copyright The Closure Library Authors.
  SPDX-License-Identifier: Apache-2.0
  *)
  (** @license
  
   Copyright The Closure Library Authors.
   SPDX-License-Identifier: Apache-2.0
  *)

@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/lite/common-90c44673.esm.js:
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
@firebase/firestore/dist/lite/common-90c44673.esm.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/lite/common-90c44673.esm.js:
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/lite/common-90c44673.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/lite/common-90c44673.esm.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2018 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/lite/common-90c44673.esm.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
  * @license
  * Copyright 2017 Google LLC
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *   http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  *)

@firebase/firestore/dist/lite/index.browser.esm.js:
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/firestore/dist/lite/index.browser.esm.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm/index-d90d2ee5.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm/index-d90d2ee5.js:
@firebase/auth/dist/esm/index-d90d2ee5.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm/index-d90d2ee5.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2022 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2023 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm/index-d90d2ee5.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm/index-d90d2ee5.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2025 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm/index-d90d2ee5.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm/index-d90d2ee5.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2019 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)

@firebase/auth/dist/esm/index-d90d2ee5.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2020 Google LLC.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
  (**
   * @license
   * Copyright 2021 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/
