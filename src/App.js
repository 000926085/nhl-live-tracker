import React, {useState, useEffect} from 'react';
import { doc, collection, getDoc, getDocs } from "firebase/firestore";
import { database } from './config/firebase';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './index.css';
import './ddh.css';
import { TEAM_COLORS } from './constants/colours.js';

/**
 * 
 * @param {*} arr array containing the shots for the selected game. 
 * @returns a div holding the SVG representation of a hockey rink.
 */
const SVGRink = ( {arr, gameid, home, away} ) => {
  const [selectedShot, setSelectedShot] = useState(null);
  if (!arr) { return <div>Loading!</div> }
  
  const homeLogoUrl = `https://assets.nhle.com/logos/nhl/svg/${home.abbrev}_light.svg`;
  const awayLogoUrl = `https://assets.nhle.com/logos/nhl/svg/${away.abbrev}_light.svg`;

  return (
    <div style={{width: "95%"}}>
      {selectedShot && (
       <p>{JSON.stringify(selectedShot, null, 2)}</p>
      )}
      
      <svg viewBox="-1 -1 202 87">
        <defs>
          <clipPath id="rinkClip">
            <rect x="0" y="0" width="200" height="85" rx="15" ry="15" />
          </clipPath>
        </defs>

        {/* Rink Boundary */}
        <rect x="0" y="0" width="200" height="85" rx="15" ry="15" fill="#f0f0f0" stroke="black" strokeWidth="0.33" />

        {/* Centre */}
        <line x1="100" y1="0" x2="100" y2="85" stroke="rgb(200, 16, 46)" strokeWidth="0.33" strokeDasharray="1, 1" />
        <circle cx="100" cy="42.5" r="12.5" fill="none" stroke="rgb(0, 102, 204)" strokeWidth="0.33" />
        <circle cx="100" cy="42.5" r="0.5" stroke="rgb(0, 102, 204)" />

        {/* Blue Lines */}
        <line x1="75" y1="0" x2="75" y2="85" stroke="rgb(0, 102, 204)" strokeWidth="0.66" />
        <line x1="125" y1="0" x2="125" y2="85" stroke="rgb(0, 102, 204)" strokeWidth="0.66" />

        {/* Red Lines */}
        <line x1="11" y1="0.5" x2="11" y2="84.5" stroke="rgb(200, 16, 46)" strokeWidth="0.33" />
        <line x1="189" y1="0.5" x2="189" y2="84.5" stroke="rgb(200, 16, 46)" strokeWidth="0.33" />

        {/* Neutral Zone Faceoff Dots */}
        <circle cx="82.5" cy="21.25" r="0.5" stroke="rgb(200, 16, 46)" />
        <circle cx="82.5" cy="63.75" r="0.5" stroke="rgb(200, 16, 46)" />
        <circle cx="117.5" cy="21.25" r="0.5" stroke="rgb(200, 16, 46)" />
        <circle cx="117.5" cy="63.75" r="0.5" stroke="rgb(200, 16, 46)" />

        {/* Team Logos */}
        <image href={homeLogoUrl} x="27" y="26.5" width="32" height="32" opacity="0.33" />
        <image href={awayLogoUrl} x="141" y="26.5" width="32" height="32" opacity="0.33" />

        {/* End Zone Faceoff Circles */}
        <circle cx="35" cy="21.25" r="12.5" fill="none" stroke="rgb(200, 16, 46)" strokeWidth="0.33" />
        <circle cx="35" cy="21.25" r="0.5" stroke="rgb(200, 16, 46)" />
        <circle cx="35" cy="63.75" r="12.5" fill="none" stroke="rgb(200, 16, 46)" strokeWidth="0.33" />
        <circle cx="35" cy="63.75" r="0.5" stroke="rgb(200, 16, 46)" />
        <circle cx="165" cy="21.25" r="12.5" fill="none" stroke="rgb(200, 16, 46)" strokeWidth="0.33" />
        <circle cx="165" cy="21.25" r="0.5" stroke="rgb(200, 16, 46)" />
        <circle cx="165" cy="63.75" r="12.5" fill="none" stroke="rgb(200, 16, 46)" strokeWidth="0.33" />
        <circle cx="165" cy="63.75" r="0.5" stroke="rgb(200, 16, 46)" />

        {/* Referee and Goal Creases */}
        <path d="M 90 0 A 10 10 0 0 0 110 0" fill="none" stroke="rgb(200, 16, 46)" strokeWidth="0.33" />
        <path d="M 90 85 A 10 10 0 0 1 110 85" fill="none" stroke="rgb(200, 16, 46)" strokeWidth="0.33" />
        <path d="M 11 36.5 A 6 6 0 0 1 11 48.5" fill="rgba(0, 150, 255, 0.2)" stroke="rgb(200, 16, 46)" strokeWidth="0.33" />
        <path d="M 189 36.5 A 6 6 0 0 0 189 48.5" fill="rgba(0, 150, 255, 0.2)" stroke="rgb(200, 16, 46)" strokeWidth="0.33" />

        {/* Shot Mapping */}
        <g clipPath="url(#rinkClip)">
          {Array.from(new Set(arr.map(s => s.id))).map(id => {
            const s = arr.find(shot => shot.id === id);
    
            // Handle mirroring the shots during the second period.
            const displayCoords = s.period.number === 2 
              ? { x: s.coords.xCoord * -1, y: s.coords.yCoord * -1 }
              : { x: s.coords.xCoord, y: s.coords.yCoord };

            return (
              <Shot 
                key={`${gameid}-${id}`} 
                shot={{ ...s, coords: { ...s.coords, xCoord: displayCoords.x, yCoord: displayCoords.y } }}
                selected={selectedShot?.id === s.id} 
                onClick={() => setSelectedShot(s)} 
              />
            );
          })}
        </g>

        {/* Cover for any clipping lines */}
        <rect x="0" y="0" width="200" height="85" rx="15" fill="none" stroke="black" strokeWidth="0.33" />
      </svg>
    </div>
  )
}

