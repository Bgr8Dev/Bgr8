const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Email rate limiting (more restrictive)
const emailLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 email requests per minute
  message: 'Too many email requests, please try again later.'
});

// Validation schemas
const emailSchema = Joi.object({
  to: Joi.array().items(Joi.string().email()).min(1).required(),
  cc: Joi.array().items(Joi.string().email()).optional(),
  bcc: Joi.array().items(Joi.string().email()).optional(),
  subject: Joi.string().min(1).max(200).required(),
  content: Joi.string().min(1).max(1000000).required(),
  contentType: Joi.string().valid('text/plain', 'text/html').default('text/html'),
  fromEmail: Joi.string().email().optional(),
  fromName: Joi.string().max(100).optional(),
  attachments: Joi.array().items(Joi.object({
    fileName: Joi.string().required(),
    content: Joi.string().required(),
    contentType: Joi.string().required()
  })).optional()
});

const bulkEmailSchema = Joi.object({
  messages: Joi.array().items(emailSchema).min(1).max(50).required()
});

// Zoho Mail API functions
async function getZohoAccessToken() {
  console.log('🔑 Attempting to get Zoho access token...');
  
  // Check if required environment variables are set
  if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET || !process.env.ZOHO_REFRESH_TOKEN) {
    throw new Error('Missing Zoho configuration. Please check ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN environment variables.');
  }

  const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    }),
  });

  console.log('🔑 Zoho token response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Zoho token error response:', errorText);
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Zoho access token obtained successfully');
  return data.access_token;
}

// SMTP Email sending function (more reliable than API)
async function sendSMTPEmail(emailData) {
  console.log('📧 Preparing to send email via SMTP...');
  console.log('📧 Email data:', {
    to: emailData.to,
    subject: emailData.subject,
    contentType: emailData.contentType,
    fromEmail: process.env.ZOHO_FROM_EMAIL
  });
  console.log('📧 SMTP credentials check:', {
    user: process.env.ZOHO_FROM_EMAIL,
    hasPassword: !!process.env.ZOHO_PASSWORD,
    passwordLength: process.env.ZOHO_PASSWORD?.length || 0,
    passwordPreview: process.env.ZOHO_PASSWORD ? process.env.ZOHO_PASSWORD.substring(0, 8) + '...' : 'undefined'
  });

  // Create SMTP transporter with multiple options
  const smtpConfigs = [
    // Option 1: Standard SMTP
    {
      host: 'smtp.zoho.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ZOHO_SMTP_EMAIL || process.env.ZOHO_FROM_EMAIL || 'info@bgr8.uk',
        pass: process.env.ZOHO_SMTP_PASSWORD || process.env.ZOHO_APP_PASSWORD || process.env.ZOHO_PASSWORD
      },
      tls: { rejectUnauthorized: false }
    },
    // Option 2: Secure SMTP
    {
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_SMTP_EMAIL || process.env.ZOHO_FROM_EMAIL || 'info@bgr8.uk',
        pass: process.env.ZOHO_SMTP_PASSWORD || process.env.ZOHO_APP_PASSWORD || process.env.ZOHO_PASSWORD
      },
      tls: { rejectUnauthorized: false }
    }
  ];

  let transporter;
  let lastError;

  // Try different SMTP configurations
  for (const config of smtpConfigs) {
    try {
      console.log(`📧 Trying SMTP config: ${config.host}:${config.port} (secure: ${config.secure})`);
      transporter = nodemailer.createTransport(config);
      
      // Test the connection
      await transporter.verify();
      console.log(`✅ SMTP connection successful with ${config.host}:${config.port}`);
      break;
    } catch (error) {
      console.log(`❌ SMTP config failed: ${config.host}:${config.port} - ${error.message}`);
      lastError = error;
    }
  }

  if (!transporter) {
    throw new Error(`All SMTP configurations failed. Last error: ${lastError.message}`);
  }

  // Email options
  const fromEmail = process.env.ZOHO_SMTP_EMAIL || process.env.ZOHO_FROM_EMAIL || 'info@bgr8.uk';
  const mailOptions = {
    from: `"${process.env.ZOHO_FROM_NAME || 'Bgr8 Team'}" <${fromEmail}>`,
    to: emailData.to.join(', '),
    cc: emailData.cc?.join(', ') || '',
    bcc: emailData.bcc?.join(', ') || '',
    subject: emailData.subject,
    html: emailData.contentType === 'text/html' ? emailData.content : undefined,
    text: emailData.contentType === 'text/plain' ? emailData.content : undefined,
    attachments: emailData.attachments || []
  };

  console.log('📧 SMTP mail options:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject,
    hasHtml: !!mailOptions.html,
    hasText: !!mailOptions.text
  });

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully via SMTP:', info.messageId);
    return {
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('❌ SMTP error:', error);
    throw new Error(`SMTP error: ${error.message}`);
  }
}

