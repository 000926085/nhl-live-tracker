import React, {useState, useEffect} from 'react';

import SVGRink from './SVGRink.js';
import ToggleMenu from './toggles/ToggleMenu.js'

import { TEAM_COLOURS } from '../constants/colours.js';
import { filterShots } from '../utils/gameHelpers.js';

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

  const stats = [
    { label: 'Goals', key: 'goal' },
    { label: 'Shots-On-Goal', key: 'shot-on-goal' },
    { label: 'Blocked Shots', key: 'blocked-shot' },
    { label: 'Missed Shots', key: 'missed-shot' },
  ];

  // Handles setting a new roster once another game is selected.
  useEffect(() => {
    if (game?.id) {
      const newPlayers = [
        ...game.home.players.map(p => p.player),
        ...game.away.players.map(p => p.player)
      ];
      
      setFilters({
        shotType: ['goal', 'shot-on-goal', 'missed-shot', 'blocked-shot'],
        period: [1, 2, 3, 4], 
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
      // Select All
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

  const getOpponent = (teamAbbrev) => {
    return teamAbbrev === game.home.abbrev ? game.away.abbrev : game.home.abbrev;
  };

  const sorted = {
    [game.home.abbrev]: {},
    [game.away.abbrev]: {}
  };

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
  const getCount = (abbrev, type) => sorted[abbrev]?.[type] || 0;
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
        <div className='game-statistics-header' style={{ textAlign: 'center' }}>
          <h2 className='gameHeader'>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Shotmap</span>
            <i style={{ fontSize: '1.0rem' }}>
              Updated: {time}
            </i>
          </h2>
        </div>
        <div style={{textAlign: 'center'}}>
          <i>Data reflects plays made under the <b>{strength.toUpperCase()}</b> strength state.</i>
        </div>
        <div className='filter-row'>
          {Object.entries(dropdownOptions).map(([category, options]) => (
            <ToggleMenu key={category} category={category} options={options} selected={filters[category]} onToggle={(v) => toggleFilter(category, v)} />
          ))}
        </div>    
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

export default GameStatistics