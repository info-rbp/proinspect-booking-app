(() => {
  const API_PRICE_MAP = {
    'Routine Inspection': {
      'Standard Hours': '$50',
      'Weekday After Hours': '$57.50',
      Saturday: '$62.50',
      Sunday: '$67.50',
      'Public Holiday': '$75'
    },
    'Property Condition Report': {
      'Standard Hours': '$150',
      'Weekday After Hours': '$172.50',
      Saturday: '$187.50',
      Sunday: '$202.50',
      'Public Holiday': '$225'
    },
    'Exit Inspection': {
      'Standard Hours': '$150',
      'Weekday After Hours': '$150',
      Saturday: '$150',
      Sunday: '$150',
      'Public Holiday': '$150'
    },
    'Open For Inspection': {
      'Standard Hours': '$150',
      'Weekday After Hours': '$150',
      Saturday: '$150',
      Sunday: '$150',
      'Public Holiday': '$150'
    }
  };

  const SERVICE_HANDLE_MAP = {
    'Property Condition Report': 'property-condition-report',
    'Routine Inspection': 'routine-inspection',
    'Exit Inspection': 'exit-inspection',
    'Open For Inspection': 'open-for-inspection-attendance'
  };

  function qs(root, selector) {
    return root.querySelector(selector);
  }

  function qsa(root, selector) {
    return Array.from(root.querySelectorAll(selector));
  }

  function showStatus(el, message) {
    el.hidden = false;
    el.textContent = message;
  }

  function hideStatus(el) {
    el.hidden = true;
    el.textContent = '';
  }

  function toDateLabel(iso) {
    try {
      return new Intl.DateTimeFormat('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit'
      }).format(new Date(iso));
    } catch (_error) {
      return iso;
    }
  }

  function timeOnly(iso) {
    try {
      return new Intl.DateTimeFormat('en-AU', {
        hour: 'numeric',
        minute: '2-digit'
      }).format(new Date(iso));
    } catch (_error) {
      return iso;
    }
  }

  function priceForSlot(serviceType, loadingLabel) {
    const servicePrices = API_PRICE_MAP[serviceType] || {};
    return servicePrices[loadingLabel] || servicePrices['Standard Hours'] || '$0';
  }

  function getServiceHandle(serviceType) {
    return SERVICE_HANDLE_MAP[serviceType] || serviceType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function getServiceFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('service') || params.get('serviceType') || params.get('product') || '';
    if (!raw) return '';

    const normalised = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const match = Object.entries(SERVICE_HANDLE_MAP).find(([, handle]) => handle === normalised);
    return match ? match[0] : '';
  }

  function parseServiceVariantMap(block) {
    const raw = block.dataset.serviceMap || '{}';
    try {
      return JSON.parse(raw.replace(/&quot;/g, '"'));
    } catch (_error) {
      return {};
    }
  }

  function resolveVariantId(serviceVariantMap, serviceType, loadingLabel) {
    const serviceHandle = getServiceHandle(serviceType);
    const serviceMap = serviceVariantMap[serviceHandle] || serviceVariantMap[serviceType] || {};
    return serviceMap[loadingLabel] || serviceMap['Standard Hours'] || serviceMap.default || '';
  }

  function setStep(block, stepNumber) {
    qsa(block, '[data-step]').forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.step === String(stepNumber));
    });
    qsa(block, '[data-step-label]').forEach((label) => {
      label.classList.toggle('is-active', label.dataset.stepLabel === String(stepNumber));
    });
  }

  function getFormData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function renderSummary(block, slot) {
    const form = qs(block, '[data-booking-form]');
    const data = getFormData(form);
    const summary = qs(block, '[data-summary]');

    summary.innerHTML = `
      <dl>
        <dt>Service</dt><dd>${data.serviceType || ''}</dd>
        <dt>Address</dt><dd>${data.propertyAddress || ''}</dd>
        <dt>Selected time</dt><dd>${slot ? toDateLabel(slot.start) : ''}</dd>
        <dt>Price</dt><dd>${priceForSlot(data.serviceType, data.loadingLabel || 'Standard Hours')}</dd>
        <dt>Estimated travel</dt><dd>${slot && slot.travelFromPreviousMinutes != null ? `${slot.travelFromPreviousMinutes} minutes from previous appointment` : 'To be confirmed'}</dd>
      </dl>
    `;
  }

  function renderAddressSuggestions(box, input, placeInput, suggestions) {
    if (!suggestions.length) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }

    box.innerHTML = suggestions.map((suggestion) => `
      <button type="button" class="proinspect-booking__address-suggestion" data-place-id="${suggestion.placeId}" data-text="${String(suggestion.text).replace(/"/g, '&quot;')}">
        <strong>${suggestion.mainText || suggestion.text}</strong>
        <small>${suggestion.secondaryText || ''}</small>
      </button>
    `).join('');

    box.hidden = false;
    qsa(box, '.proinspect-booking__address-suggestion').forEach((button) => {
      button.addEventListener('click', () => {
        input.value = button.dataset.text || '';
        placeInput.value = button.dataset.placeId || '';
        box.hidden = true;
        box.innerHTML = '';
      });
    });
  }

  function setupAddressAutocomplete(block) {
    const input = qs(block, '[data-address-input]');
    const placeInput = qs(block, '[data-place-id]');
    const box = qs(block, '[data-address-suggestions]');
    const apiBase = block.dataset.apiBase || '';
    let timer = null;

    if (!input || !placeInput || !box) return;

    input.addEventListener('input', () => {
      window.clearTimeout(timer);
      placeInput.value = '';
      const value = input.value.trim();

      if (value.length < 3) {
        box.hidden = true;
        box.innerHTML = '';
        return;
      }

      timer = window.setTimeout(async () => {
        try {
          const response = await fetch(`${apiBase}/api/address/autocomplete?input=${encodeURIComponent(value)}`);
          if (!response.ok) throw new Error('Autocomplete failed');
          const payload = await response.json();
          renderAddressSuggestions(box, input, placeInput, payload.suggestions || []);
        } catch (_error) {
          box.hidden = true;
          box.innerHTML = '';
        }
      }, 250);
    });

    document.addEventListener('click', (event) => {
      if (!box.contains(event.target) && event.target !== input) {
        box.hidden = true;
      }
    });
  }

  async function fetchAvailability(block) {
    const form = qs(block, '[data-booking-form]');
    const slotsEl = qs(block, '[data-slots]');
    const availabilityStatus = qs(block, '[data-availability-status]');
    const nextButton = qs(block, '[data-next-from-slots]');
    const selectedSlotStart = qs(block, '[data-selected-slot-start]');
    const selectedSlotEnd = qs(block, '[data-selected-slot-end]');
    const selectedVariantId = qs(block, '[data-selected-variant-id]');
    const loadingLabelInput = qs(block, '[data-loading-label]');
    const loadingAmountInput = qs(block, '[data-loading-amount]');
    const serviceVariantMap = parseServiceVariantMap(block);
    const data = getFormData(form);
    const apiBase = block.dataset.apiBase || '';

    slotsEl.innerHTML = '';
    nextButton.disabled = true;
    selectedSlotStart.value = '';
    selectedSlotEnd.value = '';
    selectedVariantId.value = '';
    loadingLabelInput.value = '';
    loadingAmountInput.value = '';

    if (!data.serviceType || !data.propertyAddress || !data.preferredDate) {
      showStatus(availabilityStatus, 'Choose a service, enter the property address and pick a date.');
      return;
    }

    showStatus(availabilityStatus, 'Checking availability and travel time...');

    try {
      const response = await fetch(`${apiBase}/api/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: data.serviceType,
          propertyAddress: data.propertyAddress,
          placeId: data.placeId || '',
          preferredDate: data.preferredDate
        })
      });

      if (!response.ok) {
        throw new Error('Availability request failed');
      }

      const payload = await response.json();
      const slots = payload.slots || [];

      if (!slots.length) {
        showStatus(availabilityStatus, 'No suitable times were found for that date. Try another date.');
        return;
      }

      hideStatus(availabilityStatus);

      slots.forEach((slot) => {
        const label = slot.loadingLabel || 'Standard Hours';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'proinspect-booking__slot';
        button.innerHTML = `
          <strong>${timeOnly(slot.start)}</strong>
          <span class="proinspect-booking__price">${slot.priceLabel || priceForSlot(data.serviceType, label)}</span>
        `;

        button.addEventListener('click', () => {
          qsa(slotsEl, '.proinspect-booking__slot').forEach((slotButton) => slotButton.classList.remove('is-selected'));
          button.classList.add('is-selected');
          selectedSlotStart.value = slot.start;
          selectedSlotEnd.value = slot.end;
          loadingLabelInput.value = label;
          loadingAmountInput.value = String(slot.loadingAmount || 0);
          selectedVariantId.value = resolveVariantId(serviceVariantMap, data.serviceType, loadingLabelInput.value);
          block.__selectedSlot = slot;
          nextButton.disabled = false;
        });

        slotsEl.appendChild(button);
      });
    } catch (error) {
      showStatus(availabilityStatus, 'Availability could not be loaded. Please try again.');
    }
  }

  async function submitBooking(block, event) {
    event.preventDefault();

    const form = qs(block, '[data-booking-form]');
    const status = qs(block, '[data-booking-status]');
    const data = getFormData(form);
    const apiBase = block.dataset.apiBase || '';

    if (!data.selectedSlotStart || !data.selectedSlotEnd) {
      showStatus(status, 'Select an available time before confirming.');
      return;
    }

    showStatus(status, 'Creating booking request...');

    try {
      const response = await fetch(`${apiBase}/api/bookings/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: data.serviceType,
          propertyAddress: data.propertyAddress,
          preferredDate: data.preferredDate,
          preferredWindow: `${data.selectedSlotStart} - ${data.selectedSlotEnd}`,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          agency: data.agency || '',
          accessMethod: data.accessMethod || '',
          notes: [
            data.notes || '',
            `Selected slot: ${data.selectedSlotStart} to ${data.selectedSlotEnd}`,
            `Timing category: ${data.loadingLabel || 'Standard Hours'}`,
            `Loading amount: ${data.loadingAmount || 0}`,
            `Google Place ID: ${data.placeId || ''}`
          ].filter(Boolean).join('\n')
        })
      });

      if (!response.ok) {
        throw new Error('Booking request failed');
      }

      const payload = await response.json();
      const bookingId = payload.booking && payload.booking.id ? payload.booking.id : '';
      const checkoutMode = block.dataset.checkoutMode || 'cart';

      if (checkoutMode === 'cart' && data.selectedVariantId) {
        await fetch('/cart/clear.js', { method: 'POST' });
        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: Number(data.selectedVariantId),
            quantity: 1,
            properties: {
              'Booking ID': bookingId,
              'Service address': data.propertyAddress,
              'Selected time': `${data.selectedSlotStart} to ${data.selectedSlotEnd}`,
              'Timing category': data.loadingLabel || 'Standard Hours',
              'Timing loading': data.loadingAmount || '0'
            }
          })
        });

        window.location.href = '/checkout';
        return;
      }

      showStatus(status, `Booking request ${bookingId} created.`);
    } catch (error) {
      showStatus(status, 'The booking could not be confirmed. Please check the details and try again.');
    }
  }

  function initBookingBlock(block) {
    const form = qs(block, '[data-booking-form]');
    const serviceSelect = qs(block, '[data-service-select]');
    const preferredDate = qs(block, '[data-preferred-date]');
    const nextFromSlots = qs(block, '[data-next-from-slots]');

    setupAddressAutocomplete(block);

    const urlService = getServiceFromUrl();
    if (urlService) {
      serviceSelect.value = urlService;
    } else if (block.dataset.defaultService) {
      serviceSelect.value = block.dataset.defaultService;
    }

    if (!preferredDate.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      preferredDate.value = tomorrow.toISOString().slice(0, 10);
    }

    qs(block, '[data-next-from-service]').addEventListener('click', () => {
      const data = getFormData(form);
      if (!data.serviceType || !data.propertyAddress) {
        const status = qs(block, '[data-booking-status]');
        showStatus(status, 'Select a service and enter the property address first.');
        return;
      }
      qs(block, '[data-booking-status]').hidden = true;
      setStep(block, 2);
      fetchAvailability(block);
    });

    preferredDate.addEventListener('change', () => fetchAvailability(block));
    qs(block, '[data-back-to-service]').addEventListener('click', () => setStep(block, 1));
    qs(block, '[data-back-to-slots]').addEventListener('click', () => setStep(block, 2));

    nextFromSlots.addEventListener('click', () => {
      renderSummary(block, block.__selectedSlot);
      setStep(block, 3);
    });

    form.addEventListener('submit', (event) => submitBooking(block, event));
  }

  document.addEventListener('DOMContentLoaded', () => {
    qsa(document, '[data-proinspect-booking]').forEach(initBookingBlock);
  });
})();
