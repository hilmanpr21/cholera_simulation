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
        5: 'sim4',           // simulation 4 - rapid testing simulation
        6: 'sim5'
    };

    /**
     * track which overlays should be shown for each simulation
     * @type {Object.<string, boolean>}
     */
    const overlayStates = {
        'sim2-game-over-overlay': false,
        'sim4-game-over-overlay': false,
        'sim5-game-over-overlay': false
    };

    /** 
     * global function to store overlay state whn it's shown
     * Called by simulation modules when game over occurs
     * @param {string} overlayId - ID of the overlay element to show
     */
    window.storeOverlayState = function(overlayId) {
        overlayStates[overlayId] = true;
        console.log(`Overlay state updated: ${overlayId} set to true`);
    };

    /** 
     * Global function to clear game over overlay state when restarting simulation
     * called when user click "try again" button
     * @param {string} overlayId - ID of the overlay element to clear
     */
    window.clearOverlayState = function(overlayId) {
        overlayStates[overlayId] = false;
        console.log(`Overlay state updated: ${overlayId} set to false`);
    };

    /**
     * Track the Curren Slide index to contorol auto advance from slide 0 to slide 1, and prevent multiple triggers
     */
    let currentSlideIndex = 0;
    let canAutoAdvance = true;

    /**
     * Function to handle step enter events
     * @param {Object} response - response object from scrollama
     */
    function handleStepEnter(response) {
        const stepIndex = response.index;

        // Update current slide tracker
        currentSlideIndex = stepIndex;
        canAutoAdvance = true; // Reset on each slide change

        const visualAnchor = document.getElementById('anchor-image');

        console.log('entered step:', stepIndex);

        // Hide all game over overlays when changing slides
        hideGameOverOverlays();

        // Then restore overlay for current slide if it was previously shown
        restoreOverlayForCurrentSlide(stepIndex);

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
     * Hide all game over overlays
     */
    function hideGameOverOverlays() {
        const overlays = [
            'sim2-game-over-overlay',
            'sim4-game-over-overlay',
            'sim5-game-over-overlay'
        ]; 

        overlays.forEach(overlayId => {
            const overlay = document.getElementById(overlayId);
            
            // check if overlay exists and is currently shown
            if (overlay && overlay.classList.contains('show')) {
                // hide overlay
                overlay.classList.remove('show');

                // clear inline styles
                overlay.style.top = '';
                overlay.style.left = '';
                overlay.style.width = '';
                overlay.style.height = '';
            }
        });
    }

    /**
     * function to restore overlay for current slide if it previously shown
     * @param {number} stepIndex - current step index
     */
    function restoreOverlayForCurrentSlide(stepIndex) {
        // store simulation key from the mapping
        const simKey = slideTosimulationMap[stepIndex]; // will return 'sim2, 'sim4', 'sim5' etc

        if (!simKey) return; // exit if no simulation for this slide

        // map simulation key to overlay ID
        const overlayMap = {
            'sim2': 'sim2-game-over-overlay',
            'sim4': 'sim4-game-over-overlay',
            'sim5': 'sim5-game-over-overlay'
        };

        // store overlay ID from the mapping
        const overlayId = overlayMap[simKey];

        // if the overlay whas previously shown, show it agein
        // overlayStates[overlayId] is true means game overlay was shown
        if (overlayId && overlayStates[overlayId]) {
            setTimeout(() => {
                //store simulation object
                const sim = window.simulations?.[simKey]; 
                if (sim && sim.showGameOverOverlay) {
                    // calling simulation method to show game over overlay
                    sim.showGameOverOverlay();
                }
            }, 100);
        }
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
                offset: 0.5,        // trigger when step reaches 70% from top of viewport
                progress: true      // track progress through each step
            })
            .onStepEnter(handleStepEnter);
    }

    /**
     * Initialize when DOM content is loaded, or immediately if already loaded (e.g. from cache)
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /**
     * Listener to detect scroll down on slide 0 to auto advance to slide 1, only trigger when user scroll down (e.deltaY > 0) and prevent multiple triggers with canAutoAdvance flag
     */
    window.addEventListener('wheel', (e) => {
        // check if the user is on the first slide, can auto advance, and scrolls down ( e.deltaY > 0 means scrolling down)
        if (currentSlideIndex === 0 && canAutoAdvance && e.deltaY > 0) {
            // User scrolled down on slide 0
            canAutoAdvance = false; // Prevent multiple triggers
            const stepElements = document.querySelectorAll('.step');
            if (stepElements[1]) {
                stepElements[1].scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }, { passive: true });          // With passive: true, the browser can scroll immediately without waiting the code to finish before scrolling, make the scrollig more responsif

    /**
     * Listen for touch events (mobile) to detect swipe up on slide 0
     */
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;         // Record where finger touched (Y position)
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (currentSlideIndex !== 0 || !canAutoAdvance) return;

        const touchEndY = e.changedTouches[0].clientY;          // Record where finger lifted (Y position)
        const swipeDistance = touchStartY - touchEndY;          // Calculate the distance swiped

        // If swiped up (positive distance) more than 50px
        if (swipeDistance > 50) {
            canAutoAdvance = false;                             // Prevent multiple triggers
            const stepElements = document.querySelectorAll('.step');
            if (stepElements[1]) {
                stepElements[1].scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }   
    }, { passive: true });

    /**
     * Event listener to amke the swipe indicator as a button so make the user can click
     */
    const swipeUpIndicator = document.getElementById('swipe-up-indicator');
    swipeUpIndicator.addEventListener('click', () => {
        if (currentSlideIndex === 0 && canAutoAdvance) {
            canAutoAdvance = false; // Prevent multiple triggers
            const stepElements = document.querySelectorAll('.step');
            if (stepElements[1]) {
                stepElements[1].scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });

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