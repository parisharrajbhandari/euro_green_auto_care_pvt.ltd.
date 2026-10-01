document.addEventListener('DOMContentLoaded', () => {
    // ============================================================
    // POPULATE PAGE FROM CONFIG
    // ============================================================
    const cfg = BUSINESS_CONFIG;

    // --- Page Title ---
    document.title = `${cfg.company.name} | ${cfg.company.tagline}`;

    // --- Logo ---
    const logoEl = document.getElementById('logo');
    if (logoEl) {
        logoEl.src = cfg.logo.src;
        logoEl.alt = cfg.logo.alt;
    }

    // --- Header: Person Details (shown when scrolled) ---
    const personNameEl = document.getElementById('person-name');
    const personTitleEl = document.getElementById('person-title');
    if (personNameEl) personNameEl.textContent = cfg.person.fullName;
    if (personTitleEl) personTitleEl.textContent = cfg.person.title;

    // --- First Page: Company Name & Tagline (shown on logo page) ---
    const companyNameEl = document.getElementById('company-name');
    if (companyNameEl) companyNameEl.textContent = cfg.company.name;

    const companyTaglineEl = document.getElementById('company-tagline');
    if (companyTaglineEl) companyTaglineEl.textContent = cfg.company.tagline;


    // --- About Section ---
    const aboutHeadingEl = document.getElementById('about-heading');
    const aboutTextEl = document.getElementById('about-text');
    if (aboutHeadingEl) aboutHeadingEl.textContent = cfg.company.aboutHeading;
    if (aboutTextEl) aboutTextEl.textContent = cfg.company.aboutText;

    // --- Action Buttons ---
    const btnCall = document.getElementById('btn-call');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const btnEmail = document.getElementById('btn-email');
    const btnLocation = document.getElementById('btn-location');
    const btnReview = document.getElementById('btn-review');

    if (btnCall) btnCall.href = `tel:${cfg.contact.phones[0].number}`;
    if (btnWhatsapp) btnWhatsapp.href = `https://wa.me/${cfg.contact.whatsapp}`;
    if (btnEmail) btnEmail.href = `mailto:${cfg.contact.email}`;
    if (btnLocation) btnLocation.href = cfg.contact.locationUrl;
    if (btnReview) btnReview.href = cfg.contact.reviewUrl;

    // --- Social Media Icons (dynamically generated) ---
    const socialBar = document.getElementById('social-bar');
    if (socialBar) {
        cfg.socials.forEach(social => {
            const a = document.createElement('a');
            a.href = social.url;
            a.target = '_blank';
            a.className = 'social-icon';
            a.setAttribute('aria-label', social.platform);

            const i = document.createElement('i');
            i.className = social.icon;
            a.appendChild(i);

            socialBar.appendChild(a);
        });
    }

    // ============================================================
    // SCROLL ANIMATIONS
    // ============================================================
    const header = document.getElementById('header');
    const scrollIndicator = document.getElementById('scroll-indicator');
    const contactsSection = document.getElementById('contacts-section');

    // Threshold in pixels to trigger the animation
    const headerThreshold = 10;

    // Listen for scroll events on the window
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;

        // Step 1: Header Shrink & Initial Text Fade
        if (scrollPosition > headerThreshold) {
            header.classList.add('scrolled');
            if (companyNameEl) companyNameEl.classList.add('hidden');
            if (companyTaglineEl) companyTaglineEl.classList.add('hidden');
            if (scrollIndicator) scrollIndicator.classList.add('hidden');
        } else {
            header.classList.remove('scrolled');
            if (companyNameEl) companyNameEl.classList.remove('hidden');
            if (companyTaglineEl) companyTaglineEl.classList.remove('hidden');
            if (scrollIndicator) scrollIndicator.classList.remove('hidden');
        }

        // Step 2: Contacts Fade In
        if (scrollPosition > headerThreshold) {
            if (contactsSection) contactsSection.classList.add('visible');
        } else {
            if (contactsSection) contactsSection.classList.remove('visible');
        }
    });

    // ============================================================
    // vCARD DOWNLOAD (built from config)
    // ============================================================
    const saveContactBtn = document.getElementById('btn-save-contact');
    if (saveContactBtn) {
        saveContactBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Extract clean JPEG photo Base64 (required by iOS and Android Contacts)
            let photoBase64 = (cfg.vcard && cfg.vcard.photoBase64 ? cfg.vcard.photoBase64 : '')
                .replace(/^data:image\/[a-zA-Z]+;base64,/, '')
                .replace(/[\r\n\s]/g, '');

            // Fallback: If not in config, generate a square JPEG avatar from the page logo
            if (!photoBase64) {
                try {
                    const logoImg = document.getElementById('logo');
                    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
                        const canvas = document.createElement('canvas');
                        const size = 500;
                        canvas.width = size;
                        canvas.height = size;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, size, size);

                        const maxDim = 420;
                        const scale = Math.min(maxDim / logoImg.naturalWidth, maxDim / logoImg.naturalHeight);
                        const w = logoImg.naturalWidth * scale;
                        const h = logoImg.naturalHeight * scale;
                        const x = (size - w) / 2;
                        const y = (size - h) / 2;
                        ctx.drawImage(logoImg, x, y, w, h);
                        photoBase64 = canvas.toDataURL('image/jpeg', 0.9)
                            .replace(/^data:image\/[a-zA-Z]+;base64,/, '')
                            .replace(/[\r\n\s]/g, '');
                    }
                } catch (err) {
                    console.warn('Canvas photo fallback error:', err);
                }
            }

            const vcardLines = [
                'BEGIN:VCARD',
                'VERSION:3.0',
                // Company name as the primary display name for the contact
                `FN:${cfg.company.name}`,
                `N:${cfg.company.name};;;;`,
                `ORG:${cfg.company.name}`,
                `TITLE:${cfg.person.fullName} - ${cfg.person.title}`,
            ];

            if (cfg.vcard && cfg.vcard.contactNote) {
                vcardLines.push(`NOTE:${cfg.vcard.contactNote}`);
            }

            // Contact profile photo (JPEG base64)
            if (photoBase64) {
                vcardLines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${photoBase64}`);
            }

            // Phone numbers
            if (cfg.contact && cfg.contact.phones) {
                cfg.contact.phones.forEach(p => {
                    if (p.number) {
                        vcardLines.push(`TEL;TYPE=${(p.label || 'WORK').toUpperCase()},VOICE:${p.number}`);
                    }
                });
            }

            // Email
            if (cfg.contact && cfg.contact.email) {
                vcardLines.push(`EMAIL;TYPE=PREF,INTERNET:${cfg.contact.email}`);
            }

            // Location & WhatsApp
            if (cfg.contact && cfg.contact.locationUrl) {
                vcardLines.push(`URL;type=Location:${cfg.contact.locationUrl}`);
            }
            if (cfg.contact && cfg.contact.whatsapp) {
                vcardLines.push(`URL;type=WhatsApp:https://wa.me/${cfg.contact.whatsapp}`);
            }

            // Social media links & profiles
            if (cfg.socials && cfg.socials.length) {
                cfg.socials.forEach(s => {
                    vcardLines.push(`URL;type=${s.platform}:${s.url}`);
                    vcardLines.push(`X-SOCIALPROFILE;type=${s.platform.toLowerCase()}:${s.url}`);
                });
            }

            // Address
            if (cfg.vcard && (cfg.vcard.addressStreet || cfg.vcard.addressCity)) {
                vcardLines.push(`ADR;TYPE=WORK:;;${cfg.vcard.addressStreet || ''};${cfg.vcard.addressCity || ''};${cfg.vcard.addressState || ''};;${cfg.vcard.addressCountry || ''}`);
            }

            vcardLines.push('END:VCARD');

            const vcardContent = vcardLines.join('\r\n');
            const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${cfg.company.name.replace(/\s+/g, '_')}.vcf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        });
    }
});
