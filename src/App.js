import React, {useState, useEffect} from 'react';
import { doc, collection, getDoc, getDocs } from "firebase/firestore";
import { database } from './config/firebase';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './index.css';
import './ddh.css';

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
    return {
      period: data.period?.number ?? '',
      timeRemaining: data.period?.timeRemaining ?? '',
      home: {
        name: data.teams?.home?.name ?? '',
        abbrev: data.teams?.home?.abbrev ?? '',
        score: data.teams?.home?.score ?? 0,
      },
      away: {
        name: data.teams?.away?.name ?? '',
        abbrev: data.teams?.away?.abbrev ?? '',
        score: data.teams?.away?.score ?? 0,
      }
    };
  };
  
  // Get the data for the selected game using the ID.
  const selectedData = games.find(g => g.id === selectedGame) ?? games[0];

  return (
    <div>
      <div className='container'>
        {games.map((g, i) => {
          const c = sanitize(g);
    
          return <div key={g.id} className='gameCard' style={ selectedGame == g.id ? {border: "2px solid #072c7e"} : {}} onClick={() => setSelected(g.id)}>
                    <div className='headerRow'>
                      <h2 className='gameHeader'>
                        <span className='highlight'>P{c.period}</span>{c.timeRemaining}
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
      <ChosenGame game={selectedData} />
      <StrengthToggle />
      <GameStatistics game={selectedData} />
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
              <span className='highlight'>P3</span>{game.gameData.period.timeRemaining}
            </h2>
        </div>

        {/* Teams and Score */}
        <div className='scoreRow'>
          <div className='teamSection'>
            <img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${game.gameData.teams.home.abbrev}_light.svg`} alt="Home Logo" />
            <h2>{game.gameData.teams.home.name}</h2>
          </div>
          
          <div className='scoreSection'>
            <h1 className='scoreText'>{game.gameData.teams.home.score} - {game.gameData.teams.away.score}</h1>
            <p style={{ visibility: 'hidden' }}>hidden</p>
          </div>

          <div className='teamSection'>
            <img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${game.gameData.teams.away.abbrev}_light.svg`} alt="Away Logo"/>
            <h2>{game.gameData.teams.away.name}</h2>
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
  const { shots: shotsArr } = game.shots;

  // Loop through the fetched shots and organize them by team, then type.
  const sorted = {};
  shotsArr.forEach((s) => {
    const team = s.eventOwnerTeam;
    const type = s.typeDescKey;

    // Create an empty object for a team if it doesn't exist.
    if (!sorted[team]) { sorted[team] = {}; }

    sorted[team][type] = (sorted[team][type] || 0) + 1;
  });

  // Get the amount of shots of a given type if it exists, 0 if it does not.
  const getCount = (abbrev, type) => sorted[abbrev]?.[type] || 0;

  return (
    <div style={{color: 'white'}}>
      {shotsArr.map((s, i) => {
        return <p key={i} style={{color: "white"}}>{s.eventOwnerTeam}, {s.typeDescKey}, {s.player.shootingPlayer}, P#{s.period.number}, {s.period.timeInPeriod}</p>
      })}
      <h2 className='dashboard'>Game Statistics | {game.gameData.lastUpdated}</h2>
      <table style={{border: '1px solid white', textAlign: 'center'}}>
        <thead>
          <tr>
            <th>{game.gameData.teams.home.abbrev}</th>
            <th></th>
            <th>{game.gameData.teams.away.abbrev}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${game.gameData.teams.home.abbrev}_light.svg`} alt="Home Logo"/></td>
            <td>{getCount(game.gameData.teams.home.abbrev, 'goal')} - {getCount(game.gameData.teams.away.abbrev, 'goal')}</td>
            <td><img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${game.gameData.teams.away.abbrev}_light.svg`} alt="Away Logo" /></td>
          </tr>
          <tr>
            <td>{getCount(game.gameData.teams.home.abbrev, 'shot-on-goal')}</td>
            <td>Shots-On-Goal</td>
            <td>{getCount(game.gameData.teams.away.abbrev, 'shot-on-goal')}</td>
          </tr>
          <tr>
            <td>{getCount(game.gameData.teams.home.abbrev, 'blocked-shot')}</td>
            <td>Blocked Shots</td>
            <td>{getCount(game.gameData.teams.away.abbrev, 'blocked-shot')}</td>
          </tr>
          <tr>
            <td>{getCount(game.gameData.teams.home.abbrev, 'missed-shot')}</td>
            <td>Missed Shots</td>
            <td>{getCount(game.gameData.teams.away.abbrev, 'missed-shot')}</td>
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