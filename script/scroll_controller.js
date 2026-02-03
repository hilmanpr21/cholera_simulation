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
     * Define mapping from slide index to simulation key
     */
    const slideTosimulationMap = {
        2: 'sim1',          // simulation 1 - initial main agent movement
        3: 'sim1B',         // simulation 1B - initial water contamintation
        4: 'sim2',          // simulation 2 - Multiple neighbour simulation#
        5: 'sim4'           // simulation 4 - rapid testing simulation
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
            if (stepIndex === 0 || stepIndex === 7) {
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

        // update slide navigation visibility and state
        updateSlideNavigation(stepIndex);
    }

    /**
     * function to setup visual anchor to follow simulation
     * @param {number} stepIndex - current step index   
     */
    function visualanchorFollowSimulationSetup(stepIndex) {
        
        // Hide Rafi after slide 6
        if (stepIndex > 5) {
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
        // Clear any pending setTimeout from previous slides
        if (window.characterShowTimeout) {
            clearTimeout(window.characterShowTimeout);
        }
        
        // store simulation slides in an array
        const agentSimSlides = [4, 5]; // slides where characters are shown

        if (!agentSimSlides.includes(stepIndex)) { // deactivate character controller outside simulation slides
            window.AgentCharacterController.active = false; // deactivate character controller
            window.hideAllAgentCharacters();
            window.setCharacterModeSlide(); // set to slide mode
        } else {    // activate character controller
            // get simulation key from the mapping
            const simKey = slideTosimulationMap[stepIndex]; // look up the simulation key from the slidetoSimulationMap
            const sim = window.simulations?.[simKey];       // get simulation object from the global simulations

            // if simulation found, activate character controller
            if (sim && (simKey === 'sim2' || simKey === 'sim4')) {
                window.AgentCharacterController.active = true; // activate character controller
                window.AgentCharacterController.canvasId = sim.canvasId; // set canvas ID
                window.AgentCharacterController.simKey = simKey; // set simulation key from the global object that being used in character_controller.js

                // After transition completes, switch to follow mode and start syncing
                window.characterShowTimeout = setTimeout(() => {
                    window.setCharacterModeFollow();
                    window.showAllAgentCharacters(); // Add this to ensure characters are visible
                }, 1000); // Match this with CSS transition durations

            }
            else {
                window.AgentCharacterController.active = false; // deactivate character controller
                window.hideAllAgentCharacters();
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

    // slide navigation control
    const slideNavigation = document.querySelector('.slide-navigation');
    const slideCounter = document.querySelector('.slide-counter');
    const prevSlideButton = document.getElementById('previous-slide-button');
    const nextSlideButton = document.getElementById('next-slide-button');

    const totalSlides = document.querySelectorAll('.step').length;

    /**
     * update slide navigation bar 0visibilit and state
     */
    function updateSlideNavigation(currentSlide) {
        // show navigation bar only slide 0
        if (currentSlide === 0) {
            slideNavigation.classList.add('hidden');
        } else {
            // show slide navigation
            slideNavigation.classList.remove('hidden');

            // update slide counter
            slideCounter.textContent = `${currentSlide} / ${totalSlides - 1}`;

            // enable/disable prev button based on current position
            prevSlideButton.disabled = currentSlide === 0;
            nextSlideButton.disabled = currentSlide === 7;
        }
    }

    /**
     * Navigate to a specific slide programatically
     * @param {number} slideIndex - index of the slide to navigate to
     */
    function navigateToSlide(targetSlide) {
        // Ensure target is within a valid range
        if (targetSlide < 0 || targetSlide > totalSlides - 1) return;

        // calculate scroll position for the target slide
        const stepElements = document.querySelectorAll('.step');
        if (stepElements[targetSlide]) {
            stepElements[targetSlide].scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    // evenet listeners for navigation buttons
    prevSlideButton.addEventListener('click', () => {
        const currentSlide = parseInt(slideCounter.textContent.split('/')[0]);
        navigateToSlide(currentSlide - 1);
    });

    nextSlideButton.addEventListener('click', () => {
        const currentSlide = parseInt(slideCounter.textContent.split('/')[0]);
        navigateToSlide(currentSlide + 1);
    });


    // handle window resize events
    window.addEventListener('resize', () => {
        scroller.resize();
    });
})();