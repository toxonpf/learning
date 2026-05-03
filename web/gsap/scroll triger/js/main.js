gsap.registerPlugin(ScrollTrigger);

gsap.to('#trigger', {
    duration: 10,
    scrollTrigger: {
        trigger: '#trigger',
        toggleActions: 'resume pause resume pause',
        start: 'top center',
        end:'bottom top',
        scrub: true,
        pin: true,
        markers: true,
    },

    x: 800,
});