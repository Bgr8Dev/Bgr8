import { FeedbackCategory, FeedbackPriority } from '../types/feedback';

export interface AutofillData {
  title: string;
  description: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  tags: string[];
  urlToPage: string;
  browser: string;
  browserVersion: string;
  operatingSystem: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  screenResolution: string;
  stepsToReproduce: string;
  expectedBehavior: string;
  actualBehavior: string;
  severity: 'cosmetic' | 'minor' | 'major' | 'critical' | 'blocker';
  environment: 'development' | 'staging' | 'production';
  testCaseId: string;
  regression: boolean;
  workaround: string;
}

// Comprehensive autofill data sets
export const AUTOFILL_DATASETS: AutofillData[] = [
  {
    title: 'Login Button Not Responding on Homepage',
    description: 'The login button on the homepage is completely unresponsive when clicked. Users cannot access their accounts through the main login interface. The issue appears consistently across different browsers and devices. This is blocking user authentication and preventing access to the platform.',
    category: 'bug',
    priority: 'critical',
    tags: ['login', 'authentication', 'frontend', 'critical', 'blocking'],
    urlToPage: 'https://example.com/login',
    browser: 'Chrome',
    browserVersion: '120.0.6099.109',
    operatingSystem: 'Windows 11',
    deviceType: 'desktop',
    screenResolution: '1920x1080',
    stepsToReproduce: '1. Navigate to the homepage\n2. Locate the "Login" button in the top navigation\n3. Click on the login button\n4. Observe that no action occurs\n5. Check browser console for JavaScript errors',
    expectedBehavior: 'The login button should either redirect to the login page or open a login modal dialog.',
    actualBehavior: 'The login button does nothing when clicked. No redirect occurs, no modal opens, and no visual feedback is provided.',
    severity: 'critical',
    environment: 'production',
    testCaseId: 'TC-AUTH-001',
    regression: true,
    workaround: 'Users can access login by going directly to /login URL or using the mobile app which still works correctly.'
  },
  {
    title: 'Mobile Navigation Menu Overlapping Content',
    description: 'On mobile devices, the navigation menu dropdown overlaps with the main content area, making it impossible to read or interact with content underneath. The z-index appears to be incorrectly set, causing the menu to render above page content instead of pushing it down.',
    category: 'ui_issue',
    priority: 'high',
    tags: ['mobile', 'navigation', 'ui', 'z-index', 'responsive'],
    urlToPage: 'https://example.com/products',
    browser: 'Safari',
    browserVersion: '17.1',
    operatingSystem: 'iOS',
    deviceType: 'mobile',
    screenResolution: '375x667',
    stepsToReproduce: '1. Open the website on a mobile device\n2. Navigate to any product page\n3. Tap the hamburger menu icon\n4. Observe the dropdown menu appearance\n5. Notice content is still visible underneath',
    expectedBehavior: 'The navigation menu should push content down or overlay it properly without making underlying content unreadable.',
    actualBehavior: 'The navigation menu appears above content but with insufficient background opacity, making text underneath difficult to read.',
    severity: 'major',
    environment: 'production',
    testCaseId: 'TC-MOBILE-002',
    regression: false,
    workaround: 'Users can scroll down to avoid the overlapping area or use landscape mode where the issue is less prominent.'
  },
  {
    title: 'Search Results Loading Indefinitely',
    description: 'When users perform a search, the results page shows a loading spinner that never resolves. The search query appears to be processed on the backend but the frontend never receives the response, leaving users stuck on the loading screen indefinitely.',
    category: 'performance',
    priority: 'high',
    tags: ['search', 'loading', 'performance', 'ajax', 'timeout'],
    urlToPage: 'https://example.com/search?q=test',
    browser: 'Firefox',
    browserVersion: '119.0.1',
    operatingSystem: 'macOS',
    deviceType: 'desktop',
    screenResolution: '2560x1440',
    stepsToReproduce: '1. Navigate to the search page\n2. Enter any search term (e.g., "test")\n3. Click the search button or press Enter\n4. Observe the loading spinner\n5. Wait for results (they never appear)',
    expectedBehavior: 'Search results should load within 2-3 seconds and display relevant content.',
    actualBehavior: 'Loading spinner continues indefinitely with no results or error message displayed.',
    severity: 'major',
    environment: 'production',
    testCaseId: 'TC-SEARCH-003',
    regression: true,
    workaround: 'Users can try refreshing the page or using the browser back button, though this doesn\'t always resolve the issue.'
  },
  {
    title: 'Add Dark Mode Toggle to Settings',
    description: 'Users have requested a dark mode feature to reduce eye strain during evening usage. This would involve adding a toggle switch in the user settings panel that switches between light and dark themes. The implementation should remember user preference across sessions.',
    category: 'feature_request',
    priority: 'medium',
    tags: ['dark-mode', 'theme', 'settings', 'accessibility', 'ux'],
    urlToPage: 'https://example.com/settings',
    browser: 'Edge',
    browserVersion: '119.0.2151.58',
    operatingSystem: 'Windows 10',
    deviceType: 'desktop',
    screenResolution: '1366x768',
    stepsToReproduce: '1. Navigate to user settings page\n2. Look for theme or appearance options\n3. Notice no dark mode option exists\n4. Consider user feedback requesting this feature',
    expectedBehavior: 'A dark mode toggle should be available in the appearance section of settings.',
    actualBehavior: 'No dark mode option is currently available in the settings interface.',
    severity: 'minor',
    environment: 'production',
    testCaseId: 'TC-FEATURE-004',
    regression: false,
    workaround: 'Users can use browser extensions or system-level dark mode, though this doesn\'t affect the application interface.'
  },
  {
    title: 'Form Validation Error Messages Not Accessible',
    description: 'Form validation error messages are not properly announced by screen readers, making the form inaccessible to users with visual impairments. The error messages lack proper ARIA attributes and are not associated with the form fields they describe.',
    category: 'accessibility',
    priority: 'high',
    tags: ['accessibility', 'aria', 'screen-reader', 'validation', 'wcag'],
    urlToPage: 'https://example.com/contact',
    browser: 'Chrome',
    browserVersion: '120.0.6099.109',
    operatingSystem: 'Windows 11',
    deviceType: 'desktop',
    screenResolution: '1920x1080',
    stepsToReproduce: '1. Navigate to the contact form\n2. Use a screen reader (NVDA, JAWS, or VoiceOver)\n3. Submit the form with invalid data\n4. Notice error messages appear visually\n5. Observe that screen reader doesn\'t announce the errors',
    expectedBehavior: 'Error messages should be properly announced by screen readers and associated with the relevant form fields.',
    actualBehavior: 'Error messages are visible but not announced by screen readers, leaving users unaware of validation issues.',
    severity: 'major',
    environment: 'production',
    testCaseId: 'TC-A11Y-005',
    regression: false,
    workaround: 'Users must rely on visual inspection to identify form validation errors, which is not accessible.'
  },
  {
    title: 'Password Reset Email Not Delivered',
    description: 'Users requesting password reset emails are not receiving them in their inbox. The system shows a success message but emails are not being sent due to an SMTP configuration issue. This prevents users from recovering their accounts.',
    category: 'security',
    priority: 'critical',
    tags: ['password-reset', 'email', 'smtp', 'security', 'authentication'],
    urlToPage: 'https://example.com/forgot-password',
    browser: 'Chrome',
    browserVersion: '120.0.6099.109',
    operatingSystem: 'Windows 11',
    deviceType: 'desktop',
    screenResolution: '1920x1080',
    stepsToReproduce: '1. Navigate to the forgot password page\n2. Enter a valid email address\n3. Click "Send Reset Email"\n4. See success message appear\n5. Check email inbox (no email received)',
    expectedBehavior: 'Password reset email should be delivered within 5 minutes to the user\'s inbox.',
    actualBehavior: 'Success message appears but no email is delivered, even after waiting 24 hours.',
    severity: 'critical',
    environment: 'production',
    testCaseId: 'TC-SEC-006',
    regression: true,
    workaround: 'Users must contact support directly to manually reset their passwords, which is time-consuming.'
  },
  {
    title: 'Product Images Not Loading on Slow Connections',
    description: 'Product images fail to load on slower internet connections, showing broken image placeholders instead. The images appear to have very large file sizes and no progressive loading or compression, making the product pages unusable for users with limited bandwidth.',
    category: 'performance',
    priority: 'medium',
    tags: ['images', 'performance', 'bandwidth', 'optimization', 'loading'],
    urlToPage: 'https://example.com/products/laptop',
    browser: 'Chrome',
    browserVersion: '120.0.6099.109',
    operatingSystem: 'Windows 11',
    deviceType: 'desktop',
    screenResolution: '1920x1080',
    stepsToReproduce: '1. Simulate slow network connection (3G speed)\n2. Navigate to any product page with images\n3. Observe image loading behavior\n4. Notice broken image placeholders\n5. Wait for images to load (they never do)',
    expectedBehavior: 'Images should load progressively or show optimized versions for slower connections.',
    actualBehavior: 'Images show broken placeholders and never load on slow connections.',
    severity: 'minor',
    environment: 'production',
    testCaseId: 'TC-PERF-007',
    regression: false,
    workaround: 'Users can try refreshing the page or switching to a faster network connection.'
  },
  {
    title: 'Checkout Process Crashes on Mobile',
    description: 'The checkout process consistently crashes when users attempt to complete purchases on mobile devices. The application becomes unresponsive during payment processing, forcing users to restart the process and potentially lose their cart contents.',
    category: 'bug',
    priority: 'critical',
    tags: ['checkout', 'mobile', 'payment', 'crash', 'ecommerce'],
    urlToPage: 'https://example.com/checkout',
    browser: 'Safari',
    browserVersion: '17.1',
    operatingSystem: 'iOS',
    deviceType: 'mobile',
    screenResolution: '414x896',
    stepsToReproduce: '1. Add items to cart on mobile device\n2. Proceed to checkout\n3. Fill in payment information\n4. Click "Complete Purchase"\n5. Observe application becomes unresponsive',
    expectedBehavior: 'Checkout should complete successfully and redirect to confirmation page.',
    actualBehavior: 'Application freezes during payment processing, requiring page refresh and cart reset.',
    severity: 'critical',
    environment: 'production',
    testCaseId: 'TC-ECOMMERCE-008',
    regression: true,
    workaround: 'Users must complete purchases on desktop devices, which is inconvenient for mobile users.'
  },
  {
    title: 'User Profile Photos Not Updating',
    description: 'When users upload new profile photos, the old image continues to display throughout the application. The new image appears to upload successfully but the UI continues to show the previous photo, requiring a browser refresh to see the update.',
    category: 'bug',
    priority: 'medium',
    tags: ['profile', 'upload', 'caching', 'images', 'ui'],
    urlToPage: 'https://example.com/profile/edit',
    browser: 'Firefox',
    browserVersion: '119.0.1',
    operatingSystem: 'Linux',
    deviceType: 'desktop',
    screenResolution: '2560x1440',
    stepsToReproduce: '1. Navigate to profile edit page\n2. Click on current profile photo\n3. Upload a new image\n4. See success message\n5. Navigate to other pages (old photo still shows)',
    expectedBehavior: 'New profile photo should appear immediately across all pages in the application.',
    actualBehavior: 'Old profile photo continues to display until browser refresh is performed.',
    severity: 'minor',
    environment: 'production',
    testCaseId: 'TC-PROFILE-009',
    regression: false,
    workaround: 'Users can refresh the browser or clear cache to see the updated profile photo.'
  },
  {
    title: 'Add Export Functionality to Reports',
    description: 'Users need the ability to export report data to CSV and PDF formats for offline analysis and sharing. Currently, reports can only be viewed within the application, limiting their utility for business purposes and collaboration.',
    category: 'feature_request',
    priority: 'medium',
    tags: ['reports', 'export', 'csv', 'pdf', 'business'],
    urlToPage: 'https://example.com/reports',
    browser: 'Chrome',
    browserVersion: '120.0.6099.109',
    operatingSystem: 'Windows 11',
    deviceType: 'desktop',
    screenResolution: '1920x1080',
    stepsToReproduce: '1. Navigate to the reports section\n2. Generate any report\n3. Look for export options\n4. Notice no export functionality exists\n5. Consider business need for data export',
    expectedBehavior: 'Export buttons should be available for CSV and PDF formats in the report interface.',
    actualBehavior: 'No export functionality is currently available in the reports section.',
    severity: 'minor',
    environment: 'production',
    testCaseId: 'TC-FEATURE-010',
    regression: false,
    workaround: 'Users can take screenshots or copy data manually, though this is time-consuming and error-prone.'
  }
];

// Utility function to get random autofill data
export const getRandomAutofillData = (): AutofillData => {
  const randomIndex = Math.floor(Math.random() * AUTOFILL_DATASETS.length);
  return AUTOFILL_DATASETS[randomIndex];
};

// Utility function to get specific autofill data by category
export const getAutofillDataByCategory = (category: FeedbackCategory): AutofillData[] => {
  return AUTOFILL_DATASETS.filter(data => data.category === category);
};

// Utility function to get autofill data by priority
export const getAutofillDataByPriority = (priority: FeedbackPriority): AutofillData[] => {
  return AUTOFILL_DATASETS.filter(data => data.priority === priority);
};
