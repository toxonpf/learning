gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

let clamp = gsap.utils.clamp(-360, 360);
let rotateSetter = gsap.quickTo('#forth', 'rotation');

let smoother = ScrollSmoother.create({
    wrapper: '#smoohWrapper',
    content: '#smoohContent',
    effects: true,

    onUpdate: (self) => {
        rotateSetter(clamp(self.getVelocity()));
    }
});

smoother.effects('.anim', {
    speed: 0.5,
    lag: (i) => i * 1
});

smoother.effects('.imgBlock img', {
    speed: 'auto',
});

const myButton = document.querySelector('#myButton');

myButton.addEventListener('click', (e) => {
    gsap.to(smoother, {
        scrollTop: smoother.offset('#sec', 'center center'),
        duration: 2,
        ease: 'back.out',
    });
});

gsap.to('#thrd', {
    scrollTrigger: {
        trigger: '#thrd',
        start: 'center center',
        scrub: 1,
        markers: true
    },
    rotate: 360
});