/**
 * 
 * @param {Object} shot contains the data pertaining to a shot
 * @param {boolean} selected true if the id of the selected shot matches this shot 
 * @param {Function} onClick callback function triggered when this shot is clicked
 * @returns {JSX.Element} represents a shot made during this game
 */
const Shot = ( {shot, selected, onClick} ) => {
  const x = shot.coords.xCoord + 100
  const y = 42.5 - shot.coords.yCoord

  const common = {
    key: shot.id,
    fill: TEAM_COLORS[shot.eventOwnerTeam]?.primary ?? "#FFD700",
    fillOpacity: selected ? 1 : 0.75,
    stroke: selected ? 'rgba(235, 235, 235, 0.76)' : (TEAM_COLORS[shot.eventOwnerTeam]?.primary ?? "#FFD700"),
    strokeWidth: 0.2,
    style: { cursor: "pointer" },
    onClick: onClick
  }

  switch(shot.typeDescKey) {
    case 'shot-on-goal':
      return (
        <circle {...common} cx={x} cy={y} r="1.5" />
      )

    case 'goal':
      return (
        <polygon {...common} points={`${x},${y - 2.1} ${x - 1.8},${y + 1.0} ${x + 1.8},${y + 1.0}`} />
      )

    case 'missed-shot':
      const s = 5.5 / 2
      return (
        <rect {...common} x={x - s} y={y - s} height={s} width={s} rx="0.5" />
      )

    default:
      const [dx, dy] = [2.0, 2.0];
      return (
        <polygon {...common} points={`${x},${y - dy} ${x + dx},${y} ${x},${y + dy} ${x - dx},${y}`} />
      )
  }
}

/**
 * Constructs a row of buttons to toggle the strength state of the shot map and game statistics.
 * @returns - div containing the buttons
 */
