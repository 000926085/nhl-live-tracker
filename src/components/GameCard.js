/**
 * Helper function to that dictates the header contents of a game card. 
 * @param {Object} game contains the data pertaining to a game.
 * @returns {JSX.Element} span containing the appropriate header text for a game card.
 */
export const gameStatus = (game) => {
    // Use the gameState to determine the header text.
    switch (game.gameState) {
        case 'FUT':
        case 'PRE':
        return (
            <span className='highlight'>
                {new Date(game.startTimeUTC).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short' 
                })}
            </span>
        );

        case 'LIVE':
        case 'CRIT':
        return <>
                <span className='highlight'>
                        {game.period <= 3 ? `P${game.period}` : 'OT'}
                    </span>
                    {" "}
                    <span>
                        {game.inIntermission 
                            ? 'END' 
                            : game.timeRemaining
                        }
                    </span>
                </>
                
        case 'FINAL':
        case 'OFF':
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>FINAL</span>
                {(game.periodType === 'OT' || game.periodType === 'SO') && (
                    <><span className="highlight">• {game.periodType}</span></>
                )}
            </span>
        );

        default: return <span></span>;
    }
};

/**
 * Constructs a card representation of a game that displays period information and the score.
 * @param {Object} game contains the data pertaining to a game.
 * @param {boolean} selected determines the card border colour.
 * @param {Function} onSelect callback for determining which card was selected.
 * @returns {JSX.Element} card with data pertaining to a game.
 */
const GameCard = ({ game, selected, onSelect }) => {
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
  );
};

export default GameCard;