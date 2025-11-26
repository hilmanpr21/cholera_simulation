/**
 * Scroll Controller Module
 */
(function() {
    /**
     * 'use strict' enables strict mode which helps catch common coding errors
     */
    'use strict';

    /**
     * Initialize scroll controller on window load
     */
    window.addEventListener('load', () => {
        
        /**
         * Check if GSAP and ScrollTrigger are loaded
         */
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.error('GSAP or ScrollTrigger is not loaded.');
            // Stop further execution if dependencies are missing
            return;
        }
        
        /**
         * Register ScrollTrigger plugin with GSAP
         */
        gsap.registerPlugin(ScrollTrigger);

        /**
         * get element references
         */
        const mainTitle = document.getElementById('main-title');
        const subtitle = document.getElementById('landing-subtitle');
        const introTitle = document.getElementById('landing-subtitle-2');
        const scrollPrompt = document.getElementById('scroll-prompt');
        const anchorOverlay = document.getElementById('svg-anchor-agent-overlay');
        const anchorAgent = document.getElementById('anchor-agent');

        // verify elements exist
        if (!mainTitle || !subtitle || !introTitle || !scrollPrompt || !anchorOverlay || !anchorAgent) {
            console.error('One or more required elements are missing in the DOM.');
            console.error('Required elements not found!');
            console.log('mainTitle:', mainTitle);
            console.log('subtitle:', subtitle);
            console.log('introTitle:', introTitle);
            console.log('scrollPrompt:', scrollPrompt);
            console.log('anchorOverlay:', anchorOverlay);
            console.log('anchorAgent:', anchorAgent);
            return
        }

        /**
         * show landing subtitle 2 on scroll 
         * initially hidden in (opacity: 0) CSS
         */
        introTitle.style.display = 'block';         // make sure it's block to occupy space

        /**
         * GSAP ScrollTrigger animation timeline
         * triggered by scrolling in the landing intro section
         */
        const landingTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: '#landing-intro-section', // trigger element
                start: 'top top',       // when the top of the trigger hits the top of the viewport
                end: '+=40',       // scroll distance of 50% of the viewport height
                scrub: 0.5,               // smooth scrubbing
                markers: true,          // set to true for debugging
                onUpdate: (self) => {
                    // console.log('Scroll progress:', self.progress.toFixed(2));

                    // Make title sticky when animation starts
                    if (self.progress > 0.1) {
                        mainTitle.classList.add('sticky');
                    } else {
                        mainTitle.classList.remove('sticky');
                    }
                }
            }
        });

        /**
         * Animation Sequence
        */
       

        // 2. Fade out subtitle (0-30% of scroll)
        landingTimeline.to(subtitle, {
            opacity: 0,
            y: -50,
            duration: 0.3,
            ease: 'power2.out'
        }, 0);

        // 3. Fade out scroll prompt (0-25% of scroll)
        landingTimeline.to(scrollPrompt, {
            opacity: 0,
            duration: 0.25,
            ease: 'power2.out'
        }, 0);

        // 4. Fade in intro title (30-70% of scroll)
        landingTimeline.to(introTitle, {
            opacity: 1,
            y: 0,                       // Move to natural position
            duration: 0.4,
            ease: 'power2.out'
        }, 0.3);

        // 5. Show overlay and fade in anchor agent (40-80% of scroll)
        landingTimeline.to(anchorOverlay, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out'
        }, 0.4);

        landingTimeline.to(anchorAgent, {
            opacity: 1,
            scale: 3,
            duration: 0.4,
            ease: 'steps(10)'
        }, 0.4);


        // Handle window resize
        window.addEventListener('resize', () => {
            ScrollTrigger.refresh();
        });

    });
})();