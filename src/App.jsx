// src/App.jsx
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, getDocs, where, or } from 'firebase/firestore';
import './App.css';

function App() {
  const [teams, setTeams] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [knownIds, setKnownIds] = useState(new Set());
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    game: 'Counter-Strike 2',
    team_name: '',
    player1: '',
    class1: '',
    player2: '',
    class2: ''
  });

  // Anti-spam protection at the React component state level
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  // Live statistics derived from state
  const cs2Count = teams.filter(t => t.game === 'Counter-Strike 2').length;
  const bhCount = teams.filter(t => t.game === 'Brawlhalla').length;
  const rlCount = teams.filter(t => t.game === 'Rocket League').length;

  // Firebase listener - fetches data in real time
  useEffect(() => {
    const q = collection(db, "druzyny");
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamsList = [];
      snapshot.forEach((doc) => {
        teamsList.push({ id: doc.id, ...doc.data() });
      });

      // Sort by creation date so new entries appear at the bottom or top
      teamsList.sort((a, b) => a.createdAt - b.createdAt);

      setTeams(teamsList);

      if (isFirstLoad && teamsList.length > 0) {
        const ids = new Set(teamsList.map(t => t.id));
        setKnownIds(ids);
        setIsFirstLoad(false);
      }
    });

    return () => unsubscribe();
  }, [isFirstLoad]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const registerTeam = async (e) => {
    e.preventDefault();

    // 1. TIME-BASED ANTI-SPAM
    const now = Date.now();
    if (now - lastSubmitTime < 10000) {
      const wait = Math.ceil((10000 - (now - lastSubmitTime)) / 1000);
      alert(`Zwolnij! Odczekaj jeszcze ${wait} sekund.`);
      return;
    }

    const { game, team_name, player1, class1, player2, class2 } = formData;
    const p1 = player1.trim();
    const p2 = player2.trim();
    const tName = team_name.trim();

    if (!tName || !p1 || !class1 || !p2 || !class2) {
      alert("Wszystkie pola muszą być wypełnione!");
      return;
    }

    if (p1.toLowerCase() === p2.toLowerCase()) {
      alert("Gracz 1 i Gracz 2 nie mogą być tą samą osobą!");
      return;
    }

    try {
      const druzynyRef = collection(db, "druzyny");

      // 2. LIMIT 96 DRUŻYN PER GRA (Osobny dla każdej dyscypliny)
      const gameLimitQuery = query(druzynyRef, where("game", "==", game));
      const gameSnapshot = await getDocs(gameLimitQuery);
      if (gameSnapshot.size >= 96) {
        alert(`Brak wolnych miejsc! Osiągnięto maksymalny limit 96 drużyn dla gry ${game}.`);
        return;
      }

      // 3. Check team name uniqueness
      const nameQuery = query(druzynyRef, where("team_name_lower", "==", tName.toLowerCase()));
      const nameSnapshot = await getDocs(nameQuery);
      if (!nameSnapshot.empty) {
        alert("Drużyna o takiej nazwie już istnieje!");
        return;
      }

      // 4. GLOBAL PLAYER CHECK: Is anyone already playing?
      const playersQuery = query(
        druzynyRef, 
        or(
          where("player1_lower", "in", [p1.toLowerCase(), p2.toLowerCase()]),
          where("player2_lower", "in", [p1.toLowerCase(), p2.toLowerCase()])
        )
      );
      
      const playersSnapshot = await getDocs(playersQuery);
      if (!playersSnapshot.empty) {
        alert("Jeden z graczy jest już zapisany na turniej (gry odbywają się jednocześnie)!");
        return;
      }

      // If checks passed successfully -> save to Firestore
      await addDoc(druzynyRef, {
        game,
        team_name: tName,
        team_name_lower: tName.toLowerCase(), // for easy duplicate checking
        player1: p1,
        player1_lower: p1.toLowerCase(),
        class1: class1.trim(),
        player2: p2,
        player2_lower: p2.toLowerCase(),
        class2: class2.trim(),
        createdAt: Date.now()
      });

      setLastSubmitTime(Date.now());
      alert("Drużyna została pomyślnie zapisana!");
      
      // Reset the form while keeping the selected game
      setFormData({
        game,
        team_name: '',
        player1: '',
        class1: '',
        player2: '',
        class2: ''
      });

    } catch (error) {
      console.error(error);
      alert("Wystąpił błąd podczas rejestracji.");
    }
  };

  // Filter list on screen
  const filteredTeams = currentFilter === 'all'
    ? teams
    : teams.filter(t => t.game === currentFilter);

  return (
    <div className="app-container">
      <h1>🎮 Turnieje na Dzień Dziecka 🕹️</h1>
      <div className="subtitle">Gry startują jednocześnie. Gracze mogą być z różnych klas, ale każdy może grać tylko raz!</div>

      {/* LIVE LIMIT STATS TILES */}
      <div className="limit-stats">
        <div className="stat-box">
          <span>Counter-Strike 2</span>
          <strong>{cs2Count} / 96</strong>
        </div>
        <div className="stat-box">
          <span>Brawlhalla</span>
          <strong>{bhCount} / 96</strong>
        </div>
        <div className="stat-box">
          <span>Rocket League</span>
          <strong>{rlCount} / 96</strong>
        </div>
        <div className="stat-box total">
          <span>Wszystkie zapisy</span>
          <strong>{teams.length}</strong>
        </div>
      </div>

      <div className="layout">
        {/* FORM */}
        <div className="form-section">
          <h2>Formularz Zgłoszeniowy</h2>
          <form onSubmit={registerTeam}>
            <div className="form-group">
              <label>Wybierz grę</label>
              <select id="game" value={formData.game} onChange={handleChange} required>
                <option value="Counter-Strike 2">Counter-Strike 2</option>
                <option value="Brawlhalla">Brawlhalla</option>
                <option value="Rocket League">Rocket League</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nazwa Drużyny</label>
              <input type="text" id="team_name" value={formData.team_name} onChange={handleChange} placeholder="np. Kilerzy" required autoComplete="off" />
            </div>

            <div className="player-row">
              <div className="form-group">
                <label>Gracz 1 (Imię i Nazwisko)</label>
                <input type="text" id="player1" value={formData.player1} onChange={handleChange} placeholder="Gracz 1" required autoComplete="off" />
              </div>
              <div className="form-group class-input">
                <label>Klasa G1</label>
                <input type="text" id="class1" value={formData.class1} onChange={handleChange} placeholder="np. 3TI" required autoComplete="off" />
              </div>
            </div>

            <div className="player-row">
              <div className="form-group">
                <label>Gracz 2 (Imię i Nazwisko)</label>
                <input type="text" id="player2" value={formData.player2} onChange={handleChange} placeholder="Gracz 2" required autoComplete="off" />
              </div>
              <div className="form-group class-input">
                <label>Klasa G2</label>
                <input type="text" id="class2" value={formData.class2} onChange={handleChange} placeholder="np. 2A" required autoComplete="off" />
              </div>
            </div>

            <button type="submit" className="btn">Zarejestruj Drużynę</button>
          </form>
        </div>

        {/* TEAM LIST */}
        <div className="list-section">
          <h2>Zapisane Drużyny</h2>

          <div className="filters">
            {['all', 'Counter-Strike 2', 'Brawlhalla', 'Rocket League'].map(filter => (
              <button 
                key={filter}
                className={`filter-btn ${currentFilter === filter ? 'active' : ''}`}
                onClick={() => setCurrentFilter(filter)}
              >
                {filter === 'all' ? 'Wszystkie' : filter === 'Counter-Strike 2' ? 'CS2' : filter}
              </button>
            ))}
          </div>

          <table>
            <thead>
              <tr>
                <th>Gra</th>
                <th>Nazwa Drużyny</th>
                <th>Skład (Gracz / Klasa)</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.length === 0 ? (
                <tr><td colSpan="3" style={{textAlign: 'center', color: '#777', padding: '20px'}}>Brak zapisanych drużyn.</td></tr>
              ) : (
                filteredTeams.map((team) => {
                  let badgeClass = 'game-cs2';
                  if (team.game === 'Brawlhalla') badgeClass = 'game-brawl';
                  if (team.game === 'Rocket League') badgeClass = 'game-rl';

                  const isNew = !knownIds.has(team.id) && !isFirstLoad;
                  if (isNew) {
                    setTimeout(() => {
                      setKnownIds(prev => new Set([...prev, team.id]));
                    }, 4000);
                  }

                  return (
                    <tr key={team.id} className={isNew ? 'new-row' : ''}>
                      <td><span className={`game-badge ${badgeClass}`}>{team.game}</span></td>
                      <td><strong>{team.team_name}</strong></td>
                      <td>
                        <span className="player-span">{team.player1} ({team.class1})</span> 
                        <span className="divider">|</span> 
                        <span className="player-span">{team.player2} ({team.class2})</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;