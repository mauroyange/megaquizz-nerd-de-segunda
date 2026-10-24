// Usado só na build do Artifact: o React vem do CDN (UMD) e fica em window.React.
const R = window.React;
export default R;
export const { useState, useEffect, useRef, useCallback, useContext, useMemo, createContext, forwardRef, StrictMode, Fragment } = R;
