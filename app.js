// ── Supabase config ────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://wcytjfslfaswdsewrpdn.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeXRqZnNsZmFzd2RzZXdycGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODI1NDAsImV4cCI6MjA5NTI1ODU0MH0.leKrVtXT1MpBcOtKKEgpWhQxElO5_1gx9uM0XfEzpT8';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// Read ?source= query param so each QR code can be labelled (e.g. ?source=KL_Branch)
const urlParams  = new URLSearchParams(window.location.search);
const qrSource   = urlParams.get('source') || 'QR_Code';

// ── Form submit ─────────────────────────────────────────────────────────────
document.getElementById('prospectForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form      = e.target;
  const submitBtn = document.getElementById('submitBtn');
  const btnText   = document.getElementById('btnText');
  const btnLoader = document.getElementById('btnLoader');
  const errorMsg  = document.getElementById('errorMsg');

  // Clear previous errors
  errorMsg.style.display = 'none';
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

  // Collect values
  const fields = {
    full_name:                form.full_name.value.trim(),
    ic:                       form.ic.value.trim(),
    date_of_birth:            form.date_of_birth.value,
    mobile_number:            form.mobile_number.value.trim(),
    email:                    form.email.value.trim() || null,
    installation_address:     form.installation_address.value.trim(),
    postcode:                 form.postcode.value.trim(),
    employer_name:            form.employer_name.value.trim(),
    emergency_contact_name:   form.emergency_contact_name.value.trim(),
    emergency_contact_number: form.emergency_contact_number.value.trim(),
    source:                   qrSource,
    status:                   'new',
  };

  // Required field validation
  const required = [
    'full_name','ic','date_of_birth','mobile_number',
    'installation_address','postcode','employer_name',
    'emergency_contact_name','emergency_contact_number'
  ];
  let hasError = false;
  required.forEach(key => {
    if (!fields[key]) {
      form[key].classList.add('invalid');
      hasError = true;
    }
  });
  if (hasError) {
    showError('Please fill in all required fields marked with *');
    return;
  }

  // IC format check (basic Malaysian NRIC)
  const icClean = fields.ic.replace(/-/g, '');
  if (!/^\d{12}$/.test(icClean)) {
    form.ic.classList.add('invalid');
    showError('IC number must be 12 digits (e.g. 900101141234 or 900101-14-1234)');
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

  // Redirect to thank-you page
  window.location.href = 'thank-you.html';
});

// ── Helpers ─────────────────────────────────────────────────────────────────
function setLoading(loading) {
  const btn    = document.getElementById('submitBtn');
  const text   = document.getElementById('btnText');
  const loader = document.getElementById('btnLoader');
  btn.disabled    = loading;
  text.style.display   = loading ? 'none'   : 'inline';
  loader.style.display = loading ? 'inline' : 'none';
}

function showError(msg) {
  const el = document.getElementById('errorMsg');
  el.textContent    = msg;
  el.style.display  = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
