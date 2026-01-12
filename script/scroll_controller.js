/**
 * Scroll Controller Module
 */
(function() {
    /**
     * 'use strict' enables strict mode which helps catch common coding errors
     */
    'use strict';

    const scroller = scrollama();

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
            moveAnchorToViewport(window.innerWidth / 2, window.innerHeight / 2 +50 );
        }

        if (stepIndex === 2) {
            // show visual anchor at simulation 1 position
            canvasToViewport('choleraSim1', 0, 0);

            // enable follow mode for simulation 1
            window.followSimulation1 = true;     
            
            // sync visual anchor position with simulation 1
            window.syncVisualanchorWithSimulation1();

            // After transition completes, switch to follow mode and start syncing
            setTimeout(() => {
                window.setAnchorModeFollow();
            }, 1000); // Match this with CSS transition duration
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

        if (stepIndex > 2) {
            hideVisualAnchor();
        }
    }

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