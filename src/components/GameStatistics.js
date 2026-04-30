import React, {useState, useEffect} from 'react';

import SVGRink from './SVGRink.js';
import ToggleMenu from './toggles/ToggleMenu.js'

import { TEAM_COLOURS } from '../constants/colours.js';
import { filterShots } from '../utils/gameHelpers.js';

/**
 * Constructs the rink and game statistics table for a given game.
 * @param {Object} game represents a game, along with its data and shot data.
 * @param {String} strength currently selected strength state.
 * @returns {JSX.Element} table containing a tally of the shots, sorted by type, for each team.
 */
const GameStatistics = ({ game, strength }) => {
  // Stores the currently selected filters.
  const [filters, setFilters] = useState({
    shotType: ['goal', 'shot-on-goal', 'missed-shot', 'blocked-shot'],
    period: [1, 2, 3],
    position: ["C", "D", "G", "L", "R"],
    players: []
  });

  // Labels and values for each dropdown menu.
  const dropdownOptions = {
    shotType: [
      { label: 'Goals', value: 'goal' },
      { label: 'Shots-On-Goal', value: 'shot-on-goal' },
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
      label: `${p.player} [${p.sweaterNumber}]`,
      value: p.player 
    }))
  }

  const maxPeriod = Math.max(...(game.shots?.shots.map(s => s.period?.number) || [3]));

  // Add the dropdown options for any periods past the initial three.
  if (maxPeriod >= 4) {
    for (let i = 4; i <= maxPeriod; i++) {
      const isSO = game.shots?.shots.find(s => s.period?.number === i)?.period?.periodType === 'SO';

      let label;
      if (isSO) { label = "SO"; }
      else if (i === 4) { label = "OT"; } 
      else { label = `${i - 3}OT`; }

      dropdownOptions["period"].push({ 
        label: label,
        value: i 
      });
    }
  }

  const stats = [
    { label: 'Goals', key: 'goal' },
    { label: 'Shots-On-Goal', key: 'shot-on-goal' },
    { label: 'Blocked Shots', key: 'blocked-shot' },
    { label: 'Missed Shots', key: 'missed-shot' },
    { label: 'Penalty Minutes', key: 'penaltyMinutes'},
    { label: 'PP Opportunities', key: 'opportunities'},
    { label: 'Success Rate', key: 'success'}
  ];

  // Handles setting a new roster once another game is selected.
  useEffect(() => {
    if (game?.id) {
      const newPlayers = [
        ...game.home.players.map(p => p.player),
        ...game.away.players.map(p => p.player)
      ];

      let defaultPeriods = [1, 2, 3];
      const existingPeriods = [...new Set(game.shots?.shots.map(s => s.period?.number))];
      existingPeriods.forEach(p => {
        if (p >= 4) {
          const isSO = game.shots?.shots.find(s => s.period?.number === p)?.period?.periodType === 'SO';
          if (!isSO) {
            defaultPeriods.push(p);
          }
        }
      });
      
      // Default filters upon selecting a game.
      setFilters({
        shotType: ['goal', 'shot-on-goal', 'missed-shot', 'blocked-shot'],
        period: [...new Set(defaultPeriods)],
        position: ["C", "D", "G", "L", "R"],
        players: newPlayers 
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.id]);

  if (!game) { return <div><p>Loading!</p></div> }

  // Helper function to generalize the toggling functionality for dropdown menus.
  const toggleFilter = (category, value) => {
    setFilters(prev => {
      // Select All.
      if (Array.isArray(value)) {
        return {
          ...prev,
          [category]: value
        };
      }

      // Single item toggles.
      const currentList = prev[category];
      const newList = currentList.includes(value)
        ? currentList.filter(v => v !== value)
        : [...currentList, value];

      return {
        ...prev,
        [category]: newList
      };
    });
  };

  const shotsArr = game.shots?.shots || [];
  const filteredShots = filterShots(shotsArr, strength, filters, game.home.abbrev);

  // Function for finding the abbreviation of the opposing team
  const getOpponent = (teamAbbrev) => {
    return teamAbbrev === game.home.abbrev ? game.away.abbrev : game.home.abbrev;
  };

  const sorted = {
    [game.home.abbrev]: {},
    [game.away.abbrev]: {}
  };

  // Required for unique shootout behavour.
  let shootout = false;
  let shootoutWinner = "";

  // Loop through the fetched shots and organize them by team, then type.
  filteredShots.forEach((s) => {
    let team = s.eventOwnerTeam;
    const type = s.typeDescKey;

    // Do not count shootout goals as goals.
    if (s.period?.periodType === 'SO') { 
      shootout = true;
      if (type === 'goal') {
        shootoutWinner = team;
      }
      return; 
    }

    // Blocked shots are attributed to the opposing team. 
    if (type === 'blocked-shot') {
      team = getOpponent(team);
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
  const getCount = (abbrev, type) => {
    // Check if we're looking for penaltyMinutes instead.
    if (type === 'penaltyMinutes') {
      return abbrev === game.home.abbrev 
        ? game.home.penaltyMinutes 
        : game.away.penaltyMinutes;
    }
    
    return sorted[abbrev]?.[type] || 0;
  };

  const statsLookup = stats.reduce((acc, stat) => {
    const pp_field = stat.key === 'opportunities' || stat.key === 'success';

    acc[stat.key] = {
      home: pp_field ? game.home.powerplays : getCount(game.home.abbrev, stat.key),
      away: pp_field ? game.away.powerplays : getCount(game.away.abbrev, stat.key)
    };
    return acc;
  }, {});

  const time = (() => {
    // Fallback for older implementation.
    if (game.lastUpdated.seconds) {
      return new Date(game.lastUpdated.seconds * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      });
    }

    const date = new Date(game.lastUpdated);
    return !isNaN(date) 
    ? date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      })
    : 'Invalid Date';
  })();

  // Common stylings.
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
        <div className='game-statistics-header' style={{ textAlign: 'center' }}>
          <h2 className='gameHeader'>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Shotmap</span>
            <i style={{ fontSize: '1.0rem' }}>
              Updated: {time}
            </i>
          </h2>
        </div>
        <div style={{textAlign: 'center', margin: '4px'}}>
          <i>Data reflects plays made under the <b>{strength.toUpperCase()}</b> strength state.</i>
        </div>

        {/* Filters */}
        <div className='filter-row'>
          {Object.entries(dropdownOptions).map(([category, options]) => (
            <ToggleMenu key={category} category={category} options={options} selected={filters[category]} onToggle={(v) => toggleFilter(category, v)} />
          ))}
        </div>

        {/* Legend to demonstrate the shot types. */}    
        <div className='legend'>
          <div className='legend-item'>
            <p style={{ margin: '0 8px 0 0' }}>Goal</p>
            <svg width="25" height="25" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
              <polygon {...common} points="50,-5 0,85 100,85" />
            </svg>
          </div>

          <div className='legend-item'>
            <p style={{ margin: '0 8px 0 0' }}>Shot-On-Goal</p>
            <svg width="25" height="25" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
              <circle {...common} cx={50} cy={50} r="40" />
            </svg>
          </div>

          <div className='legend-item'>
            <p style={{ margin: '0 8px 0 0' }}>Missed Shot</p>
            <svg width="25" height="25" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
              <rect {...common} x="10" y="10" width="80" height="80" rx="15" />
            </svg>
          </div>

          <div className='legend-item'>
            <p style={{ margin: '0 8px 0 0' }}>Blocked Shot</p>
            <svg width="25" height="25" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
              <polygon {...common} points="50,5 95,50 50,95 5,50" />
            </svg>
          </div>
        </div>

        {/* Hockey Rink */}
        <SVGRink key={game.id} arr={filteredShots} gameid={game.id} home={game.home} away={game.away} strength={strength} def={game.homeTeamDefendingSide} />
      </div>

      {/* Statistics Table */}
      <div className='game-statistics'>
        <div className='game-statistics-header' style={{ textAlign: 'center' }}>
          <h2 className='gameHeader'>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Game Statistics</span>
            <i style={{ fontSize: '1.0rem' }}>
              Updated: {time}
            </i>
          </h2>
        </div>
          <div style={{textAlign: 'center'}}>
            <i>Data reflects plays made under the <b>{strength.toUpperCase()}</b> strength state.</i>
          </div>

          <div className="stats-team-header">
            {/* Home Team */}
            <div className="stats-home">
              <img className='teamLogo' src={`https://assets.nhle.com/logos/nhl/svg/${game.home.abbrev}_light.svg`} alt="Home Logo" />
              <span className="team-abbrev">{game.home.abbrev}</span>
            </div>

            <div className="stats-vs-divider">VS.</div>

            {/* Away Team */}
            <div className="stats-away">
              <span className="team-abbrev">{game.away.abbrev}</span>
              <img className='teamLogo' src={`https://assets.nhle.com/logos/nhl/svg/${game.away.abbrev}_light.svg`} alt="Away Logo" />
            </div>
          </div>

          {/* Statistics Table */}
          {stats.map((stat) => {
            const data = statsLookup[stat.key];
            let homeVal, awayVal;
            const goalRow = stat.key === 'goal';
            const showSO = goalRow && sorted.isShootoutGame;

            // Perform calculations on powerplay related fields.
            if (stat.key === 'opportunities') {
              homeVal = `${data.home.goals} / ${data.home.opportunities}`;
              awayVal = `${data.away.goals} / ${data.away.opportunities}`;
            } else if (stat.key === 'success') {
              homeVal = `${((data.home.goals / data.home.opportunities) * 100 || 0).toFixed(1)}%`
              awayVal = `${((data.away.goals / data.away.opportunities) * 100 || 0).toFixed(1)}%`
            } else {
              homeVal = data.home;
              awayVal = data.away;
            }

            const homeStyles = {
              backgroundColor: homeVal > awayVal 
                ? (TEAM_COLOURS[game.home.abbrev]?.primary || '#707070') 
                : '#222',
              backgroundImage: homeVal > awayVal 
                ? 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0))' 
                : 'none',
              color: (['BOS', 'NSH', 'UTA'].includes(game.home.abbrev) && homeVal > awayVal) ? '#000' : '#FFF'
            };

            const awayStyles = {
              backgroundColor: awayVal > homeVal 
                ? (TEAM_COLOURS[game.away.abbrev]?.primary || '#707070') 
                : '#222',
              backgroundImage: awayVal > homeVal 
                ? 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0))' 
                : 'none',
              color: (['BOS', 'NSH', 'UTA'].includes(game.away.abbrev) && awayVal > homeVal) ? '#000' : '#FFF'
            };

            return (
              <div key={stat.key} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',  margin: '5px 0' }}>
                <div style={{ position: 'relative' }}>
                  {showSO && homeVal > awayVal && (
                    <span style={{ position: 'absolute', left: '-45px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.0rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>(SO)</span>
                  )}
                </div>
                <div className='stats-card' style={homeStyles}>
                  <p>{homeVal}</p>
                </div>
                <p className='stat-label'>{stat.label}</p>
                <div className='stats-card' style={awayStyles}>
                  <p>{awayVal}</p>
                </div>
                <div style={{ position: 'relative' }}>
                  {showSO && awayVal > homeVal && (
                    <span style={{ position: 'absolute', right: '-45px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.0rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>(SO)</span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  )
}

export default GameStatistics