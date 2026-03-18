import React, {useState, useEffect} from 'react';
import { collection, getDocs } from "firebase/firestore";
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

const GameStatistics = ({ game, shots }) => {
  if (!game || !shots) {
    return <div><p>Loading!</p></div>
  }

  const { shots: shotsArr } = shots;

  const sorted = {};
  shotsArr.forEach((s) => {
    const team = s.eventOwnerTeam;
    const type = s.typeDescKey;

    if (!sorted[team]) {
      sorted[team] = {};
    }

    sorted[team][type] = (sorted[team][type] || 0) + 1;
  });

  const getCount = (abbrev, type) => sorted[abbrev]?.[type] || 0;

  return (
    <div style={{color: 'white'}}>
      {shotsArr.map((s, i) => {
        return <p key={i} style={{color: "white"}}>{s.eventOwnerTeam}, {s.typeDescKey}, {s.player.shootingPlayer}, P#{s.period.number}, {s.period.timeInPeriod}</p>
      })}
      <h2 className='dashboard'>Game Statistics | {game.lastUpdated}</h2>
      <table style={{border: '1px solid white', textAlign: 'center'}}>
        <thead>
          <tr>
            <th>{game.teams.home.abbrev}</th>
            <th></th>
            <th>{game.teams.away.abbrev}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${game.teams.home.abbrev}_light.svg`} alt="Home Logo"/></td>
            <td>{getCount(game.teams.home.abbrev, 'goal')} - {getCount(game.teams.away.abbrev, 'goal')}</td>
            <td><img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${game.teams.away.abbrev}_light.svg`} alt="Away Logo" /></td>
          </tr>
          <tr>
            <td>{getCount(game.teams.home.abbrev, 'shot-on-goal')}</td>
            <td>Shots-On-Goal</td>
            <td>{getCount(game.teams.away.abbrev, 'shot-on-goal')}</td>
          </tr>
          <tr>
            <td>{getCount(game.teams.home.abbrev, 'blocked-shot')}</td>
            <td>Blocked Shots</td>
            <td>{getCount(game.teams.away.abbrev, 'blocked-shot')}</td>
          </tr>
          <tr>
            <td>{getCount(game.teams.home.abbrev, 'missed-shot')}</td>
            <td>Missed Shots</td>
            <td>{getCount(game.teams.away.abbrev, 'missed-shot')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const SelectedGame = ({ game, shots }) => {
  if (!game || !shots) { return <div>Loading!</div> }

  return (
    <div className='selectedContainer'>
      <div className='selectedGame'>

        {/* Period/Time Remaining */}
        <div className='headerRow'>
            <h2 className='gameHeader'>
              <span className='highlight'>P3</span>{game.period.timeRemaining}
            </h2>
        </div>

        {/* Teams and Score */}
        <div className='scoreRow'>
          <div className='teamSection'>
            <img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${game.teams.home.abbrev}_light.svg`} alt="Home Logo" />
            <h2>{(game.teams.home.name).slice((game.teams.home.name).indexOf(' ')+1)}</h2>
          </div>
          
          <div className='scoreSection'>
            <h1 className='scoreText'>{game.teams.home.score} - {game.teams.away.score}</h1>
            <p style={{ visibility: 'hidden' }}>hidden</p>
          </div>

          <div className='teamSection'>
            <img className='logo' src={`https://assets.nhle.com/logos/nhl/svg/${game.teams.away.abbrev}_light.svg`} alt="Away Logo"/>
            <h2>{(game.teams.away.name).slice((game.teams.away.name).indexOf(' ')+1)}</h2>
          </div>
        </div>

      </div>
    </div>
  )
}

function GameState() {
  const [game, setGame] = useState(null);
  const [shots, setShots] = useState(null);

  useEffect(() => {
    const fetchData = async (date, id) => {
      const ref = collection(database, "Games", date, id);
      const snap = await getDocs(ref);

      snap.forEach((doc) => {
        doc.id === 'gameData' ? setGame(doc.data()) : setShots(doc.data())
      });
    };

    fetchData('2026-03-10', '2025021014');
  }, []);

  return (
    <div>
      <SelectedGame game={game} shots={shots} />
      <StrengthToggle />
      <GameStatistics game={game} shots={shots} />
    </div>
  );
}

function App({ pageId }) {
  const [value, onChange] = useState(new Date(2026, 1, 13));  // using as a testing date.
  // const [value, onChange] = useState(new Date());

  return (
    <div style={{backgroundColor: "black"}}>
      <Calendar onChange={onChange} value={value} />
      <h1 className='dashboard'>{value.toLocaleDateString('en-ZA')} | Games</h1>
      <GameState />
    </div>
  );
}

export default App;