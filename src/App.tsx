// src/App.tsx
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './navigation/navigation';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </Router>
  );
}

export default App;
