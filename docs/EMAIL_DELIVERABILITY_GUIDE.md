# Email Deliverability Guide - Preventing Spam

## Overview

This guide helps you improve email deliverability and prevent emails from going to spam. Following these steps will significantly improve your email reputation.

## Critical Steps

### 1. DNS Records Setup (MOST IMPORTANT)

You need to set up three DNS records for your domain (`bgr8.uk`). These prove you own the domain and authorize sending emails.

#### SPF (Sender Policy Framework) Record

**Purpose**: Authorizes which servers can send emails on behalf of your domain.

**Add this TXT record to your DNS:**
```
Type: TXT
Name: @ (or bgr8.uk)
Value: v=spf1 include:zoho.com ~all
TTL: 3600
```

**For Zoho EU region:**
```
Type: TXT
Name: @ (or bgr8.uk)
Value: v=spf1 include:zoho.eu ~all
TTL: 3600
```

#### DKIM (DomainKeys Identified Mail) Record

**Purpose**: Cryptographically signs emails to prove they're from your domain.

**Steps:**

For Zoho Mail, DKIM is typically set up automatically when you add your domain. However, you may need to verify it:

**Option 1: Check Zoho Mail Admin Console (if you have admin access)**
1. Log into your Zoho Mail Admin Console (admin.zoho.com or admin.zoho.eu)
2. Go to **Mail Administration** → **Domains** → Select your domain
3. Look for **Email Authentication** or **DNS Settings**
4. You should see DKIM information there

**Option 2: Zoho automatically configures DKIM**
Zoho Mail usually sets up DKIM automatically. You can verify it's working by:
1. Sending a test email
2. Checking the email headers in Gmail/Outlook
3. Looking for "dkim=pass" in the headers

**If you need to manually set up DKIM:**
Contact Zoho Mail support or check your domain's DNS records - Zoho may have already added the DKIM record when you added your domain to Zoho Mail.

#### DMARC (Domain-based Message Authentication) Record

**Purpose**: Tells receiving servers what to do with emails that fail SPF/DKIM checks.

