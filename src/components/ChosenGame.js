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
      case 'PRE':
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
          {(c.periodType === 'OT' || c.periodType === 'SO') && (
            <>
              <span>•</span>
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

export default ChosenGame;