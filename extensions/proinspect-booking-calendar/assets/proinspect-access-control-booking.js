(() => {
  const productModes = {
    'Lockbox Installation': { implemented: true },
    // TODO: Lockbox Removal / Relocation: login, removal/relocation type, existing details, destination, preferred date, confirm, add another, checkout.
    'Lockbox Removal / Relocation': { implemented: false },
    // TODO: Key Collection & Return Service: movement type, pickup, drop-off/return, key/property details, preferred date, confirm, add another, checkout.
    'Key Collection & Return Service': { implemented: false },
    // TODO: Key Cutting & Tagging: key receipt method, property/key details, copies/tagging, return/storage, due date, confirm, add another, checkout.
    'Key Cutting & Tagging': { implemented: false },
    // TODO: Off-Site Key Storage: storage action, property/key details, handover/collection, authorised contacts, due date, add another, checkout.
    'Off-Site Key Storage': { implemented: false },
    // TODO: Property Access Setup Service: property, setup tasks, current access details, preferred date, confirm, add another, checkout.
    'Property Access Setup Service': { implemented: false },
    // TODO: Key Audit & Register Update: audit scope, current register upload/link, property list, completion date, confirm, checkout.
    'Key Audit & Register Update': { implemented: false }
  };

  document.querySelectorAll('[data-proinspect-access-control] .proinspect-access-control__app').forEach(init);

  function init(app) {
    const root = app.querySelector('[data-access-control-root]');
    const config = {
      apiBase: app.dataset.apiBase?.replace(/\/$/, '') || '',
      productType: app.dataset.productType || 'Lockbox Installation',
      variantId: app.dataset.variantId || '',
      checkoutMode: app.dataset.checkoutMode || 'Add to cart and go to checkout',
      client: readClient(app)
    };
    const accessControlJobs = [];
    window.proinspectAccessControlJobs = accessControlJobs;
    if (!productModes[config.productType]?.implemented) return renderComingSoon(root, config.productType);
    renderForm(root, config, accessControlJobs);
  }

  function readClient(app) {
    const val = (name) => app.querySelector(`[name="${name}"]`)?.value || '';
    return {
      shopify_customer_id: val('shopify_customer_id'), shopify_company_id: val('shopify_company_id'), shopify_company_location_id: val('shopify_company_location_id'),
      client_name: val('shopify_company_name') || val('customer_name'), customer_name: val('customer_name'), customer_email: val('customer_email'), customer_phone: val('customer_phone')
    };
  }

  function renderComingSoon(root, product) {
    root.innerHTML = `<div class="proinspect-access-control__panel"><h3>${escapeHtml(product)}</h3><p>This Access Control booking workflow is being configured. Please contact ProInspect to complete this booking.</p></div>`;
  }

  function renderForm(root, config, jobs, values = {}) {
    const phoneRequired = !config.client.customer_phone;
    root.innerHTML = `<form class="proinspect-access-control__form" novalidate>
      <div class="proinspect-access-control__step"><h3>1. Client summary</h3>
        <label>Pickup location option<select name="pickup_location_option"><option>Enter new pickup location</option><option>Use my account/default location</option></select></label>
        ${phoneRequired ? field('customer_phone','Contact phone','tel',true,values.customer_phone || '') : ''}
      </div>
      <div class="proinspect-access-control__step"><h3>2. Pickup requirement and location</h3>
        <label>Pickup requirement<select name="pickup_required" required><option>Pickup required</option><option>No pickup required - lockbox already onsite</option><option>No pickup required - ProInspect supplies lockbox</option></select></label>
        ${field('pickup_address','Pickup address','text',false,values.pickup_address || '')}
        ${field('pickup_from_name','Who should we pick up from?','text',false,values.pickup_from_name || '')}
        ${field('pickup_contact_phone','Pickup contact phone','tel',false,values.pickup_contact_phone || '')}
        <label>Pickup notes<textarea name="pickup_notes">${escapeHtml(values.pickup_notes || '')}</textarea></label>
      </div>
      <div class="proinspect-access-control__step"><h3>3. Installation property</h3>
        ${field('installation_address','Installation address','text',true,values.installation_address || '')}
        <label>Location on property <span>Front door, side gate, meter box area, garage wall, rear entry, installer to choose suitable location.</span><input name="installation_location_on_property" required value="${escapeHtml(values.installation_location_on_property || '')}"></label>
        <label>Occupancy status<select name="occupancy_status" required><option></option><option>Vacant</option><option>Tenanted</option><option>Owner occupied</option><option>Unknown</option></select></label>
        <label>Access notes <span>Gate codes, alarm details, parking, pets, tenant contact, access limitations or anything the installer needs to know.</span><textarea name="access_notes">${escapeHtml(values.access_notes || '')}</textarea></label>
      </div>
      <div class="proinspect-access-control__step"><h3>4. Preferred date</h3>${field('preferred_date','Preferred date','date',true,values.preferred_date || '')}</div>
      <div class="proinspect-access-control__actions"><button type="button" class="proinspect-access-control__button proinspect-access-control__button--secondary" data-preview>Review details</button></div>
      <div class="proinspect-access-control__summary" data-summary hidden></div>
      <div class="proinspect-access-control__job-list" data-job-list>${jobList(jobs)}</div>
      <div class="proinspect-access-control__status" data-status hidden></div>
    </form>`;
    const form = root.querySelector('form');
    const pickupSelect = form.elements.pickup_required;
    const syncPickup = () => { const req = pickupSelect.value === 'Pickup required'; form.elements.pickup_address.required = req; form.elements.pickup_from_name.required = req; };
    pickupSelect.addEventListener('change', syncPickup); syncPickup();
    form.querySelector('[data-preview]').addEventListener('click', () => preview(form, config, jobs));
    form.addEventListener('click', (e) => {
      if (e.target.matches('[data-confirm]')) { jobs.push(collect(form, config)); renderAdded(root, config, jobs); }
      if (e.target.matches('[data-checkout]')) checkout(root, config, jobs);
      if (e.target.matches('[data-add-another]')) renderForm(root, config, jobs);
    });
  }
  function field(n,l,t,req,v){return `<label>${l}<input name="${n}" type="${t}" ${req?'required':''} value="${escapeHtml(v)}"></label>`;}
  function collect(form, config){ const data = Object.fromEntries(new FormData(form).entries()); return { service_type:'Lockbox Installation', serviceType:'Lockbox Installation', ...config.client, shopifyCustomerId:config.client.shopify_customer_id, shopifyCompanyId:config.client.shopify_company_id, shopifyCompanyLocationId:config.client.shopify_company_location_id, clientName:config.client.client_name, customerName:config.client.customer_name, customerEmail:config.client.customer_email, customerPhone: data.customer_phone || config.client.customer_phone, customer_phone: data.customer_phone || config.client.customer_phone, pickupRequired:data.pickup_required, pickup_required:data.pickup_required, pickupAddress:data.pickup_address || '', pickup_address:data.pickup_address || '', pickupFromName:data.pickup_from_name || '', pickup_from_name:data.pickup_from_name || '', pickupContactPhone:data.pickup_contact_phone || '', pickup_contact_phone:data.pickup_contact_phone || '', pickupNotes:data.pickup_notes || '', pickup_notes:data.pickup_notes || '', installationAddress:data.installation_address, installation_address:data.installation_address, installationLocationOnProperty:data.installation_location_on_property, installation_location_on_property:data.installation_location_on_property, occupancyStatus:data.occupancy_status, occupancy_status:data.occupancy_status, accessNotes:data.access_notes || '', access_notes:data.access_notes || '', preferredDate:data.preferred_date, preferred_date:data.preferred_date }; }
  function preview(form, config, jobs){ if(!form.reportValidity()) return; const job=collect(form,config); const s=form.querySelector('[data-summary]'); s.hidden=false; s.innerHTML=`<h3>5. Confirm details</h3><dl><dt>Client</dt><dd>${escapeHtml(job.client_name)} / ${escapeHtml(job.customer_email)}</dd><dt>Pickup</dt><dd>${escapeHtml(job.pickup_required)} ${escapeHtml(job.pickup_address)}</dd><dt>Installation</dt><dd>${escapeHtml(job.installation_address)} - ${escapeHtml(job.installation_location_on_property)}</dd><dt>Preferred date</dt><dd>${escapeHtml(job.preferred_date)}</dd></dl><button type="button" class="proinspect-access-control__button proinspect-access-control__button--secondary" onclick="this.closest('[data-summary]').hidden=true">Back</button> <button type="button" data-confirm class="proinspect-access-control__button proinspect-access-control__button--primary">Confirm this installation</button>`; }
  function renderAdded(root, config, jobs){ root.innerHTML=`<div class="proinspect-access-control__panel proinspect-access-control__success"><h3>Installation added</h3>${jobList(jobs)}<button data-add-another class="proinspect-access-control__button proinspect-access-control__button--secondary">Add another Lockbox Installation</button> <button data-checkout class="proinspect-access-control__button proinspect-access-control__button--primary">Continue to checkout</button><div data-status></div></div>`; root.querySelector('[data-add-another]').onclick=()=>renderForm(root,config,jobs); root.querySelector('[data-checkout]').onclick=()=>checkout(root,config,jobs); }
  function jobList(jobs){ return jobs.length ? `<h3>Job list</h3><ol>${jobs.map(j=>`<li>${escapeHtml(j.installation_address)} — ${escapeHtml(j.preferred_date)}</li>`).join('')}</ol>` : ''; }
  async function checkout(root, config, jobs){ const status=root.querySelector('[data-status]') || root; try { if(!jobs.length) throw new Error('Add at least one installation.'); if(config.checkoutMode !== 'Create job only' && !config.variantId) throw new Error('Shopify variant ID is required.'); status.hidden=false; status.textContent='Creating job drafts…'; const res=await fetch(`${config.apiBase}/api/access-control/jobs/request`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jobs})}); if(!res.ok) throw new Error(await res.text()); const payload=await res.json(); if(config.checkoutMode === 'Create job only'){ status.textContent=`Jobs created: ${payload.jobs.map(j=>j.id).join(', ')}`; return; } for(let i=0;i<payload.jobs.length;i++){ const id=payload.jobs[i].id, j=jobs[i]; await fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{id:config.variantId,quantity:1,properties:{'Service':'Lockbox Installation','Job ID':id,'Pickup required':j.pickup_required,'Pickup address':j.pickup_address,'Pick up from':j.pickup_from_name,'Installation address':j.installation_address,'Location on property':j.installation_location_on_property,'Preferred date':j.preferred_date,'_proinspect_job_id':id,'_service_type':'Lockbox Installation','_shopify_customer_id':j.shopify_customer_id,'_shopify_company_id':j.shopify_company_id,'_shopify_company_location_id':j.shopify_company_location_id}}]})}); } window.location.href='/checkout'; } catch(err){ status.hidden=false; status.textContent=err.message; status.classList.add('proinspect-access-control__status--error'); } }
  function escapeHtml(v){ return String(v ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
})();