async function sendZohoEmail(emailData) {
  console.log('📧 Preparing to send email via Zoho...');
  console.log('📧 Email data:', {
    to: emailData.to,
    subject: emailData.subject,
    contentType: emailData.contentType,
    fromEmail: process.env.ZOHO_FROM_EMAIL
  });

  const accessToken = await getZohoAccessToken();
  
  const zohoEmailData = {
    fromAddress: process.env.ZOHO_FROM_EMAIL || 'info@bgr8.uk',
    toAddress: emailData.to.join(','),
    ccAddress: emailData.cc?.join(',') || '',
    bccAddress: emailData.bcc?.join(',') || '',
    subject: emailData.subject,
    content: emailData.content,
    mailFormat: emailData.contentType === 'text/html' ? 'html' : 'text',
    attachments: emailData.attachments || []
  };

  console.log('📧 Zoho email payload:', zohoEmailData);

  // Try different Zoho API endpoints and formats
  const apiEndpoints = [
    {
      url: 'https://mail.zoho.com/api/accounts/self/messages',
      data: zohoEmailData
    },
    {
      url: 'https://mail.zoho.com/api/accounts/self/messages/send',
      data: zohoEmailData
    },
    {
      url: 'https://mail.zoho.com/api/accounts/self/messages/sendMail',
      data: zohoEmailData
    },
    {
      url: 'https://mail.zoho.com/api/accounts/self/messages',
      data: {
        fromAddress: zohoEmailData.fromAddress,
        toAddress: zohoEmailData.toAddress,
        subject: zohoEmailData.subject,
        content: zohoEmailData.content,
        mailFormat: zohoEmailData.mailFormat
      }
    }
  ];

  let response;
  let lastError;

  for (const endpoint of apiEndpoints) {
    try {
      console.log(`📧 Trying Zoho API endpoint: ${endpoint.url}`);
      console.log(`📧 With data:`, endpoint.data);
      
      response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(endpoint.data),
      });

      console.log(`📧 Endpoint ${endpoint.url} response status:`, response.status);
      
      if (response.ok) {
        console.log(`✅ Success with endpoint: ${endpoint.url}`);
        break;
      } else {
        const errorText = await response.text();
        console.log(`❌ Endpoint ${endpoint.url} failed:`, errorText);
        lastError = errorText;
      }
    } catch (error) {
      console.log(`❌ Endpoint ${endpoint.url} error:`, error.message);
      lastError = error.message;
    }
  }

  console.log('📧 Zoho API response status:', response.status);

  if (!response || !response.ok) {
    console.error('❌ All Zoho API endpoints failed. Last error:', lastError);
    
    let errorData;
    try {
      errorData = JSON.parse(lastError || '{}');
    } catch {
      errorData = { message: lastError || 'All API endpoints failed' };
    }
    
    throw new Error(`Zoho API error: ${response?.status || 'No response'} ${response?.statusText || 'Connection failed'} - ${errorData.message || errorData.error || 'Unknown error'}`);
  }

  const result = await response.json();
  console.log('✅ Email sent successfully via Zoho:', result);
  return result;
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'bgr8-email-server'
  });
});

