// src/components/Navbar.tsx
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';
import logo from '../assets/B8-logo-transparent.png';

export default function Navbar() {
  return (
    <header className="header">
      <h1 className="logo">
        <Link to="/">
          <img src={logo} alt="B8 Logo" />
        </Link>
      </h1>

      <nav className="nav">
        <Link to="/">Home</Link>
        <Link to="/b8-marketing">B8 Marketing</Link>
        <Link to="/bgr8">Bgr8</Link>
        <Link to="/b8-car-club">B8 Car Club</Link>
        <Link to="/b8-clothing">B8 Clothing</Link>
        <Link to="/b8-football-club">B8 Football Club</Link>
        <Link to="/b8-charity">B8 Charity</Link>
        <Link to="/b8-education">B8 Education</Link>
        <Link to="/b8-careers">B8 Careers</Link>
      </nav>
    </header>
  );
}
