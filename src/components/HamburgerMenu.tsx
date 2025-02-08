// src/components/HamburgerMenu.tsx
import { Link } from 'react-router-dom';
import { useState } from 'react';
import '../styles/Navbar.css';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="hamburger-menu">
      <div className="menu-icon" onClick={toggleMenu}>
        ☰
      </div>
      {isOpen && (
        <nav className="mobile-nav">
          <Link to="/" onClick={toggleMenu}>Home</Link>
          <Link to="/b8-marketing" onClick={toggleMenu}>B8 Marketing</Link>
          <Link to="/bgr8" onClick={toggleMenu}>BGr8</Link>
          <Link to="/b8-car-club" onClick={toggleMenu}>B8 Car Club</Link>
          <Link to="/b8-clothing" onClick={toggleMenu}>B8 Clothing</Link>
          <Link to="/b8-football-club" onClick={toggleMenu}>B8 Football Club</Link>
          <Link to="/b8-charity" onClick={toggleMenu}>B8 Charity</Link>
          <Link to="/b8-education" onClick={toggleMenu}>B8 Education</Link>
          <Link to="/b8-careers" onClick={toggleMenu}>B8 Careers</Link>
        </nav>
      )}
    </div>
  );
}
