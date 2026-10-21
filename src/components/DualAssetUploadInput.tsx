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
  Info,
} from 'lucide-react';
import { uploadAssetToDriveAction, verifyDriveLinkAction } from '@/actions/driveUploadAction';

interface DualAssetUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onFileSizeDetected?: (size: string) => void;
  assetCategory?: string;
  accept?: string;
  placeholder?: string;
  info?: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  thumbnailUrl?: string;
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
  info,
  hint,
  icon: IconComponent,
  thumbnailUrl,
}: DualAssetUploadInputProps) {
  // Determine initial mode: if value exists and is NOT a cloud upload or is external, user can still toggle freely
  const [mode, setMode] = useState<'upload' | 'link'>(value ? 'link' : 'upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [verifyingDrive, setVerifyingDrive] = useState(false);
  const [driveMetadata, setDriveMetadata] = useState<{ fileName?: string; fileSize?: string } | null>(null);

  const tooltipText = info || hint;

  // Exact Google Drive file ID or URL recognition (Rule 7 compliant, avoids false positives on arbitrary URLs)
  const isGoogleDriveLink = Boolean(
    value && (
      value.includes('drive.google.com') ||
      value.includes('script.google.com') ||
      /^[a-zA-Z0-9_-]{28,35}$/.test(value.trim())
    )
  );
  const isDropboxLink = Boolean(value?.includes('dropbox.com'));
  const isS3Link = Boolean(value?.includes('amazonaws.com') || value?.includes('s3.'));

  // Live verify Google Drive links to auto-fetch file name & size for ProducerToy
  React.useEffect(() => {
    if (!value || !isGoogleDriveLink) {
      setDriveMetadata(null);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setVerifyingDrive(true);
      try {
        const res = await verifyDriveLinkAction(value);
        if (active && res.success) {
          setDriveMetadata({ fileName: res.fileName, fileSize: res.fileSize });
          if (res.fileSize && onFileSizeDetected) {
            onFileSizeDetected(res.fileSize);
          }
        }
      } catch (err) {
        console.error('Drive verification error:', err);
      } finally {
        if (active) setVerifyingDrive(false);
      }
    }, 600);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, isGoogleDriveLink]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMsg('');
      setSuccessMsg('');
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
        setSuccessMsg(`Asset verified (${res.fileSize || 'Saved'})`);
        setSelectedFile(null);
      } else {
        setErrorMsg(res.error || 'Failed to upload asset.');
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

  const effectiveThumbnail = thumbnailUrl || (assetCategory === 'cover' && value ? value : undefined);

  return (
    <div className="space-y-1.5 w-full min-w-0 max-w-full">
      {/* Minimal Header: Short Label + Info Tooltip + Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 w-full min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 min-w-0">
            {IconComponent && <IconComponent className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />}
            <span className="truncate">{label}</span>
          </label>

          {/* Minimal Info Hover Tooltip */}
          {tooltipText && (
            <div className="relative group/info flex items-center flex-shrink-0">
              <Info className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/info:block z-30 w-56 p-2 rounded-lg bg-[#1e1e1e] border border-zinc-700 text-[11px] font-normal normal-case text-zinc-200 shadow-2xl pointer-events-none text-left leading-relaxed">
                {tooltipText}
              </div>
            </div>
          )}
        </div>

        {/* Compact Segmented Mode Switcher */}
        <div className="inline-flex items-center p-0.5 bg-[#101010] border border-[#2a2a2a] rounded-lg flex-shrink-0">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1 ${
              mode === 'upload'
                ? 'bg-[#262626] text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <UploadCloud className="w-3 h-3 flex-shrink-0" />
            <span>Direct Upload</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('link')}
            className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all flex items-center gap-1 ${
              mode === 'link'
                ? 'bg-[#262626] text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LinkIcon className="w-3 h-3 flex-shrink-0" />
            <span>External Link</span>
          </button>
        </div>
      </div>

      {/* MODE 1: Direct File Upload */}
      {mode === 'upload' && (
        <div className="space-y-1.5 w-full min-w-0">
          {value ? (
            /* Configured Asset Pill */
            <div className="p-2 sm:p-2.5 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-between gap-2.5 w-full min-w-0 overflow-hidden">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                {effectiveThumbnail ? (
                  <div className="w-9 h-9 rounded-lg bg-[#181818] border border-[#2e2e2e] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner">
                    <img
                      src={effectiveThumbnail}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = '/icon.png';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#181818] border border-[#2e2e2e] flex items-center justify-center flex-shrink-0 text-zinc-300">
                    <CheckCircle className="w-3.5 h-3.5 text-zinc-300" />
                  </div>
                )}
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-white truncate block">
                      {assetCategory === 'cover'
                        ? 'Cover Artwork Configured'
                        : isGoogleDriveLink
                        ? 'ProducerToy Cloud Asset (CDN Ready)'
                        : 'Storage Asset Configured'}
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#202020] text-zinc-400 border border-[#2e2e2e] flex-shrink-0">
                      Active
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-mono text-zinc-500 truncate block max-w-full"
                    title={value}
                  >
                    {value}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#202020] transition-colors"
                  title="Test Link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={clearCurrentFile}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#202020] transition-colors"
                  title="Remove Asset"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Minimal Upload Dropzone */
            <div className="bg-[#121212] border border-dashed border-[#2e2e2e] hover:border-[#42454e] rounded-xl p-3 transition-colors w-full min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 min-w-0">
                <div className="flex items-center gap-2.5 w-full sm:w-auto min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-[#181818] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0 text-zinc-400">
                    <UploadCloud className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="text-xs font-medium text-zinc-200 block cursor-pointer hover:text-white truncate">
                      <span>{selectedFile ? selectedFile.name : 'Choose file to upload'}</span>
                      <input
                        type="file"
                        accept={accept}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-zinc-500 block truncate">
                      {selectedFile ? (
                        selectedFile.size > 50 * 1024 * 1024 ? (
                          <span className="text-amber-400 font-mono">
                            {formatBytes(selectedFile.size)} • Switch to External Link tab for 50MB+
                          </span>
                        ) : (
                          <span className="text-zinc-300">
                            {formatBytes(selectedFile.size)} selected • Ready
                          </span>
                        )
                      ) : (
                        'Direct upload or link from cloud storage'
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                  {selectedFile && (
                    selectedFile.size > 50 * 1024 * 1024 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('link');
                          setSelectedFile(null);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 bg-[#222222] hover:bg-[#2c2c2c] text-white border border-[#383838] transition-colors"
                      >
                        <LinkIcon className="w-3 h-3 text-zinc-300" />
                        <span>Paste Cloud Link</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={handleUpload}
                        className="btn-primary px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3 h-3" />
                            <span>Upload</span>
                          </>
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="text-[11px] text-zinc-300 flex items-center gap-1.5 pt-0.5">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-zinc-300" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="text-[11px] text-red-400 flex items-center gap-1.5 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: External Link */}
      {mode === 'link' && (
        <div className="space-y-1 w-full min-w-0">
          <div className="flex gap-2 items-center w-full min-w-0">
            {effectiveThumbnail && (
              <div className="w-9 h-9 rounded-lg bg-[#121212] border border-[#2e2e2e] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner">
                <img
                  src={effectiveThumbnail}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.target.src = '/icon.png';
                  }}
                />
              </div>
            )}
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3 top-2.5 text-zinc-500">
                <LinkIcon className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-[#121212] border border-[#2e2e2e] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:border-[#42454e] transition-colors font-mono"
              />
            </div>
          </div>

          {/* Minimal Cloud Provider Recognition Badges */}
          {value && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5 min-w-0">
              {verifyingDrive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-[#181818] border border-[#2a2a2a] px-2 py-0.5 rounded">
                  <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
                  Verifying asset...
                </span>
              )}
              {isGoogleDriveLink && !verifyingDrive && (
                driveMetadata?.fileName ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-zinc-200 bg-[#1c1c1c] border border-zinc-700/60 px-2 py-0.5 rounded-md">
                    <CheckCircle className="w-3 h-3 flex-shrink-0 text-zinc-300" />
                    <span>CDN Ready: <strong>{driveMetadata.fileName}</strong> {driveMetadata.fileSize ? `(${driveMetadata.fileSize})` : ''}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-200 bg-[#1c1c1c] border border-zinc-700/60 px-2 py-0.5 rounded">
                    <CheckCircle className="w-3 h-3 text-zinc-300" />
                    CDN Ready
                  </span>
                )
              )}
              {(isDropboxLink || isS3Link) && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-200 bg-[#1c1c1c] border border-zinc-700/60 px-2 py-0.5 rounded">
                  <CheckCircle className="w-3 h-3 text-zinc-300" />
                  Cloud Link Verified
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
