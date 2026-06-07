import React, { useState } from 'react';

interface HeroProps {
  onSearch: (query: string) => void;
  onOpenFilter?: () => void;
}

interface Particle {
  id: number;
  size: number;
  left: number;
  duration: number;
  delay: number;
}

export const Hero: React.FC<HeroProps> = ({ onSearch, onOpenFilter }) => {
  const [searchValue, setSearchValue] = useState('');

  const [particles, setParticles] = useState<Particle[]>([]);

  React.useEffect(() => {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(arr);
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
        <p className="hero-badge">Trusted by locals and visitors across GenSan</p>
        <h1 className="hero-title">Find Your Perfect <br /> <span className="hero-title-accent">GenSan</span> Stay</h1>
        <p className="hero-subtitle">
          Discover comfortable, affordable, and premium stays across General Santos City.
        </p>

        <div style={{ maxWidth: '700px', margin: '0 auto', width: '100%', padding: '0 16px', boxSizing: 'border-box' }}>
          <div className="search-bar" id="search-bar">
            <div className="search-input-wrapper">
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
                placeholder="Search by Area (e.g. Lagao)" 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off" 
              />
              <button 
                className="filter-icon-btn"
                onClick={onOpenFilter}
                aria-label="Filters"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                <span className="filter-text">Filters</span>
              </button>
            </div>
            <button 
              className="search-btn" 
              id="search-btn"
              onClick={handleSearchSubmit}
            >
              Search
            </button>
          </div>
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
