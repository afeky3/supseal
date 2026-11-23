import { createWriteStream } from "fs";
// Plain `import X from "pdfkit"/"qrcode"` compiles (under this project's
// non-esModuleInterop tsconfig) to expect a `.default` export, which
// neither CJS package has — same class of bug as main.ts's cookie-parser
// import. `import * as X` binds the whole required module, which for both
// of these IS the thing we want to call directly.
import * as PDFDocument from "pdfkit";
import * as QRCode from "qrcode";

const MARGIN = 36;
const COLS = 3;
const ROWS = 5;
const PER_PAGE = COLS * ROWS;
const QR_SIZE = 90;
// pdfkit's A4 page size in points — hardcoded because with autoFirstPage:
// false (needed so the header-drawing logic in addPage() runs uniformly for
// every page, including the first), `doc.page` is null until the first
// addPage() call, so it can't be read at construction time.
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

/**
 * Streams a print-ready PDF (QR image + hidden code per sticker) directly to
 * disk rather than building it in memory — the only way this stays cheap at
 * a few thousand-plus codes. Fed one code at a time by the caller so the
 * caller can generate codes in DB-insert-sized chunks and never hold more
 * than one chunk of plaintext in memory at once (see
 * StickerBatchesService.processGeneration).
 */
export class BatchPdfBuilder {
  private readonly doc: PDFKit.PDFDocument;
  private readonly done: Promise<void>;
  private cellIndex = 0;
  private pageCount = 0;
  private readonly cellWidth: number;
  private readonly cellHeight: number;

  constructor(
    filePath: string,
    private readonly header: { brandName: string; productName: string; sku: string; batchId: string },
  ) {
    this.doc = new PDFDocument({ size: "A4", margin: MARGIN, autoFirstPage: false });
    const stream = createWriteStream(filePath);
    this.doc.pipe(stream);
    this.done = new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
      this.doc.on("error", reject);
    });

    const usableWidth = A4_WIDTH - MARGIN * 2;
    const usableHeight = A4_HEIGHT - MARGIN * 2 - 40; // header band
    this.cellWidth = usableWidth / COLS;
    this.cellHeight = usableHeight / ROWS;

    this.addPage();
  }

  private addPage() {
    this.doc.addPage();
    this.pageCount += 1;
    this.doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(`${this.header.brandName} — ${this.header.productName}`, MARGIN, MARGIN);
    this.doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#555555")
      .text(
        `SKU ${this.header.sku}  ·  Batch ${this.header.batchId}  ·  Page ${this.pageCount}`,
        MARGIN,
        MARGIN + 14,
      )
      .fillColor("#000000");
    this.cellIndex = 0;
  }

  /** hiddenCode is plaintext — the only place it exists outside the moment it was generated. */
  async addCode(qrToken: string, hiddenCode: string, verifyUrl: string) {
    if (this.cellIndex >= PER_PAGE) {
      this.addPage();
    }
    const col = this.cellIndex % COLS;
    const row = Math.floor(this.cellIndex / COLS);
    const x = MARGIN + col * this.cellWidth;
    const y = MARGIN + 40 + row * this.cellHeight;

    const qrPng = await QRCode.toBuffer(verifyUrl, {
      type: "png",
      width: QR_SIZE * 2, // render at 2x for crisper print output
      margin: 1,
    });

    const qrX = x + (this.cellWidth - QR_SIZE) / 2;
    this.doc.image(qrPng, qrX, y, { width: QR_SIZE, height: QR_SIZE });
    this.doc
      .font("Courier-Bold")
      .fontSize(10)
      .text(hiddenCode, x, y + QR_SIZE + 6, { width: this.cellWidth, align: "center" });
    this.doc
      .font("Helvetica")
      .fontSize(6)
      .fillColor("#888888")
      .text(qrToken, x, y + QR_SIZE + 20, { width: this.cellWidth, align: "center" })
      .fillColor("#000000");

    this.cellIndex += 1;
  }

  async finish(): Promise<void> {
    this.doc.end();
    await this.done;
  }
}
