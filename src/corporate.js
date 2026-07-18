import { initSharedFeatures, showToast } from './shared.js';
import { createCorporateInquiry } from './db/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  initSharedFeatures();

  const form = document.getElementById('corporate-portal-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const contactName = document.getElementById('corp-name').value.trim();
      const companyName = document.getElementById('corp-company').value.trim();
      const companyEmail = document.getElementById('corp-email').value.trim();
      const contactPhone = document.getElementById('corp-phone').value.trim();
      const quantity = parseInt(document.getElementById('corp-qty').value.trim());
      const logoStamp = document.getElementById('corp-stamp').value === 'yes';
      const budgetTier = document.getElementById('corp-budget').value;
      const deliveryDate = document.getElementById('corp-date').value;
      const brandingNotes = document.getElementById('corp-notes').value.trim();

      const inquiryData = {
        contact_name: contactName,
        company_name: companyName,
        company_email: companyEmail,
        contact_phone: contactPhone,
        quantity: quantity,
        logo_stamp: logoStamp,
        budget_tier: budgetTier,
        delivery_date: deliveryDate,
        branding_notes: brandingNotes,
        status: 'Pending'
      };

      showToast("Registering corporate profile...");

      const { data, error } = await createCorporateInquiry(inquiryData);

      if (error) {
        showToast("Registration failed. Please try again.");
        console.error("Corporate onboarding failed", error);
      } else {
        showToast("Profile successfully logged!");
        showCorporateSuccessScreen(form, companyName, companyEmail);
      }
    });
  }
});

function showCorporateSuccessScreen(form, companyName, email) {
  const container = form.parentElement;
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 2rem 1rem;">
      <div style="width: 80px; height: 80px; background: rgba(197, 160, 89, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2.5rem auto; border: 2px solid var(--gold);">
        <span style="font-size: 2.5rem; color: var(--gold); line-height: 1; font-weight: bold;">✓</span>
      </div>
      <span class="gold-accent" style="letter-spacing: 0.2em; font-size: 0.8rem; font-weight: 800; text-transform: uppercase;">ONBOARDING REGISTERED</span>
      <h2 style="font-family: var(--font-primary); font-size: 2.6rem; font-weight: 300; color: var(--navy-blue); margin: 0.8rem 0 1.5rem 0; line-height: 1.15;">Concierge Request Logged</h2>
      
      <p style="color: rgba(38, 57, 72, 0.75); font-size: 0.95rem; line-height: 1.6; max-width: 520px; margin: 0 auto 2.5rem auto; font-family: var(--font-sans);">
        Thank you for onboarding <strong style="color: var(--navy-blue);">${escapeHTML(companyName)}</strong> with Oakmere. An Account Executive has been assigned to prepare catalog pricing drafts for your team.
      </p>

      <div style="background: rgba(38, 57, 72, 0.03); padding: 1.5rem; border-left: 3px solid var(--navy-blue); display: inline-block; text-align: left; max-width: 450px; margin-bottom: 2.5rem;">
        <span style="font-size: 0.7rem; font-weight: 700; color: var(--navy-blue); display: block; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.05em; font-family: var(--font-sans);">Expected Response Protocol</span>
        <p style="font-size: 0.85rem; line-height: 1.5; color: rgba(38, 57, 72, 0.8); margin: 0; font-family: var(--font-sans);">
          We will contact you at <strong style="color: var(--navy-blue);">${escapeHTML(email)}</strong> within 12 hours with customized box stamping options and invoice templates.
        </p>
      </div>

      <div>
        <a href="/" class="btn-premium btn-hero" style="padding: 1rem 3rem; display: inline-block; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; font-size: 0.8rem; border-radius: 0; text-decoration: none; color: var(--beige-light);">Return to Home</a>
      </div>
    </div>
  `;
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
