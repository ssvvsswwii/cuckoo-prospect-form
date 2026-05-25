// ── Supabase config ────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://wcytjfslfaswdsewrpdn.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeXRqZnNsZmFzd2RzZXdycGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODI1NDAsImV4cCI6MjA5NTI1ODU0MH0.leKrVtXT1MpBcOtKKEgpWhQxElO5_1gx9uM0XfEzpT8';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// Read ?source= query param so each QR code can be labelled
const urlParams = new URLSearchParams(window.location.search);
const qrSource  = urlParams.get('source') || 'QR_Code';

// ── Auto-format helpers ──────────────────────────────────────────────────────

// IC: force UPPERCASE letters, digits only — max 8 chars (2L + 6D)
document.getElementById('ic').addEventListener('input', function () {
  const raw = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  this.value = raw.slice(0, 8);
});

// Mobile: digits only
document.getElementById('mobile_number').addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 7);
});

// Emergency contact number: digits only
document.getElementById('emergency_contact_number').addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 7);
});

// Postcode: uppercase letters + digits, max 6 chars (2L + 4D)
document.getElementById('postcode').addEventListener('input', function () {
  const raw = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  this.value = raw.slice(0, 6);
});

// ── Brunei validators ────────────────────────────────────────────────────────

// IC: exactly 2 uppercase letters followed by 6 digits  (e.g. CE012345)
function validateIC(value) {
  return /^[A-Z]{2}\d{6}$/.test(value.toUpperCase());
}

// Mobile: 7 digits, first digit must be 7 or 8  (Brunei mobile prefix)
function validateBruneiMobile(value) {
  const digits = value.replace(/\D/g, '');
  return /^[78]\d{6}$/.test(digits);
}

// Postcode: 2 letters + 4 digits  (e.g. BS8311)
function validatePostcode(value) {
  return /^[A-Z]{2}\d{4}$/i.test(value);
}

// ── Form submit ──────────────────────────────────────────────────────────────
document.getElementById('prospectForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form      = e.target;
  const errorMsg  = document.getElementById('errorMsg');

  // Clear previous errors
  errorMsg.style.display = 'none';
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

  // Collect values — prepend +673 to phone fields
  const mobileRaw    = form.mobile_number.value.trim();
  const emergencyRaw = form.emergency_contact_number.value.trim();

  const fields = {
    full_name:                form.full_name.value.trim(),
    ic:                       form.ic.value.trim().toUpperCase(),
    date_of_birth:            form.date_of_birth.value,
    mobile_number:            mobileRaw ? '+673 ' + mobileRaw : '',
    email:                    form.email.value.trim() || null,
    installation_address:     form.installation_address.value.trim(),
    postcode:                 form.postcode.value.trim().toUpperCase(),
    employer_name:            form.employer_name.value.trim(),
    emergency_contact_name:   form.emergency_contact_name.value.trim(),
    emergency_contact_number: emergencyRaw ? '+673 ' + emergencyRaw : '',
    source:                   qrSource,
    status:                   'new',
  };

  // Required field validation
  const required = [
    'full_name', 'ic', 'date_of_birth', 'mobile_number',
    'installation_address', 'postcode', 'employer_name',
    'emergency_contact_name', 'emergency_contact_number',
  ];
  let hasError = false;
  required.forEach(key => {
    const rawVal = key === 'mobile_number'
      ? mobileRaw
      : key === 'emergency_contact_number'
        ? emergencyRaw
        : fields[key];
    if (!rawVal) {
      const el = form[key];
      if (el) el.classList.add('invalid');
      hasError = true;
    }
  });
  if (hasError) {
    showError('Please fill in all required fields marked with *');
    return;
  }

  // IC validation — Brunei format: 2 letters + 6 digits
  if (!validateIC(fields.ic)) {
    form.ic.classList.add('invalid');
    showError('IC number must be 2 letters followed by 6 digits (e.g. CE012345)');
    return;
  }

  // Mobile validation — Brunei: 7 digits, starts with 7 or 8
  if (!validateBruneiMobile(mobileRaw)) {
    form.mobile_number.classList.add('invalid');
    showError('Mobile number must be 7 digits starting with 7 or 8 (e.g. 7123456)');
    return;
  }

  // Emergency contact number validation
  if (!validateBruneiMobile(emergencyRaw)) {
    form.emergency_contact_number.classList.add('invalid');
    showError('Emergency contact number must be 7 digits starting with 7 or 8');
    return;
  }

  // Postcode validation — Brunei: 2 letters + 4 digits
  if (!validatePostcode(fields.postcode)) {
    form.postcode.classList.add('invalid');
    showError('Postcode must be 2 letters followed by 4 digits (e.g. BS8311)');
    return;
  }

  // Submit
  setLoading(true);
  const { error } = await db.from('prospects').insert([fields]);
  setLoading(false);

  if (error) {
    console.error(error);
    showError('Submission failed. Please try again or contact support.');
    return;
  }

  window.location.href = 'thank-you.html';
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function setLoading(loading) {
  const btn    = document.getElementById('submitBtn');
  const text   = document.getElementById('btnText');
  const loader = document.getElementById('btnLoader');
  btn.disabled         = loading;
  text.style.display   = loading ? 'none'   : 'inline';
  loader.style.display = loading ? 'inline' : 'none';
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent   = msg;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
