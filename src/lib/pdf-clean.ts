import { PDFDocument, PDFName } from "pdf-lib";

/** Strip author/title/producer history + XMP from a master on import (CLONE-PROMPT §17.6). Never used on served per-client copies. */
export async function stripMetadata(bytes: Uint8Array): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  pdf.setTitle(""); pdf.setAuthor(""); pdf.setSubject(""); pdf.setKeywords([]); pdf.setCreator(""); pdf.setProducer("");
  const info = pdf.context.lookup(pdf.context.trailerInfo.Info);
  if (info && "delete" in (info as object)) {
    for (const k of ["Title", "Author", "Subject", "Keywords", "Creator", "Producer", "CreationDate", "ModDate"]) (info as any).delete(PDFName.of(k));
  }
  pdf.catalog.delete(PDFName.of("Metadata")); // XMP packet
  return pdf.save({ useObjectStreams: true, updateFieldAppearances: false });
}
