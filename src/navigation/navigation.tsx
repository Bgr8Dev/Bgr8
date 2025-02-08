// src/Navigation.tsx
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import B8Marketing from '../pages/B8Marketing';
import BGr8 from '../pages/BGr8';
import B8CarClub from '../pages/B8CarClub';
import B8Clothing from '../pages/B8Clothing';
import B8FootballClub from '../pages/B8FootballClub';
import B8Charity from '../pages/B8Charity';
import B8Education from '../pages/B8Education';
import B8Careers from '../pages/B8Careers';

export default function Navigation() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/b8-marketing" element={<B8Marketing />} />
      <Route path="/bgr8" element={<BGr8 />} />
      <Route path="/b8-car-club" element={<B8CarClub />} />
      <Route path="/b8-clothing" element={<B8Clothing />} />
      <Route path="/b8-football-club" element={<B8FootballClub />} />
      <Route path="/b8-charity" element={<B8Charity />} />
      <Route path="/b8-education" element={<B8Education />} />
      <Route path="/b8-careers" element={<B8Careers />} />
    </Routes>
  );
}
