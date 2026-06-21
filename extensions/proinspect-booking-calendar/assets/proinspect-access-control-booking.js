(() => {
  const productConfigs = {
    'Lockbox Installation': {
      itemLabel: 'Lockbox Installation',
      confirmLabel: 'Confirm this installation',
      addAnotherLabel: 'Add another Lockbox Installation',
      preferredDateLabel: 'Preferred installation date',
      fields: [
        { name: 'pickupRequired', label: 'Pickup requirement', type: 'select', required: true, options: ['Pickup required', 'No pickup required - lockbox already onsite', 'No pickup required - ProInspect supplies lockbox'] },
        { name: 'pickupAddress', label: 'Pickup address', type: 'text', conditionalRequired: { field: 'pickupRequired', value: 'Pickup required' } },
        { name: 'pickupFromName', label: 'Who should we pick up from?', type: 'text', conditionalRequired: { field: 'pickupRequired', value: 'Pickup required' } },
        { name: 'pickupContactPhone', label: 'Pickup contact phone', type: 'tel' },
        { name: 'pickupNotes', label: 'Pickup notes', type: 'textarea' },
        { name: 'installationAddress', label: 'Installation property address', type: 'text', required: true },
        { name: 'installationLocationOnProperty', label: 'Location on property', type: 'text', required: true, helper: 'Front door, side gate, meter box area, garage wall, rear entry, or installer discretion.' },
        { name: 'occupancyStatus', label: 'Occupancy status', type: 'select', required: true, options: ['', 'Vacant', 'Tenanted', 'Owner occupied', 'Unknown'] },
        { name: 'accessNotes', label: 'Access notes', type: 'textarea', helper: 'Gate codes, alarm details, parking, pets, tenant contact or access limitations.' }
      ],
      summary: ['pickupRequired', 'pickupAddress', 'installationAddress', 'installationLocationOnProperty', 'preferredDate'],
      cart: ['pickupRequired', 'pickupAddress', 'pickupFromName', 'installationAddress', 'installationLocationOnProperty', 'preferredDate']
    },
    'Lockbox Removal / Relocation': {
      itemLabel: 'Lockbox Removal / Relocation',
      confirmLabel: 'Confirm this removal/relocation',
      addAnotherLabel: 'Add another Removal / Relocation',
      preferredDateLabel: 'Preferred date',
      fields: [
        { name: 'actionType', label: 'What do you need done?', type: 'select', required: true, options: ['Removal only', 'Relocation at same property', 'Relocation to another property'] },
        { name: 'currentPropertyAddress', label: 'Existing property address', type: 'text', required: true },
        { name: 'currentLockboxLocation', label: 'Current lockbox location', type: 'text', required: true },
        { name: 'lockboxCode', label: 'Lockbox code, if known', type: 'text' },
        { name: 'returnOrDisposalInstruction', label: 'Return/disposal instruction', type: 'select', options: ['', 'Return to agency', 'Leave onsite', 'Hold for collection', 'Dispose', 'Other'] },
        { name: 'newLocationOnProperty', label: 'New location on same property', type: 'text', helper: 'Required when relocating at the same property.' },
        { name: 'destinationPropertyAddress', label: 'Destination property address', type: 'text', helper: 'Required when relocating to another property.' },
        { name: 'destinationLocationOnProperty', label: 'Destination lockbox location', type: 'text', helper: 'Required when relocating to another property.' },
        { name: 'accessNotes', label: 'Access instructions', type: 'textarea', required: true }
      ],
      summary: ['actionType', 'currentPropertyAddress', 'currentLockboxLocation', 'destinationPropertyAddress', 'preferredDate'],
      cart: ['actionType', 'currentPropertyAddress', 'currentLockboxLocation', 'destinationPropertyAddress', 'preferredDate']
    },
    'Key Collection & Return Service': {
      itemLabel: 'Key Collection / Return',
      confirmLabel: 'Confirm this key movement',
      addAnotherLabel: 'Add another key movement',
      preferredDateLabel: 'Preferred date',
      fields: [
        { name: 'movementType', label: 'Key movement type', type: 'select', required: true, options: ['Collect keys', 'Return keys', 'Collect and return keys', 'Move keys from one location to another'] },
        { name: 'propertyAddress', label: 'Property linked to keys', type: 'text', required: true },
        { name: 'keySetDescription', label: 'Key set description', type: 'textarea', required: true },
        { name: 'collectionAddress', label: 'Collection address', type: 'text' },
        { name: 'collectionContactName', label: 'Collection contact name', type: 'text' },
        { name: 'collectionContactPhone', label: 'Collection contact phone', type: 'tel' },
        { name: 'collectionInstructions', label: 'Collection instructions', type: 'textarea' },
        { name: 'returnAddress', label: 'Return/drop-off address', type: 'text' },
        { name: 'returnContactName', label: 'Return contact name', type: 'text' },
        { name: 'returnContactPhone', label: 'Return contact phone', type: 'tel' },
        { name: 'returnInstructions', label: 'Return/drop-off instructions', type: 'textarea' },
        { name: 'authorisedBy', label: 'Authorised by', type: 'text', required: true }
      ],
      summary: ['movementType', 'propertyAddress', 'collectionAddress', 'returnAddress', 'preferredDate'],
      cart: ['movementType', 'propertyAddress', 'collectionAddress', 'returnAddress', 'preferredDate']
    },
    'Key Cutting & Tagging': {
      itemLabel: 'Key Cutting & Tagging',
      confirmLabel: 'Confirm this key cutting job',
      addAnotherLabel: 'Add another key cutting job',
      preferredDateLabel: 'Preferred completion date',
      fields: [
        { name: 'keyReceiptMethod', label: 'How will ProInspect receive the keys?', type: 'select', required: true, options: ['Client will drop keys off', 'ProInspect to collect keys', 'Keys already held by ProInspect'] },
        { name: 'propertyAddress', label: 'Property address', type: 'text', required: true },
        { name: 'keyType', label: 'Key type', type: 'text', required: true },
        { name: 'numberOfCopies', label: 'Number of copies', type: 'number', required: true },
        { name: 'taggingInstructions', label: 'Tagging instructions', type: 'textarea', required: true },
        { name: 'collectionAddress', label: 'Collection address, if ProInspect collects', type: 'text' },
        { name: 'returnOrStorageInstructions', label: 'Return/storage instructions', type: 'textarea', required: true }
      ],
      summary: ['keyReceiptMethod', 'propertyAddress', 'numberOfCopies', 'preferredDate'],
      cart: ['keyReceiptMethod', 'propertyAddress', 'numberOfCopies', 'preferredDate']
    },
    'Off-Site Key Storage': {
      itemLabel: 'Off-Site Key Storage',
      confirmLabel: 'Confirm this storage job',
      addAnotherLabel: 'Add another key storage job',
      preferredDateLabel: 'Preferred date / due date',
      fields: [
        { name: 'storageAction', label: 'Storage action', type: 'select', required: true, options: ['Store new key set', 'Update stored key set', 'Retrieve stored key set', 'End storage and return keys'] },
        { name: 'propertyAddress', label: 'Property address', type: 'text', required: true },
        { name: 'keyInventory', label: 'Key inventory', type: 'textarea', required: true },
        { name: 'handoverOrCollectionLocation', label: 'Handover or collection location', type: 'text', required: true },
        { name: 'authorisedContacts', label: 'Authorised contacts', type: 'textarea', required: true },
        { name: 'storageInstructions', label: 'Storage instructions', type: 'textarea' }
      ],
      summary: ['storageAction', 'propertyAddress', 'handoverOrCollectionLocation', 'preferredDate'],
      cart: ['storageAction', 'propertyAddress', 'handoverOrCollectionLocation', 'preferredDate']
    },
    'Property Access Setup Service': {
      itemLabel: 'Property Access Setup',
      confirmLabel: 'Confirm this access setup',
      addAnotherLabel: 'Add another property setup',
      preferredDateLabel: 'Preferred date',
      fields: [
        { name: 'propertyAddress', label: 'Property address', type: 'text', required: true },
        { name: 'setupTasks', label: 'Required setup tasks', type: 'checkboxes', required: true, options: ['Check keys work', 'Set up access notes', 'Place/check lockbox', 'Confirm gate/alarm/parking details', 'Prepare property for inspection/trade access', 'Other'] },
        { name: 'currentAccessDetails', label: 'Current access details', type: 'textarea', required: true },
        { name: 'occupancyStatus', label: 'Occupancy status', type: 'select', required: true, options: ['', 'Vacant', 'Tenanted', 'Owner occupied', 'Unknown'] },
        { name: 'accessNotes', label: 'Additional access notes', type: 'textarea' }
      ],
      summary: ['propertyAddress', 'setupTasks', 'occupancyStatus', 'preferredDate'],
      cart: ['propertyAddress', 'setupTasks', 'preferredDate']
    },
    'Key Audit & Register Update': {
      itemLabel: 'Key Audit / Register Update',
      confirmLabel: 'Confirm this audit job',
      addAnotherLabel: 'Add another audit job',
      preferredDateLabel: 'Preferred completion date',
      fields: [
        { name: 'auditScope', label: 'Audit scope', type: 'select', required: true, options: ['Single property', 'Multiple properties', 'Key cabinet / agency office', 'Rent roll takeover', 'Existing key register cleanup'] },
        { name: 'propertyOrPortfolioDetails', label: 'Property/list details', type: 'textarea', required: true },
        { name: 'currentRegisterLink', label: 'Current key register link, if available', type: 'url' },
        { name: 'outputRequired', label: 'Output required', type: 'textarea', required: true }
      ],
      summary: ['auditScope', 'propertyOrPortfolioDetails', 'preferredDate'],
      cart: ['auditScope', 'preferredDate']
    }
  };

  document.querySelectorAll('[data-proinspect-access-control] .proinspect-access-control__app').forEach(init);

  function init(app) {
    const root = app.querySelector('[data-access-control-root]');
    const config = {
      apiBase: (app.dataset.apiBase || '').replace(/\/$/, ''),
      productType: app.dataset.productType || 'Lockbox Installation',
      variantId: app.dataset.variantId || '',
      checkoutMode: app.dataset.checkoutMode || 'Add to cart and go to checkout',
      client: readClient(app)
    };
    const accessControlJobs = [];
    window.proinspectAccessControlJobs = accessControlJobs;
    renderForm(root, config, accessControlJobs);
  }

  function readClient(app) {
    const val = (name) => app.querySelector(`[name="${name}"]`)?.value || '';
    return {
      shopifyCustomerId: val('shopify_customer_id'),
      shopifyCompanyId: val('shopify_company_id'),
      shopifyCompanyLocationId: val('shopify_company_location_id'),
      clientName: val('shopify_company_name') || val('customer_name'),
      customerName: val('customer_name'),
      customerEmail: val('customer_email'),
      customerPhone: val('customer_phone')
    };
  }

  function renderForm(root, config, jobs) {
    const product = productConfigs[config.productType] || productConfigs['Lockbox Installation'];
    const phoneRequired = !config.client.customerPhone;
    root.innerHTML = `<form class="proinspect-access-control__form" novalidate>
      <div class="proinspect-access-control__step">
        <h3>1. Client summary</h3>
        <p><strong>${escapeHtml(config.client.clientName || config.client.customerName)}</strong><br>${escapeHtml(config.client.customerName)}<br>${escapeHtml(config.client.customerEmail)}</p>
        <label>Pickup/location option<select name="pickupLocationOption"><option>Enter new pickup location</option><option>Use my account/default location</option></select></label>
        ${phoneRequired ? renderField({ name: 'customerPhone', label: 'Contact phone', type: 'tel', required: true }) : ''}
      </div>
      <div class="proinspect-access-control__step"><h3>2. ${escapeHtml(product.itemLabel)} details</h3>${product.fields.map(renderField).join('')}</div>
      <div class="proinspect-access-control__step"><h3>3. Preferred date</h3>${renderField({ name: 'preferredDate', label: product.preferredDateLabel, type: 'date', required: true })}</div>
      <div class="proinspect-access-control__actions"><button type="button" class="proinspect-access-control__button proinspect-access-control__button--secondary" data-preview>Review details</button></div>
      <div class="proinspect-access-control__summary" data-summary hidden></div>
      <div class="proinspect-access-control__job-list" data-job-list>${jobList(jobs)}</div>
      <div class="proinspect-access-control__status" data-status hidden></div>
    </form>`;

    const form = root.querySelector('form');
    form.querySelector('[data-preview]').addEventListener('click', () => preview(form, config, jobs));
    form.addEventListener('change', () => syncConditionalRequirements(form, product));
    syncConditionalRequirements(form, product);
  }

  function renderField(field) {
    const required = field.required ? 'required' : '';
    const helper = field.helper ? `<span>${escapeHtml(field.helper)}</span>` : '';
    if (field.type === 'textarea') return `<label>${escapeHtml(field.label)}${helper}<textarea name="${field.name}" ${required}></textarea></label>`;
    if (field.type === 'select') return `<label>${escapeHtml(field.label)}${helper}<select name="${field.name}" ${required}>${(field.options || []).map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option || 'Select')}</option>`).join('')}</select></label>`;
    if (field.type === 'checkboxes') return `<fieldset class="proinspect-access-control__fieldset" data-checkbox-group="${field.name}"><legend>${escapeHtml(field.label)}</legend>${(field.options || []).map((option) => `<label><input type="checkbox" name="${field.name}" value="${escapeHtml(option)}"> ${escapeHtml(option)}</label>`).join('')}</fieldset>`;
    return `<label>${escapeHtml(field.label)}${helper}<input name="${field.name}" type="${field.type || 'text'}" ${required}></label>`;
  }

  function syncConditionalRequirements(form, product) {
    product.fields.filter((field) => field.conditionalRequired).forEach((field) => {
      const input = form.elements[field.name];
      const trigger = form.elements[field.conditionalRequired.field];
      if (input && trigger) input.required = trigger.value === field.conditionalRequired.value;
    });
  }

  function collect(form, config) {
    const product = productConfigs[config.productType] || productConfigs['Lockbox Installation'];
    const formData = new FormData(form);
    const data = {
      serviceType: config.productType,
      ...config.client,
      customerPhone: String(formData.get('customerPhone') || config.client.customerPhone || ''),
      preferredDate: String(formData.get('preferredDate') || '')
    };

    product.fields.forEach((field) => {
      if (field.type === 'checkboxes') data[field.name] = formData.getAll(field.name).map(String);
      else data[field.name] = String(formData.get(field.name) || '');
    });

    return data;
  }

  function validateProduct(form, config) {
    const product = productConfigs[config.productType] || productConfigs['Lockbox Installation'];
    const data = collect(form, config);
    const checkboxField = product.fields.find((field) => field.type === 'checkboxes' && field.required);
    if (checkboxField && !data[checkboxField.name].length) {
      alert(`Select at least one option for ${checkboxField.label}.`);
      return false;
    }
    return form.reportValidity();
  }

  function preview(form, config, jobs) {
    if (!validateProduct(form, config)) return;
    const product = productConfigs[config.productType] || productConfigs['Lockbox Installation'];
    const job = collect(form, config);
    const summary = form.querySelector('[data-summary]');
    summary.hidden = false;
    summary.innerHTML = `<h3>Confirm details</h3>${summaryList(job, product.summary)}<div class="proinspect-access-control__actions"><button type="button" data-back class="proinspect-access-control__button proinspect-access-control__button--secondary">Back</button><button type="button" data-confirm class="proinspect-access-control__button proinspect-access-control__button--primary">${escapeHtml(product.confirmLabel)}</button></div>`;
    summary.querySelector('[data-back]').addEventListener('click', () => { summary.hidden = true; });
    summary.querySelector('[data-confirm]').addEventListener('click', () => {
      jobs.push(job);
      renderAdded(form.closest('[data-access-control-root]'), config, jobs);
    });
  }

  function summaryList(job, fields) {
    return `<dl><dt>Client</dt><dd>${escapeHtml(job.clientName || job.customerName)} / ${escapeHtml(job.customerEmail)}</dd>${fields.map((field) => `<dt>${escapeHtml(labelFor(field))}</dt><dd>${escapeHtml(displayValue(job[field]))}</dd>`).join('')}</dl>`;
  }

  function renderAdded(root, config, jobs) {
    const product = productConfigs[config.productType] || productConfigs['Lockbox Installation'];
    root.innerHTML = `<div class="proinspect-access-control__panel proinspect-access-control__success"><h3>${escapeHtml(product.itemLabel)} added</h3>${jobList(jobs)}<div class="proinspect-access-control__actions"><button data-add-another class="proinspect-access-control__button proinspect-access-control__button--secondary">${escapeHtml(product.addAnotherLabel)}</button><button data-checkout class="proinspect-access-control__button proinspect-access-control__button--primary">Continue to checkout</button></div><div data-status class="proinspect-access-control__status" hidden></div></div>`;
    root.querySelector('[data-add-another]').addEventListener('click', () => renderForm(root, config, jobs));
    root.querySelector('[data-checkout]').addEventListener('click', () => checkout(root, config, jobs));
  }

  function jobList(jobs) {
    return jobs.length ? `<h3>Job list</h3><ol>${jobs.map((job) => `<li>${escapeHtml(job.serviceType)} — ${escapeHtml(primaryLabel(job))} — ${escapeHtml(job.preferredDate)}</li>`).join('')}</ol>` : '';
  }

  function primaryLabel(job) {
    return job.installationAddress || job.currentPropertyAddress || job.destinationPropertyAddress || job.propertyAddress || job.propertyOrPortfolioDetails || job.clientName || 'Access Control job';
  }

  async function checkout(root, config, jobs) {
    const status = root.querySelector('[data-status]') || root;
    try {
      if (!jobs.length) throw new Error('Add at least one job.');
      if (config.checkoutMode !== 'Create job only' && !config.variantId) throw new Error('Shopify variant ID is required.');
      status.hidden = false;
      status.textContent = 'Creating job drafts...';
      const response = await fetch(`${config.apiBase}/api/access-control/jobs/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs })
      });
      if (!response.ok) throw new Error(await response.text());
      const payload = await response.json();
      if (config.checkoutMode === 'Create job only') {
        status.textContent = `Jobs created: ${payload.jobs.map((job) => job.id).join(', ')}`;
        return;
      }

      for (let index = 0; index < payload.jobs.length; index += 1) {
        const saved = payload.jobs[index];
        const job = jobs[index];
        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{
              id: Number(config.variantId),
              quantity: 1,
              properties: cartProperties(saved.id, job)
            }]
          })
        });
      }
      window.location.href = '/checkout';
    } catch (error) {
      status.hidden = false;
      status.textContent = error instanceof Error ? error.message : 'Unable to continue to checkout.';
      status.classList.add('proinspect-access-control__status--error');
    }
  }

  function cartProperties(jobId, job) {
    const product = productConfigs[job.serviceType] || productConfigs['Lockbox Installation'];
    const properties = {
      Service: job.serviceType,
      'Job ID': jobId,
      '_proinspect_job_id': jobId,
      '_service_type': job.serviceType,
      '_shopify_customer_id': job.shopifyCustomerId,
      '_shopify_company_id': job.shopifyCompanyId,
      '_shopify_company_location_id': job.shopifyCompanyLocationId
    };
    product.cart.forEach((field) => {
      properties[labelFor(field)] = displayValue(job[field]);
    });
    return properties;
  }

  function labelFor(field) {
    return String(field).replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
  }

  function displayValue(value) {
    return Array.isArray(value) ? value.join(', ') : String(value || '');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }
})();
