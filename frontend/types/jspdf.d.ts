declare module "jspdf" {
  export default class jsPDF {
    constructor(...args: any[]);
    lastAutoTable?: { finalY: number };
    internal: { pageSize: { height: number } };
    setFontSize(size: number): void;
    setFont(fontName: string, fontStyle: string): void;
    setTextColor(gray: number): void;
    text(text: string | string[], x: number, y: number): void;
    splitTextToSize(text: string, width: number): string[];
    addPage(): void;
    save(filename: string): void;
    getNumberOfPages(): number;
    setPage(page: number): void;
  }
}
