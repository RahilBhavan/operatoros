"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type Document = Database["public"]["Tables"]["documents"]["Row"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
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

export default function DocumentUpload({
  deadlineId,
  businessId,
  userId,
  existingDocuments,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>(existingDocuments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PDF, JPEG, PNG, and WebP files are supported.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File must be under 10 MB.");
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

    // Trigger AI expiry extraction in the background — no await, non-blocking
    fetch(`/api/documents/${doc.id}/extract-expiry`, { method: "POST" }).then(
      (res) => res.ok && router.refresh()
    );

    router.refresh();
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

  async function getDownloadUrl(doc: Document): Promise<string> {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 300); // 5 min
    return data?.signedUrl ?? "";
  }

  async function handleDownload(doc: Document) {
    const url = await getDownloadUrl(doc);
    if (url) window.open(url, "_blank");
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-4">
        Documents
      </h2>

      {/* Upload area */}
      <label
        htmlFor="doc-upload"
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 cursor-pointer transition-colors group"
      >
        <Upload className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
        <div className="text-center">
          <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600">
            {uploading ? "Uploading…" : "Click to upload"}
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            PDF, JPEG, PNG · Max 10 MB
          </p>
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

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Document list */}
      {documents.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-700 truncate">
                    {doc.file_name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(doc.uploaded_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {documents.length === 0 && !uploading && (
        <p className="mt-3 text-xs text-slate-400 text-center">
          No documents uploaded yet.
        </p>
      )}
    </div>
  );
}
