/**
 * Scroll Controller Module
 */
(function() {
    /**
     * 'use strict' enables strict mode which helps catch common coding errors
     */
    'use strict';

    const scroller = scrollama();

    /**
     * 
     */
    const slideTosimulationMap = {
        2: 'sim1',
        3: 'sim1B',
        4: 'sim2',
        5: 'sim3',
        6: 'sim4'
    };

    /**
     * 
     * 
     */
    function handleStepEnter(response) {
        const stepIndex = response.index;

        const visualAnchor = document.getElementById('anchor-image');

        console.log('entered step:', stepIndex);

        // remove active class from all slides
        document.querySelectorAll('.slide').forEach(slide => {
            slide.classList.remove('is-active');
        });

        // add active class to corresponding slide
        const currentSlide = document.querySelector(`.slide[data-slide="${stepIndex}"]`);
        if (currentSlide) {
            currentSlide.classList.add('is-active');
            if (stepIndex === 0 || stepIndex === 8) {
                currentSlide.classList.add('is-center');
            }
        }

        if (stepIndex < 1) {
            // hide visual anchor before slide 2
            hideVisualAnchor();
        }

        if (stepIndex === 1) {
            // show visual anchor at center of viewport
            showVisualAnchor();

            // call function to move visual anchor to specific position
            moveAnchorToViewport(window.innerWidth / 2, window.innerHeight / 2 + 50 );
        }

        // stop following simulation 1 after slide 2
        if (stepIndex !== 2 && !window.sim1Agent?.isRunning()) {
            window.followSimulation1 = false;
            window.setAnchorModeSlide();
        }
        // resize the visual anchor after slide 1
        if (stepIndex > 1) {
            visualAnchor.style.width = '48px';
        } else {
            visualAnchor.style.width = '180px';
        }

        // setup visual anchor to follow simulation
        visualanchorFollowSimulationSetup(stepIndex);

        // setup character controller to follow simulation
        characterFollowSimulationSetup(stepIndex);
    }

    /**
     * function to setup visual anchor to follow simulation
     * @param {number} stepIndex - current step index   
     */
    function visualanchorFollowSimulationSetup(stepIndex) {
        
        // Hide Rafi after slide 6
        if (stepIndex > 6) {
            hideVisualAnchor();
            window.AnchorController.active = false;
            return;
        }

        // Show Rafi if returning to slides 1-6
        if (stepIndex >= 1) {
            showVisualAnchor();
        }

        // get simulation key from the mapping
        // store in string variable
        const simKey = slideTosimulationMap[stepIndex];

        // check if the simulation does not exist
        if (!simKey) {
            // no simulation to show for this slide
            window.AnchorController.active = false;     // deactivate anchor controller
            window.setAnchorModeSlide();                // set anchor to slide mode
        }

        // if simulation exists, activate anchor controller
        else {
            
            const sim = window.simulations?.[simKey];

            if (!sim) {
                console.warn('Simulation not found for step', stepIndex, simKey);
            };   // exit if simulation not found

            window.AnchorController.active = true;      // activate anchor controller
            window.AnchorController.canvasId = sim.canvasId;   // get the simulation canvas ID
            window.AnchorController.getAgentPosition = sim.getMainAgentPosition;   // get function to retrieve main agent position
            window.AnchorController.getAgentStatus = sim.getMainAgentStatus;       // get function to retrieve main agent status

            // After transition completes, switch to follow mode and start syncing
            setTimeout(() => {
                window.setAnchorModeFollow();
            }, 1000); // Match this with CSS transition duration
        }
    }

    function characterFollowSimulationSetup(stepIndex) {
        // store simulation slides in an array
        const agentSimSlides = [4, 5, 6]; // slides where characters are shown

        if (stepIndex < 4 || stepIndex > 6) {
            window.AgentCharacterController.active = false; // deactivate character controller
            hideAllAgentCharacters();
            window.setCharacterModeSlide(); // set to slide mode

        } else {    // activate character controller
            // get simulation key from the mapping
            const simKey = slideTosimulationMap[stepIndex];
            const sim = window.simulations?.[simKey];

            // if simulation found, activate character controller
            if (sim) {
                window.AgentCharacterController.active = true; // activate character controller
                window.AgentCharacterController.canvasId = sim.canvasId; // set canvas ID
                window.AgentCharacterController.simKey = simKey; // set simulation key

                // After transition completes, switch to follow mode and start syncing
                setTimeout(() => {
                    window.setCharacterModeFollow();
                }, 1000); // Match this with CSS transition duration

            }
        }
    }



    /**
     * Initialize the scroll controller
     */
    function init() {
        scroller
            .setup({
                step: '.step',
                offset: 0.4,        // trigger when step reaches middle of viewport
                progress: true      // track progress through each step
            })
            .onStepEnter(handleStepEnter);
    }

    // initialise after the DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // handle window resize events
    window.addEventListener('resize', () => {
        scroller.resize();
    });
})();