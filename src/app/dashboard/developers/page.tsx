'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Code,
  Terminal,
  ShieldCheck,
  Zap,
  Globe,
  Key,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Server,
  ArrowRight,
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Layers,
  BookOpen,
  Laptop,
  Monitor,
  FileCode,
} from 'lucide-react';
import { RoleGate } from '@/components/RoleGate';

type ArchitectureModel = 'machine_seat' | 'webhook' | 'csv_pool';
type WebhookLanguageTab = 'nextjs' | 'nodejs' | 'python' | 'php' | 'curl';
type MachineLanguageTab = 'juce_cpp' | 'curl' | 'csharp' | 'python';

export default function DeveloperGuidePage() {
  const [activeModel, setActiveModel] = useState<ArchitectureModel>('machine_seat');
  const [activeWebhookTab, setActiveWebhookTab] = useState<WebhookLanguageTab>('nextjs');
  const [activeMachineTab, setActiveMachineTab] = useState<MachineLanguageTab>('juce_cpp');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ================= MACHINE SEAT AUTH (PRODUCERTOY NATIVE DRM) SAMPLES =================
  const machineActivationRequestSample = `{
  "productId": "com.yourbrand.synth",
  "serialKey": "PT-YOURB-A1B2-C3D4-E5F6",
  "deviceId": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "deviceName": "Producer Studio Mac",
  "os": "macOS 15.2 (Apple Silicon)"
}`;

  const machineActivationResponseSample = `{
  "success": true,
  "token": "pt_jwt_eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiSldUIn0...",
  "seatsUsed": 1,
  "maxSeats": 3,
  "expiresAt": "2027-10-27T16:00:00Z"
}`;

  const machineDeactivationRequestSample = `{
  "productId": "com.yourbrand.synth",
  "deviceId": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "token": "pt_jwt_eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiSldUIn0..."
}`;

  const machineSnippets: Record<MachineLanguageTab, { filename: string; code: string }> = {
    juce_cpp: {
      filename: 'ProducerToyLicenseManager.h (JUCE 7 / JUCE 8)',
      code: `#pragma once
#include <juce_core/juce_core.h>

/**
 * ProducerToy Native Machine Seat Auth SDK for JUCE 7 & 8
 * Drop this header into your VST3/AU/AAX audio plugin project.
 * Compatible with any audio plugin published on ProducerToy.
 */
class ProducerToyLicenseManager
{
public:
    // Computes a tamper-resistant 64-character SHA-256 machine hash
    static juce::String getHardwareDeviceID()
    {
        auto rawId = juce::SystemStats::getUniqueDeviceID();
        return juce::SHA256(rawId.toUTF8()).toHexString().toLowerCase();
    }

    struct ActivationResult
    {
        bool success = false;
        juce::String licenseToken;
        int seatsUsed = 0;
        int maxSeats = 0;
        juce::String errorMessage;
    };

    /**
     * Activates a buyer's serial key against ProducerToy's licensing server.
     * @param pluginIdentifier The exact identifier set in Toy Creator (e.g. "com.yourbrand.synth")
     * @param serialKey The customer's serial key from checkout (e.g. "PT-YOURB-XXXX-XXXX-XXXX")
     */
    static ActivationResult activateSerial(const juce::String& pluginIdentifier,
                                          const juce::String& serialKey)
    {
        juce::URL url("https://producertoy.com/api/v1/license/serial/activate");

        juce::DynamicObject::Ptr body = new juce::DynamicObject();
        body->setProperty("productId", pluginIdentifier.trim());
        body->setProperty("serialKey", serialKey.trim().toUpperCase());
        body->setProperty("deviceId", getHardwareDeviceID());
        body->setProperty("deviceName", juce::SystemStats::getComputerName());
        body->setProperty("os", juce::SystemStats::getOperatingSystemName());

        juce::MemoryOutputStream stream;
        juce::JSON::writeToStream(stream, juce::var(body.get()));

        url = url.withPOSTData(stream.toString());

        int statusCode = 0;
        juce::StringPairArray responseHeaders;
        auto options = juce::URL::InputStreamOptions(juce::URL::ParameterHandling::inPostData)
                           .withConnectionTimeoutMs(6000)
                           .withExtraHeaders("Content-Type: application/json\\r\\nAccept: application/json")
                           .withResponseHeaders(&responseHeaders)
                           .withStatusCode(&statusCode);

        std::unique_ptr<juce::InputStream> in(url.createInputStream(options));
        if (in == nullptr)
        {
            return { false, {}, 0, 0, "Network connection to ProducerToy licensing server failed." };
        }

        auto responseJson = in->readEntireStreamAsString();
        auto parsed = juce::JSON::parse(responseJson);
        if (!parsed.isObject())
        {
            return { false, {}, 0, 0, "Invalid JSON response from licensing server." };
        }

        bool ok = parsed.getProperty("success", false);
        if (!ok)
        {
            auto err = parsed.getProperty("error", "Activation was declined by server.").toString();
            return { false, {}, 0, 0, err };
        }

        ActivationResult res;
        res.success = true;
        res.licenseToken = parsed.getProperty("token", "").toString();
        res.seatsUsed = parsed.getProperty("seatsUsed", 1);
        res.maxSeats = parsed.getProperty("maxSeats", 1);

        // Save cryptographic token securely to local Application Data
        saveLicenseLocally(pluginIdentifier, res.licenseToken);

        return res;
    }

    /**
     * Deactivates the current computer seat so the user can transfer their plugin to a new computer.
     */
    static bool deactivateSeat(const juce::String& pluginIdentifier)
    {
        auto token = loadLicenseLocally(pluginIdentifier);
        if (token.isEmpty()) return true;

        juce::URL url("https://producertoy.com/api/v1/license/deactivate");

        juce::DynamicObject::Ptr body = new juce::DynamicObject();
        body->setProperty("productId", pluginIdentifier.trim());
        body->setProperty("deviceId", getHardwareDeviceID());
        body->setProperty("token", token);

        juce::MemoryOutputStream stream;
        juce::JSON::writeToStream(stream, juce::var(body.get()));

        url = url.withPOSTData(stream.toString());

        auto options = juce::URL::InputStreamOptions(juce::URL::ParameterHandling::inPostData)
                           .withConnectionTimeoutMs(5000)
                           .withExtraHeaders("Content-Type: application/json\\r\\nAccept: application/json");

        std::unique_ptr<juce::InputStream> in(url.createInputStream(options));
        removeLocalLicense(pluginIdentifier);
        return in != nullptr;
    }

private:
    static juce::File getLicenseFile(const juce::String& pluginIdentifier)
    {
        auto appData = juce::File::getSpecialLocation(juce::File::userApplicationDataDirectory);
        return appData.getChildFile("ProducerToy")
                      .getChildFile("Licenses")
                      .getChildFile(pluginIdentifier + ".ptlic");
    }

    static void saveLicenseLocally(const juce::String& pluginIdentifier, const juce::String& token)
    {
        auto file = getLicenseFile(pluginIdentifier);
        file.getParentDirectory().createDirectory();
        file.replaceWithText(token);
    }

    static juce::String loadLicenseLocally(const juce::String& pluginIdentifier)
    {
        auto file = getLicenseFile(pluginIdentifier);
        return file.existsAsFile() ? file.loadFileAsString().trim() : juce::String();
    }

    static void removeLocalLicense(const juce::String& pluginIdentifier)
    {
        auto file = getLicenseFile(pluginIdentifier);
        if (file.existsAsFile()) file.deleteFile();
    }
};`,
    },
    curl: {
      filename: 'Direct cURL Terminal Test',
      code: `# 1. Test Online Machine Activation:
curl -X POST https://producertoy.com/api/v1/license/serial/activate \\
  -H "Content-Type: application/json" \\
  -d '{
    "productId": "com.yourbrand.synth",
    "serialKey": "PT-YOURB-A1B2-C3D4-E5F6",
    "deviceId": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "deviceName": "MacBook Pro Studio",
    "os": "macOS"
  }'

# Expected 200 OK Response:
# {
#   "success": true,
#   "token": "pt_jwt_eyJhbGciOiJFZDI1NTE5IiwidHlw...",
#   "seatsUsed": 1,
#   "maxSeats": 3
# }

# 2. Test Seat Deactivation (Hardware Transfer):
curl -X POST https://producertoy.com/api/v1/license/deactivate \\
  -H "Content-Type: application/json" \\
  -d '{
    "productId": "com.yourbrand.synth",
    "deviceId": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "token": "pt_jwt_eyJhbGciOiJFZDI1NTE5IiwidHlw..."
  }'`,
    },
    csharp: {
      filename: 'ProducerToyLicensing.cs (C# / Unity / WPF)',
      code: `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;
using System.Threading.Tasks;

public static class ProducerToyLicensing
{
    private static readonly HttpClient client = new HttpClient();

    public static string GetHardwareId()
    {
        // 64-char hex SHA256 of machine name + user domain
        string raw = Environment.MachineName + Environment.UserName;
        using var sha = SHA256.Create();
        byte[] hash = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }

    public static async Task<bool> ActivateAsync(string pluginId, string serialKey)
    {
        var payload = new
        {
            productId = pluginId,
            serialKey = serialKey.Trim().ToUpper(),
            deviceId = GetHardwareId(),
            deviceName = Environment.MachineName,
            os = Environment.OSVersion.ToString()
        };

        var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("https://producertoy.com/api/v1/license/serial/activate", content);

        if (!response.IsSuccessStatusCode) return false;

        string json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("success").GetBoolean();
    }
}`,
    },
    python: {
      filename: 'license_client.py (Python / AI Models)',
      code: `import requests
import hashlib
import platform

def get_device_id():
    raw = platform.node() + platform.machine()
    return hashlib.sha256(raw.encode()).hexdigest()

def activate_plugin(plugin_identifier: str, serial_key: str):
    url = "https://producertoy.com/api/v1/license/serial/activate"
    payload = {
        "productId": plugin_identifier,
        "serialKey": serial_key.strip().upper(),
        "deviceId": get_device_id(),
        "deviceName": platform.node(),
        "os": platform.system()
    }
    res = requests.post(url, json=payload, timeout=6)
    data = res.json()
    if data.get("success"):
        print(f"Plugin Activated! Seats: {data.get('seatsUsed')}/{data.get('maxSeats')}")
        return data.get("token")
    else:
        print(f"Activation Failed: {data.get('error')}")
        return None`,
    },
  };

  // ================= WEBHOOK MODEL SAMPLES =================
  const webhookPayloadSample = `{
  "event": "license.generate",
  "order_id": "PT_ORD_1740000000_A9B2",
  "product_id": "92cf2454-2cfc-4db5-b210-2c732457605f",
  "product_slug": "groove-console",
  "product_sku": "GROOVE-CON",
  "product_name": "Groove Console Audio Plugin",
  "customer_reference": "usr_78a1bc92",
  "customer_email": "producer@studio.com",
  "seller_data_sharing_consented": true,
  "currency": "USD",
  "amount_paid": 29.00,
  "timestamp": 1740000000
}`;

  const webhookResponseSample = `{
  "status": "success",
  "serial_key": "BRAND-XK89-9901-PROD",
  "seats": 3,
  "instructions": "Paste this key into the plugin authorization dialog."
}`;

  const webhookSnippets: Record<WebhookLanguageTab, { filename: string; code: string }> = {
    nextjs: {
      filename: 'app/api/licenses/issue/route.ts',
      code: `import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const PRODUCERTOY_WEBHOOK_SECRET = process.env.PRODUCERTOY_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-producertoy-signature');

    if (PRODUCERTOY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', PRODUCERTOY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const isValid =
        signature &&
        signature.length === expectedSignature.length &&
        crypto.timingSafeEqual(Buffer.from(signature, 'utf-8'), Buffer.from(expectedSignature, 'utf-8'));

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const serialKey = \`\${payload.product_sku || 'VST'}-\${crypto.randomBytes(4).toString('hex').toUpperCase()}\`;

    return NextResponse.json({
      status: 'success',
      serial_key: serialKey,
      seats: 3
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}`,
    },
    nodejs: {
      filename: 'server.js (Express)',
      code: `const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf.toString('utf8'); }
}));

const WEBHOOK_SECRET = process.env.PRODUCERTOY_WEBHOOK_SECRET || 'pt_sec_live_...';

app.post('/api/v1/licenses/issue', async (req, res) => {
  try {
    const signature = req.headers['x-producertoy-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (WEBHOOK_SECRET) {
      const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
      const isMatch = signature && signature.length === hmac.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac));

      if (!isMatch) return res.status(401).json({ error: 'Signature verification failed' });
    }

    const { product_sku } = req.body;
    const serial = \`\${product_sku || 'VST'}-\${crypto.randomBytes(4).toString('hex').toUpperCase()}\`;

    return res.status(200).json({ status: 'success', serial_key: serial, seats: 3 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => console.log('Licensing webhook listening on port 4000'));`,
    },
    python: {
      filename: 'main.py (FastAPI)',
      code: `import hmac
import hashlib
import os
from fastapi import FastAPI, Request, HTTPException, status

app = FastAPI()
WEBHOOK_SECRET = os.getenv("PRODUCERTOY_WEBHOOK_SECRET", "pt_sec_live_...")

@app.post("/api/v1/licenses/issue")
async def issue_license(request: Request):
    body_bytes = await request.body()
    signature = request.headers.get("x-producertoy-signature")

    if WEBHOOK_SECRET:
        expected_sig = hmac.new(WEBHOOK_SECRET.encode("utf-8"), body_bytes, hashlib.sha256).hexdigest()
        if not signature or not hmac.compare_digest(signature, expected_sig):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid HMAC signature")

    payload = await request.json()
    sku = payload.get("product_sku", "PLUGIN")
    generated_key = f"{sku}-PROD-{os.urandom(4).hex().upper()}"

    return {"status": "success", "serial_key": generated_key, "seats": 3}`,
    },
    php: {
      filename: 'license-webhook.php (PHP / WooCommerce)',
      code: `<?php
header('Content-Type: application/json');
$webhook_secret = getenv('PRODUCERTOY_WEBHOOK_SECRET') ?: 'pt_sec_live_...';
$raw_input = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_PRODUCERTOY_SIGNATURE'] ?? '';

if (!empty($webhook_secret)) {
    $expected_sig = hash_hmac('sha256', $raw_input, $webhook_secret);
    if (!hash_equals($expected_sig, $signature)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid HMAC signature']);
        exit;
    }
}

$payload = json_decode($raw_input, true);
$sku = $payload['product_sku'] ?? 'VST';
$random_part = strtoupper(bin2hex(random_bytes(4)));

echo json_encode([
    'status' => 'success',
    'serial_key' => "{$sku}-{$random_part}-ACTIVE",
    'seats' => 3
]);
?>`,
    },
    curl: {
      filename: 'cURL Webhook Test',
      code: `curl -X POST https://api.yourbrand.com/v1/licenses/issue \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer pt_sec_live_your_secret_here" \\
  -H "X-ProducerToy-Event: license.test" \\
  -d '{
    "event": "license.test",
    "order_id": "PT_TEST_MANUAL_001",
    "product_sku": "GROOVE-CON",
    "customer_reference": "user_demo",
    "timestamp": 1740000000
  }'`,
    },
  };

  return (
    <RoleGate
      allowedRoles={['owner', 'admin', 'developer']}
      sectionName="Developer API & Webhook Guide"
    >
      <div className="space-y-8 font-sans max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="border-b border-[#262626] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-300 bg-[#202020] px-2.5 py-0.5 rounded border border-[#34363d]">
                Multi-Brand Licensing Architecture
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white bg-white/10 px-2.5 py-0.5 rounded border border-white/20">
                Universal Plugin SDK
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Developer Licensing & Integration Portal</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Choose the perfect licensing model for your audio software. ProducerToy natively handles hardware machine binding, dynamic serial generation, and live webhooks for any audio brand.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <Link
              href="/dashboard/products"
              className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <span>My Products Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3 Architecture Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* MODEL 1: MACHINE SEAT AUTH */}
          <button
            type="button"
            onClick={() => setActiveModel('machine_seat')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
              activeModel === 'machine_seat'
                ? 'bg-[#181818] border-white text-white shadow-sm'
                : 'bg-[#121212] border-[#262626] text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-white">
                  <Cpu className="w-4 h-4 text-white" />
                  <span>1. Machine Seat Auth</span>
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-black">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Zero server setup. ProducerToy dynamically generates serial keys on checkout and handles cryptographic hardware workstation seat activations (1–5 seats).
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 border-t border-white/[0.08] pt-2 block">
              Best for VST3, AU, AAX plugins
            </span>
          </button>

          {/* MODEL 2: DEVELOPER WEBHOOK */}
          <button
            type="button"
            onClick={() => setActiveModel('webhook')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
              activeModel === 'webhook'
                ? 'bg-[#181818] border-white text-white shadow-sm'
                : 'bg-[#121212] border-[#262626] text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-white">
                  <Zap className="w-4 h-4 text-zinc-300" />
                  <span>2. Developer Webhook</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#202020] text-zinc-400 border border-[#2e2e2e]">
                  Your Server
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                If your brand already runs an in-house licensing server, ProducerToy sends a secure HTTPS webhook on checkout and claims a serial key from you.
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 border-t border-white/[0.08] pt-2 block">
              Plugin Boutique & Splice model
            </span>
          </button>

          {/* MODEL 3: PRE-LOADED CSV POOL */}
          <button
            type="button"
            onClick={() => setActiveModel('csv_pool')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
              activeModel === 'csv_pool'
                ? 'bg-[#181818] border-white text-white shadow-sm'
                : 'bg-[#121212] border-[#262626] text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-white">
                  <Key className="w-4 h-4 text-zinc-300" />
                  <span>3. Serial Key Pool</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#202020] text-zinc-400 border border-[#2e2e2e]">
                  Zero-Code
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Upload a CSV batch of 1,000–50,000 pre-minted serial keys or PACE iLok codes. ProducerToy assigns one unique key per buyer order.
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 border-t border-white/[0.08] pt-2 block">
              Ideal for PACE iLok batches
            </span>
          </button>
        </div>

        {/* ================= SECTION 1: MACHINE SEAT AUTH (PRODUCERTOY NATIVE DRM) ================= */}
        {activeModel === 'machine_seat' && (
          <div className="space-y-6">
            {/* Walkthrough 4 Steps */}
            <div className="toy-card p-6 space-y-5">
              <div className="border-b border-[#262626] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-zinc-300" />
                    <span>How Machine Seat Auth Works for Any Plugin</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Universal anti-piracy licensing built directly into ProducerToy for all creator brands
                  </p>
                </div>
                <span className="text-[10px] font-mono text-white bg-white/10 px-2.5 py-1 rounded border border-white/20">
                  Zero Server Maintenance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 space-y-2">
                  <span className="w-6 h-6 rounded-lg bg-white text-black font-mono text-xs font-extrabold flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-xs font-bold text-white">Select in Creator</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Open your product, go to Step 4 Licensing, and click <strong>Machine Seat Auth</strong>.
                  </p>
                </div>

                <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 space-y-2">
                  <span className="w-6 h-6 rounded-lg bg-white text-black font-mono text-xs font-extrabold flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-xs font-bold text-white">Set Identifier</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Set your plugin identifier (e.g. <code className="text-zinc-200 font-mono">com.yourbrand.synth</code>) and machine seats (e.g. 3).
                  </p>
                </div>

                <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 space-y-2">
                  <span className="w-6 h-6 rounded-lg bg-white text-black font-mono text-xs font-extrabold flex items-center justify-center">
                    3
                  </span>
                  <h3 className="text-xs font-bold text-white">Dynamic Checkouts</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    ProducerToy automatically mints unique keys (<code className="text-zinc-200 font-mono">PT-BRAND-XXXX...</code>) for every buyer. No CSV pool needed!
                  </p>
                </div>

                <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 space-y-2">
                  <span className="w-6 h-6 rounded-lg bg-white text-black font-mono text-xs font-extrabold flex items-center justify-center">
                    4
                  </span>
                  <h3 className="text-xs font-bold text-white">Activate in DAW</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Your plugin calls the ProducerToy activation endpoint from C++/JUCE to verify and bind the computer seat.
                  </p>
                </div>
              </div>
            </div>

            {/* REST API Endpoints Specification */}
            <div className="toy-card p-6 space-y-4">
              <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4 text-zinc-300" />
                    <span>Machine Seat REST API Endpoints</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Global HTTPS endpoints queried directly by your VST/AU binary
                  </p>
                </div>
                <span className="text-[10px] font-mono text-zinc-300 bg-[#202020] px-2.5 py-1 rounded border border-[#34363d]">
                  JSON / HTTPS
                </span>
              </div>

              {/* Endpoints Table */}
              <div className="overflow-x-auto border border-[#262626] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181818] border-b border-[#262626] text-zinc-400 text-[10px] uppercase font-mono tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3.5">Method</th>
                      <th className="py-2.5 px-3.5">Endpoint URL</th>
                      <th className="py-2.5 px-3.5">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222] font-mono text-[11px]">
                    <tr>
                      <td className="py-2.5 px-3.5 text-white font-bold">POST</td>
                      <td className="py-2.5 px-3.5 text-zinc-300">https://producertoy.com/api/v1/license/serial/activate</td>
                      <td className="py-2.5 px-3.5 font-sans text-zinc-400">Verifies serial key and binds workstation device ID</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 text-white font-bold">POST</td>
                      <td className="py-2.5 px-3.5 text-zinc-300">https://producertoy.com/api/v1/license/deactivate</td>
                      <td className="py-2.5 px-3.5 font-sans text-zinc-400">Releases seat when user uninstalls or upgrades computer</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3.5 text-white font-bold">GET</td>
                      <td className="py-2.5 px-3.5 text-zinc-300">https://producertoy.com/api/v1/license/offline</td>
                      <td className="py-2.5 px-3.5 font-sans text-zinc-400">Offline signed .ptlic file download for non-internet studio rigs</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sample Payloads */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                      Activation Request Body (JSON)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(machineActivationRequestSample, 'mac-req')}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'mac-req' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'mac-req' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="bg-[#0e0e0e] border border-[#242424] p-3.5 rounded-xl font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
                    {machineActivationRequestSample}
                  </pre>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                      Activation Success Response (JSON)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(machineActivationResponseSample, 'mac-res')}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'mac-res' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'mac-res' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="bg-[#0e0e0e] border border-[#242424] p-3.5 rounded-xl font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
                    {machineActivationResponseSample}
                  </pre>
                </div>
              </div>
            </div>

            {/* Production Code Snippets for Plugins */}
            <div className="toy-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Code className="w-4 h-4 text-zinc-300" />
                    <span>Drop-In C++ (JUCE) & Client SDK Implementations</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Ready to copy into your audio plugin project
                  </p>
                </div>

                {/* Machine Tab Selector */}
                <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-[#282828] overflow-x-auto">
                  {(['juce_cpp', 'curl', 'csharp', 'python'] as MachineLanguageTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveMachineTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                        activeMachineTab === tab
                          ? 'bg-[#282828] text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {tab === 'juce_cpp' && 'C++ (JUCE 7/8)'}
                      {tab === 'curl' && 'cURL Terminal'}
                      {tab === 'csharp' && 'C# (.NET / Unity)'}
                      {tab === 'python' && 'Python'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Snippet Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono text-[11px] text-zinc-300">
                    {machineSnippets[activeMachineTab].filename}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(machineSnippets[activeMachineTab].code, `mac-code-${activeMachineTab}`)}
                    className="btn-secondary px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    {copiedKey === `mac-code-${activeMachineTab}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied Code</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="bg-[#0b0b0b] border border-[#262626] p-4 rounded-xl font-mono text-[11px] text-zinc-200 overflow-x-auto leading-relaxed max-h-[480px]">
                  {machineSnippets[activeMachineTab].code}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 2: DEVELOPER WEBHOOK API ================= */}
        {activeModel === 'webhook' && (
          <div className="space-y-6">
            <div className="toy-card p-6 space-y-6">
              <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4 text-zinc-300" />
                    <span>Inbound Webhook Specification (Your Server)</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Dispatched by ProducerToy upon verified purchase on producertoy.com
                  </p>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-[#1e1e1e] px-2.5 py-1 rounded border border-[#2a2a2a]">
                  POST (HTTPS)
                </span>
              </div>

              {/* Headers Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Request Headers
                </h3>
                <div className="overflow-x-auto border border-[#262626] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#181818] border-b border-[#262626] text-zinc-400 text-[10px] uppercase font-mono tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3.5">Header Name</th>
                        <th className="py-2.5 px-3.5">Description</th>
                        <th className="py-2.5 px-3.5">Example Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222222] font-mono text-[11px]">
                      <tr>
                        <td className="py-2.5 px-3.5 text-zinc-300">Content-Type</td>
                        <td className="py-2.5 px-3.5 font-sans text-zinc-400">Payload encoding</td>
                        <td className="py-2.5 px-3.5 text-zinc-300">application/json</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-zinc-300">Authorization</td>
                        <td className="py-2.5 px-3.5 font-sans text-zinc-400">Bearer shared secret token</td>
                        <td className="py-2.5 px-3.5 text-zinc-300">Bearer pt_sec_live_9f8a...</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-zinc-300">X-ProducerToy-Signature</td>
                        <td className="py-2.5 px-3.5 font-sans text-zinc-400">HMAC-SHA256 hex digest of raw body using your secret</td>
                        <td className="py-2.5 px-3.5 text-zinc-300">e3b0c44298fc1c149afbf4c8...</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3.5 text-zinc-300">X-ProducerToy-Event</td>
                        <td className="py-2.5 px-3.5 font-sans text-zinc-400">Event trigger type</td>
                        <td className="py-2.5 px-3.5 text-zinc-300">license.generate | license.test</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payloads */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                      Sent by ProducerToy to Your Endpoint
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(webhookPayloadSample, 'wb-payload')}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'wb-payload' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'wb-payload' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="bg-[#0e0e0e] border border-[#242424] p-3.5 rounded-xl font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
                    {webhookPayloadSample}
                  </pre>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                      Returned by Your Endpoint (within 3000ms)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(webhookResponseSample, 'wb-response')}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'wb-response' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'wb-response' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="bg-[#0e0e0e] border border-[#242424] p-3.5 rounded-xl font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
                    {webhookResponseSample}
                  </pre>
                </div>
              </div>
            </div>

            {/* Webhook Implementation Snippets */}
            <div className="toy-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Code className="w-4 h-4 text-zinc-300" />
                    <span>Server Implementation Examples</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Drop this code into your server or website framework
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-[#282828] overflow-x-auto">
                  {(['nextjs', 'nodejs', 'python', 'php', 'curl'] as WebhookLanguageTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveWebhookTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                        activeWebhookTab === tab
                          ? 'bg-[#282828] text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {tab === 'nextjs' && 'Next.js'}
                      {tab === 'nodejs' && 'Express'}
                      {tab === 'python' && 'FastAPI'}
                      {tab === 'php' && 'PHP'}
                      {tab === 'curl' && 'cURL'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono text-[11px] text-zinc-300">
                    {webhookSnippets[activeWebhookTab].filename}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(webhookSnippets[activeWebhookTab].code, `wb-code-${activeWebhookTab}`)}
                    className="btn-secondary px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    {copiedKey === `wb-code-${activeWebhookTab}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copied Code</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Snippet</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="bg-[#0b0b0b] border border-[#262626] p-4 rounded-xl font-mono text-[11px] text-zinc-200 overflow-x-auto leading-relaxed max-h-[460px]">
                  {webhookSnippets[activeWebhookTab].code}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 3: PRE-LOADED CSV POOL ================= */}
        {activeModel === 'csv_pool' && (
          <div className="toy-card p-6 space-y-6">
            <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-zinc-300" />
                  <span>Pre-Loaded Serial Key Pool (Batch CSV / PACE iLok)</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Pre-generate 1,000–50,000 keys and let ProducerToy manage inventory distribution
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-300 bg-[#202020] px-2.5 py-1 rounded border border-[#34363d]">
                Zero Backend Code
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#141414] border border-[#242424] rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>1. Batch Format</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Export your keys from your keygen or iLok as a simple newline-delimited text list or CSV.
                </p>
                <pre className="bg-[#0b0b0b] p-2.5 rounded text-[11px] font-mono text-zinc-300">
                  ILOK-9021-3841-8912{"\n"}ILOK-9021-3841-8913{"\n"}ILOK-9021-3841-8914
                </pre>
              </div>

              <div className="bg-[#141414] border border-[#242424] rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>2. Upload via Toy Creator</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Go to your product edit page, navigate to Step 4 Licensing, and click <strong>Batch Upload</strong>. Duplicate keys are automatically discarded.
                </p>
              </div>

              <div className="bg-[#141414] border border-[#242424] rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>3. Audit & CSV Export</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Track every claimed key in real time. Export the full audit log CSV with buyer details, order IDs, and timestamps whenever you need.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security Standards Callout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="toy-card p-5 space-y-2 border-zinc-700/60 bg-[#161616]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-300" />
              <span>Ed25519 & Timing-Safe Security</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Machine Seat Auth uses cryptographic Ed25519 digital signatures. Workstation hardware hashes are one-way SHA-256 digests, protecting user hardware privacy while preventing unauthorized license sharing.
            </p>
          </div>

          <div className="toy-card p-5 space-y-2 border-zinc-700/60 bg-[#161616]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Laptop className="w-4 h-4 text-zinc-300" />
              <span>Multi-DAW & Multi-Platform Compatibility</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The C++ JUCE SDK is compatible with FL Studio, Ableton Live, Logic Pro, Pro Tools, Cubase, Studio One, and Bitwig on macOS (Intel & Apple Silicon) and Windows 10/11.
            </p>
          </div>
        </div>

        {/* Direct Link to Products */}
        <div className="p-6 bg-[#161616] border border-[#2a2a2a] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Ready to configure licensing for your audio software?</h3>
            <p className="text-xs text-zinc-400">
              Open your product in Toy Creator, go to Step 4 Licensing, and choose <strong>Machine Seat Auth</strong>.
            </p>
          </div>
          <Link
            href="/dashboard/products"
            className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 flex-shrink-0 shadow-sm"
          >
            <span>Open Product Licensing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </RoleGate>
  );
}
