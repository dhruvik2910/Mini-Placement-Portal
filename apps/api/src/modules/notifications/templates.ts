/**
 * LDCE Institutional Email Template Builder
 * Standardized institutional layout with college branding, GTU code 028, and official signatures.
 */

function buildLdceHtmlTemplate({
  preheader,
  title,
  badgeText,
  badgeColor,
  bodyHtml,
  ctaText,
  ctaUrl,
}: {
  preheader: string;
  title: string;
  badgeText: string;
  badgeColor: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const actionUrl = ctaUrl ? (ctaUrl.startsWith('http') ? ctaUrl : `${portalUrl}${ctaUrl}`) : portalUrl;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px; color: #1c1b1f; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e0e2ec; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #13357b; padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .header p { margin: 4px 0 0 0; font-size: 12px; color: #d9e2ff; letter-spacing: 0.05em; text-transform: uppercase; }
    .content { padding: 32px 28px; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-info { background: #dbeafe; color: #1e40af; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-offer { background: #fef9c3; color: #854d0e; border: 1px solid #facc15; }
    .headline { font-size: 22px; font-weight: 800; color: #13357b; margin: 0 0 16px 0; }
    .body-text { font-size: 15px; line-height: 1.6; color: #44474f; margin: 0 0 20px 0; }
    .info-card { background: #f2f4fc; border-radius: 12px; padding: 16px 20px; margin: 20px 0; border-left: 4px solid #13357b; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #74777f; font-weight: 600; }
    .info-value { color: #1c1b1f; font-weight: 700; }
    .btn-container { text-align: center; margin: 32px 0 20px 0; }
    .btn { display: inline-block; background: #13357b; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 700; }
    .footer { background: #f2f4fc; padding: 24px; text-align: center; border-top: 1px solid #e0e2ec; font-size: 12px; color: #74777f; line-height: 1.5; }
    .footer strong { color: #13357b; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="container">
    <div class="header">
      <h1>L.D. COLLEGE OF ENGINEERING</h1>
      <p>Training &amp; Placement Cell • GTU Code: 028 • Estd. 1948</p>
    </div>
    <div class="content">
      <span class="badge ${badgeColor}">${badgeText}</span>
      <h2 class="headline">${title}</h2>
      ${bodyHtml}
      ${
        ctaText
          ? `<div class="btn-container">
        <a href="${actionUrl}" class="btn">${ctaText}</a>
      </div>`
          : ''
      }
    </div>
    <div class="footer">
      <p>
        <strong>Training &amp; Placement Cell (TPO)</strong><br>
        L.D. College of Engineering, Opposite Gujarat University, Navrangpura, Ahmedabad - 380015<br>
        Contact: placements@ldce.ac.in | Gujarat Technological University (Code: 028)
      </p>
      <p style="margin-top: 8px; font-size: 11px; color: #a0a4b0;">
        This is an official automated notification from the LDCE Mini Placement Portal. Please do not reply directly to this email.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// 1. Profile Verified
export function getProfileVerifiedEmail({
  firstName,
  enrollmentNumber,
  department,
}: {
  firstName: string;
  enrollmentNumber: string;
  department: string;
}) {
  const subject = `[LDCE Placements] Academic Profile Verified — GTU Roll: ${enrollmentNumber}`;
  const text = `Respected ${firstName},\n\nYour academic profile and eligibility dossier for enrollment number ${enrollmentNumber} (${department}) have been verified and approved by the LDCE Training & Placement Cell.\n\nYou are now eligible to view and apply for campus recruitment drives matching your academic eligibility.\n\nLogin to the portal: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/drives\n\nTraining & Placement Cell\nL.D. College of Engineering, Ahmedabad`;

  const bodyHtml = `
    <p class="body-text">Dear <strong>${firstName}</strong>,</p>
    <p class="body-text">
      We are pleased to inform you that your academic credentials, marks records, and compliance dossier have been thoroughly verified and approved by the <strong>LDCE Training &amp; Placement Cell</strong>.
    </p>
    <div class="info-card">
      <div class="info-row"><span class="info-label">Student Name:</span><span class="info-value">${firstName}</span></div>
      <div class="info-row"><span class="info-label">GTU Enrollment No:</span><span class="info-value">${enrollmentNumber}</span></div>
      <div class="info-row"><span class="info-label">Department:</span><span class="info-value">${department}</span></div>
      <div class="info-row"><span class="info-label">Institutional Status:</span><span class="info-value" style="color: #166534;">VERIFIED &amp; APPROVED</span></div>
    </div>
    <p class="body-text">
      You are now authorized to submit applications for all active and upcoming campus recruitment drives that align with your department, CGPA, and backlog eligibility criteria.
    </p>
  `;

  const html = buildLdceHtmlTemplate({
    preheader: `Your LDCE placement profile has been verified and approved by TPO.`,
    title: 'Academic Profile Verified & Approved',
    badgeText: 'Compliance Verified',
    badgeColor: 'badge-success',
    bodyHtml,
    ctaText: 'Browse Eligible Placement Drives',
    ctaUrl: '/drives',
  });

  return { subject, text, html };
}

// 2. Profile Correction Required / Rejected
export function getProfileRejectedEmail({
  firstName,
  enrollmentNumber,
  remarks,
}: {
  firstName: string;
  enrollmentNumber: string;
  remarks?: string;
}) {
  const subject = `[LDCE Placements] Action Required: Profile Correction — GTU Roll: ${enrollmentNumber}`;
  const text = `Dear ${firstName},\n\nDuring verification of your placement profile (${enrollmentNumber}), the TPO Cell noted items requiring correction:\n\n${remarks || 'Please check and update your academic details as per GTU records.'}\n\nPlease log in to review and correct your dossier.\n\nPortal: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile\n\nTraining & Placement Cell, LDCE Ahmedabad`;

  const bodyHtml = `
    <p class="body-text">Dear <strong>${firstName}</strong>,</p>
    <p class="body-text">
      The Training &amp; Placement Cell reviewed your submitted academic profile. Before your profile can be approved for campus placements, the following remarks must be addressed:
    </p>
    <div class="info-card" style="border-left-color: #f59e0b; background: #fffbeb;">
      <span class="info-label" style="display:block; margin-bottom: 6px; color: #b45309;">TPO Review Remarks:</span>
      <p style="margin: 0; font-size: 14px; font-weight: 600; color: #78350f;">
        ${remarks || 'Discrepancy detected in marks or backlog declarations. Please verify against your GTU grade cards.'}
      </p>
    </div>
    <p class="body-text">
      Your profile has been returned to an editable state. Please update the necessary fields and submit for re-verification promptly.
    </p>
  `;

  const html = buildLdceHtmlTemplate({
    preheader: `Action required on your LDCE placement profile verification.`,
    title: 'Profile Correction Requested',
    badgeText: 'Correction Required',
    badgeColor: 'badge-warning',
    bodyHtml,
    ctaText: 'Update Academic Profile',
    ctaUrl: '/profile',
  });

  return { subject, text, html };
}

// 3. Candidate Shortlisted
export function getApplicantShortlistedEmail({
  firstName,
  enrollmentNumber,
  companyName,
  jobRole,
  packageLpa,
}: {
  firstName: string;
  enrollmentNumber: string;
  companyName: string;
  jobRole: string;
  packageLpa?: number | null;
}) {
  const subject = `[LDCE Placements] Shortlisted: ${companyName} — ${jobRole}`;
  const text = `Congratulations ${firstName}!\n\nYou have been shortlisted by ${companyName} for the position of ${jobRole}${packageLpa ? ` (CTC: INR ${packageLpa} LPA)` : ''}.\n\nPlease stay alert for interview schedules and assessment links on your portal.\n\nApplications: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/applications\n\nTraining & Placement Cell, LDCE Ahmedabad`;

  const bodyHtml = `
    <p class="body-text">Dear <strong>${firstName}</strong> (Roll: ${enrollmentNumber}),</p>
    <p class="body-text">
      Congratulations! We are delighted to inform you that your application has been evaluated and <strong>SHORTLISTED</strong> by the recruitment committee of <strong>${companyName}</strong>.
    </p>
    <div class="info-card">
      <div class="info-row"><span class="info-label">Recruiting Partner:</span><span class="info-value">${companyName}</span></div>
      <div class="info-row"><span class="info-label">Designation / Role:</span><span class="info-value">${jobRole}</span></div>
      ${packageLpa ? `<div class="info-row"><span class="info-label">Offered CTC:</span><span class="info-value">INR ${packageLpa} LPA</span></div>` : ''}
      <div class="info-row"><span class="info-label">Current Stage:</span><span class="info-value" style="color: #1e40af;">SHORTLISTED FOR NEXT ROUND</span></div>
    </div>
    <p class="body-text">
      Please check your portal application tracker regularly for technical assessment slots, interview timings, and venue details. Ensure you have your formal resume and college ID ready.
    </p>
  `;

  const html = buildLdceHtmlTemplate({
    preheader: `Congratulations! You are shortlisted for ${companyName} (${jobRole}).`,
    title: 'Shortlisted for Next Round',
    badgeText: 'Candidate Shortlisted',
    badgeColor: 'badge-info',
    bodyHtml,
    ctaText: 'View Application Status',
    ctaUrl: '/applications',
  });

  return { subject, text, html };
}

// 4. Candidate Selected / Offer Extended
export function getApplicantSelectedEmail({
  firstName,
  enrollmentNumber,
  companyName,
  jobRole,
  packageLpa,
}: {
  firstName: string;
  enrollmentNumber: string;
  companyName: string;
  jobRole: string;
  packageLpa?: number | null;
}) {
  const subject = `[LDCE Placements] Offer Extended! Selected by ${companyName}`;
  const text = `Hearty Congratulations ${firstName}!\n\nYou have been officially SELECTED for the role of ${jobRole} at ${companyName}${packageLpa ? ` with an annual CTC of INR ${packageLpa} LPA` : ''}.\n\nThe LDCE fraternity and Placement Cell congratulate you on this milestone!\n\nView details: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/applications\n\nTraining & Placement Cell, LDCE Ahmedabad`;

  const bodyHtml = `
    <p class="body-text">Dear <strong>${firstName}</strong>,</p>
    <p class="body-text" style="font-size: 16px; color: #13357b; font-weight: 700;">
      Heartiest Congratulations from the L.D. College of Engineering Fraternity!
    </p>
    <p class="body-text">
      You have successfully cleared all selection rounds and have been officially <strong>SELECTED</strong> for placement with <strong>${companyName}</strong>.
    </p>
    <div class="info-card" style="border-left-color: #eab308; background: #fefce8;">
      <div class="info-row"><span class="info-label">Selected Candidate:</span><span class="info-value">${firstName} (${enrollmentNumber})</span></div>
      <div class="info-row"><span class="info-label">Employer:</span><span class="info-value">${companyName}</span></div>
      <div class="info-row"><span class="info-label">Role / Profile:</span><span class="info-value">${jobRole}</span></div>
      ${packageLpa ? `<div class="info-row"><span class="info-label">Package (CTC):</span><span class="info-value" style="font-size: 15px; color: #854d0e;">INR ${packageLpa} LPA</span></div>` : ''}
      <div class="info-row"><span class="info-label">Status:</span><span class="info-value" style="color: #166534;">OFFER EXTENDED / SELECTED</span></div>
    </div>
    <p class="body-text">
      Your official offer details and onboarding instructions will be shared via the Placement Office.
    </p>
  `;

  const html = buildLdceHtmlTemplate({
    preheader: `Congratulations! Official job offer extended by ${companyName}.`,
    title: 'Campus Placement Selection',
    badgeText: 'Offer Extended',
    badgeColor: 'badge-offer',
    bodyHtml,
    ctaText: 'Access My Placement Offers',
    ctaUrl: '/applications',
  });

  return { subject, text, html };
}

// 5. Candidate Rejected / Not Selected
export function getApplicantRejectedEmail({
  firstName,
  enrollmentNumber,
  companyName,
  jobRole,
}: {
  firstName: string;
  enrollmentNumber: string;
  companyName: string;
  jobRole: string;
}) {
  const subject = `[LDCE Placements] Application Update: ${companyName} — ${jobRole}`;
  const text = `Dear ${firstName},\n\nThank you for participating in the campus recruitment process for ${companyName} (${jobRole}). While you were not selected in this drive, new opportunities are continuously being posted on the LDCE Placement Portal.\n\nKeep preparing and apply for upcoming drives.\n\nTraining & Placement Cell, LDCE Ahmedabad`;

  const bodyHtml = `
    <p class="body-text">Dear <strong>${firstName}</strong> (Roll: ${enrollmentNumber}),</p>
    <p class="body-text">
      Thank you for participating in the campus placement drive for <strong>${companyName}</strong> (${jobRole}).
    </p>
    <div class="info-card">
      <div class="info-row"><span class="info-label">Company:</span><span class="info-value">${companyName}</span></div>
      <div class="info-row"><span class="info-label">Role:</span><span class="info-value">${jobRole}</span></div>
      <div class="info-row"><span class="info-label">Application Status:</span><span class="info-value" style="color: #74777f;">NOT SELECTED IN THIS CYCLE</span></div>
    </div>
    <p class="body-text">
      While you were not selected for this specific opening, the LDCE placement season has numerous upcoming drives across leading engineering domains. We encourage you to review feedback and apply for active opportunities.
    </p>
  `;

  const html = buildLdceHtmlTemplate({
    preheader: `Status update regarding your application for ${companyName}.`,
    title: 'Recruitment Drive Update',
    badgeText: 'Status Update',
    badgeColor: 'badge-info',
    bodyHtml,
    ctaText: 'Explore Upcoming Drives',
    ctaUrl: '/drives',
  });

  return { subject, text, html };
}

// ==============================================================================
// WhatsApp Alert Templates (Formatted for Instant Messaging)
// ==============================================================================

export function getProfileVerifiedWhatsApp({
  firstName,
  enrollmentNumber,
}: {
  firstName: string;
  enrollmentNumber: string;
}) {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const message =
    `✅ *[LDCE Placements] Academic Profile Verified!*\n\n` +
    `Hello *${firstName}* (Roll: ${enrollmentNumber}),\n\n` +
    `Your academic marks and profile have been successfully *VERIFIED* by the Central Training & Placement Office.\n\n` +
    `You are now eligible to participate in active placement drives.\n\n` +
    `🔗 *Browse Active Drives:* ${portalUrl}/drives\n\n` +
    `_Training & Placement Cell, L.D. College of Engineering (GTU Code: 028)_`;

  return {
    message,
    templateName: 'ldce_profile_verified',
    templateParams: {
      student_name: firstName,
      enrollment_number: enrollmentNumber,
      portal_link: `${portalUrl}/drives`,
    },
  };
}

export function getProfileRejectedWhatsApp({
  firstName,
  enrollmentNumber,
  remarks,
}: {
  firstName: string;
  enrollmentNumber: string;
  remarks?: string | null;
}) {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const remarksText = remarks ? `\n⚠️ *TPO Remarks:* ${remarks}\n` : '';
  const message =
    `⚠️ *[LDCE Placements] Action Required: Profile Verification*\n\n` +
    `Hello *${firstName}* (Roll: ${enrollmentNumber}),\n\n` +
    `Your academic profile requires correction before verification can be completed.${remarksText}\n` +
    `Please log in to the portal, review the remarks, and re-submit.\n\n` +
    `🔗 *Update Profile:* ${portalUrl}/profile\n\n` +
    `_Training & Placement Cell, L.D. College of Engineering (GTU Code: 028)_`;

  return {
    message,
    templateName: 'ldce_profile_action_required',
    templateParams: {
      student_name: firstName,
      remarks: remarks || 'Please review your uploaded documents.',
      portal_link: `${portalUrl}/profile`,
    },
  };
}

export function getApplicantShortlistedWhatsApp({
  firstName,
  enrollmentNumber,
  companyName,
  jobRole,
  packageLpa,
}: {
  firstName: string;
  enrollmentNumber: string;
  companyName: string;
  jobRole: string;
  packageLpa?: number | null;
}) {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const ctcText = packageLpa ? `\n💰 *CTC:* INR ${packageLpa} LPA` : '';
  const message =
    `🎯 *[LDCE Placements] Application Shortlisted!*\n\n` +
    `Hello *${firstName}* (Roll: ${enrollmentNumber}),\n\n` +
    `Congratulations! You have been *SHORTLISTED* for the campus recruitment process:\n\n` +
    `🏢 *Company:* ${companyName}\n` +
    `💼 *Role:* ${jobRole}${ctcText}\n\n` +
    `Please check the portal for the round schedule, venue, and reporting instructions.\n\n` +
    `🔗 *View Application:* ${portalUrl}/applications\n\n` +
    `_Training & Placement Cell, L.D. College of Engineering (GTU Code: 028)_`;

  return {
    message,
    templateName: 'ldce_applicant_shortlisted',
    templateParams: {
      student_name: firstName,
      company_name: companyName,
      job_role: jobRole,
      portal_link: `${portalUrl}/applications`,
    },
  };
}

export function getApplicantSelectedWhatsApp({
  firstName,
  enrollmentNumber,
  companyName,
  jobRole,
  packageLpa,
}: {
  firstName: string;
  enrollmentNumber: string;
  companyName: string;
  jobRole: string;
  packageLpa?: number | null;
}) {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const ctcText = packageLpa ? `\n💰 *Package (CTC):* INR ${packageLpa} LPA` : '';
  const message =
    `🎉 *[LDCE Placements] Congratulations! Offer Extended!*\n\n` +
    `Dear *${firstName}* (Roll: ${enrollmentNumber}),\n\n` +
    `We are delighted to inform you that you have been *SELECTED* by *${companyName}* for the position of *${jobRole}*!${ctcText}\n\n` +
    `Official onboarding details will follow through the Placement Cell.\n\n` +
    `🔗 *Access Offers:* ${portalUrl}/applications\n\n` +
    `_Training & Placement Cell, L.D. College of Engineering (Estd. 1948)_`;

  return {
    message,
    templateName: 'ldce_applicant_selected',
    templateParams: {
      student_name: firstName,
      company_name: companyName,
      job_role: jobRole,
      portal_link: `${portalUrl}/applications`,
    },
  };
}

export function getApplicantRejectedWhatsApp({
  firstName,
  enrollmentNumber,
  companyName,
  jobRole,
}: {
  firstName: string;
  enrollmentNumber: string;
  companyName: string;
  jobRole: string;
}) {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const message =
    `ℹ️ *[LDCE Placements] Application Update: ${companyName}*\n\n` +
    `Hello *${firstName}*,\n\n` +
    `Thank you for participating in the placement drive for *${companyName}* (${jobRole}). ` +
    `While you were not selected in this cycle, multiple new recruitment drives are actively accepting applications.\n\n` +
    `🔗 *Explore Active Drives:* ${portalUrl}/drives\n\n` +
    `_Training & Placement Cell, L.D. College of Engineering (GTU Code: 028)_`;

  return {
    message,
    templateName: 'ldce_applicant_rejected',
    templateParams: {
      student_name: firstName,
      company_name: companyName,
      portal_link: `${portalUrl}/drives`,
    },
  };
}

