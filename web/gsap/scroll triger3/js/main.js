gsap.registerPlugin(ScrollTrigger);

const blocks = gsap.utils.toArray('.screenBlock');

gsap.to(blocks, {
    xPercent: -100 * (blocks.length - 1),
    ease: "none",
    scrollTrigger: {
        trigger: '#rel',
        pin: true,
        scrub: 1,
        snap: 1 / (blocks.length - 1),
        end: () => "+=" + (window.innerWidth * (blocks.length - 1)),
    }
});