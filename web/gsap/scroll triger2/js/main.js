gsap.registerPlugin(ScrollTrigger);

gsap.utils.toArray('.screenBlock').forEach(el => {
    ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        pin: true,
        markers: true,
    });
});

