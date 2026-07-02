/**
 * Mécanique de Roulette simple
 * @param {number} mise - Quantité de charbon misée
 * @param {number} nombreChoisi - Le nombre sur lequel on parie (0 à 36)
 */
function jouerRoulette(mise, nombreChoisi) {
    if (mise > gameState.coal) {
        console.log("Pas assez de charbon !");
        return;
    }

    // Retirer la mise
    gameState.coal -= mise;

    // Résultat aléatoire (0 à 36)
    const resultat = Math.floor(Math.random() * 37);

    if (resultat === nombreChoisi) {
        // Gain x35 si le numéro est trouvé
        gameState.coal += mise * 36;
        console.log(`Gagné ! La bille est tombée sur ${resultat}`);
    } else {
        console.log(`Perdu... La bille est tombée sur ${resultat}`);
    }
    
    updateUI();
    saveGame();
}
