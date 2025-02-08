// src/components/Footer.tsx
import '../styles/HomePage.css';

export default function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} B8. All rights reserved.</p>
    </footer>
  );
}
