
// This file is used to declare global types for libraries loaded via script tags.
// By declaring these on the window object, we can access them globally
// in our TypeScript code without getting compiler errors.
// These are loaded from CDNs in index.html.

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

// This export is needed to treat this file as a module.
export {};
