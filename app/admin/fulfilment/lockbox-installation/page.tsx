import { LockboxInstallationFulfilmentForm } from '../../../../components/access-control/LockboxInstallationFulfilmentForm';

export default function LockboxInstallationFulfilmentPage() {
  return <main style={{ padding: 24 }}>
    <h1>Lockbox Installation Fulfilment</h1>
    <p>Capture completion details for Access Control jobs. Shopify fulfilment, messaging, report links and file upload are intentionally TODO until the Admin API integration is wired.</p>
    <LockboxInstallationFulfilmentForm />
  </main>;
}
