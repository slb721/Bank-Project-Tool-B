/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./lib/supabaseClient.js":
/*!*******************************!*\
  !*** ./lib/supabaseClient.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   supabase: () => (/* binding */ supabase)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @supabase/supabase-js */ \"@supabase/supabase-js\");\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__);\n\nconst supabaseUrl = \"https://sqncqkxejmncuueegiau.supabase.co\";\nconst supabaseAnonKey = \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbmNxa3hlam1uY3V1ZWVnaWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMzE1MzMsImV4cCI6MjA2NDgwNzUzM30.r9rfACe7N4dGTMv4rNVwxKxiUUt7sOaH4to6nhC65r0\";\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__.createClient)(supabaseUrl, supabaseAnonKey);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9saWIvc3VwYWJhc2VDbGllbnQuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQXFEO0FBRXJELE1BQU1DLGNBQWM7QUFDcEIsTUFBTUMsa0JBQWtCO0FBR2pCLE1BQU1DLFdBQVdILG1FQUFZQSxDQUFDQyxhQUFhQyxpQkFBaUIiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9iYW5rLXByb2plY3Rpb24tdG9vbC8uL2xpYi9zdXBhYmFzZUNsaWVudC5qcz81ZjBkIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyc7XG5cbmNvbnN0IHN1cGFiYXNlVXJsID0gJ2h0dHBzOi8vc3FuY3FreGVqbW5jdXVlZWdpYXUuc3VwYWJhc2UuY28nO1xuY29uc3Qgc3VwYWJhc2VBbm9uS2V5ID0gXCJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcGMzTWlPaUp6ZFhCaFltRnpaU0lzSW5KbFppSTZJbk54Ym1OeGEzaGxhbTF1WTNWMVpXVm5hV0YxSWl3aWNtOXNaU0k2SW1GdWIyNGlMQ0pwWVhRaU9qRTNORGt5TXpFMU16TXNJbVY0Y0NJNk1qQTJORGd3TnpVek0zMC5yOXJmQUNlN040ZEdUTXY0ck5Wd3hLeGlVVXQ3c09hSDR0bzZuaEM2NXIwXCI7XG5cblxuZXhwb3J0IGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlQ2xpZW50KHN1cGFiYXNlVXJsLCBzdXBhYmFzZUFub25LZXkpO1xuIl0sIm5hbWVzIjpbImNyZWF0ZUNsaWVudCIsInN1cGFiYXNlVXJsIiwic3VwYWJhc2VBbm9uS2V5Iiwic3VwYWJhc2UiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./lib/supabaseClient.js\n");

/***/ }),

