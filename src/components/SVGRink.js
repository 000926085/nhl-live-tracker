import React, { useState, useEffect } from 'react';
import { TEAM_COLOURS } from '../constants/colours';

/**
 * Constructs a hockey rink and superimposes shots for a game using the data within Firebase.
 * @param {*} arr array containing the shots for the selected game. 
 * @param {String} gameid unique identifier for a game, used to locate the game within Firebase.
 * @param {Object} home contains the data belonging to the home team for this game.
 * @param {Object} away contains the data belonging to the away team for this game.
 * @param {String} strength representation of the strength state chosen by the user.
 * @returns  {JSX.Element} SVG representation of a hockey rink.
 */
const SVGRink = ( {arr, gameid, home, away, strength} ) => {
  const [selectedShot, setSelectedShot] = useState(null);
  const [infoPos, setInfoPos] = useState({ x: 0, y: 0 });

  const homeLogoUrl = `https://assets.nhle.com/logos/nhl/svg/${home.abbrev}_light.svg`;
  const awayLogoUrl = `https://assets.nhle.com/logos/nhl/svg/${away.abbrev}_light.svg`;

  // Handle displaying the info card when clicking on a shot.
  const handleClick = (e, shot) => {
    const rect = e.currentTarget.closest('svg').getBoundingClientRect();
    
    // Calculate position as a percentage (0 to 100)
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    setInfoPos({ x: xPercent, y: yPercent });
    setSelectedShot(shot);
  };

  // Deselect a shot if the strength state changes.
  useEffect(() => {
    setSelectedShot(null);
  }, [strength]);

  if (!arr) { return <div>Loading!</div> }

  return (
    <div style={{width: "95%", position: "relative"}}>
     {selectedShot && (
        <ShotDetails shot={selectedShot} pos={infoPos} onClose={() => setSelectedShot(null)} />
      )}
      
      <svg viewBox="-1 -1 202 87">
        <defs>
          <clipPath id="rinkClip">
            <rect x="-2" y="-2" width="204" height="89" rx="15" ry="15" />
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
    
            // Handle mirroring the shots during P2 and OT (P4).
            const displayCoords = s.period.number % 2 === 0 
              ? { x: s.coords.xCoord * -1, y: s.coords.yCoord * -1 }
              : { x: s.coords.xCoord, y: s.coords.yCoord };

            return (
              <Shot 
                key={`${gameid}-${id}-${s.typeDescKey}`} 
                shot={{ ...s, coords: { ...s.coords, xCoord: displayCoords.x, yCoord: displayCoords.y } }}
                selected={selectedShot?.id === s.id} 
                onClick={(e) => handleClick(e, s)} 
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
 * Constructs a interactable element that represents a hockey shot.
 * @param {Object} shot contains the data pertaining to a shot
 * @param {boolean} selected true if the id of the selected shot matches this shot 
 * @param {Function} onClick callback function triggered when this shot is clicked
 * @returns {JSX.Element} represents a shot made during this game
 */
const Shot = ( {shot, selected, onClick} ) => {
  // Pad the shot to prevent clipping.
  const pad = 2.5; 
  const x = Math.max(pad, Math.min(200 - pad, shot.coords.xCoord + 100));
  const y = Math.max(pad, Math.min(85 - pad, 42.5 - shot.coords.yCoord));

  // Define common properties for a shot. 
  const common = {
    key: shot.id,
    fill: TEAM_COLOURS[shot.eventOwnerTeam]?.primary ?? "#FFD700",
    fillOpacity: selected ? 1 : 0.75,
    stroke: selected ? 'rgba(235, 235, 235, 0.76)' : (TEAM_COLOURS[shot.eventOwnerTeam]?.primary ?? "#FFD700"),
    strokeWidth: 0.2,
    style: { cursor: "pointer" },
    onClick: (e) => onClick(e)
  }

  // Return the respective shape according to the type of shot.
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
        <rect {...common} x={x - s/2} y={y - s/2} height={s} width={s} rx="0.5" />
      )

    default:
      const [dx, dy] = [2.0, 2.0];
      return (
        <polygon {...common} points={`${x},${y - dy} ${x + dx},${y} ${x},${y + dy} ${x - dx},${y}`} />
      )
  }
}

/**
 * Constructs a menu to display the data of a hockey shot.
 * @param {Object} shot contains the data pertaining to a specific shot.
 * @param {dict} pos contains the x and y coordinates of where the menu should be placed.
 * @param {Function} onClose callback function triggered when the menu is closed. 
 * @returns {JSX.Element} menu containing data pertaining to a shot.
 */
const ShotDetails = ({ shot, pos, onClose }) => {
  const shotType = shot.typeDescKey.replace("-", " ").split(" ")[0];

  return (
    <div className="shot-details" style={{ left: `${pos.x}%`, top: `${pos.y}%`}}>
      {/* Team Logo Container */}
      <div>
        <img className='teamLogo' src={`https://assets.nhle.com/logos/nhl/svg/${shot.eventOwnerTeam}_light.svg`} alt="Team Logo" />
      </div>

      {/* Details Container */}
      <div style={{ color: 'white' }}>
        <p style={{fontWeight: 'bold'}}>{shot.eventOwnerTeam} {shotType}</p>
        <p>{shot.player.shootingPlayer}</p>
        <p>P{shot.period.number}, {shot.period.timeRemaining}</p>
      </div>
    </div>
  )
}

export default SVGRink;