// Configuration test endpoint
app.get('/api/config-test', async (req, res) => {
  try {
    console.log('🔧 Testing email configuration...');
    
    const config = {
      hasClientId: !!process.env.ZOHO_CLIENT_ID,
      hasClientSecret: !!process.env.ZOHO_CLIENT_SECRET,
      hasRefreshToken: !!process.env.ZOHO_REFRESH_TOKEN,
      fromEmail: process.env.ZOHO_FROM_EMAIL || 'info@bgr8.uk',
      fromName: process.env.ZOHO_FROM_NAME || 'Bgr8 Team',
      nodeEnv: process.env.NODE_ENV || 'development'
    };
    
    console.log('🔧 Configuration status:', config);
    
    // Try to get access token
    try {
      const accessToken = await getZohoAccessToken();
      config.accessTokenTest = 'success';
      config.accessTokenLength = accessToken ? accessToken.length : 0;
      
      // Test a simple API call to check permissions
      try {
        const testResponse = await fetch('https://mail.zoho.com/api/accounts/self', {
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
          },
        });
        config.apiPermissionsTest = testResponse.ok ? 'success' : 'failed';
        config.apiPermissionsError = testResponse.ok ? null : `Status: ${testResponse.status}`;
      } catch (permError) {
        config.apiPermissionsTest = 'failed';
        config.apiPermissionsError = permError.message;
      }
    } catch (error) {
      config.accessTokenTest = 'failed';
      config.accessTokenError = error.message;
    }
    
    res.json({
      success: true,
      config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Configuration test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test Zoho API setup
app.get('/api/zoho-test', async (req, res) => {
  try {
    console.log('🔍 Testing Zoho API setup...');
    
    const accessToken = await getZohoAccessToken();
    console.log('✅ Access token obtained');
    
    // Test 1: Check if we can access the account info
    try {
      const accountResponse = await fetch('https://mail.zoho.com/api/accounts/self', {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
        },
      });
      
      console.log('📧 Account API response status:', accountResponse.status);
      
      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        console.log('✅ Account API works:', accountData);
        
        res.json({
          success: true,
          message: 'Zoho API is working! The issue is with the email sending endpoint.',
          accountData: accountData,
          nextSteps: [
            '1. Check if your Zoho Mail account has API access enabled',
            '2. Verify the sender email (info@bgr8.uk) is verified in Zoho',
            '3. Check if your domain has proper DNS records (SPF, DKIM)',
            '4. Ensure the Zoho app has email sending permissions'
          ]
        });
      } else {
        const errorText = await accountResponse.text();
        console.log('❌ Account API failed:', errorText);
        
        res.json({
          success: false,
          message: 'Zoho API access failed',
          error: errorText,
          nextSteps: [
            '1. Check your Zoho API credentials',
            '2. Verify the app has the right permissions',
            '3. Check if the Zoho Mail API is enabled for your account'
          ]
        });
      }
    } catch (error) {
      console.log('❌ Account API error:', error.message);
      res.json({
        success: false,
        message: 'Failed to connect to Zoho API',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Zoho test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test email configuration
app.post('/api/email/test', async (req, res) => {
  try {
    // Validate required environment variables
    const requiredEnvVars = [
      'ZOHO_CLIENT_ID',
      'ZOHO_CLIENT_SECRET', 
      'ZOHO_REFRESH_TOKEN',
      'ZOHO_FROM_EMAIL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required environment variables: ${missingVars.join(', ')}`
      });
    }

    // Test Zoho API access
    const accessToken = await getZohoAccessToken();
    
    res.json({
      success: true,
      message: 'Email configuration is valid',
      fromEmail: process.env.ZOHO_FROM_EMAIL
    });
  } catch (error) {
    console.error('Email configuration test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send single email
app.post('/api/email/send', emailLimiter, async (req, res) => {
  try {
    // Validate request
    const { error, value } = emailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    // Use SMTP only (API has permission issues)
    let result;
    try {
      console.log('📧 Attempting SMTP sending...');
      result = await sendSMTPEmail(value);
      console.log('✅ SMTP sending successful');
    } catch (smtpError) {
      console.log('❌ SMTP failed:', smtpError.message);
      throw new Error(`Email sending failed: ${smtpError.message}`);
    }
    
    res.json({
      success: true,
      messageId: result.messageId || `zoho_${Date.now()}`,
      details: result
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send bulk emails
app.post('/api/email/send-bulk', emailLimiter, async (req, res) => {
  try {
    // Validate request
    const { error, value } = bulkEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const results = [];
    
    // Process emails in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < value.messages.length; i += batchSize) {
      const batch = value.messages.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (emailData) => {
        try {
          const result = await sendZohoEmail(emailData);
          return {
            success: true,
            messageId: result.messageId || `zoho_${Date.now()}`,
            details: result
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < value.messages.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    res.json({
      success: true,
      results,
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length
    });
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get email statistics (placeholder)
app.get('/api/email/stats', async (req, res) => {
  try {
    // This would typically query your database for email statistics
    res.json({
      success: true,
      data: {
        totalSent: 0,
        totalOpens: 0,
        totalClicks: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0
      }
    });
  } catch (error) {
    console.error('Error getting email stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Email server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
