import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import './index.css';
import './ddh.css';

import ChosenGame from './components/ChosenGame.js';
import GameCard from './components/GameCard.js';
import StrengthToggle from './components/toggles/StrengthToggle.js';
import GameStatistics from './components/GameStatistics.js';

import { sanitize } from './utils/gameHelpers.js';
import { useGames } from './hooks/useGames.js';

/**
 * Fetches all of the games for the provided date.
 * @param {Object} date the date selected by the user.
 */
const AllGames = ({ date }) => {
  const [selectedGame, setSelected] = useState(null); 
  const [strength, setStrength] = useState('ALL');
  const games = useGames(date);

  if (!games) { return <p className='centered'>Loading!</p> }
  else if (games.length === 0) { return <p className='centered'>No games for this date were found.</p> }
  
  // Get the data for the selected game using the ID.
  const selectedData = games.find(g => g.id === selectedGame) ?? games[0];
  const fullCleanedData = sanitize(selectedData);

  return (
    <div>
      <div className='container' style={{flexWrap: 'wrap'}}>
        {games.map((g) => {
          return (
            <GameCard key={g.id} game={sanitize(g)} selected={selectedGame === g.id} onSelect={() => setSelected(g.id)} />
          );
        })}
      </div>
      <ChosenGame game={fullCleanedData} />
      <StrengthToggle active={strength} onChange={setStrength} />
      <GameStatistics game={fullCleanedData} strength={strength} />
    </div>
  )
}

/**
 * Dashboard component for displaying hockey games.
 * @param {D} pageId unused. 
 * @returns {JSX.Element} header date text, select button and the AllGames component. 
 */
const Dashboard = ({ pageId }) => {
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const dateChange = (newDate) => {
    setDate(newDate);
    setShowCalendar(false);
  };

  return (
    <div style={{ backgroundColor: 'black'}}>
      <div className='date-header-container'>
        <h1 className='dashboard' style={{ margin: '0 0 10px 0' }}>{date.toLocaleDateString('en-ZA')}</h1>
        <button className={`btn_on btn`} onClick={() => setShowCalendar(!showCalendar)}>Select Date</button>
      </div>

      {showCalendar && (
        <div className='modal' onClick={() => setShowCalendar(false)}>
          <div className='calendar-modal' onClick={(e) => e.stopPropagation()}>
            <Calendar onChange={dateChange} value={date} />
          </div>
        </div>
      )}

      <AllGames date={date} />
    </div>
  );
};

/**
 * Main application component.
 * @param {Integer} pageId 
 * @returns component container for handling URLs.
 */
function App({ pageId }) {
  return (
    <Routes>
      <Route path="/" element={<Dashboard pageId={pageId} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;