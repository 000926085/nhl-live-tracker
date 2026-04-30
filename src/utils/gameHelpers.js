/**
 * Cleans the raw data from Firebase and assigns default values if found to be missing.
 * @param {Object} game raw game data fetched from Firebase. 
 * @returns {Object} contains the data after accounting for missing fields.
 */
export const sanitize = (game) => {
    const data = game?.gameData || {};
    const shots = game?.shots || {};
    const g_id = game?.id || "";

    return {
        id: g_id,
        gameDate: data.gameDate ?? '',
        period: data.period?.number ?? '',
        periodType: data.period?.periodType ?? '',
        timeRemaining: data.period?.timeRemaining ?? '',
        inIntermission: data.period?.inIntermission ?? '',
        lastUpdated: data.lastUpdated ?? '',
        gameState: data.gameState ?? '',
        scheduled: data.scheduled ?? '',
        startTimeUTC: data.startTimeUTC ?? '',
        isShootoutGame: '',
        homeTeamDefendingSide: data.homeTeamDefendingSide ?? '',
        home: {
            name: data.teams?.home?.name ?? '',
            abbrev: data.teams?.home?.abbrev ?? '',
            score: data.teams?.home?.score ?? 0,
            penaltyMinutes: data.teams?.home?.penaltyMinutes ?? 0,
            players: data.teams?.home?.players ?? [],
            powerplays: data.teams?.home?.powerplays ?? {}
        },
        away: {
            name: data.teams?.away?.name ?? '',
            abbrev: data.teams?.away?.abbrev ?? '',
            score: data.teams?.away?.score ?? 0,
            penaltyMinutes: data.teams?.away?.penaltyMinutes ?? 0,
            players: data.teams?.away?.players ?? [],
            powerplays: data.teams?.away?.powerplays ?? {}
        },
        shots: shots
    };
};

/**
 * Filters a list of shots based on strength state and specific game categories.
 * @param {Array} shots raw array of shot data.
 * @param {String} strength strength state selected.
 * @param {Object} categories the filter choices.
 * @returns {Array} the shots containing the shots after filtering.
 */
export const filterShots = (shots, strength, categories, home) => {
    if (!shots) return [];

    return shots.filter(s => {
        // Handle strength state.
        if (strength === 'EV' && s.strengthState !== 'EVEN') return false;
        if (strength === 'ALL w/o ENG') {
            const opponentNetEmpty = (s.eventOwnerTeam === home) 
                ? s.strengthState?.includes("AWAY NET EMPTY") || s.strengthState?.includes("AWAY EMPTY NET")
                : s.strengthState?.includes("HOME NET EMPTY") || s.strengthState?.includes("HOME EMPTY NET");

            if (opponentNetEmpty && s.typeDescKey === 'goal') {
                return false;
            }
        }

        // Handle shotmap filters.
        const typeMatch = categories.shotType.includes(s.typeDescKey);
        const periodMatch = categories.period.includes(s.period.number);
        const positionMatch = categories.position.includes(s.player?.position);
        const playerMatch = categories.players.includes(s.player?.shootingPlayer);
        return typeMatch && periodMatch && positionMatch && playerMatch;
    });
};