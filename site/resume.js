const WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const ZIP_EOCD = 0x06054b50;
const ZIP_CENTRAL = 0x02014b50;
let objectUrl = null;

const byId = (id) => document.getElementById(id);

function formatBytes(bytes) {
  if (!bytes) return "0 bytes";
  if (bytes < 1024) return `${bytes} bytes`;
  return `${(bytes / 1024).toFixed(bytes < 1024 * 1024 ? 1 : 2)} KB`;
}

function setStatus(title, detail, kind = "") {
  const status = byId("resume-status");
  status.className = `resume-status ${kind}`;
  status.innerHTML = `<strong>${title}</strong><span>${detail}</span>`;
}

function setPreviewState(heading, label, kind = "") {
  byId("resume-preview-heading").textContent = heading;
  const state = byId("resume-preview-state");
  state.textContent = label;
  state.className = `pill ${kind}`;
}

function setMetadata(file, hash) {
  byId("resume-name").textContent = file.name;
  byId("resume-size").textContent = formatBytes(file.size);
  byId("resume-fingerprint").textContent = hash;
  byId("resume-integrity").textContent = "Local read complete";
  byId("resume-integrity").className = "resume-integrity-ok";
}

function findEndOfCentralDirectory(view) {
  const minimum = 22;
  for (let offset = view.byteLength - minimum; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === ZIP_EOCD) return offset;
  }
  throw new Error("This file does not contain a readable DOCX archive.");
}

function locateZipEntry(buffer, name) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocd = findEndOfCentralDirectory(view);
  const count = view.getUint16(eocd + 10, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  let cursor = centralOffset;
  const decoder = new TextDecoder();

  for (let index = 0; index < count; index += 1) {
    if (view.getUint32(cursor, true) !== ZIP_CENTRAL) throw new Error("The DOCX archive index is invalid.");
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const entryName = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
    if (entryName === name) {
      const localOffset = view.getUint32(cursor + 42, true);
      const method = view.getUint16(cursor + 10, true);
      const compressedSize = view.getUint32(cursor + 20, true);
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      return { method, compressed: bytes.slice(dataStart, dataStart + compressedSize) };
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`The DOCX is missing ${name}.`);
}

async function inflateEntry(entry) {
  if (entry.method === 0) return entry.compressed;
  if (entry.method !== 8 || typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot decompress the selected DOCX locally. Try the latest Chrome, Edge, Firefox, or Safari.");
  }
  const stream = new Blob([entry.compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function extractDocxText(buffer) {
  const entry = locateZipEntry(buffer, "word/document.xml");
  const xmlBytes = await inflateEntry(entry);
  const xml = new TextDecoder("utf-8").decode(xmlBytes);
  const xmlDocument = new DOMParser().parseFromString(xml, "application/xml");
  if (xmlDocument.querySelector("parsererror")) throw new Error("The DOCX text could not be read locally.");
  const paragraphs = [...xmlDocument.getElementsByTagNameNS(WORD_NS, "p")].map((paragraph) => {
    const pieces = [];
    const walker = xmlDocument.createTreeWalker(paragraph, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode;
    while (node) {
      if (node.namespaceURI === WORD_NS && node.localName === "t") pieces.push(node.textContent || "");
      if (node.namespaceURI === WORD_NS && node.localName === "tab") pieces.push("\t");
      if (node.namespaceURI === WORD_NS && (node.localName === "br" || node.localName === "cr")) pieces.push("\n");
      node = walker.nextNode();
    }
    return pieces.join("");
  });
  return paragraphs.length ? paragraphs : ["No readable paragraphs were found in this DOCX."];
}

async function sha256(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function renderPreview(paragraphs) {
  const preview = byId("resume-preview");
  preview.innerHTML = "";
  paragraphs.forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text || " ";
    preview.appendChild(paragraph);
  });
}

function clearSelection() {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
  byId("resume-file").value = "";
  byId("resume-open-original").hidden = true;
  byId("resume-clear").disabled = true;
  byId("resume-name").textContent = "—";
  byId("resume-size").textContent = "—";
  byId("resume-fingerprint").textContent = "—";
  byId("resume-integrity").textContent = "Not compared";
  byId("resume-integrity").className = "";
  byId("resume-preview").innerHTML = "<div class=\"resume-empty\"><span>◫</span><strong>Your resume will appear here.</strong><p>The preview is extracted from the selected DOCX in your browser. Your original file stays unchanged.</p></div>";
  setStatus("No file selected", "Your resume will stay on this device.");
  setPreviewState("Waiting for your file", "No file loaded");
}

async function handleFile(file) {
  if (!file) return;
  clearSelection();
  byId("resume-clear").disabled = false;
  setStatus("Reading locally…", "The file has not left this browser tab.");
  setPreviewState("Reading your resume", "Processing locally");

  if (!file.name.toLowerCase().endsWith(".docx")) {
    setStatus("DOCX file required", "Choose the original Microsoft Word .docx file.", "error");
    setPreviewState("Unsupported file", "Choose a DOCX", "error");
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const hash = await sha256(buffer);
    setMetadata(file, hash);
    const paragraphs = await extractDocxText(buffer);
    renderPreview(paragraphs);
    objectUrl = URL.createObjectURL(file);
    const openOriginal = byId("resume-open-original");
    openOriginal.href = objectUrl;
    openOriginal.download = file.name;
    openOriginal.hidden = false;
    setStatus("Original loaded locally", "The selected file was read without changing it.", "success");
    setPreviewState("Resume preview", "Local file loaded", "success");
  } catch (error) {
    setMetadata(file, "Unavailable");
    setStatus("Could not read this DOCX", error.message || "The file could not be parsed in this browser.", "error");
    setPreviewState("Preview unavailable", "Read error", "error");
  }
}

byId("resume-file").addEventListener("change", (event) => handleFile(event.target.files?.[0]));
byId("resume-clear").addEventListener("click", clearSelection);
window.addEventListener("beforeunload", () => { if (objectUrl) URL.revokeObjectURL(objectUrl); });
