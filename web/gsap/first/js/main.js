for (let i = 0; i < 78; i++) {
    const block = document.createElement('div');
    block.classList.add('block');
    document.body.appendChild(block);

    const tl = gsap.timeline({ paused: true });

    tl.to(block, {
        scale: 0.1,
        yoyo: true,
        repeat: -1
    });

    block.addEventListener("mouseenter", () => tl.play());
    block.addEventListener("mouseleave", () => tl.reverse());
}





// let tl = gsap.timeline({paused: true});

// // start at exactly 1 second into the timeline (absolute)
// tl.to(".green", { x: 600, duration: 2 });

// // insert at the start of the previous animation
// tl.to(".purple", { x: 600, duration: 1 });

// // insert 1 second after the end of the timeline (a gap)
// tl.to(".orange", { x: 600, duration: 1 });


