# Project-Specific Rules and Patterns

## Bgr8 Website Specific Standards

### Component Creation
- When creating new components, follow the existing patterns in `src/components/`
- Use the existing UI components as building blocks
- Implement proper TypeScript interfaces
- Include appropriate CSS styling

### Page Creation
- Follow the existing page structure in `src/pages/`
- Use the existing navigation patterns
- Implement proper authentication checks when needed
- Follow the existing responsive design patterns

### API Integration
- Use the existing service patterns in `src/services/`
- Implement proper error handling
- Use TypeScript types for API responses
- Follow the existing data fetching patterns

## Development Workflow

### Git and Version Control

#### Commit Messages
- Use conventional commit format
- Be descriptive and clear
- Reference issues when applicable

#### Branch Naming
- Use descriptive branch names
- Follow the existing naming patterns
- Use feature branches for new development

### Build and Deployment

#### Development
- Use the existing Vite configuration
- Follow the existing build scripts
- Use the Firebase emulator for local development
- Test builds before deployment

#### Production
- Ensure all environment variables are properly configured
- Test the production build locally
- Use the existing deployment scripts and configurations

## Mentoring Platform Specific Rules

### User Management
- Follow the existing user profile patterns
- Use the existing role management system
- Implement proper mentor/mentee relationships
- Handle user verification appropriately

### Session Management
- Use the existing session booking patterns
- Implement proper session state management
- Handle session scheduling appropriately
- Use the existing session data structures

### Admin Portal
- Follow the existing admin portal patterns
- Use the existing admin permission system
- Implement proper admin-only features
- Handle admin data appropriately

## Email Service Integration

### Email Service Usage
- Use the existing email service patterns
- Follow the existing email configuration
- Implement proper email templates
- Handle email delivery appropriately

### Email Templates
- Use the existing email template structure
- Implement proper email styling
- Handle email personalization
- Use proper email validation

## Security Implementation

### Rate Limiting
- Use the existing rate limiting implementation
- Follow the existing brute force protection patterns
- Implement proper security monitoring
- Handle security events appropriately

### Authentication Flow
- Use the existing authentication patterns
- Follow the existing security utilities
- Implement proper session management
- Handle authentication errors properly

## Mobile Responsiveness

### Mobile-First Design
- Use the existing mobile-first patterns
- Follow the existing responsive design guidelines
- Use the `useIsMobile` hook appropriately
- Test on various mobile devices

### Touch Interactions
- Implement proper touch interactions
- Use appropriate touch targets
- Handle mobile-specific gestures
- Ensure mobile accessibility

## Data Management

### Firestore Integration
- Use the existing Firestore patterns
- Follow the existing data structure
- Implement proper data validation
- Handle offline scenarios appropriately

### Data Validation
- Use the existing validation patterns
- Implement proper input sanitization
- Handle data integrity appropriately
- Use proper error handling

## Performance Standards

### Loading States
- Implement proper loading states
- Use the existing loading patterns
- Handle slow network connections
- Provide appropriate user feedback

### Caching Strategies
- Use the existing caching patterns
- Implement proper cache invalidation
- Handle cache consistency
- Optimize for performance

## Forbidden Project Practices

- DO NOT bypass existing security measures
- DO NOT ignore authentication requirements
- DO NOT bypass the established component patterns
- DO NOT ignore mobile responsiveness requirements
- DO NOT bypass the existing data validation patterns
- DO NOT ignore the established error handling patterns

## When in Doubt

- Follow existing patterns in the codebase
- Use the existing utilities and hooks
- Check similar components for reference
- Ensure consistency with the existing code style
- Test thoroughly before submitting changes
- Consult the existing documentation and examples
