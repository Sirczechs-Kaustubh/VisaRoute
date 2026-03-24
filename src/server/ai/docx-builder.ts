/**
 * Word document (.docx) builder using the `docx` npm package.
 * Provides helpers to convert structured text into professional Word documents.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  PageBreak,
  TabStopPosition,
  TabStopType,
} from "docx";

// ─── Cover Letter Document ──────────────────────────────

export interface CoverLetterInput {
  date: string;
  addressee: string;
  subject: string;
  body: string;
  applicantName: string;
}

export function buildCoverLetterDoc(input: CoverLetterInput): Document {
  const bodyParagraphs = input.body
    .split(/\n\n+/)
    .filter((p) => p.trim())
    .map(
      (paragraph) =>
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: paragraph.trim(),
              font: "Calibri",
              size: 22, // 11pt
            }),
          ],
        }),
    );

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: [
          // Date
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: input.date,
                font: "Calibri",
                size: 22,
              }),
            ],
          }),
          // Addressee
          ...input.addressee.split("\n").map(
            (line) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    font: "Calibri",
                    size: 22,
                  }),
                ],
              }),
          ),
          // Spacer
          new Paragraph({ spacing: { after: 300 } }),
          // Subject
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: `Subject: ${input.subject}`,
                bold: true,
                font: "Calibri",
                size: 22,
              }),
            ],
          }),
          // Body paragraphs
          ...bodyParagraphs,
          // Signature
          new Paragraph({ spacing: { before: 400 } }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Yours faithfully,",
                font: "Calibri",
                size: 22,
              }),
            ],
          }),
          new Paragraph({ spacing: { after: 600 } }),
          new Paragraph({
            children: [
              new TextRun({
                text: input.applicantName,
                bold: true,
                font: "Calibri",
                size: 22,
              }),
            ],
          }),
        ],
      },
    ],
  });
}

// ─── Checklist Document ─────────────────────────────────

export interface ChecklistItem {
  label: string;
  fileName: string;
  status: "uploaded" | "missing" | "recommended";
}

export function buildChecklistDoc(
  items: ChecklistItem[],
  applicantName: string,
  destination: string,
): Document {
  const STATUS_MARKERS: Record<string, string> = {
    uploaded: "[✓]",
    missing: "[✗]",
    recommended: "[~]",
  };

  const rows = items.map(
    (item) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 800, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: STATUS_MARKERS[item.status] ?? "[ ]",
                    font: "Calibri",
                    size: 22,
                    bold: true,
                    color: item.status === "uploaded" ? "2E7D32" : item.status === "missing" ? "C62828" : "EF6C00",
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 4000, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: item.label,
                    font: "Calibri",
                    size: 22,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 4200, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: item.fileName || "—",
                    font: "Calibri",
                    size: 20,
                    color: "666666",
                    italics: !item.fileName,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
  );

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Document Checklist",
                font: "Calibri",
                size: 32,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Applicant: ", font: "Calibri", size: 22, bold: true }),
              new TextRun({ text: applicantName, font: "Calibri", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({ text: "Destination: ", font: "Calibri", size: 22, bold: true }),
              new TextRun({ text: destination, font: "Calibri", size: 22 }),
            ],
          }),
          // Header row
          new Table({
            width: { size: 9000, type: WidthType.DXA },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    width: { size: 800, type: WidthType.DXA },
                    shading: { fill: "E8EAF6" },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "Status", font: "Calibri", size: 20, bold: true })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 4000, type: WidthType.DXA },
                    shading: { fill: "E8EAF6" },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "Document", font: "Calibri", size: 20, bold: true })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 4200, type: WidthType.DXA },
                    shading: { fill: "E8EAF6" },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "File", font: "Calibri", size: 20, bold: true })],
                      }),
                    ],
                  }),
                ],
              }),
              ...rows,
            ],
          }),
          // Legend
          new Paragraph({ spacing: { before: 400 } }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "[✓] Uploaded   ", font: "Calibri", size: 18, color: "2E7D32" }),
              new TextRun({ text: "[✗] Missing   ", font: "Calibri", size: 18, color: "C62828" }),
              new TextRun({ text: "[~] Recommended", font: "Calibri", size: 18, color: "EF6C00" }),
            ],
          }),
        ],
      },
    ],
  });
}

// ─── Application Summary Document ───────────────────────

export interface SummarySection {
  title: string;
  fields: { label: string; value: string }[];
}

export function buildSummaryDoc(
  applicantName: string,
  destination: string,
  submissionRef: string | null,
  sections: SummarySection[],
): Document {
  const sectionChildren: Paragraph[] = [];

  for (const section of sections) {
    sectionChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: section.title,
            font: "Calibri",
            size: 26,
            bold: true,
            color: "1A237E",
          }),
        ],
      }),
    );

    for (const field of section.fields) {
      sectionChildren.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: `${field.label}: `, font: "Calibri", size: 22, bold: true }),
            new TextRun({ text: field.value || "—", font: "Calibri", size: 22 }),
          ],
        }),
      );
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "Visa Application Summary",
                font: "Calibri",
                size: 36,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Applicant: ", font: "Calibri", size: 22, bold: true }),
              new TextRun({ text: applicantName, font: "Calibri", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "Destination: ", font: "Calibri", size: 22, bold: true }),
              new TextRun({ text: destination, font: "Calibri", size: 22 }),
            ],
          }),
          ...(submissionRef
            ? [
                new Paragraph({
                  spacing: { after: 60 },
                  children: [
                    new TextRun({ text: "Reference: ", font: "Calibri", size: 22, bold: true }),
                    new TextRun({ text: submissionRef, font: "Calibri", size: 22 }),
                  ],
                }),
              ]
            : []),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Generated: ", font: "Calibri", size: 22, bold: true }),
              new TextRun({
                text: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
                font: "Calibri",
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            },
            spacing: { after: 200 },
          }),
          ...sectionChildren,
        ],
      },
    ],
  });
}

// ─── Utility ────────────────────────────────────────────

export async function docToBuffer(doc: Document): Promise<Buffer> {
  return Packer.toBuffer(doc) as Promise<Buffer>;
}
