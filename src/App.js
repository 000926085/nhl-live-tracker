import React, {useState, useEffect} from 'react';
import { doc, collection, getDoc, getDocs } from "firebase/firestore";
import { database } from './config/firebase';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './index.css';
import './ddh.css';
import { TEAM_COLORS } from './constants/colours.js';

const SVGRink = ( {arr} ) => {
  if (!arr) { return <div>Loading!</div> }

  return (
    <div style={{width: "90%"}}>
      <svg viewBox="0 0 200 85">
        {/* Rink Boundary */}
        <rect x="0" y="0" width="200" height="85" rx="15" ry="15" fill="#f0f0f0" stroke="black" strokeWidth="1" />

        {/* Centre */}
        <circle cx="100" cy="42.5" r="12.5" fill="none" stroke="rgb(0, 102, 204)" strokeWidth="0.75" />
        <circle cx="100" cy="42.5" r="0.5" stroke="rgb(0, 102, 204)" />

        {/* Blue Lines */}
        <line x1="75" y1="0" x2="75" y2="85" stroke="rgb(0, 102, 204)" strokeWidth="1.5" />
        <line x1="125" y1="0" x2="125" y2="85" stroke="rgb(0, 102, 204)" strokeWidth="1.5" />

        {/* Red Lines */}
        <line x1="11" y1="0" x2="11" y2="85" stroke="rgb(200, 16, 46)" strokeWidth="1" />
        <line x1="189" y1="0" x2="189" y2="85" stroke="rgb(200, 16, 46)" strokeWidth="1" />

        {/* End Zone Faceoff Circles */}
        <circle cx="35" cy="21.25" r="12.5" fill="none" stroke="rgb(200, 16, 46)" strokeWidth="0.75" />
        <circle cx="35" cy="63.75" r="12.5" fill="none" stroke="rgb(200, 16, 46)" strokeWidth="0.75" />
        <circle cx="165" cy="21.25" r="12.5" fill="none" stroke="rgb(200, 16, 46)" strokeWidth="0.75" />
        <circle cx="165" cy="63.75" r="12.5" fill="none" stroke="rgb(200, 16, 46)" strokeWidth="0.75" />

        {/* Shot Mapping */}
        {arr.map((s) => (
          <circle
            key={s.id}
            cx={s.coords.xCoord + 100}
            cy={42.5 - s.coords.yCoord}
            r="1.5"
            fill={TEAM_COLORS[s.eventOwnerTeam].primary}
            fillOpacity="0.66"
            stroke={TEAM_COLORS[s.eventOwnerTeam].primary}
            strokeWidth="0.2"
            style={{ cursor: "pointer" }}
          />
        ))}

        {/* Cover for any clipping lines */}
        <rect x="0" y="0" width="200" height="85" rx="15" fill="none" stroke="black" strokeWidth="2" />
      </svg>
    </div>
  )
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

    return {
      period: data.period?.number ?? '',
      timeRemaining: data.period?.timeRemaining ?? '',
      lastUpdated: data.lastUpdated ?? '',
      gameState: data.gameState ?? '',
      scheduled: data.scheduled ?? '',
      home: {
        name: data.teams?.home?.name ?? '',
        abbrev: data.teams?.home?.abbrev ?? '',
        score: data.teams?.home?.score ?? 0,
      },
      away: {
        name: data.teams?.away?.name ?? '',
        abbrev: data.teams?.away?.abbrev ?? '',
        score: data.teams?.away?.score ?? 0,
      },
      shots: shots
    };
  };
  
  // Get the data for the selected game using the ID.
  const selectedData = games.find(g => g.id === selectedGame) ?? games[0];

  return (
    <div>
      <div className='container'>
        {games.map((g, i) => {
          const c = sanitize(g);

          return <div key={g.id} className='gameCard' style={ selectedGame === g.id ? {border: "2px solid #072c7e"} : {}} onClick={() => setSelected(g.id)}>
                    <div className='headerRow'>
                      <h2 className='gameHeader'>
                        {c.gameState === 'FUT' ? (
                          <>
                            <span className='highlight'>{c.scheduled} | EST</span>
                          </>
                        ) : (
                          <>
                            <span className='highlight'>P{c.period}</span>
                            {c.timeRemaining}
                          </>
                        )}
                      </h2>
                    </div>

                    <div className='scoreRow'>
                      <div className='teamSection'>
                        <img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${c.home.abbrev}_light.svg`} alt="Home Logo" />
                        <h2>{c.home.name}</h2>
                      </div>
                      <div className='scoreSection'>
                        <h1 className='scoreText'>{c.home.score} - {c.away.score}</h1>
                        <p style={{ visibility: 'hidden' }}>hidden</p>
                      </div>
                      <div className='teamSection'>
                        <img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${c.away.abbrev}_light.svg`} alt="Home Logo" />
                        <h2>{c.away.name}</h2>
                      </div>
                    </div>
                </div>
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
        <div className='headerRow'>
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
        <div className='scoreRow'>
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
 * Constructs a table to provide a shots summary of the selected game.
 * @param {object} game represents a game, along with its data and shot data.
 * @returns table containing a tally of the shots, sorted by type, for each team.
 */
const GameStatistics = ({ game }) => {
  if (!game) { return <div><p>Loading!</p></div> }
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

  return (
    <div style={{color: 'white'}}>
      <SVGRink key={game.id} arr={shotsArr} />
      {/* <ShotMap key={game.id} arr={shotsArr} /> */}
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
  const [date, onChange] = useState(new Date(2026, 2, 10));  // using as a testing date.
  // const [value, onChange] = useState(new Date());

  return (
    <div style={{backgroundColor: "black"}}>
      <Calendar onChange={onChange} value={date} />
      <h1 className='dashboard'>{date.toLocaleDateString('en-ZA')} | Games</h1>
      <AllGames date={date} />
    </div>
  );
}

export default App;