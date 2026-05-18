"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, Download, RotateCw, History } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { Body, Caption, Index, Utility } from "@/components/doctrine";

type Document = Database["public"]["Tables"]["documents"]["Row"];
type DocumentVersion = Database["public"]["Tables"]["document_versions"]["Row"];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

interface Props {
  deadlineId: string;
  businessId: string;
  userId: string;
  existingDocuments: Document[];
}

function formatBytes(file: Document): string {
  // Documents table has no size column — show type instead as the "index" figure.
  const ext = file.file_name.split(".").pop()?.toUpperCase();
  return ext ?? file.file_type.split("/").pop()?.toUpperCase() ?? "FILE";
}

export default function DocumentUpload({
  deadlineId,
  businessId,
  userId,
  existingDocuments,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>(existingDocuments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [versionsByDoc, setVersionsByDoc] = useState<Record<string, DocumentVersion[]>>({});
  const [openVersions, setOpenVersions] = useState<string | null>(null);

  function validateFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only PDF, JPEG, PNG, and WebP files are supported.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File must be under 10 MB.";
    }
    return null;
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const validation = validateFile(file);
    if (validation) {
      setError(validation);
      return;
    }

    setUploading(true);

    const supabase = createClient();
    const filePath = `${businessId}/${deadlineId}/${Date.now()}_${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadErr) {
      setError("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const { data: doc, error: dbErr } = await supabase
      .from("documents")
      .insert({
        deadline_id: deadlineId,
        business_id: businessId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        uploaded_by: userId,
      })
      .select()
      .single();

    if (dbErr || !doc) {
      setError("Failed to save document record.");
      setUploading(false);
      return;
    }

    setDocuments((prev) => [doc, ...prev]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    fetch(`/api/documents/${doc.id}/extract-expiry`, { method: "POST" }).then(
      (res) => res.ok && router.refresh()
    );

    router.refresh();
  }

  async function handleReplaceSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !replacingId) return;
    setError("");

    const validation = validateFile(file);
    if (validation) {
      setError(validation);
      setReplacingId(null);
      return;
    }

    setUploading(true);

    const supabase = createClient();
    const filePath = `${businessId}/${deadlineId}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(filePath, file);
    if (uploadErr) {
      setError("Upload failed. Please try again.");
      setUploading(false);
      setReplacingId(null);
      return;
    }

    const res = await fetch(`/api/documents/${replacingId}/replace`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        file_path: filePath,
        file_type: file.type,
        file_name: file.name,
      }),
    });

    if (!res.ok) {
      setError("Replace failed. Please try again.");
      setUploading(false);
      setReplacingId(null);
      return;
    }

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === replacingId
          ? {
              ...d,
              file_name: file.name,
              file_path: filePath,
              file_type: file.type,
              uploaded_at: new Date().toISOString(),
              expiry_date: null,
            }
          : d
      )
    );
    setVersionsByDoc((prev) => {
      const next = { ...prev };
      delete next[replacingId];
      return next;
    });
    setUploading(false);
    setReplacingId(null);
    if (replaceInputRef.current) replaceInputRef.current.value = "";

    fetch(`/api/documents/${replacingId}/extract-expiry`, { method: "POST" }).then(
      (res) => res.ok && router.refresh()
    );
    router.refresh();
  }

  async function loadVersions(docId: string) {
    if (versionsByDoc[docId]) {
      setOpenVersions(openVersions === docId ? null : docId);
      return;
    }
    const res = await fetch(`/api/documents/${docId}/replace`);
    if (!res.ok) return;
    const data = (await res.json()) as { versions: DocumentVersion[] };
    setVersionsByDoc((prev) => ({ ...prev, [docId]: data.versions }));
    setOpenVersions(docId);
  }

  async function handleDelete(doc: Document) {
    setError("");
    try {
      const supabase = createClient();
      const { error: storageErr } = await supabase.storage
        .from("documents")
        .remove([doc.file_path]);
      if (storageErr) throw storageErr;
      const { error: dbErr } = await supabase
        .from("documents")
        .delete()
        .eq("id", doc.id);
      if (dbErr) throw dbErr;
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      router.refresh();
    } catch {
      setError("Failed to delete document. Please try again.");
    }
  }

  async function getDownloadUrl(path: string): Promise<string> {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 300);
    return data?.signedUrl ?? "";
  }

  async function downloadByPath(path: string) {
    const url = await getDownloadUrl(path);
    if (url) window.open(url, "_blank");
  }

  // Hatched diagonal pattern at low opacity for the drop zone.
  const hatchStyle: React.CSSProperties = {
    backgroundImage:
      "repeating-linear-gradient(45deg, var(--color-ground) 0 1px, transparent 1px 8px)",
    backgroundColor: "var(--color-field)",
  };

  return (
    <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)]">
      {/* Header strip */}
      <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between">
        <Utility className="!text-[var(--color-field)] ">
          DOCUMENTS · DOSSIER
        </Utility>
        <Index className="!text-[var(--color-field)] !text-[13px]">
          {String(documents.length).padStart(3, "0")} ON FILE
        </Index>
      </div>

      <div className="px-5 py-5">
        {/* Drop zone */}
        <label
          htmlFor="doc-upload"
          className="flex flex-col items-center justify-center gap-2 border-2 border-[var(--color-ground)] p-8 cursor-pointer transition-opacity relative"
          style={hatchStyle}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: "var(--color-field)", opacity: 0.92 }}
          />
          <div className="relative flex flex-col items-center gap-3">
            <Upload className="w-7 h-7 text-[var(--color-ground)]" />
            <Utility>
              {uploading ? "UPLOADING…" : "DROP DOCUMENTS HERE"}
            </Utility>
            <Caption className="!mt-0">
              PDF · JPEG · PNG · WEBP — MAX 10 MB
            </Caption>
          </div>
          <input
            id="doc-upload"
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="sr-only"
          />
        </label>

        {/* Hidden replace input */}
        <input
          ref={replaceInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleReplaceSelect}
          disabled={uploading}
          className="sr-only"
        />

        {error && (
          <div className="mt-3 border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-4 py-2">
            <Utility className="!text-[var(--color-field)]">ERROR</Utility>
            <span className="t-body !text-[var(--color-field)] block">
              {error}
            </span>
          </div>
        )}

        {documents.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2">
            {documents.map((doc, idx) => {
              const versions = versionsByDoc[doc.id];
              return (
                <li key={doc.id}>
                  <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] px-4 py-3 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <Index className="!text-[12px]  shrink-0 w-8">
                        {String(idx + 1).padStart(3, "0")}
                      </Index>
                      <FileText className="w-4 h-4 text-[var(--color-ground)] shrink-0" />
                      <div className="min-w-0">
                        <Body className="!font-bold truncate">
                          {doc.file_name}
                        </Body>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Index className="!text-[12px]">
                            {formatBytes(doc)}
                          </Index>
                          <Caption className="!text-[12px] !mt-0">
                            ·{" "}
                            {new Date(doc.uploaded_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                            {doc.expiry_date && (
                              <>
                                {" · EXP "}
                                {new Date(doc.expiry_date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </>
                            )}
                          </Caption>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap shrink-0 justify-end">
                      <button
                        onClick={() => loadVersions(doc.id)}
                        className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--color-ground)] hover:bg-[var(--color-field)] transition-colors border-2 border-transparent hover:border-[var(--color-ground)]"
                        title="Version history"
                        aria-label="Version history"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setReplacingId(doc.id);
                          replaceInputRef.current?.click();
                        }}
                        className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--color-ground)] hover:bg-[var(--color-field)] transition-colors border-2 border-transparent hover:border-[var(--color-ground)]"
                        title="Replace"
                        aria-label="Replace"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadByPath(doc.file_path)}
                        className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--color-ground)] hover:bg-[var(--color-field)] transition-colors border-2 border-transparent hover:border-[var(--color-ground)]"
                        title="Download"
                        aria-label="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--color-mark)] hover:bg-[var(--color-mark)] hover:text-[var(--color-field)] transition-colors border-2 border-transparent hover:border-[var(--color-mark)]"
                        title="Delete"
                        aria-label="Delete"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {openVersions === doc.id && versions && versions.length > 0 && (
                    <ul className="ml-8 mt-1 mb-2 border-l-2 border-[var(--color-ground)] pl-4 flex flex-col gap-1">
                      {versions.map((v) => (
                        <li
                          key={v.id}
                          className="flex items-center justify-between py-1"
                        >
                          <Caption className="!mt-0">
                            PREVIOUS · SUPERSEDED{" "}
                            <Index className="!text-[12px]">
                              {new Date(v.superseded_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </Index>
                          </Caption>
                          <button
                            onClick={() => downloadByPath(v.file_path)}
                            className="t-link"
                          >
                            Download
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {openVersions === doc.id && versions && versions.length === 0 && (
                    <Caption className="ml-8 mt-1 mb-2">
                      No previous versions.
                    </Caption>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {documents.length === 0 && !uploading && (
          <Caption className="!mt-4 text-center">
            No documents uploaded yet.
          </Caption>
        )}
      </div>
    </div>
  );
}
