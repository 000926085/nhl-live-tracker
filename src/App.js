import React, {useState, useEffect} from 'react';
import { doc, collection, onSnapshot } from "firebase/firestore";
import { database } from './config/firebase';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './index.css';
import './ddh.css';
import { TEAM_COLOURS } from './constants/colours.js';
import SVGRink from './components/SVGRink';

/**
 * Constructs a row of buttons to toggle the strength state of the shot map and game statistics.
 * @returns - div containing the buttons
 */
const StrengthToggle = ({active, onChange}) => {
  const btns = ['ALL', 'EV', 'ALL w/o EN'];

  return (
    <div style={{display: 'flex', flexDirection: 'row',  flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',  gap: '12px', padding: '10px 0', width: '100%' }}>
      <h1 className='title' style={{ margin: 0, fontSize: '1.6rem',}}>
        Strength State
      </h1>

      {/* Button Group */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {btns.map((b) => (
          <button key={b} className={`item ${b === active ? 'btn_on' : 'btn_off'} btn`} onClick={() => onChange(b)}>
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}

const GameCard = ({ game, selected, onSelect }) => {
  if (!game) { return <p className='centered'>Loading!</p> }

  // Determine how to fill the header text.
  const gameStatus = (c) => {
    switch (c.gameState) {
      case 'FUT':
        return (
          <span className='highlight'>
            {new Date(game.startTimeUTC).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              timeZoneName: 'short' 
            })}
          </span>
        );

      case 'LIVE':
      case 'CRIT':
        return (
          <><span className='highlight'>{c.period <= 3 ? `P${c.period}` : 'OT'}</span>{c.timeRemaining}</>
        );

      case 'FINAL':
      case 'OFF':
        return (
          <span>
            <span>FINAL </span>
            {(c.periodType === 'OT' || c.periodType === 'SO') && (
              <>
                <span>• </span>
                <span className="highlight">{c.periodType}</span>
              </>
            )}
          </span>
        );

      default:
        return <span></span>;
    }
  };

  return (
    <div className='gameCard' style={selected ? { border: "2px solid #072c7e" } : {}} onClick={onSelect}>
      {/* Period/Time Info */}
      <div className='headerR'>
        <h2 className='gameHeader'>{gameStatus(game)}</h2>
      </div>

      {/* Score and Team Icons */}
      <div className='scoreR'>
        <div className='teamC'>
          <img className='teamLogo' src={`https://assets.nhle.com/logos/nhl/svg/${game.home.abbrev}_light.svg`} alt="Home" />
        </div>

        <div>
          <h1 className='scoreDisplay'>
            {game.gameState === 'FUT' ? "0 - 0" : `${game.home.score} - ${game.away.score}`}
          </h1>
        </div>

        <div className='teamC'>
          <img className='teamLogo' src={`https://assets.nhle.com/logos/nhl/svg/${game.away.abbrev}_light.svg`} alt="Away" />
        </div>
      </div>
    </div>
  )
}

/**
 * Fetches all of the games for the provided date.
 * @param {*} date - the date selected by the user.
 */
const AllGames = ({ date }) => {
  const [games, setGames] = useState(null);
  const [selectedGame, setSelected] = useState(null); 
  const [strength, setStrength] = useState('ALL');

  useEffect(() => {
    setGames(null);
    
    // Find the document for the provided date.
    const formattedDate = date.toLocaleDateString('en-ZA').replaceAll("/", "-");
    const dateRef = doc(database, "Games", formattedDate);

    const unsubscribeDate = onSnapshot(dateRef, (snap) => {
      // If there is a document for the date, continue.
      if (snap.exists() && snap.data().games) {
        const ids = snap.data().games;

        // Keep track of individual game unsubscribes.
        const gameUnsubs = [];

        ids.forEach((id) => {
          const gameRef = collection(database, "Games", formattedDate, String(id));

          // Listen to each individual game.
          const unsubGame = onSnapshot(gameRef, (gameSnap) => {
            let gameDetails = { id };
            gameSnap.forEach(doc => {
              gameDetails[doc.id] = doc.data();
            });

            // Update said game in state.
            setGames((prevGames) => {
              if (!prevGames) return [gameDetails];
              const i = prevGames.findIndex(g => g.id === id);
              if (i > -1) {
                const newGames = [...prevGames];
                newGames[i] = gameDetails;
                return newGames;
              }
              return [...prevGames, gameDetails];
            });

            setSelected(prev => prev ?? id);
          });

          gameUnsubs.push(unsubGame);
        })

        // Cleanup for listeners.
        return () => gameUnsubs.forEach(unsub => unsub());
      } 
      
      // If not, no games must exist for that date.
      else {
        setGames([]);
      }
    }, (err) => console.error("Fetch failed: ", err));

    // Cleanup main listener for when the date changes.
    return () => unsubscribeDate();
  }, [date]);

  if (!games) { return <p className='centered'>Loading!</p> }
  else if (games.length === 0) { return <h3 className='centered'>No games for this date were found.</h3> }

  // Clean the data to account for missing fields.
  const sanitize = (game) => {
    const data = game?.gameData || {};
    const shots = game?.shots || {};
    const g_id = game?.id || "";

    return {
      id: g_id,
      gameDate: data.gameDate ?? '',
      period: data.period?.number ?? '',
      periodType: data.period?.periodType ?? '',
      timeRemaining: data.period?.timeRemaining ?? '',
      lastUpdated: data.lastUpdated ?? '',
      gameState: data.gameState ?? '',
      scheduled: data.scheduled ?? '',
      startTimeUTC: data.startTimeUTC ?? '',
      isShootoutGame: '',
      home: {
        name: data.teams?.home?.name ?? '',
        abbrev: data.teams?.home?.abbrev ?? '',
        score: data.teams?.home?.score ?? 0,
        players: data.teams?.home?.players ?? [],
      },
      away: {
        name: data.teams?.away?.name ?? '',
        abbrev: data.teams?.away?.abbrev ?? '',
        score: data.teams?.away?.score ?? 0,
        players: data.teams?.away?.players ?? [],
      },
      shots: shots
    };
  };
  
  // Get the data for the selected game using the ID.
  const selectedData = games.find(g => g.id === selectedGame) ?? games[0];
  const fullCleanedData = sanitize(selectedData);

  // Handle filtering the data according to strength state.
  const shotsToFilter = fullCleanedData.shots?.shots || [];
  const filteredShotsArray = shotsToFilter.filter(s => {
    if (strength === 'ALL') return true;
    if (strength === 'EV') return s.strengthState === 'EVEN';
    if (strength === 'ALL w/o EN') {
      return s.strengthState !== 'AWAY NET EMPTY' && s.strengthState !== 'HOME NET EMPTY';
    }
    return true;
  });

  // Replace the shots of the sanitized data with the filtered shots.
  const displayData = {
    ...fullCleanedData,
    shots: {
      ...fullCleanedData.shots,
      shots: filteredShotsArray
    }
  };

  return (
    <div>
      <div className='container' style={{flexWrap: 'wrap'}}>
        {games.map((g) => {
          const cleanedData = sanitize(g);
          return (
            <GameCard key={g.id} game={cleanedData} selected={selectedGame === g.id} onSelect={() => setSelected(g.id)} />
          );
        })}
      </div>
      <ChosenGame game={displayData} />
      <StrengthToggle active={strength} onChange={setStrength} />
      <GameStatistics game={displayData} strength={strength} />
    </div>
  )
}

/**
 * Constructs a larger representation of a game to indicate its selection.
 * @param {*} game - the game selected by the user.
 * @returns div containing data of the selected game.
 */
const ChosenGame = ({ game }) => {
// Determine how to fill the header text.
  const gameStatus = (c) => {
    switch (c.gameState) {
      case 'FUT':
        return (
          <span className='highlight'>
            {new Date(game.startTimeUTC).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              timeZoneName: 'short' 
            })}
          </span>
        );

      case 'LIVE':
      case 'CRIT':
        return (
          <><span className='highlight'>{c.period <= 3 ? `P${c.period}` : 'OT'}</span>{c.timeRemaining}</>
        );

      case 'FINAL':
      case 'OFF':
        return (
          <span>
            <span>FINAL </span>
            {(c.periodType === 'OT' || c.periodType === 'SO') && (
              <>
                <span>• </span>
                <span className="highlight">{c.periodType}</span>
              </>
            )}
          </span>
        );

      default:
        return <span></span>;
    }
  };

  return (
    <div className='selectedContainer'>
      <div className='selectedGame'>

        {/* Period/Time Remaining */}
        <div className='headerR'>
          <h2 className='gameHeader'>{gameStatus(game)}</h2>
        </div>
        
        {/* Teams and Score */}
        <div className='scoreR'>
          <div className='teamC'>
            <img className='teamLogo' style={{height: '150px', width: '150px'}} src={`https://assets.nhle.com/logos/nhl/svg/${game.home.abbrev}_light.svg`} alt="Home Logo" />
            <h2 className='teamDisplay'>{game.home.name}</h2>
          </div>
          
          <div>
            <h1 className='scoreDisplay'>{game.home.score} - {game.away.score}</h1>
          </div>

          <div className='teamC'>
            <img className='teamLogo' style={{height: '150px', width: '150px'}} src={`https://assets.nhle.com/logos/nhl/svg/${game.away.abbrev}_light.svg`} alt="Away Logo"/>
            <h2 className='teamDisplay'>{game.away.name}</h2>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Generalized implementation of a dropdown menu for various types of filters.
 * @param {String} category key of a dropdownOptions item
 * @param {dict} options label and value of the dropdownOptions item
 * @param {arr} selected array of the currently selected checkbox values
 * @param {Function} onToggle callback to handle behaviour when selecting or unselecting a checkbox
 * @returns {JSX.Element} a dropdown menu containing checkboxes
 */
const ToggleMenu = ({ category, options, selected, onToggle}) => {
  const [active, setActive] = useState(false);

  return (
    <div className="filter-container">
      <span>{category.replace(/([A-Z])/g, ' $1')}</span>
      <div className="filter-pill" onClick={() => setActive(!active)}>
        <span>{selected.length === options.length ? 'All' : `${selected.length} Selected`}</span>
        <span>{active ? '∧' : '∨'}</span>
      </div>

      {active && (
        <div className='filter-options'>
          {options.map(o => (
            <div key={o.value} onClick={() => onToggle(o.value)}>
              <input type="checkbox" checked={selected.includes(o.value)} readOnly/>
              <span style={{marginLeft: '5px'}}>{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * 
 * @param {object} game represents a game, along with its data and shot data.
 * @returns table containing a tally of the shots, sorted by type, for each team.
 */
const GameStatistics = ({ game, strength }) => {
  // Stores the currently selected filters.
  const [filters, setFilters] = useState({
    shotType: ['goal', 'shot-on-goal', 'missed-shot', 'blocked-shot'],
    period: [1, 2, 3, 4],
    position: ["C", "D", "G", "L", "R"],
    players: []
  });

  // Handles setting a new roster once another game is selected.
  useEffect(() => {
    if (game) {
      const newPlayers = [
        ...game.home.players.map(p => p.player),
        ...game.away.players.map(p => p.player)
      ];
      
      setFilters(prev => ({
        ...prev,
        players: newPlayers 
      }));
    }
  }, [game]);

  if (!game) { return <div><p>Loading!</p></div> }

  // Labels and values for each dropdown menu.
  const dropdownOptions = {
    shotType: [
      { label: 'Goals', value: 'goal' },
      { label: 'Shots on Goal', value: 'shot-on-goal' },
      { label: 'Missed Shots', value: 'missed-shot' },
      { label: 'Blocked Shots', value: 'blocked-shot' },
    ],

    period: [
      { label: '1st', value: 1 },
      { label: '2nd', value: 2 },
      { label: '3rd', value: 3 },
      { label: 'OT', value: 4 },
      { label: 'SO', value: 5 }
    ],

    position: [
      { label: 'Center', value: 'C' },
      { label: 'Defenceman', value: 'D' },
      { label: 'Goalie', value: 'G' },
      { label: 'Left Wing', value: 'L' },
      { label: 'Right Wing', value: 'R' },
    ],

    players: [
      ...game.home.players,
      ...game.away.players
    ].map(p => ({
      label: `${p.player} [${p.sweaterNumber}]`,
      value: p.player 
    }))
  }

  // Helper function to generalize the toggling functionality for dropdown menus.
  const toggleFilter = (category, value) => {
    setFilters(prev => ({
      ...prev, 
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value) // remove from filters
        : [...prev[category], value]  // add to filters
    }));
  };

  const shotsArr = game.shots?.shots || [];

  // Loop through the fetched shots and organize them by team, then type.
  const sorted = {};
  let shootout = false;
  let shootoutWinner = "";
  shotsArr.forEach((s) => {
    const team = s.eventOwnerTeam;
    const type = s.typeDescKey;

    // Do not count shootout goals as goals.
    if (s.period?.periodType === 'SO') { 
      shootout = true;
      if (type === 'goal') {
        shootoutWinner = team;
      }
      return; 
    }

    // Create an empty object for a team if it doesn't exist.
    if (!sorted[team]) { sorted[team] = {}; }
    sorted[team][type] = (sorted[team][type] || 0) + 1;

    // Goals are considered shots-on-goal.
    if (type === 'goal') { sorted[team]['shot-on-goal'] = (sorted[team]['shot-on-goal'] || 0) + 1; }
  });

  // Increment shootout winner by 1, if applicable.
  if (shootout && shootoutWinner) {
    sorted.isShootoutGame = true;
    sorted[shootoutWinner]['goal'] = (sorted[shootoutWinner]['goal'] || 0) + 1;
  }

  // Get the amount of shots of a given type if it exists, 0 if it does not.
  const getCount = (abbrev, type) => sorted[abbrev]?.[type] || 0;

  // Filter out shots that do not meet the specified filters.
  const filteredShots = shotsArr.filter(s => {
    const typeMatch = filters.shotType.includes(s.typeDescKey);
    const periodMatch = filters.period.includes(s.period.number);
    const positionMatch = filters.position.includes(s.player?.position);
    const playerMatch = filters.players.includes(s.player?.shootingPlayer);
    return typeMatch && periodMatch && positionMatch && playerMatch;
  });

  const stats = [
    { label: 'Goals', key: 'goal' },
    { label: 'Shots-On-Goal', key: 'shot-on-goal' },
    { label: 'Blocked Shots', key: 'blocked-shot' },
    { label: 'Missed Shots', key: 'missed-shot' },
  ];

  const statsLookup = stats.reduce((acc, stat) => {
    acc[stat.key] = {
      home: getCount(game.home.abbrev, stat.key),
      away: getCount(game.away.abbrev, stat.key)
    };
    return acc;
  }, {});

  const time = game.lastUpdated?.seconds 
  ? new Date(game.lastUpdated.seconds * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
  : 'Loading...';

  const common = {
    fill: "#0c1f99",
    fillOpacity: 0.75,
    stroke: 'rgba(235, 235, 235, 1)',
    strokeWidth: 3
  }

  return (
    <div style={{color: 'white'}}>
      {/* Rink and Toggles */}
      <div className='rinkcard'>
        <h2 className='gameHeader'>Shotmap • <i>Last Updated: {time}</i></h2>
        <div style={{textAlign: 'center', margin: '4px'}}>
          <i>Data reflects plays made under the <b>{strength.toUpperCase()}</b> strength state.</i>
        </div>
        <div className='filter-row'>
          {Object.entries(dropdownOptions).map(([category, options]) => (
            <ToggleMenu key={category} category={category} options={options} selected={filters[category]} onToggle={(v) => toggleFilter(category, v)} />
          ))}
        </div>    
        <div style={{display: 'flex', flexDirection: 'row', gap: '20px', justifyContent: 'center', margin: '10px'}}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <p style={{ margin: '0 8px 0 0' }}>Goal</p>
            <svg width="25" height="25" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
              <polygon {...common} points="50,-5 0,85 100,85" />
            </svg>
          </div>

          <div style={{display: 'flex', alignItems: 'center'}}>
            <p style={{ margin: '0 8px 0 0' }}>Shot-On-Goal</p>
            <svg width="25" height="25" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
              <circle {...common} cx={50} cy={50} r="40" />
            </svg>
          </div>

          <div style={{display: 'flex', alignItems: 'center'}}>
            <p style={{ margin: '0 8px 0 0' }}>Missed Shot</p>
            <svg width="25" height="25" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
              <rect {...common} x="10" y="10" width="80" height="80" rx="15" />
            </svg>
          </div>

          <div style={{display: 'flex', alignItems: 'center'}}>
            <p style={{ margin: '0 8px 0 0' }}>Blocked Shot</p>
            <svg width="25" height="25" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
              <polygon {...common} points="50,5 95,50 50,95 5,50" />
            </svg>
          </div>
        </div>
        <SVGRink key={game.id} arr={filteredShots} gameid={game.id} home={game.home} away={game.away} strength={strength} />
      </div>

      {/* Statistics Table */}
      <div className='game-statistics'>
          <div className='game-statistics-header'>
            <h2 className='gameHeader'>Game Statistics • <i>Last Updated: {time}</i></h2>
          </div>
          <div style={{textAlign: 'center', margin: '4px'}}>
            <i>Data reflects plays made under the <b>{strength.toUpperCase()}</b> strength state.</i>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', alignItems: 'center', width: '100%'}}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px' }}>
              <img className='teamLogo' src={`https://assets.nhle.com/logos/nhl/svg/${game.home.abbrev}_light.svg`} alt="Team Logo" />
              <span style={{ fontWeight: 'bold', fontSize: '1.6rem', textAlign: 'right' }}>{game.home.abbrev}</span>
            </div>

            <div style={{ textAlign: 'center', fontSize: '1.6rem', fontWeight: 'bold'}}>VS.</div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.6rem', textAlign: 'left' }}>{game.away.abbrev}</span>
              <img className='teamLogo' src={`https://assets.nhle.com/logos/nhl/svg/${game.away.abbrev}_light.svg`} alt="Team Logo" />
            </div>
          </div>

          {stats.map((stat) => {
            const homeVal = statsLookup[stat.key].home;
            const awayVal = statsLookup[stat.key].away;
            const goalRow = stat.key === 'goal';
            const showSO = goalRow && sorted.isShootoutGame;

            const homeStyles = {
              backgroundColor: homeVal > awayVal ? TEAM_COLOURS[game.home.abbrev].primary : '#222',
              backgroundImage: homeVal > awayVal 
                ? 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0))' 
                : 'none',
              color: (['BOS', 'NSH', 'UTA'].includes(game.home.abbrev) && homeVal > awayVal) ? '#000' : '#FFF'
            };

            const awayStyles = {
              backgroundColor: awayVal > homeVal ? TEAM_COLOURS[game.away.abbrev].primary : '#222',
              backgroundImage: awayVal > homeVal 
                ? 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0))' 
                : 'none',
              color: (['BOS', 'NSH', 'UTA'].includes(game.away.abbrev) && awayVal > homeVal) ? '#000' : '#FFF'
            };

            return (
              <div key={stat.key} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',  margin: '5px 0' }}>
                {showSO && homeVal > awayVal && (
                  <span style={{ fontSize: '0.6rem', verticalAlign: 'middle', marginLeft: '4px' }}>(SO)</span>
                )}
                <div className='stats-card' style={homeStyles}>
                  <p>{homeVal}</p>
                </div>
                <p className='stat-label'>{stat.label}</p>
                <div className='stats-card' style={awayStyles}>
                  <p>{awayVal}</p>
                </div>
                {showSO && awayVal > homeVal && (
                  <span style={{ fontSize: '0.6rem', verticalAlign: 'middle', marginLeft: '4px' }}>(SO)</span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  )
}

function App({ pageId }) {
  const [date, setDate] = useState(new Date(2026, 3, 7));
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
}

export default App;