/***/ "./pages/_app.js":
/*!***********************!*\
  !*** ./pages/_app.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ MyApp)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/router */ \"./node_modules/next/router.js\");\n/* harmony import */ var next_router__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_router__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _lib_supabaseClient__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../lib/supabaseClient */ \"./lib/supabaseClient.js\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_4__);\n// pages/_app.js\n\n\n\n\n\nfunction MyApp({ Component, pageProps }) {\n    const [session, setSession] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);\n    const router = (0,next_router__WEBPACK_IMPORTED_MODULE_2__.useRouter)();\n    // Listen for login state changes\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        _lib_supabaseClient__WEBPACK_IMPORTED_MODULE_3__.supabase.auth.getSession().then(({ data })=>setSession(data.session));\n        const { data: sub } = _lib_supabaseClient__WEBPACK_IMPORTED_MODULE_3__.supabase.auth.onAuthStateChange((_, s)=>{\n            setSession(s);\n            if (!s) router.push(\"/login\");\n        });\n        return ()=>sub.subscription.unsubscribe();\n    }, []);\n    // Protect all routes except /login\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        if (session === null && router.pathname !== \"/login\") {\n            router.push(\"/login\");\n        }\n    }, [\n        session,\n        router\n    ]);\n    // While we’re figuring out auth, don’t flash content\n    if (session === null) {\n        if (router.pathname === \"/login\") return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n            ...pageProps\n        }, void 0, false, {\n            fileName: \"/home/slb721/Bank-Project-Tool-B/pages/_app.js\",\n            lineNumber: 30,\n            columnNumber: 46\n        }, this);\n        return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            style: {\n                textAlign: \"center\",\n                marginTop: \"20%\"\n            },\n            children: \"Loading…\"\n        }, void 0, false, {\n            fileName: \"/home/slb721/Bank-Project-Tool-B/pages/_app.js\",\n            lineNumber: 31,\n            columnNumber: 12\n        }, this);\n    }\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n        ...pageProps,\n        session: session,\n        ...pageProps\n    }, void 0, false, {\n        fileName: \"/home/slb721/Bank-Project-Tool-B/pages/_app.js\",\n        lineNumber: 34,\n        columnNumber: 10\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFBQSxnQkFBZ0I7O0FBQzRCO0FBQ0o7QUFDUztBQUNsQjtBQUVoQixTQUFTSSxNQUFNLEVBQUVDLFNBQVMsRUFBRUMsU0FBUyxFQUFFO0lBQ3BELE1BQU0sQ0FBQ0MsU0FBU0MsV0FBVyxHQUFHUiwrQ0FBUUEsQ0FBQztJQUN2QyxNQUFNUyxTQUFTUCxzREFBU0E7SUFFeEIsaUNBQWlDO0lBQ2pDRCxnREFBU0EsQ0FBQztRQUNSRSx5REFBUUEsQ0FBQ08sSUFBSSxDQUFDQyxVQUFVLEdBQUdDLElBQUksQ0FBQyxDQUFDLEVBQUVDLElBQUksRUFBRSxHQUFLTCxXQUFXSyxLQUFLTixPQUFPO1FBQ3JFLE1BQU0sRUFBRU0sTUFBTUMsR0FBRyxFQUFFLEdBQUdYLHlEQUFRQSxDQUFDTyxJQUFJLENBQUNLLGlCQUFpQixDQUFDLENBQUNDLEdBQUdDO1lBQ3hEVCxXQUFXUztZQUNYLElBQUksQ0FBQ0EsR0FBR1IsT0FBT1MsSUFBSSxDQUFDO1FBQ3RCO1FBQ0EsT0FBTyxJQUFNSixJQUFJSyxZQUFZLENBQUNDLFdBQVc7SUFDM0MsR0FBRyxFQUFFO0lBRUwsbUNBQW1DO0lBQ25DbkIsZ0RBQVNBLENBQUM7UUFDUixJQUFJTSxZQUFZLFFBQVFFLE9BQU9ZLFFBQVEsS0FBSyxVQUFVO1lBQ3BEWixPQUFPUyxJQUFJLENBQUM7UUFDZDtJQUNGLEdBQUc7UUFBQ1g7UUFBU0U7S0FBTztJQUVwQixxREFBcUQ7SUFDckQsSUFBSUYsWUFBWSxNQUFNO1FBQ3BCLElBQUlFLE9BQU9ZLFFBQVEsS0FBSyxVQUFVLHFCQUFPLDhEQUFDaEI7WUFBVyxHQUFHQyxTQUFTOzs7Ozs7UUFDakUscUJBQU8sOERBQUNnQjtZQUFJQyxPQUFPO2dCQUFDQyxXQUFVO2dCQUFTQyxXQUFVO1lBQUs7c0JBQUc7Ozs7OztJQUMzRDtJQUVBLHFCQUFPLDhEQUFDcEI7UUFBVyxHQUFHQyxTQUFTO1FBQUVDLFNBQVNBO1FBQVUsR0FBR0QsU0FBUzs7Ozs7O0FBQ2xFIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYmFuay1wcm9qZWN0aW9uLXRvb2wvLi9wYWdlcy9fYXBwLmpzP2UwYWQiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gcGFnZXMvX2FwcC5qc1xuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVJvdXRlciB9IGZyb20gJ25leHQvcm91dGVyJztcbmltcG9ydCB7IHN1cGFiYXNlIH0gZnJvbSAnLi4vbGliL3N1cGFiYXNlQ2xpZW50JztcbmltcG9ydCAnLi4vc3R5bGVzL2dsb2JhbHMuY3NzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gTXlBcHAoeyBDb21wb25lbnQsIHBhZ2VQcm9wcyB9KSB7XG4gIGNvbnN0IFtzZXNzaW9uLCBzZXRTZXNzaW9uXSA9IHVzZVN0YXRlKG51bGwpO1xuICBjb25zdCByb3V0ZXIgPSB1c2VSb3V0ZXIoKTtcblxuICAvLyBMaXN0ZW4gZm9yIGxvZ2luIHN0YXRlIGNoYW5nZXNcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBzdXBhYmFzZS5hdXRoLmdldFNlc3Npb24oKS50aGVuKCh7IGRhdGEgfSkgPT4gc2V0U2Vzc2lvbihkYXRhLnNlc3Npb24pKTtcbiAgICBjb25zdCB7IGRhdGE6IHN1YiB9ID0gc3VwYWJhc2UuYXV0aC5vbkF1dGhTdGF0ZUNoYW5nZSgoXywgcykgPT4ge1xuICAgICAgc2V0U2Vzc2lvbihzKTtcbiAgICAgIGlmICghcykgcm91dGVyLnB1c2goJy9sb2dpbicpO1xuICAgIH0pO1xuICAgIHJldHVybiAoKSA9PiBzdWIuc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gIH0sIFtdKTtcblxuICAvLyBQcm90ZWN0IGFsbCByb3V0ZXMgZXhjZXB0IC9sb2dpblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmIChzZXNzaW9uID09PSBudWxsICYmIHJvdXRlci5wYXRobmFtZSAhPT0gJy9sb2dpbicpIHtcbiAgICAgIHJvdXRlci5wdXNoKCcvbG9naW4nKTtcbiAgICB9XG4gIH0sIFtzZXNzaW9uLCByb3V0ZXJdKTtcblxuICAvLyBXaGlsZSB3ZeKAmXJlIGZpZ3VyaW5nIG91dCBhdXRoLCBkb27igJl0IGZsYXNoIGNvbnRlbnRcbiAgaWYgKHNlc3Npb24gPT09IG51bGwpIHtcbiAgICBpZiAocm91dGVyLnBhdGhuYW1lID09PSAnL2xvZ2luJykgcmV0dXJuIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz47XG4gICAgcmV0dXJuIDxkaXYgc3R5bGU9e3t0ZXh0QWxpZ246J2NlbnRlcicsbWFyZ2luVG9wOicyMCUnfX0+TG9hZGluZ+KApjwvZGl2PjtcbiAgfVxuXG4gIHJldHVybiA8Q29tcG9uZW50IHsuLi5wYWdlUHJvcHN9IHNlc3Npb249e3Nlc3Npb259IHsuLi5wYWdlUHJvcHN9IC8+O1xufVxuIl0sIm5hbWVzIjpbInVzZVN0YXRlIiwidXNlRWZmZWN0IiwidXNlUm91dGVyIiwic3VwYWJhc2UiLCJNeUFwcCIsIkNvbXBvbmVudCIsInBhZ2VQcm9wcyIsInNlc3Npb24iLCJzZXRTZXNzaW9uIiwicm91dGVyIiwiYXV0aCIsImdldFNlc3Npb24iLCJ0aGVuIiwiZGF0YSIsInN1YiIsIm9uQXV0aFN0YXRlQ2hhbmdlIiwiXyIsInMiLCJwdXNoIiwic3Vic2NyaXB0aW9uIiwidW5zdWJzY3JpYmUiLCJwYXRobmFtZSIsImRpdiIsInN0eWxlIiwidGV4dEFsaWduIiwibWFyZ2luVG9wIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./pages/_app.js\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "@supabase/supabase-js":
/*!****************************************!*\
  !*** external "@supabase/supabase-js" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@supabase/supabase-js");

/***/ }),

/***/ "next/dist/compiled/next-server/pages.runtime.dev.js":
/*!**********************************************************************!*\
  !*** external "next/dist/compiled/next-server/pages.runtime.dev.js" ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/pages.runtime.dev.js");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react-dom":
/*!****************************!*\
  !*** external "react-dom" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("react-dom");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@swc"], () => (__webpack_exec__("./pages/_app.js")));
module.exports = __webpack_exports__;

})();