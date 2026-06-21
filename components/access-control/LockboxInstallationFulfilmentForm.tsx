'use client';
import { FormEvent, useState } from 'react';

export function LockboxInstallationFulfilmentForm() {
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const jobId = String(data.jobId || '').trim();
    const response = await fetch(`/api/access-control/jobs/${encodeURIComponent(jobId)}/fulfil`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, photoUrls: [] }) });
    const payload = await response.json();
    setMessage(response.ok ? payload.message : payload.error || 'Unable to save completion.');
  }
  return <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
    <label>Shopify order number<input name="shopifyOrderNumber" required /></label>
    <label>Job ID<input name="jobId" required /></label>
    <label>Installation property<input name="installationProperty" /></label>
    <label>Installed lockbox location<input name="installedLocation" required /></label>
    <label>Lockbox code<input name="lockboxCode" required /></label>
    <label>Completion photos<input name="completionPhotos" type="file" multiple />{/* TODO: wire upload/store images infrastructure. */}</label>
    <label>Completion notes<textarea name="completionNotes" /></label>
    <label>Completed by<input name="completedBy" required /></label>
    <label>Completion date<input name="completedDate" type="date" required /></label>
    {/* TODO: fulfil Shopify order/line item, send completion message, and attach image/report links when Shopify Admin API is implemented. */}
    <button type="submit">Save completion</button>{message ? <p>{message}</p> : null}
  </form>;
}
