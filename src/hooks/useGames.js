import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { database } from '../config/firebase.js';

/**
 * Fetches and begins listening to each game for a given date.
 * @param {Object} date date and time provided by the calendar.
 * @returns {Array} array of games found within Firebase for the provided date.
 */
export const useGames = (date) => {
    const [games, setGames] = useState(null);

    useEffect(() => {
        if (!date) { return; }
        setGames(null);
        
        // Find the document for the provided date.
        const formattedDate = date.toLocaleDateString('en-ZA').replaceAll("/", "-");
        const dateRef = doc(database, "Games", formattedDate);

        let gameUnsubs = [];
        const cleanupListeners = () => {
            gameUnsubs.forEach(unsub => unsub());
            gameUnsubs = [];
        }

        const unsubscribeDate = onSnapshot(dateRef, (snap) => {
            // If there is a document for the date, continue.
            if (snap.exists() && snap.data().games) {
            const ids = snap.data().games;
            cleanupListeners();

            ids.forEach((id) => {
                const gameRef = collection(database, "Games", formattedDate, String(id));

                // Listen to each individual game.
                const unsubGame = onSnapshot(gameRef, (gameSnap) => {
                let gameDetails = { id };
                gameSnap.forEach(doc => {
                    gameDetails[doc.id] = doc.data();
                });

                // Update said game in state.
                setGames((prevGames) => {
                    if (!prevGames) return [gameDetails];
                    const i = prevGames.findIndex(g => g.id === id);
                    if (i > -1) {
                    const newGames = [...prevGames];
                    newGames[i] = gameDetails;
                    return newGames;
                    }
                    return [...prevGames, gameDetails];
                });
                });

                gameUnsubs.push(unsubGame);
            })
            } 
            
            // If not, no games must exist for that date.
            else {
                cleanupListeners();
                setGames([]);
            }
        }, (err) => console.error("Fetch failed: ", err));

        // Cleanup main listener for when the date changes.
        return () => {
            unsubscribeDate();
            cleanupListeners();
        };
    }, [date]);

    return games;
}