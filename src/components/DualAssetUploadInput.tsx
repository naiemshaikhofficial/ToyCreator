'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  File,
  X,
  ExternalLink,
} from 'lucide-react';
import { uploadAssetToDriveAction } from '@/actions/driveUploadAction';

interface DualAssetUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onFileSizeDetected?: (size: string) => void;
  assetCategory?: string;
  accept?: string;
  placeholder?: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(i >= 2 ? 1 : 0));
  return `${val} ${sizes[i]}`;
}

export default function DualAssetUploadInput({
  label,
  value,
  onChange,
  onFileSizeDetected,
  assetCategory = 'asset',
  accept,
  placeholder = 'https://...',
  hint,
  icon: IconComponent,
}: DualAssetUploadInputProps) {
  // Determine initial mode: if value exists and is NOT a google drive upload or is external, user can still toggle freely
  const [mode, setMode] = useState<'upload' | 'link'>(value ? 'link' : 'upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isGoogleDriveLink = value?.includes('drive.google.com') || value?.includes('script.google.com');
  const isDropboxLink = value?.includes('dropbox.com');
  const isS3Link = value?.includes('amazonaws.com') || value?.includes('s3.');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMsg('');
      setSuccessMsg('');
      // Auto-detect and populate product file size immediately without waiting for upload to finish
      if (onFileSizeDetected) {
        onFileSizeDetected(formatBytes(file.size));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('assetCategory', assetCategory);

      const res = await uploadAssetToDriveAction(formData);

      if (res.success && res.fileUrl) {
        onChange(res.fileUrl);
        if (res.fileSize && onFileSizeDetected) {
          onFileSizeDetected(res.fileSize);
        }
        setSuccessMsg(`Uploaded to Cloud Storage (${res.fileSize || 'Saved'})`);
        setSelectedFile(null);
      } else {
        setErrorMsg(res.error || 'Failed to upload file to cloud storage.');
      }
    } catch (err: any) {
      console.error('Upload exception:', err);
      setErrorMsg(err.message || 'Network error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  const clearCurrentFile = () => {
    onChange('');
    setSelectedFile(null);
    setSuccessMsg('');
    setErrorMsg('');
  };

  return (
    <div className="space-y-2">
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          {IconComponent && <IconComponent className="w-3.5 h-3.5 text-zinc-400" />}
          <span>{label}</span>
        </label>

        {/* Segmented Mode Switcher */}
        <div className="inline-flex items-center p-0.5 bg-[#101010] border border-[#2a2a2a] rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1 ${
              mode === 'upload'
                ? 'bg-[#262626] text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <UploadCloud className="w-3 h-3" />
            <span>Direct Upload</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('link')}
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1 ${
              mode === 'link'
                ? 'bg-[#262626] text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>External Link</span>
          </button>
        </div>
      </div>

      {/* MODE 1: Direct File Upload */}
      {mode === 'upload' && (
        <div className="space-y-2">
          {value ? (
            /* Already has an uploaded URL */
            <div className="p-3 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#181818] border border-[#2e2e2e] flex items-center justify-center flex-shrink-0 text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-white truncate block">
                    {isGoogleDriveLink ? 'Stored in Google Drive' : 'Asset Configured'}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 truncate block">
                    {value}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-[#202020] transition-colors"
                  title="Test Link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={clearCurrentFile}
                  className="p-1.5 text-zinc-500 hover:text-red-400 rounded hover:bg-[#202020] transition-colors"
                  title="Remove Asset"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Upload Dropzone */
            <div className="bg-[#121212] border border-dashed border-[#2e2e2e] hover:border-[#42454e] rounded-xl p-3.5 transition-colors">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0 text-zinc-400">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <label className="text-xs font-medium text-zinc-200 block cursor-pointer hover:text-white">
                      <span>{selectedFile ? selectedFile.name : 'Choose file to upload'}</span>
                      <input
                        type="file"
                        accept={accept}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-zinc-500 block">
                      {selectedFile
                        ? `${formatBytes(selectedFile.size)} selected`
                        : 'Upload directly or link cloud storage (Zero size limit • Supports 2GB, 5GB+ plugins)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {selectedFile && (
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={handleUpload}
                      className="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload to Cloud</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-0.5">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="text-[11px] text-red-400 flex items-center gap-1.5 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: External Link */}
      {mode === 'link' && (
        <div className="space-y-1.5">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-zinc-500">
              <LinkIcon className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:border-[#42454e] transition-colors"
            />
          </div>

          {/* Cloud Provider Recognition Badges */}
          {value && (
            <div className="flex items-center gap-2 pt-0.5">
              {isGoogleDriveLink && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                  <CheckCircle className="w-3 h-3" />
                  Google Drive Detected (High-Speed Direct Delivery)
                </span>
              )}
              {isDropboxLink && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-400 bg-sky-950/40 border border-sky-900/40 px-2 py-0.5 rounded">
                  <CheckCircle className="w-3 h-3" />
                  Dropbox Link Recognized
                </span>
              )}
              {isS3Link && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded">
                  <CheckCircle className="w-3 h-3" />
                  AWS S3 Storage Recognized
                </span>
              )}
            </div>
          )}

          {hint ? (
            <span className="text-[10px] text-zinc-500 block">{hint}</span>
          ) : (
            <span className="text-[10px] text-zinc-500 block">
              Direct cloud link (Google Drive, Dropbox, AWS S3, or CDN). Zero file size restrictions.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
