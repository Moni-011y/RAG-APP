// Polyfill for PDF.js in Node.js environment
if (typeof global !== 'undefined') {
    if (!(global as any).DOMMatrix) {
        (global as any).DOMMatrix = class DOMMatrix {
            constructor() { }
        };
    }
    if (!(global as any).ImageData) {
        (global as any).ImageData = class ImageData {
            constructor() { }
        };
    }
    // Disable PDF.js worker for serverless environments
    if ((global as any).process) {
        (global as any).process.env.PDFJS_DISABLE_WORKER = 'true';
    }
}
export { };
