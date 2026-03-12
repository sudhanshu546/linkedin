/**
 * Migration Guide: JavaScript to TypeScript
 * 
 * STEP-BY-STEP MIGRATION INSTRUCTIONS
 */

# Migration Steps

## 1. Rename Files
```bash
# Rename all existing JS files to TSX/TS
src/App.js → src/App.tsx
src/components/*.js → src/components/**/*.tsx
src/context/*.js → src/context/**/*.ts/tsx
# etc.
```

## 2. Update Imports in Each File

### Before (JavaScript):
```javascript
import api from './api/axiosConfig';
import { useContext } from 'react';
```

### After (TypeScript):
```typescript
import api from '@/api';
import { useContext } from 'react';
import type { User, Post } from '@/types';
```

## 3. Add Type Annotations

### Components:
```typescript
import React from 'react';
import type { FC } from 'react';

interface MyComponentProps {
  title: string;
  onClick: () => void;
}

const MyComponent: FC<MyComponentProps> = ({ title, onClick }) => {
  return <button onClick={onClick}>{title}</button>;
};

export default MyComponent;
```

### API Calls:
```typescript
import { getUserDetail, loginUser } from '@/api';
import type { User, ApiResponse } from '@/types';

const user: ApiResponse<User> = await getUserDetail();
```

### Hooks:
```typescript
import { useState } from 'react';
import type { User } from '@/types';

const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(false);
```

## 4. Update React Context

### Before:
```javascript
const UserContext = createContext();
export const UserProvider = ({ children }) => {
  return <UserContext.Provider value={...}>...</UserContext.Provider>;
};
```

### After:
```typescript
import React, { createContext, useState, ReactNode } from 'react';
import type { User, UserContextType } from '@/types';

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  return (
    <UserContext.Provider value={{...}}>
      {children}
    </UserContext.Provider>
  );
};
```

## 5. Handle Existing Components

For components in the root `/components` folder, move them to appropriate locations:

```
src/components/
├── LoginPage.js          → src/components/pages/Login/LoginPage.tsx
├── SignupPage.js         → src/components/pages/Signup/SignupPage.tsx
├── Navbar.js             → src/components/common/Navbar.tsx
├── ErrorBoundary.js      → src/components/common/ErrorBoundary.tsx
├── Feed.js               → src/components/pages/Feed/Feed.tsx
├── HomePage.js           → src/components/pages/Home/HomePage.tsx
├── ProfilePage.js        → src/components/pages/Profile/ProfilePage.tsx
├── EditProfilePage.js    → src/components/pages/Profile/EditProfilePage.tsx
├── JobsPage.js           → src/components/pages/Jobs/JobsPage.tsx
├── PostJobPage.js        → src/components/pages/Jobs/PostJobPage.tsx
├── JobManagementPage.js  → src/components/pages/Jobs/JobManagementPage.tsx
├── MyNetworkPage.js      → src/components/pages/Network/MyNetworkPage.tsx
├── NotificationsPage.js  → src/components/pages/Notifications/NotificationsPage.tsx
├── ProfileViewsPage.js   → src/components/pages/ProfileViews/ProfileViewsPage.tsx
└── SearchResultsPage.js  → src/components/pages/Search/SearchResultsPage.tsx
```

## 6. Update Main App Component

Already done! The new `App.tsx` is set up with the structure.

## 7. Update index.js (now index.tsx)

Already done! See the new `index.tsx` file.

## 8. Update package.json (if needed)

Ensure these scripts are present:
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

## 9. Troubleshooting During Migration

### Issue: Path aliases not working
**Solution**: Ensure `tsconfig.json` has baseUrl and paths configured ✓ (Already done)

### Issue: Import statements showing errors
**Solution**: Verify @/xxx paths map correctly in tsconfig.json

### Issue: React types missing
**Solution**: Install types if needed:
```bash
npm install --save-dev @types/react @types/react-dom
```

### Issue: Component doesn't export correctly
**Solution**: Ensure default export:
```typescript
export default MyComponent;
```

## 10. File-by-file Migration Checklist

- [ ] Convert all .js to .tsx/.ts
- [ ] Move components to correct folders
- [ ] Update imports to use @ aliases
- [ ] Add type annotations
- [ ] Test each component
- [ ] Update unit tests (if any)
- [ ] Remove old .js files

## Next Steps

1. Start with critical components (AuthWrapper, Navbar)
2. Test authentication flow
3. Test API calls with new types
4. Test page components
5. Deploy to staging

## File-by-File Template

Create new component files using this template:

```typescript
/**
 * Component Name
 * Brief description of what this component does
 */

import React from 'react';
import type { FC } from 'react';
import { useContext } from 'react';

// Import types
import type { User, Post } from '@/types';

// Import utilities
import { formatDate } from '@/utils';

// Import styles
import './ComponentName.css';

interface ComponentNameProps {
  title: string;
  data?: User[];
  onAction?: () => void;
}

const ComponentName: FC<ComponentNameProps> = ({ title, data, onAction }) => {
  const [state, setState] = React.useState<string>('');

  React.useEffect(() => {
    // Side effects here
  }, []);

  return (
    <div className="component-name">
      <h2>{title}</h2>
      {/* Component JSX */}
    </div>
  );
};

export default ComponentName;
```
