const R = window.React;
const jsx = (type, props, key) => R.createElement(type, key === undefined ? props : { ...props, key });
export { jsx, jsx as jsxs };
export const Fragment = R.Fragment;
