// src/App.tsx
import { BrowserRouter as Router } from 'react-router-dom';
import Navigation from './navigation/navigation';

export default function App() {
  return (
    <Router>
      <Navigation />
    </Router>
  );
}
