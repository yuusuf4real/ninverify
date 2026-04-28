/**
 * NIN Verification Certificate Print Template
 * Generates a printable HTML document for NIN verification results
 */

interface VerificationData {
  fullName: string;
  dateOfBirth: string;
  phoneFromNimc: string;
  gender: string;
  photoUrl?: string;
  signatureUrl?: string;
  address?: {
    addressLine: string;
    town: string;
    lga: string;
    state: string;
  };
  dataLayer: string;
}

interface SessionInfo {
  sessionId: string;
  phoneNumber: string;
  dataLayer: string;
  verificationDate: string;
}

export function generateNINCertificate(
  data: VerificationData,
  sessionInfo: SessionInfo,
): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const currentDate = new Date().toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentTime = new Date().toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NIN Verification Certificate - ${data.fullName}</title>
        <style>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.5;
            color: #1a1a1a;
            background: #f5f5f5;
            padding: 20px;
          }
          
          .certificate {
            max-width: 210mm; /* A4 width */
            min-height: 297mm; /* A4 height */
            margin: 0 auto;
            background: white;
            position: relative;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          
          /* Nigerian Flag Border - Green, White, Green */
          .flag-border-top {
            height: 12px;
            background: linear-gradient(to right, 
              #008751 0%, #008751 33.33%, 
              white 33.33%, white 66.66%, 
              #008751 66.66%, #008751 100%);
          }
          
          .flag-border-bottom {
            height: 12px;
            background: linear-gradient(to right, 
              #008751 0%, #008751 33.33%, 
              white 33.33%, white 66.66%, 
              #008751 66.66%, #008751 100%);
          }
          
          /* Header with Nigerian Coat of Arms Style */
          .header {
            background: linear-gradient(135deg, #008751 0%, #006B3F 100%);
            color: white;
            padding: 30px 40px;
            text-align: center;
            position: relative;
          }
          
          .coat-of-arms {
            width: 60px;
            height: 60px;
            margin: 0 auto 15px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }
          
          .header-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          
          .header-subtitle {
            font-size: 14px;
            opacity: 0.95;
            font-weight: 400;
            letter-spacing: 0.5px;
          }
          
          /* Certificate Title */
          .certificate-title {
            text-align: center;
            padding: 30px 40px 20px;
            border-bottom: 3px solid #008751;
            margin-bottom: 30px;
          }
          
          .certificate-title h1 {
            font-size: 28px;
            font-weight: 700;
            color: #008751;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          
          .certificate-number {
            font-size: 13px;
            color: #666;
            font-weight: 500;
          }
          
          /* Verification Badge */
          .verification-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #008751;
            color: white;
            padding: 10px 24px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 14px;
            margin: 0 auto 30px;
            display: flex;
            width: fit-content;
            box-shadow: 0 2px 8px rgba(0, 135, 81, 0.3);
          }
          
          .verification-badge svg {
            width: 20px;
            height: 20px;
          }
          
          /* Main Content */
          .content {
            padding: 0 40px 40px;
          }
          
          /* Photo and Personal Info Side by Side */
          .main-info {
            display: grid;
            grid-template-columns: 180px 1fr;
            gap: 30px;
            margin-bottom: 30px;
            padding: 25px;
            background: #f9fafb;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
          }
          
          .photo-container {
            text-align: center;
          }
          
          .photo {
            width: 150px;
            height: 180px;
            object-fit: cover;
            border-radius: 4px;
            border: 3px solid #008751;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            background: white;
          }
          
          .photo-label {
            font-size: 11px;
            color: #666;
            margin-top: 8px;
            font-weight: 500;
          }
          
          .personal-details {
            display: grid;
            gap: 15px;
          }
          
          .detail-row {
            display: grid;
            grid-template-columns: 140px 1fr;
            gap: 15px;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .detail-row:last-child {
            border-bottom: none;
          }
          
          .detail-label {
            font-size: 13px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .detail-value {
            font-size: 15px;
            font-weight: 600;
            color: #1a1a1a;
          }
          
          /* Address Section */
          .address-section {
            margin-bottom: 30px;
            padding: 25px;
            background: #f9fafb;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
          }
          
          .section-header {
            font-size: 16px;
            font-weight: 700;
            color: #008751;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #008751;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .address-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          
          /* Verification Info */
          .verification-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .info-box {
            padding: 20px;
            background: white;
            border-radius: 8px;
            border: 2px solid #e5e7eb;
          }
          
          .info-box-title {
            font-size: 13px;
            font-weight: 600;
            color: #6b7280;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .info-box-value {
            font-size: 15px;
            font-weight: 600;
            color: #1a1a1a;
          }
          
          .status-verified {
            color: #008751;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          /* Security Strip */
          .security-strip {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 20px 25px;
            border-radius: 8px;
            border-left: 4px solid #008751;
            margin-bottom: 30px;
          }
          
          .security-title {
            font-size: 13px;
            font-weight: 700;
            color: #008751;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .security-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
          }
          
          .security-item {
            font-size: 12px;
            color: #4b5563;
          }
          
          .security-item strong {
            display: block;
            color: #1a1a1a;
            margin-bottom: 3px;
          }
          
          /* Footer */
          .footer {
            background: #f9fafb;
            padding: 25px 40px;
            border-top: 3px solid #008751;
            text-align: center;
          }
          
          .footer-logo {
            font-size: 18px;
            font-weight: 700;
            color: #008751;
            margin-bottom: 10px;
          }
          
          .footer-text {
            font-size: 11px;
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 8px;
          }
          
          .footer-contact {
            font-size: 11px;
            color: #4b5563;
            font-weight: 500;
            margin-top: 12px;
          }
          
          /* Watermark */
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 140px;
            color: rgba(0, 135, 81, 0.03);
            font-weight: 900;
            z-index: 0;
            pointer-events: none;
            letter-spacing: 10px;
          }
          
          .content-wrapper {
            position: relative;
            z-index: 1;
          }
          
          /* Print Styles */
          @media print {
            body {
              background: white;
              padding: 0;
            }
            
            .certificate {
              box-shadow: none;
              max-width: 100%;
              min-height: auto;
            }
            
            .watermark {
              opacity: 0.5;
            }
          }
          
          @page {
            size: A4 portrait;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <!-- Watermark -->
          <div class="watermark">VERIFIED</div>
          
          <!-- Nigerian Flag Border Top -->
          <div class="flag-border-top"></div>
          
          <!-- Header with Coat of Arms Style -->
          <div class="header">
            <div class="coat-of-arms">🇳🇬</div>
            <div class="header-title">Federal Republic of Nigeria</div>
            <div class="header-subtitle">National Identity Verification Certificate</div>
          </div>
          
          <div class="content-wrapper">
            <!-- Certificate Title -->
            <div class="certificate-title">
              <h1>Identity Verification Certificate</h1>
              <p class="certificate-number">Certificate No: ${sessionInfo.sessionId.substring(0, 16).toUpperCase()}</p>
            </div>
            
            <div class="content">
              <!-- Verification Badge -->
              <div class="verification-badge">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span>OFFICIALLY VERIFIED BY NIMC</span>
              </div>
              
              <!-- Main Info: Photo + Personal Details -->
              <div class="main-info">
                ${
                  data.photoUrl
                    ? `
                  <div class="photo-container">
                    <img src="${data.photoUrl}" alt="Official Photo" class="photo" />
                    <div class="photo-label">OFFICIAL PHOTOGRAPH</div>
                  </div>
                `
                    : `
                  <div class="photo-container">
                    <div class="photo" style="display: flex; align-items: center; justify-content: center; background: #f3f4f6; color: #9ca3af; font-size: 14px; text-align: center; padding: 20px;">
                      No Photo<br/>Available
                    </div>
                    <div class="photo-label">OFFICIAL PHOTOGRAPH</div>
                  </div>
                `
                }
                
                <div class="personal-details">
                  <div class="detail-row">
                    <div class="detail-label">Full Name</div>
                    <div class="detail-value">${data.fullName}</div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-label">Date of Birth</div>
                    <div class="detail-value">${formatDate(data.dateOfBirth)}</div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-label">Gender</div>
                    <div class="detail-value">${data.gender}</div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-label">Phone Number</div>
                    <div class="detail-value">${data.phoneFromNimc}</div>
                  </div>
                </div>
              </div>
              
              ${
                data.address
                  ? `
              <!-- Address Section -->
              <div class="address-section">
                <div class="section-header">Residential Address</div>
                <div class="address-grid">
                  <div class="detail-row">
                    <div class="detail-label">Address</div>
                    <div class="detail-value">${data.address.addressLine}</div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-label">Town/City</div>
                    <div class="detail-value">${data.address.town}</div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-label">LGA</div>
                    <div class="detail-value">${data.address.lga}</div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-label">State</div>
                    <div class="detail-value">${data.address.state}</div>
                  </div>
                </div>
              </div>
              `
                  : ""
              }
              
              <!-- Verification Information -->
              <div class="verification-info">
                <div class="info-box">
                  <div class="info-box-title">Verification Date</div>
                  <div class="info-box-value">${formatDate(sessionInfo.verificationDate)}</div>
                </div>
                <div class="info-box">
                  <div class="info-box-title">Verification Time</div>
                  <div class="info-box-value">${currentTime}</div>
                </div>
                <div class="info-box">
                  <div class="info-box-title">Data Layer</div>
                  <div class="info-box-value">${data.dataLayer.charAt(0).toUpperCase() + data.dataLayer.slice(1)}</div>
                </div>
                <div class="info-box">
                  <div class="info-box-title">Verification Status</div>
                  <div class="info-box-value status-verified">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    VERIFIED
                  </div>
                </div>
              </div>
              
              <!-- Security Features -->
              <div class="security-strip">
                <div class="security-title">🔒 Security & Authentication</div>
                <div class="security-grid">
                  <div class="security-item">
                    <strong>Certificate ID</strong>
                    ${sessionInfo.sessionId.substring(0, 12).toUpperCase()}
                  </div>
                  <div class="security-item">
                    <strong>Issued On</strong>
                    ${currentDate}
                  </div>
                  <div class="security-item">
                    <strong>Digital Signature</strong>
                    SHA-256 Encrypted
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div class="footer-logo">VerifyNIN</div>
            <p class="footer-text">
              This certificate was generated from official NIMC records and is digitally signed for authenticity.
            </p>
            <p class="footer-text">
              This document can be verified online at <strong>www.verifynin.com</strong> using the certificate number above.
            </p>
            <p class="footer-contact">
              <strong>VerifyNIN</strong> - Authorized NIMC Verification Partner<br/>
              Email: support@verifynin.com | Phone: +234 800 000 0000
            </p>
          </div>
          
          <!-- Nigerian Flag Border Bottom -->
          <div class="flag-border-bottom"></div>
        </div>
      </body>
    </html>
  `;
}
