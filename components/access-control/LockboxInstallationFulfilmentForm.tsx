'use client';

import { FormEvent, useState } from 'react';

type AccessControlJobRow = {
  id: string;
  service_type: string;
  status: string;
  shopify_order_name?: string;
  primary_address?: string;
  customer_email?: string;
  client_name?: string;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function LockboxInstallationFulfilmentForm() {
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState<AccessControlJobRow[]>([]);
  const [selectedJob, setSelectedJob] = useState<AccessControlJobRow | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function searchJobs() {
    setIsSearching(true);
    setMessage('');
    try {
      const response = await fetch(`/api/access-control/jobs/search?q=${encodeURIComponent(query)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to search Access Control jobs.');
      setJobs(payload.jobs || []);
      if (!payload.jobs?.length) setMessage('No Access Control jobs found for that search.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to search jobs.');
    } finally {
      setIsSearching(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const jobId = String(data.jobId || '').trim();
    const files = Array.from((form.elements.namedItem('completionPhotos') as HTMLInputElement | null)?.files || []);

    setIsSubmitting(true);
    setMessage('Saving completion...');

    try {
      const photoUrls = await Promise.all(files.map(fileToDataUrl));
      const response = await fetch(`/api/access-control/jobs/${encodeURIComponent(jobId)}/fulfil`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, photoUrls })
      });
      const payload = await response.json();
      setMessage(response.ok ? payload.message : payload.error || 'Unable to save completion.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to upload photos or save completion.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div style={{ display: 'grid', gap: 16, maxWidth: 820 }}>
    <section style={{ display: 'grid', gap: 8 }}>
      <label>Search by Shopify order number, job ID, client, email or property
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="#1042, ACJ-..., property address, client name" />
      </label>
      <button type="button" onClick={searchJobs} disabled={isSearching}>{isSearching ? 'Searching...' : 'Search jobs'}</button>
      {jobs.length ? <label>Select job
        <select onChange={(event) => setSelectedJob(jobs.find((job) => job.id === event.target.value) || null)} defaultValue="">
          <option value="">Select a job</option>
          {jobs.map((job) => <option key={job.id} value={job.id}>{job.shopify_order_name || 'No order'} - {job.id} - {job.primary_address || job.customer_email}</option>)}
        </select>
      </label> : null}
    </section>

    <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
      <label>Shopify order number<input name="shopifyOrderNumber" required defaultValue={selectedJob?.shopify_order_name || query} /></label>
      <label>Job ID<input name="jobId" required value={selectedJob?.id || ''} onChange={() => undefined} placeholder="Search and select a job above" /></label>
      <label>Installation property<input name="installationProperty" defaultValue={selectedJob?.primary_address || ''} /></label>
      <label>Installed lockbox location<input name="installedLocation" required /></label>
      <label>Lockbox code<input name="lockboxCode" required /></label>
      <label>Completion photos<input name="completionPhotos" type="file" accept="image/*" multiple /></label>
      <p style={{ margin: 0, color: '#667085' }}>Photos are currently submitted as encoded upload data and recorded against the job. Move this to object storage before heavy production use, because databases are not photo albums no matter how bravely they pretend.</p>
      <label>Completion notes<textarea name="completionNotes" /></label>
      <label>Completed by<input name="completedBy" required /></label>
      <label>Completion date<input name="completedDate" type="date" required /></label>
      <button type="submit" disabled={isSubmitting || !selectedJob}>{isSubmitting ? 'Saving...' : 'Save completion'}</button>
      {message ? <p>{message}</p> : null}
    </form>
  </div>;
}
