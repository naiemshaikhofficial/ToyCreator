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
} from 'lucide-react';
import { RoleGate } from '@/components/RoleGate';

type LanguageTab = 'nextjs' | 'nodejs' | 'python' | 'php' | 'curl';

export default function DeveloperGuidePage() {
  const [activeTab, setActiveTab] = useState<LanguageTab>('nextjs');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const payloadSample = `{
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

  const responseSample = `{
  "status": "success",
  "serial_key": "BRAND-XK89-9901-PROD",
  "seats": 3,
  "instructions": "Paste this key into the plugin authorization dialog."
}`;

  const codeSnippets: Record<LanguageTab, { filename: string; code: string }> = {
    nextjs: {
      filename: 'app/api/licenses/issue/route.ts',
      code: `import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Your shared secret configured in Toy Creator
const PRODUCERTOY_WEBHOOK_SECRET = process.env.PRODUCERTOY_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-producertoy-signature');
    const timestamp = req.headers.get('x-producertoy-timestamp');

    // 1. Verify HMAC-SHA256 signature (Timing-Safe)
    if (PRODUCERTOY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', PRODUCERTOY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const isValid =
        signature &&
        signature.length === expectedSignature.length &&
        crypto.timingSafeEqual(
          Buffer.from(signature, 'utf-8'),
          Buffer.from(expectedSignature, 'utf-8')
        );

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // 2. Generate or retrieve license key from your existing licensing engine
    // (This is the exact same internal function you use for your own website checkouts!)
    const serialKey = await generateBrandSerialKey({
      sku: payload.product_sku,
      orderRef: payload.order_id,
      customerRef: payload.customer_reference,
    });

    // 3. Respond with JSON within 3000ms SLA
    return NextResponse.json({
      status: 'success',
      serial_key: serialKey,
      seats: 3,
      instructions: 'Enter key in plugin authorization settings window.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function generateBrandSerialKey({ sku, orderRef }: { sku: string; orderRef: string }) {
  // Your in-house key generation algorithm or database lookup
  const part = crypto.randomBytes(4).toString('hex').toUpperCase();
  return \`\${sku || 'VST'}-\${part}-ACTIVE\`;
}`,
    },
    nodejs: {
      filename: 'server.js (Express)',
      code: `const express = require('express');
const crypto = require('crypto');
const app = express();

// Use express.raw or express.json with verify to capture raw buffer for HMAC
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

const WEBHOOK_SECRET = process.env.PRODUCERTOY_WEBHOOK_SECRET || 'pt_sec_live_...';

app.post('/api/v1/licenses/issue', async (req, res) => {
  try {
    const signature = req.headers['x-producertoy-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    // 1. Verify HMAC Signature
    if (WEBHOOK_SECRET) {
      const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
      const isMatch = signature && signature.length === hmac.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac));

      if (!isMatch) {
        return res.status(401).json({ error: 'Signature verification failed' });
      }
    }

    const { order_id, product_sku, customer_reference } = req.body;

    // 2. Call your existing in-house license generation logic
    const serial = \`BRAND-\${crypto.randomBytes(3).toString('hex').toUpperCase()}-\${crypto.randomBytes(3).toString('hex').toUpperCase()}\`;

    // 3. Return license JSON
    return res.status(200).json({
      status: 'success',
      serial_key: serial,
      seats: 3
    });
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
from pydantic import BaseModel

app = FastAPI()
WEBHOOK_SECRET = os.getenv("PRODUCERTOY_WEBHOOK_SECRET", "pt_sec_live_...")

@app.post("/api/v1/licenses/issue")
async def issue_license(request: Request):
    body_bytes = await request.body()
    signature = request.headers.get("x-producertoy-signature")

    # 1. Verify HMAC-SHA256 signature
    if WEBHOOK_SECRET:
        expected_sig = hmac.new(
            WEBHOOK_SECRET.encode("utf-8"),
            body_bytes,
            hashlib.sha256
        ).hexdigest()

        if not signature or not hmac.compare_digest(signature, expected_sig):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid HMAC signature"
            )

    payload = await request.json()
    sku = payload.get("product_sku", "PLUGIN")
    order_id = payload.get("order_id", "REF")

    # 2. Generate license key using your brand's existing logic
    generated_key = f"{sku}-PROD-{hashlib.sha256(order_id.encode()).hexdigest()[:12].upper()}"

    # 3. Return JSON response
    return {
        "status": "success",
        "serial_key": generated_key,
        "seats": 3,
        "instructions": "Enter this key in plugin activation settings."
    }`,
    },
    php: {
      filename: 'license-webhook.php (PHP / WordPress / Custom)',
      code: `<?php
// ProducerToy Live License Generation Webhook Endpoint (PHP)
header('Content-Type: application/json');

$webhook_secret = getenv('PRODUCERTOY_WEBHOOK_SECRET') ?: 'pt_sec_live_...';
$raw_input = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_PRODUCERTOY_SIGNATURE'] ?? '';

// 1. Verify HMAC-SHA256 signature
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
$order_id = $payload['order_id'] ?? 'REF';

// 2. Generate serial key (same function used on your WooCommerce or website)
$random_part = strtoupper(bin2hex(random_bytes(4)));
$serial_key = "{$sku}-{$random_part}-ACTIVE";

// 3. Output 200 OK JSON
echo json_encode([
    'status' => 'success',
    'serial_key' => $serial_key,
    'seats' => 3,
    'instructions' => 'Paste this key inside the plugin settings screen.'
]);
?>`,
    },
    curl: {
      filename: 'Test via Terminal (cURL)',
      code: `# Test your local or staging licensing endpoint directly:
curl -X POST https://api.yourbrand.com/v1/licenses/issue \\
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
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 bg-[#202020] px-2.5 py-0.5 rounded border border-[#34363d]">
                Plugin Boutique & Splice Standard
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                Live Webhooks v1.0
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Developer API & Website Integration</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Connect your brand’s website or in-house licensing server to ProducerToy. Issue authentic, dynamic license keys in real-time when buyers complete checkout.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <Link
              href="/dashboard/products"
              className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <span>Manage My Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Overview Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="toy-card p-5 space-y-3 border-emerald-500/20 bg-gradient-to-br from-[#181818] to-[#121212]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Model B: Live Webhook API (Dynamic)</span>
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Recommended
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              If your brand already generates serial keys via your own database or cloud keygen, ProducerToy sends an authenticated HTTPS POST to your endpoint on checkout. You return a fresh serial key in real-time.
            </p>
            <ul className="text-[11px] text-zinc-400 space-y-1.5 list-disc list-inside">
              <li>Use the exact same licensing API for your own website checkouts.</li>
              <li>Keys are cryptographically tied to user accounts or hardware IDs.</li>
              <li>Automated fallback to pre-loaded CSV pool if your server times out.</li>
            </ul>
          </div>

          <div className="toy-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-zinc-300" />
                <span>Model A: Pre-Loaded CSV Pool (Zero-Code)</span>
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#202020] text-zinc-400 border border-[#2e2e2e]">
                No Coding Needed
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              If you prefer not to build an API, you can simply upload a batch of 1,000–50,000 pre-generated serial keys via CSV in your product dashboard. ProducerToy claims one key atomically per order.
            </p>
            <ul className="text-[11px] text-zinc-400 space-y-1.5 list-disc list-inside">
              <li>Ideal for PACE iLok batches and offline keygens.</li>
              <li>Automatic low-inventory alerts when pool drops below threshold.</li>
              <li>Ready in 2 minutes without writing a single line of backend code.</li>
            </ul>
          </div>
        </div>

        {/* 4-Step Walkthrough */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-300" />
            <span>4 Steps to Connect Your Website or Server</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 space-y-2">
              <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-mono text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-bold text-white">Create Endpoint</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Create an HTTPS route on your website or backend (e.g., <code className="text-zinc-300 font-mono">/api/licenses/issue</code>).
              </p>
            </div>

            <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 space-y-2">
              <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-mono text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-bold text-white">Verify HMAC</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Check header <code className="text-zinc-300 font-mono">X-ProducerToy-Signature</code> with your shared secret to ensure authenticity.
              </p>
            </div>

            <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 space-y-2">
              <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-mono text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-xs font-bold text-white">Return Serial</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Respond within 3,000ms with JSON containing <code className="text-zinc-300 font-mono">serial_key</code> and optional seat limits.
              </p>
            </div>

            <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 space-y-2">
              <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-mono text-xs font-bold flex items-center justify-center">
                4
              </span>
              <h3 className="text-xs font-bold text-white">Ping & Launch</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Enter your URL in Toy Creator Product Edit, click <strong>Send Diagnostic Test Ping</strong>, and save!
              </p>
            </div>
          </div>
        </div>

        {/* HTTP Specification Contract */}
        <div className="toy-card p-6 space-y-6">
          <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-zinc-300" />
                <span>HTTP Webhook Contract Specification</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Outbound request structure dispatched by ProducerToy upon verified purchase
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
                  <tr>
                    <td className="py-2.5 px-3.5 text-zinc-300">X-ProducerToy-Timestamp</td>
                    <td className="py-2.5 px-3.5 font-sans text-zinc-400">Unix epoch timestamp (Replay Attack defense)</td>
                    <td className="py-2.5 px-3.5 text-zinc-300">1740000000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payloads Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Inbound Payload (Sent to Your Server)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(payloadSample, 'payload')}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copiedKey === 'payload' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'payload' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="bg-[#0e0e0e] border border-[#242424] p-3.5 rounded-xl font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
                {payloadSample}
              </pre>
              <p className="text-[10px] text-zinc-500">
                🔒 Privacy Rule: <code className="text-zinc-400 font-mono">customer_email</code> is only included if buyer explicitly granted seller data-sharing consent. Otherwise, use <code className="text-zinc-400 font-mono">customer_reference</code>.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Expected Outbound Response (Returned by You)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(responseSample, 'response')}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copiedKey === 'response' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'response' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="bg-[#0e0e0e] border border-[#242424] p-3.5 rounded-xl font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
                {responseSample}
              </pre>
              <p className="text-[10px] text-zinc-500">
                ⚡ Response SLA: Respond with HTTP 200 OK within <strong>3,000ms</strong> to guarantee zero cart abandonment.
              </p>
            </div>
          </div>
        </div>

        {/* Ready-to-Copy Production Code Snippets */}
        <div className="toy-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-zinc-300" />
                <span>Production Server Implementation Examples</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Drop this code into your server or website framework
              </p>
            </div>

            {/* Language Tab Selector */}
            <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-[#282828] overflow-x-auto">
              {(['nextjs', 'nodejs', 'python', 'php', 'curl'] as LanguageTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-[#282828] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab === 'nextjs' && 'Next.js (App Router)'}
                  {tab === 'nodejs' && 'Node.js (Express)'}
                  {tab === 'python' && 'Python (FastAPI)'}
                  {tab === 'php' && 'PHP / WooCommerce'}
                  {tab === 'curl' && 'cURL Terminal'}
                </button>
              ))}
            </div>
          </div>

          {/* Active Snippet Code Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono text-[11px] text-zinc-300">
                {codeSnippets[activeTab].filename}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(codeSnippets[activeTab].code, `code-${activeTab}`)}
                className="btn-secondary px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
              >
                {copiedKey === `code-${activeTab}` ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
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
              {codeSnippets[activeTab].code}
            </pre>
          </div>
        </div>

        {/* Security & Emergency Fallback Callout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="toy-card p-5 space-y-2 border-zinc-700/60 bg-[#161616]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-300" />
              <span>Timing-Safe HMAC Defense</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Always use <code className="text-zinc-300 font-mono">crypto.timingSafeEqual</code> (Node.js) or <code className="text-zinc-300 font-mono">hmac.compare_digest</code> (Python) when verifying webhook signatures. This protects against timing attacks trying to guess your secret key.
            </p>
          </div>

          <div className="toy-card p-5 space-y-2 border-zinc-700/60 bg-[#161616]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-zinc-300" />
              <span>Zero-Blocker Fallback Resilience</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We know server maintenance happens. If your hosting service is temporarily down, ProducerToy can automatically fall back to an emergency pre-loaded CSV batch pool so buyers never experience checkout errors.
            </p>
          </div>
        </div>

        {/* Direct Link to Products */}
        <div className="p-6 bg-[#161616] border border-[#2a2a2a] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Ready to connect your first audio plugin?</h3>
            <p className="text-xs text-zinc-400">
              Go to your products catalog, open any product, switch to Step 4 Licensing, and click the <strong>Developer Webhook / API</strong> tab.
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
