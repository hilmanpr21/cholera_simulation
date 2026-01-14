/**
 * 
 */
const character_sprites = {
    normal: id => `assets/figure_${id + 1}_normal.PNG`,
    infected: id => `assets/figure_${id + 1}_infected.PNG`,
    vaccinated: id => `assets/figure_${id + 1}_vaccinated.PNG`,
    infected_vaccinated: id => `assets/figure_${id + 1}_infected_vaccinated.PNG`
};

/**
 * 
 */
const agentCharacterCOntroller = {

    characters: new Map(),
    activeSimkey: null,


    setSimulation(simKey) {
        this.activeSimkey = simKey;
    },

    sync() {
        if (!this.activeSimkey) return;

        const sim = window.simulations[]
    }
}