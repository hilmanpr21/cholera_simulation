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

        console.log('entered step:', stepIndex);

        // remove active class from all slides
        document.querySelectorAll('.slide').forEach(slide => {
            slide.classList.remove('is-active');
        });

        // add active class to corresponding slide
        const currentSlide = document.querySelector(`.slide[data-slide="${stepIndex}"]`);
        if (currentSlide) {
            currentSlide.classList.add('is-active');
        }

        if (stepIndex < 1) {
            // hide visual anchor before slide 2
            hideVisualAnchor();
        }

        if (stepIndex === 1) {
            // show visual anchor at center of viewport
            showVisualAnchor();

            // call function to move visual anchor to specific position
            moveAnchorToViewport(window.innerWidth / 2, window.innerHeight / 2 );
        }

        if (stepIndex === 2) {
            moveAnchorToCanvas('choleraSim1', 0, 40);
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