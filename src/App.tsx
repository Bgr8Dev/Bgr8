// src/App.tsx
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BusinessAccessProvider } from './contexts/BusinessAccessContext';
import Navigation from './navigation/navigation';

function App() {
  return (
    <Router>
      <AuthProvider>
        <BusinessAccessProvider>
          <Navigation />
        </BusinessAccessProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
