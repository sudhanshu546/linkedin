# LinkedIn Frontend - TypeScript Project Structure

## Project Overview

This is a modern LinkedIn-like social platform built with React 19 and TypeScript. All API calls go through the API Gateway on port 9191.

## Project Structure

```
src/
├── api/                           # API integration layer
│   ├── axiosConfig.ts            # Axios instance with token management
│   ├── userApi.ts                # User service endpoints
│   ├── postApi.ts                # Feed/Post service endpoints
│   ├── profileApi.ts             # Profile service endpoints
│   ├── jobApi.ts                 # Job service endpoints
│   ├── notificationApi.ts        # Notification service endpoints
│   └── index.ts                  # Centralized API exports
│
├── components/                    # React Components
│   ├── common/                   # Reusable components
│   │   ├── Navbar.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Avatar.tsx
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   └── ...
│   ├── pages/                    # Page/Route components
│   │   ├── Login/
│   │   ├── Signup/
│   │   ├── Home/
│   │   ├── Profile/
│   │   ├── Feed/
│   │   ├── Jobs/
│   │   ├── Network/
│   │   ├── Notifications/
│   │   └── ...
│   ├── forms/                    # Form components
│   │   ├── LoginForm.tsx
│   │   ├── ProfileForm.tsx
│   │   ├── PostForm.tsx
│   │   ├── JobForm.tsx
│   │   └── ...
│   └── AuthWrapper.tsx           # Auth protection wrapper
│
├── context/                       # React Context (Global State)
│   ├── UserContext.tsx           # User authentication & profile
│   └── NotificationContext.tsx   # Notifications management
│
├── hooks/                         # Custom React Hooks
│   ├── useAsync.ts               # Async data fetching
│   ├── useForm.ts                # Form state management
│   ├── usePagination.ts          # Pagination logic
│   ├── useDebounce.ts            # Debounced values
│   ├── useLocalStorage.ts        # LocalStorage management
│   └── index.ts                  # Hook exports
│
├── utils/                         # Utility Functions
│   ├── dateUtils.ts              # Date formatting & manipulation
│   ├── validation.ts             # Form validation & email checks
│   ├── storageUtils.ts           # LocalStorage helpers
│   ├── errorHandler.ts           # API error handling
│   └── index.ts                  # Utility exports
│
├── constants/                     # Application Constants
│   ├── api.ts                    # API endpoints (port 9191)
│   ├── messages.ts               # Error & success messages
│   └── index.ts                  # Constants exports
│
├── types/                         # TypeScript Type Definitions
│   ├── index.ts                  # All type definitions
│   └── interfaces.ts             # Shared interfaces
│
├── styles/                        # Global & Component Styles
│   ├── index.css                 # Global styles (imports all)
│   ├── variables.css             # CSS custom properties
│   ├── typography.css            # Typography classes
│   ├── buttons.css               # Button styles
│   ├── forms.css                 # Form styles
│   └── components.css            # Component-specific styles
│
├── App.tsx                        # Main app component
├── App.css                        # Legacy (migrate to /styles/)
├── index.tsx                      # React entry point
└── ...
```

## API Integration (Port 9191)

All API calls route through the API Gateway running on port 9191:

```
http://localhost:9191
```

Organized by microservices:
- **User Service** (`/us/*`) - Authentication, users
- **Profile Service** (`/ps/*`) - Profiles, feed, connections
- **Job Service** (`/js/*`) - Job postings, applications
- **Notification Service** (`/ns/*`) - Notifications
- **Chat Service** (`/cs/*`) - Messaging

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Update variables if needed (defaults work for local development)

### Development

```bash
npm start
```

Runs on: `http://localhost:3000`

### Build

```bash
npm run build
```

### Testing

```bash
npm test
```

## API Usage Examples

### Fetching User Data

```typescript
import { getUserDetail } from '@/api';

async function loadUser() {
  try {
    const response = await getUserDetail();
    const user = response.result;
    // Use user data
  } catch (error) {
    console.error('Failed to load user');
  }
}
```

### Creating a Post

```typescript
import { createPost } from '@/api';

async function publishPost(content: string, images?: File[]) {
  try {
    const response = await createPost({ content, images });
    // Post created successfully
  } catch (error) {
    // Handle error
  }
}
```

### Using Custom Hooks

```typescript
import { useAsync, useForm } from '@/hooks';
import { getUserDetail } from '@/api';

function MyComponent() {
  // Async data fetching
  const { data: user, isLoading, error } = useAsync(() => getUserDetail());

  // Form management
  const { values, errors, handleChange, handleSubmit } = useForm(
    { email: '' },
    async (values) => { /* submit logic */ }
  );

  return (/* Component JSX */);
}
```

## Type Safety

All API responses are strongly typed:

```typescript
import { ApiResponse, User } from '@/types';
import { getUserDetail } from '@/api';

async function example() {
  const response: ApiResponse<User> = await getUserDetail();
  // TypeScript knows response.result is of type User
  const user: User = response.result;
}
```

## Authentication Flow

1. Login via `userApi.userLogin()`
2. Tokens stored via `storageUtils.setTokens()`
3. Axios interceptors automatically include auth headers
4. Token refresh on 401 response
5. Logout clears tokens and redirects

## Component Organization

### Common Components (`/common/`)
Reusable UI components used across multiple pages:
- Navbar, Card, Button, Avatar, Badge, etc.

### Page Components (`/pages/`)
Fullscreen page components (one per route):
- Each should be in its own folder with its TSX file

### Form Components (`/forms/`)
Specialized form components:
- Separate from page components for reusability

## Best Practices

1. **API Calls**: Always use typed imports from `/api/index.ts`
2. **State Management**: Use Context API for global state (auth, notifications)
3. **Local State**: Use `useState` for component-local state
4. **Form Handling**: Use `useForm` hook for forms
5. **Data Fetching**: Use `useAsync` hook
6. **Styling**: Import from `/styles/index.css` globally
7. **Error Handling**: Use `handleApiError()` utility
8. **Type Everything**: Leverage TypeScript for type safety

## Environment Variables

```
REACT_APP_API_BASE_URL      # API Gateway URL (default: http://localhost:9191)
REACT_APP_KEYCLOAK_URL      # Keycloak server
REACT_APP_WS_URL            # WebSocket URL for real-time updates
REACT_APP_ENV               # Environment (development/production)
REACT_APP_ENABLE_*          # Feature flags
```

## Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (one-way operation)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the project structure
2. Use TypeScript for type safety
3. Use utility functions from `/utils/`
4. Keep components small and focused
5. Document complex logic

## Troubleshooting

### API Gateway Connection Issues
- Ensure API Gateway is running on port 9191
- Check `.env.local` has correct `REACT_APP_API_BASE_URL`

### Authentication Issues
- Clear browser cache/local storage
- Check refresh token endpoint in `axiosConfig.ts`
- Verify Keycloak/auth service is accessible

### CORS Issues
- API Gateway should have CORS enabled for localhost:3000
- Check CORS configuration on backend

## Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Create React App](https://create-react-app.dev)
- [Axios Documentation](https://axios-http.com)
