import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to homepage after 5 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="not-found-page">
      <h1>404 - Page Not Found 🚧</h1>
      <p>Oops! The page you're looking for doesn't exist.</p>
      <p>You'll be redirected to the homepage shortly.</p>
      <button onClick={() => navigate('/')}>Go to Homepage Now</button>
    </div>
  );
}