function StrengthToggle() {
  const [active, setActive] = useState('ALL');
  const btns = ['ALL', 'EV', 'ALL w/o EN'];

  return (
    <div className='flex'>
      <h1 className='title'>Strength State:</h1>

      {btns.map((b) => {
        return (
          <button key={b} className={`item ${b === active ? 'btn_on' : 'btn_off'} btn`} onClick={() => setActive(b)}>
            {b}
          </button>
        );
      })}
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
          <span className='highlight'>{c.scheduled} | EST</span>
        );

      case 'LIVE':
        return (
          <><span className='highlight'>P{c.period}</span>{c.timeRemaining}</>
        );

      case 'OFF':
        return (
          <span>FINAL</span>
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

  useEffect(() => {
    const fetchIds = async () => {
      try {
        setGames(null);
        
        // Find the document for the provided date.
        const formattedDate = date.toLocaleDateString('en-ZA').replaceAll("/", "-");
        const dateRef = doc(database, "Games", formattedDate);
        const snap = await getDoc(dateRef);

        // If there is a document for the date, continue.
        if (snap.exists() && snap.data().games) {
          const ids = snap.data().games;

          // Fetch every game (collection) for the date.
          const allGames = await Promise.all(
            ids.map(async (id) => {
              const gameRef = collection(database, "Games", formattedDate, String(id));
              const gameSnap = await getDocs(gameRef);

              // Loop through each subdocument and add the associated data.
              let gameDetails = { id };
              gameSnap.forEach(doc => {
                gameDetails[doc.id] = doc.data();
              });

              return gameDetails;
            })
          );
          setGames(allGames);
          setSelected(allGames[0].id);
        } 
        // If not, no games must exist for that date.
        else {
          setGames([]);
        }
      } catch (err) {
        console.error("Fetching failure: ", err);
      }
    };

    fetchIds();
  }, [date]);

  if (!games) { return <p className='centered'>Loading!</p> }
  else if (games.length === 0) { return <p className='centered'>No games for this date!</p> }

  // Clean the data to account for missing fields.
  const sanitize = (game) => {
    const data = game?.gameData || {};
    const shots = game?.shots || {};
    const g_id = game?.id || "";

    return {
      id: g_id,
      gameDate: data.gameDate ?? '',
      period: data.period?.number ?? '',
      timeRemaining: data.period?.timeRemaining ?? '',
      lastUpdated: data.lastUpdated ?? '',
      gameState: data.gameState ?? '',
      scheduled: data.scheduled ?? '',
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
      <ChosenGame game={sanitize(selectedData)} />
      <StrengthToggle />
      <GameStatistics game={sanitize(selectedData)} />
    </div>
  )
}

/**
 * Constructs a larger representation of a game to indicate its selection.
 * @param {*} game - the game selected by the user.
 * @returns div containing data of the selected game.
 */
const ChosenGame = ({ game }) => {
  return (
    <div className='selectedContainer'>
      <div className='selectedGame'>

        {/* Period/Time Remaining */}
        <div className='headerR'>
            <h2 className='gameHeader'>
              {game.gameState === 'FUT' ? (
                <>
                  <span className='highlight'>{game.scheduled} | EST</span>
                </>
              ) : (
                <>
                  <span className='highlight'>P{game.period}</span>
                  {game.timeRemaining}
                </>
              )}
            </h2>
        </div>

        {/* Teams and Score */}
        <div className='scoreR'>
          <div className='teamSection'>
            <img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${game.home.abbrev}_light.svg`} alt="Home Logo" />
            <h2>{game.home.name}</h2>
          </div>
          
          <div className='scoreSection'>
            <h1 className='scoreText'>{game.home.score} - {game.away.score}</h1>
            <p style={{ visibility: 'hidden' }}>hidden</p>
          </div>

          <div className='teamSection'>
            <img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${game.away.abbrev}_light.svg`} alt="Away Logo"/>
            <h2>{game.away.name}</h2>
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
        <div>
          {options.map(o => (
            <div key={o.value} onClick={() => onToggle(o.value)}>
              <input type="checkbox" checked={selected.includes(o.value)} readOnly/>
              {o.label}
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
const GameStatistics = ({ game }) => {
  // Stores the currently selected filters.
  const [filters, setFilters] = useState({
    shotType: ['goal', 'shot-on-goal', 'missed-shot', 'blocked-shot'],
    period: [1, 2, 3],
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
      { label: '3rd', value: 3 }
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
      label: p.player, 
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
  shotsArr.forEach((s) => {
    const team = s.eventOwnerTeam;
    const type = s.typeDescKey;

    // Create an empty object for a team if it doesn't exist.
    if (!sorted[team]) { sorted[team] = {}; }

    sorted[team][type] = (sorted[team][type] || 0) + 1;

    // Goals are considered shots-on-goal.
    if (type === 'goal') { sorted[team]['shot-on-goal'] = (sorted[team]['shot-on-goal'] || 0) + 1; }
  });

  // Get the amount of shots of a given type if it exists, 0 if it does not.
  const getCount = (abbrev, type) => sorted[abbrev]?.[type] || 0;

  // Filter out shots that do not meet the specified filters.
  const filteredShots = shotsArr.filter(s => {
    const typeMatch = filters.shotType.includes(s.typeDescKey);
    const periodMatch = filters.period.includes(s.period.number);
    const positionMatch = filters.position.includes(s.player?.position);
    // const playerMatch = filters.players.includes(s.player?.shootingPlayer);
    return typeMatch && periodMatch && positionMatch // && playerMatch;
  });

  return (
    <div style={{color: 'white'}}>
      {/* Rink and Toggles */}
      <div className='rinkcard'>
        <h2 className='gameHeader'>Shotmap | <i>Last Updated: {game.lastUpdated}</i></h2>
        <div className='filter-row'>
          {Object.entries(dropdownOptions).map(([category, options]) => (
            <ToggleMenu key={category} category={category} options={options} selected={filters[category]} onToggle={(v) => toggleFilter(category, v)} />
          ))}
        </div>    
        <SVGRink key={game.id} arr={filteredShots} gameid={game.id} home={game.home} away={game.away} />
      </div>

      <h2 className='dashboard'>Game Statistics | {game.lastUpdated}</h2>
      <table style={{border: '1px solid white', textAlign: 'center'}}>
        <thead>
          <tr>
            <th>{game.home.abbrev}</th>
            <th></th>
            <th>{game.away.abbrev}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${game.home.abbrev}_light.svg`} alt="Home Logo"/></td>
            <td>{getCount(game.home.abbrev, 'goal')} - {getCount(game.away.abbrev, 'goal')}</td>
            <td><img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${game.away.abbrev}_light.svg`} alt="Away Logo" /></td>
          </tr>
          <tr>
            <td>{getCount(game.home.abbrev, 'shot-on-goal')}</td>
            <td>Shots-On-Goal</td>
            <td>{getCount(game.away.abbrev, 'shot-on-goal')}</td>
          </tr>
          <tr>
            <td>{getCount(game.home.abbrev, 'blocked-shot')}</td>
            <td>Blocked Shots</td>
            <td>{getCount(game.away.abbrev, 'blocked-shot')}</td>
          </tr>
          <tr>
            <td>{getCount(game.home.abbrev, 'missed-shot')}</td>
            <td>Missed Shots</td>
            <td>{getCount(game.away.abbrev, 'missed-shot')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function App({ pageId }) {
  const [date, setDate] = useState(new Date(2026, 2, 31));
  const [showCalendar, setShowCalendar] = useState(false);

  const dateChange = (newDate) => {
    setDate(newDate);
    setShowCalendar(false);
  };

  return (
    <div style={{ backgroundColor: 'black'}}>
      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '24px'}}>
        <h1 className='dashboard' style={{ margin: '0 0 10px 0' }}>{date.toLocaleDateString('en-ZA')} | Games</h1>
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