**Add this TXT record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:info@bgr8.uk; ruf=mailto:info@bgr8.uk; pct=100
TTL: 3600
```

**DMARC Policy Options:**
- `p=none` - Monitor only (start here)
- `p=quarantine` - Send failed emails to spam (recommended after testing)
- `p=reject` - Reject failed emails completely (use after confirming everything works)

### 2. Verify DNS Records

After adding DNS records, verify they're working:

**Online Tools:**
- https://mxtoolbox.com/spf.aspx (SPF checker)
- https://mxtoolbox.com/dkim.aspx (DKIM checker)
- https://mxtoolbox.com/dmarc.aspx (DMARC checker)
- https://www.dmarcanalyzer.com/ (Comprehensive DMARC analysis)

**Wait Time**: DNS changes can take 24-48 hours to propagate globally.

### 3. Email Content Best Practices

#### ✅ DO:
- Use a clear, professional "From" name (e.g., "Bgr8 Team")
- Include a plain text version alongside HTML
- Use proper email structure with headers
- Include unsubscribe links
- Keep subject lines clear and relevant
- Use your domain email address (info@bgr8.uk)

#### ❌ DON'T:
- Use spam trigger words (FREE, CLICK HERE, URGENT, etc.)
- Use all caps in subject lines
- Include too many links or images
- Use URL shorteners (bit.ly, etc.)
- Send from free email addresses (gmail.com, yahoo.com)
- Use excessive exclamation marks!!!

### 4. Email Server Configuration

The email server has been updated to include:
- ✅ Plain text version of emails
- ✅ Proper email headers (List-Unsubscribe, Return-Path, etc.)
- ✅ Reply-To header set correctly
- ✅ Unique Message-IDs
- ✅ Proper envelope information

### 5. Warm Up Your Domain/IP

**New domains/IPs need time to build reputation:**

1. **Start Small**: Send to a small list of engaged users first
2. **Gradual Increase**: Slowly increase volume over weeks
3. **Monitor Metrics**: Watch bounce rates, spam complaints, open rates
4. **Maintain Engagement**: Keep users engaged to build positive reputation

### 6. Monitor Your Reputation

**Key Metrics to Track:**
- **Bounce Rate**: Should be < 2%
- **Spam Complaint Rate**: Should be < 0.1%
- **Open Rate**: Higher is better (indicates engagement)
- **Delivery Rate**: Should be > 95%

**Tools:**
- Zoho Mail Analytics
- Google Postmaster Tools (for Gmail)
- Microsoft SNDS (for Outlook/Hotmail)

### 7. Common Issues and Fixes

#### Issue: Emails going to Gmail spam
**Solution:**
- Set up SPF, DKIM, DMARC records
- Use Google Postmaster Tools to monitor
- Ensure low bounce/complaint rates
- Warm up domain gradually

#### Issue: Emails going to Outlook spam
**Solution:**
- Register with Microsoft SNDS
- Ensure proper authentication
- Monitor sender reputation
- Avoid spam trigger words

#### Issue: High bounce rate
**Solution:**
- Clean your email list
- Remove invalid addresses
- Use double opt-in
- Handle bounces properly

### 8. Testing Your Setup

**Test Email Deliverability:**
1. Send test emails to multiple providers:
   - Gmail
   - Outlook/Hotmail
   - Yahoo
   - Your own domain email

2. Check spam folders
3. Use email testing tools:
   - https://www.mail-tester.com/ (scores 0-10, aim for 8+)
   - https://www.mailgenius.com/
   - https://glockapps.com/

### 9. Zoho-Specific Settings

**For Zoho Mail:**

Zoho Mail automatically handles most email authentication when you add your domain. However, you need to ensure your DNS records are correct:

**What Zoho Does Automatically:**
- DKIM signing (usually automatic)
- SPF validation (checks your DNS record)

**What You Need to Do:**
1. Add SPF record to your DNS (see Step 1 above)
2. Add DMARC record to your DNS (see Step 1 above)
3. Verify DKIM is working (Zoho usually sets this up automatically)

**Verify Your Setup:**
1. Send a test email to yourself (preferably Gmail)
2. Open the email and click "Show original" or "View source"
3. Look for these headers:
   - `SPF: PASS` (or `SPF: SOFTFAIL` initially is okay)
   - `DKIM: PASS`
   - `DMARC: PASS` (if you've set up DMARC)

**Zoho Mail Admin Console (Optional):**
If you have admin access:
1. Go to admin.zoho.com (or admin.zoho.eu for EU)
2. Navigate to **Mail Administration** → **Domains**
3. Check your domain status and DNS records

### 10. Ongoing Maintenance

**Regular Tasks:**
- Monitor bounce rates weekly
- Review spam complaints monthly
- Update DMARC policy gradually (none → quarantine → reject)
- Keep DNS records up to date
- Monitor sender reputation

## Quick Checklist

**DNS Records (Most Important):**
- [ ] SPF record added to DNS (`v=spf1 include:zoho.eu ~all` for EU)
- [ ] DMARC record added to DNS (`v=DMARC1; p=none; rua=mailto:info@bgr8.uk`)
- [ ] DNS records verified using mxtoolbox.com (24-48 hours after adding)
- [ ] DKIM verified (check email headers for "dkim=pass" - Zoho usually handles this automatically)

**Testing:**
- [ ] Test email sent and checked in inbox (not spam)
- [ ] Email headers checked (SPF, DKIM, DMARC should all show PASS)
- [ ] Mail-tester.com score checked (aim for 8+)
- [ ] Tested with multiple email providers (Gmail, Outlook, etc.)

**Email Configuration:**
- [ ] Email server updated with proper headers
- [ ] Plain text version included in emails
- [ ] Reply-To header configured
- [ ] Using domain email address (info@bgr8.uk, not Gmail/Yahoo)

## Additional Resources

- [Zoho Mail Authentication Guide](https://help.zoho.com/portal/en/kb/mail/email-authentication/articles/spf-dkim-dmarc)
- [Google Postmaster Tools](https://postmaster.google.com/)
- [Microsoft SNDS](https://sendersupport.olc.protection.outlook.com/snds/)
- [DMARC.org Guide](https://dmarc.org/wiki/FAQ)

## Support

If emails are still going to spam after following this guide:
1. Check DNS records are correct (use mxtoolbox.com)
2. Wait 24-48 hours for DNS propagation
3. Test with mail-tester.com
4. Check Zoho Mail authentication status
5. Review email content for spam triggers
6. Monitor bounce and complaint rates

