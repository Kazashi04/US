import React, { useState, useMemo } from 'react';

interface HeroProps {
  onSearch: (query: string) => void;
}

interface Particle {
  id: number;
  size: number;
  left: number;
  duration: number;
  delay: number;
}

export const Hero: React.FC<HeroProps> = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState('');

  const particles = useMemo<Particle[]>(() => {
    const arr: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      arr.push({
        id: i,
        size: Math.random() * 6 + 3,
        left: Math.random() * 100,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 10,
      });
    }
    return arr;
  }, []);

  const handleSearchSubmit = () => {
    onSearch(searchValue);
    const propertiesSection = document.getElementById('properties');
    if (propertiesSection) {
      propertiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchValue(tag);
    onSearch(tag);
    const propertiesSection = document.getElementById('properties');
    if (propertiesSection) {
      propertiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="hero" id="hero">
      <div className="hero-overlay"></div>
      <div className="hero-particles" id="hero-particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="hero-content">
        <p className="hero-badge">🎓 Trusted by students across GenSan</p>
        <h1 className="hero-title">
          Find Your Perfect<br />
          <span className="hero-title-accent">Boarding House</span>
        </h1>
        <p className="hero-subtitle">
          Discover comfortable, affordable stays near universities in General Santos City.
        </p>

        <div className="search-bar" id="search-bar">
          <div className="search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input 
            type="text" 
            id="search-input" 
            className="search-input"
            placeholder="Search by Area or Barangay (e.g. Lagao, Calumpang)" 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off" 
          />
          <button 
            className="search-btn" 
            id="search-btn"
            onClick={handleSearchSubmit}
          >
            Search
          </button>
        </div>

        <div className="hero-tags">
          {['Lagao', 'Calumpang', 'Dadiangas', 'City Heights', 'Bula'].map((tag) => (
            <span 
              key={tag} 
              className="hero-tag" 
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
};
